(function($){
    $(function(){
        var kladr = $(document.getElementById('kladr_autocomplete'));        
        var input = $('input');
        
        var Position = function(){
            var inputOffset = input.offset();
            kladr.find('ul').css({
               top:  inputOffset.top+input.outerHeight() + 'px',
               left: inputOffset.left,
               width: (input.outerWidth() - 2) + 'px'
            });
        }
        
        input.keydown(function(){
            kladr.find('ul').slideDown(100);
        });
        
        kladr.find('li, a').click(function(){
           var a = $(this);
           if(a.is('li')) a = a.find('a');
           input.val(a.attr('data-val'));
           a.closest('ul').hide();
           return false;
        });
        
        $(window).resize(Position);
        Position();        
    }); 
})(jQuery);