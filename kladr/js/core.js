(function ($, window) {
	$.kladr = {};

	(function () {
		var protocol = window.location.protocol == 'https:' ? 'https:' : 'http:';

		// Service URL
		$.kladr.url = protocol + '//kladr-api.ru/api.php';
	})();

	// Enum KLADR object types
	$.kladr.type = {
		region:   'region',   // Область
		district: 'district', // Район
		city:     'city',     // Город
		street:   'street',   // Улица
		building: 'building'  // Строение
	};

	// Enum city object types
	$.kladr.typeCode = {
		city:       1, // Город
		settlement: 2, // Посёлок
		village:    4  // Деревня
	};

	// Validate query
	$.kladr.validate = function (query) {
		var type = $.kladr.type;

		switch (query.type) {
			case type.region:
			case type.district:
			case type.city:
				if (query.parentType && !query.parentId) {
					error('parentId undefined');
					return false;
				}
				break;
			case type.street:
				if (query.parentType != type.city) {
					error('parentType must equal "city"');
					return false;
				}
				if (!query.parentId) {
					error('parentId undefined');
					return false;
				}
				break;
			case type.building:
				if (!query.zip) {
					if (!~$.inArray(query.parentType, [type.street, type.city])) {
						error('parentType must equal "street" or "city"');
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

		if (query.typeCode && (query.type != type.city)) {
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

		var timeout = setTimeout(function () {
			callback([]);
			timeout = null;
		}, 3000);

		$.getJSON($.kladr.url + "?callback=?",
			toApiFormat(query),
			function (data) {
				if (timeout) {
					callback(data.result || []);
					clearTimeout(timeout);
				}
			}
		);
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
			objs && objs.length
				? callback(objs[0])
				: callback(false);
		});
	};

	function toApiFormat(query) {
		var params = {},
			fields = {
				type:        'contentType',
				name:        'query',
				withParents: 'withParent'
			};

		if (query.parentType && query.parentId) {
			params[query.parentType + 'Id'] = query.parentId;
		}

		for (var key in query) {
			if (hasOwn(query, key) && query[key]) {
				params[hasOwn(fields, key) ? fields[key] : key] = query[key];
			}
		}

		return params;
	}

	function hasOwn(obj, property) {
		return obj.hasOwnProperty(property);
	}

	function error(error) {
		var console = window.console;

		console && console.error && console.error(error);
	}
})(jQuery, window);