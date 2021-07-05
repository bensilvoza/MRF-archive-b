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

//register schema
var registerSchema = new mongoose.Schema({ email: String, password: String });
var Register = mongoose.model('Register', registerSchema);

//access schema
var accessSchema = new mongoose.Schema({
	id: String,
	email: String,
	requestorRole: String,
	buRole: String,
	hrRole: String,
	ceoRole: String,
	buLeadName: String,
	buSsu: String,
	sectionDepartment: String,
	buLeadEmail: String,
	hrEmail: String,
	ceoEmail: String,
	requestorEmail: String,
});
var Access = mongoose.model('Access', accessSchema);

//requests
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
});
var Requests = mongoose.model('Requests', requestsSchema);

//HELPER VARIABLES


//================================
//ROUTES
//root
app.get('/', function (req, res) {
	res.render('landing');
});

//login
app.get('/login', function (req, res) {
	
	//
	if (req.session.loginIncorrectLoginCredentialsFaker === true){
		//
		req.session.loginIncorrectLoginCredentials = true
	} else {
		req.session.loginIncorrectLoginCredentials = false
	}
	
	res.render('login', {"loginIncorrectLoginCredentials": req.session.loginIncorrectLoginCredentials});
});

//login -> administrator section
app.post('/administrator', function (req, res) {
	var key = 'hijocorporationzxcbnm@';

	if (req.body.key === key) {
		req.session.accessOpen = true;
		res.redirect('/access');
	} else{
		console.log("Incorrect key")
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
	var empty = ""
	if (loginInput["email"] === empty || req.body.password === empty){
		req.session.loginIncorrectLoginCredentialsFaker = true
		return res.redirect("back")
	}

	var emailPassword = false;
	var currentUserRole = undefined;

	Register.find({}, function (err, registers) {
		//check email and password
		for (var i = 0; i < registers.length; i++) {
			//email
			if (registers[i]['email'] === loginInput['email']) {
				//password
				if (registers[i]['password'] === loginInput['password']) {
					emailPassword = true;
				}
			}
		}
	});

	Access.find({}, function (err, roles) {
		for (var i = 0; i < roles.length; i++) {
			//  login data              Access data
			if (loginInput['email'] === roles[i]['email']) {
				//finding his/her role
				if (roles[i]['requestorRole'] === 'true') currentUserRole = 'requestor-create';
				if (roles[i]['buRole'] === 'true') currentUserRole = 'bu-all';
				if (roles[i]['hrRole'] === 'true') currentUserRole = 'hr-all';
				if (roles[i]['ceoRole'] === 'true') currentUserRole = 'ceo-all';
			}

			//if role is now have value break the loop
			if (currentUserRole !== undefined) break;
		}
	});

	setTimeout(function () {
		//start here

		if (emailPassword) {
			//add email in the session
			req.session.email = loginInput['email'];

			//basically to add roleOpen to session
			if (currentUserRole === 'requestor-create') req.session.requestorOpen = true;
			if (currentUserRole === 'bu-all') req.session.buOpen = true;
			if (currentUserRole === 'hr-all') req.session.hrOpen = true;
			if (currentUserRole === 'ceo-all') req.session.ceoOpen = true;

			return res.redirect('/' + currentUserRole);
		} else {
			
			//
			req.session.loginIncorrectLoginCredentialsFaker = true
			
			return res.redirect('back');
		}
	}, 2000);
});

//save all official users, access
app.get('/access', function (req, res) {
	//req.session.accessOpen is to check if you are authorize to enter
	if (req.session.accessOpen === true) res.render('access');
	else res.send('Unathorized access');
});

app.post('/access', function (req, res) {
	//roles data
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

	var roleInputSubmit = new Access({
		id: roleInput['id'],
		email: roleInput['email'],
		requestorRole: roleInput['requestorRole'],
		buRole: roleInput['buRole'],
		hrRole: roleInput['hrRole'],
		ceoRole: roleInput['ceoRole'],
		buLeadName: roleInput['buLeadName'],
		buSsu: roleInput['buSsu'],
		sectionDepartment: roleInput['sectionDepartment'],
		buLeadEmail: roleInput['buLeadEmail'],
		hrEmail: roleInput['hrEmail'],
		ceoEmail: roleInput['ceoEmail'],
		requestorEmail: roleInput['requestorEmail'],
	});

	//save
	roleInputSubmit.save();
	res.redirect('/access-submitted');
});

//access submitted
app.get('/access-submitted', function (req, res) {
	res.render('access-submitted');
});

//register
app.get('/register', function (req, res) {
	
	//
	if (req.session.registerIncorrectLoginCredentialsFaker === true){
		//
		req.session.registerIncorrectLoginCredentials = true
	} else {
		req.session.registerIncorrectLoginCredentials = false
	}
	
	
	res.render('register', {"registerIncorrectLoginCredentials": req.session.registerIncorrectLoginCredentials});
});

app.post('/register', function (req, res) {
	//check if the inputed email is found on database
	Access.find({}, function (err, roles) {
		var email = false;
		for (var i = 0; i < roles.length; i++) {
			if (roles[i]['email'] === req.body.email) email = true;
		}

		if (email) {
			//check if password field is empty
			if (req.body.password === "" || req.body.confirmPassword === ""){
				console.log("Password must not be empty")
				return res.redirect("back")
			}
			
			//check if password input and confirm password input is same
			if (req.body.password === req.body.confirmPassword) {
				if (req.body.password == '') return res.redirect('back');
				//registration data
				var registerInput = {
					email: req.body.email,
					password: req.body.password,
				};

				var registerInputSubmit = new Register({
					email: registerInput['email'],
					password: hashing(registerInput['password']),
				});
				registerInputSubmit.save();
				return res.redirect('/login');
			} else {
				
				//password do not match
				console.log("Password do not match")
				return res.redirect("back")
			}
		} else {
			
			//
			req.session.registerIncorrectLoginCredentialsFaker = true
			
			console.log("Email address not found")
			return res.redirect('back');
		}
	});
});

//requestor
app.get('/requestor-create', function (req, res) {
	//go to session and check if authorize to enter
	if (req.session.requestorOpen === undefined) return res.send('Unathorized access');

	var requestorData = undefined;


	//pull up data from access database with the email he/she provided
	//to know what role he/she in company
	Access.find({}, function (err, roles) {
		for (var role of roles) {
			if (role['email'] === req.session.email) {
				requestorData = role;
				break;
			}
		}
	});

	setTimeout(function () {
		//start here
		res.render('requestor-create', { requestorData: requestorData, requestorCreateEmptyFields: req.session.requestorCreateEmptyFields });

		//end here
	}, 1000);
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
	if (req.body.buLeadName === empty){
		req.session.requestorCreateEmptyFields = true
	    return res.redirect('back');	
	}
	if (req.body.buSsu === empty){
		req.session.requestorCreateEmptyFields = true
		return res.redirect('back');
	}
	if (req.body.sectionDepartment === empty){
		req.session.requestorCreateEmptyFields = true
	    return res.redirect('back');	
	}
	if (req.body.positionTitle === empty){
		req.session.requestorCreateEmptyFields = true
		return res.redirect('back');
	}
	if (req.body.placeAssignment === 'Choose place of assignment...'){
		req.session.requestorCreateEmptyFields = true
		return res.redirect('back');
	}
	if (req.body.tools === 'Choose the tools needed...'){
		req.session.requestorCreateEmptyFields = true
		return res.redirect('back');
	}
	if (req.body.descriptionJob === empty){
		req.session.requestorCreateEmptyFields = true
		return res.redirect('back');
	}
	if (req.body.educationalDegree === empty){
		req.session.requestorCreateEmptyFields = true
		return res.redirect('back');
	}
	if (req.body.specificCharacteristic === empty){
		req.session.requestorCreateEmptyFields = true
		return res.redirect('back');
	}
	if (req.body.typeEmployment === 'Choose type of employment...'){
		req.session.requestorCreateEmptyFields = true
		return res.redirect('back');
	}
	if (req.body.typeRequest === 'Choose type of request...'){
		req.session.requestorCreateEmptyFields = true
		return res.redirect('back');
	}

	
	//pull up Access database
	Access.find({}, function (err, roles) {
		for (var role of roles) {
			if (role['email'] === req.session.email) req.session.emailofTheBu = role['buLeadEmail'];
		}
	});
	
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

	var date = months[month - 1] + ' ' + day + ", " + year;

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
	});

	requestorInputSubmit.save();
	res.redirect('/requestor-create-submitted');
});

//request successfully submitted
app.get('/requestor-create-submitted', function (req, res) {
	res.render('requestor-create-submitted');
});

//request successfully submitted
app.get('/requestor-all', function (req, res) {
	
	//pull up all data associated with this email, from Requests database
	var requestorDataAll = []
	Requests.find({}, function (err, getRequests){
		for (var getRequest of getRequests){
			 if (getRequest["Email of The Requestor"] === req.session.email) requestorDataAll.push(getRequest)
		}
	})
	
	setTimeout(function () {
		//start here
		
        res.render('requestor-all', {"requestorDataAll": requestorDataAll});
		//end here
	}, 1000);
});


//show, handle the search
app.get("/requestor-show-search", function (req, res){
	
	var mongoid = undefined
	
	//find the request with the ID provided
	Requests.find({}, function (err, allRequest){
		for (var oneRequest of allRequest){
			 if (req.query.requestorSearchKeyword === oneRequest["ID"]){
				 mongoid = oneRequest["ID"]
				 break
			 }
		}
	})
	
	
	setTimeout(function () {
		//start here
		if (mongoid === undefined){
			return res.redirect("back")
		}
		
		res.redirect ("/requestor-show-id/" + mongoid)
		//end here
	}, 1000);
	
})

//show all request, requestor side
app.get("/requestor-show-id/:id", function (req, res){
	
	var sendOneRequest = undefined
	var paramsUrl = req.params.id;
	
	//pull up data from Requests database from the ID he/she provided
	Requests.find({}, function (err, allRequest){
		for (var oneRequest of allRequest){
			 if (oneRequest["ID"] === paramsUrl) sendOneRequest = oneRequest;
		}
	})
	
	setTimeout(function () {
		//start here
		
		res.render("requestor-show-id", {"sendOneRequest": sendOneRequest})
		//end here
	}, 1000);	
	
});

//app.listen
//process.env.PORT, process.env.IP
app.listen(process.env.PORT || 3000, process.env.IP, function () {
	console.log('Server is running.');
	console.log('.');
	console.log('.');
	console.log('.');
});