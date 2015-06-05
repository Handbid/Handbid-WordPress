/**
 * @copyright Copyright (c) 2014-2015 Handbid Inc.
 * @category handbid
 * @package Handbid2-WordPress
 * @license Proprietary
 * @link http://www.handbid.com/
 * @author Master of Code (worldclass@masterofcode.com)
 */

var handbidMain;
(function ($) {

    var restEndpoint = $("#apiEndpointsAddress").val(),
        currencySymbol = '$',
        statusReasons = {
            no_response : "Sorry, try again later",
            current_winner : "You are current winner of this item"
        },
        handbid = {

            loggedIn : null,
            timerNotice : null,

            number_format: function(number, decimals, dec_point, thousands_sep) {
                number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
                var n = !isFinite(+number) ? 0 : +number,
                    prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
                    sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
                    dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
                    s = '',
                    toFixedFix = function(n, prec) {
                        var k = Math.pow(10, prec);
                        return '' + (Math.round(n * k) / k)
                            .toFixed(prec);
                    };
                s = (prec ? toFixedFix(n, prec) : '' + Math.round(n))
                    .split('.');
                if (s[0].length > 3) {
                    s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
                }
                if ((s[1] || '')
                        .length < prec) {
                    s[1] = s[1] || '';
                    s[1] += new Array(prec - s[1].length + 1)
                        .join('0');
                }
                return s.join(dec);
            },


            noticeIfNoCreditCard: function(elem){
                var attr = elem.attr('data-handbid-credit-cards-required');

                var needCreditCard = (typeof attr !== typeof undefined && attr !== false);
                if(needCreditCard){
                    handbidMain.notice("Please add credit card to your profile for this action", "Credit Card Required", "error");
                }
                return needCreditCard;
            },

            disableAllBiddingButtonsIfSold: function(){

                $('[data-handbid-bid-button="up"]').addClass("disabled-button");
                $('[data-handbid-bid-button="down"]').addClass("disabled-button");
                $('[data-handbid-bid-button="bid"]').addClass("disabled-button");
                $('[data-handbid-bid-button="proxy"]').addClass("disabled-button");
                $('[data-handbid-bid-button="purchase"]').addClass("disabled-button");
                $('[data-handbid-bid-button="buyItNow"]').addClass("disabled-button");

            },

            isButtonDisabledOrAlreadyActive: function(button){

                return button.hasClass("disabled-button") || button.hasClass("active");

            },

            getStatusReasonByCode: function(code){

                return (statusReasons[code] != undefined) ? statusReasons[code] : code;

            },

            cannotDoIfUnauthorized: function(){
                if(! this.loggedIn){
                    this.notice("You should register or login to bid", "Unauthorized", "error");
                }
                return ! this.loggedIn;
            },

            // Setup bidding
            setupBidding:             function (handbid) {

                var userId = ($('[data-handbid-user-id]').length > 0) ? $('[data-handbid-user-id]').attr('data-handbid-user-id') : (parseInt($("#bidUserId").val()) ? parseInt($("#bidUserId").val()) : null),
                    auctionId = ($('[data-handbid-auction-id]').length > 0) ? $('[data-handbid-auction-id]').attr('data-handbid-auction-id') : (parseInt($("#bidAuctionId").val()) ? parseInt($("#bidAuctionId").val()) : null),
                    itemId = ($('[data-handbid-item-id]').length > 0) ? $('[data-handbid-item-id]').attr('data-handbid-item-id') : (parseInt($("#bidItemId").val()) ? parseInt($("#bidItemId").val()) : null),
                    amount = $('[data-handbid-quantity], [data-handbid-bid-amount]'),
                    increment = ($('.increment span.incrementSpan').length > 0 ) ? parseInt($('.increment span.incrementSpan')[0].innerHTML) : 1,
                    minimalBidAmount = ($('.minimalBidAmount span').length > 0 ) ? parseInt($('.minimalBidAmount span')[0].innerHTML) : 1;

                $('[data-handbid-bid-button="up"]').live('click', function (e) {

                    var inventoryRemaining = parseInt($('[data-handbid-item-attribute="inventoryRemaining"]').eq(0).html());

                    if(handbid.isButtonDisabledOrAlreadyActive($(this)) || handbid.cannotDoIfUnauthorized() || handbid.noticeIfNoCreditCard($(this)) || inventoryRemaining == 0){
                        return false;
                    }

                    e.preventDefault();

                    var canBeUp = true;

                    var value = parseInt(amount[0].innerHTML) + increment;

                    if($(this).hasClass("isDirectPurchase")) {
                        var inventoryRemaining = ($('[data-handbid-item-attribute="inventoryRemaining"]').length > 0 ) ? parseInt($('[data-handbid-item-attribute="inventoryRemaining"]')[0].innerHTML) : -1;
                        inventoryRemaining = (inventoryRemaining) ? inventoryRemaining : -1;
                        var totalSoldItems = ($('[data-handbid-item-attribute="totalSoldItems"]').length > 0 ) ? parseInt($('[data-handbid-item-attribute="totalSoldItems"]')[0].innerHTML) : 0;
                        totalSoldItems = (totalSoldItems) ? totalSoldItems : 0;
                        canBeUp = ((inventoryRemaining == -1 ) || ((inventoryRemaining != -1) && (value <= inventoryRemaining)));
                    }
                    if(canBeUp) {

                        amount.each(function () {

                            this.innerHTML = value;

                        });
                    }

                });

                $('[data-handbid-bid-button="down"]').live('click', function (e) {

                    if(handbid.isButtonDisabledOrAlreadyActive($(this)) || handbid.cannotDoIfUnauthorized() || handbid.noticeIfNoCreditCard($(this))){
                        return false;
                    }

                    e.preventDefault();

                        var value = parseInt(amount[0].innerHTML) - increment;

                        if(value >= minimalBidAmount) {

                            amount.each(function () {
                                    this.innerHTML -= increment;
                            });
                        }

                });

                $('[data-handbid-bid-button="bid"]').live('click', function (e) {

                    if(handbid.isButtonDisabledOrAlreadyActive($(this)) || handbid.cannotDoIfUnauthorized() || handbid.noticeIfNoCreditCard($(this))){
                        return false;
                    }

                    e.preventDefault();

                    var total = amount[0].innerHTML;
                    var nonce = $("#bidNonce").val();
                    var button = $(this);
                    button.addClass("active");
                    var data = {
                        action:    "handbid_ajax_createbid",
                        nonce:     nonce,
                        userId:    userId,
                        auctionId: auctionId,
                        itemId:    itemId,
                        amount:    total
                    };
                    $.post(
                        ajaxurl,
                        data,
                        function (data) {

                            console.log("-----------------------");
                            console.log("----Bid Now success----");
                            data = JSON.parse(data);
                            console.log(data);
                            if(data.status == "failed"){
                                handbid.notice(handbid.getStatusReasonByCode(data.statusReason), data.status.toUpperCase(), data.status);
                            }
                            else{
                                $('[data-handbid-item-attribute="bidCount"]').html(data.item.bidCount);
                                $('[data-handbid-item-attribute="minimumBidAmount"]').html(currencySymbol + data.item.minimumBidAmount);
                                $('[data-handbid-item-banner="' + data.status + '"]').show();
                                handbid.notice('Bid placed for ' + currencySymbol + data.amount + '. You are now ' + data.status + ' this item');

                            }
                            button.removeClass("active");
                            return false;
                        }
                    );


                    //$.ajax({
                    //    url:     restEndpoint + 'bid/create',
                    //    type:    'POST',
                    //    data:    {
                    //        'userId':    userId,
                    //        'auctionId': auctionId,
                    //        'itemId':    itemId,
                    //        'amount':    total
                    //    },
                    //    success: function (data) {
                    //
                    //        alert('bidding clicked');
                    //        //$('[data-handbid-item-attribute="bidCount"]').html(data.item.bidCount);
                    //        //$('[data-handbid-item-attribute="minimumBidAmount"]').html(currencySymbol + data.item.minimumBidAmount);
                    //
                    //        //$('[data-handbid-item-banner="' + data.status + '"]').show();
                    //
                    //        //handbid.notice('Bid placed for ' + currencySymbol + data.amount + '. You are now ' + data.status + ' this item');
                    //
                    //
                    //        return false;
                    //    }
                    //});

                    return false;


                });

                $('[data-handbid-bid-button="proxy"]').live('click', function (e) {

                    if(handbid.isButtonDisabledOrAlreadyActive($(this)) || handbid.cannotDoIfUnauthorized() || handbid.noticeIfNoCreditCard($(this))){
                        return false;
                    }

                    var total = amount[0].innerHTML;
                    var nonce = $("#bidNonce").val();
                    var button = $(this);
                    button.addClass("active");
                    $(".proxy-bid-dialog-close").hide();
                    var data = {
                        action:    "handbid_ajax_createbid",
                        nonce:     nonce,
                        userId:    userId,
                        auctionId: auctionId,
                        itemId:    itemId,
                        maxAmount: total
                    };
                    $.post(
                        ajaxurl,
                        data,
                        function (data) {

                            console.log("-----------------------");
                            console.log("----Max Bid success----");
                            data = JSON.parse(data);
                            console.log(data);
                            button.removeClass("active");
                            $(".proxy-bid-dialog-close").show();
                            $(".proxy-bid-dialog-close").click();
                            return false;
                        }
                    );

                    return false;

                });

                $('[data-handbid-bid-button="purchase"]').live('click', function (e) {


                    var inventoryRemaining = parseInt($('[data-handbid-item-attribute="inventoryRemaining"]').eq(0).html());

                    if(handbid.isButtonDisabledOrAlreadyActive($(this)) || handbid.cannotDoIfUnauthorized() || handbid.noticeIfNoCreditCard($(this)) || inventoryRemaining == 0){
                        return false;
                    }

                    e.preventDefault();

                    var nonce = $("#bidNonce").val();
                    var perItem = parseInt($(this).data("handbid-buynow-price"));
                    var quantity = parseInt(amount[0].innerHTML);
                    var button = $(this);
                    button.addClass("active");
                    var data = {
                        action:    "handbid_ajax_createbid",
                        nonce:     nonce,
                        userId:    userId,
                        auctionId: auctionId,
                        itemId:    itemId,
                        amount:    perItem,
                        quantity:  quantity
                    };

                    $.post(
                        ajaxurl,
                        data,
                        function (data) {

                            console.log("-----------------------");
                            console.log("----Buy Items success----");
                            data = JSON.parse(data);
                            console.log(data);

                            button.removeClass("active");
                            var totalSoldContainer = $('[data-handbid-item-attribute="totalSoldItems"]').eq(0);
                            var totalSold = data.item.quantitySold;
                            totalSoldContainer.html(totalSold);
                            var inventoryRemainingCont = $('[data-handbid-item-attribute="inventoryRemaining"]').eq(0);
                            var inventoryRemaining = data.item.inventoryRemaining;
                            inventoryRemaining = (inventoryRemaining == -1) ? "∞" : inventoryRemaining;
                            inventoryRemainingCont.html(inventoryRemaining);
                            var startCount = (data.item.inventoryRemaining != 0) ? 1 : 0 ;
                            amount.html(startCount);

                            var message = "You purchased "+quantity+" <br>of Item #"+data.item.id+" <br><b>"+data.item.name+"</b>";
                            handbidMain.notice(message, "Congratulations!", "success");

                            return false;
                        }
                    );


                    return false;
                });

                $('[data-handbid-bid-button="buyItNow"]').live('click', function (e) {

                    if(handbid.isButtonDisabledOrAlreadyActive($(this)) || handbid.cannotDoIfUnauthorized() || handbid.noticeIfNoCreditCard($(this))){
                        return false;
                    }

                    e.preventDefault();

                    var nonce = $("#bidNonce").val();
                    var total = parseInt($(this).data("handbid-buynow-price"));
                    var button = $(this);
                    button.addClass("active");
                    var data = {
                        action:    "handbid_ajax_createbid",
                        nonce:     nonce,
                        userId:    userId,
                        auctionId: auctionId,
                        itemId:    itemId,
                        amount:    total
                    };
                    $.post(
                        ajaxurl,
                        data,
                        function (data) {

                            console.log("-----------------------");
                            console.log("----Buy Now success----");
                            data = JSON.parse(data);
                            console.log(data);

                            $('[data-handbid-item-banner="sold"]').show();
                            handbid.disableAllBiddingButtonsIfSold();
                            button.removeClass("active");
                            return false;
                        }
                    );


                    return false;

                });

                $('[data-handbid-delete-proxy]').live('click', function (e) {
                    if(handbid.isButtonDisabledOrAlreadyActive($(this)) || handbid.cannotDoIfUnauthorized() || handbid.noticeIfNoCreditCard($(this))){
                        return false;
                    }
                    e.preventDefault();

                    var nonce = $("#bidNonce").val();
                    var bidID = parseInt($(this).data("handbid-delete-proxy"));
                    var button = $(this);
                    button.addClass("active");
                    var data = {
                        action:    "handbid_ajax_removebid",
                        nonce:     nonce,
                        bidID:     bidID
                    };
                    $.post(
                        ajaxurl,
                        data,
                        function (data) {

                            console.log("-----------------------------");
                            console.log("----Delete Maxbid success----");
                            //data = JSON.parse(data);
                            console.log(data);

                            $(".bid-row-id-"+bidID).remove();
                            var proxiesCountContainer = $("[data-handbid-stats-num-proxies]");
                            var proxiesCount = parseInt(proxiesCountContainer.html());
                            proxiesCountContainer.html(proxiesCount - 1);

                            button.removeClass("active");
                            return false;
                        }
                    );


                    return false;

                });
            },

            recalculateTotalTicketsPrice: function(){
                var totalPrice = 0;
                var prices = $.map($("[data-handbid-ticket-id]"), function(val, i){
                    var parentBlock = $(val),
                        quantityBlock = $("[data-handbid-ticket-quantity]", parentBlock).eq(0),
                        quantity = parseInt(quantityBlock.html()),
                        itemID = parseInt(parentBlock.data("handbid-ticket-id")),
                        itemPrice = parseInt(parentBlock.data("handbid-ticket-price")),
                        itemTitle = $("[data-handbid-ticket-title]", parentBlock).eq(0).html();
                    totalPrice += quantity * itemPrice;
                    return (quantity > 0) ? {id : itemID, price : itemPrice, quantity : quantity, name : itemTitle} : null;
                });
                $("[data-handbid-tickets-total]").html(totalPrice);
                return prices;
            },

            // Setup tickets
            setupTicketsPurchasing:             function (handbid) {

                $('[data-handbid-ticket-button="up"]').live('click', function (e) {

                    e.preventDefault();

                    var parentBlock = $(this).parents( "[data-handbid-ticket-id]").eq(0),
                        otherButton = $("[data-handbid-ticket-button='down']", parentBlock).eq(0),
                        quantityBlock = $("[data-handbid-ticket-quantity]", parentBlock).eq(0),
                        remainingBlock = $("[data-handbid-tickets-remaining]", parentBlock).eq(0),
                        quantity = parseInt(quantityBlock.html()),
                        remainingSymb = remainingBlock.val(),
                        remaining = parseInt(remainingBlock.val()),
                        itemID = parseInt(parentBlock.data("handbid-ticket-id")),
                        itemStep = parseInt(parentBlock.data("handbid-ticket-step")),
                        itemPrice = parseInt(parentBlock.data("handbid-ticket-price"));

                    var newValue = quantity + itemStep;
                    if(newValue <= remaining || (remainingSymb == "-1" || remainingSymb == "∞")){
                        quantityBlock.html(newValue);
                        handbid.recalculateTotalTicketsPrice();
                        otherButton.removeClass("ghosted-out");

                        if(newValue + itemStep > remaining && !(remainingSymb == "-1" || remainingSymb == "∞")){
                            $(this).addClass("ghosted-out");
                        }
                    }

                });

                $('[data-handbid-ticket-button="down"]').live('click', function (e) {

                    e.preventDefault();

                    var parentBlock = $(this).parents( "[data-handbid-ticket-id]").eq(0),
                        otherButton = $("[data-handbid-ticket-button='up']", parentBlock).eq(0),
                        quantityBlock = $("[data-handbid-ticket-quantity]", parentBlock).eq(0),
                        remainingBlock = $("[data-handbid-tickets-remaining]", parentBlock).eq(0),
                        quantity = parseInt(quantityBlock.html()),
                        remaining = parseInt(remainingBlock.val()),
                        itemID = parseInt(parentBlock.data("handbid-ticket-id")),
                        itemStep = parseInt(parentBlock.data("handbid-ticket-step")),
                        itemPrice = parseInt(parentBlock.data("handbid-ticket-price"));

                    var newValue = quantity - itemStep;
                    if(newValue >= 0){
                        quantityBlock.html(newValue);
                        handbid.recalculateTotalTicketsPrice();
                        otherButton.removeClass("ghosted-out");

                        if(newValue - itemStep < 0){
                            $(this).addClass("ghosted-out");
                        }
                    }


                });

                $('[data-handbid-tickets-button="purchase"]').live('click', function (e) {

                    e.preventDefault();

                    var prices = handbid.recalculateTotalTicketsPrice();

                    if(handbid.isButtonDisabledOrAlreadyActive($(this)) || handbid.cannotDoIfUnauthorized() || handbid.noticeIfNoCreditCard($(this)) || prices.length == 0){
                        return false;
                    }

                    var closeModal = $(".handbid-modal.tickets-modal .modal-close").eq(0);
                    var button = $(this);
                    var nonce = button.data("handbid-buy-tickets-nonce");
                    var auctionId = button.data("handbid-auction-id");
                    var userId = button.data("handbid-profile-id");
                    button.addClass("active");
                    closeModal.hide();
                    var data = {
                        action:    "handbid_ajax_buy_tickets",
                        nonce:     nonce,
                        userId:    userId,
                        auctionId: auctionId,
                        items:     prices
                    };
                    console.log(data);
                    $.post(
                        ajaxurl,
                        data,
                        function (data) {

                            console.log("---------------------------");
                            console.log("----Buy Tickets success----");
                            data = JSON.parse(data);
                            console.log(data);

                            $.map($("[data-handbid-ticket-id]"), function(val, i){
                                var parentBlock = $(val),
                                    quantityBlock = $("[data-handbid-ticket-quantity]", parentBlock).eq(0),
                                    remainingBlock = $("[data-handbid-tickets-remaining]", parentBlock).eq(0),
                                    quantity = parseInt(quantityBlock.html()),
                                    remainingSymb = remainingBlock.val(),
                                    remaining = parseInt(remainingBlock.val());
                                quantityBlock.html(0);
                                if(remainingSymb != "-1" && remainingSymb != "∞"){
                                    remainingBlock.val(remaining - quantity);
                                }
                                return null;
                            });
                            $("[data-handbid-tickets-total]").html(0);


                            var messages = $.map(prices, function(val, i){
                                return "<b>"+val.quantity+"</b> of Item #"+val.id+" <br><b>"+val.name+"</b>";
                            });

                            var message = "You purchased <br>"+ messages.join("; <br>");

                            button.removeClass("active");
                            closeModal.show();
                            closeModal.click();

                            handbidMain.notice(message, "Congratulations!", "success");

                            return false;
                        }
                    );
                    return false;

                });

            },
            makePaymentForReceipt : function() {
                $('.make-payment-button').live('click', function (e) {

                    e.preventDefault();

                    if(handbid.isButtonDisabledOrAlreadyActive($(this)) || handbid.cannotDoIfUnauthorized() || handbid.noticeIfNoCreditCard($(this))){
                        return false;
                    }

                    var button = $(this);
                    var receiptBlock = button.parents(".receiptRow").eq(0);
                    var paidControls = $(".paidControls", receiptBlock).eq(0);
                    var unpaidControls = $(".unpaidControls", receiptBlock).eq(0);
                    var receiptPaymentBlock = button.parents(".receipt-payment-block").eq(0);
                    var cardId = $(".select-payment-card", receiptPaymentBlock).eq(0).val();
                    var nonce = button.data("make-payment-nonce");
                    var auctionId = button.data("auction-id");
                    var receiptId = button.data("receipt-id");

                    button.addClass("active");

                    var data = {
                        action:    "handbid_ajax_make_receipt_payment",
                        nonce:     nonce,
                        cardId:    cardId,
                        receiptId: receiptId,
                        auctionId: auctionId
                    };
                    $.post(
                        ajaxurl,
                        data,
                        function (data) {

                            console.log("---------------------------");
                            console.log("----Make payment success----");
                            data = JSON.parse(data);
                            console.log(data);

                            handbidMain.notice("Payment success", "Info", "info");

                            if(data.result.paid){
                                paidControls.slideDown();
                                unpaidControls.remove();
                                receiptBlock.addClass("open").addClass("preview");
                                handbidMain.notice("Your receipt was successfully paid!", "Congratulations!", "success");
                            }


                            //handbidMain.notice(message, "Congratulations!", "success");
                            button.removeClass("active");
                            return false;
                        }
                    );
                    return false;

                });
            },
            submitBid : function(data) {},
            setupConnect:             function () {

                var body = $('body'),
                    underlayContainer = '<div id="handbid-confirmation-underlay" ' +
                        'style="position: fixed; top:0px; bottom:0px; left: 0px; right: 0px; z-index: 1; display: none;"> ';


                body.append(underlayContainer);

                if (body.hasClass('handbid-logged-out')) {

                    this.loggedIn = false;

                    var loginModal = $('[data-handbid-modal-key="login-modal"]');

                    var underlay = $('#handbid-confirmation-underlay');

                    $('[data-handbid-connect]').live('click', function (e) {

                        e.preventDefault();

                        loginModal.css('display', 'block');
                        underlay.css('display', 'block');
                    });

                    $('.modal-close', loginModal).live('click', function () {

                        underlay.css('display', 'none');
                    });
                }
                else {
                    this.loggedIn = true;
                    $('[data-handbid-connect]').css('display', 'none');

                }
            },
            setupBidderDashboard: function() {
                $('.bidder-info-container .stats-bar').live('click.ajax-load', function() {

                    $.ajax({
                        url : '/wp-admin/admin-ajax.php',
                        type : 'POST',
                        data : {
                            action : 'load_bidder_dashboard'
                        },
                        dataType: 'html',
                        success: function(response) {
                            $(response).appendTo($('.bidder-dashboard-inner'));

                            // Open bider profile by default
                            //$('[data-slider-nav-key="profile-user-info"]').addClass('active-slide');
                            //$('[data-slider-nav-key="user-profile"]').addClass('active-slide');

                        }
                    });

                    $(this).off('.ajax-load');
                })
            },
            setupDeleteCreditCard : function() {


                $("[data-handbid-delete-credit-card]").live('click', function(e) {

                    e.preventDefault();
                    var button = $(this);

                    var cardID = button.data("handbid-delete-credit-card");
                    var nonce = $("#deleteCardNonce").val();

                    button.addClass("active");
                    var data = {
                        action: "handbid_ajax_remove_credit_card",
                        cardID: cardID,
                        nonce: nonce
                    };

                    $.post(
                        ajaxurl,
                        data,
                        function (data) {

                            console.log("-----------------------------");
                            console.log("----Remove Credit Card Success----");
                            console.log(data);
                            try{
                                data = JSON.parse(data);
                                console.log(data);
                            }
                            catch(e){}

                            button.removeClass("active");

                            if(data.error == undefined){

                                $('[data-handbid-card-row="' + cardID + '"]').remove();
                                handbid.notice('Your card has been deleted', "Card Success", "success");

                                $(".select-payment-card option[data-option-val="+cardID+"]").remove();

                                if($(".credit-card ul.simple-list li").length == 0){
                                    var list = $(".credit-card ul.simple-list");
                                    list.after('<div class="row no-results-row"> <p style="text-align: left;">Note: Not all auctions use credit cards</p>  <label class="no-results"> You have no cards on file. </label> </div>');
                                    list.remove();

                                    $("[data-handbid-credit-cards-need]").attr("data-handbid-credit-cards-required", "" );
                                    $(".select-payment-card").hide();
                                }
                            }
                            else{
                                handbid.notice('Something wrong. Please, try again later', "Card Error", "error");
                            }


                        }
                    );

                    return false;
                });
            },
            setupAddCreditCard : function() {
                var form = $('.creditcard-template'),
                    container = $('.bidder-info-container.credit-card ul'),
                    modalClose = $('[data-handbid-modal-key="credit-card-form"] .modal-close');

                form.live('submit', function(e) {


                    var _data = form.serialize();
                    var data = {
                        action: "handbid_ajax_add_credit_card",
                        data: _data
                    };
                    modalClose.click();

                    handbid.notice('Adding your card');

                    $.post(
                        ajaxurl,
                        data,
                        function (data) {

                            console.log("-------------------------------");
                            console.log("----Add Credit Card Success----");
                            console.log(data);
                            try{
                                data = JSON.parse(data);
                                console.log(data);
                            }
                            catch(e){}

                            if(data.error != undefined){
                                if(data.error.message != undefined){
                                    handbid.notice(data.error.message, "Card Error", "error");
                                }
                                else{
                                    handbid.notice("Something wrong. Please, try again later", "Card Error", "error");
                                }
                            }
                            else{
                                if(data.resp == undefined){
                                    handbid.notice("Something wrong. Please, try again later", "Card Error", "error");
                                }
                                else{
                                    if(data.resp.success != undefined && !data.resp.success && data.resp.data.error != undefined){
                                        var messageParts = $.map(data.resp.data.error, function(val, i){
                                            return val.join("<br>");
                                        });

                                        handbid.notice("<b>"+messageParts.join("<br>")+"</b>", "Card Error", "error");
                                    }
                                    else {
                                        handbid.notice("Your card has been added successfully", "Card Success", "success");
                                        var template = $(' <li class="row" data-handbid-card-row="' + data.resp.id + '"> <div class="col-md-3 col-xs-3"> <h4>Name</h4>' + data.resp.nameOnCard + '</div> <div class="col-md-3 col-xs-3"> <h4>Card Number</h4> xxxx xxxx xxxx ' + data.resp.lastFour + '</div> <div class="col-md-3 col-xs-3"> <h4>Exp. Date</h4>' + data.resp.expMonth + '/' + data.resp.expYear + '</div> <div class="col-md-3 col-xs-3"> <a class="button pink-solid-button  loading-span-button" data-handbid-delete-credit-card="' + data.resp.id + '"><em>Delete</em></a></div></li>'),
                                            hasCards = $('.credit-card .no-results-row').length > 0;

                                        var cardSelects = $(".select-payment-card");
                                        cardSelects.show();
                                        cardSelects.append("<option data-option-val='" + data.resp.id + "' value='" + data.resp.id + "'>" + data.resp.nameOnCard + " (xxxx xxxx xxxx " + data.resp.lastFour + ")</option>");

                                        if (!hasCards) {
                                            template.appendTo(container);
                                        }
                                        else {
                                            $('.credit-card .no-results-row').remove();

                                            var list = null;

                                            if ($('.credit-card .simple-list').length > 0) {
                                                console.log("1");
                                                list = $('.credit-card .simple-list');
                                            }
                                            else {
                                                console.log("2");
                                                list = $('<ul class="simple-list"></ul>');
                                            }
                                            console.log(list);
                                            list.prependTo($('.credit-card'));
                                            template.appendTo(list);

                                        }

                                        jQuery("[data-handbid-credit-cards-need]").removeAttr("data-handbid-credit-cards-required");
                                    }
                                }
                            }


                        }
                    );



                    return false;
                });
            },
            setupProvincesSelect : function() {

                var countriesSelect = $("#userAddressCountryId");
                var provincesSelect = $("#userAddressProvinceId");
                var provincesSelectRow = $(".provincesRow");
                var provincesByCountries = $("#provincesCountByCountry");

                countriesSelect.live("change", function(e){
                    var countryID = parseInt(countriesSelect.val());
                    var countryPrevID = parseInt(provincesByCountries.data("current-country"));
                    if(countryID != countryPrevID){
                        var countryProvinces = provincesByCountries.data("provinces-"+countryID);
                        console.log(countryID);
                        console.log(countryProvinces);
                        if(countryProvinces != undefined){

                            var nonce = countriesSelect.data("provinces-nonce");

                            var data = {
                                action: "handbid_ajax_get_countries_provinces",
                                nonce: nonce,
                                countryID: countryID
                            };
                            $.post(
                                ajaxurl,
                                data,
                                function (data) {
                                    console.log(data);
                                    data = JSON.parse(data);

                                    provincesSelect.find('option')
                                        .remove()
                                        .end()
                                        .val('');
                                    $.each(data, function (i, item) {
                                        provincesSelect.append($('<option>', {
                                            value: item.value,
                                            text : item.text
                                        }));
                                        if(i == 0){
                                            provincesSelect.val(item.value);
                                        }
                                    });
                                    provincesSelectRow.slideDown("fast");

                                }
                            );

                        }
                        else{
                            provincesSelectRow.slideUp("fast");
                            provincesSelect.find('option')
                                .remove()
                                .end()
                                .append('<option value="">No Provinces</option>')
                                .val('')

                        }
                        provincesByCountries.data("current-country", countryID);
                    }
                });



            },
            setupEditProfile: function () {
                var form = $('.edit-profile');

                form.on('submit', function(e) {

                    e.preventDefault();

                    var _data = $(this).serialize();

                    $.ajax({
                        url:     restEndpoint + 'bidder/update',
                        method: 'PUT',
                        data: _data,
                        success: function(data) {
                            handbid.notice('Your profile has been updated');

                            return false;
                        }
                    });

                    return false;

                });

            },
            setupAuthorizationStatus: function () {

                var authorized = $.cookie('handbid-auth') ? true : false;

                if (authorized === true) {
                    $('.handbid-logout').css('display', 'inline-block');
                    $('body').addClass('handbid-logged-in');

                    $.ajaxSetup({
                        headers: {
                            'Authorization': $.cookie('handbid-auth').split(": ")[1]
                        }
                    });
                }
                else {
                    $('.handbid-login').css('display', 'inline-block');
                    $('body').addClass('handbid-logged-out');
                }

            },
            oldNotice:                   function (msg) {

                handbid.noticeContainer = $('<div class="handbid-growl-container"></div>');
                handbid.noticeContainer.appendTo('body');
                handbid.noticeTemplate = '<div class="handbid-growl"><div class="message">Notice Message</div></div>';

                if(msg.indexOf('&') > -1) {
                    msg = msg.split('&')[0];
                }

                msg = msg.split('+').join(' ');

                var growl = $(handbid.noticeTemplate);
                $('.message', growl).html(msg);
                growl.appendTo(handbid.noticeContainer);

                setTimeout(function () {

                    growl.remove();

                }, 5000);
            },
            notice:  function (msg, title, type, hide) {

                title = (title != undefined) ? title : 'Notice Message';
                hide = (hide != undefined) ? hide : true;
                type = (type != undefined) ? type : 'info';
                type = (type == "failed") ? "error" : type;

                console.log(msg);

                try {

                    //PNotify.prototype.options.delay  = 120000;

                    return new PNotify({
                        title: title,
                        text: msg,
                        type: type,
                        hide: hide,
                        buttons: {
                            sticker: false
                        }
                    });

                } catch (err) {

                    this.oldNotice(msg);

                    return false;

                }

            },
            startTimer: function (handbid) {

                var continueTimer = true;
                $.map($("[data-handbid-timer]"), function(timer){
                    timer = $(timer);
                    var time = timer.html();
                    var arr = time.split(":");
                    var h = arr[0];
                    var m = arr[1];
                    var s = arr[2];
                    if (s == 0) {
                        if (m == 0) {
                            if (h == 0) {
                                handbidMain.notice("Auction closed!");
                                continueTimer = false;
                                //window.location.reload();
                                return;
                            }
                            h--;
                            m = 60;
                            if (h < 10) h = "0" + h;
                        }
                        m--;
                        if (m < 10) m = "0" + m;
                        s = 59;
                    }
                    else s--;
                    if (s < 10) s = "0" + s;
                    timer.html(h+":"+m+":"+s);
                });


                if(continueTimer) {
                    setTimeout(function () {
                        handbid.startTimer(handbid)
                    }, 1000);
                }
            },
            setTimerRemaining: function(handbid){
                var timerRemaining = $("#timerRemaining");
                if(timerRemaining.val() != undefined) {
                    var timerTime = parseInt(timerRemaining.val()),
                        timerTitle = timerRemaining.data("auction-name");
                    handbid.showTimerRemainingNotice(timerTime, timerTitle)
                }

            },
            showTimerRemainingNotice: function(timerTime, timerTitle){
                timerTitle = (timerTitle != undefined) ? " <b>"+timerTitle+"</b>" : "";
                var timeH = Math.floor(timerTime / 3600),
                    timeM = Math.floor((timerTime - timeH*3600) / 60),
                    timeS = timerTime - timeH*3600 - timeM*60,
                    timeFormatted = timeH + ":" + timeM + ":" + timeS;
                console.log(timeFormatted);
                (handbid.timerNotice) ? handbid.timerNotice.remove() : '';
                handbid.timerNotice = handbid.notice("Auction "+timerTitle+"<br>closes after <b><div data-handbid-timer>" + timeFormatted + "</div></b>", "Closing Auction Timer");
            }
        };

    $(document).ready(function () {

        handbidMain = handbid;

        restEndpoint = $("#apiEndpointsAddress").val();
        handbid.setupAuthorizationStatus();
        handbid.makePaymentForReceipt();

        if ($('[data-handbid-item-key], [data-no-bids], [data-tags]').length > 0) {
            $('body').addClass('enable-handbid-fatal-error');
        }

        var url = window.location.href;
        if (url.indexOf('handbid-notice') > -1) {

            handbid.notice(window.location.href.split('handbid-notice=')[1]);
        }

        //console.log(this.loggedIn);

        //if(this.loggedIn) {
            ($('.bidder-info-container').length > 0) ? handbid.setupBidderDashboard() : '';
            handbid.setupDeleteCreditCard();
            //handbid.setupAddCreditCard();
            ($('.edit-profile').length > 0) ? handbid.setupEditProfile() : '';
        //}
        //else {
            ($('[data-handbid-connect]').length > 0) ? handbid.setupConnect() : '';
        //}

        ($('[data-handbid-bid]').length > 0) ? handbid.setupBidding(handbid) : '';
        ($('[data-handbid-timer]').length > 0) ? handbid.startTimer(handbid) : '';
        ($('[data-handbid-tickets]').length > 0) ? handbid.setupTicketsPurchasing(handbid) : '';
        handbid.setTimerRemaining(handbid);




        var bidderInfo = jQuery("#bidder-info-load");
        bidderInfo.hide();
        jQuery.post(ajaxurl, {
                action: "handbid_profile_load",
                auction: bidderInfo.data("auction"),
                nonce: bidderInfo.data("load")
            },
            function (resp) {
                bidderInfo.html(resp);
                bidderInfo.slideDown("normal");
                ($('.creditcard-template').length > 0) ? handbid.setupAddCreditCard() : '';
                handbid.setupProvincesSelect();
            });

        $(".handbid-logout a").live("click", function(e){
            e.preventDefault();
            var path = $(this).attr("href");
            (new PNotify({
                title: 'Logout Confirmation',
                text: 'Are you sure want to logout?',
                icon: 'glyphicon glyphicon-question-sign',
                hide: false,
                confirm: {
                    confirm: true
                },
                buttons: {
                    closer: false,
                    sticker: false
                },
                history: {
                    history: false
                }
            })).get().on('pnotify.confirm', function() {
                    window.location = path;
                }).on('pnotify.cancel', function() {
                    return false;
                });
        });

        $("[data-toggle-invoice-link]").live("click", function(e){
            e.preventDefault();
            var invoiceID = $(this).data("toggle-invoice-link");
            $(this).toggleClass("opened-invoice");
            $("[data-receipt-block-id="+invoiceID+"] .invoice-details-container").slideToggle("normal");
        })

        $("[data-toggle-invoice-more-link]").live("click", function(e){
            e.preventDefault();
            var invoiceID = $(this).data("toggle-invoice-more-link");
            $(this).toggleClass("opened-invoice");
            $("[data-receipt-block-id="+invoiceID+"] .invoice-more-details-container").slideToggle("normal");
        })

    });

})(jQuery);