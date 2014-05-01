var $j = jQuery.noConflict();

$j(function() {

    var $container = $j('#container.js-isotope');

    $j('.item:first-of-type').width();

    $container.isotope({
        // options...
        itemSelector: '.item',
        masonry:      {
            columnWidth: 290,
            rowHeight: 355,
            gutterWidth: 20
        }
    });

    function filterClass() {

        var filterClass = '';

        if($j('.categorySort input[type=radio]:checked').val()) {
            filterClass = '.' + $j('.categorySort input[type=radio]:checked').val();
        }

        if($j('.priceSort input[type=radio]:checked').val()) {
            filterClass += '.' + $j('.priceSort input[type=radio]:checked').val();
        }

        return filterClass;

    }

    // Filter Auction Items
    $j('.categorySort input[type=radio], .priceSort input[type=radio]').on('click', function() {

        $container.isotope({ filter: filterClass()});

    });

});