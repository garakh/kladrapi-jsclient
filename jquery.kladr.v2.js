(function ($) {
	$.kladr = {};

	// Service URL
	$.kladr.url = 'http://kladr-api.ru/api.php';

	// Enum KLADR object types
	$.kladr.type = {
		region:   'region',
		district: 'district',
		city:     'city',
		street:   'street',
		building: 'building'
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
				if (query.parentType != $.kladr.type.street) {
					error('parentType must equal "street"');
					return false;
				}
				if (!query.parentId) {
					error('parentId undefined');
					return false;
				}
				break;
			default:
				error('type incorrect');
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
				def.resolve(data.result);
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
				name:        'query',
				withParents: 'withParent',
				limit:       'limit'
			};

		if (query.parentType && query.parentId) {
			params[query.parentType + 'Id'] = query.parentId;
		}

		for (var i in query) {
			if (query.hasOwnProperty(i) && fields.hasOwnProperty(i) && query[i]) {
				params[fields[i]] = query[i];
			}
		}

		return params;
	}

	function error (error) {
		window.console && window.console.error && window.console.error(error);
	}
})(jQuery);

(function ($, undefined) {
	var defaultOptions = {

		// Api params
		token:        null,
		key:          null,
		type:         null,
		parentType:   null,
		parentId:     null,
		limit:        10,
		withParents:  false,

		// Plugin options
		verify:       false,
		spinner:      true,

		// Plugin events
		open:         null,
		close:        null,
		send:         null,
		received:     null,
		select:       null,
		check:        null,

		// Plugin events before actions
		openBefore:   null,
		closeBefore:  null,
		sendBefore:   null,
		selectBefore: null,

		source: function (query, callback) {

		},

		labelFormat: function (obj, query) {

		},

		valueFormat: function (obj, query) {

		},

		showSpinner: function () {

		},

		hideSpinner: function () {

		}
	};

	var readOnlyParams = {
		current: null
	};

	var keys = {
		up:    38,
		down:  40,
		esc:   27,
		enter: 13
	};

	$.fn.kladr = function (param1, param2) {
		var params = readParams(param1, param2),
			result = undefined;

		this.each(function () {
			var res = kladr($(this), params);

			if (params.isGet) {
				result = res;
				return false;
			}
		});

		if (params.isGet) {
			return result;
		}

		return this;
	};

	function kladr ($input, params) {
		var options = (function () {
			var data = $input.data('kladr-data');

			if (!data) {
				data = $.extend({}, defaultOptions, readOnlyParams);
				$input.data('kladr-data', data);
			}

			return {
				set: function (params) {
					if (params.obj) {
						for (var i in params.obj) {
							if (params.obj.hasOwnProperty(i) && defaultOptions.hasOwnProperty(i)) {
								data[i] = params.obj[i];
							}
						}
					}
					else if (params.str && params.str.length > 1 && defaultOptions.hasOwnProperty(params.str[0])) {
						data[params.str[0]] = params.str[1];
					}

					$input.data('kladr-data', data);
				},

				get: function (param) {
					if (defaultOptions.hasOwnProperty(param) || readOnlyParams.hasOwnProperty(param)) {
						return data[param];
					}

					return undefined;
				},

				_set: function (param, value) {
					data[param] = value;
					$input.data('kladr-data', data);
				},

				_get: function (param) {
					if (data.hasOwnProperty(param)) {
						return data[param];
					}

					return undefined;
				}
			};
		})();

		function init (params, callback) {
			if (params.isGet) {
				return options.get(params.str[0]);
			}

			options.set(params);
			callback();
		}

		init(params, function () {
			var $ac = null;
			var $spinner = null;

			function create () {
				var $container = $(document.getElementById('kladr-autocomplete'));

				if (!$container.length) {
					$container = $('<div id="kladr_autocomplete"></div>').appendTo(document.body);
				}

				var guid = get('guid');

				if (guid) {
					$ac = $container.find('.autocomplete' + guid);
					$spinner = $container.find('.spinner' + guid);
				}
				else {
					guid = getGuid();
					set('guid', guid);

					$input.attr('autocomplete', 'off');

					$ac = $('<ul class="autocomplete' + guid + ' autocomplete" style="display: none;"></ul>')
						.appendTo($container);

					$spinner = $('<div class="spinner' + guid + ' spinner" style="display: none;"></div>')
						.appendTo($container);
				}
			}

			function render (objs, query) {
				var obj, value, label, $a;

				$ac.empty();

				for (var i in objs) {
					if (objs.hasOwnProperty(i)) {
						obj = objs[i];
						value = get('valueFormat')(obj, query);
						label = get('labelFormat')(obj, query);

						$a = $('<a data-val="' + value + '">' + label + '</a>');
						$a.data('kladr-object', obj);

						$('<li></li>')
							.append($a)
							.appendTo($ac);
					}
				}
			}

			function position () {
				var inputOffset = $input.offset(),
					inputWidth = $input.outerWidth(),
					inputHeight = $input.outerHeight();

				$ac.css({
					top:  inputOffset.top + inputHeight + 'px',
					left: inputOffset.left
				});

				var differ = $ac.outerWidth() - $ac.width();
				$ac.width(inputWidth - differ);

				var spinnerWidth = $spinner.width(),
					spinnerHeight = $spinner.height();

				$spinner.css({
					top:  inputOffset.top + (inputHeight - spinnerHeight) / 2 - 1,
					left: inputOffset.left + inputWidth - spinnerWidth - 2
				});
			}

			function open () {
				if (!trigger('open-before')) {
					close();
					return;
				}

				var name = $input.val();

				if (!$.trim(name)) {
					close();
					return;
				}

				var query = getQuery(name);

				if (!trigger('send-before', query)) {
					close();
					return;
				}

				get('showSpinner')();
				trigger('send');

				get('source')(query, function (objs) {
					get('hideSpinner')();
					trigger('received');

					if (!$input.is(':focus')) {
						close();
						return;
					}

					if (!$.trim($input.val()) || !objs.length) {
						close();
						return;
					}

					render(objs, query);
					position();
					$ac.slideDown(50);
					trigger('open');
				});
			}

			function close () {
				if (!trigger('close-before')) return;

//				select();
				$ac.hide();
				trigger('close');
			}

			function select () {
				if (!trigger('select-before')) return;

				var $a = $ac.find('.active a');
				if (!$a.length) return;

				$input.val($a.attr('data-val'));
				set('current', $a.data('kladr-object'));

				trigger('select', get('current'));
			}

			function check () {
				if (!options.verify) return;

				var name = $.trim($input.val());

				if (!name) {
					ret(null);
					return;
				}

				var query = getQuery(name);

				if (!trigger('send-before', query)) {
					ret(null);
					return;
				}

				get('showSpinner')();
				trigger('send');

				get('source')(query, function (objs) {
					get('hideSpinner')();
					trigger('received');

					if (!$.trim($input.val())) {
						ret(null);
						return;
					}

					var nameLowerCase = query.name.toLowerCase(),
						valueLowerCase = null,
						obj = null;

					for (var i = 0; i < objs.length; i++) {
						if (objs.hasOwnProperty(i)) {
							valueLowerCase = objs[i].name.toLowerCase();

							if (nameLowerCase == valueLowerCase) {
								obj = objs[i];
								break;
							}
						}
					}

					if (obj) {
						$input.val(get('valueFormat')(obj, query));
					}

					ret(obj);
				});

				function ret(obj) {
					set('current', obj);
					trigger('check', obj);
				}
			}

			function trigger (event, obj) {
				if (!event) return true;

				var eventProp = event.replace(/_([a-z])/ig, function (all, letter) {
					return letter.toUpperCase();
				});

				$input.trigger('kladr_' + event, obj);

				if ($.type(get(eventProp)) === 'function') {
					return get(eventProp).call($input.get(0), obj);
				}

				return true;
			}

			function getQuery (name) {
				return {
					token:       get('token'),
					key:         get('key'),
					type:        get('type'),
					name:        name,
					parentType:  get('parentType'),
					parentId:    get('parentId'),
					withParents: get('withParents'),
					limit:       get('limit')
				};
			}

			function get (param) {
				return options._get(param);
			}

			function set (param, value) {
				options._set(param, value);
			}
		});
	}

	function readParams (param1, param2) {
		var params = {
			obj:   false,
			str:   false,
			isGet: false
		};

		if ($.type(param1) === 'object') {
			params.obj = param1;
			return params;
		}

		if ($.type(param1) === 'string') {
			params.str = [];
			for (var i in arguments) {
				if (arguments.hasOwnProperty(i)) {
					params.str[i] = arguments[i];
				}
			}

			if (params.str.length == 1) {
				params.isGet = true;
			}
		}

		return params;
	}

	function getGuid () {
		if (!getGuid.guid) getGuid.guid = 0;
		return getGuid.guid++;
	}














	// Old plugin
	$.fn._kladr = function (param1, param2) {

		var result = undefined;
		this.each(function () {
			var res = kladr($(this), param1, param2);
			if (result == undefined) result = res;
		});

		return result;

		function kladr (input, param1, param2) {
			var ac = null;
			var spinner = null;

			var options = null;
			var defaultOptions = {
				token:       null,
				key:         null,
				type:        null,
				parentType:  null,
				parentId:    null,
				limit:       10,
				withParents: false,
				verify:      false,
				showSpinner: true,
				arrowSelect: true,
				current:     null,

				open:     null,
				close:    null,
				send:     null,
				received: null,
				select:   null,
				check:    null,

				source: function (query, callback) {
					var params = {
						token:       options.token,
						key:         options.token,
						type:        options.type,
						name:        query,
						parentType:  options.parentType,
						parentId:    options.parentId,
						withParents: options.withParents,
						limit:       options.limit
					};

					$.kladr.api(params, callback);
				},

				labelFormat: function (obj, query) {
					var label = '';

					var name = obj.name.toLowerCase();
					query = query.toLowerCase();

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

				valueFormat: function (obj, query) {
					return obj.name;
				}
			};

			var keys = {
				up:    38,
				down:  40,
				esc:   27,
				enter: 13
			};

			var spinnerInterval = null;

			return init(param1, param2, function () {
				var isActive = false;

				create();
				position();

				// Subscribe on input events
				input
					.on('keyup', open)
					.on('keydown', keyselect)
					.on('change', function () {
						if (!isActive) change();
					})
					.on('blur', function () {
						if (!isActive) close();
					});

				// Subscribe on autocomplete list events
				ac
					.on('click', 'li, a', mouseselect)
					.on('touchstart mouseenter', 'li', function () {
						var $this = $(this);

						ac.find('li.active').removeClass('active');
						$this.addClass('active');

						var obj = $this.find('a').data('kladr-object');
						trigger('preselect', obj);

						isActive = true;
					})
					.on('touchleave mouseleave', 'li', function () {
						$(this).removeClass('active');
						isActive = false;
					});

				// Subscribe on window events
				$(window)
					.on('resize', position);
			});

			function init (param1, param2, callback) {
				options = input.data('kladr-options');

				if (param2 !== undefined) {
					options[param1] = param2;
					input.data('kladr-options', options);
					return input;
				}

				if ($.type(param1) === 'string') {
					if (!options) return null;
					return options[param1];
				}

				if (options) {
					return input;
				}

				options = defaultOptions;
				if ($.type(param1) === 'object') {
					for (var i in param1) {
						options[i] = param1[i];
					}
				}

				input.data('kladr-options', options);
				callback && callback();
				return input;
			}

			function create () {
				var container = $(document.getElementById('kladr_autocomplete'));
				var inputName = input.attr('name');

				if (!container.length) {
					container = $('<div id="kladr_autocomplete"></div>').appendTo('body');
				}

				input.attr('autocomplete', 'off');

				ac = $('<ul class="kladr_autocomplete_' + inputName + '" style="display: none;"></ul>');
				ac.appendTo(container);

				spinner = $('<div class="spinner kladr_autocomplete_' + inputName + '_spinner" class="spinner" style="display: none;"></div>');
				spinner.appendTo(container);
			}

			function render (objs, query) {
				ac.empty();
				for (var i in objs) {
					var obj = objs[i];
					var value = options.valueFormat(obj, query);
					var label = options.labelFormat(obj, query);

					var a = $('<a data-val="' + value + '">' + label + '</a>');
					a.data('kladr-object', obj);

					var li = $('<li></li>').append(a);
					li.appendTo(ac);
				}
			}

			function position () {
				var inputOffset = input.offset();
				var inputWidth = input.outerWidth();
				var inputHeight = input.outerHeight();

				ac.css({
					top:  inputOffset.top + inputHeight + 'px',
					left: inputOffset.left
				});

				var differ = ac.outerWidth() - ac.width();
				ac.width(inputWidth - differ);

				var spinnerWidth = spinner.width();
				var spinnerHeight = spinner.height();

				spinner.css({
					top:  inputOffset.top + (inputHeight - spinnerHeight) / 2 - 1,
					left: inputOffset.left + inputWidth - spinnerWidth - 2,
				});
			}

			function open (event) {
				// return on keyup control keys
				if ((event.which > 8) && (event.which < 46)) return;

				if (!validate()) return;

				var query = key(input.val());
				if (!$.trim(query)) {
					close();
					return;
				}

				spinnerShow();
				trigger('send');

				options.source(query, function (objs) {
					spinnerHide();
					trigger('received');

					if (!input.is(':focus')) {
						close();
						return;
					}

					if (!$.trim(input.val()) || !objs.length) {
						close();
						return;
					}

					render(objs, query);
					position();
					ac.slideDown(50);
					trigger('open');
				});
			}

			function close () {
				select();
				ac.hide();
				trigger('close');
			}

			function validate () {
				switch (options.type) {
					case $.kladr.type.region:
					case $.kladr.type.district:
					case $.kladr.type.city:
						if (options.parentType && !options.parentId) {
							console.error('parentType is defined and parentId in not');
							return false;
						}
						break;
					case $.kladr.type.street:
						if (options.parentType != $.kladr.type.city) {
							console.error('For street parentType must equal "city"');
							return false;
						}
						if (!options.parentId) {
							console.error('For street parentId must defined');
							return false;
						}
						break;
					case $.kladr.type.building:
						if (options.parentType != $.kladr.type.street) {
							console.error('For building parentType must equal "street"');
							return false;
						}
						if (!options.parentId) {
							console.error('For building parentId must defined');
							return false;
						}
						break;
					default:
						console.error('type must defined and equal "region", "district", "city", "street" or "building"');
						return false;
				}

				if (options.limit < 1) {
					console.error('limit must greater than 0');
					return false;
				}

				return true;
			}

			function select () {
				var a = ac.find('.active a');
				if (!a.length) return;

				input.val(a.attr('data-val'));
				options.current = a.data('kladr-object');
				input.data('kladr-options', options);
				trigger('select', options.current);
			}

			function keyselect (event) {
				var active = ac.find('li.active');
				switch (event.which) {
					case keys.up:
						if (active.length) {
							active.removeClass('active');
							active = active.prev();
						} else {
							active = ac.find('li').last();
						}
						active.addClass('active');

						var obj = active.find('a').data('kladr-object');
						trigger('preselect', obj);

						if (options.arrowSelect) select();
						break;
					case keys.down:
						if (active.length) {
							active.removeClass('active');
							active = active.next();
						} else {
							active = ac.find('li').first();
						}
						active.addClass('active');

						var obj = active.find('a').data('kladr-object');
						trigger('preselect', obj);

						if (options.arrowSelect) select();
						break;
					case keys.esc:
						active.removeClass('active');
						close();
						break;
					case keys.enter:
						if (!options.arrowSelect) select();
						active.removeClass('active');
						close();
						return false;
				}
			}

			function mouseselect () {
				close();
				input.focus();
				return false;
			}

			function change () {
				if (!options.verify) return;

				if (!validate()) {
					options.current = null;
					input.data('kladr-options', options);
					trigger('check', options.current);
					return;
				}

				var query = key(input.val());
				if (!$.trim(query)) {
					options.current = null;
					input.data('kladr-options', options);
					trigger('check', options.current);
					return;
				}

				spinnerShow();
				trigger('send');

				options.source(query, function (objs) {
					spinnerHide();
					trigger('received');

					var obj = null;
					for (var i = 0; i < objs.length; i++) {
						var queryLowerCase = query.toLowerCase();
						var nameLowerCase = objs[i].name.toLowerCase();
						if (queryLowerCase == nameLowerCase) {
							obj = objs[i];
							break;
						}
					}

					if (obj) input.val(options.valueFormat(obj, query));

					options.current = obj;
					input.data('kladr-options', options);
					trigger('check', options.current);
				})
			}

			function key (val) {
				var en = "1234567890qazwsxedcrfvtgbyhnujmik,ol.p;[']- " +
					"QAZWSXEDCRFVTGBYHNUJMIK<OL>P:{\"} ";

				var ru = "1234567890йфяцычувскамепинртгоьшлбщдюзжхэъ- " +
					"ЙФЯЦЫЧУВСКАМЕПИНРТГОЬШЛБЩДЮЗЖХЭЪ ";

				var strNew = '';
				var ch;
				var index;
				for (var i = 0; i < val.length; i++) {
					ch = val[i];
					index = en.indexOf(ch);

					if (index > -1) {
						strNew += ru[index];
						continue;
					}

					strNew += ch;
				}

				return strNew;
			}

			function trigger (event, obj) {
				if (!event) return;
				input.trigger('kladr_' + event, obj);
				if (options[event]) options[event].call(input.get(0), obj);
			}

			function spinnerStart () {
				if (spinnerInterval) return;

				var top = -0.2;
				spinnerInterval = setInterval(function () {
					if (!spinner.is(':visible')) {
						clearInterval(spinnerInterval);
						spinnerInterval = null;
						return;
					}

					spinner.css('background-position', '0% ' + top + '%');

					top += 5.555556;
					if (top > 95) top = -0.2;
				}, 30);
			}

			function spinnerShow () {
				if (options.showSpinner) {
					spinner.show();
					spinnerStart();
				}
			}

			function spinnerHide () {
				spinner.hide();
			}
		}
	}
})(jQuery);