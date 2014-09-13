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
		checkBefore:  null,

		source: function (query, callback) {
			$.kladr.api(query, callback);
		},

		labelFormat: function self (obj, query) {
			if (!self.key) {
				self.key = function (val) {
					var en = "qazwsxedcrfvtgbyhnujmik,ol.p;[']",
						ru = "йфяцычувскамепинртгоьшлбщдюзжхэъ",
						strNew = '',
						ch,
						index;

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
			}


			var label = '';

			var objName = obj.name.toLowerCase(),
				queryName = self.key(query.name.toLowerCase());

			var start = objName.indexOf(queryName);
			start = start > 0 ? start : 0;

			if (obj.typeShort) {
				label += obj.typeShort + '. ';
			}

			if (queryName.length < objName.length) {
				label += obj.name.substr(0, start);
				label += '<strong>' + obj.name.substr(start, queryName.length) + '</strong>';
				label += obj.name.substr(start + queryName.length, objName.length - queryName.length - start);
			} else {
				label += '<strong>' + obj.name + '</strong>';
			}

			return label;
		},

		valueFormat: function (obj, query) {
			return obj.name;
		},

		showSpinner: function ($spinner) {
			var top = -0.2,
				spinnerInterval = setInterval(function () {
					if (!$spinner.is(':visible')) {
						clearInterval(spinnerInterval);
						spinnerInterval = null;
						return;
					}

					$spinner.css('background-position', '0% ' + top + '%');

					top += 5.555556;
					if (top > 95) top = -0.2;
				}, 30);

			$spinner.show();
		},

		hideSpinner: function ($spinner) {
			$spinner.hide();
		}
	};

	var readOnlyParams = {
		current: null
	};

	var keys = {
		up:    38,
		down:  40,
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

			return undefined;
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
			return undefined;
		}

		return init(params, function () {
			var $ac = null;
			var $spinner = null;

			create(function () {
				var isActive = false;

				$input
					.attr('data-kladr-type', get('type'))
					.on('keyup.kladr', open)
					.on('keydown.kladr', keySelect)
					.on('blur.kladr', function () {
						check();
						if (!isActive) close();
					});

				$ac
					.on('touchstart.kladr click.kladr', 'li, a', mouseSelect)
					.on('touchstart.kladr mouseenter.kladr', 'li', function () {
						isActive = true;
					})
					.on('touchend.kladr mouseleave.kladr', 'li', function () {
						isActive = false;
					});
			});

			function create (callback) {
				var $container = $(document.getElementById('kladr_autocomplete'));

				if (!$container.length) {
					$container = $('<div id="kladr_autocomplete"></div>').appendTo(document.body);
				}

				var guid = get('guid');

				if (guid) {
					$ac = $container.find('.autocomplete' + guid);
					$spinner = $container.find('.spinner' + guid);

					$input.off('.kladr');
					$ac.off('.kladr');
				}
				else {
					guid = getGuid();
					set('guid', guid);

					$input.attr('autocomplete', 'off');

					$ac = $('<ul class="autocomplete' + guid + ' autocomplete" style="display: none;"></ul>')
						.appendTo($container);

					$spinner = $('<div class="spinner' + guid + ' spinner" style="display: none;"></div>')
						.appendTo($container);

					position();
				}

				callback();
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

				if ((position.top == inputOffset.top)
					&& (position.left == inputOffset.left)
					&& (position.width == inputWidth)
					&& (position.height == inputHeight)) {
					return;
				}

				position.top = inputOffset.top;
				position.left = inputOffset.left;
				position.width = inputWidth;
				position.height = inputHeight;

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

			function open (event) {
				// return on control keys
				if ((event.which > 8) && (event.which < 46))
					return;

				if (!trigger('open_before')) {
					close();
					return;
				}

				var name = $input.val();

				if (!$.trim(name)) {
					error(false);
					close();
					return;
				}

				var query = getQuery(name);

				if (!trigger('send_before', query)) {
					close();
					return;
				}

				showSpinner();
				trigger('send');

				get('source')(query, function (objs) {
					trigger('received');

					if (!$input.is(':focus')) {
						hideSpinner();
						close();
						return;
					}

					if (!$.trim($input.val()) || !objs.length) {
						hideSpinner();
						close();
						return;
					}

					render(objs, query);
					position();
					hideSpinner();

					$ac.slideDown(50);
					trigger('open');
				});
			}

			function close () {
				if (!trigger('close_before')) return;

				$ac.empty().hide();
				trigger('close');
			}

			function keySelect (event) {
				var $active = $ac.find('li.active');

				switch (event.which) {
					case keys.up:
						if ($active.length) {
							$active.removeClass('active');
							if ($active.prev().length) $active = $active.prev();
						} else {
							$active = $ac.find('li').last();
						}

						(function () {
							var acScroll = $ac.scrollTop(),
								acOffset = $ac.offset(),
								activeHeight = $active.outerHeight(),
								activeOffset = $active.offset();

							if ((activeOffset.top - acOffset.top) < 0) {
								$ac.scrollTop(acScroll - activeHeight);
							}
						})();

						$active.addClass('active');
						select();
						break;

					case keys.down:
						if ($active.length) {
							$active.removeClass('active');
							if ($active.next().length) $active = $active.next();
						} else {
							$active = $ac.find('li').first();
						}

						(function () {
							var acScroll = $ac.scrollTop(),
								acHeight = $ac.height(),
								acOffset = $ac.offset(),
								activeHeight = $active.outerHeight(),
								activeOffset = $active.offset();

							if ((activeOffset.top - acOffset.top + activeHeight) > acHeight) {
								$ac.scrollTop(acScroll + activeHeight);
							}
						})();

						$active.addClass('active');
						select();
						break;

					case keys.enter:
						close();
						break;
				}

				return undefined;
			}

			function mouseSelect () {
				var $li = $(this);

				if ($li.is('a'))
					$li = $li.parents('li');

				$li.addClass('active');

				select();
				close();
				$input.focus();

				return false;
			}

			function select () {
				if (!trigger('select_before')) return;

				var $a = $ac.find('.active a');
				if (!$a.length) return;

				$input.val($a.attr('data-val'));

				error(false);
				setCurrent($a.data('kladr-object'));
				trigger('select', get('current'));
			}

			function check () {
				if (!get('verify')) return;
				if (!trigger('check_before')) return;

				var name = $.trim($input.val());

				if (!name) {
					ret(null, false);
					return;
				}

				var query = getQuery(name);

				if (!trigger('send_before', query)) {
					ret(null, false);
					trigger('check', null);
					return;
				}

				showSpinner();
				trigger('send');

				get('source')(query, function (objs) {
					trigger('received');

					if (!$.trim($input.val())) {
						ret2(null, false);
						return;
					}

					var nameLowerCase = query.name.toLowerCase(),
						valueLowerCase = null,
						obj = null;

					for (var i in objs) {
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

					ret2(obj, !obj);
					trigger('check', obj);

					function ret2 (obj, er) {
						hideSpinner();
						ret(obj, er);
					}
				});

				function ret (obj, er) {
					error(er);
					setCurrent(obj);
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

			function showSpinner () {
				if (get('spinner')) {
					get('showSpinner')($spinner);
				}
			}

			function hideSpinner () {
				if (get('spinner')) {
					get('hideSpinner')($spinner);
				}
			}

			function getQuery (name) {
				return {
					token:       get('token'),
					key:         get('key'),
					type:        get('type'),
					name:        fixName(name),
					parentType:  get('parentType'),
					parentId:    get('parentId'),
					withParents: get('withParents'),
					limit:       get('limit')
				};
			}

			function fixName (name) {
				var noCorrect = 'abcdefghijklmnopqrstuvwxyz',
					pattern = 'Ёё',
					replace = 'Ее';

				var testName = name.toLowerCase(),
					result = '',
					ch,
					index;

				for (var i = 0; i < testName.length; i++) {
					if (noCorrect.indexOf(testName[i]) > -1) {
						error(true);
						return name;
					}

					ch = name[i];
					index = pattern.indexOf(ch);

					if (index > -1) {
						result += replace[index];
						continue;
					}

					result += ch;
				}

				error(false);
				return result;
			}

			function setCurrent (obj) {
				set('current', obj);

				if (obj && obj.id) {
					$input.attr('data-kladr-id', obj.id);
				}
			}

			function error (error) {
				error
					? $input.addClass('kladr-error')
					: $input.removeClass('kladr-error');
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

			if (params.str[1] === undefined) {
				params.isGet = true;
			}
		}

		return params;
	}

	function getGuid () {
		if (!getGuid.guid) getGuid.guid = 0;
		return ++getGuid.guid;
	}
})(jQuery);