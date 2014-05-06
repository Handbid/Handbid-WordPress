var $j = jQuery.noConflict();
$j(function() {
    var $container = $j('#container.js-isotope');

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

        if ($j('.categorySort input[type=radio]:checked').val()) {
            filterClass = '.' + $j('.categorySort input[type=radio]:checked').val();
        }

        if ($j('.priceSort input[type=radio]:checked').val()) {
            filterClass += '.' + $j('.priceSort input[type=radio]:checked').val();
        }

        return filterClass;

    }

    // Filter Auction Items
    $j('.categorySort input[type=radio], .priceSort input[type=radio]').on('click', function () {

        $container.isotope({ filter: filterClass()});

    });
});