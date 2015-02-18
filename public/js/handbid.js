(function ($) {

    var handbid = {

        // Setup bidding
        setupBidding : function(container) {

            var amount = $('[data-handbid-quantity], [data-handbid-bid-amount]', container),
                increment = $('.increment span')[0].innerHTML || 1;

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

        // Setup credit cards
        setupCreditCard : function() {

            $('[data-handbid-delete-credit-card]').on('click', function(e) {
                e.preventDefault();
                alert('Delete Credit Card : ' + $(this).attr('data-handbid-delete-credit-card'));
            })

        },
        setupConnect : function() {
            $('[data-handbid-connect]').on('click', function(e) {

                e.preventDefault();

                alert('connect clicked');

            })
        }
    };

    $(document).ready(function () {
        if ($('[data-handbid-item-key], [data-no-bids], [data-tags]').length > 0) {
            $('body').addClass('enable-handbid-fatal-error');
        }

        $(window).on('beforeunload', function () {

            $('body').addClass('handbid-refreshing-page');

        });

        ($('[data-handbid-bid]').length > 0) ? handbid.setupBidding($('[data-handbid-bid][data-handbid-item-key]')) : '';
        ($('[data-handbid-delete-credit-card]').length > 0) ? handbid.setupCreditCard() : '';
        ($('[data-handbid-connect]').length > 0) ? handbid.setupConnect() : '';

        // On bids
    });


})(jQuery);