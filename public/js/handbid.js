(function($) {
    $(document).ready(function() {
       if($('[data-handbid-item-key], [data-no-bids], [data-tags]').length > 0) {
           $('body').addClass('has-handbid-shortcode');
       }
    });
})(jQuery);