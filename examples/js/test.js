(function($){
    $(function(){
        $('input').kladr({
            labelFormat: function(obj, query){
                return obj.typeShort+'. '+obj.name+' custom label';
            },
            valueFormat: function(obj, query){
                return obj.name+' custom value';
            }
        });
        
        $('input').kladr('valueFormat', function(obj, query){
            return obj.name+' 2';
        });
    }); 
})(jQuery);