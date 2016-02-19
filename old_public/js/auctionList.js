/**
 * @copyright Copyright (c) 2014-2015 Handbid Inc.
 * @category handbid
 * @package Handbid2-WordPress
 * @license Proprietary
 * @link http://www.handbid.com/
 * @author Master of Code (worldclass@masterofcode.com)
 */

var $j = jQuery.noConflict();

$j(function() {
    var $container = $j('#container.js-isotope');
$j(window).load(function() {
    $container.isotope({
        itemSelector: '.isotope-item',
        layoutMode: 'fitRows',
        masonry: {
            columnWidth: 290,
            gutterWidth: 5
        }
    });
});

    function filterClass() {

        var filterClass = '';

        if ($j('.categorySort input[type=radio]:checked').val()) {
            filterClass = '.' + $j('.categorySort input[type=radio]:checked').val();
        }

        if ($j('.priceSort input[type=radio]:checked').val()) {
            filterClass += '.' + $j('.priceSort input[type=radio]:checked').val();
        }

        if(filterClass == null) {
            filterClass = 'all';
        }
        return filterClass;

    }

    // Filter Auction Items
    $j('.categorySort input[type=radio], .priceSort input[type=radio]').on('click', function () {

        $container.isotope({ filter: filterClass()});

    });
});