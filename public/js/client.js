var map;
var markersArray = [];
var LatLngList = [];

function clearOverlays() {
  markersArray = [];
  LatLngList = [];
}

function initialize() {
	var myLatlng = new google.maps.LatLng(44.9833,-93.2667);
	var mapOptions = {
			zoom: 12,
			center: myLatlng,
			mapTypeId: google.maps.MapTypeId.ROADMAP
	}
	var map = new google.maps.Map(document.getElementById('twitterMapResults'), mapOptions);
	
	var maxLen = markersArray.length;
	if (maxLen > 100){ maxLen = 100; }

	for (var i = 0; i < maxLen; i++) {
        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(markersArray[i][0], markersArray[i][1]),
            map: map,
            title: markersArray[i][2]
        });
    }
	
	if (LatLngList.length > 1){
		var bounds = new google.maps.LatLngBounds();
		for (var i = 0, LtLgLen = LatLngList.length; i < LtLgLen; i++) {
				bounds.extend(LatLngList[i]);
		}
		map.fitBounds(bounds);
	}
	
	$("#twitterMapResults").show("drop");
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

function loadTwitterUser(user, query){
	console.log(user);
	$.getJSON("/twitter/timeline/" + user, function(result){
		//$("#twitterUserDialog").dialog("open");		
		if (!jQuery.isEmptyObject(result)){	
			console.log(result);
			
			$("#twitterUserDialog").dialog('option', 'title', 'Timeline for user: @' + user);
			$("#btnTwitterMap").html("twittermapp @" + user);
			
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
			$("#twitterResults").hide("drop",function() {
				$("#twitterUserResults").show("drop",function() {
					loadTwitterMapData(user);
				});
			});
		}
	});
	
	//$("#twitterUserResults").show("slide");
	//$("#twitterMapResults").show("slide");
}

function doTwitterSearch(query){
	query = query || $("#searchInput").val();
	console.log(query);
	if (query){
		$("#searchInput").val(query);
	} 
	$.getJSON("/twitter/search/" + query, function(result){	
		console.log(result);
		$("#twitterUserResults").hide();
		$("#twitterMapResults").hide();
		$("#noResults").hide();
		
		$("#twitterResults").show();
		$("#contentTable").hide();
		
		$("#contentTable").addClass("tableContentOn");
		$("#contentTable").fadeIn("3000");
		
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
	$("#twitterMapResults").hide();
	$("#noResults").show();
	$('#twitTimelineTable').hide();
	$("#noResults").html("Obtaining geo results for @" + username + "...please wait");
	$.getJSON("/twitter/timeline/geo/" + username, function(result){	
		var hasGeo = false;
		
		$("#twitterUserDialog").dialog('option', 'title', 'twittermapp for user: @' + username);
		$('#twitTimelineTable').hide();
		$('#twitterMapResults').show();
		$("#noResults").show();
		clearOverlays();

		if (!jQuery.isEmptyObject(result)){	
			var j = 0;
			for(var i= 0; i < result.length; i++){
				if (result[i].geo != null){

					markersArray.push(new Array);
					markersArray[j].push(result[i].geo.coordinates[0]);
					markersArray[j].push(parseFloat(result[i].geo.coordinates[1]));
					markersArray[j].push(result[i].text.toString());
					markersArray[j].push(result[i].user.screen_name.toString());
							
					LatLngList.push(new google.maps.LatLng(result[i].geo.coordinates[0], result[i].geo.coordinates[1]));
				
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
		
		initialize();
		
	});
}

$(document).ready(function() {
	

	$.getJSON("/users", function(result){
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
			$("#lblWelcomeUser").html("Welcome, @" + result["name"]);
			$("#siteContent").load("../html/twitterSearch.html #siteContent", function loadHtml(response, status, xhr) {
				addSearchTextHandler();
				$("#btnLogin").button();
				$("#btnLogin").bind("click", {}, function () {
					if($("#searchInput").val() != ""){
						doTwitterSearch();
					}
					else{								
						$("#searchInput").select();
					}
			    });
			});
			google.maps.event.addDomListener(window, 'load', initialize);
		}
	});
});



