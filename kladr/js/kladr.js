(function ($, undefined) {
	var defaultOptions = {

		// Api params
		token: null,
		key: null,
		type: null,
		typeCode: null,
		parentType: null,
		parentId: null,
		limit: 10,
		oneString: false,
		withParents: false,

		// Plugin options
		parentInput: null,
		verify: false,
		spinner: true,

		// Plugin events
		open: null,
		close: null,
		send: null,
		receive: null,
		select: null,
		check: null,

		// Plugin events before actions
		openBefore: null,
		closeBefore: null,
		sendBefore: null,
		selectBefore: null,
		checkBefore: null,

		source: function (query, callback) {
			$.kladr.api(query, callback);
		},

		labelFormat: function (obj, query) {
			var objs;

			if (query.oneString) {
				if (obj.parents) {
					objs = $.extend(true, [], obj.parents);
					objs.push(obj);

					return $.kladr.buildAddress(objs);
				}

				return (obj.typeShort ? obj.typeShort + '. ' : '') + obj.name;
			}

			var label = '',
				name,
				objName,
				queryName,
				start;

			if (obj.typeShort) {
				label += obj.typeShort + '. ';
			}

			name = obj.name;
			objName = name.toLowerCase();
			queryName = query.name.toLowerCase();
			start = objName.indexOf(queryName);
			start = ~start ? start : 0;

			if (queryName.length < objName.length) {
				label += name.substr(0, start);
				label += '<strong>' + name.substr(start, queryName.length) + '</strong>';
				label += name.substr(start + queryName.length);
			} else {
				label += '<strong>' + name + '</strong>';
			}

			return label;
		},

		valueFormat: function (obj, query) {
			var objs;

			if (query.oneString) {
				if (obj.parents) {
					objs = $.extend(true, [], obj.parents);
					objs.push(obj);

					return $.kladr.buildAddress(objs);
				}

				return (obj.typeShort ? obj.typeShort + '. ' : '') + obj.name;
			}

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

					if (top > 95) {
						top = -0.2;
					}
				}, 30);

			$spinner.show();
		},

		hideSpinner: function ($spinner) {
			$spinner.hide();
		}
	};

	var readOnlyParams = {
		current: null,
		controller: null
	};

	var keys = {
		up: 38,
		down: 40,
		enter: 13
	};

	$.kladr = $.extend($.kladr, {
		setDefault: function (param1, param2) {
			var params = readParams(param1, param2);

			if (params.obj) {
				for (var i in params.obj) {
					if (hasOwn(defaultOptions, i)) {
						defaultOptions[i] = params.obj[i];
					}
				}
			}
			else if (params.str && !params.isGet && hasOwn(defaultOptions, params.str[0])) {
				defaultOptions[params.str[0]] = params.str[1];
			}
		},

		getDefault: function (param) {
			if (hasOwn(defaultOptions, param)) {
				return defaultOptions[param];
			}
		},

		getInputs: function (selector) {
			var $source = $(selector || document.body),
				inputSelector = '[data-kladr-type]';

			return $source
				.filter(inputSelector)
				.add($source.find(inputSelector));
		},

		getAddress: function (selector, build) {
			var $inputs = $.kladr.getInputs(selector),
				types = $.kladr.type,
				filtered = {},
				sorted = {},
				t;

			$inputs.each(function () {
				var $this = $(this),
					obj, objs, i;

				if ($this.attr('data-kladr-id')) {
					obj = $this.kladr('current');

					if ($this.attr('data-kladr-one-string') && obj.parents) {
						objs = $.extend(true, [], obj.parents);
						objs.push(obj);

						for (i in objs) {
							if (hasOwn(objs, i)) {
								filtered[objs[i].contentType] = objs[i];
							}
						}
					}
					else {
						filtered[$this.attr('data-kladr-type')] = obj;
					}
				}
				else {
					filtered[$this.attr('data-kladr-type')] = $this.val();
				}
			});

			for (t in types) {
				if (hasOwn(types, t) && filtered[t]) {
					sorted[t] = filtered[t];
				}
			}

			return (build || $.kladr.buildAddress)(sorted);
		},

		buildAddress: function (objs) {
			var lastIds = [],
				address = '',
				zip = '',
				name = '',
				type = '',
				i,
				j;

			forEachObjs:
				for (i in objs) {
					if (hasOwn(objs, i)) {
						if ($.type(objs[i]) === 'object') {
							for (j = 0; j < lastIds.length; j++) {
								if (lastIds[j] == objs[i].id) {
									continue forEachObjs;
								}
							}

							lastIds.push(objs[i].id);

							name = objs[i].name;
							type = objs[i].typeShort + '. ';
							zip = objs[i].zip || zip;
						}
						else {
							name = objs[i];
							type = '';
						}

						if (address) address += ', ';
						address += type + name;
					}
				}

			address = (zip ? zip + ', ' : '') + address;

			return address;
		}
	});

	$.fn.kladr = function (param1, param2) {
		var params = readParams(param1, param2),
			result = null;

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
			var dataKey = 'kladr-data',
				data = $input.data(dataKey);

			if (!data) {
				data = $.extend({}, defaultOptions, readOnlyParams);
				$input.data(dataKey, data);
			}

			return {
				set: function (params) {
					if (params.obj) {
						for (var i in params.obj) {
							if (hasOwn(params.obj, i) && hasOwn(defaultOptions, i)) {
								data[i] = params.obj[i];
							}
						}
					}
					else if (params.str && !params.isGet && hasOwn(defaultOptions, params.str[0])) {
						data[params.str[0]] = params.str[1];
					}

					$input.data(dataKey, data);
				},

				get: function (param) {
					if (hasOwn(defaultOptions, param) || hasOwn(readOnlyParams, param)) {
						return data[param];
					}
				},

				_set: function (param, value) {
					data[param] = value;
					$input.data(dataKey, data);
				},

				_get: function (param) {
					if (hasOwn(data, param)) {
						return data[param];
					}
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

		return init(params, function () {
			var $ac = null,
				$spinner = null,
				eventNamespace = '.kladr';

			create(function () {
				var isActive = false;

				$input
					.attr('data-kladr-type', get('type') || '')
					.attr('data-kladr-one-string', get('oneString') || null)
					.on('keyup' + eventNamespace, open)
					.on('keydown' + eventNamespace, keySelect)
					.on('blur' + eventNamespace + ' change' + eventNamespace, function () {
						if (!isActive) {
							check();
							close();
						}
					});

				$ac
					.on('touchstart' + eventNamespace + ' click' + eventNamespace, 'li, a', function () {
						isActive = true;
						mouseSelect.call(this);
						isActive = false;
					})
					.on('mouseenter' + eventNamespace, function () {
						isActive = true;
					})
					.on('mouseleave' + eventNamespace, function () {
						isActive = false;
					});

				$(window)
					.on('resize' + eventNamespace, position);
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

					$(window).off(eventNamespace);
					$input.off(eventNamespace);
					$ac.off(eventNamespace);
				}
				else {
					guid = getGuid();
					set('guid', guid);

					$input.attr('autocomplete', 'off');

					$ac = $('<ul class="autocomplete' + guid + ' autocomplete" style="display: none;"></ul>')
						.appendTo($container);

					$spinner = $('<div class="spinner' + guid + ' spinner" style="display: none;"></div>')
						.appendTo($container);

					createController();

					position();
					checkAutoFill();
				}

				callback();
			}

			function render (objs, query) {
				var obj, value, label, $a;

				$ac.empty();

				for (var i in objs) {
					if (hasOwn(objs, i)) {
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
					top: inputOffset.top + inputHeight + 'px',
					left: inputOffset.left
				});

				var differ = $ac.outerWidth() - $ac.width();
				$ac.width(inputWidth - differ);

				var spinnerWidth = $spinner.width(),
					spinnerHeight = $spinner.height();

				$spinner.css({
					top: inputOffset.top + (inputHeight - spinnerHeight) / 2 - 1,
					left: inputOffset.left + inputWidth - spinnerWidth - 2
				});
			}

			function open (event) {
				// return on control keys
				if ((event.which > 8) && (event.which < 46)) {
					return;
				}

				if (!trigger('open_before')) {
					close();
					return;
				}

				setCurrent(null);

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
					trigger('receive');

					if (!$input.is(':focus')) {
						hideSpinner();
						close();
						return;
					}

					if (!$.trim($input.val()) || !objs.length) {
						hideSpinner();
						setCurrent(null);
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
				if (!trigger('close_before')) {
					return;
				}

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
			}

			function mouseSelect () {
				var $li = $(this);

				if ($li.is('a')) {
					$li = $li.parents('li');
				}

				$li.addClass('active');

				select();
				close();
				$input.focus();

				return false;
			}

			function select () {
				if (!trigger('select_before')) {
					return;
				}

				var $a = $ac.find('.active a');
				if (!$a.length) {
					return;
				}

				$input.val($a.attr('data-val'));

				error(false);
				setCurrent($a.data('kladr-object'));
				trigger('select', get('current'));
			}

			function check () {
				if (!get('verify')) {
					return;
				}

				if (!trigger('check_before')) {
					return;
				}

				var name = $.trim($input.val());

				if (!name) {
					ret(null, false);
					trigger('check', null);
					return;
				}

				if (get('current')) {
					error(false);
					return;
				}

				var query = getQuery(name);

				query.withParents = false;
				query.limit = 10;

				if (!trigger('send_before', query)) {
					ret(null, false);
					trigger('check', null);
					return;
				}

				showSpinner();
				trigger('send');

				get('source')(query, function (objs) {
					trigger('receive');

					if (!$.trim($input.val())) {
						ret2(null, false);
						return;
					}

					var nameLowerCase = query.name.toLowerCase(),
						valueLowerCase = null,
						obj = null;

					for (var i in objs) {
						if (hasOwn(objs, i)) {
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

			function createController () {
				var controller = {

					setValue: function (value) {
						if ($.type(value) === 'object') {
							return controller.setValueByObject(value);
						}

						if ($.type(value) === 'number') {
							return controller.setValueById(value);
						}

						if ($.type(value) === 'string') {
							return controller.setValueByName(value);
						}

						if (!value) {
							return controller.clear();
						}

						return controller;
					},

					setValueByName: function (name) {
						name = $.trim(name + '');

						if (name) {
							var query = getQuery('');

							query.name = fixName(name);
							query.withParents = false;
							query.limit = 10;

							if (!trigger('send_before', query)) {
								changeValue(null, query);
								return controller;
							}

							trigger('send');

							get('source')(query, function (objs) {
								trigger('receive');

								var nameLowerCase = query.name.toLowerCase(),
									valueLowerCase = null,
									obj = null;

								for (var i in objs) {
									if (hasOwn(objs, i)) {
										valueLowerCase = objs[i].name.toLowerCase();

										if (nameLowerCase == valueLowerCase) {
											obj = objs[i];
											break;
										}
									}
								}

								changeValue(obj, query);
							});
						}

						return controller;
					},

					setValueById: function (id) {
						var query = getQuery('');

						query.parentType = query.type;
						query.parentId = id;
						query.limit = 1;

						$.kladr.api(query, function (objs) {
							if (objs.length) {
								changeValue(objs[0], query);
							}
						});

						return controller;
					},

					setValueByObject: function (obj) {
						changeValue(obj, getQuery(''));
						return controller;
					},

					clear: function () {
						changeValue(null, null);
						return controller;
					}
				};

				function changeValue(obj, query) {
					$input.val(obj ? get('valueFormat')(obj, query) : '');
					setCurrent(obj);
				}

				set('controller', controller);
			}

			function checkAutoFill () {
				var count = 0;

				(function test () {
					if (++count > 5 || isFilled()) {
						return;
					}

					setTimeout(test, 100);
				})();

				function isFilled () {
					var name = $input.val();

					if (name) {
						var query = getQuery(name),
							queryType = query.type,
							queryParentType = query.parentType,
							type = $.kladr.type,
							parentFilled = true;

						// Crutch for street input
						if (queryType == type.street && queryParentType != type.city) {
							parentFilled = false;
						}

						// Crutch for building input
						if (queryType == type.building && queryParentType != type.street) {
							parentFilled = false;
						}

						parentFilled && check();
						return !!get('current');
					}

					return false;
				}
			}

			function trigger (event, obj) {
				if (!event) {
					return true;
				}

				var eventProp = event.replace(/_([a-z])/ig, function (all, letter) {
					return letter.toUpperCase();
				});

				$input.trigger('kladr_' + event, obj);

				if ($.type(get(eventProp)) === 'function') {
					return get(eventProp).call($input.get(0), obj) !== false;
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
				var query = {},
					fields = [
						'token',
						'key',
						'type',
						'typeCode',
						'parentType',
						'parentId',
						'oneString',
						'withParents',
						'limit'
					],
					i;

				for (i = 0; i < fields.length; i++) {
					query[fields[i]] = get(fields[i]);
				}

				query.name = fixName(name);

				var parentInput = get('parentInput'),
					parent;

				if (parentInput) {
					parent = getParent(parentInput, query.type);

					if (parent) {
						query.parentType = parent.type;
						query.parentId = parent.id;
					}
				}

				// one string search crutch
				if (query.oneString) {
					query.withParents = true;
				}

				return query;
			}

			function getParent (selector, type) {
				var $inputs = $.kladr.getInputs(selector),
					types = $.kladr.type,
					parents = {},
					parent = null,
					t;

				$inputs.each(function () {
					var $this = $(this),
						id;

					if (id = $this.attr('data-kladr-id')) {
						parents[$this.attr('data-kladr-type')] = id;
					}
				});

				for (t in types) {
					if (t == type) {
						return parent;
					}

					if (hasOwn(types, t) && parents[t]) {
						parent = {
							type: t,
							id: parents[t]
						}
					}
				}

				return parent;
			}

			function fixName (name) {
				var noCorrect = 'abcdefghijklmnopqrstuvwxyz',
					testName = name.toLowerCase();

				for (var i = 0; i < testName.length; i++) {
					if (~noCorrect.indexOf(testName[i])) {
						error(true);
						return name;
					}
				}

				error(false);
				return name;
			}

			function setCurrent (obj) {
				set('current', obj);

				if (obj && obj.id) {
					$input.attr('data-kladr-id', obj.id);
				} else {
					$input.removeAttr('data-kladr-id');
				}

				if (get('oneString')) {
					if (obj && obj.contentType) {
						$input.attr('data-kladr-type', obj.contentType);
					}
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
			obj: false,
			str: false,
			isGet: false
		};

		if ($.type(param1) === 'object') {
			params.obj = param1;
			return params;
		}

		if ($.type(param1) === 'string') {
			params.str = arguments;
			params.isGet = (arguments[1] === undefined);
		}

		return params;
	}

	function getGuid () {
		return getGuid.guid
			? ++getGuid.guid
			: getGuid.guid = 1;
	}

	function hasOwn (obj, property) {
		return obj.hasOwnProperty(property);
	}
})(jQuery);