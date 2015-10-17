$(document).ready(function() {
	$('#loading').hide();
	$('#type').change(function() {
		$('#loading').show();
		map.redraw($('#type').val());
	})
});

var map = (function() {
	var self = {};

	var map;
	var data;
	var unClustered = new L.LayerGroup();
	var clustered = new L.markerClusterGroup();
	var controller;

	self.drawMap = function() {
		drawMap();
	};

	self.redraw = function(type) {
		map.removeControl(controller);
		unClustered.clearLayers();
		customBuild(data, type);
	}


	// Function to draw your map
	var drawMap = function() {
		$('#loading').show();

	  // Create map and set view
	  map = L.map('map').setView([45, -97], 4, 0);

	  // Create a tile layer variable using the appropriate url
	  var layer = L.tileLayer('https://api.mapbox.com/v4/mapbox.dark/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYWxleGJidCIsImEiOiJjaWZwdThvaWhhZDdsaXVseHVjMXluOGJvIn0.unltT8GfFsFml3Z6KrOMLA');

	  // Add the layer to your map
	  layer.addTo(map);

	  // Execute your function to get data
	 getData();
	}

	// Function for getting data
	var getData = function() {

	  // Execute an AJAX request to get the data in data/response.js
		$.get("data/response.json", function(data){customBuild(JSON.parse(data), 'age')});

	  // When your request is successful, call your customBuild function

	}

	// Loop through your data and add the appropriate layers and points
	var customBuild = function(newData, type) {
		$('#loading').show();
		
		data = newData;

		//console.log(map);
		//unClustered.clearLayers();

		//console.log(data);
		
		var title;
		var typeGroup = {};
		var killed = {};
		var table = {
			Unknown: {},
			Hit: {}, 
			Killed: {}
		};
		//table = {};
		//console.log(data.length);
		for (var i = data.length - 1; i >= 0; i--) {
			//console.log(data[i]);
			var circle = new L.circleMarker(
				[data[i]['lat'],
				data[i]['lng']],
				{
				color: ( (data[i]['Hit or Killed?'] == 'Killed')   ? 'red' : 'white')
				}
			);
			circle.bindPopup(fillPopup(data[i]), {maxHeight: 250});
			if (type == 'age') {
				title = 'Age';
				var variable = data[i]['Victim\'s Age'];
				if (variable == undefined || variable > 150) { variable = "Unknown"; }
				else {
					//console.log(variable);
					variable = (parseInt(variable / 20)+1);
					variable = ((variable*20-20) + '-' + (variable*20));
					//console.log(variable);
				};
			} else if (type == 'race') {
				title = 'Race';
				var variable = data[i]['Race'];
				if (variable == undefined) { variable = "Unknown"; };
			} else if (type == 'gender') {
				title = 'Gender';
				var variable = data[i]['Victim\'s Gender'];
				if (variable == undefined) { variable = "Unknown"; };
			} else if (type == 'armed') {
				title = 'Armed?'
				var variable = data[i]['Armed or Unarmed?'];
				if (variable == undefined) { variable = "Unknown"; };
			} else {
				continue;
			};
			if (typeGroup[variable] != null) {
				circle.addTo(typeGroup[variable]);
			} else {
				typeGroup[variable] = new L.LayerGroup([]);
				circle.addTo(typeGroup[variable]);
			}
			var kill = data[i]['Hit or Killed?'];
			if (kill == undefined) { kill = "Unknown"; };
			if (killed[kill] != null) {
				circle.addTo(killed[kill]);
			} else {
				killed[kill] = new L.LayerGroup([]);
				circle.addTo(killed[kill]);
			}
			if (table[kill] == null) {
				table[kill] = {};
			};
			if (table[kill][variable] != null) {
				table[kill][variable]++;
			} else {
				for (var Tkill in table) {
					table[Tkill][variable] = 0;
				}
				table[kill][variable]++;
			};
			//console.log(table);
			//circle.addTo([kill]);
		};
		//console.log(typeGroup);
		for (var group in typeGroup) {
			//console.log(typeGroup[group]);
			typeGroup[group].addTo(clustered);
			typeGroup[group].addTo(unClustered);
		};
		//console.log(killed);
		for (var group in killed) {
			//console.log(group);
			killed[group].addTo(clustered);
			killed[group].addTo(unClustered);
		};
		//var combined = jQuery.extend(killed, typeGroup);
		unClustered.addTo(map);
		//clustered.addTo(map);
		/*var cluster = {
			"Unclustered": unClustered,
			"Clustered": clustered
		};*/
		fillTable(table, data.length);
		//L.control.layers(null,killed,{collapsed:false}).addTo(map);
		controller = L.control.layers(null,typeGroup,{collapsed:((type == 'race') ? true : false)});
		var h4 = document.createElement('h4');
		h4.innerHTML = title;
		$('.leaflet-control-layers-expanded').prepend('<hr>');
		$('.leaflet-control-layers-expanded').prepend(h4);
		controller.addTo(map);
		$('#loading').hide();
		// Once layers are on the map, add a leaflet controller that shows/hides layers
	  
	}

	var fillPopup = function(data) {
		var popup = "";
		popup += (data['Agency Name'] ? ('<h4>'+ data['Agency Name'] + "</h4>") : '');
		popup += (data['Timestamp'] ? ('<h5>'+ data['Timestamp'] + "</h5>") : '');
		popup += '<table class="table table-hover">';
		popup += (data['Hit or Killed?']? ("<tr><th>Hit or Killed?</th><td>" + data['Hit or Killed?'] + "</td></tr>") : '');
		popup += (data['Armed or Unarmed?'] ? ("<tr><th>Armed or Unarmed?</th><td>" + data['Armed or Unarmed?'] + "<td></tr>") : '');
		popup += (data['Victim Name'] ? ("<tr><th>Victim Name:</th><td>" + data['Victim Name'] + "<td></tr>") : '');
		popup += (data['Victim\'s Age'] ? ("<tr><th>Victim\'s Age:</th><td>" + data['Victim\'s Age'] + "<td></tr>") : '');
		popup += (data['Victim\'s Gender'] ? ("<tr><th>Victim\'s Gender:</th><td>" + data['Victim\'s Gender'] + "<td></tr>") : '');
		popup += (data['Race'] ? ("<tr><th>Race:</th><td>" + data['Race'] + "<td></tr>") : '');
		popup += '</table>';
		popup += (data['Summary'] ? ('<h6>Summery:</h6>'+data['Summary'] + "<br>") : '');
		if (data['Source Link']) {
			var website = data['Source Link'].split("/");
			popup += "<br>Read more on <a target=\"_blank\" href=\"" + data['Source Link'] + "\">" + website[2] + "</a>";
		};
		return popup;
	}

	var fillTable = function(table, length) {
		//console.log(table);
		var t = document.getElementById('table');
		t.innerHTML = '';
		var thead = document.createElement('thead');
		var thr = document.createElement('tr');
		var total = document.createElement('th');
		total.innerHTML = 'Total: ' + length;
		thr.appendChild(total);
		for (var variable in table['Killed']) {
			//console.log(table[kill][variable]);
			var columnName = document.createElement('th');
			columnName.innerHTML = variable;
			thr.appendChild(columnName);
		}
		thead.appendChild(thr);
		t.appendChild(thead);
		var tbody = document.createElement('tbody');
		for (var kill in table) {
			//console.log(table[kill]);
			var row = document.createElement('tr');
			var rowHeader = document.createElement('th');
			rowHeader.innerHTML = kill + '<svg><circle cx=12 cy=6 r=6 style="fill:' + ((kill  == 'Killed')   ? 'red' : 'white') + '" /></svg>';
			row.appendChild(rowHeader);
			for (var variable in table[kill]) {
				//console.log(table[kill][variable]);
				var data = document.createElement('td');
//				console.log(data.length);
//				console.log(table[kill][variable]);
//				console.log(table[kill][variable] / data.length);
//				console.log((table[kill][variable] / data.length) * 100);
				data.innerHTML = table[kill][variable] + " <span class='small' ><span class='small' >(" + parseInt(10*(table[kill][variable] / length) * 100)/10 + "%)</span></span>";
				row.appendChild(data);
			}
			tbody.appendChild(row);
		}
		t.appendChild(tbody);
	}



	return self;
}());