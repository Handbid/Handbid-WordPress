/**
 * @copyright Copyright (c) 2014-2015 Handbid Inc.
 * @category handbid
 * @package Handbid2-WordPress
 * @license Proprietary
 * @link http://www.handbid.com/
 * @author Master of Code (worldclass@masterofcode.com)
 */

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
            if($j('.bannerContainer').hasClass("filterBarOpen")) {
                $j('.bannerContainer').removeClass("filterBarOpen");
            }
        }

        if ($j(this).scrollTop() < ( $banner.height() - $el.height())) {
            $j('.statBar').removeClass("statBarTopExtended");
        }

    });

    $j('.filterBox').click(function() {
        $j('.bannerContainer').toggleClass("filterBarOpen");
    });
});