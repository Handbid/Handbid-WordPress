/**
 * @copyright Copyright (c) 2014-2015 Handbid Inc.
 * @category handbid
 * @package Handbid2-WordPress
 * @license Proprietary
 * @link http://www.handbid.com/
 * @author Master of Code (worldclass@masterofcode.com)
 */



var handbidMain, connectMessage, modal_overlay, timerNotice, timerMessage, circleTimer, auctionInvoices;
(function ($) {

    var restEndpoint = $("#apiEndpointsAddress").val(),
        currencySymbol = '$',
        statusReasons = {
            no_response : "Sorry, try again later",
            current_winner : "You are current winner of this item"
        },
        stack_bar_top = {
            addpos2: 0,
            animation: true,
            dir1: "down",
            dir2: "right",
            firstpos1: 0,
            firstpos2: 0,
            nextpos1: 0,
            nextpos2: 0,
            push: "top",
            spacing1: 0,
            spacing2: 0
        },
        handbid = {

            loggedIn : null,

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

            in_array: function(array, p_val){
                for(var i = 0, l = array.length; i < l; i++)	{
                    if(array[i] == p_val) {
                        return true;
                    }
                }
                return false;
            },


            recalculateDashboardPrice: function(){
                var dashboardTotal = 0;
                var pricePart = 0;
                    $.map($("[data-dashboard-price]"), function(val){
                    pricePart = parseInt($(val).data("dashboard-price"));
                    dashboardTotal += pricePart;
                });
                $("[data-handbid-stats-grand-total]").html(dashboardTotal);
            },


            recheckBidCounts: function(){
                var maxBidsCount = $("[data-maxbid-item-id]").length;
                $("[data-handbid-stats-num-proxies]").html(maxBidsCount);

                var winningBidsCount = $("[data-winning-item-id]").length;
                $("[data-handbid-stats-num-winning]").html(winningBidsCount);

                var losingBidsCount = $("[data-losing-item-id]").length;
                $("[data-handbid-stats-num-losing]").html(losingBidsCount);

                var purchasedBidsCount = $("[data-purchased-item-id]").length;
                $("[data-handbid-stats-num-purchases]").html(purchasedBidsCount);
            },


            recheckAndRecalculateBids: function(){
                this.recheckBidCounts();
                this.recalculateDashboardPrice();
            },




            addDashboardBidProxy: function(bidID, itemID, itemName, itemKey, auctionKey, maxAmount){

                var pattern = '<li class="row bid-row-id-'+bidID+'" ' +
                    ' data-proxy-item-id="'+itemID+'" ' +
                    ' data-maxbid-item-id="'+itemID+'" ' +
                    ' data-proxy-item-max-value="'+maxAmount+'" ' +
                    ' data-maxbid-bid-id="'+bidID+'">' +
                    ' <div class="col-md-8 col-xs-8">' +
                    ' <a href="/auctions/'+auctionKey+'/item/'+itemKey+'"><h4>'+itemName+'</h4></a>' +
                    ' </div>' +
                    ' <div class="col-md-2 col-xs-2">' +
                    ' <span class="bid-amount winning">$<span>'+maxAmount+'</span></span>' +
                    ' </div>' +
                    ' <div class="col-md-2 col-xs-2">' +
                    ' <a class="button pink-solid-button loading-span-button" href="#" data-handbid-delete-proxy="'+bidID+'" data-item-id="'+itemID+'"><em>Delete</em></a>' +
                    ' </div>' +
                    ' </li>';

                var listBidsProxy = $(".handbid-list-of-bids-proxy").eq(0);
                this.removeItemFromDashboardList(itemID, "proxy");
                $("p", listBidsProxy).remove();
                listBidsProxy.prepend(pattern);

                this.recheckAndRecalculateBids();
            },


            addDashboardBidWinning: function(itemID, itemName, itemLink, amount){

                var pattern = '<li class="row"'+
                ' data-dashboard-price="'+amount+'"'+
                ' data-winning-item-id="'+itemID+'">'+
                ' <div class="col-md-10 col-xs-10">'+
                '     <a href="'+itemLink+'"><h4>'+itemName+'</h4></a>'+
                ' </div>'+
                ' <div class="col-md-2 col-xs-2">'+
                ' <span class="bid-amount winning">$<span>'+amount+'</span></span>'+
                ' </div>'+
                ' </li>';

                var listBidsWinning = $(".handbid-list-of-bids-winning").eq(0);
                $("p", listBidsWinning).remove();
                listBidsWinning.prepend(pattern);

                //this.removeItemFromDashboardList(itemID, "losing");

                this.displayOnlyCurrentStatusOfItem(itemID, "winning");

                this.recheckAndRecalculateBids();
            },


            addDashboardBidLosing: function(itemID, itemName, itemLink, amount){

                var pattern = '<li class="row"' +
                    'data-losing-item-id="'+itemID+'">' +
                    '<div class="col-md-8 col-xs-8">' +
                    '<a href="'+itemLink+'"><h4>'+itemName+'</h4></a>' +
                    '</div>' +
                    '<div class="col-md-4 col-xs-4">' +
                    '<span class="bid-amount losing">$<span>'+amount+'</span></span>' +
                    '</div>' +
                    '</li>';

                var listBidsLosing = $(".handbid-list-of-bids-losing").eq(0);
                listBidsLosing.prepend(pattern);
                $("p", listBidsLosing).remove();

                //this.removeItemFromDashboardList(itemID, "winning");

                this.displayOnlyCurrentStatusOfItem(itemID, "losing");

                this.recheckAndRecalculateBids();
            },


            addDashboardBidPurchased: function(itemID, itemName, itemKey, auctionKey, amount, quantity){

                var pattern = '<li class="row"' +
                    'data-dashboard-price="'+(amount * quantity)+'"' +
                    'data-purchased-item-id="'+itemID+'">' +
                    '<div class="col-md-4 col-xs-4">' +
                    '<a href="/auctions/'+auctionKey+'/item/'+itemKey+'"><h4>'+itemName+'</h4></a>' +
                '</div>' +
                '<div class="col-md-4 col-xs-4">' +
                '<h4 class="quantity-total">'+quantity+' x $'+amount+'</h4>' +
                '</div>' +
                '<div class="col-md-4 col-xs-4">' +
                '<span class="bid-amount winning">$<span>'+(amount * quantity)+'</span></span>' +
                '</div>' +
                '</li>';

                var listBidsPurchases = $(".handbid-list-of-bids-purchases").eq(0);
                $("p", listBidsPurchases).remove();
                listBidsPurchases.append(pattern);

                this.recheckAndRecalculateBids();
            },

            addItemBidsHistory: function(itemID, bidID, values, amount){

                var winnerName = (values.winnerName != undefined) ? values.winnerName : values.bidderName ;

                var pattern = '<li class="row open" data-list-bid-id="' + bidID + '">' +
                    '<div class="col-md-6">' +
                    '<h4>Bidder Pin</h4>' +
                    '<span>' + values.bidderName + '</span>' +
                    '</div>' +
                    '<div class="col-md-6">' +
                    '<span class="bid-amount winning">$<span>' + amount + '</span></span>' +
                    '</div>' +
                    '</li>';

                var listBidsHistory = $(".bid-history-item-"+itemID).eq(0);
                $("p", listBidsHistory).remove();
                $("li", listBidsHistory).removeClass("open").addClass("closed");
                listBidsHistory.prepend(pattern);

                this.recheckAndRecalculateBids();
            },

            addProfileActiveAuctions: function(){

                var bidderDashboardPlace = $("#bidder-info-load"),
                    bidderListOfActiveAuctions = $(".handbid-list-of-active-auctions").eq(0),
                    hiddenListOfActiveAuctions = $(".handbid-hidden-of-active-auctions").eq(0),
                    auctionID = parseInt(bidderDashboardPlace.data("auction")),
                    auctionStatus = bidderDashboardPlace.data("auction-status"),
                    auctionName = bidderDashboardPlace.data("auction-name"),
                    auctionKey = bidderDashboardPlace.data("auction-key"),
                    auctionImage = bidderDashboardPlace.data("auction-image"),
                    auctionOrgKey = bidderDashboardPlace.data("auction-organization-key"),
                    auctionOrgName = bidderDashboardPlace.data("auction-organization-name"),
                    alreadyInList = $("[data-handbid-active-profile-auction='"+auctionID+"']", bidderListOfActiveAuctions).length,
                    alreadyInHiddenList = $("[data-hidden-active-auction='"+auctionID+"']", hiddenListOfActiveAuctions).length;

                var pattern = '<li class="row '+auctionStatus+'" data-handbid-active-profile-auction="'+auctionID+'">' +
                    ' <div class="col-md-2"><img class="full-width-image"' +
                    'src="'+auctionImage+'"/>' +
                    '</div>' +
                    '<div class="col-md-7">' +
                    '<h4>'+auctionName+'</h4>' +
                    '<a href="/organizations/'+auctionOrgKey+'"' +
                    'class="org-link">'+auctionOrgName+'</a>' +
                    '</div>' +
                    '<div class="col-md-3">' +
                    '<a class="cta-link" href="/auctions/'+auctionKey+'">See Auction</a>' +
                    '</div>' +
                    '</li>';

                $("p", bidderListOfActiveAuctions).remove();
                if(! alreadyInList) {
                    bidderListOfActiveAuctions.prepend(pattern);
                }
                if(! alreadyInHiddenList) {
                    hiddenListOfActiveAuctions.prepend('<input type="hidden" data-hidden-active-auction="'+auctionID+'">');
                }
            },



            addItemToTickets: function(values){

                var ticket = values,
                    itemID = ticket.id,
                    buyNowPrice = ticket.buyNowPrice,
                    remaining = ticket.inventoryRemaining,
                    name = ticket.name,
                    description = (ticket.description)? ticket.description: "",
                    //step = (parseInt(ticket.ticketQuantity)) ? parseInt(ticket.ticketQuantity) : 1,
                    step = 1,
                    ticketsAreSoldStyle = (remaining == 0)? "":"display:none",
                    ticketsAreAvailableStyle = (remaining == 0)? "display:none":"",
                    ghostedButtonStyle = ((parseInt(remaining) > 0) && (remaining < step)) ? "ghosted-out" : "";

                var pattern = '<div class="row ticket-row" data-handbid-ticket-row="'+itemID+'">' +
                    '<div class="col-xs-12 ticket" data-handbid-ticket-id="'+itemID+'"' +
                    'data-handbid-ticket-price="'+buyNowPrice+'"' +
                    'data-handbid-ticket-step="'+step+'"' +
                    '>' +
                    '<div class="col-xs-5 ticket-part-container no-padding-left">' +
                    '<h4 class="ticket-title"><span data-handbid-ticket-title>'+name+'</span>' +
                    '</h4>' +
                    '<p class="ticket-description">'+description+'</p>' +
                    '</div>' +
                    '<div class="col-md-3 ticket-part-container">' +
                    '<strong class="ticket-price">$<span>'+buyNowPrice+'</span></strong>' +
                    '</div>' +
                    '<div class="col-md-4 ticket-part-container no-padding-right tickets-are-sold"' +
                    'style="'+ticketsAreSoldStyle+'">' +
                    '<h4>SOLD OUT</h4>' +
                    '</div>' +
                    '<div class="col-md-4 ticket-part-container no-padding-right tickets-are-available"' +
                    'style="'+ticketsAreAvailableStyle+'">' +
                    '<div class="col-md-4 col-xs-4 no-padding">' +
                    '<a href="" class="bid-price-toggle bid-down green-button button ghosted-out"' +
                    'data-handbid-ticket-button="down">-</a>' +
                    '</div>' +
                    '<div class="buy-quantity col-md-4 col-xs-4 no-padding">' +
                    '<span data-handbid-ticket-quantity>0</span>' +
                    '<input type="hidden" data-handbid-tickets-remaining value="'+remaining+'">' +
                    '</div>' +
                    '<div class="col-md-4 col-xs-4 ticket-quantity-up no-padding">' +
                    '<a href=""' +
                    'class="bid-price-toggle bid-up green-button button '+ghostedButtonStyle+'"' +
                    'data-handbid-ticket-button="up">+</a>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</div>';

                var listItemTickets = $(".tickets-container").eq(0);
                listItemTickets.prepend(pattern);
            },



            updateItemTicket: function(values){

                var ticket = values,
                    itemID = ticket.id,
                    buyNowPrice = ticket.buyNowPrice,
                    remaining = ticket.inventoryRemaining,
                    name = ticket.name,
                    description = (ticket.description)? ticket.description: "",
                    ticketQuantity = parseInt(ticket.ticketQuantity),
                    //step = (parseInt(ticket.ticketQuantity)) ? parseInt(ticket.ticketQuantity) : 1,
                    step = 1,
                    rowInTickets = $("[data-handbid-ticket-row='"+itemID+"']").eq(0),
                    rowTicketBlock = $("[data-handbid-ticket-block]", rowInTickets).eq(0),
                    remainingTicketBlock = $("[data-handbid-tickets-remaining]", rowInTickets).eq(0),
                    ticketsSoldBlock = $(".tickets-are-sold", rowInTickets).eq(0),
                    ticketsSoldAvailable = $(".tickets-are-available", rowInTickets).eq(0),
                    availableOutput = (remaining != -1) ? remaining+" available": "Unlimited quantity";

                $("[data-handbid-ticket-title]", rowInTickets).html(name);
                $("[data-handbid-ticket-description]", rowInTickets).html(description);
                $("[data-handbid-ticket-quant]", rowInTickets).html(ticketQuantity);
                $("[data-handbid-ticket-quant-remaining]", rowInTickets).html(availableOutput);
                $("[data-handbid-ticket-buynow]", rowInTickets).html(buyNowPrice);
                rowTicketBlock.data("handbid-ticket-price", buyNowPrice);
                rowTicketBlock.data("handbid-ticket-step", step);
                remainingTicketBlock.val(remaining);
                if(remaining == 0){
                    ticketsSoldBlock.slideDown("fast");
                    ticketsSoldAvailable.slideUp("fast");
                    $("[data-handbid-ticket-quantity]", rowInTickets).html("0");
                }
                else{
                    ticketsSoldBlock.slideUp("fast");
                    ticketsSoldAvailable.slideDown("fast");
                    if(remaining != -1 && (remaining < parseInt($("[data-handbid-ticket-quantity]", rowInTickets).html()))){
                        $("[data-handbid-ticket-quantity]", rowInTickets).html(remaining);
                    }
                }
                $("[data-is-hidden-item] [data-handbid-ticket-quantity]").html("0");

            },

            clickOnFiltersToReorder: function(){
                var firstCatLink = $('ul.by-category li.selected a')[0];
                if(firstCatLink != undefined){
                    firstCatLink.click();
                }
            },

            checkItemIsAvailableForPresale: function(){
                var availableForPreSale = $("[data-item-check-available-item-id]").val(),
                    auctionStatus = $("[data-item-check-status-auction-id]").val(),
                    itemStatus = $("[data-item-check-status-item-id]").val(),
                    biddingBlock = $("[data-item-bidding-id]"),
                    noBiddingBlock = $("[data-item-nobidding-id]");
                var itemCanNotBeShownInPreSale = ((auctionStatus == "preview" || auctionStatus == "presale") && (availableForPreSale != "1"));
                (itemCanNotBeShownInPreSale) ? biddingBlock.hide(): biddingBlock.show();
                (itemCanNotBeShownInPreSale) ? noBiddingBlock.show(): noBiddingBlock.hide();
            },


            processAuctionChange: function(values){

                var listAuctions = $(".handbid-list-of-active-auctions").eq(0);
                var listHiddenAuctions = $(".handbid-hidden-of-active-auctions").eq(0);
                var auctionID = values.id;
                var auctionStatus = values.status;

                if(auctionStatus != "open"){
                    $("[data-handbid-active-profile-auction="+auctionID+"]").remove();

                    if($("li", listAuctions).length == 0){
                        var noItemsText = listAuctions.data("no-items-text");
                        listAuctions.prepend("<p>"+noItemsText+"</p>");
                    }

                    if(auctionStatus == "closed"){
                        var hiddenAuctionIds = $("[data-hidden-active-auction="+auctionID+"]");

                        (hiddenAuctionIds.length) ? hiddenAuctionIds.remove() : "" ;
                        var hasInvoices = (hiddenAuctionIds.length);
                        handbid.notifyUserAboutAuctionClosing(values, hasInvoices);
                    }
                }

                var itemsOfAuctionCanBeToggled = $("[data-handbid-item-auction='"+auctionID+"']:not(.simple-box.status-available)");
                (auctionStatus == "preview" || auctionStatus == "presale") ? itemsOfAuctionCanBeToggled.addClass("not-available-in-presale") : itemsOfAuctionCanBeToggled.removeClass("not-available-in-presale") ;
                $(".filters .by-item-type li.selected a").eq(0).click();

                var enableCreditCardSupport = (values.enableCreditCardSupport == "1"),
                    receiptsOfAuction = $("[data-receipt-of-auction='"+auctionID+"']");
                (enableCreditCardSupport)?receiptsOfAuction.removeClass("invoiceNoCCAllowed"):receiptsOfAuction.addClass("invoiceNoCCAllowed");


                $("[data-item-check-status-auction-id='"+auctionID+"']").val(auctionStatus);
                this.checkItemIsAvailableForPresale();
            },


            processTicketChange: function(values){
                var itemID = values.id,
                    isTicketNow = (values.isTicket == "1"),
                    inventoryRemaining = values.inventoryRemaining,
                    inventoryZero = (inventoryRemaining == 0),
                    rowsInTickets = $("[data-handbid-ticket-row='"+itemID+"']"),
                    rowInTickets = rowsInTickets.eq(0),
                    wasInTickets = (rowsInTickets.length != 0),
                    removingTicket = (wasInTickets && !isTicketNow),
                    addingTicket = (!wasInTickets && isTicketNow),
                    updatingTicket = (wasInTickets && isTicketNow),
                    itemSimpleBox = $("[data-handbid-item-box='"+itemID+"']");

                if(removingTicket){
                    rowInTickets.slideUp("normal");
                    rowInTickets.remove();
                    this.recalculateTotalTicketsPrice();
                    itemSimpleBox.removeAttr("data-is-ticket");
                }
                if(addingTicket){
                    this.addItemToTickets(values);
                    this.recalculateTotalTicketsPrice();
                    itemSimpleBox.attr("data-is-ticket", "1");
                }
                if(updatingTicket){
                    this.updateItemTicket(values);
                    this.recalculateTotalTicketsPrice();
                }
                if(removingTicket || addingTicket){
                    this.clickOnFiltersToReorder();
                }

            },


            processItemChange: function(values){

                var itemID = values.id,
                    itemStatus = values.status,
                    showValue = values.showValue,
                    availableForPreSale = values.availableForPreSale;

                var parentElem = $("[data-handbid-item-box='"+itemID+"']").eq(0);

                var currentItemID = $("#bidItemId").val();
                if(currentItemID == itemID){
                    parentElem = $("[data-handbid-item-details-block='"+itemID+"']").eq(0);
                }

                $.each( values, function(attribute, value){
                    value = (value != undefined && value != null) ? value : 0;
                    if(attribute == "inventoryRemaining" && value == -1) {value = "∞"}
                    if(attribute == "categoryName") {
                        parentElem.attr("data-tags", "|"+value.toLowerCase()+"|");
                    }
                    if(attribute == "quantitySold") {
                        $('[data-handbid-sold-of-id=' + itemID + ']').html(value);
                    }
                    if(attribute == "bidCount") {
                        $('[data-handbid-bids-of-id=' + itemID + ']').html(value);
                    }
                    $('[data-change-attribute=' + attribute + ']', parentElem).html(value);
                    $('[data-handbid-item-attribute=' + attribute + ']', parentElem).html(value);
                });

                if(values.inventoryRemaining != undefined &&
                    values.inventoryRemaining != -1 &&
                    values.inventoryRemaining != "∞"){
                    var value = values.inventoryRemaining;
                    value = (value != undefined && value != null) ? value : 0;
                    $('[data-handbid-remaining-of-id=' + itemID + ']').html(value);
                }


                var needToReSort = false;
                var paramsBoxes = $("[data-handbid-params-box='"+itemID+"']"),
                    paramsBoxQuant = $("[data-is-hidden-item] [data-handbid-ticket-quantity]"),
                    isHidden = (values.isHidden == "1"),
                    isDirectPurchaseItem  = (values.isDirectPurchaseItem == "1"),
                    disableMobileBidding = (values.disableMobileBidding == "1"),
                    noBids = (!isDirectPurchaseItem && values.bidCount === 0);
                $.map(paramsBoxes, function(val){
                    var paramsBox = $(val);
                    var isBoxHidden = (paramsBox.eq(0).attr("data-is-hidden-item") != undefined);
                    needToReSort = ((isHidden && !isBoxHidden) || (!isHidden && isBoxHidden));
                    (isHidden) ? paramsBox.attr("data-is-hidden-item", "1") : paramsBox.removeAttr("data-is-hidden-item");
                    (isDirectPurchaseItem) ? paramsBox.attr("data-for-sale", "1") : paramsBox.removeAttr("data-for-sale");
                    (disableMobileBidding) ? paramsBox.attr("data-live", "1") : paramsBox.removeAttr("data-live");
                    (noBids) ? paramsBox.attr("data-no-bids", "1") : paramsBox.removeAttr("data-no-bids");
                });
                paramsBoxQuant.html("0");

                var itemValueBoxes = $(".itemValueBox"+itemID),
                    itemValueHidden = (showValue != "1" && showValue != 1);
                itemValueHidden ? itemValueBoxes.addClass("itemValueBoxHidden") : itemValueBoxes.removeClass("itemValueBoxHidden") ;

                this.processTicketChange(values);

                $("[data-item-check-status-item-id='"+itemID+"']").val(itemStatus);
                $("[data-item-check-available-item-id='"+itemID+"']").val(availableForPreSale);
                this.checkItemIsAvailableForPresale();

                if(needToReSort){
                    this.clickOnFiltersToReorder();
                }
            },


            loadActiveAuctionsToContainer: function(){

                var auctionsContainer = $(".active-auctions-list-area");
                auctionsContainer.addClass("loading-messages");
                var nonce = auctionsContainer.data("nonce");
                $.post(
                    ajaxurl,
                    {
                        action: "handbid_ajax_get_active_auctions",
                        nonce: nonce
                    },
                    function (data) {

                        data = JSON.parse(data);

                        auctionsContainer.removeClass("loading-messages");
                        auctionsContainer.html(data.auctions);

                        return false;
                    }
                );

            },


            loadInvoicesToContainer: function(scrolled){

                var unpaidInvoicesCountContainer = $(".unpaidInvoicesCountContainer");
                var invoicesContainer = $(".receipts-list-area");
                invoicesContainer.addClass("loading-messages");
                var nonce = invoicesContainer.data("nonce");
                $.post(
                    ajaxurl,
                    {
                        action: "handbid_ajax_get_invoices",
                        nonce: nonce
                    },
                    function (data) {

                        data = JSON.parse(data);

                        invoicesContainer.removeClass("loading-messages");
                        unpaidInvoicesCountContainer.html(data.unpaid);
                        (data.unpaid) ? unpaidInvoicesCountContainer.show() : unpaidInvoicesCountContainer.hide() ;
                        invoicesContainer.html(data.invoices);

                        if(!scrolled && data.unpaid > 0){
                            var unpaidInvoices = $.map($(".receiptRow.preview"), function(val){
                                var invoiceItem = $(val),
                                    invoiceItemID = parseInt(invoiceItem.data("receipt-block-id")),
                                    invoiceItemTotal = parseInt(invoiceItem.data("receipt-total")),
                                    invoiceItemTitle = $(".invoice-title", invoiceItem).eq(0).html();
                                return {
                                    id: invoiceItemID,
                                    total: invoiceItemTotal,
                                    title: invoiceItemTitle
                                };

                            });
                            $.map(unpaidInvoices, function(val){
                                var message = "You have an unpaid invoice with a Balance of $"+val.total+" in "+val.title+".  Do you want to pay it?";
                                new PNotify({
                                    title: 'Unpaid Invoice',
                                    type: 'info',
                                    text: message,
                                    icon: 'glyphicon glyphicon-off',
                                    addclass: 'handbid-message-notice',
                                    hide: false,
                                    mouse_reset: false,
                                    confirm: {
                                        confirm: true,
                                        buttons: [{
                                            text: 'View Invoice',
                                            addClass: 'view-invoices-button',
                                            click: function (notice) {
                                                handbid.scrollToInvoices(notice, val.id);
                                                notice.remove();
                                            }
                                        }]
                                    },
                                    buttons: {
                                        closer: true,
                                        sticker: false
                                    },
                                    history: {
                                        history: false
                                    }
                                });
                            });
                        }

                        return false;
                    }
                );

            },


            loadMessagesToContainer: function(){

                var messagesContainer = $(".messages-list-area");
                messagesContainer.addClass("loading-messages");
                var nonce = messagesContainer.data("nonce");
                $.post(
                    ajaxurl,
                    {
                        action: "handbid_ajax_get_messages",
                        nonce: nonce
                    },
                    function (data) {

                        data = JSON.parse(data);

                        messagesContainer.removeClass("loading-messages");
                        messagesContainer.html(data.messages);

                        return false;
                    }
                );

            },


            loadBidsHistoryToContainer: function(itemID){

                var bidsHistoryContainer = $(".bid-history-container-"+itemID);
                if(bidsHistoryContainer.length) {
                    bidsHistoryContainer.addClass("loading-messages");
                    var nonce = bidsHistoryContainer.data("bids-nonce");
                    $.post(
                        ajaxurl,
                        {
                            action: "handbid_ajax_get_bid_history",
                            itemID: itemID,
                            nonce: nonce
                        },
                        function (data) {
                            data = JSON.parse(data);

                            bidsHistoryContainer.removeClass("loading-messages");
                            bidsHistoryContainer.html(data.history);

                            return false;
                        }
                    );
                }
            },


            loadAllToContainers: function(){
                this.loadActiveAuctionsToContainer();
                this.loadInvoicesToContainer();
                this.loadMessagesToContainer();
            },


            scrollToInvoices: function(notice, invoiceID){
                if(invoiceID != undefined && $("rtg-"+invoiceID).is(":visible")){
                    return false;
                }
                var profileLinkVisible = $('a[data-slider-nav-key="profile-user-info"]:visible');
                profileLinkVisible.click();
                $('a[data-slider-nav-key="see-my-receipt"]:visible').click();
                $('html,body').animate({scrollTop: profileLinkVisible.offset().top},'normal');
                handbid.loadInvoicesToContainer(true);
                (notice != undefined) ? notice.remove() : "";
            },




            notifyUserAboutAuctionClosing: function(values, hasInvoices){

                var auctionName = values.name;
                var noticeText = 'Auction <b>'+auctionName+'</b> is closed now.';
                var buttons = [];
                var confirm = false;
                var hide = true;
                if(hasInvoices){
                    noticeText += "<br>You may have an unpaid invoices so you can check them.";
                    buttons.push({
                        text: 'View Invoices',
                        addClass: 'view-invoices-button',
                        click: function (notice) {
                            handbid.scrollToInvoices(notice);
                            notice.remove();
                        }
                    });
                    confirm = {
                        confirm: true,
                        buttons: buttons
                    };
                    hide = false;
                }


                (timerNotice != undefined) ? timerNotice.remove() : '';
                timerNotice = new PNotify({
                    title: 'Auction Closed',
                    type: 'info',
                    text: noticeText,
                    icon: 'glyphicon glyphicon-off',
                    addclass: 'handbid-message-notice',
                    hide: hide,
                    mouse_reset: false,
                    confirm: confirm,
                    buttons: {
                        closer: true,
                        sticker: false
                    },
                    history: {
                        history: false
                    }
                });

            },


            notifyUserAboutReceipt: function(values){

                var invoiceID = values.id;
                if($("[data-receipt-block-id='"+invoiceID+"']").length == 0) {
                    var auctionName = values.name;
                    var noticeText = values.name;
                    var buttons = [];
                    buttons.push({
                        text: 'View Invoice',
                        addClass: 'view-invoices-button',
                        click: function (notice) {
                            handbid.scrollToInvoices(notice);
                            notice.remove();
                        }
                    });
                    confirm = {
                        confirm: true,
                        buttons: buttons
                    };
                    hide = false;

                    var params = {
                        title: 'Auction Invoices',
                        type: 'info',
                        text: noticeText,
                        icon: '',
                        addclass: 'handbid-message-notice',
                        hide: true,
                        delay: 10000,
                        mouse_reset: false,
                        confirm: confirm,
                        buttons: {
                            closer: true,
                            sticker: false
                        },
                        history: {
                            history: false
                        }
                    };
                    if(auctionInvoices != undefined && auctionInvoices.animating == "out"){
                        auctionInvoices = undefined;
                    }
                    if(auctionInvoices != undefined){
                        auctionInvoices.update(params);
                    }
                    else{
                        auctionInvoices = new PNotify(params);
                    }
                }
            },


            removeItemFromDashboardList: function(itemID, status){
                var listBids = $(".handbid-list-of-bids-"+status).eq(0);
                $("[data-"+status+"-item-id="+itemID+"]").remove();
                if($("li", listBids).length == 0){
                    var noItemsText = listBids.data("no-items-text");
                    listBids.prepend("<p>"+noItemsText+"</p>");
                }
            },

            displayOnlyCurrentStatusOfItem: function(itemID, status){
                $("[data-handbid-box-id="+itemID+"][data-handbid-item-banner]").hide();
                $("[data-handbid-box-id="+itemID+"][data-handbid-item-banner='"+status+"']").show();

                $("[data-handbid-item-box="+itemID+"]").attr("data-handbid-item-box-status", status);
            },

            addLosingItemRow: function(itemID, values, type){

                this.removeItemFromDashboardList(itemID, "losing");

                var reasonStr = (type == "under_maxbid") ? " by MaxBid. " : ".";

                var itemLink = '/auctions/'+ values.auctionKey +'/item/' + values.item.key;

                var itemImage = (values.item.image != undefined) ? values.item.image : values.item.imageUrl;

                this.addDashboardBidLosing(values.item.id, values.item.name, itemLink, values.amount );

                this.removeItemFromDashboardList(itemID, "winning");

                this.recheckAndRecalculateBids();

                var noticeFormatting = {isBidding : true, itemLink: itemLink, itemImage: itemImage};

                this.notice('You are <br>outbid</b> the item <b>' + values.item.name + ' ('+values.item.itemCode+') </b> at $' + values.amount + "" + reasonStr + " <a href='"+itemLink+"'>GO TO ITEM</a>", "Losing Item", "error", null, noticeFormatting);

            },

            addWinningItemRow: function(itemID, values, type){

                this.removeItemFromDashboardList(itemID, "winning");

                var reasonStr = (type == "under_maxbid") ? " by MaxBid! " : " now!";

                var itemLink = '/auctions/'+ values.auctionKey +'/item/'+values.item.key;

                var itemImage = (values.item.image != undefined) ? values.item.image : values.item.imageUrl;

                this.addDashboardBidWinning(values.item.id, values.item.name, itemLink, values.amount );

                this.removeItemFromDashboardList(itemID, "losing");

                this.recheckAndRecalculateBids();

                var noticeFormatting = {isBidding : true, itemLink: itemLink, itemImage: itemImage};

                this.notice('You are <br>winning</b> the item <b>' + values.item.name + ' ('+values.item.itemCode+') </b> at $' + values.amount + ""+reasonStr, "Winner Winner", "success", null, noticeFormatting);
            },

            checkIfBidsExistsAndChange: function(values, type){

                var profileID = $("[data-dashboard-profile-id]").eq(0).data("dashboard-profile-id");
                var itemID = values.item.id;
                var bidWinnerID = values.winnerId;

                var isBidInWinning = $("[data-winning-item-id="+itemID+"]").length;
                var isBidInLosing = $("[data-losing-item-id="+itemID+"]").length;


                if(isBidInWinning && (bidWinnerID != profileID)){
                    // You Are Losing This Item.
                    console.log("----- LOSING ITEM -----");

                    this.addLosingItemRow(itemID, values);

                    this.checkIfMaxBidIsNotAtual(values);

                    this.loadMessagesToContainer();
                }
                if(bidWinnerID == profileID){
                    // You Are Winning This Item.
                    console.log("----- WINNING ITEM -----");

                    this.addWinningItemRow(itemID, values);

                    this.checkIfMaxBidIsNotAtual(values);

                    this.loadMessagesToContainer();
                }


            },

            checkIfMaxBidIsNotAtual: function(values){
                var itemID = values.item.id,
                    itemBlock = $("[data-maxbid-item-id='"+itemID+"']").eq(0),
                    itemBlockVal = parseInt(itemBlock.data("proxy-item-max-value"));
                if(itemBlock != undefined && values.amount >= itemBlockVal ) {
                    console.log(itemBlock != undefined && values.amount >= itemBlockVal);
                    this.removeItemFromDashboardList(itemID, "proxy");
                }
                this.recheckAndRecalculateBids();
            },




            addUserPurchase: function(values){
                this.removeItemFromDashboardList(values.item.id, "winning");
                this.addDashboardBidPurchased(values.item.id, values.name, values.item.key, values.auctionKey, values.pricePerItem, values.quantity );
                this.loadMessagesToContainer();
            },




            noticeIfNoCreditCard: function(elem){
                var attr = elem.attr('data-handbid-credit-cards-required');

                var needCreditCard = (typeof attr !== typeof undefined && attr !== false);
                var creditCardRows = $("[data-handbid-card-row]");
                if(needCreditCard && creditCardRows.length == 0){
                    handbidMain.notice("Please add credit card to your profile for this action", "Credit Card Required", "error");
                }
                return needCreditCard;
            },

            alreadyHaveMaxBidForItem: function(values){
                var currentBidderID = parseInt($("[data-dashboard-profile-id]").eq(0).data("dashboard-profile-id"));
                var winnerBidderID = values.item.winnerId;
                if(winnerBidderID == currentBidderID && values) {
                    var itemName = values.item.name;
                    var newMax = values.proxyBid;
                    var oldMax = values.item.highestProxyBid;
                    handbidMain.notice("Cannot create MaxBid at <b>" + itemName + "</b> at $" + newMax + ". You already have a maxbid for this item at $" + oldMax + " . Please remove the current maxbid to create a new one.", "Already Have MaxBid", "error");
                }
            },

            messageToAuctionManager: function(){

                $("[data-handbid-mail-to-manager]").live("click", function(e){
                    var emailTo = $(this).data("handbid-mail-to-manager");
                    var auction = $(this).data("handbid-auction");
                    var auctionID = $(this).data("handbid-auction-id");
                    var auctionOrg = $(this).data("handbid-auction-org");
                    var nonce = $(this).data("nonce");
                    e.preventDefault();
                    var messageNotice = new PNotify({
                        title: 'Send Email To Auction Manager',
                        text: '',
                        icon: 'glyphicon glyphicon-envelope',
                        addclass: 'handbid-message-notice',
                        hide: false,
                        mouse_reset: false,
                        confirm: {
                            prompt: true,
                            prompt_multi_line: true,
                            prompt_default: ''
                        },
                        buttons: {
                            closer: false,
                            sticker: false
                        },
                        history: {
                            history: false
                        }
                    });
                    messageNotice.get().on('pnotify.confirm', function(e, notice, val) {
                            notice.cancelRemove().update({
                                title: 'Sending Your Message',
                                text: $('<div/>').text(val).html() + '<br><br><div class="progress progress-striped active" style="margin:0">\
	                                            <div class="progress-bar" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%">\
		                                        <span class="sr-only">100%</span>\
	                                            </div>\
                                                </div>',
                                icon: true,
                                type: 'info',
                                hide: false,
                                confirm: {
                                    prompt: false
                                },
                                buttons: {
                                    closer: false,
                                    sticker: false
                                }
                            });
                            $.post(
                                ajaxurl,
                                {
                                    action: "handbid_ajax_send_message",
                                    text: val,
                                    email: emailTo,
                                    auction: auction,
                                    auctionID: auctionID,
                                    auctionOrg: auctionOrg,
                                    nonce: nonce
                                },
                                function (data) {
                                    console.log(data);
                                    notice.cancelRemove().update({
                                        title: '<b>Message Sent</b>',
                                        text: "<b>Thank you, your message has been sent</b>",
                                        icon: true,
                                        type: 'success',
                                        hide: true,
                                        delay: 3000,
                                        confirm: {
                                            prompt: false
                                        },
                                        buttons: {
                                            closer: true,
                                            sticker: false
                                        }
                                    });
                                }
                            );
                        });
                });

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

                    var amountContainer = amount;
                    var amountDuplicate = null;

                    var isMaxBidButton = $(this).hasClass("max-bid-up");
                    var isDirectPurchaseButton = $(this).hasClass("isDirectPurchase");

                    if(!isDirectPurchaseButton) {
                        amountContainer = (isMaxBidButton) ? $('[data-handbid-maxbid-amount]') : $('[data-handbid-onlybid-amount]');
                    }

                    var value = parseInt(amountContainer[0].innerHTML) + increment;

                    if(isDirectPurchaseButton) {
                        var inventoryRemaining = ($('[data-handbid-item-attribute="inventoryRemaining"]').length > 0 ) ? parseInt($('[data-handbid-item-attribute="inventoryRemaining"]')[0].innerHTML) : -1;
                        inventoryRemaining = (inventoryRemaining) ? inventoryRemaining : -1;
                        var totalSoldItems = ($('[data-handbid-item-attribute="totalSoldItems"]').length > 0 ) ? parseInt($('[data-handbid-item-attribute="totalSoldItems"]')[0].innerHTML) : 0;
                        totalSoldItems = (totalSoldItems) ? totalSoldItems : 0;
                        canBeUp = ((inventoryRemaining == -1 ) || ((inventoryRemaining != -1) && (value <= inventoryRemaining)));

                    }
                    else{
                        var buyNowPrice = ($('[data-handbid-buynow-price]').length > 0 ) ? parseInt($('[data-handbid-buynow-price]').eq(0).data("handbid-buynow-price")) : -1;

                        canBeUp = (!isMaxBidButton)? true : ((buyNowPrice == -1 ) || ((buyNowPrice != -1) && (value <= buyNowPrice)));


                    }
                    if(canBeUp) {
                        amountContainer.html(value);
                        if(!isDirectPurchaseButton && !isMaxBidButton){
                            $('[data-handbid-maxbid-amount]').html(value);
                        }
                    }

                });

                $('[data-handbid-bid-button="down"]').live('click', function (e) {

                    if(handbid.isButtonDisabledOrAlreadyActive($(this)) || handbid.cannotDoIfUnauthorized() || handbid.noticeIfNoCreditCard($(this))){
                        return false;
                    }

                    e.preventDefault();

                    var amountContainer = amount;

                    var isMaxBidButton = $(this).hasClass("max-bid-down");
                    var isDirectPurchaseButton = $(this).hasClass("isDirectPurchase");

                    if(! isDirectPurchaseButton) {
                        amountContainer = (isMaxBidButton) ? $('[data-handbid-maxbid-amount]') : $('[data-handbid-onlybid-amount]');
                    }

                        var value = parseInt(amountContainer[0].innerHTML) - increment;

                        if(value >= minimalBidAmount) {
                            amountContainer.html(value);
                            if(!isDirectPurchaseButton && !isMaxBidButton){
                                $('[data-handbid-maxbid-amount]').html(value);
                            }
                        }

                });

                $('[data-handbid-bid-button="bid"]').live('click', function (e) {

                    if(handbid.isButtonDisabledOrAlreadyActive($(this)) || handbid.cannotDoIfUnauthorized() || handbid.noticeIfNoCreditCard($(this))){
                        return false;
                    }

                    e.preventDefault();

                    var amountContainer = $('[data-handbid-onlybid-amount]');

                    var total = amountContainer[0].innerHTML;
                    var nonce = $("#bidNonce").val();
                    var button = $(this);
                    var message = "";
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
                                message = handbid.getStatusReasonByCode(data.statusReason);
                                handbid.notice(message, data.status.toUpperCase(), data.status);
                            }
                            else{
                                $('[data-handbid-item-attribute="bidCount"]').html(data.item.bidCount);
                                $('[data-handbid-item-attribute="minimumBidAmount"]').html(currencySymbol + data.item.minimumBidAmount);
                                if(data.statusReason == "under_maxbid"){
                                    handbid.addLosingItemRow(data.item.id, data, data.statusReason);
                                    handbid.loadBidsHistoryToContainer(data.item.id);
                                }
                            }

                            if(!connectedToSocket){
                                console.log("CONNECTED TO SOCKET");
                            }
                            button.removeClass("active");
                            return false;
                        }
                    );


                    return false;


                });

                $('[data-handbid-bid-button="proxy"]').live('click', function (e) {

                    if(handbid.isButtonDisabledOrAlreadyActive($(this)) || handbid.cannotDoIfUnauthorized() || handbid.noticeIfNoCreditCard($(this))){
                        return false;
                    }
                    var amountContainer = $('[data-handbid-maxbid-amount]');
                    var total = amountContainer[0].innerHTML;
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

                            if(data.status == "failed"){
                                var message = "";
                                if(data.bidType == "max_bid") {
                                    handbid.alreadyHaveMaxBidForItem(data);
                                }
                                else{
                                    message = handbid.getStatusReasonByCode(data.statusReason);
                                    handbid.notice(message, data.status.toUpperCase(), data.status);
                                }
                            }
                            else{
                                data.item.auctionKey = $("#bidder-info-load").data("auction-key");
                                handbid.addDashboardBidProxy(data.id, data.item.id, data.item.name, data.item.key, data.item.auctionKey, data.maxAmount);

                                if(data.statusReason == "raised_maxbid"){
                                    if(data.status == "winning"){
                                        handbid.addWinningItemRow(data.item.id, data, data.statusReason);
                                        handbid.loadBidsHistoryToContainer(data.item.id);
                                    }
                                }
                            }


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
                            var message = "";
                            if(data.status == "failed"){
                                message = handbid.getStatusReasonByCode(data.statusReason);
                                handbidMain.notice(message, data.status.toUpperCase(), data.status);
                            }
                            else {
                                var totalSoldContainer = $('[data-handbid-item-attribute="totalSoldItems"]').eq(0);
                                var totalSold = data.item.quantitySold;
                                totalSoldContainer.html(totalSold);
                                var inventoryRemainingCont = $('[data-handbid-item-attribute="inventoryRemaining"]').eq(0);
                                var inventoryRemaining = data.item.inventoryRemaining;
                                inventoryRemaining = (inventoryRemaining == -1) ? "∞" : inventoryRemaining;
                                inventoryRemainingCont.html(inventoryRemaining);
                                var startCount = (data.item.inventoryRemaining != 0) ? 1 : 0;
                                amount.html(startCount);

                                message = "You purchased " + quantity + " <br>of Item #" + data.item.id + " <br><b>" + data.item.name + "</b>";
                                handbidMain.notice(message, "Congratulations!", "success");

                                handbidMain.removeItemFromDashboardList(itemId, "proxy");
                                handbidMain.recheckAndRecalculateBids();

                            }


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

                    var listBidsProxy = $(".handbid-list-of-bids-proxy").eq(0);

                    var nonce = $("#bidNonce").val();
                    var bidID = parseInt($(this).data("handbid-delete-proxy"));
                    var button = $(this);
                    var itemID = button.data("item-id");
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
                            data = JSON.parse(data);
                            console.log(data);

                            handbid.removeItemFromDashboardList(itemID, "proxy");

                            handbid.recheckAndRecalculateBids();

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
                totalPrice = handbid.number_format(totalPrice, 0, ".", ",");
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
                                    ticketID = parseInt(parentBlock.data("handbid-ticket-id")),
                                    remainingSymb = remainingBlock.val(),
                                    remaining = parseInt(remainingBlock.val());
                                quantityBlock.html(0);
                                if(!connectedToSocket && remainingSymb != "-1" && remainingSymb != "∞" && handbid.in_array(data.successID, ticketID)){
                                    remainingBlock.val(remaining - quantity);
                                }
                                return null;
                            });
                            $("[data-handbid-tickets-total]").html(0);

                            var messages = [];
                            if(data.failID.length){
                                messages = $.map(prices, function(val, i){
                                    if(handbid.in_array(data.failID, val.id)) {
                                        var reason = "";
                                        if(data.fail[val.id].data != undefined && data.fail[val.id].data.error != undefined) {
                                            var reasons = $.map(data.fail[val.id].data.error, function (val, i) {
                                                return val.join(", ");
                                            });
                                            reason = "<br> Reason: " + reasons.join(", ");
                                        }
                                        else{
                                            reason = "<br> Reason: Something wrong. Please, try again later";
                                        }
                                        return (!handbid.in_array(data.failID, val.id)) ? null : "Item #" + val.id + " <br><b>" + val.name + "</b>" + reason;

                                    }
                                    else return null;
                                });
                                handbidMain.notice("<b>Cannot Buy:</b> <br><br>"+ messages.join(" <br><br>"), "Cannot Buy Tickets", "error");
                            }

                            if(data.successID.length){
                                messages = $.map(prices, function(val, i){
                                    if((handbid.in_array(data.successID, val.id))){

                                        var itemData = data.success[val.id];

                                        var amount = itemData.amount;
                                        var quantity = itemData.quantity;
                                        var name = itemData.name;
                                        return (! handbid.in_array(data.successID, val.id)) ? null : "<b>"+val.quantity+"</b> of Item #"+val.id+" <br><b>"+val.name+"</b>";
                                    }
                                    else{
                                        return null;
                                    }
                                });
                                handbidMain.notice("You purchased <br>"+ messages.join("; <br>"), "Congratulations!", "success");
                            }

                            button.removeClass("active");
                            closeModal.show();
                            closeModal.click();

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

                            if(data.result.paid){
                                paidControls.slideDown();
                                unpaidControls.remove();
                                receiptBlock.addClass("open").removeClass("preview");
                                handbidMain.notice("Your receipt was successfully paid!", "Congratulations!", "success");

                                var unpaidInvoicesCountContainer = $(".unpaidInvoicesCountContainer");
                                var unpaidInvoices = $(".receipts-list-area li.preview").length;
                                (unpaidInvoices)?unpaidInvoicesCountContainer.show():unpaidInvoicesCountContainer.hide();
                                unpaidInvoicesCountContainer.html(unpaidInvoices);
                            }
                            else{
                                handbidMain.notice(data.result.description, "Payment Error", "error");
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
            notice:  function (msg, title, type, hide, formatting) {

                title = (title != undefined) ? title : 'Notice Message';
                hide = (hide != undefined) ? hide : true;
                type = (type != undefined) ? type : 'info';
                type = (type == "failed") ? "error" : type;

                var isBiddingNotice = (formatting != undefined && formatting.isBidding != undefined && formatting.isBidding);
                if(isBiddingNotice){
                    var itemLink = (formatting.itemLink != undefined) ? formatting.itemLink : "#";
                    var itemImage = (formatting.itemImage != undefined) ? formatting.itemImage : $("[data-default-item-image]").eq(0).val() ;
                    msg = "<div class='col-xs-4 handbid-notice-image-container'>" +
                    "<a href='"+itemLink+"'>" +
                    "<img src='"+itemImage+"'>" +
                    "</a>" +
                    "</div>" +
                    "<div class='col-xs-8 handbid-notice-text-container'>" +
                    "<h5 class='notice-text-title'>" + title + "</h5>" + msg +
                    "</div>";
                    title = "";
                }
                var params = {
                    title: title,
                    text: msg,
                    type: type,
                    hide: hide,
                    mouse_reset: false,
                    delay: 5000,
                    addclass: 'handbid-message-notice',
                    buttons: {
                        sticker: false
                    }
                };
                if(title == "Broadcast Message"){
                    params.icon = " glyphicon glyphicon-envelope ";
                    params.addclass += " handbid-broadcast-notice";
                }
                if(isBiddingNotice){
                    params.icon = "";
                    params.addclass += " handbid-bidding-notice";
                }


                try {

                    return new PNotify(params);

                } catch (err) {

                    this.oldNotice(msg);

                    return false;

                }

            },


            detectIfUserWantToBid: function(){

                var bidderDashboardPlace = $("#bidder-info-load"),
                    auctionID = parseInt(bidderDashboardPlace.data("auction")),
                    profileID = parseInt(bidderDashboardPlace.data("profile-id")),
                    paddleNumber = bidderDashboardPlace.data("profile-paddle-number"),
                    nonce = bidderDashboardPlace.data("paddle-nonce");

                if(auctionID && profileID && paddleNumber == "N/A") {
                //if(true) {
                    var bidNotice =  new PNotify({
                        title: 'Register to Bid?',
                        text: 'Do you want to bid in this auction or just browse for now?',
                        icon: 'glyphicon glyphicon-question-sign',
                        type: 'info',
                        addclass: 'handbid-message-notice',
                        hide: false,
                        mouse_reset: false,
                        confirm: {
                            confirm: true,
                            buttons: [{
                                text: 'Bid',
                                addClass: 'bid-here-button',
                                click: function (notice) {
                                    notice.update({
                                        title: 'Receiving the Paddle Number for this Auction',
                                        text: '<div class="progress progress-striped active" style="margin:0">\
	                                            <div class="progress-bar" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%">\
		                                        <span class="sr-only">100%</span>\
	                                            </div>\
                                                </div>',
                                        icon: 'glyphicon glyphicon-refresh gly-spin',
                                        addclass: "handbid-paddle-number-notice",
                                        hide: false,
                                        confirm: {
                                            confirm: false
                                        },
                                        buttons: {
                                            closer: false,
                                            sticker: false
                                        },
                                        history: {
                                            history: false
                                        }
                                    });
                                    var data = {
                                        action: "handbid_ajax_get_paddle_number",
                                        auctionID: auctionID,
                                        nonce: nonce
                                    };
                                    console.log(data);
                                    $.post(
                                        ajaxurl,
                                        data,
                                        function (data) {

                                            console.log("-----------------------");
                                            console.log("----Receive Paddle Number success----");
                                            data = JSON.parse(data);
                                            console.log(data);

                                            var text = "";
                                            var title = "";
                                            var type = "";
                                            var icon = "";

                                            if(data.paddleId != undefined){
                                                $("[data-paddle-for-auction-"+auctionID+"]").html(data.paddleId);
                                                text = 'Your paddle number for this auction is <b>'+data.paddleId+'</b>';
                                                title = 'Done';
                                                type = 'success';
                                                icon = 'glyphicon glyphicon-ok';
                                            }
                                            else{
                                                text = data.errors.join("<br>");
                                                title = 'Failed';
                                                type = 'error';
                                                icon = 'glyphicon glyphicon-remove-sign';
                                            }



                                            notice.update({
                                                title: title,
                                                text: text,
                                                icon: icon,
                                                hide: true,
                                                type: type,
                                                delay: 3000,
                                                mouse_reset: false,
                                                confirm: {
                                                    confirm: false
                                                },
                                                buttons: {
                                                    closer: true,
                                                    sticker: false
                                                },
                                                history: {
                                                    history: false
                                                }
                                            });

                                            handbid.addProfileActiveAuctions();


                                            return false;
                                        }
                                    );
                                }
                            }, {
                                text: 'Browse',
                                addClass: 'browse-here-button',
                                click: function (notice) {
                                    notice.remove();
                                }
                            }]
                        },
                        stack: false,
                        before_open: function(PNotify) {
                            PNotify.get().css({
                                "top": ($(window).height() / 2) - (PNotify.get().height() / 2) - 80,
                                "left": ($(window).width() / 2) - (PNotify.get().width() / 2)
                            });
                            if (modal_overlay) modal_overlay.fadeIn("fast");
                            else modal_overlay = $("<div />", {
                                "class": "ui-widget-overlay",
                                "css": {
                                    "display": "none",
                                    "position": "fixed",
                                    "background": "rgba(0, 0, 0, 0.7)",
                                    "top": "0",
                                    "bottom": "0",
                                    "right": "0",
                                    "left": "0"
                                }
                            }).appendTo("body").fadeIn("fast");
                        },
                        before_close: function() {
                            modal_overlay.fadeOut("fast");
                        },
                        buttons: {
                            closer: false,
                            sticker: false
                        },
                        history: {
                            history: false
                        }
                    });
                    bidNotice.get().on('pnotify.cancel', function () {
                            return false;
                        });
                }

            },


            displayRequiredCardsMessage: function(){
                new PNotify({
                    title: 'Credit cards required',
                    type: 'error',
                    text: '<b>You must supply a credit card to bid in this auction.</b>',
                    icon: 'glyphicon glyphicon-exclamation-sign',
                    addclass: 'handbid-message-notice',
                    hide: false,
                    mouse_reset: false,
                    confirm: {
                        confirm: true,
                        buttons: [{
                            text: 'Add a card',
                            addClass: 'add-credit-card-button',
                            click: function (notice) {
                                $(".credit-card-form-link").eq(0).click();
                                notice.remove();

                            }
                        }]
                    },
                    buttons: {
                        closer: false,
                        sticker: false
                    },
                    history: {
                        history: false
                    }
                });
            },

            lazyShowMoreMessages: function(button){
                var currentChunk = parseInt(button.data("current-chunk")) + 1,
                    chunksCount = parseInt(button.data("chunks-count")),
                    messagesOfCurrentChunk = $(".messages-part-"+currentChunk);
                messagesOfCurrentChunk.slideDown("normal");
                $(".load-less-messages").show();
                button.data("current-chunk", currentChunk);
                if(currentChunk >= chunksCount){
                    button.hide();
                }

            },

            lazyShowLessMessages : function(button){
                var allMessages = $(".message-row"),
                    messagesOfCurrentChunk = $(".messages-part-0");
                allMessages.hide();
                messagesOfCurrentChunk.slideDown("normal");
                var showButton = $(".load-more-messages");
                showButton.data("current-chunk", 0);
                showButton.show();
                button.hide();

            },


            setCircleTimer: function(time){

                var timeMs = time * 1000;
                var startColor = '#6FD57F';
                var endColor = '#FC5B3F';

                var element = document.getElementById('handbid-circle-timer-'+time);
                element.innerHTML = "";
                circleTimer = new ProgressBar.Circle(element, {
                    color: startColor,
                    trailColor: '#fff',
                    trailWidth: 10,
                    duration: timeMs,
                    strokeWidth: 15,
                    step: function(state, circle) {
                        circle.path.setAttribute('stroke', state.color);
                    }
                });

                circleTimer.animate(1.0, {
                    from: {color: startColor},
                    to: {color: endColor}
                });

            },


            startTimer: function (handbid) {

                var continueTimer = true;
                $.map($("[data-handbid-timer]"), function(timer){
                    timer = $(timer);
                    var time = timer.html();
                    var arr = time.split(":");
                    var h = parseInt(arr[0]);
                    var m = parseInt(arr[1]);
                    var s = parseInt(arr[2]);
                    if (s == 0) {
                        if (m == 0) {
                            if (h == 0) {
                                handbidMain.changeAuctionTimer(0, false);
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
                    if (m < 10) m = "0" + m;
                    if (h < 10) h = "0" + h;
                    if (h == "000") h = "00";
                    if (m == "000") m = "00";
                    timer.html(h+":"+m+":"+s);
                    $(".timer-hours-number").html(h);
                    $(".timer-mins-number").html(m);
                    $(".timer-secs-number").html(s);
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
                    //handbid.showTimerRemainingNotice(timerTime, timerTitle);
                    if(timerTime) {
                        handbid.changeAuctionTimer(timerTime, true);
                    }
                }

            },

            formatTimerTime: function(time){
                var timeH = Math.floor(time / 3600),
                    timeM = Math.floor((time - timeH*3600) / 60),
                    timeS = time - timeH*3600 - timeM*60;
                if (timeS < 10) timeS = "0" + timeS;
                if (timeM < 10) timeM = "0" + timeM;
                if (timeH < 10) timeH = "0" + timeH;
                if (timeH == "000") timeH = "00";
                if (timeM == "000") timeM = "00";
                return timeH + ":" + timeM + ":" + timeS;
            },

            showTimerRemainingNotice: function(timerTime, timerTitle){
                timerTitle = (timerTitle != undefined) ? " <b>"+timerTitle+"</b>" : "";
                var timeFormatted = this.formatTimerTime(timerTime);
                console.log(timeFormatted);
                (timerNotice != undefined) ? timerNotice.remove() : '';
                timerNotice = undefined;
                timerNotice = handbid.notice("Auction "+timerTitle+"<br>closes after <b><div data-handbid-timer>" + timeFormatted + "</div></b>", "Closing Auction Timer");
                this.changeAuctionTimer(timerTime, true);
            },

            changeAuctionTimer: function (time, timerIsRunning) {
                var timeFormatted = this.formatTimerTime(time);
                var timerLayoutPattern = '<div class="auction-timer-place">' +
                    '<div class="circle-place col-xs-3"><div class="handbid-circle-timer" id="handbid-circle-timer-'+time+'"></div></div>' +
                    '<div class="numbers-place col-xs-9" id="handbid-numbers-timer-'+time+'">' +
                    '<div class="col-xs-4 number-cont"><em class="timer-hours-number">00</em><span>hours</span></div>' +
                    '<div class="col-xs-4 number-cont"><em class="timer-mins-number">00</em><span>mins</span></div>' +
                    '<div class="col-xs-4 number-cont secs-number-cont"><em class="timer-secs-number">00</em><span>secs</span></div>' +
                    '</div>' +
                    '</div>';
                var toggleButtonPattern = '<span class="btn btn-small btn-default toggle-timer-notice">' +
                    '<em class="glyphicon glyphicon-chevron-down"></em>' +
                    '<em class="glyphicon glyphicon-chevron-up"></em>' +
                    '</span>';
                var titleTimerPattern = '<h3 class="notice-connection-title">' +
                    '<b>Auction Closes After' +
                    '&nbsp;&nbsp;&nbsp;&nbsp;<span data-handbid-timer>' + timeFormatted + '</span>' +
                    '</b></h3>' + toggleButtonPattern;
                if(timerMessage != undefined && timerMessage.animating == "out"){
                    timerMessage = undefined;
                }
                if(timerIsRunning){
                    if(timerMessage == undefined ){
                        timerMessage = new PNotify({
                            title: titleTimerPattern,
                            type: 'error',
                            text: timerLayoutPattern,
                            icon: '',
                            addclass: 'handbid-message-notice handbid-timer-top-notice  stack-bar-top',
                            cornerclass: "",
                            width: "100%",
                            stack: stack_bar_top,
                            hide: false,
                            mouse_reset: false,
                            buttons: {
                                closer: false,
                                sticker: false
                            },
                            history: {
                                history: false
                            }
                        });
                        this.setCircleTimer(time);
                    }
                    else{
                        timerMessage.update({
                            title: titleTimerPattern,
                            text: timerLayoutPattern
                        });
                        this.setCircleTimer(time);
                    }
                }
                else{
                    if(timerMessage != undefined){
                        timerMessage.update({
                            title: '<h3 class="notice-connection-title">' +
                            '<b>Auction Closed</b></h3>',
                            text: '',
                            hide: true,
                            delay: 5000,
                            before_close: function() {
                                handbidMain.loadAllToContainers();
                            }
                        });
                    }
                }
            },

            reloadBidderProfile: function(){
                var bidderInfo = jQuery("#bidder-info-load");
                //bidderInfo.hide();
                $.post(ajaxurl, {
                        action: "handbid_profile_load",
                        auction: bidderInfo.data("auction"),
                        nonce: bidderInfo.data("load")
                    },
                    function (resp) {
                        bidderInfo.html(resp);
                        bidderInfo.slideDown("normal");
                        ($('.creditcard-template').length > 0) ? handbid.setupAddCreditCard() : '';
                        handbid.setupProvincesSelect();

                        handbid.loadAllToContainers();

                    });
            },

            redirectFromResetedAuctions: function(data){
                window.location = "/auctions/?auction-reset"
            },


            redirectFromResetedAuctionsCheck: function(){
                if($("[data-auction-reset-sign]").length > 0){
                    this.notice("<b>This auction has been reset, please select another one</b>", "Auction Reset", "info");
                }
            },

            checkSocketConnection: function (handbid) {
                if(!connectedToSocket){
                    if(connectMessage == undefined){
                        connectMessage = new PNotify({
                            title: '<h3 class="notice-connection-title"><b>Unable to connect for real-time updates</b>' +
                            '<span class="notice-connection-switch">?</span>' +
                            '</h3>',
                            type: 'error',
                            text: '<div class="notice-connection-tip">Handbid uses a live connection to the server to update auction items, ' +
                            'bids and stats. When it can\'t connect to this live connection, this message will appear. ' +
                            'You can still bid on items, but you may need to refresh your browser page to see if any prices have changed. ' +
                            'Please click on the chat/help tab below to let us know this message exists. ' +
                            'It is likely that your Internet service provider is blocking our connection, ' +
                            'but we will look into it! Happy Bidding!</div>',
                            icon: '',
                            addclass: 'handbid-message-notice handbid-no-connection-notice notice-collapsed stack-bar-top',
                            cornerclass: "",
                            width: "100%",
                            stack: stack_bar_top,
                            hide: false,
                            mouse_reset: false,
                            buttons: {
                                closer: false,
                                sticker: false
                            },
                            history: {
                                history: false
                            }
                        });
                    }
                }
                else{
                    if(connectMessage != undefined){
                        connectMessage.remove();
                        connectMessage = undefined;
                    }
                }
                    setTimeout(function () {
                        handbid.checkSocketConnection(handbid)
                    }, 3000);
            }
        };

    $(document).ready(function () {

        handbidMain = handbid;

        restEndpoint = $("#apiEndpointsAddress").val();
        handbid.setupAuthorizationStatus();
        handbid.makePaymentForReceipt();
        handbid.detectIfUserWantToBid();
        handbid.messageToAuctionManager();
        handbid.redirectFromResetedAuctionsCheck();
        setTimeout(function () {
            handbid.checkSocketConnection(handbid)
        }, 10000);

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


        handbid.reloadBidderProfile();



        $(".handbid-logout a").live("click", function(e){
            e.preventDefault();
            var path = $(this).attr("href");
            var logoutNotice =  new PNotify({
                title: 'Logout Confirmation',
                text: 'Are you sure want to logout?',
                icon: 'glyphicon glyphicon-question-sign',
                type: "info",
                addclass: 'handbid-message-notice',
                hide: false,
                mouse_reset: false,
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
            });
            logoutNotice.get().on('pnotify.confirm', function() {
                    window.location = path;
                }).on('pnotify.cancel', function() {
                    return false;
                });
        });



        $(".notice-connection-switch").live("click", function(e){
            e.preventDefault();
            $(".notice-connection-tip").slideToggle("normal");
            $(".handbid-no-connection-notice").toggleClass("notice-collapsed");
        });


        $(".toggle-timer-notice").live("click", function(e){
            e.preventDefault();
            $(".handbid-timer-top-notice").toggleClass("notice-collapsed");
        });

        $("[data-toggle-invoice-link]").live("click", function(e){
            e.preventDefault();
            var invoiceID = $(this).data("toggle-invoice-link");
            $(this).toggleClass("opened-invoice");
            $("[data-receipt-block-id="+invoiceID+"] .invoice-details-container").slideToggle("normal");
        });

        $("[data-toggle-invoice-more-link]").live("click", function(e){
            e.preventDefault();
            var invoiceID = $(this).data("toggle-invoice-more-link");
            $(this).toggleClass("opened-invoice");
            $("[data-receipt-block-id="+invoiceID+"] .invoice-more-details-container").slideToggle("normal");
        });

        $(".load-more-messages").live("click", function(e){
            e.preventDefault();
            var button = $(this);
            handbid.lazyShowMoreMessages(button);
        });

        $(".load-less-messages").live("click", function(e){
            e.preventDefault();
            var button = $(this);
            handbid.lazyShowLessMessages(button);
        });

    });

})(jQuery);