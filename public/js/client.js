var map;
var markersArray = [];
var LatLngList = [];

function clearOverlays() {
  markersArray = [];
  LatLngList = [];
}

function loadMapTestParams(){
	markersArray.push(new Array);
	markersArray[0].push(50);
	markersArray[0].push(90);
	markersArray[0].push("hello 0");
	markersArray[0].push("world 0");
	
	markersArray.push(new Array);
	markersArray[1].push(0);
	markersArray[1].push(0);
	markersArray[1].push("hello 1");
	markersArray[1].push("world 1");
	
	LatLngList.push(new google.maps.LatLng(parseFloat(markersArray[0][0]), parseFloat(markersArray[0][1])));
	LatLngList.push(new google.maps.LatLng(parseFloat(markersArray[1][0]), parseFloat(markersArray[1][1])));
}

function initialize() {
	var myLatlng = new google.maps.LatLng(44.9833,-93.2667);
	var mapOptions = {
			zoom: 8,
			center: myLatlng,
			mapTypeId: google.maps.MapTypeId.ROADMAP
	}
	var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

	//commented in for map testing
	//loadMapTestParams();

	for (var i = 0; i < markersArray.length; i++) {
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
}
	  
function addSearchTextHandler(){
	$("#searchInput").on('inputchange', function() {
		if (this.value != ""){$("#searchSpan").hide();}
		else{$("#searchSpan").show();}
	});
}

function loadTwitterUser(user){
	console.log(user);
	$.getJSON("/twitter/timeline/" + user, function(result){
		$("#twitterUserDialog").dialog("open");		
		if (!jQuery.isEmptyObject(result)){	
			console.log(result);
			
			$("#twitterUserDialog").dialog('option', 'title', 'Timeline for user: @' + user);
			$("#btnTwitterMap").html("twittermapp @" + user);
			
			var iRow = "";
			for(var i= 0; i < result.length; i++){
				iRow = iRow + "<tr><td class='twitterMessageRow'><span>" + result[i].text;
				iRow = iRow + "<span><br/><span class='timestamp'>" + result[i].created_at + "<span></td></tr>";
			}
			$("#twitTimeline").html("<table>" + iRow + "</table>");
		}
	});
}

function doTwitterSearch(){
	
	$.getJSON("/twitter/search/" + $("#searchInput").val(), function(result){	
		console.log(result);
		if (!jQuery.isEmptyObject(result)){
			$("#twitterResults").height(500);
			$("#twitterResults").width(750);
			$("#contentTable").hide();
			$("#contentTable").addClass("tableContentOn");
			$("#contentTable").fadeIn("3000");
			
			var iRow = "";
			var searchResults = [];
			searchResults = result.statuses;
			for(var i= 0; i < searchResults.length; i++){
				iRow = iRow + "<tr><td class='twitterMessageRow'><a href='javascript:void(0)' ";
				iRow = iRow + "onclick='loadTwitterUser(\"" + searchResults[i].user.screen_name +"\")' ";
				iRow = iRow + "class='twitterUser'>@" + searchResults[i].user.screen_name  + "</a><br/>";
				iRow = iRow + "<span>" + searchResults[i].text + "<span><br/>";
				iRow = iRow + "<span class='timestamp'>" + searchResults[i].created_at + "</span></td></tr>";
			}
			var twitterResults = "<table>" + iRow + "</table>";
			$("#twitterResults").html(twitterResults);
		}
	});
}

function loadTwitterMapData(username){
	$('#spinnerGeo').spin('large', '#777777');
	$('#spinnerGeo').show();
	$('#twitTimelineTable').hide();
	$("#noResults").html("Obtaining geo results for @" + username + "...please wait");
	$.getJSON("/twitter/timeline/geo/" + username, function(result){	
		var hasGeo = false;
		
		$("#twitterUserDialog").dialog('option', 'title', 'twittermapp for user: @' + username);
		$('#twitTimelineTable').hide();
		$('#map-canvas').show();

		clearOverlays();

		if (!jQuery.isEmptyObject(result)){	
			for(var i= 0; i < result.length; i++){
				if (result[i].geo != null){
					markersArray.push(new Array);
					markersArray[i].push(parseFloat(result[i].geo.latitude));
					markersArray[i].push(parseFloat(result[i].geo.longitude));
					markersArray[i].push(result[i].text);
					markersArray[i].push(result[i].user.screen_name);
					
					LatLngList.push(new google.maps.LatLng(parseFloat(result[i].geo.latitude), parseFloat(result[i].geo.longitude)));
				
					hasGeo = true;
				}
			}
		}
		if (!hasGeo){
			$("#noResults").html("No geo results for @" + username);
		}
		$('#spinnerGeo').hide();
		initialize();
	});
}

function addTwitterDialog(){
	$("#twitterUserDialog").dialog({      
		show: {
			effect: "fade",
			duration: 250
		},
		hide: {
			effect: "fade",
			duration: 250
		},
		autoOpen: false,
		height: 600,
		width: 450,		
		resizable: false,
		draggable: false,
		closeOnEscape: true,
		modal: true,
		resizeStop: function(event, ui) {
			google.maps.event.trigger(map, 'resize');  
		},
		open: function (event, ui) {
			$('#twitTimelineTable').show();
			$('#map-canvas').hide();
			
			$('#btnTwitterMap').button();	
			$('#btnTwitterMap').on("click", function(event){
				loadTwitterMapData($("#btnTwitterMap").html().split("@")[1]);
			});
			$('.ui-widget-overlay').bind('click', function() {			
				$('#twitterUserDialog').dialog('close');
			});
		
			
		},
        buttons: {
            close: function () {            
            	$('#twitterUserDialog').dialog('close');
            }
        }
	});
}

$(document).ready(function() {
	
	//$('#map-canvas').hide();
	
	addTwitterDialog();
	
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
		}
		google.maps.event.addDomListener(window, 'load', initialize);
	});
});



