function clearPage() {
	// Wipes away previous data for a fresh start

	$("#weatherCurrent .message").empty();
	$("#weatherCurrent").empty();
	$("#weatherFuture li").empty();
	$(".news article").empty();
}

function colorize(temperature, opacity) {
	// Returns color value for a given temperature

	var temperature = Math.max(0, Math.min(temperature, 100));
	var r = Math.round((255*temperature)/100);
	var g = Math.round((150*(100-temperature))/100); 
	var b = Math.round((255*(100-temperature))/100);
	var color = "rgba("+r+","+g+","+b+","+opacity+")";
	return color;
}

function message(status, disappear) {
	// Serves up a message popup with a optional disappearing parameter

	$('.alert').html(status);
	$('.alert').removeClass('hide');
	if (disappear) {
		setTimeout(function() {
        	$('.alert').addClass('hide');
		}, 3000);
	}
}

function geolocationDenied() {
	// Displays a message so the user does not see a blank screen.

	$('.alert').addClass('hide');
	$('#weatherCurrent').html("Hello! Use Happy Day to look up your local news and weather.");
	$('#getLocation').remove();
}

function getNews(location) {
	// Use Google News to display most recent news results from city

	var url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20rss%20where%20url%20%3D%20'http%3A%2F%2Fnews.google.com%2Fnews%3Fq%3D"+location+"%26output%3Drss%26num%3D20'&format=json&diagnostics=true";
	$.getJSON(url, function(data){
		if (data.query.results === null) {
			return;
		}

		else {
			for (var i=0; i<14; i++) {
				// In case there is no news
				if (!data.query.results.item[i]) {
					return;
				}
				var article = data.query.results.item[i];
				var articleSection = '#article'+(i+1);

				if(article.title && article.link) {
					if (article.title.length > 200) {
						article.title = article.title.substring(0, 200)+"...";
					}
					$(articleSection).append('<a href="'+article.link+'"><h1>'+article.title+'</h1></a>');
				}
			}
		}
	}).error(function(data){
		message("Connection seems down, sorry!");
		return;
	});
}

function getWeather(location,latitude,longitude) {
	// Use Forecast.io to predict the temperation min/max and weather

	var url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20json%20where%20url%3D'https%3A%2F%2Fapi.forecast.io%2Fforecast%2Fe053334212f4dd449660bd61b61b29e2%2F"+latitude+"%2C"+longitude+"'&format=json&diagnostics=true";
	$.getJSON(url, function(data){
		
		if (data.query.results === null) {
			return;
		}

		else {
			var components = data.query.results.json.daily.data;
			var todayTempMax = Math.round(components[0].temperatureMax);
			var todayTempMin = Math.round(components[0].temperatureMin);
			var tempAvg = (todayTempMax+todayTempMin)/2;

			$('#weatherCurrent').html('<div class="weatherToday"><div>'+components[0].icon+'</div><div>'+todayTempMin+'-'+todayTempMax+'&deg;</div></div>Good day,<br>'+location.slice(0, location.indexOf(","))+'!');
			
			// Colorize background
			$("body").css("background-color",colorize(tempAvg,1));
			$('.weatherToday').css("background-color",colorize(tempAvg, .5));

			// Setup 7 days into the future
			for (var i=1; i<8; i++) {
				if (components[i].temperatureMax && components[i].temperatureMin && components[i].time && components[i].icon) {

					var tempMax = Math.round(components[i].temperatureMax);
					var tempMin = Math.round(components[i].temperatureMin);
					var tempAvg = (tempMax+tempMin)/2;
					var timeStamp = new Date(components[i].time*1000);
					var day = timeStamp.getUTCDay();
					var dayOfWeek = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

					$('#weatherFuture .day'+[i]).html('<div>'+dayOfWeek[day]+'</div><div>'+components[i].icon+'</div><div>'+tempMin+'-'+tempMax+'&deg;');
					$('#weatherFuture .day'+[i]).css("background-color",colorize(tempAvg,.5));
				}
			}
		}
	}).error(function(data){
		message("Connection seems down, sorry!");
		return;
	});
}

function getLocation(url) {
	// Get location data and pass to loadSearch
	$.getJSON(url, function(data){
		if(data.status === 'ZERO_RESULTS') {
			message("We couldn't find that city or zip.", true);
			return;
		}

		else {
			var components = data.results[0].address_components;
			var geolocation = data.results[0].geometry.location;

			for (var i=0; i<components.length; i++) {
				if(components[i].types.indexOf('locality') !== -1) {
					var city = components[i].long_name;
				}
				if(components[i].types.indexOf('administrative_area_level_1') !== -1) {
					var state = components[i].short_name;
				}
			}

			if (typeof city === 'undefined' || state === 'undefined') {
				message("Cities only, please!", true);
				return;
			}

			var location = city + ', ' + state;
			var latitude = geolocation.lat;
			var longitude = geolocation.lng;
			loadSearch(location, latitude, longitude);
		}
	}).error(function(data){
		message("Connection seems down, sorry!");
		return;
	});
}

function loadSearch(location,latitude,longitude) {
	// Set up the page for a search

	$('#locationSearch').val(location);
	$('header .shortcuts').addClass('hide');
	$('#locationSearch').blur();
	clearPage();
	saveHistory(location);
	var locationEncoded = encodeURIComponent(location.replace(/\s+/g, ''));
	getNews(locationEncoded);
	getWeather(location,latitude,longitude);
}

function saveHistory(location) {
	// Save history to locationStorage

	$('#historyList li:contains("'+location+'")').remove();
	$('#historyList').prepend('<li>'+location+'</li>');
	$('#historyList li').slice(5).remove();
	if (typeof localStorage !== 'undefined') {
		var pastSearches = [];
		$('#historyList li').each(function(){pastSearches.push($(this).text());});
		localStorage.pastSearches = JSON.stringify(pastSearches);
	}

	// Readd click handlers for new elements
	$('#historyList li').unbind();
	$('#historyList li').click(function(){
			var location = $(this).html();
			var url='http://maps.googleapis.com/maps/api/geocode/json?address='+location+'&sensor=true';
			getLocation(url);
		});
}

function setPosition(position) {
	// Takes position from geolocation and passes it to loadSearch

	var latitude = position.coords.latitude;
	var longitude = position.coords.longitude;
	var url = 'https://maps.googleapis.com/maps/api/geocode/json?latlng='+position.coords.latitude+','+position.coords.longitude+'&sensor=true';

	getLocation(url);
}

$(document).ready(function() {
	// Check to see if you're online
	if (window.navigator.onLine) {
		message("Loading...");
		// Look up current location and pass to loadSearch. If denied, load welcome message.
		navigator.geolocation.getCurrentPosition(setPosition, geolocationDenied);
	}
	else {
		message("No internet connection,");
	}

	// Load last 5 searches and search for the most recent search
	if (typeof localStorage.pastSearches !== 'undefined') {
		$('#historyList').empty();
		var pastSearches = JSON.parse(localStorage.pastSearches);
		for (var i=0; i<pastSearches.length; i++) {
			$('#historyList').append('<li>'+pastSearches[i]+'</li>');
		}
	}

	// Setup shortcuts if there are any available
	if (navigator.geolocation || $('#historyList') !== '') {
		$('#locationSearch').focus(function() {$('header .shortcuts').removeClass('hide');});
		$('.shortcuts .close').click(function() {$('header .shortcuts').addClass('hide');});

		if (navigator.geolocation) {
			$('.shortcuts').prepend('<a id="getLocation">Get current location</a>');
			$('#getLocation').click(function(){message("Loading..."); navigator.geolocation.getCurrentPosition(setPosition);});
		}

		$('#historyList li').click(function(){
			var location = $(this).html();
			var url='http://maps.googleapis.com/maps/api/geocode/json?address='+location+'&sensor=true';
			getLocation(url);
		});
	}

	// Reset input on focus
	$('#locationSearch').focus(function() {
		$('#locationSearch').val('');
	});

	// Take user value and turn into city + state, and pass to loadSearch
	$('header form').on('submit', function(){
		message("Loading...");
		var searchBox = $('#locationSearch').val();

		if (searchBox.length === 0) {
			message('Blank input.',true);
			return false;
		}

		var searchBox = encodeURIComponent(searchBox);
		var url='http://maps.googleapis.com/maps/api/geocode/json?address='+searchBox+'&sensor=true';
		getLocation(url);

		return false;
	});

}); // End $(document).ready

$(document).ajaxStop(function() {
	// Hide loading messages when ajax calls are finished
	if ($('.alert').html() === "Loading...") {
		$('.alert').addClass('hide');
	}
});