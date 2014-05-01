var $j = jQuery.noConflict();

$j(function() {
    jQuery( document ).ready(function( $ ) {
        // jQuery

        var $container = $j('#container.js-isotope');

        // Setup item width
        $('.item')[0].width();

        $container.isotope({
            // options...
            itemSelector: '.item',
            masonry:      {
                rowHeight: 355
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

});