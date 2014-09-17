$(function () {
	var $region   = $('[name="region"]');
	var $district = $('[name="district"]');
	var $city     = $('[name="city"]');
	var $street   = $('[name="street"]');
	var $building = $('[name="building"]');

	var $tooltip = $('.tooltip');

	$.kladr.setDefault({
		token: '51dfe5d42fb2b43e3300006e',
		key: '86a2c2a06f1b2451a87d05512cc2c3edfdf41969',
		parentInput: '.js-form-address',
		verify: true,
		labelFormat: function (obj, query) {
			var label = '';

			var name = obj.name.toLowerCase();
			query = query.name.toLowerCase();

			var start = name.indexOf(query);
			start = start > 0 ? start : 0;

			if (query.length < obj.name.length) {
				label += obj.name.substr(0, start);
				label += '<strong>' + obj.name.substr(start, query.length) + '</strong>';
				label += obj.name.substr(start + query.length, obj.name.length - query.length - start);
			} else {
				label += '<strong>' + obj.name + '</strong>';
			}

			if (obj.typeShort) {
				label += ' ' + obj.typeShort + '.';
			}

			return label;
		},
		select: function (obj) {
			setLabel($(this), obj.type);
			$tooltip.hide();
		},
		check: function (obj) {
			if (obj) {
				setLabel($(this), obj.type);
				$tooltip.hide();
			}
			else {
				showError($(this), 'Введено неверно');
			}
		}
	});

	$region.kladr('type', $.kladr.type.region);
	$district.kladr('type', $.kladr.type.district);
	$city.kladr('type', $.kladr.type.city);
	$street.kladr('type', $.kladr.type.street);
	$building.kladr('type', $.kladr.type.building);

	// Отключаем проверку введённых данных для строений
	$building.kladr('verify', false);

	function setLabel ($input, text) {
		text = text.charAt(0).toUpperCase() + text.substr(1).toLowerCase();
		$input.parent().find('label').text(text);
	}

	function showError ($input, message) {
		$tooltip.find('span').text(message);

		var inputOffset = $input.offset();
		var inputWidth = $input.outerWidth();
		var inputHeight = $input.outerHeight();

		var tooltipHeight = $tooltip.outerHeight();

		$tooltip.css({
			left: (inputOffset.left + inputWidth + 10) + 'px',
			top: (inputOffset.top + (inputHeight - tooltipHeight) / 2 - 1) + 'px'
		});

		$tooltip.show();
	}
});