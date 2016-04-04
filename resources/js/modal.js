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

        $('.handbid-modal-link').live('click', function(e) {

            e.preventDefault();

            if(handbidMain.noticeIfNoCreditCard($(this))){
                return false;
            }

            var key    = $(this).attr('data-handbid-modal-key'),
                modal  = $('.handbid-modal[data-handbid-modal-key="' + key + '"]');

            $('body').append(modal);

            modal.modal('show');

            $('.handbid-modal').on('hide.bs.modal', function () {
                var modal = $(this),
                    modals = $('.handbid-modal');
                
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
            });
        });

    });
}(jQuery));