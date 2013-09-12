$(function(){
    var cityInput = $('[name="city"]');
    var streetInput = $('[name="street"]');
    
    cityInput.kladr({
        token: 'token',
        key: 'key',
        type: $.kladr.type.city,
        select: function(obj){
            if(obj){
                cityInput.prev().text(obj.type);
                streetInput.kladr('parentId', obj.id);
            }
        }
    });

    streetInput.kladr({
        token: 'token',
        key: 'key',
        type: $.kladr.type.street,
        parentType: $.kladr.type.city,
        select: function(obj){
            if(obj){
                streetInput.prev().text(obj.type);
            }
        }
    });
});