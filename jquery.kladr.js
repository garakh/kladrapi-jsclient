(function($){
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
    $.kladr.api = function( query, callback ){
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
        
        $.getJSON($.kladr.url + "?callback=?",
            params,
            function( data ) {
                callback && callback( data.result );
            }
        );
    };
    
    // Check existence object
    $.kladr.check = function( query, callback ){
        query.withParents = false;
        query.limit = 1;
        
        $.kladr.api(query, function(objs){
            if(objs && objs.length){
                callback && callback(objs[0]); 
            } else {
                callback && callback(false);
            }
        });
    };
})(jQuery);

(function( $, undefined ){
    $.fn.kladr = function( param1, param2 ){
        var input = this;
        var ac = null;
        
        var options = null;
        var defaultOptions = {
            token: null,
            key: null,
            type: null,
            parentType: null,
            parentId: null,
            limit: 10,
            withParents: false,
            showSpinner: true,
            current: null,
            
            open: null,
            close: null,
            send: null,
            received: null,
            select: null,
            check: null,
            
            source: function( query, callback ){
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
                    
            labelFormat: function( obj, query ){
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
                    label += obj.name;
                }

                return label;
            },
            
            valueFormat: function( obj, query ){
                return obj.name;
            }
        };
        
        var keys = {
            up: 38,
            down: 40,
            esc: 27,
            enter: 13
        };
        
        var init = function( param1, param2, callback ){
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
        
        var key = function( val ){
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
        
        var trigger = function(event, obj){
            if(!event) return;
            input.trigger('kladr_'+event, obj);
            options[event] && options[event](obj);
        };
        
        var position = function(){
            var inputOffset = input.offset();
            
            ac.css({
               top:  inputOffset.top+input.outerHeight() + 'px',
               left: inputOffset.left
            });
            
            var differ = ac.outerWidth() - ac.width();
            ac.width(input.outerWidth() - differ);
        };
        
        var create = function(){
            var container = $(document.getElementById('kladr_autocomplete'));
            if(!container.length){
                container = $('<div id="kladr_autocomplete"></div>').appendTo('body');
            }
            
            ac = $('<ul style="display: none;"></ul>').appendTo(container);  
            input.attr('autocomplete', 'off');
        };
        
        var render = function(objs, query){        
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
        
        var select = function( a ){
            input.val(a.attr('data-val'));
            options.current = a.data('kladr-object');
            input.data('kladr-options', options);
            trigger('select', options.current);
            close();
        };
        
        var mouseselect = function(){
            var a = $(this);
            if(a.is('li')) a = a.find('a');
            select(a);
            return false;
        };
        
        var keyselect = function( event ){
            var active = ac.find('li.active');  
            switch(event.which){
                case keys.up:
                    if(active.length) {
                        active.removeClass('active');
                        active.prev().addClass('active');
                    } else {
                        active = ac.find('li').last();
                        active.addClass('active');
                    }
                    break;
                case keys.down:                    
                    if(active.length) {
                        active.removeClass('active');
                        active.next().addClass('active');
                    } else {
                        active = ac.find('li').first();
                        active.addClass('active');
                    }
                    break;
                case keys.esc:
                    close();
                    break;
                case keys.enter:
                    if(active.length){
                        var a = active.find('a');
                        select(a);
                    }
                    break;
            }
        };
        
        var open = function( event ){
            for(var i in keys){
                if(keys[i] == event.which) return;
            }
                        
            var query = key(input.val());
            if(!$.trim(query)) return;
            
            trigger('send');
            options.source(query, function(objs){
                trigger('received');
                render(objs, query);
                position();           
                ac.slideDown(50);
                trigger('open');
            });
        };
        
        var close = function(){
            ac.hide();
            trigger('close');
        };
        
        return init(param1, param2, function(){
            create(); 
            
            input.blur(close);
            input.keyup(open);
            input.keydown(keyselect);
            
            ac.on('click', 'li, a', mouseselect);
            ac.on('mouseenter', 'li', function(){
                $(this).addClass('active');
            });
            ac.on('mouseleave', 'li', function(){
                $(this).removeClass('active');
            });
            
            $(window).resize(position);
        });
    };
})(jQuery);