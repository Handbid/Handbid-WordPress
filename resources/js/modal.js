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

        showSingleModal: function (modal_slug) {
            var modal  = $('.handbid-modal[data-handbid-modal-key="' + modal_slug + '"]');

            $('body').append(modal);

            modal.modal('show');

            $(".credit-card-form-modal").on('hidden.bs.modal', function () {
                $(this).find('.credit-card-status').eq(0).html("")
                    .removeClass("card-success").removeClass("card-error");
                $(this).find('input[type=text]').val("");
            });

            $(".tickets-modal").on('hidden.bs.modal', function () {
                var elem = $('[data-handbid-tickets-button="purchase"]');
                if(! elem.is(':visible')){
                    ticketsPopupWasOpened = false;
                }
            });
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

        handbidModalsMain = handbidModals;
    });
}(jQuery));