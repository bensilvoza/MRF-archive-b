//REQUIRE
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var session = require('express-session');
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
	"ID": String,
	"Email": String,
	"Requestor role": String,
	"Bu role": String,
	"Hr role": String,
	"Ceo role": String,
	"Bu lead name": String,
	"Bu / ssu": String,
	"Section department": String,
	"Bu lead email": String,
	"Hr email": String,
	"Ceo email": String,
	"Requestor email": String,
});
var Official = mongoose.model('Official', officialSchema);

//Requests
var requestsSchema = new mongoose.Schema({
	"ID": String,
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
	"Remarks": String,
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
	Requests.find({}, function (error, allRequest) {
		console.log(allRequest);
		return res.send(allRequest);
	});
	//res.render('landing');
});

//login
app.get('/login', function (req, res) {
	
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
				if (loginInput['email'] === roles[i]['email']) {
					//finding his/her role
					if (roles[i]['requestorRole'] === 'true') currentUserRole = 'requestor-create';
					if (roles[i]['buRole'] === 'true') currentUserRole = 'bu-all';
					if (roles[i]['hrRole'] === 'true') currentUserRole = 'hr-all';
					if (roles[i]['ceoRole'] === 'true') currentUserRole = 'ceo-all';
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
		"ID": roleInput['id'],
		"Email": roleInput['email'],
		"Requestor role": roleInput['requestorRole'],
		"Bu role": roleInput['buRole'],
		"Hr role": roleInput['hrRole'],
		"Ceo role": roleInput['ceoRole'],
		"Bu lead name": roleInput['buLeadName'],
		"Bu / ssu": roleInput['buSsu'],
		"Section department": roleInput['sectionDepartment'],
		"Bu lead email": roleInput['buLeadEmail'],
		"Hr email": roleInput['hrEmail'],
		"Ceo email": roleInput['ceoEmail'],
		"Requestor email": roleInput['requestorEmail'],
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
		var email = undefined;
		for (var i = 0; i < roles.length; i++) {
			if (roles[i]['email'] === req.body.email) {
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
			if (role['email'] === req.session.email) {
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
			if (role['email'] === req.session.email) req.session.emailofTheBu = role['buLeadEmail'];
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

		//requestor input submit
		var requestorInputSubmit = new Requests({
			"ID": iid(),
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
			"Remarks": requestorInput['remarks'],

			'Email of The Requestor': req.session.email,
			'Email of The Bu': req.session.emailofTheBu,
			'Date Requested': date,
			'Bu Approval': '',
			'Hr Approval': '',
			'Ceo Approval': '',
		});

		//Callback 2
		requestorInputSubmit.save(function (error){
			//If there's potential error
			if (error) return res.send("Something went wrong")
			
			res.redirect('/requestor-create-submitted');
		});
		//End of callback 2
		
	});
	//End of callback 1
});

//request successfully submitted
app.get('/requestor-create-submitted', function (req, res) {
	res.render('requestor-create-submitted');
});

//All request, requestor side
app.get('/requestor-all', function (req, res) {
	//pull up all data associated with this email, from Requests database
	var requestorDataAll = [];
	
	//Callback 1
	Requests.find({}, function (error, getRequests) {
		
		//If there's potential error
		if (error) return res.send("Something went wrong")
		
		for (var getRequest of getRequests){
			if (getRequest['Email of The Requestor'] === req.session.email){
				requestorDataAll.push(getRequest);
			}
		}
		
		res.render('requestor-all', { requestorDataAll: requestorDataAll });
		
	});
	//End of callback 1

});

//======================= go back in here
//show, handle the search
app.get('/requestor-show-search', function (req, res) {
	var mongoid = undefined;

	//find the request with the ID provided
	Requests.find({}, function (err, allRequest) {
		for (var oneRequest of allRequest) {
			if (req.query.requestorSearchKeyword === oneRequest['ID']) {
				mongoid = oneRequest['ID'];
				break;
			}
		}
	});

	setTimeout(function () {
		//start here
		if (mongoid === undefined) {
			return res.redirect('back');
		}

		res.redirect('/requestor-show-id/' + mongoid);
		//end here
	}, 1000);
});
//=================================================== go back in here

//Show one request, requestor side
app.get('/requestor-id/:id', function (req, res) {
	var sendOneRequest = undefined;
	var paramsUrl = req.params.id;

	//pull up data from Requests database from the ID he/she provided
	//Callback 1
	Requests.findOne({"ID": paramsUrl}, function (error, oneRequest) {
		
		//If there's potential error
		if (error) return res.send("Something went wrong")
		
		//If nothing is found
		if (sendOneRequest === undefined){
			return res.redirect("back")
		}
		
		sendOneRequest = oneRequest
		
		res.render('requestor-id', { sendOneRequest: sendOneRequest });
	});
    //End of callback 1
	
});

//======================================
//Bu
//bu-all
app.get('/bu-all', function (req, res) {
	var sendManyRequest = [];

	//Find all the request, Bu side
	//Callback 1
	Requests.find({}, function (error, allRequest) {
		
		//If there's potential error
		if (error) return res.send("Something went wrong")
		
		for (var oneRequest of allRequest) {
			if (req.session.email === oneRequest['Email of The Bu']) {
				sendManyRequest.push(oneRequest);
			}
		}

		res.render('bu-all', { sendManyRequest: sendManyRequest });
	});
	//End of callback 1
	
});

//Show one request, Bu side
//bu-id
app.get('/bu-id/:id', function (req, res) {
	var sendOneRequest = undefined;
	var paramsUrl = req.params.id;

	//pull up data from Requests database from the ID he/she provided
	Requests.findOne({"ID": paramsUrl}, function (error, oneRequest) {
		
		//If there's potential error
		if (error) return res.send("Something went wrong")
		
		//If nothing found
		if (sendOneRequest === undefined) return res.redirect("back")
		
		sendOneRequest = oneRequest
		
		res.render('bu-id', { sendOneRequest: sendOneRequest });
		
	});
	
	
});

//Bu
//Update
app.put('/bu-id/:id', function (req, res) {
	var paramsUrl = req.params.id;
	
    //Callback 1
	Requests.findOne({ ID: paramsUrl }, function (error, oneRequest) {
		//If there's potential error
		if (error) {
			console.log(error);
			return res.redirect('back');
		}

		oneRequest['Bu Approval'] = req.body.buApproval;
        
		//Callback 2
		Requests.findOneAndUpdate({ ID: paramsUrl }, oneRequest, function (error, oneRequest) {
			//If there's potential error
			if (error) {
				console.log(error);
				return res.redirect('back');
			}

			res.redirect('/bu-responded');
		});
		//End of callback 2
		
		
	});
	//End of callback 1
	
});

//bu-request-responded
app.get('/bu-responded', function (req, res) {
	res.render('bu-responded');
});

//======================================
//Hr
//All request, Hr side
app.get('/hr-all', function (req, res) {
	
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

		res.render('hr-all', { allRequest: allRequest });
	});
	
});

//
app.get('/hr-show-id/:id', function (req, res) {
	var paramsUrl = req.params.id;

	//
	Requests.findOne({ ID: paramsUrl }, function (error, oneRequest) {
		//If there's potential error
		if (error) return res.send('Something went wrong');

		res.render('hr-show-id', { oneRequest: oneRequest });
	});
});

//Hr
//Update
app.put('/hr-show-id/:id', function (req, res) {
	var paramsUrl = req.params.id;

	//
	Requests.findOne({ ID: paramsUrl }, function (error, oneRequest) {
		oneRequest['Hr Approval'] = req.body.hrApproval;

		//
		Requests.findOneAndUpdate({ ID: paramsUrl }, oneRequest, function (error) {
			//If there's potential error
			if (error) return res.send('Something went wrong');

			res.redirect('/hr-request-responded');
		});
	});
});

//Hr
//Request Succesfully Responded
app.get('/hr-request-responded', function (req, res) {
	res.render('hr-request-responded');
});

//app.listen
//process.env.PORT, process.env.IP
app.listen(process.env.PORT || 3000, process.env.IP, function () {
	console.log('Server is running.');
	console.log('.');
	console.log('.');
	console.log('.');
});