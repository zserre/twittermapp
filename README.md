<a target="_blank" href="http://twittermapp.herokuapp.com"> ![launch twittermapp](/public/images/twitterMapBanner.png "Click to launch twittermapp")</a>

A simple node.js app that displays twitter search results and places the
geolocation of the results on a map

to run server issue this command: node server.js 

server will run on localhost:5000 (127.0.0.1:5000) 

Live example is available [here]

[here]: http://twittermapp.herokuapp.com/

node.js npm dependancies:
	express
	oath
	passport
	node-twitter-api


The following as a list of limitations the current implementation has, 
didn't implment due to time constraints other obligations etc.  The base 
functionality is all there though

TODO list:

1.  Implement more stringent error handling / sanitize inputs

2.	Implement a more robust session management system, 
	right now it only works for one user log in per server instance
	
3.	Update the View to show proper formatting for time, urls, link
	other twitter handles, highlight search terms, etc

4. 	Do error checking to check for duplicate tweets

5.  Add better mobile support, currently mobile has some html scaling issues...still functional though
  
6.  Do more server side processing of geo results, currently all processing is being done client side
