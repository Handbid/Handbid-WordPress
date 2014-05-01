var $j = jQuery.noConflict();

$j(function () {

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