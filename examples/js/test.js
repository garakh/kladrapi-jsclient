$(function(){
    var cityInput = $('[name="city"]');
    var streetInput = $('[name="street"]');
    
    cityInput.kladr({
        token: 'token',
        key: 'key',
        type: $.kladr.type.city,
        select: function(obj){
            streetInput.kladr('parentId', obj.id);
            alert(cityInput.kladr('current').name);
        },
        check: function(obj){
            if(obj){
                streetInput.kladr('parentId', obj.id);
            }
        }
    });

    streetInput.kladr({
        token: 'token',
        key: 'key',
        type: $.kladr.type.street,
        parentType: $.kladr.type.city
    });
});