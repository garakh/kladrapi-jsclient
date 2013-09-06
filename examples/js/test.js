(function($){
    $(function(){
        var query = {
            type: 'city',
            name: 'арх',
            limit: 10
        };
        
        $.kladr.api(query, function(objs){
           for(var i in objs) {
               console.log(objs[i].name);
           }
        });
    }); 
})(jQuery);