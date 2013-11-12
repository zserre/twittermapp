var express = require('express');
var path = require('path');
var fs = require('fs');
var https = require('https');
var passport = require('passport'), TwitterStrategy = require('passport-twitter').Strategy;
var twitterAPI = require('node-twitter-api');

var app = express();
var users = [];
var accessToken = "";
var accessSecret = "";

var _twitterConsumerKey = "6OJg20qK5P4tKM1MdM8dQ";
var _twitterConsumerSecret = "EBKpTqlfztWp1PFSHeW7WqoTzncuYK3d5xhBpUvjx4";

var twitter = new twitterAPI({
    consumerKey: _twitterConsumerKey,
    consumerSecret: _twitterConsumerSecret,
    callback: 'http://127.0.0.1:5000/results'
});

app.configure(function() {
	app.use(express.static(path.join(__dirname, 'public')));
	app.use(express.cookieParser());
	app.use(express.bodyParser());
	app.use(express.logger("short"));
	app.use(express.session({ secret: 'some thing' }));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(app.router);
});

passport.use(new TwitterStrategy({
	  consumerKey: _twitterConsumerKey,
	  consumerSecret: _twitterConsumerSecret,
	  callbackURL: "http://127.0.0.1:5000/authenticated"
	},
	function(token, tokenSecret, profile, done) {
		accessToken = token;
		accessSecret = tokenSecret;
		var user = users[profile.id] || (users[profile.id] = { id: profile.id, name: profile.username });
        done(null, user);
	}
));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    var user = users[id];
    done(null, user);
});

app.get('/users', function (req, res) {
	if (users.length == 0){
		res.json({});
	}
	else{
		res.json(users[users.length-1]);
	}
});

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/authenticated', passport.authenticate('twitter', { successRedirect: '/', failureRedirect: '/error' }));

app.get('/twitter/search/:query', function (req, res) {
	searchParams = {
			q: req.params.query,					
			result_type: "mixed"
	};
	
	twitter.search(searchParams,
	    accessToken,
	    accessSecret,
	    function(error, data, response) {
	        if (error) {
	        	console.log(error);
	        	res.json({});	   
	        } else {
	        	res.json(data);	           
	        }
	    }
	);
});

app.get('/twitter/timeline/:user', function (req, res) {
	params = {
			screen_name: req.params.user,
			count: 100,
			include_entities: true,
			include_rts: true
	};
	twitter.getTimeline (
		"user_timeline", 
		params,
	    accessToken,
	    accessSecret,
	    function(error, data, response) {
	        if (error) {
	        	console.log(error);
	        	res.json({});	   
	        } else {
	        	res.json(data);	           
	        }
	    }
	);
});

app.get('/twitter/timeline/geo/:user', function (req, res) {
	var retJson = [];
	var j=0;
	for(var i=1;i<10;i++){
		params = {
				screen_name: req.params.user,
				count: 200,
				page: i,
				include_entities: true,
				include_rts: true
		};
		twitter.getTimeline (
			"user_timeline", 
			params,
		    accessToken,
		    accessSecret,
		    function(error, data, response) {
		        if (error) {
		        	console.log(error);
		        	res.json(retJson);   
		        } else {
		        	j = j + 1;
		        	retJson = retJson.concat(data);
		        	if (j >= 9){
		        		res.json(retJson);
		        	}
		        		           
		        }
		    }
		);
	}
});

app.get('/vailidUser', function (req, res) {
    res.sendfile(__dirname + '/public/html/twitterSearch.html');
});

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("server started on port " + port);
});