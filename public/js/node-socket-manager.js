/**
 * @link http://www.handbid.com/
 * @copyright Copyright (c) 2014-2015 Handbid Inc.
 * @license Proprietary
 */

var socket = new YiiNodeSocket();

/*
 ********************** BOOTSTRAP / CONNECT **********************
 */

socket.onConnect(function () {

    var auctionChannel = socket.room(auctionChannelId).join(function(success){
        // success - boolean
        if (success) {

            this.on('event.bid', function(data){
                $.eventAuctionBid(data);
            });

            this.on('event.auction', function(data){
                $.eventAuction(data);
            });

            this.on('event.broadcast', function(data){
                $.eventAuctionBroadcast(data);
            });

            this.on('event.item', function(data){
                $.eventAuctionItem(data);
            });

            this.on('event.timer', function(data){
                $.eventAuctionTimer(data);
            });

        } else {
            console.log(this.getError());
        }
        return true;
    });

    var userChannel = socket.room(userChannelId).join(function(success){
        if (success) {

            this.on('event.bid', function(data){
                $.eventUserBid(data);
            });

            this.on('event.broadcast', function(data){
                $.eventUserBroadcast(data);
            });

            this.on('event.purchase', function(data){
                $.eventUserPurchase(data);
            });

            this.on('event.receipt', function(data){
                $.eventUserReciept(data);
            });

            this.on('event.user', function(data){
                $.eventUser(data);
            });

        } else {
            console.log(this.getError());
        }
        return true;
    });

    /*
     ********************** AUCTION FUNCTIONS **********************
     */

    /**
     * Auction Change Event
     * Notifies Client of changes in Auction Information
     * Used for auction time, name, description and status updates
     * @param data Object
     * @returns boolean
     */
    $.eventAuction = function(data) {
        alert(JSON.stringify(data, null, 2));

        switch(data.event) {

        }
    };

    /**
     * Auction Bidding Action Event
     * Notifies Client of a Bid on any Auction Item
     * Notifies Auction channel when an item is bid on.
     * @param Object data
     * @returns boolean
     */
    $.eventAuctionBid = function(data) {
        alert(JSON.stringify(data, null, 2));
    };

    /**
     * Auction Item Updates Event
     * Notifies Client of a Change on an Auction Item
     * Used when prices, descriptions and names change
     * @param Object data
     * @returns boolean
     */
    $.eventAuctionItem = function(data) {
        return $.effectNodeItemUpdate(data);
    };

    /**
     * Auction Broadcast Message Event
     * Notifies Client of an Auction Broadcast Message
     * Used to display broadcast auction messages
     * @param Object data
     * @returns boolean
     */
    $.eventAuctionBroadcast = function(data) {
        alert(JSON.stringify(data, null, 2));
    };

    /**
     * Auction Timer Update Event
     * Notifies Client of a change in Auction Timer
     * Used when an auction has been extended
     * @param Object data
     * @returns boolean
     */
    $.eventAuctionTimer = function(data) {
        alert(JSON.stringify(data, null, 2));
    };

    /*
     ********************** USER FUNCTIONS **********************
     */

    /**
     * User Bidding Update Event
     * Notifies Client of change in User bid status
     * Used when winning bid becomes a losing bid.
     * @param Object data
     * @returns boolean
     */
    $.eventUserBid = function(data) {
        alert(JSON.stringify(data, null, 2));
    };

    /**
     * User Personal Message Event
     * Notifies Client of user specific broadcast
     * Used when sending a particular user with a broadcast
     * @param Object data
     * @returns boolean
     */
    $.eventUserBroadcast = function(data) {
        alert(JSON.stringify(data, null, 2));
    };

    /**
     * User Purchasing Event
     * Winning Bid - Direct purchase
     * Notifies Client of a successful purchase
     * Used when winning bid becomes a purchase.
     * "You're a winner!"
     * @param Object data
     * @returns boolean
     */
    $.eventUserPurchase = function(data) {
        alert(JSON.stringify(data, null, 2));
    };

    /**
     * User Receipt Event
     * Notifies Client of their receipt being generated
     * Used when a closed auction generated a user receipt
     * @param Object data
     * @returns boolean
     */
    $.eventUserReciept = function(data) {
        alert(JSON.stringify(data, null, 2));
    };

    /**
     * User Profile Update Event
     * Notifies Client of change in User information
     * Used to notify client of changes in a users profile
     * @param Object data
     * @returns boolean
     */
    $.eventUser = function(data) {
        alert(JSON.stringify(data, null, 2));
    };

    /*
     ********************** SHARED FUNCTIONS **********************
     */

    /**
     * Updates a node item in displayed HTML
     * Used to update node item currentPrice
     * @param {type} data
     * @returns {Boolean}
     */
    $.effectNodeItemUpdate = function(data) {

        var item = $('[data-guid='+data.guid+']');
        var attribute = item.children('[data-attribute='+data.attribute+']');
        var icon = ' <i class="fa fa-arrow-up" aria-hidden="true"></i> ';

        attribute.fadeOut("slow");
        attribute.html(data.value+icon );
        attribute.css({
            "background-color": "#cccccc",
            "color":'#fff',
            "font-weight": "bolder"
        }).fadeIn('slow');
        item.css({
            "background-color": "#A8E8FC"
        });

        return true;
    };


    // you can bind events handlers for some events without join
    // in this case you should be subscribed to `test` channel
    // socket.channel('test').on('some_event', function (data) {
    // 
    // 
});