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
    $.fn.kladr = function( options ){
        var input = this;
        var ac = null;
        
        var create = function(){
            var container = $(document.getElementById('kladr_autocomplete'));
            if(!container.length){
                container = $('<div id="kladr_autocomplete"></div>').appendTo('body');
            }
            
            ac = $('<ul style="display: none;"></ul>').appendTo(container);            
            ac.on('click', 'li, a', itemClick);
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
        
        var itemClick = function(){
            var a = $(this);
            if(a.is('li')) a = a.find('a');
            input.val(a.attr('data-val'));
            input.data('kladr-object', a.data('kladr-object'));
            a.closest('ul').hide();
            return false;
        };
        
        var render = function(objs){        
            ac.empty();            
            for(var i in objs){
                var obj = objs[i];
                
                var a = $('<a data-val="'+value(obj)+'">'+label(obj)+'</a>');
                a.data('kladr-object', obj);
                                
                var li = $('<li></li>').append(a);                
                li.appendTo(ac);
            }
        };
        
        var label = function(obj){
            return obj.typeShort+'. '+obj.name;
        };
        
        var value = function(obj){
            return obj.name;
        };
        
        var source = function(query){
            return [
                {typeShort: 'г', name: 'Архангельск'},
                {typeShort: 'пгт', name: 'Архара'},
                {typeShort: 'пгт', name: 'Архиповка'},
                {typeShort: 'п', name: 'Архангельский'},
            ];
        };
        
        create();
        $(window).resize(position);
        input.keydown(function(){
            var query = input.val();
            var objs = source(query);
            render(objs);
            position();           
            ac.slideDown(100);
        });
    };
})(jQuery);