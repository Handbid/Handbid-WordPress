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
            var windowWidth = window.outerWidth,
                windowHeight = window.outerHeight,
                height = modal.outerHeight(),
                width  = modal.outerWidth();
            var   styles = {
                    //'margin-top'  : (windowHeight - height) / 2,
                    'margin-top'  : 30,
                    'margin-left' : (windowWidth - width) / 2
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