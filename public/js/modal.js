/**
 * @copyright Copyright (c) 2014-2015 Handbid Inc.
 * @category handbid
 * @package Handbid2-WordPress
 * @license Proprietary
 * @link http://www.handbid.com/
 * @author Master of Code (worldclass@masterofcode.com)
 */

(function ($) {
    $(document).ready(function () {

        var overlay = $('.handbid-overlay');

        $('.handbid-modal-link').live('click', function(e) {

            e.preventDefault();

            if(handbidMain.noticeIfNoCreditCard($(this))){
                return false;
            }

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

        $('.modal-close').live('click', function(e) {
            e.preventDefault();
            $('.handbid-modal').css('display', 'none');
            overlay.css('display', 'none');
        });
    });
}(jQuery));