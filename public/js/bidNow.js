var $j = jQuery.noConflict();

$j(function () {

    // Block of code written to get selectors
    // @TODO this should be put somewhere better
    var bidAmountDom = $j(".bidAmountTotal");
    console.log(bidAmountDom);
    if (bidAmountDom) {
        var basePrice = bidAmountDom.innerHTML;
    }

    var proxyBid = $j('.proxyBid');

    var bidAmount = parseInt(bidAmountDom.text());
    var bidIncrement = parseInt($j(".bidIncrement .value").text());

    var bidUp = $j(".bidUpDown .up");

    bidUp.on('click', function () {
        bidAmount += bidIncrement;
        bidAmountDom.innerHTML = bidAmount;
        proxyBid.classList.add('show');

    });

    var bidDown = $j(".bidUpDown .down");

    bidDown.on('click', function () {
        if (bidAmount > basePrice) {
            bidAmount -= bidIncrement;
            bidAmountDom.innerHTML = bidAmount;

            if (bidAmount == basePrice) {
                proxyBid.classList.remove('show');
            }
        }
        else {
            alert('You can not bid lower than the minimum bid');
        }
    });

    var bidNow = $j(".bidNow");
    bidNow.on('click', function () {
        alert('Bid submitted at ' + bidAmount);
        onItemUpdate();
    });

});