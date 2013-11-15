var map;
var markersArray = [];

function initializeMap() {
	var myLatlng = new google.maps.LatLng(44.9833,-93.2667);
	var mapOptions = {
			zoom: 12,
			center: myLatlng,
			mapTypeId: google.maps.MapTypeId.ROADMAP
	}
	var map = new google.maps.Map(document.getElementById('twitterMapResults'), mapOptions);
	
	var maxLen = markersArray.length;
	if (maxLen > 100){ maxLen = 100; }
	
	var bounds = new google.maps.LatLngBounds();
	for (var i = 0; i < maxLen; i++) {
		var iPosition = new google.maps.LatLng(markersArray[i][0], markersArray[i][1])
        var marker = new google.maps.Marker({
            position: iPosition,
            map: map,
            title: markersArray[i][2]
        });
        bounds.extend(iPosition);
    }

	$("#twitterMapResults").fadeIn("drop", function(){
		google.maps.event.trigger(map, "resize");
	 	if (maxLen > 0){ 
	 		map.fitBounds(bounds); 
	 	}else{
	 		map.panTo(myLatlng);
	 	}
	 });
}
	  

function loadTwitterUser(user, query){
	console.log(user);
	$.getJSON("/twitter/timeline/" + user, function(result){

		if (!jQuery.isEmptyObject(result)){	
			
			var iRow = "";
			iRow = iRow + "<tr><td class='twitterMessageRow'><a href='javascript:void(0)' ";
			iRow = iRow + "onclick='doTwitterSearch(\"" + query +"\")' ";
			iRow = iRow + "class='twitterUser'>Back to search results</a></td></tr>";
			iRow = iRow + "<tr><td class='twitterTimelineHeader'><a href='javascript:void(0)' ";
			iRow = iRow + "onclick='loadTwitterUser(\"" + user + "\", \"" + query + "\")' ";
			iRow = iRow + "class='twitterTimelineRow'>Timeline for @" + user + "</a></td></tr>";
			for(var i= 0; i < result.length; i++){
				iRow = iRow + "<tr><td class='twitterMessageRow'><span>" + result[i].text;
				iRow = iRow + "<span><br/><span class='timestamp'>" + result[i].created_at + "<span></td></tr>";
			}
			$("#twitTimeline").html("<table>" + iRow + "</table>");
			$("#twitterUserResults").html("<table>" + iRow + "</table>");
			$("#noResults").html("Obtaining geo results for @" + user + "...please wait");
			displayContent("user");
			loadTwitterMapData(user);
		}
	});
}

function logout(){
	$.getJSON("/logout", function(result){	
		location.reload();
	});
}

function doTwitterSearch(query){
	query = query || $("#searchInput").val();
	console.log(query);
	if (query){
		$("#searchInput").val(query);
	} 
	$.getJSON("/twitter/search/" + query, function(result){	
		$("#contentTable").hide();
		$("#contentTable").addClass("tableContentOn");
		$("#contentTable").fadeIn("3000");
		displayContent("search");
		
		if (!jQuery.isEmptyObject(result)){

			var iRow = "";
			var twitterResults = "";
			var searchResults = [];
			searchResults = result.statuses;
			
			if (searchResults.length > 0){
				for(var i= 0; i < searchResults.length; i++){
					iRow = iRow + "<tr><td class='twitterMessageRow'><a href='javascript:void(0)' ";
					iRow = iRow + "onclick='loadTwitterUser(\"" + searchResults[i].user.screen_name + "\", \"" + query + "\")' ";
					iRow = iRow + "class='twitterUser'>@" + searchResults[i].user.screen_name  + "</a><br/>";
					iRow = iRow + "<span>" + searchResults[i].text + "<span><br/>";
					iRow = iRow + "<span class='timestamp'>" + searchResults[i].created_at + "</span></td></tr>";
				}
				twitterResults = "<table>" + iRow + "</table>";
			}
			else{
				twitterResults = "<table><tr><td class='twitterMessageRow'><span class='timestamp'>0 results found</span></td></table>";
			}
			$("#twitterResults").html(twitterResults);
		}
	});
}

function loadTwitterMapData(username){
	for(var i=1;i<10;i++){
		$.getJSON("/twitter/timeline/geo/" + username, function(result){	
			var hasGeo = false;
			
			markersArray = [];

			if (!jQuery.isEmptyObject(result)){	
				var j = 0;
				for(var i= 0; i < result.length; i++){
					if (result[i].geo != null){

						markersArray.push(new Array);
						markersArray[j].push(result[i].geo.coordinates[0]);
						markersArray[j].push(parseFloat(result[i].geo.coordinates[1]));
						markersArray[j].push(result[i].text.toString());
						markersArray[j].push(result[i].user.screen_name.toString());
					
						hasGeo = true;
						j++;
					}
				}
			}
			if (!hasGeo){
				$("#noResults").html("No geo results for @" + username);
			}else{
				$("#noResults").html("Displaying geo results for @" + username);	
			}
			
			initializeMap();
		});
	}
}

function displayContent(selector){
	switch(selector){
		case "none":
			$("#twitterResults").hide();
			$("#twitterUserResults").hide();
			$("#twitterMapResults").hide();
			$("#noResults").hide();
			break;
		case "search":
			$("#twitterResults").show();
			$("#twitterUserResults").hide();
			$("#twitterMapResults").hide();
			$("#noResults").hide();
			break;
		case "user":
			$("#twitterResults").hide("drop",function() {
				$("#twitterUserResults").show("drop",function() {
					$("#noResults").show();
					return;
				});
			});
			break;
		case "map":   
			//$("#twitterMapResults").show("drop");
			$("#noResults").show();
			break;
	};
}

function addSearchTextHandler(){
	$("#searchInput").on('inputchange', function() {
		if (this.value != ""){$("#searchSpan").hide();}
		else{$("#searchSpan").show();}
	});
	
	$("#searchInput").keypress(function(event){
		if (event.which == 13) {
			if($("#searchInput").val() != ""){
				doTwitterSearch();
				$("#searchInput").blur();
			}
		}
	});
}

function loadPage(){
	
	$("#btnLogoutTwitter").hide();
	var username = document.cookie.username || "none";
	console.log(username);
	$.getJSON("/users/" + username, function(result){
		console.log(result);
		if (jQuery.isEmptyObject(result)){
			$("#siteContent").load("../html/login.html #siteContent", function loadHtml(response, status, xhr) {
				$("#btnLoginTwitter").button();
				$("#btnLoginTwitter").bind("click", {}, function () {
					window.location.href = window.location + "auth/twitter";
				});
			});
		}
		else{
			displayContent("search");
			$("#lblWelcomeUser").html("Welcome, @" + result["name"]);
			
			$("#btnLogoutTwitter").button();
			$("#btnLogoutTwitter").bind("click", {}, function () {
				logout();
		    });
			$("#btnLogoutTwitter").show();
			
			$("#siteContent").load("../html/twitterSearch.html #siteContent", function loadHtml(response, status, xhr) {
				addSearchTextHandler();
				$("#btnSearch").button();
				$("#btnSearch").bind("click", {}, function () {
					if($("#searchInput").val() != ""){
						doTwitterSearch();
					}
					else{								
						$("#searchInput").select();
					}
			    });
			});
			google.maps.event.addDomListener(window, 'load', initializeMap);
		}
	});
}

$(document).ready(function() {
	loadPage();
});
