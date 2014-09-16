$(function () {
	var $region = $('[name="region"]'),
		$district = $('[name="district"]'),
		$city = $('[name="city"]'),
		$street = $('[name="street"]'),
		$building = $('[name="building"]'),
		$buildingAdd = $('[name="building-add"]');

	var map = null,
		placemark = null,
		map_created = false;

	$.kladr.setDefault({
		token: '51dfe5d42fb2b43e3300006e',
		key: '86a2c2a06f1b2451a87d05512cc2c3edfdf41969',
		parentInput: '.js-form-address',
		withParents: true,
		verify: true,
		labelFormat: function (obj, query) {
			var label = '';

			var name = obj.name.toLowerCase();
			query = query.name.toLowerCase();

			var start = name.indexOf(query);
			start = start > 0 ? start : 0;

			if (obj.typeShort) {
				label += '<span class="ac-s2">' + obj.typeShort + '. ' + '</span>';
			}

			if (query.length < obj.name.length) {
				label += '<span class="ac-s2">' + obj.name.substr(0, start) + '</span>';
				label += '<span class="ac-s">' + obj.name.substr(start, query.length) + '</span>';
				label += '<span class="ac-s2">' + obj.name.substr(start + query.length, obj.name.length - query.length - start) + '</span>';
			} else {
				label += '<span class="ac-s">' + obj.name + '</span>';
			}

			if (obj.parents) {
				for (var k = obj.parents.length - 1; k > -1; k--) {
					var parent = obj.parents[k];
					if (parent.name) {
						if (label) label += '<span class="ac-st">, </span>';
						label += '<span class="ac-st">' + parent.name + ' ' + parent.typeShort + '.</span>';
					}
				}
			}

			return label;
		},
		select: function (obj) {
			$(this).parent().find('label').text(obj.type);

			log(obj);
			addressUpdate();
			mapUpdate();
		},
		check: function (obj) {
			if (obj) {
				$(this).parent().find('label').text(obj.type);
			}

			log(obj);
			addressUpdate();
			mapUpdate();
		}
	});

	$region.kladr('type', $.kladr.type.region);
	$district.kladr('type', $.kladr.type.district);
	$city.kladr('type', $.kladr.type.city);
	$street.kladr('type', $.kladr.type.street);
	$building.kladr('type', $.kladr.type.building);

	$buildingAdd.change(function () {
		log(null);
		addressUpdate();
		mapUpdate();
	});

	ymaps.ready(function () {
		if (map_created) return;
		map_created = true;

		map = new ymaps.Map('map', {
			center: [55.76, 37.64],
			zoom: 12,
			controls: []
		});

		map.controls.add('zoomControl', {
			position: {
				left: 10,
				top: 10
			}
		});
	});

	function mapUpdate () {
		var zoom = 4;

		var address = $.kladr.getAddress('.js-form-address', function (objs) {
			var result = '',
				name = '',
				type = '';

			for (var i in objs) {
				if (objs.hasOwnProperty(i)) {
					if ($.type(objs[i]) === 'object') {
						name = objs[i].name;
						type = ' ' + objs[i].type;
					}
					else {
						name = objs[i];
						type = '';
					}

					if (result) result += ', ';
					result += type + name;

					zoom += 3;
				}
			}

			return result;
		});

		// Корпус
		var name = $.trim($buildingAdd.val());
		if (name) {
			if (address) address += ', ';
			address += 'корпус ' + name;
		}

		if (address && map_created) {
			var geocode = ymaps.geocode(address);
			geocode.then(function (res) {
				map.geoObjects.each(function (geoObject) {
					map.geoObjects.remove(geoObject);
				});

				var position = res.geoObjects.get(0).geometry.getCoordinates();

				placemark = new ymaps.Placemark(position, {}, {});

				map.geoObjects.add(placemark);
				map.setCenter(position, zoom);
			});
		}
	}

	function addressUpdate () {
		var address = $.kladr.getAddress('.js-form-address');

		// Корпус
		var name = $.trim($buildingAdd.val());
		if (name) {
			if (address) address += ', ';
			address += 'к. ' + name;
		}

		$('#address').text(address);
	}

	function log (obj) {
		var $log, i;

		for (i in obj) {
			$log = $('#' + i);

			if ($log.length) {
				if (obj && obj[i]) {
					$log.find('.value').text(obj[i]);
					$log.show();
				} else {
					$log.hide();
				}
			}
		}
	}
});