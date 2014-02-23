(function($) {
    $.kladr = {};
    
    // Service URL
    $.kladr.url = 'http://kladr-api.ru/api.php';
    
    // Enum KLADR object types
    $.kladr.type = {
        region: 'region',
        district: 'district',
        city: 'city',
        street: 'street',
        building: 'building'
    };
    
    // Send query to service
    $.kladr.api = function(query, callback) {
        var params = {};
        
        if( query.token ) params.token = query.token;
        if( query.key ) params.key = query.key;
        if( query.type ) params.contentType = query.type;
        if( query.name ) params.query = query.name;
        
        if( query.parentType && query.parentId ){
            params[query.parentType+'Id'] = query.parentId;
        }
        
        if( query.withParents ) params.withParent = 1;
        params.limit = query.limit ? query.limit : 2000;
        
        var completed = false;
        
        $.getJSON($.kladr.url + "?callback=?",
            params,
            function(data) {
                if(completed) return;
                completed = true;                
                callback && callback( data.result );
            }
        );
            
        setTimeout(function() {
            if(completed) return;
            completed = true;   
            console.error('Request error');
            callback && callback( [] );
        }, 5000);
    };
    
    // Check existence object
    $.kladr.check = function(query, callback) {
        query.withParents = false;
        query.limit = 1;
        
        $.kladr.api(query, function(objs) {
            if(objs && objs.length){
                callback && callback(objs[0]); 
            } else {
                callback && callback(false);
            }
        });
    };
})(jQuery);

(function($, undefined) {
    $.fn.kladr = function(param1, param2) {
        
        var result = undefined;        
        this.each(function() {
            var res = kladr($(this), param1, param2);
            if(result == undefined) result = res;
        });
        
        return result;
        
        function kladr(input, param1, param2) {
            var ac = null;        
            var spinner = null;

            var options = null;
            var defaultOptions = {
                token: null,
                key: null,
                type: null,
                parentType: null,
                parentId: null,
                limit: 10,
                withParents: false,
                verify: false,
                showSpinner: true,
                arrowSelect: true,
                current: null,

                open: null,
                close: null,
                send: null,
                received: null,
                select: null,
                check: null,

                source: function(query, callback) {
                    var params = {
                        token: options.token,
                        key: options.token,
                        type: options.type,
                        name: query,
                        parentType: options.parentType,
                        parentId: options.parentId,
                        withParents: options.withParents,
                        limit: options.limit
                    };

                    $.kladr.api(params, callback);
                },

                labelFormat: function(obj, query) {
                    var label = '';

                    var name = obj.name.toLowerCase();
                    query = query.toLowerCase();

                    var start = name.indexOf(query);
                    start = start > 0 ? start : 0;

                    if(obj.typeShort){
                        label += obj.typeShort + '. ';
                    }

                    if(query.length < obj.name.length){
                        label += obj.name.substr(0, start);
                        label += '<strong>' + obj.name.substr(start, query.length) + '</strong>';
                        label += obj.name.substr(start+query.length, obj.name.length-query.length-start);
                    } else {
                        label += '<strong>' + obj.name + '</strong>';
                    }

                    return label;
                },

                valueFormat: function(obj, query) {
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
            
            return init(param1, param2, function() {
                var isActive = false;

                create(); 
                position();

                input.keyup(open);
                input.keydown(keyselect);
                input.change(function(){
                    if(!isActive) change();
                });
                input.blur(function(){
                    if(!isActive) close();
                });

                ac.on('click', 'li, a', mouseselect);
                ac.on('mouseenter', 'li', function(){ 
                    var $this = $(this);
                    
                    ac.find('li.active').removeClass('active');
                    $this.addClass('active');
                    
                    var obj = $this.find('a').data('kladr-object');
                    trigger('preselect', obj);
                    
                    isActive = true;
                });
                ac.on('mouseleave', 'li', function(){
                    $(this).removeClass('active'); 
                    isActive = false;
                });

                $(window).resize(position);
            });

            function init( param1, param2, callback ) {
                options = input.data('kladr-options');

                if(param2 !== undefined){
                    options[param1] = param2;
                    input.data('kladr-options', options);
                    return input;
                }

                if($.type(param1) === 'string'){
                    if(!options) return null;
                    return options[param1];
                }

                if(options){
                    return input;
                }

                options = defaultOptions;
                if($.type(param1) === 'object'){
                    for(var i in param1){
                        options[i] = param1[i];
                    }
                }

                input.data('kladr-options', options);
                callback && callback();
                return input;
            };

            function create() {
                var container = $(document.getElementById('kladr_autocomplete'));
                var inputName = input.attr('name');

                if(!container.length){
                    container = $('<div id="kladr_autocomplete"></div>').appendTo('body');
                }

                input.attr('autocomplete', 'off');

                ac = $('<ul class="kladr_autocomplete_'+inputName+'" style="display: none;"></ul>');
                ac.appendTo(container); 

                spinner = $('<div class="spinner kladr_autocomplete_'+inputName+'_spinner" class="spinner" style="display: none;"></div>');
                spinner.appendTo(container);
            };
            
            function render(objs, query) {        
                ac.empty();  
                for(var i in objs){
                    var obj = objs[i];                
                    var value = options.valueFormat(obj, query);
                    var label = options.labelFormat(obj, query);

                    var a = $('<a data-val="'+value+'">'+label+'</a>');
                    a.data('kladr-object', obj);

                    var li = $('<li></li>').append(a);                
                    li.appendTo(ac);
                }
            };

            function position() {
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
                    top:  inputOffset.top + (inputHeight - spinnerHeight)/2 - 1,
                    left: inputOffset.left + inputWidth - spinnerWidth - 2,
                });
            };

            function open(event) {
                // return on keyup control keys
                if((event.which > 8) && (event.which < 46)) return;

                if(!validate()) return;

                var query = key(input.val());
                if(!$.trim(query)){
                    close();
                    return;
                }

                spinnerShow();
                trigger('send');

                options.source(query, function(objs) {
                    spinnerHide();
                    trigger('received');

                    if(!input.is(':focus')){
                        close();
                        return;
                    }

                    if(!$.trim(input.val()) || !objs.length){
                        close();
                        return;
                    } 

                    render(objs, query);
                    position();  
                    ac.slideDown(50);
                    trigger('open');
                });
            };

            function close() {
                select();            
                ac.hide();
                trigger('close');
            };
            
            function validate() {
                switch(options.type){
                    case $.kladr.type.region:
                    case $.kladr.type.district:
                    case $.kladr.type.city:
                        if(options.parentType && !options.parentId)
                        {
                            console.error('parentType is defined and parentId in not');
                            return false;
                        }
                        break;
                    case $.kladr.type.street:
                        if(options.parentType != $.kladr.type.city){
                            console.error('For street parentType must equal "city"');
                            return false;
                        }
                        if(!options.parentId){
                            console.error('For street parentId must defined');
                            return false;
                        }
                        break;
                    case $.kladr.type.building:
                        if(options.parentType != $.kladr.type.street){
                            console.error('For building parentType must equal "street"');
                            return false;
                        }
                        if(!options.parentId){
                            console.error('For building parentId must defined');
                            return false;
                        }
                        break;
                    default:
                        console.error('type must defined and equal "region", "district", "city", "street" or "building"');
                        return false;
                }

                if(options.limit < 1){
                    console.error('limit must greater than 0');
                    return false;
                }

                return true;
            };
            
            function select() {
                var a = ac.find('.active a');
                if(!a.length) return;

                input.val(a.attr('data-val'));
                options.current = a.data('kladr-object');
                input.data('kladr-options', options);
                trigger('select', options.current);
            }; 
            
            function keyselect(event) {
                var active = ac.find('li.active');  
                switch(event.which){
                    case keys.up:
                        if(active.length) {
                            active.removeClass('active');
                            active = active.prev();
                        } else {
                            active = ac.find('li').last();
                        }
                        active.addClass('active');
                        
                        var obj = active.find('a').data('kladr-object');
                        trigger('preselect', obj);
                        
                        if(options.arrowSelect) select();
                        break;
                    case keys.down:                    
                        if(active.length) {
                            active.removeClass('active');
                            active = active.next();
                        } else {
                            active = ac.find('li').first();
                        }
                        active.addClass('active');
                        
                        var obj = active.find('a').data('kladr-object');
                        trigger('preselect', obj);
                        
                        if(options.arrowSelect) select();
                        break;
                    case keys.esc:
                        active.removeClass('active');
                        close();
                        break;
                    case keys.enter:
                        if(!options.arrowSelect) select();
                        active.removeClass('active');
                        close();
                        return false;
                }
            };
            
            function mouseselect() {
                close();
                input.focus();
                return false;
            };
            
            function change() {
                if(!options.verify) return;

                if(!validate()) return;

                var query = key(input.val());
                if(!$.trim(query)) return;

                spinnerShow();
                trigger('send');

                options.source(query, function(objs) {
                    spinnerHide();
                    trigger('received');

                    var obj = null;                
                    for(var i=0; i<objs.length; i++){
                        var queryLowerCase = query.toLowerCase();
                        var nameLowerCase = objs[i].name.toLowerCase();
                        if(queryLowerCase == nameLowerCase){
                            obj = objs[i];
                            break;
                        }
                    }

                    if(obj) input.val(options.valueFormat(obj, query));

                    options.current = obj;
                    input.data('kladr-options', options);
                    trigger('check', options.current);
                });
            };

            function key(val) {
                var en = "1234567890qazwsxedcrfvtgbyhnujmik,ol.p;[']- " +
                         "QAZWSXEDCRFVTGBYHNUJMIK<OL>P:{\"} ";

                var ru = "1234567890йфяцычувскамепинртгоьшлбщдюзжхэъ- " +
                         "ЙФЯЦЫЧУВСКАМЕПИНРТГОЬШЛБЩДЮЗЖХЭЪ ";

                var strNew = '';
                var ch;
                var index;
                for( var i=0; i<val.length; i++ ){
                    ch = val[i];                    
                    index = en.indexOf(ch);

                    if(index > -1){
                        strNew += ru[index];
                        continue;
                    }

                    strNew += ch;
                }

                return strNew;
            };

            function trigger(event, obj) {
                if(!event) return;
                input.trigger('kladr_'+event, obj);
                if(options[event]) options[event].call(input.get(0), obj);
            };

            function spinnerStart() {
                if(spinnerInterval) return;

                var top = -0.2;
                spinnerInterval = setInterval(function() {
                    if(!spinner.is(':visible')){
                        clearInterval(spinnerInterval);
                        spinnerInterval = null;
                        return;
                    }

                    spinner.css('background-position', '0% '+top+'%');

                    top += 5.555556;
                    if(top > 95) top = -0.2;
                }, 30);
            };

            function spinnerShow() {
                if(options.showSpinner) {
                    spinner.show();
                    spinnerStart();
                }
            };

            function spinnerHide() {
                spinner.hide();
            };
        };
    };
})(jQuery);
