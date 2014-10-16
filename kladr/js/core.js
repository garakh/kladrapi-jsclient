(function ($) {
	$.kladr = {};

	// Service URL
	$.kladr.url = 'http://kladr-api.ru/api.php';

	// Enum KLADR object types
	$.kladr.type = {
		region:   'region',  // Область
		district: 'district',// Район
		city:     'city',    // Город
		street:   'street',  // Улица
		building: 'building' // Строение
	};

	// Enum city object types
	$.kladr.typeCode = {
		city:       1, // Город
		settlement: 2, // Посёлок
		village:    4  // Деревня
	};

	// Validate query
	$.kladr.validate = function (query) {
		switch (query.type) {
			case $.kladr.type.region:
			case $.kladr.type.district:
			case $.kladr.type.city:
				if (query.parentType && !query.parentId) {
					error('parentId undefined');
					return false;
				}
				break;
			case $.kladr.type.street:
				if (query.parentType != $.kladr.type.city) {
					error('parentType must equal "city"');
					return false;
				}
				if (!query.parentId) {
					error('parentId undefined');
					return false;
				}
				break;
			case $.kladr.type.building:
				if (!query.zip) {
					if (query.parentType != $.kladr.type.street) {
						error('parentType must equal "street"');
						return false;
					}
					if (!query.parentId) {
						error('parentId undefined');
						return false;
					}
				}
				break;
			default:
				if (!query.oneString) {
					error('type incorrect');
					return false;
				}
				break;
		}

		if (query.oneString && query.parentType && !query.parentId) {
			error('parentId undefined');
			return false;
		}

		if (query.typeCode && (query.type != $.kladr.type.city)) {
			error('type must equal "city"');
			return false;
		}

		if (query.limit < 1) {
			error('limit must greater than 0');
			return false;
		}

		return true;
	};

	// Send query to service
	$.kladr.api = function (query, callback) {
		if (!callback) {
			error('Callback undefined');
			return;
		}

		if (!$.kladr.validate(query)) {
			callback([]);
			return;
		}

		var def = $.Deferred();

		def.done(callback);
		def.fail(function (er) {
			error(er);
			callback([]);
		});

		$.getJSON($.kladr.url + "?callback=?",
			toApiFormat(query),
			function (data) {
				def.resolve(data.result || []);
			}
		);

		setTimeout(function () {
			def.reject('Request error');
		}, 3000);
	};

	// Check exist object
	$.kladr.check = function (query, callback) {
		if (!callback) {
			error('Callback undefined');
			return;
		}

		query.withParents = false;
		query.limit = 1;

		$.kladr.api(query, function (objs) {
			if (objs && objs.length) {
				callback(objs[0]);
			} else {
				callback(false);
			}
		});
	};

	function toApiFormat (query) {
		var params = {},
			fields = {
				token:       'token',
				key:         'key',
				type:        'contentType',
				typeCode:    'typeCode',
				name:        'query',
				zip:         'zip',
				withParents: 'withParent',
				oneString:   'oneString',
				limit:       'limit'
			};

		if (query.parentType && query.parentId) {
			params[query.parentType + 'Id'] = query.parentId;
		}

		for (var i in query) {
			if (hasOwn(query, i) && hasOwn(fields, i) && query[i]) {
				params[fields[i]] = query[i];
			}
		}

		return params;
	}

	function hasOwn(obj, property) {
		return obj.hasOwnProperty(property);
	}

	function error (error) {
		window.console && window.console.error && window.console.error(error);
	}
})(jQuery);