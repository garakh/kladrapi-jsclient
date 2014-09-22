$(function () {
	var $region = $('[name="region"]'),
		$district = $('[name="district"]'),
		$city = $('[name="city"]'),
		$street = $('[name="street"]'),
		$building = $('[name="building"]');

	var map = null,
		map_created = false;

	$.kladr.setDefault({
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
				label += obj.typeShort + '. ';
			}

			if (query.length < obj.name.length) {
				label += obj.name.substr(0, start);
				label += '<strong>' + obj.name.substr(start, query.length) + '</strong>';
				label += obj.name.substr(start + query.length, obj.name.length - query.length - start);
			} else {
				label += '<strong>' + obj.name + '</strong>';
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

					switch (objs[i].contentType) {
						case $.kladr.type.region:
							zoom = 4;
							break;

						case $.kladr.type.district:
							zoom = 7;
							break;

						case $.kladr.type.city:
							zoom = 10;
							break;

						case $.kladr.type.street:
							zoom = 13;
							break;

						case $.kladr.type.building:
							zoom = 16;
							break;
					}
				}
			}

			return result;
		});

		if (address && map_created) {
			var geocode = ymaps.geocode(address);
			geocode.then(function (res) {
				map.geoObjects.each(function (geoObject) {
					map.geoObjects.remove(geoObject);
				});

				var position = res.geoObjects.get(0).geometry.getCoordinates(),
					placemark = new ymaps.Placemark(position, {}, {});

				map.geoObjects.add(placemark);
				map.setCenter(position, zoom);
			});
		}
	}

	function addressUpdate () {
		var address = $.kladr.getAddress('.js-form-address');

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