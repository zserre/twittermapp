var express = require('express');
var path = require('path');
var fs = require('fs');
var https = require('https');
var passport = require('passport'), TwitterStrategy = require('passport-twitter').Strategy;
var twitterAPI = require('node-twitter-api');

var app = express();
var users = [];
var authenticatedUsers = [];
var host = "";
var twitterPage =0;

var twitterConsumerKey = "6OJg20qK5P4tKM1MdM8dQ";
var twitterConsumerSecret = "EBKpTqlfztWp1PFSHeW7WqoTzncuYK3d5xhBpUvjx4";

var twitter = new twitterAPI({
    consumerKey: twitterConsumerKey,
    consumerSecret: twitterConsumerSecret,
    callback: host + "/results"
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
	  consumerKey: twitterConsumerKey,
	  consumerSecret: twitterConsumerSecret,
	  callbackURL: host + "/authenticated"
	},
	function(token, tokenSecret, profile, done) {
		accessToken = token;
		accessSecret = tokenSecret;
		var user = users[profile.id] || (users[profile.id] = 
											{	
												id: profile.id, 
												name: profile.username,
											});
		var authenticatedUser = authenticatedUsers[profile.id] || (authenticatedUsers[profile.id] = 
											{	
												token: token, 
												secret: tokenSecret,
											});
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

app.get('/users/:username', function (req, res) {	
	console.log(req.cookies.username);
	if ((req.cookies.username == undefined) || (req.cookies.username == '')){
		res.cookie('username', '');
		res.json({});
	}
	else{		
		if(users[parseInt(req.cookies.username)] == undefined) {
   			res.cookie('username', '');
   			res.json({});		
		}else {
			res.json(users[parseInt(req.cookies.username)]);
		}
		
	}
});

app.get('/logout', function (req, res) {
	res.cookie('username', '');
	users = [];
	req.logout();
	res.json({});
});

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/authenticated', passport.authenticate('twitter', { 
	successRedirect: '/validLogin', 
	failureRedirect: '/error' 
}));

app.get('/validLogin', function(req, res){	
	if(req.user == undefined){
		res.cookie('username', '');		
	}else{	
		res.cookie('username', req.user.id);		
	}
	res.redirect('/');
});

app.get('/twitter/search/:query', function (req, res) {	
	searchParams = {
			q: req.params.query,					
			result_type: "mixed"
	};
	
	twitter.search(searchParams,
	    authenticatedUsers[req.cookies.username].token,
	    authenticatedUsers[req.cookies.username].secret,
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
	    authenticatedUsers[req.cookies.username].token,
	    authenticatedUsers[req.cookies.username].secret,
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
	twitterPage = 0;
	for(var i=1;i<10;i++){
		params = {
			screen_name: req.params.user,
			count: 200,
			page: i,
			include_entities: true,
			include_rts: true
		};
		twitter.getTimeline(
			"user_timeline", 
			params,
		    authenticatedUsers[req.cookies.username].token,
	    	authenticatedUsers[req.cookies.username].secret,
		    function(error, data, response) {
		        if (error) {
		        	console.log(error);
		        	res.json(retJson);   
		        } else {
		        	twitterPage++;		        	
		        	retJson = retJson.concat(data);
		        	if (twitterPage >= 9){
		        		res.json(retJson);
		        	}		           
		        }
		    }
		);
	}
});

app.get('/', function(req, res){
    res.sendfile(__dirname + '/index.html');
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
	if(process.argv.length < 3){
		 console.log("Not enough parameters   usage: node server.js [host]");
		  process.exit(code=0);
	}else{
		  host = process.argv[2];
		  console.log("server started on " + host + ":" + port);
	}
});