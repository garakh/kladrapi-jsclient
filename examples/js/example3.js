$(function () {
	$.getKladrInputs().kladr({
		token: '51dfe5d42fb2b43e3300006e',
		key: '86a2c2a06f1b2451a87d05512cc2c3edfdf41969'
	});

	// Автодополнение населённых пунктов
	$('[name="city"]').kladr({
		type: $.kladr.type.city
	});

	// Автодополнение улиц
	$('[name="street"]').kladr({
		type: $.kladr.type.street,
		parentInput: '[name="city"]'
	});
});