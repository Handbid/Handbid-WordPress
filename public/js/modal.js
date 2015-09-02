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
            var modals = $('.handbid-modal');
            var parentModal = $(this).parents(".handbid-modal").eq(0);
            parentModal.css('display', 'none');
            if(parentModal.hasClass("credit-card-form-modal")){
                parentModal.find('.credit-card-status').eq(0).html("")
                    .removeClass("card-success").removeClass("card-error");
            }
            var modalsOpened = false;
            $.map(modals, function(val){
                if($(val).is(":visible")){
                    modalsOpened = true;
                }
            });
            if(!modalsOpened) {
                overlay.css('display', 'none');
            }
        });

        overlay.live('click', function(e) {
            e.preventDefault();
            var modals = $('.handbid-modal');
            var modalsOpened = false;
            $.map(modals, function(val){
                if(! $(val).hasClass("processing")){
                    $(val).css('display', 'none');
                    if($(val).hasClass("credit-card-form-modal")){
                        $(val).find('.credit-card-status').eq(0).html("")
                            .removeClass("card-success").removeClass("card-error");
                    }
                }
                if($(val).is(":visible")){
                    modalsOpened = true;
                }
            });
            if(!modalsOpened) {
                overlay.css('display', 'none');
            }
        });
    });
}(jQuery));