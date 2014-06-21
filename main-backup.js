function error(status) {
	if (status === "no rss") {
		console.log("Google News isn't working.");
	}

	if (status === "geolocation no results") {
		console.log("Google geolocation returned no results.");
	}

	if (status === "gelocation city or state undefined") {
		console.log("Geolocation returned no city or state");
	}

	if (status == "no location storage") {
		console.log("No local storage detected.");
	}

	if (status == "no geolocation") {
		console.log("No geolocation detected.");
	}
}

function clearPage() {
	console.log("clearing page");
	$("#weatherCurrent").empty();
	$("#weatherFuture li").empty();
	$(".news article").empty();
}

function saveLocation() {
}

function setPosition(position) {
	latitude = position.coords.latitude;
	longitude = position.coords.longitude;

	var url = "https://maps.googleapis.com/maps/api/geocode/json?latlng="+position.coords.latitude+','+position.coords.longitude+"&sensor=true";

	$.getJSON(url, function(data){
		if(data.status === "ZERO_RESULTS") {
			error("geolocation no results");
			return;
		}

		var components = data.results[0].address_components;
		for (var i=0; i<components.length; i++) {
			var comp = components[i];

			if(comp.types.indexOf("locality") !== -1) {
				var city = comp.long_name;
			}
			if(comp.types.indexOf("administrative_area_level_1") !== -1) {
				var state = comp.short_name;
			}
			if(comp.types.indexOf("postal_code") !== -1) {
				var zip = comp.short_name;
			}
		}

		if (typeof city === undefined || state === undefined || zip === undefined) {
			error("gelocation city or state undefined");
			return;
		}

		else {
			getNews(zip);
		}
	})
}

function getNews(zip) {
	var url = "http://query.yahooapis.com/v1/public/yql?q=select%20title%2C%20link%20from%20rss%20where%20url%20%3D%20'http%3A%2F%2Fnews.google.com%2Fnews%3Fgeo%3D"+zip+"%26output%3Drss'&format=json&diagnostics=true";
	$.getJSON(url, function(data){
		if (data.query.results === null) {
			error("no rss");
			return;
		}
		else {
			// Empty news section
			// $('.news').html('');
			for (var i=0; i<10; i++) {
				var article = data.query.results.item[i];
				var articleSection = '#article'+(i+1);

				console.log(articleSection);
				// Check for presence of link and title
				if(typeof article.title !== 'undefined' && typeof article.link !== 'undefined') {
					$(articleSection).append('<h1><a href="'+article.link+'">'+article.title+'</a></h1>');
				}
			}
		}
	});
}

$(document).ready(function() {
	var zip;
	var city;
	var state;

	// Put contents of localstorage into shortcuts popout
	if (typeof localStorage !== 'undefined') {
    	if (typeof localStorage.pastLocations !== 'undefined') {
    	    $("header .shortcuts").html(localStorage.pastLocations);
    	}
    }

    // When submit, save the searched value, use geolocation api to fin
	$("header form").on('submit', function() {
		clearPage();
		$('header .shortcuts').addClass('hide');
		var textbox = $("#locationSearch").val();
		$("header .shortcuts ul").append("<li>"+textbox+"</li>");
		var alltext = $("header .shortcuts").html();
		localStorage.pastLocations = alltext;
		return false;
    });

	$(".shortcuts .currentLocation").click(function(){
		clearPage();
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(setPosition);
		}
		else {
			error("no geolocation");
		}
    });

    $("#locationSearch").focus(function() {$('header .shortcuts').removeClass('hide');});
    $(".shortcuts .close").click(function() {$('header .shortcuts').addClass('hide');});

});