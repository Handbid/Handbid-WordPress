var $j = jQuery.noConflict();
$j(function () {
    $j(window).scroll(function (e) {
        $el = $j('.statBar');
        $banner = $j('.innerBanner');

        if ($j(this).scrollTop() > $banner.height() && $el.css('position') != 'fixed') {
            $j('.statBar').addClass("statBarTop");
        }

        if ($j(this).scrollTop() > ( $banner.height() + $el.height())) {
            $j('.statBar').addClass("statBarTopExtended");
        }

        if ($j(this).scrollTop() < $banner.height() && $el.css('position') == 'fixed') {
            $j('.statBar').removeClass("statBarTop");
        }

        if ($j(this).scrollTop() < ( $banner.height() - $el.height())) {
            $j('.statBar').removeClass("statBarTopExtended");
        }

    });
});