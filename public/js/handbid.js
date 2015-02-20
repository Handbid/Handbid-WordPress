(function ($) {

    var restEndpoint = 'https://rest.handbid.lan/',
        handbid = {

        // Setup bidding
        setupBidding : function(container) {

            var amount = $('[data-handbid-quantity], [data-handbid-bid-amount]', container),
                increment = ($('.increment span').length > 0 ) ? $('.increment span')[0].innerHTML : 1;

            console.log(increment);

            $('[data-handbid-bid-button="up"]').on('click', function(e) {

                e.preventDefault();

                console.log('amount : ' + amount[0].innerHTML);
                console.log('increment : ' + increment);

                var value = parseInt(amount[0].innerHTML) + increment;

                amount.each(function() {

                    this.innerHTML = value;
                });

            });

            $('[data-handbid-bid-button="down"]').on('click', function(e) {

                e.preventDefault();

                amount.each(function() {
                    if(this.innerHTML > 0 && (this.innerHTML - increment > 0)) {
                        this.innerHTML -= increment;
                    }
                });

            });

            $('[data-handbid-bid-button="bid"]', container).click(this.bid);
            $('[data-handbid-bid-button="proxy"]', container).click(this.proxy);
            $('[data-handbid-bid-button="purchase"]', container).click(this.purchase);
            $('[data-handbid-bid-button="buyItNow"]', container).click(this.buyItNow);
        },
        bid : function() {
            alert('bid');
        },
        purchase : function() {
            alert('purchase');
        },
        buyItNow : function() {
            alert('buy it now');
        },

        setupConnect : function() {

            var body = $('body'),
                underlayContainer = '<div id="handbid-confirmation-underlay" ' +
                'style="position: fixed; top:0px; bottom:0px; left: 0px; right: 0px; z-index: 1; display: none;"> ';


            body.append(underlayContainer);

            if(body.hasClass('handbid-logged-out')) {

                var loginModal = $('[data-handbid-modal-key="login-modal"]');


                var underlay = $('#handbid-confirmation-underlay');

                $('[data-handbid-connect]').on('click', function (e) {

                    e.preventDefault();

                    loginModal.css('display', 'block');
                    underlay.css('display', 'block');
                    console.log(underlay);
                });

                $('.modal-close', loginModal).on('click', function() {

                    underlay.css('display', 'none');
                    console.log(underlay);
                });
            }
            else {
                $('[data-handbid-connect]').css('display', 'none');
            }
        },
        checkAuthorizationStatus: function() {

            var authorized = $.cookie('handbid-auth') ? true : false;

            if(authorized) {
                $('.handbid-logout').css('display', 'inline-block');
                $('body').addClass('handbid-logged-in');
            }
            else
            {
                $('.handbid-login').css('display', 'inline-block');
                $('body').addClass('handbid-logged-out');
            }

        }
    };

    $(document).ready(function () {

        handbid.checkAuthorizationStatus();

        if ($('[data-handbid-item-key], [data-no-bids], [data-tags]').length > 0) {
            $('body').addClass('enable-handbid-fatal-error');
        }

        $(window).on('beforeunload', function () {

            $('body').addClass('handbid-refreshing-page');

        });

        ($('[data-handbid-bid]').length > 0) ? handbid.setupBidding($('[data-handbid-bid][data-handbid-item-key]')) : '';
        ($('[data-handbid-connect]').length > 0) ? handbid.setupConnect() : '';

    });


})(jQuery);