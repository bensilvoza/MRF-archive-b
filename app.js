//REQUIRE
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var session = require('express-session');
var nodemailer = require('nodemailer');
var app = express();

//
var iid = require('./helpers').iid;
var hashing = require('./helpers').hashing;

//USE
app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(
	session({
		secret: 'secret',
		resave: false,
		saveUninitialized: false,
	})
);

//DATABASE
mongoose.connect('mongodb://localhost/mrfDB', { useNewUrlParser: true, useUnifiedTopology: true });

//notes for database
//embedding data - inserting entire content
//referencing data - inserting id only, but that id is somehow consist of entire content

//VARIABLES

//Register
var registerSchema = new mongoose.Schema({ email: String, password: String });
var Register = mongoose.model('Register', registerSchema);

//Official
//very first time save all official users
//official short for official users
var officialSchema = new mongoose.Schema({
	ID: String,
	Email: String,
	'Requestor role': String,
	'Bu role': String,
	'Hr role': String,
	'Ceo role': String,
	'Bu lead name': String,
	'Bu / ssu': String,
	'Section department': String,
	'Bu lead email': String,
	'Hr email': String,
	'Ceo email': String,
	'Requestor email': String,
});
var Official = mongoose.model('Official', officialSchema);

//Requests
var requestsSchema = new mongoose.Schema({
	ID: String,
	'Bu Lead Name': String,
	'Bu / ssu': String,
	'Section Department': String,
	'Position Title': String,
	'Place of Assignment': String,
	'Tools Needed': String,
	'Breif Description of The Job': String,
	'Educational Degree': String,
	'Specific Characteristic': String,
	'Type of Employment': String,
	'Type of Request': String,
	Remarks: String,
	'Bu Approval': String,
	'Hr Approval': String,
	'Ceo Approval': String,
	'Email of The Requestor': String,
	'Email of The Bu': String,
	'Date Requested': String,

	'Bu Approval': String,
	'Hr Approval': String,
	'Ceo Approval': String,
});
var Requests = mongoose.model('Requests', requestsSchema);

//HELPER VARIABLES
//...

//================================
//ROUTES
//root
app.get('/', function (req, res) {
    
	res.render('landing');
});

//login
app.get('/login', function (req, res) {
	
	// Under development mode...
	//if they are done logged in they can now redirect
	if (req.session.requestorOpen === true) {
		return res.redirect('/requestor-create');
	}

	if (req.session.buOpen === true) {
		return res.redirect('/bu-all');
	}

	if (req.session.hrOpen === true) {
		return res.redirect('/hr-all');
	}

	if (req.session.ceoOpen === true) {
		return res.redirect('/ceo-all');
	}
	// Under development mode...

	//Session for incorrect credentials
	if (req.session.incorrectCredentialsFaker === true) {
		req.session.incorrectCredentials = true;
	} else {
		req.session.incorrectCredentials = false;
	}

	//Update the session, target the faker
	req.session.incorrectCredentialsFaker = undefined;

	res.render('login', { incorrectCredentials: req.session.incorrectCredentials });

	//Below res.render("some file") req.session.something will not work
	//...
});

//login
//Nested in login page
//Administrator section
app.post('/administrator', function (req, res) {
	var key = 'hijocorporationzxcbnm@';

	if (req.body.key === key) {
		req.session.officialOpen = true;
		res.redirect('/official');
	} else {
		console.log('Incorrect key');
		res.redirect('back');
	}
});

app.post('/login', function (req, res) {
	//login data
	var loginInput = {
		email: req.body.email,
		password: hashing(req.body.password),
	};

	//check if any of login fields is empty
	var empty = '';
	if (loginInput['email'] === empty || req.body.password === empty) {
		//Update the session, target the faker
		req.session.incorrectCredentialsFaker = true;

		return res.redirect('back');
	}

	//Check if email and password is found on database
	var emailPassword = false;

	//Save current user role
	var currentUserRole = undefined;

	//Check this database if user is present...
	//Callback 1
	Register.find({}, function (error, registers) {
		//If there's potential error
		if (error) return res.send('Something went wrong');

		for (var i = 0; i < registers.length; i++) {
			//Email
			if (registers[i]['email'] === loginInput['email']) {
				//Password
				if (registers[i]['password'] === loginInput['password']) {
					emailPassword = true;

					//Stop the loop because user is now granted
					break;
				}
			}
		}

		//If user is not present on the database stop the operation
		if (emailPassword === false) {
			//Update, target the faker
			req.session.incorrectCredentialsFaker = true;
			return res.redirect('back');
		}
		//Last line callback 1

		//Now pull up his/her role
		//Callback 2
		Official.find({}, function (error, roles) {
			//If there's potential error
			if (error) return res.send('Something went wrong');

			for (var i = 0; i < roles.length; i++) {
				//  login data              Access data
				if (loginInput['email'] === roles[i]['Email']) {
					//finding his/her role
					if (roles[i]['Requestor role'] === 'true') currentUserRole = 'requestor-create';
					if (roles[i]['Bu role'] === 'true') currentUserRole = 'bu-all';
					if (roles[i]['Hr role'] === 'true') currentUserRole = 'hr-all';
					if (roles[i]['Ceo role'] === 'true') currentUserRole = 'ceo-all';
				}

				//If role is now have value break the loop
				if (currentUserRole !== undefined) break;
			}

			//add email in the session
			req.session.email = loginInput['email'];

			//Add role open to the session
			if (currentUserRole === 'requestor-create') req.session.requestorOpen = true;
			if (currentUserRole === 'bu-all') req.session.buOpen = true;
			if (currentUserRole === 'hr-all') req.session.hrOpen = true;
			if (currentUserRole === 'ceo-all') req.session.ceoOpen = true;

			//Go to the designated role
			return res.redirect('/' + currentUserRole);
		});
		//Last line callback 2
	});
	//End of callback 1
});

//The very first time save all official users
app.get('/official', function (req, res) {
	//Go to session and check if you are authorize to enter
	if (req.session.officialOpen === true) res.render('official');
	else res.send('Unathorized access');
});

app.post('/official', function (req, res) {
	//Role data
	var roleInput = {
		id: iid(),
		email: req.body.email,
		requestorRole: req.body.requestorRole,
		buRole: req.body.buRole,
		hrRole: req.body.hrRole,
		ceoRole: req.body.ceoRole,
		buLeadName: req.body.buLeadName,
		buSsu: req.body.buSsu,
		sectionDepartment: req.body.sectionDepartment,
		buLeadEmail: req.body.buLeadEmail,
		hrEmail: req.body.hrEmail,
		ceoEmail: req.body.ceoEmail,
		requestorEmail: req.body.requestorEmail,
	};

	var roleInputSubmit = new Official({
		ID: roleInput['id'],
		Email: roleInput['email'],
		'Requestor role': roleInput['requestorRole'],
		'Bu role': roleInput['buRole'],
		'Hr role': roleInput['hrRole'],
		'Ceo role': roleInput['ceoRole'],
		'Bu lead name': roleInput['buLeadName'],
		'Bu / ssu': roleInput['buSsu'],
		'Section department': roleInput['sectionDepartment'],
		'Bu lead email': roleInput['buLeadEmail'],
		'Hr email': roleInput['hrEmail'],
		'Ceo email': roleInput['ceoEmail'],
		'Requestor email': roleInput['requestorEmail'],
	});

	//save
	roleInputSubmit.save(function (error) {
		//If there's potential error
		if (error) return res.send('Something went wrong');
		else {
			res.redirect('/official-submitted');
		}
	});
});

//access submitted
app.get('/official-submitted', function (req, res) {
	res.render('official-submitted');
});

//register
app.get('/register', function (req, res) {
	//Session for account successfully created
	//Faker or helper is just the same
	if (req.session.accountHelper === true) {
		req.session.account = true;
	} else {
		req.session.account = false;
	}
	//Update the session, target the helper
	req.session.accountHelper = undefined;

	//spacing ...

	//Session for incorrect details
	if (req.session.incorrectDetailsFaker === true) {
		req.session.incorrectDetails = true;
	} else {
		req.session.incorrectDetails = false;
	}
	//Update the session, target the faker
	req.session.incorrectDetailsFaker = undefined;

	//spacing ...

	//Session for weak password
	if (req.session.weakPasswordFaker === true) {
		req.session.weakPassword = true;
	} else {
		req.session.weakPassword = false;
	}
	//Update the session, target the faker
	req.session.weakPasswordFaker = undefined;

	//spacing ...

	res.render('register', {
		incorrectDetails: req.session.incorrectDetails,
		account: req.session.account,
		weakPassword: req.session.weakPassword,
	});
});

app.post('/register', function (req, res) {
	//Check if the inputed email is found on save all users database
	//Callback 1
	Official.find({}, function (error, roles) {
		//If there's potential error
		if (error) return res.send('Something went wrong');

		var email = undefined;
		for (var i = 0; i < roles.length; i++) {
			if (roles[i]['Email'] === req.body.email) {
				email = true;
				break;
			}
		}

		//If email is not present on the database stop or return now
		if (email === undefined) {
			req.session.incorrectDetailsFaker = true;
			return res.redirect('back');
		}

		//Check if password or confirm password field is empty
		if (req.body.password === '' || req.body.confirmPassword === '') {
			req.session.incorrectDetailsFaker = true;
			return res.redirect('back');
		}

		//Stop or return if password and confirmPassword input is not the same
		if (req.body.password !== req.body.confirmPassword) {
			req.session.incorrectDetailsFaker = true;
			return res.redirect('back');
		}

		//Check if password field is atleast 6 characters long
		//This is okay if only the password field is check
		//because it alreaddy pass the password and confirmPassword input
		if (req.body.password.length < 6) {
			req.session.weakPasswordFaker = true;
			return res.redirect('back');
		}

		var registerInput = {
			email: req.body.email,
			password: hashing(req.body.password),
		};

		var submit = new Register({
			email: registerInput['email'],
			password: registerInput['password'],
		});

		submit.save(function (error) {
			//If there's potential error
			if (error) return res.send('Something went wrong');

			req.session.accountHelper = true;
			res.redirect('back');
		});
	});
	//End of callback 1
});

//================================================
//requestor
app.get('/requestor-create', function (req, res) {
	//Go to session and check if authorize to enter
	if (req.session.requestorOpen === undefined) return res.send('Unathorized access');

	var requestorData = undefined;

	//Session for empty fields
	if (req.session.emptyFieldsFaker === true) {
		req.session.emptyFields = true;
	} else {
		req.session.emptyFields = false;
	}

	//Update the session, target the faker
	req.session.emptyFieldsFaker = undefined;

	//pull up data from access database with the email he/she provided
	//to know what role he/she in company
	//Callback 1
	Official.find({}, function (err, roles) {
		for (var role of roles) {
			if (role['Email'] === req.session.email) {
				requestorData = role;
				break;
			}
		}

		res.render('requestor-create', {
			requestorData: requestorData,
			emptyFields: req.session.emptyFields,
		});
	});
	//End of callback 1
});

app.post('/requestor-create', function (req, res) {
	var requiredFields = false;

	//requestor input
	var requestorInput = {
		buLeadName: req.body.buLeadName,
		buSsu: req.body.buSsu,
		sectionDepartment: req.body.sectionDepartment,
		positionTitle: req.body.positionTitle,
		placeAssignment: req.body.placeAssignment,
		tools: req.body.tools,
		descriptionJob: req.body.descriptionJob,
		educationalDegree: req.body.educationalDegree,
		specificCharacteristic: req.body.specificCharacteristic,
		typeEmployment: req.body.typeEmployment,
		typeRequest: req.body.typeRequest,
		remarks: req.body.remarks,
	};

	//all fields are required (except remarks)
	var empty = '';
	if (req.body.buLeadName === empty) {
		req.session.emptyFieldsFaker = true;
		return res.redirect('back');
	}
	if (req.body.buSsu === empty) {
		req.session.emptyFieldsFaker = true;
		return res.redirect('back');
	}
	if (req.body.sectionDepartment === empty) {
		req.session.emptyFieldsFaker = true;
		return res.redirect('back');
	}
	if (req.body.positionTitle === empty) {
		req.session.emptyFieldsFaker = true;
		return res.redirect('back');
	}
	if (req.body.placeAssignment === 'Choose place of assignment...') {
		req.session.emptyFieldsFaker = true;
		return res.redirect('back');
	}
	if (req.body.tools === 'Choose the tools needed...') {
		req.session.emptyFieldsFaker = true;
		return res.redirect('back');
	}
	if (req.body.descriptionJob === empty) {
		req.session.emptyFieldsFaker = true;
		return res.redirect('back');
	}
	if (req.body.educationalDegree === empty) {
		req.session.emptyFieldsFaker = true;
		return res.redirect('back');
	}
	if (req.body.specificCharacteristic === empty) {
		req.session.emptyFieldsFaker = true;
		return res.redirect('back');
	}
	if (req.body.typeEmployment === 'Choose type of employment...') {
		req.session.emptyFieldsFaker = true;
		return res.redirect('back');
	}
	if (req.body.typeRequest === 'Choose type of request...') {
		req.session.emptyFieldsFaker = true;
		return res.redirect('back');
	}

	//pull up from Official database
	//Callback 1
	Official.find({}, function (err, roles) {
		for (var role of roles) {
			if (role['Email'] === req.session.email)
				req.session.emailofTheBu = role['Bu lead email'];
		}

		//pull up date now
		var currentDate = new Date();
		var month = currentDate.getMonth() + 1;
		var day = currentDate.getDate();
		var year = currentDate.getFullYear();

		var months = [
			'January',
			'February',
			'March',
			'April',
			'May',
			'June',
			'July',
			'August',
			'September',
			'October',
			'November',
			'December',
		];

		var date = months[month - 1] + ' ' + day + ', ' + year;

		//ID
		var generateID = iid();

		//requestor input submit
		var requestorInputSubmit = new Requests({
			ID: generateID,
			'Bu Lead Name': requestorInput['buLeadName'],
			'Bu / ssu': requestorInput['buSsu'],
			'Section Department': requestorInput['sectionDepartment'],
			'Position Title': requestorInput['positionTitle'],
			'Place of Assignment': requestorInput['placeAssignment'],
			'Tools Needed': requestorInput['tools'],
			'Breif Description of The Job': requestorInput['descriptionJob'],
			'Educational Degree': requestorInput['educationalDegree'],
			'Specific Characteristic': requestorInput['specificCharacteristic'],
			'Type of Employment': requestorInput['typeEmployment'],
			'Type of Request': requestorInput['typeRequest'],
			Remarks: requestorInput['remarks'],

			'Email of The Requestor': req.session.email,
			'Email of The Bu': req.session.emailofTheBu,
			'Date Requested': date,
			'Bu Approval': '',
			'Hr Approval': '',
			'Ceo Approval': '',
		});

		//Callback 2
		requestorInputSubmit.save(function (error) {
			//If there's potential error
			if (error) return res.send('Something went wrong');

			// nodemailer
			// nodemailer starts here
			var controlNumber = generateID;
			var url = 'https://mrf-ixndk.run-us-west2.goorm.io/bu-id/' + controlNumber;

			var transporter = nodemailer.createTransport({
				service: 'gmail',
				auth: {
					user: 'companynodemailer@gmail.com',
					pass: 'CUtEQ_2%c]]=Tw-',
				},
			});

			var mailOptions = {
				from: '"Manpower Requisition Form" <companynodemailer@gmail.com>',
				to: req.session.emailofTheBu,
				subject: 'Waiting for response',
				html:
					'<p>Manpower request is waiting for response, <br> Control number: ' +
					controlNumber +
					' <br><br><br> Visit the link <a href=' +
					url +
					'>here</a> </p>',
			};

			//Callback 3
			transporter.sendMail(mailOptions, function (error, info) {
				//If there's potential error
				if (error) return res.send('Something went wrong');

				console.log('Email sent: ' + info.response);

				res.redirect('/requestor-submitted');
			});
			// End of nodemailer
			// End of callback 3
		});
		//End of callback 2
	});
	//End of callback 1
});

//request successfully submitted
app.get('/requestor-submitted', function (req, res) {
	res.render('requestor-submitted');
});

//All request, requestor side
app.get('/requestor-all', function (req, res) {
	//Go to session and check if authorize to enter
	if (req.session.requestorOpen === undefined) return res.send('Unathorized access');

	//pull up all data associated with this email, from Requests database
	var requestorDataAll = [];

	//Callback 1
	Requests.find({}, function (error, getRequests) {
		//If there's potential error
		if (error) return res.send('Something went wrong');

		for (var getRequest of getRequests) {
			if (getRequest['Email of The Requestor'] === req.session.email) {
				requestorDataAll.push(getRequest);
			}
		}

		res.render('requestor-all', { requestorDataAll: requestorDataAll.reverse() });
	});
	//End of callback 1
});

//requestor-s-pending
app.get('/requestor-s-pending', function (req, res) {
	//pull up all data associated with this email, from Requests database
	var requestorDataAll = [];

	//Callback 1
	Requests.find({}, function (error, getRequests) {
		//If there's potential error
		if (error) return res.send('Something went wrong');

		for (var getRequest of getRequests) {
			if (getRequest['Email of The Requestor'] === req.session.email) {
				if (getRequest['Ceo Approval'] === '') {
					requestorDataAll.push(getRequest);
				}
			}
		}

		res.render('requestor-all', { requestorDataAll: requestorDataAll.reverse() });
	});
	//End of callback 1
});

//requestor-s-approved
app.get('/requestor-s-approved', function (req, res) {
	//pull up all data associated with this email, from Requests database
	var requestorDataAll = [];

	//Callback 1
	Requests.find({}, function (error, getRequests) {
		//If there's potential error
		if (error) return res.send('Something went wrong');

		for (var getRequest of getRequests) {
			if (getRequest['Email of The Requestor'] === req.session.email) {
				if (getRequest['Ceo Approval'] === 'Approve') {
					requestorDataAll.push(getRequest);
				}
			}
		}

		res.render('requestor-all', { requestorDataAll: requestorDataAll.reverse() });
	});
	//End of callback 1
});

//requestor-s-declined
app.get('/requestor-s-declined', function (req, res) {
	//pull up all data associated with this email, from Requests database
	var requestorDataAll = [];

	//Callback 1
	Requests.find({}, function (error, getRequests) {
		//If there's potential error
		if (error) return res.send('Something went wrong');

		for (var getRequest of getRequests) {
			if (getRequest['Email of The Requestor'] === req.session.email) {
				if (getRequest['Ceo Approval'] === 'Decline') {
					requestorDataAll.push(getRequest);
				}
			}
		}

		res.render('requestor-all', { requestorDataAll: requestorDataAll.reverse() });
	});
	//End of callback 1
});

//Search, requestor side
app.get('/requestor-search/', function (req, res) {
	var searchID = undefined;

	//Find the single request from the keyword provided
	Requests.find({}, function (error, allRequest) {
		//If there's potential error
		if (error) return res.send('Something went wrong');

		//Accept ID
		for (var oneRequest of allRequest) {
			if (req.query.searchID === oneRequest['ID']) {
				searchID = oneRequest['ID'];
				break;
			}
		}

		if (searchID === undefined) return res.redirect('back');

		res.redirect('/requestor-id/' + searchID);
	});
});

//Show one request, requestor side
app.get('/requestor-id/:id', function (req, res) {
	
	//Go to session and check if authorize to enter
	if (req.session.requestorOpen === undefined) return res.redirect('/');

	var sendOneRequest = undefined;
	var paramsUrl = req.params.id;

	//pull up data from Requests database from the ID he/she provided
	//Callback 1
	Requests.findOne({ ID: paramsUrl }, function (error, oneRequest) {
		//If there's potential error
		if (error) return res.send('Something went wrong');

		sendOneRequest = oneRequest;

		//If nothing is found
		if (sendOneRequest === undefined) {
			return res.redirect('back');
		}

		res.render('requestor-id', { sendOneRequest: sendOneRequest });
	});
	//End of callback 1
});

//Delete, requestor side
app.delete('/requestor-delete/:id', function (req, res) {
	//Check
	if (req.body.requestorDelete !== 'DELETE') return res.redirect('back');

	var paramsUrl = req.params.id;

	Requests.findOneAndRemove({ ID: paramsUrl }, function (error) {
		//If there's potential error
		if (error) return res.redirect('back');

		res.redirect('/requestor-delete');
	});
});

//
app.get('/requestor-delete', function (req, res) {
	res.render('requestor-delete');
});

// LOG OUT, requestor
app.get ("/requestor-logout", function (req, res){
	
	//update session
	req.session.requestorOpen = undefined
	
	res.redirect("/login")
})



//======================================
//Bu
//bu-all
app.get('/bu-all', function (req, res) {
	//Go to session and check if authorize to enter
	if (req.session.buOpen === undefined) return res.send('Unathorized access');

	var sendManyRequest = [];

	//Find all the request, Bu side
	//Callback 1
	Requests.find({}, function (error, allRequest) {
		//If there's potential error
		if (error) return res.send('Something went wrong');

		for (var oneRequest of allRequest) {
			if (req.session.email === oneRequest['Email of The Bu']) {
				sendManyRequest.push(oneRequest);
			}
		}

		res.render('bu-all', { sendManyRequest: sendManyRequest.reverse() });
	});
	//End of callback 1
});

//bu-s-pending
app.get('/bu-s-pending', function (req, res) {
	var sendManyRequest = [];

	//Find all the request, Bu side
	//Callback 1
	Requests.find({}, function (error, allRequest) {
		//If there's potential error
		if (error) return res.send('Something went wrong');

		for (var oneRequest of allRequest) {
			if (req.session.email === oneRequest['Email of The Bu']) {
				if (oneRequest['Bu Approval'] === '') {
					sendManyRequest.push(oneRequest);
				}
			}
		}

		res.render('bu-all', { sendManyRequest: sendManyRequest.reverse() });
	});
	//End of callback 1
});

//bu-s-approved
app.get('/bu-s-approved', function (req, res) {
	var sendManyRequest = [];

	//Find all the request, Bu side
	//Callback 1
	Requests.find({}, function (error, allRequest) {
		//If there's potential error
		if (error) return res.send('Something went wrong');

		for (var oneRequest of allRequest) {
			if (req.session.email === oneRequest['Email of The Bu']) {
				if (oneRequest['Bu Approval'] === 'Approve') {
					sendManyRequest.push(oneRequest);
				}
			}
		}

		res.render('bu-all', { sendManyRequest: sendManyRequest.reverse() });
	});
	//End of callback 1
});

//bu-s-declined
app.get('/bu-s-declined', function (req, res) {
	var sendManyRequest = [];

	//Find all the request, Bu side
	//Callback 1
	Requests.find({}, function (error, allRequest) {
		//If there's potential error
		if (error) return res.send('Something went wrong');

		for (var oneRequest of allRequest) {
			if (req.session.email === oneRequest['Email of The Bu']) {
				if (oneRequest['Bu Approval'] === 'Decline') {
					sendManyRequest.push(oneRequest);
				}
			}
		}

		res.render('bu-all', { sendManyRequest: sendManyRequest.reverse() });
	});
	//End of callback 1
});

//Search, bu side
app.get('/bu-search/', function (req, res) {
	var searchID = undefined;

	//Find the single request from the keyword provided
	Requests.find({}, function (error, allRequest) {
		//If there's potential error
		if (error) return res.send('Something went wrong');

		//Accept ID
		for (var oneRequest of allRequest) {
			if (req.query.searchID === oneRequest['ID']) {
				searchID = oneRequest['ID'];
				break;
			}
		}

		if (searchID === undefined) return res.redirect('back');

		res.redirect('/bu-id/' + searchID);
	});
});

//Show one request, Bu side
//bu-id
app.get('/bu-id/:id', function (req, res) {
	
	//Go to session and check if authorize to enter
	if (req.session.buOpen === undefined) return res.redirect('/');

	var sendOneRequest = undefined;
	var paramsUrl = req.params.id;

	//pull up data from Requests database from the ID he/she provided
	Requests.findOne({ ID: paramsUrl }, function (error, oneRequest) {
		//If there's potential error
		if (error) return res.send('Something went wrong');

		sendOneRequest = oneRequest;

		//If nothing found
		if (sendOneRequest === undefined) return res.redirect('back');

		res.render('bu-id', { sendOneRequest: sendOneRequest });
	});
});

//Bu
//Update
app.put('/bu-id/:id', function (req, res) {
	var paramsUrl = req.params.id;

	//Pull up requestor email, if request is declined
	var requestorEmailDeclined = undefined;

	//Callback 1
	Requests.findOne({ ID: paramsUrl }, function (error, oneRequest) {
		//If there's potential error
		if (error) {
			console.log(error);
			return res.redirect('back');
		}

		//Pull up and save email of the requestor
		requestorEmailDeclined = oneRequest['Email of The Requestor'];

		oneRequest['Bu Approval'] = req.body.buApproval;

		//Callback 2
		Requests.findOneAndUpdate({ ID: paramsUrl }, oneRequest, function (error, oneRequest) {
			//If there's potential error
			if (error) {
				console.log(error);
				return res.redirect('back');
			}

			//Pull up the emails of the hr
			//Callback 3
			Official.find({}, function (error, officialUsers) {
				var hrEmails = [];

				for (var officialUser of officialUsers) {
					if (officialUser['Hr role'] === 'true') {
						hrEmails.push(officialUser['Email']);
					}
				}

				// nodemailer starts here
				var controlNumber = paramsUrl;
				var url = undefined
				
				if (req.body.buApproval === "Approve"){
					url = 'https://mrf-ixndk.run-us-west2.goorm.io/hr-id/' + controlNumber;
				} else {
					url = 'https://mrf-ixndk.run-us-west2.goorm.io/requestor-id/' + controlNumber;
				}
				
				

				var transporter = nodemailer.createTransport({
					service: 'gmail',
					auth: {
						user: 'companynodemailer@gmail.com',
						pass: 'CUtEQ_2%c]]=Tw-',
					},
				});

				//If Bu approval is declined
				if (req.body.buApproval === 'Decline') {
					var mailOptions = {
						from: '"Manpower Requisition Form" <companynodemailer@gmail.com>',
						to: requestorEmailDeclined,
						subject: 'REQUEST DECLINED',
						html:
							'<p>Manpower request is declined, <br> Control number: ' +
							controlNumber +
							' <br><br><br> Visit the link <a href=' +
							url +
							'>here</a> </p>',
					};

					transporter.sendMail(mailOptions, function (error, info) {
						if (error) return res.send('Something went wrong');

						console.log('Email sent: ' + info.response);

						res.redirect('/bu-responded');
					});
				} else {
					//If Bu approval is approved
					var mailOptions = {
						from: '"Manpower Requisition Form" <companynodemailer@gmail.com>',
						to: hrEmails,
						subject: 'Waiting for response',
						//text: 'Mrf control number: 123456'
						html:
							'<p>Manpower request is waiting for response, <br> Control number: ' +
							controlNumber +
							' <br><br><br> Visit the link <a href=' +
							url +
							'>here</a> </p>',
					};

					transporter.sendMail(mailOptions, function (error, info) {
						//If there's potential error
						if (error) return res.send('Something went wrong');

						console.log('Email sent: ' + info.response);

						res.redirect('/bu-responded');
					});
				}
			});
			// End of callback 3
		});
		//End of callback 2
	});
	//End of callback 1
});

//bu-request-responded
app.get('/bu-responded', function (req, res) {
	res.render('bu-responded');
});

// LOG OUT, bu
app.get ("/bu-logout", function (req, res){
	
	//update session
	req.session.buOpen = undefined
	
	res.redirect("/login")
})




//======================================
//Hr
//All request, Hr side
app.get('/hr-all', function (req, res) {
	//Go to session and check if authorize to enter
	if (req.session.hrOpen === undefined) return res.send('Unathorized access');

	var hrRequests = [];

	//Callback 1
	Requests.find({}, function (error, allRequest) {
		//If there's potential error
		if (error) return res.send('Something went wrong');

		for (var oneRequest of allRequest) {
			if (oneRequest['Bu Approval'] === 'Approve') {
				hrRequests.push(oneRequest);
			}
		}

		//Update
		allRequest = hrRequests;

		res.render('hr-all', { allRequest: allRequest.reverse() });
	});
});

//hr-s-pending
app.get('/hr-s-pending', function (req, res) {
	var hrRequests = [];

	//Callback 1
	Requests.find({}, function (error, allRequest) {
		//If there's potential error
		if (error) return res.send('Something went wrong');

		for (var oneRequest of allRequest) {
			if (oneRequest['Bu Approval'] === 'Approve') {
				if (oneRequest['Hr Approval'] === '') {
					hrRequests.push(oneRequest);
				}
			}
		}

		//Update
		allRequest = hrRequests;

		res.render('hr-all', { allRequest: allRequest.reverse() });
	});
});

//hr-s-approved
app.get('/hr-s-approved', function (req, res) {
	var hrRequests = [];

	//Callback 1
	Requests.find({}, function (error, allRequest) {
		//If there's potential error
		if (error) return res.send('Something went wrong');

		for (var oneRequest of allRequest) {
			if (oneRequest['Bu Approval'] === 'Approve') {
				if (oneRequest['Hr Approval'] === 'Approve') {
					hrRequests.push(oneRequest);
				}
			}
		}

		//Update
		allRequest = hrRequests;

		res.render('hr-all', { allRequest: allRequest.reverse() });
	});
});

//hr-s-declined
app.get('/hr-s-declined', function (req, res) {
	var hrRequests = [];

	//Callback 1
	Requests.find({}, function (error, allRequest) {
		//If there's potential error
		if (error) return res.send('Something went wrong');

		for (var oneRequest of allRequest) {
			if (oneRequest['Bu Approval'] === 'Approve') {
				if (oneRequest['Hr Approval'] === 'Decline') {
					hrRequests.push(oneRequest);
				}
			}
		}

		//Update
		allRequest = hrRequests;

		res.render('hr-all', { allRequest: allRequest.reverse() });
	});
});

//Search, hr side
app.get('/hr-search/', function (req, res) {
	var searchID = undefined;

	//Find the single request from the keyword provided
	Requests.find({}, function (error, allRequest) {
		//If there's potential error
		if (error) return res.send('Something went wrong');

		//Accept ID
		for (var oneRequest of allRequest) {
			if (req.query.searchID === oneRequest['ID']) {
				searchID = oneRequest['ID'];
				break;
			}
		}

		if (searchID === undefined) return res.redirect('back');

		res.redirect('/hr-id/' + searchID);
	});
});

//show one request, hr side
app.get('/hr-id/:id', function (req, res) {
	
	//Go to session and check if authorize to enter
	if (req.session.hrOpen === undefined) return res.redirect('/');

	var paramsUrl = req.params.id;

	//
	Requests.findOne({ ID: paramsUrl }, function (error, oneRequest) {
		//If there's potential error
		if (error) return res.send('Something went wrong');

		res.render('hr-id', { oneRequest: oneRequest });
	});
});

//Hr
//Update
app.put('/hr-id/:id', function (req, res) {
	var paramsUrl = req.params.id;

	//Pull up the email of requestor and bu, declined purposes
	var requestorEmailDeclined = undefined;
	var buEmailDeclined = undefined;

	//Callback 1
	Requests.findOne({ ID: paramsUrl }, function (error, oneRequest) {
		//save the email of requestor and bu, declined purposes
		requestorEmailDeclined = oneRequest['Email of The Requestor'];
		buEmailDeclined = oneRequest['Email of The Bu'];

		oneRequest['Hr Approval'] = req.body.hrApproval;

		//Update the selected request
		//Callback 2
		Requests.findOneAndUpdate({ ID: paramsUrl }, oneRequest, function (error) {
			//If there's potential error
			if (error) return res.send('Something went wrong');

			//Pull up the email of the ceo
			//Callback 3
			Official.findOne({ 'Ceo role': 'true' }, function (error, oneRequest) {
				//If there's potential error
				if (error) return res.send('Something went wrong');

				var ceoEmail = oneRequest['Email'];

				// nodemailer starts here
				var controlNumber = paramsUrl;
				var url = undefined
				
				if (req.body.hrApproval === "Approve"){
					url = 'https://mrf-ixndk.run-us-west2.goorm.io/ceo-id/' + controlNumber;
				} else {
					url = 'https://mrf-ixndk.run-us-west2.goorm.io/';
				}
				
				

				var transporter = nodemailer.createTransport({
					service: 'gmail',
					auth: {
						user: 'companynodemailer@gmail.com',
						pass: 'CUtEQ_2%c]]=Tw-',
					},
				});

				//If hr approval is declined
				if (req.body.hrApproval === 'Decline') {
					var declinedEmails = [];
					declinedEmails.push(requestorEmailDeclined);
					declinedEmails.push(buEmailDeclined);

					var mailOptions = {
						from: '"Manpower Requisition Form" <companynodemailer@gmail.com>',
						to: declinedEmails,
						subject: 'REQUEST DECLINED',
						html:
							'<p>Manpower request is declined, <br> Control number: ' +
							controlNumber +
							' <br><br><br> Visit the link <a href=' +
							url +
							'>here</a> </p>',
					};

					transporter.sendMail(mailOptions, function (error, info) {
						if (error) return res.send('Something went wrong');

						console.log('Email sent: ' + info.response);

						res.redirect('/hr-responded');
					});
				} else {
					//If hr approval is approved
					var mailOptions = {
						from: '"Manpower Requisition Form" <companynodemailer@gmail.com>',
						to: ceoEmail,
						subject: 'Waiting for response',
						html:
							'<p>Manpower request is waiting for response, <br> Control number: ' +
							controlNumber +
							' <br><br><br> Visit the link <a href=' +
							url +
							'>here</a> </p>',
					};

					transporter.sendMail(mailOptions, function (error, info) {
						if (error) return res.send('Something went wrong');

						console.log('Email sent: ' + info.response);

						res.redirect('/hr-responded');
					});
				}
			});
			// End of callback 3
		});
		// End of callback 2
	});
});

//Hr
//Request Succesfully Responded
app.get('/hr-responded', function (req, res) {
	res.render('hr-responded');
});

// LOG OUT, hr
app.get ("/hr-logout", function (req, res){
	
	//update session
	req.session.hrOpen = undefined
	
	res.redirect("/login")
})




//======================================
//Ceo
//All request, ceo side
app.get('/ceo-all', function (req, res) {
	//Go to session and check if authorize to enter
	if (req.session.ceoOpen === undefined) return res.send('Unathorized access');

	//Callback 1
	Requests.find({}, function (error, allRequest) {
		//
		var ceoRequests = [];

		//If there's potential error
		if (error) return res.send('Something went wrong');

		for (var oneRequest of allRequest) {
			if (oneRequest['Hr Approval'] === 'Approve') {
				ceoRequests.push(oneRequest);
			}
		}

		//Update
		allRequest = ceoRequests;

		res.render('ceo-all', { allRequest: allRequest.reverse() });
	});
	//End of callback 1
});

//ceo-s-pending
app.get('/ceo-s-pending', function (req, res) {
	//Callback 1
	Requests.find({}, function (error, allRequest) {
		//
		var ceoRequests = [];

		//If there's potential error
		if (error) return res.send('Something went wrong');

		for (var oneRequest of allRequest) {
			if (oneRequest['Hr Approval'] === 'Approve') {
				if (oneRequest['Ceo Approval'] === '') {
					ceoRequests.push(oneRequest);
				}
			}
		}

		//Update
		allRequest = ceoRequests;

		res.render('ceo-all', { allRequest: allRequest.reverse() });
	});
	//End of callback 1
});

//ceo-s-approved
app.get('/ceo-s-approved', function (req, res) {
	//Callback 1
	Requests.find({}, function (error, allRequest) {
		//
		var ceoRequests = [];

		//If there's potential error
		if (error) return res.send('Something went wrong');

		for (var oneRequest of allRequest) {
			if (oneRequest['Hr Approval'] === 'Approve') {
				if (oneRequest['Ceo Approval'] === 'Approve') {
					ceoRequests.push(oneRequest);
				}
			}
		}

		//Update
		allRequest = ceoRequests;

		res.render('ceo-all', { allRequest: allRequest.reverse() });
	});
	//End of callback 1
});

//ceo-s-declined
app.get('/ceo-s-declined', function (req, res) {
	//Callback 1
	Requests.find({}, function (error, allRequest) {
		//
		var ceoRequests = [];

		//If there's potential error
		if (error) return res.send('Something went wrong');

		for (var oneRequest of allRequest) {
			if (oneRequest['Hr Approval'] === 'Approve') {
				if (oneRequest['Ceo Approval'] === 'Decline') {
					ceoRequests.push(oneRequest);
				}
			}
		}

		//Update
		allRequest = ceoRequests;

		res.render('ceo-all', { allRequest: allRequest.reverse() });
	});
	//End of callback 1
});

//Search, ceo side
app.get('/ceo-search/', function (req, res) {
	var searchID = undefined;

	//Find the single request from the keyword provided
	Requests.find({}, function (error, allRequest) {
		//If there's potential error
		if (error) return res.send('Something went wrong');

		//Accept ID
		for (var oneRequest of allRequest) {
			if (req.query.searchID === oneRequest['ID']) {
				searchID = oneRequest['ID'];
				break;
			}
		}

		if (searchID === undefined) return res.redirect('back');

		res.redirect('/ceo-id/' + searchID);
	});
});

//show
app.get('/ceo-id/:id', function (req, res) {
	
	//Go to session and check if authorize to enter
	if (req.session.ceoOpen === undefined) return res.redirect('/');

	var paramsUrl = req.params.id;

	//
	Requests.findOne({ ID: paramsUrl }, function (error, oneRequest) {
		//If there's potential error
		if (error) return res.send('Something went wrong');

		res.render('ceo-id', { oneRequest: oneRequest });
	});
});

//
//Update
app.put('/ceo-id/:id', function (req, res) {
	var paramsUrl = req.params.id;

	//Temporary save the oneRequest data to pull up requestor and bu email
	var requestorEmail = undefined;
	var buEmail = undefined;

	//Callback 1
	Requests.findOne({ ID: paramsUrl }, function (error, oneRequest) {
		//requestorEmail, buEmail
		requestorEmail = oneRequest['Email of The Requestor'];
		buEmail = oneRequest['Email of The Bu'];

		//Update from approval
		oneRequest['Ceo Approval'] = req.body.ceoApproval;

		//Callback 2
		Requests.findOneAndUpdate({ ID: paramsUrl }, oneRequest, function (error) {
			//If there's potential error
			if (error) return res.send('Something went wrong');

			//Pull hr emails
			//Callback 3
			Official.find({}, function (error, officialUsers) {
				var hrEmails = [];

				for (var officialUser of officialUsers) {
					if (officialUser['Hr role'] === 'true') {
						hrEmails.push(officialUser['Email']);
					}
				}

				//Add all receiving email
				hrEmails.push(requestorEmail);
				hrEmails.push(buEmail);

				var receivingEmails = hrEmails;

				//Email subject, email body
				var eSubject = undefined;
				var eBody = undefined;

				if (req.body.ceoApproval === 'Approve') {
					eSubject = 'REQUEST APPROVED';
					eBody = 'approved';
				} else {
					eSubject = 'REQUEST DECLINED';
					eBody = 'declined';
				}

				// nodemailer starts here
				var controlNumber = paramsUrl;
				var url = 'https://mrf-ixndk.run-us-west2.goorm.io/';

				var transporter = nodemailer.createTransport({
					service: 'gmail',
					auth: {
						user: 'companynodemailer@gmail.com',
						pass: 'CUtEQ_2%c]]=Tw-',
					},
				});

				var mailOptions = {
					from: '"Manpower Requisition Form" <companynodemailer@gmail.com>',
					to: receivingEmails,
					subject: eSubject,
					html:
						'<p>Manpower request is ' +
						eBody +
						', <br> Control number: ' +
						controlNumber +
						' <br><br><br> Visit the link <a href=' +
						url +
						'>here</a> </p>',
				};

				transporter.sendMail(mailOptions, function (error, info) {
					//If there's potential error
					if (error) return res.send('Something went wrong');

					console.log('Email sent: ' + info.response);

					res.redirect('/ceo-responded');
				});
				// End of nodemailer
			});
			// End of callback 3
		});
		//End of callback 2
	});
});

//Succesfully Responded
app.get('/ceo-responded', function (req, res) {
	res.render('ceo-responded');
});

// LOG OUT, ceo
app.get ("/ceo-logout", function (req, res){
	
	//update session
	req.session.ceoOpen = undefined
	
	res.redirect("/login")
})




//app.listen
//process.env.PORT, process.env.IP
app.listen(process.env.PORT || 3000, process.env.IP, function () {
	console.log('Server is running.');
	console.log('.');
	console.log('.');
	console.log('.');
});