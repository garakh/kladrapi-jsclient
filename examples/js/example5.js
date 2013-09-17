$(function() {
    var token = '51dfe5d42fb2b43e3300006e';
    var key   = '86a2c2a06f1b2451a87d05512cc2c3edfdf41969';

    var region   = $('[name="region"]');
    var district = $('[name="district"]');
    var city     = $('[name="city"]');
    var street   = $('[name="street"]');
    var building = $('[name="building"]');

    var tooltip  = $('.tooltip');

    var LabelFormat = function( obj, query ){
        var label = '';

        var name = obj.name.toLowerCase();
        query = query.toLowerCase();

        var start = name.indexOf(query);
        start = start > 0 ? start : 0;

        if(query.length < obj.name.length){
            label += obj.name.substr(0, start);
            label += '<strong>' + obj.name.substr(start, query.length) + '</strong>';
            label += obj.name.substr(start+query.length, obj.name.length-query.length-start);
        } else {
            label += '<strong>' + obj.name + '</strong>';
        }

        if(obj.typeShort){
            label += ' ' + obj.typeShort + '.';
        }

        return label;
    };

    var ShowError = function(input, message){
        tooltip.find('span').text(message);

        var inputOffset = input.offset();
        var inputWidth  = input.outerWidth();
        var inputHeight = input.outerHeight();

        var tooltipHeight = tooltip.outerHeight();

        tooltip.css({
            left: (inputOffset.left + inputWidth + 10) + 'px',
            top: (inputOffset.top + (inputHeight - tooltipHeight)/2 - 1) + 'px'
        });

        tooltip.show();
    };

    region.kladr({
        token: token,
        key: key,
        type: $.kladr.type.region,
        labelFormat: LabelFormat,
        verify: true,
        select: function(obj) {
            region.parent().find('label').text(obj.type);
            district.kladr('parentType', $.kladr.type.region);
            district.kladr('parentId', obj.id);
            city.kladr('parentType', $.kladr.type.region);
            city.kladr('parentId', obj.id);
        },
        check: function(obj) {
            if(obj){
                region.text(obj.name);
                region.parent().find('label').text(obj.type);
                district.kladr('parentType', $.kladr.type.region);
                district.kladr('parentId', obj.id);
                city.kladr('parentType', $.kladr.type.region);
                city.kladr('parentId', obj.id);
                tooltip.hide();
            } else {
                ShowError(region, 'Неверно введено название региона');
            }
        }
    });

    district.kladr({
        token: token,
        key: key,
        type: $.kladr.type.district,
        labelFormat: LabelFormat,
        verify: true,
        select: function(obj) {
            district.parent().find('label').text(obj.type);
            city.kladr('parentType', $.kladr.type.district);
            city.kladr('parentId', obj.id);
        },
        check: function(obj) {
            if(obj){
                district.text(obj.name);
                district.parent().find('label').text(obj.type);
                city.kladr('parentType', $.kladr.type.district);
                city.kladr('parentId', obj.id);
                tooltip.hide();
            } else {
                ShowError(district, 'Неверно введено название района');
            }
        }
    });

    city.kladr({
        token: token,
        key: key,
        type: $.kladr.type.city,
        verify: true,
        select: function(obj) {
            city.parent().find('label').text(obj.type);
            street.kladr('parentType', $.kladr.type.city);
            street.kladr('parentId', obj.id);
            building.kladr('parentType', $.kladr.type.city);
            building.kladr('parentId', obj.id);
        },
        check: function(obj) {
            if(obj){
                city.text(obj.name);
                city.parent().find('label').text(obj.type);
                street.kladr('parentType', $.kladr.type.city);
                street.kladr('parentId', obj.id);
                building.kladr('parentType', $.kladr.type.city);
                building.kladr('parentId', obj.id);
                tooltip.hide();
            } else {
                ShowError(city, 'Неверно введено название населённого пункта');
            }
        }
    });

    street.kladr({
        token: token,
        key: key,
        type: $.kladr.type.street,
        select: function(obj) {
            street.parent().find('label').text(obj.type);
            building.kladr('parentType', $.kladr.type.street);
            building.kladr('parentId', obj.id);
        },
        check: function(obj) {
            if(obj){
                street.text(obj.name);
                street.parent().find('label').text(obj.type);
                building.kladr('parentType', $.kladr.type.street);
                building.kladr('parentId', obj.id);
                tooltip.hide();
            } else {
                ShowError(street, 'Неверно введено название улицы');
            }
        }
    });

    building.kladr({
        token: token,
        key: key,
        type: $.kladr.type.building,
        select: function(obj) {
            building.parent().find('label').text(obj.type);
        }
    });
});

