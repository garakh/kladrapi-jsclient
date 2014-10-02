$(function () {
	$('[name="address"]').kladr({
		oneString: true,
		select: function (obj) {
			log(obj);
		}
	});

	function log (obj) {
		var $log, i;

		$('.js-log li').hide();

		for (i in obj) {
			$log = $('#' + i);

			if ($log.length) {
				$log.find('.value').text(obj[i]);
				$log.show();
			}
		}
	}
});