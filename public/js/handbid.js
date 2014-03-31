var $j = jQuery.noConflict();

$j(function() {

    var bidAmountDom = document.getElementById("bidAmountTotal");
    var basePrice = bidAmountDom.innerHTML;

    var bidLabel = document.getElementById("bidLabel");

    var bidAmount = parseInt($j(".bidDescription .amount .value").text());
    var bidIncrement = parseInt($j(".bidDescription .bidIncrement .value").text());

    var bidDown = $j( ".bidUpDown .down" );
    bidDown.on('click', function() {
        if(bidAmount > basePrice)
        {
            bidAmount -= bidIncrement;
            bidAmountDom.innerHTML = bidAmount;
            bidLabel.innerHTML = "$" + (bidAmount - basePrice) + " above minimum bid";

            if(bidAmount == basePrice) {
                bidLabel.innerHTML = "Minimum next bid";
            }
        }
        else
        {
            alert('You can not bid lower than the minimum bid')
        }

    });

    var bidUp = $j( ".bidUpDown .up" );
    bidUp.on('click', function() {
        bidAmount += bidIncrement;
        bidAmountDom.innerHTML = bidAmount;
        bidLabel.innerHTML = "$" + (bidAmount - basePrice) + " above minimum bid";

    });

    var bidNow = $j( ".bidNow" );
    bidNow.on('click', function() {
        alert('Bid submitted at ' + bidAmount);
        onItemUpdate();
    });

    var reset = $j( ".bidContainer .reset" );
    reset.on('click', function() {
        bidAmount = parseInt(basePrice);
        bidAmountDom.innerHTML = basePrice;
        bidLabel.innerHTML = "Minimum next bid";
    });

    function onItemUpdate() {
        console.log('onItemUpdate');
    }
    function onAuctionUpdated() {
        console.log('onAuctionUpdated');
    }
    function updateDomForItem() {
        console.log('updateDomForItem');
    }
    function updateDomForAuction() {
        console.log('updateDomForAuction');
    }

});