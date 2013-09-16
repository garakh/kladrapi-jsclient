(function($){
    $(function() {
        var city = $( '[name="city"]' );
        var street = $( '[name="street"]' );
        
        // Подключение автодополнения улиц
        street.kladr({
            token: '51dfe5d42fb2b43e3300006e',
            key: '86a2c2a06f1b2451a87d05512cc2c3edfdf41969',
            type: $.kladr.type.street,
            parentType: $.kladr.type.city,
            parentId: city.val()
        });
        
        city.change(function(){
            // Изменение родительского объекта для автодополнения улиц
            street.kladr('parentId', city.val());
        });
    });
})(jQuery);