var map = (function() {
	var self = {};

	self.drawMap = function() {
		drawMap();
	};

	var map;

	// Function to draw your map
	var drawMap = function() {

	  // Create map and set view
	  map = L.map('map').setView([41.850033, -87.6500523], 4, 0);

	  // Create a tile layer variable using the appropriate url
	  var layer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png');

	  // Add the layer to your map
	  layer.addTo(map);

	  // Execute your function to get data
	 getData();
	}

	// Function for getting data
	var getData = function() {

	  // Execute an AJAX request to get the data in data/response.js
		$.get("data/response.json", customBuild);

	  // When your request is successful, call your customBuild function

	}

	// Loop through your data and add the appropriate layers and points
	var customBuild = function(data) {
		data = JSON.parse(data);
		console.log(data);
		// Be sure to add each layer to the map
		var groups = {};
		for (var i = data.length - 1; i >= 0; i--) {
			//console.log(data[i]);
			var circle = new L.circleMarker([data[i]['lat'], data[i]['lng']]);
			circle
			var race = data[i]['Race'];
			//console.log(race);
			if (groups[race] != null) {
				circle.addTo(groups[race]);
			} else {
				groups[race] = new L.LayerGroup([]);
				circle.addTo(groups[race]);
			}
			//circle.addTo([race]);
		};
		console.log(groups);
		for (var group in groups) {
			console.log(group);
			groups[group].addTo(map);
		};
		//allCircles.addTo(map);
		// Once layers are on the map, add a leaflet controller that shows/hides layers
	  
	}
	return self;
}());