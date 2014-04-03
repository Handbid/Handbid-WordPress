var $j = jQuery.noConflict();

$j(function() {

    // Block of code written to get selectors
    // @TODO this should be put somewhere better
    var bidAmountDom = document.getElementById("bidAmountTotal");
    if(bidAmountDom) {
        var basePrice = bidAmountDom.innerHTML;
    }

    var bidLabel = document.getElementById("bidLabel");
    var proxyBid = document.getElementById('proxyBid');

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
                proxyBid.classList.remove('show');
            }
        }
        else
        {
            alert('You can not bid lower than the minimum bid');
        }

    });

    var bidUp = $j( ".bidUpDown .up" );
    bidUp.on('click', function() {
        bidAmount += bidIncrement;
        bidAmountDom.innerHTML = bidAmount;
        bidLabel.innerHTML = "$" + (bidAmount - basePrice) + " above minimum bid";
        proxyBid.classList.add('show');

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
        proxyBid.classList.remove('show');
    });

});