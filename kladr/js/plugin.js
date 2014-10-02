(function ($, undefined) {
	var defaultOptions = {

		// Api params
		token:        null,
		key:          null,
		type:         null,
		typeCode:     null,
		parentType:   null,
		parentId:     null,
		limit:        10,
		oneString:    false,
		withParents:  false,

		// Plugin options
		parentInput:  null,
		verify:       false,
		spinner:      true,

		// Plugin events
		open:         null,
		close:        null,
		send:         null,
		receive:      null,
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
			start = start > 0 ? start : 0;

			if (queryName.length < objName.length) {
				label += name.substr(0, start);
				label += '<strong>' + name.substr(start, queryName.length) + '</strong>';
				label += name.substr(start + queryName.length, objName.length - queryName.length - start);
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

	$.kladr = $.extend($.kladr, {
		setDefault: function (param1, param2) {
			var params = readParams(param1, param2);

			if (params.obj) {
				for (var i in params.obj) {
					if (defaultOptions.hasOwnProperty(i)) {
						defaultOptions[i] = params.obj[i];
					}
				}
			}
			else if (params.str && !params.isGet && defaultOptions.hasOwnProperty(params.str[0])) {
				defaultOptions[params.str[0]] = params.str[1];
			}
		},

		getDefault: function (param) {
			if (defaultOptions.hasOwnProperty(param)) {
				return defaultOptions[param];
			}

			return undefined;
		},

		getTypes: function () {
			return $.kladr.type;
		},

		getInputs: function (selector) {
			var $inputs = $(),
				inputSelector = '[data-kladr-type]';

			$(selector || document.body)
				.each(function () {
					var $el = $(this);

					$inputs = $inputs.add(
						$el.is(inputSelector)
							? $el
							: $el.find(inputSelector)
					);
				});

			return $inputs;
		},

		getAddress: function (selector, build) {
			var $inputs = $.kladr.getInputs(selector),
				types = $.kladr.getTypes(),
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
							if (objs.hasOwnProperty(i)) {
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
				if (types.hasOwnProperty(t) && filtered[t]) {
					sorted[t] = filtered[t];
				}
			}

			return (build || $.kladr.buildAddress)(sorted);
		},

		buildAddress: function (objs) {
			var lastIds = [],
				duplicate = false,
				address = '',
				zip = '',
				name = '',
				type = '',
				i,
				j;

			for (i in objs) {
				if (objs.hasOwnProperty(i)) {
					if ($.type(objs[i]) === 'object') {
						duplicate = false;
						for (j = 0; j < lastIds.length; j++) {
							if (lastIds[j] == objs[i].id) {
								duplicate = true;
								break;
							}
						}

						if (duplicate) {
							continue;
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

	$.fn.kladrZip = function (selector) {
		var $container = $(selector || document.body);

		this.keydown(function (e) {
			var key = e.charCode || e.keyCode || 0,
				allow = (
					key == 8 ||
					key == 9 ||
					key == 13 ||
					key == 46 ||
					key == 110 ||
					key == 190 ||
					(key >= 35 && key <= 40) ||
					(key >= 96 && key <= 105)
				);

			if ($(this).val().length >= 6) {
				return allow;
			}

			return (allow || (key >= 48 && key <= 57));
		});

		this.keyup(function () {
			var zip = $(this).val();

			if (!zip) {
				return;
			}

			$.kladr.api({
				type:        $.kladr.type.building,
				zip:         zip,
				withParents: true,
				limit:       1
			}, function (objs) {
				var obj = objs.length && objs[0], i, $input, source;
				objs = [];

				if (obj) {
					if (obj.parents) {
						objs = $.extend(true, [], obj.parents);
					}

					objs.push(obj);

					for (i in objs) {
						if (objs.hasOwnProperty(i)) {
							$input = $container.find('[data-kladr-type="' + objs[i].contentType + '"]');
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
				}
			});
		});

		return this;
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
					else if (params.str && !params.isGet && defaultOptions.hasOwnProperty(params.str[0])) {
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
					.attr('data-kladr-type', get('type') || '')
					.attr('data-kladr-one-string', get('oneString') || null)
					.on('keyup.kladr', open)
					.on('keydown.kladr', keySelect)
					.on('blur.kladr', function () {
						if (!isActive) {
							check();
							close();
						}
					});

				$ac
					.on('touchstart.kladr click.kladr', 'li, a', function () {
						isActive = true;
						mouseSelect.call(this);
						isActive = false;
					})
					.on('mouseenter.kladr', function () {
						isActive = true;
					})
					.on('mouseleave.kladr', function () {
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
					setCurrent(null);
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
				var query = {
						token:       get('token'),
						key:         get('key'),
						type:        get('type'),
						typeCode:    get('typeCode'),
						name:        fixName(name),
						parentType:  get('parentType'),
						parentId:    get('parentId'),
						oneString:   get('oneString'),
						withParents: get('withParents'),
						limit:       get('limit')
					},
					parentInput = get('parentInput'),
					parent;

				// one string search crutch
				if (query.oneString) {
					query.withParents = true;
				}

				if (parentInput) {
					parent = getParent(parentInput, query.type);

					if (parent) {
						query.parentType = parent.type;
						query.parentId = parent.id;
					}
				}

				return query;
			}

			function getParent (selector, type) {
				var $inputs = $.kladr.getInputs(selector),
					types = $.kladr.getTypes(),
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

					if (types.hasOwnProperty(t) && parents[t]) {
						parent = {
							type: t,
							id:   parents[t]
						}
					}
				}

				return parent;
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