(function ($) {

    var handbid = {

        // Setup bidding
        setupBidding : function(container) {

            var quantity = $('[data-handbid-quantity]', container)[0];

            var value = quantity.value;

            $('[data-handbid-bid-button="up"]').on('click', function() {
                quantity.innerHTML++;
            });

            $('[data-handbid-bid-button="down"]').on('click', function() {
                if(quantity.innerHTML > 0) {
                    quantity.innerHTML--;
                }
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

        // On bids
    });


})(jQuery);