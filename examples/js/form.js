$(function () {
	var $region   = $('[name="region"]');
	var $district = $('[name="district"]');
	var $city     = $('[name="city"]');
	var $street   = $('[name="street"]');
	var $building = $('[name="building"]');

	var $tooltip = $('.tooltip');

	$.kladr.setDefault({
		parentInput: '.js-form-address',
		verify: true,
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