var $j = jQuery.noConflict();
$j(function() {
    $j(window).scroll(function(e){
        $el = $j('.statBar');

        if ($j(this).scrollTop() > 437 && $el.css('position') != 'fixed'){
            $j('.statBar').addClass("statBarTop");
        }

        if ($j(this).scrollTop() > ( 437 + $el.height())){
            $j('.statBar .auctionImage').addClass("animated fadeInLeft");
            $j('.statBar .auctionName').addClass("animated fadeInLeft");
            $j('.statBar').addClass("statBarTopExtended");
        }

        if ($j(this).scrollTop() < 437 && $el.css('position') == 'fixed'){
            $j('.statBar').removeClass("statBarTop");
        }

        if ($j(this).scrollTop() < ( 437 - $el.height())){
            $j('.statBar .auctionImage').removeClass("animated fadeInLeft");
            $j('.statBar .auctionName').removeClass("animated fadeInLeft");
            $j('.statBar').removeClass("statBarTopExtended");
        }

    });
});