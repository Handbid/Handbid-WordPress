/**
 * @copyright Copyright (c) 2014-2015 Handbid Inc.
 * @category handbid
 * @package Handbid2-WordPress
 * @license Proprietary
 * @link http://www.handbid.com/
 * @author Master of Code (worldclass@masterofcode.com)
 */



var socket = new YiiNodeSocket();
//socket.debug(true);
/*
 ********************** BOOTSTRAP / CONNECT **********************
 */

var connectedToSocket = false;

socket.onConnect(function () {
console.log("success connect");
    connectedToSocket = true;

    var $ = jQuery;

    var auctionChannel = socket.room(auctionChannelId).join(function (success) {
        // success - boolean
        if (success) {

            console.log(" ===== SUCCESS ====="+ $.getCurrentDateAndTime());

            this.on('event.bid', function (data) {
                console.log(" ===== event.bid ====="+ $.getCurrentDateAndTime());
                console.log(data);
                $.eventAuctionBid(data);
            });

            this.on('event.auction', function (data) {
                console.log(" ===== event.auction ====="+ $.getCurrentDateAndTime());
                console.log(data);
                $.eventAuction(data);
            });

            this.on('event.broadcast', function (data) {
                console.log(" ===== event.broadcast ====="+ $.getCurrentDateAndTime());
                console.log(data);
                $.eventAuctionBroadcast(data);
            });

            this.on('event.item', function (data) {
                console.log(" ===== event.item ====="+ $.getCurrentDateAndTime());
                console.log(data.values);
                $.eventAuctionItem(data);
            });

            this.on('event.timer', function (data) {
                console.log(" ===== event.timer ====="+ $.getCurrentDateAndTime());
                console.log(data);
                $.eventAuctionTimer(data);
            });

        } else {
            console.log(" ===== ERROR ====="+ $.getCurrentDateAndTime());
            this.log(this.getError());
        }
        return true;
    });

    var userChannel = socket.room(userChannelId).join(function (success) {
        if (success) {

            this.on('event.bid', function (data) {
                console.log(" ===== user event.bid ====="+ $.getCurrentDateAndTime());
                $.eventUserBid(data);
            });

            this.on('event.broadcast', function (data) {
                console.log(" ===== user event.broadcast ====="+ $.getCurrentDateAndTime());
                $.eventUserBroadcast(data);
            });

            this.on('event.purchase', function (data) {
                console.log(" ===== user event.purchase ====="+ $.getCurrentDateAndTime());
                $.eventUserPurchase(data);
            });

            this.on('event.receipt', function (data) {
                console.log(" ===== user event.receipt ====="+ $.getCurrentDateAndTime());
                $.eventUserReceipt(data);
            });

            this.on('event.user', function (data) {
                console.log(" ===== user event.user ====="+ $.getCurrentDateAndTime());
                $.eventUser(data);
            });

        } else {
            console.log(" ===== USER CHANNEL ERROR ====="+ $.getCurrentDateAndTime());
            this.log(this.getError());
        }
        return true;
    });

    /*
     ********************** TEMP CUSTOM FUNCTIONS **********************
     */
    $.getCurrentDateAndTime = function (){
        var currentdate = new Date();
        return  currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds();
    };


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

        handbidMain.processAuctionChange(data.values);

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
        var message = JSON.stringify(data, null, 2);
        //handbidMain.showTimerRemainingNotice(data.values.timerRemaining);
        handbidMain.changeAuctionTimer(data.values.timerRemaining, true);
        //handbidMain.notice(message);
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
        var message = JSON.stringify(data, null, 2);
        console.log(data.values);
        //handbidMain.notice(message);
    };

    /**
     * User Personal Message Event
     * Notifies Client of user specific broadcast
     * Used when sending a particular user with a broadcast
     * @param Object data
     * @returns boolean
     */
    $.eventUserBroadcast = function (data) {
        var message = JSON.stringify(data, null, 2);
        console.log(data.values);
        //handbidMain.notice(message);
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
        var message = JSON.stringify(data, null, 2);
        console.log(data.values);
        handbidMain.addUserPurchase(data.values);
    };

    /**
     * User Receipt Event
     * Notifies Client of their receipt being generated
     * Used when a closed auction generated a user receipt
     * @param Object data
     * @returns boolean
     */
    $.eventUserReceipt = function (data) {
        var message = JSON.stringify(data, null, 2);
        console.log(data);
        //handbidMain.notice(message);
    };

    /**
     * User Profile Update Event
     * Notifies Client of change in User information
     * Used to notify client of changes in a users profile
     * @param Object data
     * @returns boolean
     */
    $.eventUser = function (data) {
        var message = JSON.stringify(data, null, 2);
        console.log(data.values);
        //handbidMain.notice(message);
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
        var msg = "<b>at "+data.values.name + ":</b><br>" + data.values.messageText;
        handbidMain.notice(msg, "Broadcast Message", "info", false);
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
        $('.auction-status').html(" " + data.values.status + " ");
        $('#currentAuctionStatus').attr("class", "auction-status-header auction-status bg-" + data.values.status);
        //
        var statusNotOpen = $('.auction-not-open'),
            statusOpen = $('.auction-open'),
            statusNotPaused = $('.auction-not-paused'),
            statusPaused = $('.auction-paused'),
            statusNotClosed = $('.auction-not-closed'),
            statusClosed = $('.auction-closed');
        switch (data.values.status) {
            case 'open':
                statusNotOpen.hide();
                statusOpen.show();
                statusNotPaused.show();
                statusPaused.hide();
                statusNotClosed.show();
                statusClosed.hide();
                break;
            case 'paused':
                statusNotOpen.show();
                statusOpen.hide();
                statusNotPaused.hide();
                statusPaused.show();
                statusNotClosed.show();
                statusClosed.hide();
                break;
            case 'closed':
                statusNotOpen.show();
                statusOpen.hide();
                statusNotPaused.show();
                statusPaused.hide();
                statusNotClosed.hide();
                statusClosed.show();
                break;
            default: break;
        }
        handbidMain.notice(data.values.name + ' is now ' + data.values.status.toUpperCase());

        return true;
    };

    /**
     * Updates a node item in displayed HTML
     * Used to update node item currentPrice
     * @param {type} data
     * @returns {Boolean}
     */
    $.effectNodeBidUpdate = function (data) {
        var winnerName = (data.values.winnerName != undefined) ? data.values.winnerName : data.values.bidderName ;
        var message = data.values.item.name + ' <br>New Winner <b>' + winnerName + '</b> <br>Amount $<b>' + data.values.amount + '</b>';
        //handbidMain.notice(message, "New Item Winner");
        handbidMain.addItemBidsHistory(data.values.item.id, data.values.id, winnerName, data.values.amount);
        handbidMain.checkIfBidsExistsAndChange(data.values, data.type);

        return true;
    };

    /**
     * Updates a node item in displayed HTML
     * Used to update node item currentPrice
     * @param {type} data
     * @returns {Boolean}
     */
    $.effectNodeItemUpdate = function (data) {

        handbidMain.processItemChange(data.values);

        return true;
    };


    // you can bind events handlers for some events without join
    // in this case you should be subscribed to `test` channel
    // socket.channel('test').on('some_event', function (data) {
    //
    //
});

socket.onDisconnect(function(){
    connectedToSocket = false;
    console.log("socket disconnect");
});
