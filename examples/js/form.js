$(function () {
	var $zip      = $('[name="zip"]'),
		$region   = $('[name="region"]'),
		$district = $('[name="district"]'),
		$city     = $('[name="city"]'),
		$street   = $('[name="street"]'),
	 	$building = $('[name="building"]');

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

	// Поиск по почтовому индексу
	$zip.keyup(function () {
		$.kladr.api({
			type: $.kladr.type.building,
			zip: $zip.val(),
			withParents: true,
			limit: 1
		}, function (objs) {
			var obj = objs.length && objs[0], i, $input, source;
			objs = [];

			if (obj) {
				if (obj.parents) {
					objs = $.extend(true, [], obj.parents);
				}

				objs.push(obj);

				for (i in objs) {
					$input = $('[data-kladr-type="' + objs[i].contentType + '"]');
					source = $input.kladr('source');

					(function () {
						var o = objs[i];

						$input
							.val(o.name)
							.kladr('source', function (query, callback) {
								callback([o]);
							});
					})();

					$input.trigger('blur');
					$input.kladr('source', source);
				}
			}
		});
	});

	function setLabel ($input, text) {
		text = text.charAt(0).toUpperCase() + text.substr(1).toLowerCase();
		$input.parent().find('label').text(text);
	}

	function showError ($input, message) {
		$tooltip.find('span').text(message);

		var inputOffset = $input.offset(),
			inputWidth = $input.outerWidth(),
			inputHeight = $input.outerHeight();

		var tooltipHeight = $tooltip.outerHeight();

		$tooltip.css({
			left: (inputOffset.left + inputWidth + 10) + 'px',
			top: (inputOffset.top + (inputHeight - tooltipHeight) / 2 - 1) + 'px'
		});

		$tooltip.show();
	}
});