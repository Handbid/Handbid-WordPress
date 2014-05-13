var $j = jQuery.noConflict();
$j(function() {
    $j(window).scroll(function(e){
        $el = $j('.statBar');
        if ($j(this).scrollTop() > 437 && $el.css('position') != 'fixed'){
            $j('.statBar').addClass("statBarTop");
        }
        if ($j(this).scrollTop() < 437 && $el.css('position') == 'fixed'){
            $j('.statBar').removeClass("statBarTop");
        }
    });
});