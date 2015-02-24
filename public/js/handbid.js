(function ($) {

    var restEndpoint = 'https://rest.handbid.lan/',
        handbid = {

            // Setup bidding
            setupBidding:             function (container) {

                var userId = ($('[data-handbid-user-id]').length > 0) ? $('[data-handbid-user-id]').attr('data-handbid-user-id') : null,
                    auctionId = ($('[data-handbid-auction-id]').length > 0) ? $('[data-handbid-auction-id]').attr('data-handbid-auction-id') : null,
                    itemId = ($('[data-handbid-item-id]').length > 0) ? $('[data-handbid-item-id]').attr('data-handbid-item-id') : null,
                    amount = $('[data-handbid-quantity], [data-handbid-bid-amount]'),
                    increment = ($('.increment span').length > 0 ) ? $('.increment span')[0].innerHTML : 1;

                $('[data-handbid-bid-button="up"]').on('click', function (e) {

                    e.preventDefault();

                    var value = parseInt(amount[0].innerHTML) + parseInt(increment);

                    amount.each(function () {

                        this.innerHTML = value;

                    });

                });

                $('[data-handbid-bid-button="down"]').on('click', function (e) {

                    e.preventDefault();

                    amount.each(function () {
                        if (this.innerHTML > 0 && (this.innerHTML - increment > 0)) {
                            this.innerHTML -= increment;
                        }
                    });

                });

                $('[data-handbid-item-id] [data-handbid-bid-button="bid"]').on('click', function (e) {

                    e.preventDefault;

                    var total = amount[0].innerHTML;

                    $.ajax({
                        url:     restEndpoint + 'bid/create',
                        type:    'POST',
                        data:    {
                            'userId':    userId,
                            'auctionId': auctionId,
                            'itemId':    itemId,
                            'amount':    total
                        },
                        success: function (data) {

                            handbid.notice('bid placed');
                            return data;
                        }
                    });


                });

                $('[data-handbid-bid-button="proxy"]').on('click', function (e) {
                    e.preventDefault;
                    alert('proxy clicked');

                });

                $('[data-handbid-bid-button="purchase"]').on('click', function (e) {
                    e.preventDefault;
                    alert('purchase clicked');
                });

                $('[data-handbid-bid-button="buyItNow"]').on('click', function (e) {
                    e.preventDefault;
                    alert('buy clicked');
                });
            },
            setupConnect:             function () {

                var body = $('body'),
                    underlayContainer = '<div id="handbid-confirmation-underlay" ' +
                        'style="position: fixed; top:0px; bottom:0px; left: 0px; right: 0px; z-index: 1; display: none;"> ';


                body.append(underlayContainer);

                if (body.hasClass('handbid-logged-out')) {

                    var loginModal = $('[data-handbid-modal-key="login-modal"]');


                    var underlay = $('#handbid-confirmation-underlay');

                    $('[data-handbid-connect]').on('click', function (e) {

                        e.preventDefault();

                        loginModal.css('display', 'block');
                        underlay.css('display', 'block');
                    });

                    $('.modal-close', loginModal).on('click', function () {

                        underlay.css('display', 'none');
                    });
                }
                else {
                    $('[data-handbid-connect]').css('display', 'none');
                }
            },
            setupAuthorizationStatus: function () {

                var authorized = $.cookie('handbid-auth') ? true : false;

                if (authorized === true) {
                    $('.handbid-logout').css('display', 'inline-block');
                    $('body').addClass('handbid-logged-in');

                    $.ajaxSetup({
                        headers: {
                            'Authorization': $.cookie('handbid-auth').split(": ")[1]
                        }
                    });
                }
                else {
                    $('.handbid-login').css('display', 'inline-block');
                    $('body').addClass('handbid-logged-out');
                }

            },
            notice:                   function (msg) {

                handbid.noticeContainer = $('<div class="handbid-growl-container"></div>');
                handbid.noticeContainer.appendTo('body');
                handbid.noticeTemplate = '<div class="handbid-growl"><div class="message">Notice Message</div></div>';

                if(msg.indexOf('&') > -1) {
                    msg = msg.split('&')[0];
                }

                msg = msg.split('+').join(' ');

                var growl = $(handbid.noticeTemplate);
                $('.message', growl).html(msg);
                growl.appendTo(handbid.noticeContainer);

                setTimeout(function () {

                    growl.remove();

                }, 5000);
            }

        };

    $(document).ready(function () {

        handbid.setupAuthorizationStatus();

        if ($('[data-handbid-item-key], [data-no-bids], [data-tags]').length > 0) {
            $('body').addClass('enable-handbid-fatal-error');
        }

        var url = window.location.href;
        if (url.indexOf('handbid-notice') > -1) {

            handbid.notice(window.location.href.split('handbid-notice=')[1]);
        }

        $(window).on('beforeunload', function () {

            $('body').addClass('handbid-refreshing-page');

        });

        ($('[data-handbid-bid]').length > 0) ? handbid.setupBidding() : '';
        ($('[data-handbid-connect]').length > 0) ? handbid.setupConnect() : '';

    });

})(jQuery);