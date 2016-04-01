/**
 * @copyright Copyright (c) 2014-2015 Handbid Inc.
 * @category handbid
 * @package Handbid2-WordPress
 * @license Proprietary
 * @link http://www.handbid.com/
 * @author Master of Code (worldclass@masterofcode.com)
 */
var handbidModalsMain;

(function ($) {

    var handbidModals = {

        showOverlay: function () {

            var overlay = $('.handbid-overlay');
            overlay.css('display', 'block');
        },

        hideOverlay: function () {

            var overlay = $('.handbid-overlay');
            overlay.css('display', 'none');
        },

        showSingleModal: function (modal_slug) {

            var modal  = $('.handbid-modal[data-handbid-modal-key="' + modal_slug + '"]');

            $('body').append(modal);

            handbidModals.showOverlay();

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
        },

        hideSingleModal: function (modal_slug) {

            var modals = $('.handbid-modal');
            var modal  = $('.handbid-modal[data-handbid-modal-key="' + modal_slug + '"]');

            modal.css('display', 'none');
            if(modal.hasClass("credit-card-form-modal")){
                modal.find('.credit-card-status').eq(0).html("")
                    .removeClass("card-success").removeClass("card-error");
                modal.find('input[type=text]').val("");
            }
            var modalsOpened = false;
            $.map(modals, function(val){
                if($(val).is(":visible")){
                    modalsOpened = true;
                }
            });
            if(!modalsOpened) {
                handbidModals.hideOverlay();
            }
            handbidModals.doClassesCleanupAfterModalsCloses();
        },

        hideAllModals: function () {

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
                handbidModals.hideOverlay();
            }
            handbidModals.doClassesCleanupAfterModalsCloses();
        },

        doClassesCleanupAfterModalsCloses: function () {

            var elem = $('[data-handbid-tickets-button="purchase"]');
            if(! elem.is(':visible')){
                ticketsPopupWasOpened = false;
            }
        }

    };

    $(document).ready(function () {

        $('.handbid-modal-link').live('click', function(e) {

            e.preventDefault();

            if(handbidMain.noticeIfNoCreditCard($(this))){
                return false;
            }

            var key    = $(this).attr('data-handbid-modal-key');

            handbidModals.showSingleModal(key);

        });

        $('.modal-close').live('click', function(e) {

            e.preventDefault();

            var key = $(this).parents(".handbid-modal").eq(0).attr('data-handbid-modal-key');

            handbidModals.hideSingleModal(key);

        });

        $('.handbid-overlay').live('click', function(e) {
            e.preventDefault();

            handbidModals.hideAllModals();

        });

        handbidModalsMain = handbidModals;
    });
}(jQuery));