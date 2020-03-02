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

function getJSONObject(req) {
    var json = {
        headers : "No Headers",
        key: process.env.UNIQUE_KEY,
        body : "No Body"
    };

    if (req.body != null) {
        json.body = req.body;
    }
    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.route('/post')
    .post(authController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            var o = getJSONObject(req);
            res.json(o);
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
});

router.post('/signin', function(req, res) {

    var user = db.findOne(req.body.username);

    if (!user) {
        res.status(401).send({success: false, msg: 'Authentication failed. User not found.'});
    }
    else {
        // check if password matches
        if (req.body.password === user.password)  {
            var userToken = { id : user.id, username: user.username };
            var token = jwt.sign(userToken, process.env.UNIQUE_KEY);
            res.json({success: true, token: 'JWT ' + token});
        }
        else {
            res.status(401).send({success: false, msg: 'Authentication failed. Wrong password.'});
        }
    }
});

router.get('/movies', function(req, res) {
    var movie = db.find(req.body.movie);

    if (!movie) {
        res.status(401).send({success: false, msg: 'Movie does not exist in the database'});
    }
    else {
        res.json({success: true, movie: movie});
    }
});

router.post('/movies', function(req, res) {
    if (!req.body.movie) {
        res.json({success: false, msg: 'Please pass a movie name'})
    }
    else {
        db.save(req.body.movie);
        res.json({success: true, msg: 'Movie posted successfuly'})
    }
});

router.put('/movies', function(req, res) {
    var user = db.findOne(req.body.username);

    if (!user) {
        res.status(401).send({success: false, msg: 'Authentication failed. User not found.'});
    }
    else {
        // check if password matches
        if (req.body.password === user.password)  {
            var userToken = { id : user.id, username: user.username };
            var token = jwt.sign(userToken, process.env.UNIQUE_KEY);
            db.save(movie);
            res.json({success: true, msg: 'Movie deleted', token: 'JWT ' + token});
        }
        else {
            res.status(401).send({success: false, msg: 'Authentication failed. Wrong password.'});
        }
    }
});

router.delete('/movies', function(req, res) {
    var auth = authController.isAuthenticated();

    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please pass username and password.'});
    }
    else if (!auth) {
        res.json({success: false, msg: 'Authentication failed.'});
    }
    else {
        db.remove(req.body.movie);
        res.json({success: true, msg: 'Successfully deleted movie.'});
    }
});

app.use('/', router);
app.listen(process.env.PORT || 8080);

module.exports = app; // for testing
