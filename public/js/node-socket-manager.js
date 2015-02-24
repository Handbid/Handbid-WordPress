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

    var $ = jQuery;

    var auctionChannel = socket.room(auctionChannelId).join(function (success) {
        // success - boolean
        if (success) {

            this.on('event.bid', function (data) {
                $.eventAuctionBid(data);
            });

            this.on('event.auction', function (data) {
                $.eventAuction(data);
            });

            this.on('event.broadcast', function (data) {
                $.eventAuctionBroadcast(data);
            });

            this.on('event.item', function (data) {
                $.eventAuctionItem(data);
            });

            this.on('event.timer', function (data) {
                $.eventAuctionTimer(data);
            });

        } else {
            console.log(this.getError());
        }
        return true;
    });

    var userChannel = socket.room(userChannelId).join(function (success) {
        if (success) {

            this.on('event.bid', function (data) {
                $.eventUserBid(data);
            });

            this.on('event.broadcast', function (data) {
                $.eventUserBroadcast(data);
            });

            this.on('event.purchase', function (data) {
                $.eventUserPurchase(data);
            });

            this.on('event.receipt', function (data) {
                $.eventUserReciept(data);
            });

            this.on('event.user', function (data) {
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
    $.eventAuction = function (data) {

        switch (data.attribute) {
            case 'status':
                $.effectNodeAuctionStatusUpdate(data);
                break;
            case 'displayRevenue':
                $.effectNodeAuctionRevenueUpdate(data);
                break;

            default:

                break;
        }
    };

    /**
     * Auction Bidding Action Event
     * Notifies Client of a Bid on any Auction Item
     * Notifies Auction channel when an item is bid on.
     * @param Object data
     * @returns boolean
     */
    $.eventAuctionBid = function (data) {
        return $.effectNodeBidUpdate(data);
    };

    /**
     * Auction Item Updates Event
     * Notifies Client of a Change on an Auction Item
     * Used when prices, descriptions and names change
     * @param Object data
     * @returns boolean
     */
    $.eventAuctionItem = function (data) {
        console.log(data.values);
        $('[data-handbid-bid-amount]').html(data.values.currentPrice);
        return $.effectNodeItemUpdate(data);
    };

    /**
     * Auction Broadcast Message Event
     * Notifies Client of an Auction Broadcast Message
     * Used to display broadcast auction messages
     * @param Object data
     * @returns boolean
     */
    $.eventAuctionBroadcast = function (data) {
        return $.effectNodeAuctionBroadcast(data);
    };

    /**
     * Auction Timer Update Event
     * Notifies Client of a change in Auction Timer
     * Used when an auction has been extended
     * @param Object data
     * @returns boolean
     */
    $.eventAuctionTimer = function (data) {
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
    $.eventUserBid = function (data) {
        alert(JSON.stringify(data, null, 2));
    };

    /**
     * User Personal Message Event
     * Notifies Client of user specific broadcast
     * Used when sending a particular user with a broadcast
     * @param Object data
     * @returns boolean
     */
    $.eventUserBroadcast = function (data) {
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
    $.eventUserPurchase = function (data) {
        alert(JSON.stringify(data, null, 2));
    };

    /**
     * User Receipt Event
     * Notifies Client of their receipt being generated
     * Used when a closed auction generated a user receipt
     * @param Object data
     * @returns boolean
     */
    $.eventUserReciept = function (data) {
        alert(JSON.stringify(data, null, 2));
    };

    /**
     * User Profile Update Event
     * Notifies Client of change in User information
     * Used to notify client of changes in a users profile
     * @param Object data
     * @returns boolean
     */
    $.eventUser = function (data) {
        alert(JSON.stringify(data, null, 2));
    };

    /*
     ********************** SHARED FUNCTIONS **********************
     */


    /**
     * Updates a active auction status display
     * Used to update action status
     * @param {type} data
     * @returns {Boolean}
     */
    $.effectNodeAuctionBroadcast = function (data) {
        var msg = '';
        if (userChannelId == data.values.ownerGuid) {
            msg = data.values.name + " Broadcast Sent \r\n" + data.values.messageText;
        } else {
            msg = data.values.name + " Broadcast Alert \r\n" + data.values.messageText;
        }
        alert( msg );

        return true;
    };

    /**
     * Updates a node item in displayed HTML
     * Used to update node item currentPrice
     * @param {type} data
     * @returns {Boolean}
     */
    $.effectNodeAuctionRevenueUpdate = function (data) {

        //var attribute = $('.auction-revenue');
        //
        //attribute.fadeOut("slow");
        //attribute.html(data.values.displayRevenue);
        //
        //attribute.css({
        //    "font-weight": "bolder"
        //}).fadeIn('slow');

        return true;
    };

    /**
     * Updates a active auction status display
     * Used to update action status
     * @param {type} data
     * @returns {Boolean}
     */
    $.effectNodeAuctionStatusUpdate = function (data) {
        //$('.auction-status').html(" " + data.values.status + " ");
        //$('#currentAuctionStatus').attr("class", "auction-status-header auction-status bg-" + data.values.status);
        ////
        //switch (data.values.status) {
        //    case 'open':
        //        $('.auction-not-open').hide();
        //        $('.auction-open').show();
        //        $('.auction-not-paused').show();
        //        $('.auction-paused').hide();
        //        $('.auction-not-closed').show();
        //        $('.auction-closed').hide();
        //        break;
        //    case 'paused':
        //        $('.auction-not-open').show();
        //        $('.auction-open').hide();
        //        $('.auction-not-paused').hide();
        //        $('.auction-paused').show();
        //        $('.auction-not-closed').show();
        //        $('.auction-closed').hide();
        //        break;
        //    case 'closed':
        //        $('.auction-not-open').show();
        //        $('.auction-open').hide();
        //        $('.auction-not-paused').show();
        //        $('.auction-paused').hide();
        //        $('.auction-not-closed').hide();
        //        $('.auction-closed').show();
        //        break;
        //}
        //alert(data.values.name + ' is now ' + data.values.status);

        return true;
    };

    /**
     * Updates a node item in displayed HTML
     * Used to update node item currentPrice
     * @param {type} data
     * @returns {Boolean}
     */
    $.effectNodeBidUpdate = function (data) {

        alert(data.values.item.name + ' - New Winner ' + data.values.winnerPin + ' - $' + data.values.amount);

        return true;
    };

    /**
     * Updates a node item in displayed HTML
     * Used to update node item currentPrice
     * @param {type} data
     * @returns {Boolean}
     */
    $.effectNodeItemUpdate = function (data) {

        //var item = $('[data-guid=' + data.guid + ']');
        //var attribute = item.children('[data-attribute=' + data.attribute + ']');
        //var icon = ' <i class="fa fa-arrow-up" aria-hidden="true"></i> ';
        //
        //attribute.fadeOut("slow");
        //if (data.attribute == 'currentPrice') {
        //    attribute.html(data.values.currentPrice);
        //}
        //if (data.attribute == 'bidCount') {
        //    attribute.html(data.values.bidCount);
        //}
        //
        //attribute.css({
        //    "background-color": "#cccccc",
        //    "color": '#fff',
        //    "font-weight": "bolder"
        //}).fadeIn('slow');
        //item.css({
        //    "background-color": "#9EB84A"
        //});

        return true;
    };


    // you can bind events handlers for some events without join
    // in this case you should be subscribed to `test` channel
    // socket.channel('test').on('some_event', function (data) {
    //
    //
});
