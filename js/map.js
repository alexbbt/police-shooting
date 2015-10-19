$(document).ready(function() {
	$('#loading').hide();
	$('#type').change(function() {
		map.redraw($('#type').val());
	})
});

var map = (function() {
	var self = {};

	var map;
	var data;
	var allLayers = new L.LayerGroup();
	var controller;

	self.drawMap = function() {
		drawMap();
	};

	self.redraw = function(type) {
		$('#loading').show(); // incase Tabulation takes excessive time
		map.removeControl(controller); //remove current controller
		allLayers.clearLayers(); // clear out layers
		populateMap(data, type); // re-add everything with new tabulation
	}


	var drawMap = function() {
		$('#loading').show(); // incase Ajax and Tabulation takes excessive time

	  map = L.map('map').setView([45, -97], 4, 0);

	  var mapColor = 'mapbox.dark';
	  var mapboxKey = 'pk.eyJ1IjoiYWxleGJidCIsImEiOiJjaWZwdThvaWhhZDdsaXVseHVjMXluOGJvIn0.unltT8GfFsFml3Z6KrOMLA';
	  var layer = L.tileLayer('https://api.mapbox.com/v4/'+mapColor+'/{z}/{x}/{y}.png?access_token=' + mapboxKey);

	  layer.addTo(map);

	  // Get map data with an Ajax Request
		$.get("data/response.json", function(data){populateMap(JSON.parse(data), 'age')});
	}

	var populateMap = function(newData, type) {
		data = newData; // store for future use
		
		var title;
		var typeGroup = {}; // variable to group by
		var killed = {}; // killed vs hit
		var table = {
			Unknown: {},
			Hit: {}, 
			Killed: {}
		}; // table data store
		for (var i = data.length - 1; i >= 0; i--) {
			var circle = new L.circleMarker(
				[data[i]['lat'],
				data[i]['lng']],
				{
				color: ( (data[i]['Hit or Killed?'] == 'Killed')   ? 'red' : 'white') // color key
				}
			);

			circle.bindPopup( fillPopup( data[i] ), {maxHeight: 250} ); // ask for popup based on current element

			if (type == 'age') {
				title = 'Age';
				var variable = data[i]['Victim\'s Age'];
				if (variable > 150) {
					variable = "Unknown"; 
				} else {
					variable = (parseInt(variable / 20)+1);
					variable = ((variable*20-20) + '-' + (variable*20));
				};
			} else if (type == 'race') {
				title = 'Race';
				var variable = data[i]['Race'];
			} else if (type == 'gender') {
				title = 'Gender';
				var variable = data[i]['Victim\'s Gender'];
			} else if (type == 'armed') {
				title = 'Armed?'
				var variable = data[i]['Armed or Unarmed?'];
			} else {
				continue; // do nothing as no variable was selected
			};
			if (variable == undefined) { variable = "Unknown"; };

			if (typeGroup[variable] == null) {
				typeGroup[variable] = new L.LayerGroup([]); // create group if null
			}
			circle.addTo(typeGroup[variable]);

			var kill = data[i]['Hit or Killed?'];
			if (kill == undefined) { kill = "Unknown"; };
			if (killed[kill] == null) {
				killed[kill] = new L.LayerGroup([]);
			}
			circle.addTo(killed[kill]);

			// add to table
			if (table[kill][variable] == null) {
				for (var Tkill in table) {
					table[Tkill][variable] = 0; // add column to every row
				}
			};
			table[kill][variable]++;
		};

		// add layer groups to master group
		for (var group in typeGroup) {
			typeGroup[group].addTo(allLayers);
		};
		for (var group in killed) {
			killed[group].addTo(allLayers);
		};

		// add master group to map
		allLayers.addTo(map);

		// populate table with tabluated data
		fillTable(table, data.length);

		// colapse if race, becasue they take a lot of space
		controller = L.control.layers(null,typeGroup,{collapsed:((type == 'race') ? true : false)});
		controller.addTo(map);

		// Add title to controler
		var h4 = document.createElement('h4');
		h4.innerHTML = title;
		$('.leaflet-control-layers-expanded').prepend(h4);


		$('#loading').hide(); // done loading
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
			popup += "<br>Read more on <a target=\"_blank\" href=\"" + data['Source Link'] + "\">" + website[2] + "</a><br>";
		};
		return popup;
	}

	var fillTable = function(table, length) {
		var t = document.getElementById('table');
		t.innerHTML = '';
		var thead = document.createElement('thead');
		var thr = document.createElement('tr');
		var total = document.createElement('th');
		total.innerHTML = 'Total: ' + length;
		thr.appendChild(total);

		// create column headers
		for (var variable in table['Killed']) {
			var columnName = document.createElement('th');
			columnName.innerHTML = variable;
			thr.appendChild(columnName);
		}
		thead.appendChild(thr);
		t.appendChild(thead);
		var tbody = document.createElement('tbody');

		// create data rows
		for (var kill in table) {
			var row = document.createElement('tr');
			var rowHeader = document.createElement('th');
			rowHeader.innerHTML = kill + '<svg><circle cx=12 cy=6 r=6 style="fill:' + ((kill  == 'Killed')   ? 'red' : 'white') + '" /></svg>';
			row.appendChild(rowHeader);
			for (var variable in table[kill]) {
				var data = document.createElement('td');
				data.innerHTML = table[kill][variable] + 
						" <span class='small' ><span class='small' >(" + 
						parseInt(10*(table[kill][variable] / length) * 100)/10 + 
						"%)</span></span>";
				row.appendChild(data);
			}
			tbody.appendChild(row);
		}
		t.appendChild(tbody);
	}

	return self; // public methods
}());