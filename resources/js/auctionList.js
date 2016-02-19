/**
 * @copyright Copyright (c) 2014-2015 Handbid Inc.
 * @category handbid
 * @package Handbid2-WordPress
 * @license Proprietary
 * @link http://www.handbid.com/
 * @author Master of Code (worldclass@masterofcode.com)
 */

//var $j = jQuery.noConflict();

jQuery(function($) {
    var $container = $('#container.js-isotope');

    $container.isotope({
        itemSelector: '.isotope-item',
        layoutMode: 'fitRows',
        masonry: {
            columnWidth: 290,
            gutterWidth: 5
        }
    });

    function filterClass() {

        var filterClass = '';

        if ($('.categorySort input[type=radio]:checked').val()) {
            filterClass = '.' + $('.categorySort input[type=radio]:checked').val();
        }

        if ($('.priceSort input[type=radio]:checked').val()) {
            filterClass += '.' + $('.priceSort input[type=radio]:checked').val();
        }

        if(filterClass == null) {
            filterClass = 'all';
        }
        return filterClass;

    }

    // Filter Auction Items
    $('.categorySort input[type=radio], .priceSort input[type=radio]').on('click', function () {

        $container.isotope({ filter: filterClass()});

    });
});