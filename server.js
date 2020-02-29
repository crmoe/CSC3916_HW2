var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
db = require('./db')(); //global hack
var jwt = require('jsonwebtoken');
var cors = require('cors');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

router.route('/post')
    .post(authController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            res.send(req.body);
        }
    );

router.route('/postjwt')
    .post(authJwtController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            res.send(req.body);
        }
    );

router.post('/signup', function(req, res) {

    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please pass username and password.'});
    } else {
        var newUser = {
            username: req.body.username,
            password: req.body.password
        };
        // save the user
        db.save(newUser); //no duplicate checking
        res.json({success: true, msg: 'Successful created new user.'});
    }
}).all('/signup', function(req, res) {
    res.status(405).send({success: false, Allow: 'POST', msg: '405 Method not allowed.'});
});

var token; // had to move this outside function fr use with /movies PUT

router.post('/signin', function(req, res) {

    var user = db.findOne(req.body.username);

    if (!user) {
        res.status(401).send({success: false, msg: 'Authentication failed. User not found.'});
    } else {
        // check if password matches
        if (req.body.password == user.password) {
            var userToken = {id: user.id, username: user.username};
            token = jwt.sign(userToken, process.env.UNIQUE_KEY);
            res.json({success: true, token: 'JWT ' + token});
        } else {
            res.status(401).send({success: false, msg: 'Authentication failed. Wrong password.'});
        }
    }
}).all('/signin', function(req, res) {
    res.status(405).send({success: false, Allow: 'POST', msg: '405 Method not allowed.'});
});

router.get('/movies', function(req, res) {
    res.json({
        success: true,
        message: 'GET movies',
        headers: req.headers,
        query: req.body.query,
        env: process.env.UNIQUE_KEY});
}).post('/movies', function(req, res) {
    res.json({
        success: true,
        message: 'movie saved',
        headers: req.headers,
        query: req.body.query,
        env: process.env.UNIQUE_KEY
    });
}).put('/movies',authJwtController.isAuthenticated, function(req, res) {

        res.json({
        success: true,
        token: 'JWT ' + token,
        message: 'movie updated',
        headers: req.headers,
        query: req.body.query,
        env: process.env.UNIQUE_KEY
    });
}).delete('/movies', authController.isAuthenticated, function(req, res) {
    res.json({
        success: true,
        message: 'movie deleted',
        headers: req.headers,
        query: req.body.query,
        env: process.env.UNIQUE_KEY
    });
}).all('/movies', function(req, res) {
    res.status(405).send({success: false, Allow: ['GET', 'POST', 'PUT', 'DELETE'], msg: '405 Method not allowed.'});
});

router.all('/', function(req, res) {
    res.status(400).send({success: false, Allow: 'POST', msg: 'Request to base URL not allowed.'});
});

app.use('/', router);
app.listen(process.env.PORT || 8080);
