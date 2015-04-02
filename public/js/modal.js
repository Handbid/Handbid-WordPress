(function ($) {
    $(document).ready(function () {

        var overlay = $('.handbid-overlay');

        $('.handbid-modal-link').on('click', function(e) {

            e.preventDefault();

            var key    = $(this).attr('data-handbid-modal-key'),
                modal  = $('.handbid-modal[data-handbid-modal-key="' + key + '"]');

            $('body').append(modal);

            overlay.css('display', 'block');

            modal.css('display', 'block');

            // Get height / width after we show the element
            var height = modal.outerHeight(),
                width  = modal.outerWidth(),
                styles = {
                    'margin-top'  : -height / 2,
                    'margin-left' : -width / 2
                };

            modal.css(styles);

        });

        $('.modal-close').on('click', function(e) {
            e.preventDefault();
            $('.handbid-modal').css('display', 'none');
            overlay.css('display', 'none');
        });
    });
}(jQuery));