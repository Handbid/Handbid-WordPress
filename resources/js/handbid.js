/**
 * @copyright Copyright (c) 2014-2015 Handbid Inc.
 * @category handbid
 * @package Handbid2-WordPress
 * @license Proprietary
 * @link http://www.handbid.com/
 * @author Master of Code (worldclass@masterofcode.com)
 */



var handbid_main, connect_message, modal_overlay, reload_overlay, confirm_bid_overlay, timer_notice, timer_message,
    circle_timer, auction_invoices, current_paddle_number, timer_elements, timer_elements_full, timer_time,
    current_cc_form, cookie_expire = 7, adding_cc_state = false, profile_location_map, invoices_loaded = false,
    refresh_timer_interval                                                                             = 15000, autocomplete, address_to_pay_receipt, currency_span;
(function ($) {

    attention_about_tickets                    = false;
    attention_about_bidding                    = false;
    attention_about_confirm                    = false;
    attention_about_buying_confirmation        = false;
    attention_about_unpaid_invoices            = false;
    attention_about_send_invoice               = false;
    attention_about_address_is_required_to_pay = false;
    attention_about_continue_payment           = false;
    attention_about_are_you_at_the_event       = false;

    String.prototype.toHHMMSS = function () {
        var sec_num = parseInt(this, 10);
        var hours   = Math.floor(sec_num / 3600);
        var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        var seconds = sec_num - (hours * 3600) - (minutes * 60);

        if (hours < 10) {
            hours = "0" + hours;
        }
        if (minutes < 10) {
            minutes = "0" + minutes;
        }
        if (seconds < 10) {
            seconds = "0" + seconds;
        }
        return {
            simple : hours + ':' + minutes + ':' + seconds,
            full   : '<div class="col-xs-4 number-cont"><em class="timer-hours-number">' + hours + '</em><span>hours</span></div><div class="col-xs-4 number-cont"><em class="timer-mins-number">' + minutes + '</em><span>mins</span></div><div class="col-xs-4 number-cont secs-number-cont"><em class="timer-secs-number">' + seconds + '</em><span>secs</span></div>'
        }
    };

    var isMobile = {
        getUserAgent : function () {
            return navigator.userAgent || navigator.vendor || window.opera;
        },
        Android      : function () {
            return /Android/i.test(this.getUserAgent());
        },
        BlackBerry   : function () {
            return /BlackBerry/i.test(this.getUserAgent());
        },
        iPhone       : function () {
            return /iPhone/i.test(this.getUserAgent());
        },
        iPad         : function () {
            return /iPad/i.test(this.getUserAgent());
        },
        iOS          : function () {
            return /iPad|iPod|iPhone/i.test(this.getUserAgent());
        },
        Windows      : function () {
            return /IEMobile/i.test(this.getUserAgent());
        },
        any          : function () {
            return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Windows());
        }
    };

    currency_span = function () {
        var currencyCode   = $("[data-auction-currency-code]").eq(0).data("auction-currency-code"),
            currencySymbol = $("[data-auction-currency-symbol]").eq(0).data("auction-currency-symbol");
        return '<span class="handbidAuctionCurrency" title="' + currencyCode + '">' + currencySymbol + '</span>';
    };

    var rest_endpoint      = $("#apiEndpointsAddress").val(),
        status_reasons     = {
            no_response    : "Sorry, try again later",
            current_winner : "You are current winner of this item"
        },
        socket_retry       = 0,
        socket_retry_limit = 9,
        stack_bar_top      = {
            addpos2   : 0,
            animation : true,
            dir1      : "down",
            dir2      : "right",
            firstpos1 : 0,
            firstpos2 : 0,
            nextpos1  : 0,
            nextpos2  : 0,
            push      : "top",
            spacing1  : 0,
            spacing2  : 0
        },
        handbid            = {

            loggedIn : null,

            number_format : function (number, decimals, dec_point, thousands_sep) {
                number         = (number + '').replace(/[^0-9+\-Ee.]/g, '');
                var n          = !isFinite(+number) ? 0 : +number,
                    prec       = !isFinite(+decimals) ? 0 : Math.abs(decimals),
                    sep        = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
                    dec        = (typeof dec_point === 'undefined') ? '.' : dec_point,
                    s          = '',
                    toFixedFix = function (n, prec) {
                        var k = Math.pow(10, prec);
                        return '' + (Math.round(n * k) / k)
                                .toFixed(prec);
                    };
                s              = (prec ? toFixedFix(n, prec) : '' + Math.round(n))
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

            in_array : function (array, p_val) {
                for (var i = 0, l = array.length; i < l; i++) {
                    if (array[i] == p_val) {
                        return true;
                    }
                }
                return false;
            },

            setCookie : function (title, value, expires, path) {
                $.cookie(title, value, {
                    expires : expires ? expires : cookie_expire,
                    path    : path ? path : '/'
                });
            },

            getCookie : function (title) {
                return $.cookie(title);
            },

            getCookieNameForItem : function (id) {
                return "go-to-" + id + "-from";
            },

            recalculateDashboardPrice : function () {
                var dashboard_total = 0;
                var price_part      = 0;
                $.map($("[data-dashboard-price]"), function (val) {
                    price_part = parseFloat($(val).data("dashboard-price"));
                    dashboard_total += price_part;
                });
                dashboard_total = handbid.number_format(dashboard_total, 0, ".", ",");
                $("[data-handbid-stats-grand-total]").html(dashboard_total);
            },

            goToSingleItemPage : function (url, id) {

                var current_category = $('[data-legacy-category-id].selected').data('legacy-category-id');
                current_category     = (current_category) ? current_category : 'all';

                this.setCookie(this.getCookieNameForItem(id), current_category);

                window.location.href = url;
            },

            fadeInModalOverlayAndPositionModal : function (PNotify) {
                PNotify.get().css({
                                      "top"  : ($(window).height() / 2) - (PNotify.get().height() / 2) - 80,
                                      "left" : ($(window).width() / 2) - (PNotify.get().width() / 2)
                                  });
                if (modal_overlay) modal_overlay.fadeIn("fast");
                else modal_overlay = $("<div />", {
                    "class" : "ui-widget-overlay",
                    "css"   : {
                        "display"    : "none",
                        "position"   : "fixed",
                        "background" : "rgba(0, 0, 0, 0.7)",
                        "top"        : "0",
                        "bottom"     : "0",
                        "right"      : "0",
                        "left"       : "0",
                        "z-index"    : "9999"
                    }
                }).appendTo("body").fadeIn("fast");
            },

            fadeOutModalOverlay : function () {
                if (!attention_about_bidding
                    && !attention_about_tickets
                    && !attention_about_confirm
                    && !attention_about_unpaid_invoices
                    && !attention_about_address_is_required_to_pay
                    && !attention_about_continue_payment
                    && !attention_about_send_invoice
                    && !attention_about_are_you_at_the_event
                    && !attention_about_buying_confirmation) {
                    modal_overlay.fadeOut("fast");
                }
            },

            recheckBidCounts : function () {
                var max_bids_count = $("[data-maxbid-item-id]").length;
                $("[data-handbid-stats-num-proxies]").html(max_bids_count);

                var winning_bids_count = $("[data-winning-item-id]").length;
                $("[data-handbid-stats-num-winning]").html(winning_bids_count);

                var losing_bids_count = $("[data-losing-item-id]").length;
                $("[data-handbid-stats-num-losing]").html(losing_bids_count);

                var purchased_bids_count = $("[data-purchased-item-id]").length;
                $("[data-handbid-stats-num-purchases]").html(purchased_bids_count);
            },

            recheckAndRecalculateBids : function () {
                this.recheckBidCounts();
                this.recalculateDashboardPrice();
                this.recheckYourCardItems();
            },

            addDashboardBidProxy : function (bid_id, item_id, item_name, item_key, auction_key, max_amount) {

                var pattern = '<li class="row bid-row-id-' + bid_id + '" ' +
                              ' data-proxy-item-id="' + item_id + '" ' +
                              ' data-maxbid-item-id="' + item_id + '" ' +
                              ' data-proxy-item-max-value="' + max_amount + '" ' +
                              ' data-maxbid-bid-id="' + bid_id + '">' +
                              ' <div class="col-md-8 col-xs-8">' +
                              ' <a href="/auctions/' + auction_key + '/item/' + item_key + '"><h4>' + item_name + '</h4></a>' +
                              ' </div>' +
                              ' <div class="col-md-2 col-xs-2">' +
                              ' <span class="bid-amount winning">' + currency_span() + '<span>' + max_amount + '</span></span>' +
                              ' </div>' +
                              ' <div class="col-md-2 col-xs-2">' +
                              ' <a class="button pink-solid-button loading-span-button" href="#" data-handbid-delete-proxy="' + bid_id + '" data-item-id="' + item_id + '"><em>Delete</em></a>' +
                              ' </div>' +
                              ' </li>';

                var list_bids_proxy = $(".handbid-list-of-bids-proxy").eq(0);
                this.removeItemFromDashboardList(item_id, "proxy");
                $("p", list_bids_proxy).remove();
                list_bids_proxy.prepend(pattern);

                this.recheckAndRecalculateBids();
            },

            addDashboardBidWinning : function (itemID, itemName, itemLink, amount) {

                var pattern = '<li class="row"' +
                              ' data-dashboard-price="' + amount + '"' +
                              ' data-winning-item-id="' + itemID + '">' +
                              ' <div class="col-md-10 col-xs-10">' +
                              '     <a href="' + itemLink + '"><h4>' + itemName + '</h4></a>' +
                              ' </div>' +
                              ' <div class="col-md-2 col-xs-2">' +
                              ' <span class="bid-amount winning">' + currency_span() + '<span>' + amount + '</span></span>' +
                              ' </div>' +
                              ' </li>';

                var listBidsWinning = $(".handbid-list-of-bids-winning").eq(0);
                $("p", listBidsWinning).remove();
                listBidsWinning.prepend(pattern);

                //this.removeItemFromDashboardList(itemID, "losing");

                this.displayOnlyCurrentStatusOfItem(itemID, "winning");

                this.recheckAndRecalculateBids();
            },

            addDashboardBidLosing : function (itemID, itemName, itemLink, amount) {

                var pattern = '<li class="row"' +
                              'data-losing-item-id="' + itemID + '">' +
                              '<div class="col-md-8 col-xs-8">' +
                              '<a href="' + itemLink + '"><h4>' + itemName + '</h4></a>' +
                              '</div>' +
                              '<div class="col-md-4 col-xs-4">' +
                              '<span class="bid-amount losing">' + currency_span() + '<span>' + amount + '</span></span>' +
                              '</div>' +
                              '</li>';

                var listBidsLosing = $(".handbid-list-of-bids-losing").eq(0);
                listBidsLosing.prepend(pattern);
                $("p", listBidsLosing).remove();

                //this.removeItemFromDashboardList(itemID, "winning");

                this.displayOnlyCurrentStatusOfItem(itemID, "losing");

                this.recheckAndRecalculateBids();
            },

            addDashboardBidPurchased : function (values) {

                var item                = values.item,
                    itemID              = item.id,
                    itemKey             = item.key,
                    itemName            = item.name,
                    amount              = values.pricePerItem,
                    quantity            = values.quantity,
                    receiptId           = values.receiptId,
                    grandTotal          = values.grandTotal,
                    requireAddresstoPay = values.requireAddresstoPay,
                    auctionId           = values.auctionId,
                    receiptTotal        = values.grandTotal,
                    purchaseID          = values.id,
                    tax                 = (values.tax != undefined) ? values.tax : 0,
                    auctionKey          = (values.auctionKey != undefined) ? values.auctionKey : "undefined";

                var pattern = '<li class="row"' +
                              'data-dashboard-price="' + (receiptTotal) + '"' +
                              'data-dashboard-quantity="' + quantity + '"' +
                              'data-purchased-item-id="' + itemID + '" ' +
                              ((item.isTicket == 1) ? 'data-purchased-item-is-ticket="yes" ' : '') +
                              'data-purchased-purchase-id="' + purchaseID + '">' +
                              '<div class="col-md-4 col-xs-4">' +
                              '<a href="/auctions/' + auctionKey + '/item/' + itemKey + '"><h4>' + itemName + '</h4></a>' +
                              '</div>' +
                              '<div class="col-md-4 col-xs-4">' +
                              '<h4 class="quantity-total">' + quantity + ' x ' + currency_span() + amount + '</h4>' +
                              '</div>' +
                              '<div class="col-md-4 col-xs-4">' +
                              '<span class="bid-amount winning">' + currency_span() +
                              '<span class="purchaseTotalAmount"' +
                              'data-dashboard-tax="' + tax + '"' +
                              '>' + (grandTotal) + '</span></span>' +
                              '</div>' +
                              '</li>';

                var listBidsPurchases = $(".handbid-list-of-bids-purchases").eq(0);
                $("p", listBidsPurchases).remove();
                listBidsPurchases.append(pattern);

                this.recheckAndRecalculateBids();
            },

            addItemBidsHistory : function (itemID, bidID, values, amount) {

                var winnerName = (values.winnerName != undefined) ? values.winnerName : values.bidderName;

                var pattern = '<li class="row open" data-list-bid-id="' + bidID + '">' +
                              '<div class="col-md-6">' +
                              '<h4>Bidder Pin</h4>' +
                              '<span>' + values.bidderName + '</span>' +
                              '</div>' +
                              '<div class="col-md-6">' +
                              '<span class="bid-amount winning">' + currency_span() + '<span>' + amount + '</span></span>' +
                              '</div>' +
                              '</li>';

                var listBidsHistory = $(".bid-history-item-" + itemID).eq(0);
                $("p", listBidsHistory).remove();
                $("li", listBidsHistory).removeClass("open").addClass("closed");
                listBidsHistory.prepend(pattern);

                this.recheckAndRecalculateBids();
            },

            addProfileActiveAuctions : function () {

                var bidderDashboardPlace       = $("#bidder-info-load"),
                    bidderListOfActiveAuctions = $(".handbid-list-of-active-auctions").eq(0),
                    hiddenListOfActiveAuctions = $(".handbid-hidden-of-active-auctions").eq(0),
                    auctionID                  = parseInt(bidderDashboardPlace.data("auction")),
                    auctionStatus              = bidderDashboardPlace.data("auction-status"),
                    auctionName                = bidderDashboardPlace.data("auction-name"),
                    auctionKey                 = bidderDashboardPlace.data("auction-key"),
                    auctionImage               = bidderDashboardPlace.data("auction-image"),
                    auctionOrgKey              = bidderDashboardPlace.data("auction-organization-key"),
                    auctionOrgName             = bidderDashboardPlace.data("auction-organization-name"),
                    alreadyInList              = $("[data-handbid-active-profile-auction='" + auctionID + "']", bidderListOfActiveAuctions).length,
                    alreadyInHiddenList        = $("[data-hidden-active-auction='" + auctionID + "']", hiddenListOfActiveAuctions).length;

                var pattern = '<li class="row ' + auctionStatus + '" data-handbid-active-profile-auction="' + auctionID + '">' +
                              ' <div class="col-md-2"><img class="full-width-image"' +
                              'src="' + auctionImage + '"/>' +
                              '</div>' +
                              '<div class="col-md-7">' +
                              '<h4>' + auctionName + '</h4>' +
                              '<a href="/organizations/' + auctionOrgKey + '"' +
                              'class="org-link">' + auctionOrgName + '</a>' +
                              '</div>' +
                              '<div class="col-md-3">' +
                              '<a class="cta-link" href="/auctions/' + auctionKey + '">See Auction</a>' +
                              '</div>' +
                              '</li>';

                $("p", bidderListOfActiveAuctions).remove();
                if (!alreadyInList) {
                    bidderListOfActiveAuctions.prepend(pattern);
                }
                if (!alreadyInHiddenList) {
                    hiddenListOfActiveAuctions.prepend('<input type="hidden" data-hidden-active-auction="' + auctionID + '">');
                }
            },

            clickOnFiltersToReorder : function () {
                if(handbid_auction_main){
                    handbid_auction_main.recheckIsotopeFilters();
                }
            },

            checkItemIsAvailableForPresale : function () {
                var availableForPreSale = $("[data-item-check-available-item-id]").val(),
                    auctionStatus       = $("[data-item-check-status-auction-id]").val(),
                    itemStatus          = $("[data-item-check-status-item-id]").val();
                return ((auctionStatus == "preview" || auctionStatus == "presale") && (availableForPreSale != "1") && (itemStatus != "sold"));
            },

            checkItemsAuctionIsClosed : function () {
                var auctionStatus = $("[data-item-check-status-auction-id]").val();
                return (auctionStatus == "closed" || auctionStatus == "reconcile" || auctionStatus == "reconciled");
            },

            checkItemIsAlreadySold : function () {
                var itemStatus = $("[data-item-check-status-item-id]").val();
                return (itemStatus == "sold");
            },

            checkItemIsLiveOnly : function () {
                var itemStatus = $("[data-item-check-is-live-item-id]").val();
                return (itemStatus == "yes");
            },

            checkItemIsBidPadOnly : function () {
                var itemStatus = $("[data-item-check-is-bidpad-item-id]").val();
                return (itemStatus == "yes");
            },

            checkItemIsAlreadySoldOrNotAvailable : function (winnerID, itemID) {
                var biddingBlock               = $("[data-item-bidding-id]"),
                    noBiddingBlock             = $("[data-item-nobidding-id]"),
                    isSoldBlock                = $("[data-item-is-sold-id]"),
                    isLiveBlock                = $("[data-item-is-live-id]"),
                    isBidPadBlock              = $("[data-item-is-bidpad-id]"),
                    isNotForLiveBlock          = $(".not-for-live-auctions"),
                    itemCanNotBeShownInPreSale = this.checkItemIsAvailableForPresale(),
                    itemsAuctionIsClosed       = this.checkItemsAuctionIsClosed(),
                    itemIsAlreadySold          = this.checkItemIsAlreadySold(),
                    itemIsLiveOnly             = this.checkItemIsLiveOnly(),
                    itemIsBidPadOnly           = this.checkItemIsBidPadOnly();

                (itemCanNotBeShownInPreSale || itemIsAlreadySold || itemIsLiveOnly || itemIsBidPadOnly || itemsAuctionIsClosed) ? biddingBlock.hide() : biddingBlock.show();
                (itemCanNotBeShownInPreSale || itemsAuctionIsClosed) ? noBiddingBlock.show() : noBiddingBlock.hide();
                (itemIsAlreadySold) ? isSoldBlock.show() : isSoldBlock.hide();
                (itemIsBidPadOnly) ? isBidPadBlock.show() : isBidPadBlock.hide();
                (itemIsLiveOnly) ? isLiveBlock.show() : isLiveBlock.hide();
                (itemIsLiveOnly) ? isNotForLiveBlock.hide() : isNotForLiveBlock.show();

                if (itemIsAlreadySold && winnerID != undefined) {
                    var bidderDashboardPlace = $("#bidder-info-load"),
                        profileID            = parseInt(bidderDashboardPlace.data("profile-id"));
                    if (profileID == winnerID) {
                        this.displayOnlyCurrentStatusOfItem(itemID, "winning");
                    }
                }
            },

            processAuctionChange : function (values) {

                var listAuctions       = $(".handbid-list-of-active-auctions").eq(0);
                var listHiddenAuctions = $(".handbid-hidden-of-active-auctions").eq(0);
                var auctionID          = values.id;
                var auctionStatus      = values.status;

                if (auctionStatus != "open") {
                    $("[data-handbid-active-profile-auction=" + auctionID + "]").remove();

                    if ($("li", listAuctions).length == 0) {
                        var noItemsText = listAuctions.data("no-items-text");
                        listAuctions.prepend("<p>" + noItemsText + "</p>");
                    }

                    if (auctionStatus == "closed" || auctionStatus == "reconcile" || auctionStatus == "reconciled") {
                        var hiddenAuctionIds = $("[data-hidden-active-auction=" + auctionID + "]");

                        (hiddenAuctionIds.length) ? hiddenAuctionIds.remove() : "";
                        var hasInvoices = (hiddenAuctionIds.length);
                        handbid.notifyUserAboutAuctionClosing(values, hasInvoices);
                    }
                }

                var itemsOfAuctionCanBeToggled = $("[data-handbid-item-auction='" + auctionID + "']:not(.simple-box.status-available)");
                (auctionStatus == "preview" || auctionStatus == "presale") ? itemsOfAuctionCanBeToggled.addClass("not-available-in-presale") : itemsOfAuctionCanBeToggled.removeClass("not-available-in-presale");
                $(".filters .by-item-type li.selected a").eq(0).click();

                var enableCreditCardSupport = (values.enableCreditCardSupport == "1"),
                    receiptsOfAuction       = $("[data-receipt-of-auction='" + auctionID + "']");
                (enableCreditCardSupport) ? receiptsOfAuction.removeClass("invoiceNoCCAllowed") : receiptsOfAuction.addClass("invoiceNoCCAllowed");

                $("[data-item-check-status-auction-id='" + auctionID + "']").val(auctionStatus);

                var spendingThreshold = values.spendingThreshold;
                spendingThreshold     = (spendingThreshold != null && spendingThreshold != undefined) ? spendingThreshold : 0;
                $("[data-auction-spending-threshold]").val(spendingThreshold);

                this.checkItemIsAlreadySoldOrNotAvailable();
            },

            processItemChange : function (values) {

                var item                = values,
                    itemID              = values.id,
                    itemName            = values.name,
                    itemKey             = (values.key) ? values.key : (itemName + '-' + itemID).toLowerCase().replace(/ /g,'-').replace(/[^\w-]+/g,''),
                    itemStatus          = values.status,
                    showValue           = values.showValue,
                    availableForPreSale = values.availableForPreSale,
                    newCatID            = values.categoryId,
                    newHideIfSold       = (item.hideSales == 1);

                var parentElem = $("[data-handbid-item-box='" + itemID + "']").eq(0);

                var itemBreadcrumbLink = $('[data-handbid-item-breadcrumb-link]'),
                    itemUrlLink = (itemBreadcrumbLink.length) ? itemBreadcrumbLink : $('[data-handbid-item-attribute="name"]', parentElem);

                if(itemUrlLink.length) {
                    var itemUrl = itemUrlLink.attr('href').split('/'),
                        oldKey = itemUrl[itemUrl.length - 2];
                    if (oldKey.indexOf(itemID) !== -1) {
                        itemUrl[itemUrl.length - 2] = itemKey;
                        itemUrlLink.html(values.name).attr('href', itemUrl.join('/'));
                        if (itemBreadcrumbLink.length && (oldKey != itemKey)) {
                            handbid_main.goToSingleItemPage(itemUrl.join('/'), itemID);
                        }
                        parentElem.attr('onclick', "handbid_main.goToSingleItemPage('" + itemUrl.join('/') + "', " + itemID + ");");
                    }
                }

                var currentItemID = $("#bidItemId").val();
                if (currentItemID == itemID) {
                    parentElem = $("[data-handbid-item-details-block='" + itemID + "']").eq(0);
                }

                $.each(values, function (attribute, value) {
                    value = (value != undefined && value != null) ? value : 0;
                    if (attribute == "inventoryRemaining" && value == -1) {
                        value = "∞"
                    }
                    if (attribute == "categoryName") {
                        var newCatTag = "|" + value.toLowerCase().split(' ').join('') + "|";
                        parentElem.attr("data-tags", newCatTag);
                    }
                    if (attribute == "quantitySold") {
                        $('[data-handbid-sold-of-id=' + itemID + ']').html(value);
                    }
                    if (attribute == "bidCount") {
                        $('[data-handbid-bids-of-id=' + itemID + ']').html(value);
                    }
                    if (attribute == "image") {
                        if(value != '/images/default_photo-75px-white.png') {
                            $('[data-handbid-item-box=' + itemID + '] .full-image-wrapper').attr('style', 'background-image: url(' + value + ')');
                        }
                    }
                    $('[data-change-attribute=' + attribute + ']', parentElem).html(value);
                    $('[data-handbid-item-attribute=' + attribute + ']', parentElem).html(value);
                });

                if (values.inventoryRemaining != undefined &&
                    values.inventoryRemaining != -1 &&
                    values.inventoryRemaining != "∞") {
                    var value = values.inventoryRemaining;
                    value     = (value != undefined && value != null) ? value : 0;
                    $('[data-handbid-remaining-of-id=' + itemID + ']').html(value);
                }

                var paramsBoxes          = $("[data-handbid-params-box='" + itemID + "']"),
                    paramsBoxQuant       = $("[data-is-hidden-item] [data-handbid-ticket-quantity]"),
                    isHidden             = (values.isHidden == "1"),
                    isDirectPurchaseItem = (values.isDirectPurchaseItem == "1"),
                    disableMobileBidding = (values.disableMobileBidding == "1"),
                    isBidPadOnly         = (values.isBidpadOnly == "1"),
                    noBids               = (!isDirectPurchaseItem && values.bidCount === 0);
                $.map(paramsBoxes, function (val) {
                    var paramsBox     = $(val),
                        oldCatID      = parseInt(paramsBox.attr("data-handbid-item-cat-id")),
                        isBoxHidden   = (paramsBox.eq(0).attr("data-is-hidden-item") != undefined),
                        oldHideIfSold = (paramsBox.eq(0).attr("data-hide-if-sold") != undefined),
                        oldItemStatus = paramsBox.data("handbid-item-box-status");

                    var oldHideSoldItem = (oldHideIfSold && oldItemStatus == "sold"),
                        newHideSoldItem = (newHideIfSold && itemStatus == "sold"),
                        isShowing       = ((!isHidden && isBoxHidden)),
                        isHiding        = ((isHidden && !isBoxHidden)),
                        differentCat    = (oldCatID != undefined && newCatID != undefined && oldCatID != newCatID);

                    var oldCatIDContainer = $(".countAuctionItemsForCat" + oldCatID).eq(0);
                    var newCatIDContainer = $(".countAuctionItemsForCat" + newCatID).eq(0);
                    var allCatIDContainer = $(".countAuctionItemsForCatAll").eq(0);
                    if (differentCat) {
                        paramsBox.attr("data-handbid-item-cat-id", newCatID);

                        isShowing ? handbid.utilChangeCountValue(newCatIDContainer, 1) : "";
                        isHiding ? handbid.utilChangeCountValue(oldCatIDContainer, -1) : "";

                        if (!isShowing && !isHiding && !isHidden) {
                            handbid.utilChangeCountValue(newCatIDContainer, 1);
                            handbid.utilChangeCountValue(oldCatIDContainer, -1);
                        }
                    }
                    else {
                        isShowing ? handbid.utilChangeCountValue(newCatIDContainer, 1) : "";
                        isHiding ? handbid.utilChangeCountValue(newCatIDContainer, -1) : "";
                    }
                    isShowing ? handbid.utilChangeCountValue(allCatIDContainer, 1) : "";
                    isHiding ? handbid.utilChangeCountValue(allCatIDContainer, -1) : "";

                    (isHidden) ? paramsBox.attr("data-is-hidden-item", "1") : paramsBox.removeAttr("data-is-hidden-item");
                    (isDirectPurchaseItem) ? paramsBox.attr("data-for-sale", "1") : paramsBox.removeAttr("data-for-sale");
                    (disableMobileBidding) ? paramsBox.attr("data-live", "1") : paramsBox.removeAttr("data-live");
                    (isBidPadOnly) ? paramsBox.attr("data-bidpad", "1") : paramsBox.removeAttr("data-bidpad");
                    (noBids) ? paramsBox.attr("data-no-bids", "1") : paramsBox.removeAttr("data-no-bids");
                    (newHideIfSold) ? paramsBox.attr("data-hide-if-sold", "1") : paramsBox.removeAttr("data-hide-if-sold");
                    paramsBox.attr("data-handbid-item-box-status", itemStatus);
                });
                paramsBoxQuant.html("0");

                var itemDetailsBlock = $("[data-handbid-item-details-block='" + itemID + "']").eq(0);
                (newHideIfSold) ? itemDetailsBlock.attr("data-hide-if-sold", "1") : itemDetailsBlock.removeAttr("data-hide-if-sold");

                var itemValueBoxes  = $(".itemValueBox" + itemID),
                    itemValueHidden = (showValue != "1" && showValue != 1);
                itemValueHidden ? itemValueBoxes.addClass("itemValueBoxHidden") : itemValueBoxes.removeClass("itemValueBoxHidden");

                $("[data-item-check-status-item-id='" + itemID + "']").val(itemStatus);
                $("[data-item-check-is-live-item-id='" + itemID + "']").val((disableMobileBidding) ? "yes" : "no");
                $("[data-item-check-is-live-bidpad-id='" + itemID + "']").val((isBidPadOnly) ? "yes" : "no");
                $("[data-item-check-available-item-id='" + itemID + "']").val(availableForPreSale);
                this.checkItemIsAlreadySoldOrNotAvailable(item.winnerId, item.id);

                item.buyNowPrice = (item.buyNowPrice == null || item.buyNowPrice == undefined) ? 0 : item.buyNowPrice;
                var isBiddable   = (!item.isDirectPurchaseItem);
                var buyItNow     = (isBiddable && item.buyNowPrice > 0 && item.buyNowPrice > item.currentPrice);
                var BINContainer = $(".BINButton.BINItem" + itemID).eq(0),
                    BINButton    = $(".BINButton.BINItem" + itemID + " a.buy-now").eq(0);
                (buyItNow) ? BINContainer.addClass("BINAvailable") : BINContainer.removeClass("BINAvailable");
                BINButton.attr("data-handbid-buynow-price", item.buyNowPrice);

                this.clickOnFiltersToReorder();

                var simpleBox = $('[data-handbid-item-box="' + item.id + '"].simple-item-box');
                simpleBox.removeClass('status-open')
                         .removeClass('status-closed')
                         .removeClass('status-sold')
                         .removeClass('status-preview')
                         .removeClass('status-presale')
                         .addClass('status-' + itemStatus);
            },

            detectIfUserAlreadyHasTicketsInPurchases : function (rows) {
                var hasTickets   = false;
                var purchaseRows = (rows) ? rows : $("[data-purchased-purchase-id]");
                if (purchaseRows.length) {
                    $.map(purchaseRows, function (val) {
                        if ($(val).attr("data-purchased-item-is-ticket") != undefined) {
                            hasTickets = true;
                        }
                    });
                }
                return hasTickets;
            },

            utilChangeCountValue : function (container, val) {
                container.html(parseInt(container.html()) + val);
            },

            showUnpaidInvoicesToUser : function (profileID, auctionID, val) {

                var viewCookie             = $.cookie("bidder-" + profileID + "-want-no-invoice-" + val.id);
                var showUnpaidInvoiceAlert = (profileID && val.id && viewCookie != "yes");

                if (showUnpaidInvoiceAlert) {
                    var message = "You have an unpaid invoice with a Balance of " + currency_span() + val.total + " in " + val.title + ".  Do you want to pay it?";
                    new PNotify({
                        title        : 'Unpaid Invoice',
                        type         : 'info',
                        text         : message,
                        icon         : 'glyphicon glyphicon-off',
                        addclass     : 'handbid-message-notice',
                        hide         : true,
                        delay        : 10000,
                        mouse_reset  : false,
                        confirm      : {
                            confirm : true,
                            buttons : [
                                {
                                    text     : 'View Invoice',
                                    addClass : 'view-invoices-button',
                                    click    : function (notice) {
                                        if($('body').hasClass('page-invoices')) {
                                            var invoiceBlock = $('[data-receipt-block-id="'+val.id+'"]');
                                            if(invoiceBlock.length) {
                                                $('html,body').animate({scrollTop: invoiceBlock.offset().top}, 'normal');
                                            }
                                        }
                                        else {
                                            handbid.scrollToInvoices(notice, val.id);
                                        }
                                        notice.remove();
                                    }
                                }, {
                                    text     : 'Cancel',
                                    addClass : 'browse-here-button',
                                    click    : function (notice) {
                                        attention_about_bidding = false;
                                        $.cookie("bidder-" + profileID + "-want-no-invoice-" + val.id, "yes", {
                                            expires : cookie_expire,
                                            path    : '/'
                                        });
                                        notice.remove();
                                    }
                                }
                            ]
                        },
                        before_open  : function (PNotify) {
                        },
                        before_close : function () {
                        },
                        buttons      : {
                            closer  : false,
                            sticker : false
                        },
                        history      : {
                            history : false
                        }
                    });
                }

            },

            loadInvoicesToContainer : function (scrolled, invoiceID) {

                if (handbid.cannotDoIfUnauthorized(false)) {
                    return false;
                }

                var unpaidInvoicesCountContainer = $(".unpaidInvoicesCountContainer");
                var invoicesContainer            = $(".receipts-list-area");
                invoicesContainer.addClass("loading-messages");
                var nonce       = invoicesContainer.data("nonce");
                invoices_loaded = false;
                $.post(
                    ajaxurl,
                    {
                        action : "handbid_ajax_get_invoices",
                        nonce  : nonce
                    },
                    function (data) {
                        data = JSON.parse(data);

                        invoicesContainer.removeClass("loading-messages");
                        unpaidInvoicesCountContainer.html(data.unpaid);
                        (data.unpaid) ? unpaidInvoicesCountContainer.show() : unpaidInvoicesCountContainer.hide();
                        invoicesContainer.html(data.invoices);
                        invoices_loaded = true;

                        var bidderDashboardPlace = $("#bidder-info-load"),
                            profileID            = parseInt(bidderDashboardPlace.data("profile-id")),
                            itemDetailsBlock     = $('.item-details'),
                            auctionID            = (itemDetailsBlock.length) ? parseInt(itemDetailsBlock.data("item-auction-id")) : false;

                        if (!scrolled && data.unpaid > 0) {

                            $.map($(".receiptRow.preview"), function (val) {
                                var invoiceItem      = $(val),
                                    invoiceItemID    = parseInt(invoiceItem.data("receipt-block-id")),
                                    invoiceItemTotal = invoiceItem.data("receipt-total"),
                                    invoiceAuctionId = invoiceItem.data("receipt-of-auction"),
                                    invoiceItemTitle = $(".invoice-title", invoiceItem).eq(0).html();

                                handbid_main.showUnpaidInvoicesToUser(profileID, auctionID, {
                                    id      : invoiceItemID,
                                    total   : invoiceItemTotal,
                                    title   : invoiceItemTitle,
                                    auction : invoiceAuctionId
                                });

                            });
                        }

                        if (invoiceID) {
                            var invoiceBlock = $('[data-toggle-invoice-link="' + invoiceID + '"]')
                            invoiceBlock.click();
                            $('html,body').animate({scrollTop : invoiceBlock.offset().top}, 'normal');
                        }

                        return false;
                    }
                );

            },

            loadMessagesToContainer : function () {

                if (handbid.cannotDoIfUnauthorized(false)) {
                    return false;
                }

                var messagesContainer = $(".messages-list-area");
                messagesContainer.addClass("loading-messages");
                var nonce = messagesContainer.data("nonce");
                $.post(
                    ajaxurl,
                    {
                        action : "handbid_ajax_get_messages",
                        nonce  : nonce
                    },
                    function (data) {

                        data = JSON.parse(data);

                        messagesContainer.removeClass("loading-messages");
                        messagesContainer.html(data.messages);

                        return false;
                    }
                );

            },

            loadBidsHistoryToContainer : function (itemID) {

                var bidsHistoryContainer = $(".bid-history-container-" + itemID);
                if (bidsHistoryContainer.length) {
                    bidsHistoryContainer.addClass("loading-messages");
                    var nonce = bidsHistoryContainer.data("bids-nonce");
                    $.post(
                        ajaxurl,
                        {
                            action : "handbid_ajax_get_bid_history",
                            itemID : itemID,
                            nonce  : nonce
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

            loadAllToContainers : function () {
                this.loadInvoicesToContainer();
                this.loadMessagesToContainer();
            },

            scrollToInvoices : function (notice, invoiceID) {
                if (invoiceID != undefined && $("rtg-" + invoiceID).is(":visible")) {
                    return false;
                }
                var profileLinkVisible = $('a[data-slider-nav-key="profile-user-info"]:visible');
                profileLinkVisible.click();
                $('a[data-slider-nav-key="see-my-receipt"]:visible').click();
                $('html,body').animate({scrollTop : profileLinkVisible.offset().top}, 'normal');
                handbid.loadInvoicesToContainer(true, invoiceID);
                ((notice != undefined) && (notice != null)) ? notice.remove() : "";
            },

            notifyUserAboutAuctionClosing : function (values, hasInvoices) {

                var auctionName    = values.name;
                var noticeText     = 'Auction <b>' + auctionName + '</b> is closed now.';
                var buttons        = [];
                var confirm        = false;
                var hide           = true;
                var hasBidderPanel = ($("#bidder-info-load").length && $("#bidder-info-load").html() != "");
                $(".auction-details").removeClass('open').removeClass('preview').removeClass('presale').addClass('closed');
                $(".auction-details .status .status-label").html('closed');
                if (hasInvoices && hasBidderPanel) {
                    noticeText += "<br>You may have an unpaid invoices so you can check them.";
                    buttons.push({
                         text     : 'View Invoices',
                         addClass : 'view-invoices-button',
                         click    : function (notice) {
                             if($('body').hasClass('page-invoices')) {
                                 var invoiceBlock = $('[data-receipt-block-id="'+values.id+'"]');
                                 if(invoiceBlock.length) {
                                     $('html,body').animate({scrollTop: invoiceBlock.offset().top}, 'normal');
                                 }
                             }
                             else {
                                 handbid.scrollToInvoices(notice);
                             }
                             notice.remove();
                         }
                     });
                    confirm = {
                        confirm : true,
                        buttons : buttons
                    };
                    hide    = false;
                }

                (timer_notice != undefined) ? timer_notice.remove() : '';
                timer_notice = new PNotify({
                    title       : 'Auction Closed',
                    type        : 'info',
                    text        : noticeText,
                    icon        : 'glyphicon glyphicon-off',
                    addclass    : 'handbid-message-notice',
                    hide        : hide,
                    mouse_reset : false,
                    confirm     : confirm,
                    buttons     : {
                        closer  : true,
                        sticker : false
                    },
                    history     : {
                        history : false
                    }
                });

            },

            notifyUserAboutReceipt : function (values) {

                var invoiceID      = values.id;
                var hasBidderPanel = ($("#bidder-info-load").length && $("#bidder-info-load").html() != "");
                if ($("[data-receipt-block-id='" + invoiceID + "']").length == 0 && hasBidderPanel) {
                    var auctionName = values.name;
                    var noticeText  = values.name;
                    var buttons     = [];
                    buttons.push({
                                     text     : '' +
                                                'invoice',
                                     addClass : 'view-invoices-button',
                                     click    : function (notice) {
                                         handbid.scrollToInvoices(notice);
                                         notice.remove();
                                     }
                                 });
                    confirm = {
                        confirm : true,
                        buttons : buttons
                    };
                    hide    = false;

                    var params = {
                        title       : 'Auction Invoices',
                        type        : 'info',
                        text        : noticeText,
                        icon        : '',
                        addclass    : 'handbid-message-notice',
                        hide        : true,
                        delay       : 10000,
                        mouse_reset : false,
                        confirm     : confirm,
                        buttons     : {
                            closer  : true,
                            sticker : false
                        },
                        history     : {
                            history : false
                        }
                    };
                    if (auction_invoices != undefined && auction_invoices.animating == "out") {
                        auction_invoices = undefined;
                    }
                    if (auction_invoices != undefined) {
                        auction_invoices.update(params);
                    }
                    else {
                        auction_invoices = new PNotify(params);
                    }
                }
            },

            removeItemFromDashboardList : function (itemID, status, removePurchaseID) {
                var listBids = $(".handbid-list-of-bids-" + status).eq(0);
                if ((status == "purchases")) {
                    $("[data-purchased-purchase-id=" + itemID + "]").remove();
                    if (removePurchaseID) {
                        $("[data-purchased-item-id=" + itemID + "]").remove();
                    }
                }
                else {
                    $("[data-" + status + "-item-id=" + itemID + "]").remove();
                }
                if ($("li", listBids).length == 0) {
                    var noItemsText = listBids.data("no-items-text");
                    listBids.prepend("<p>" + noItemsText + "</p>");
                }
            },

            displayOnlyCurrentStatusOfItem : function (itemID, status) {
                $("[data-handbid-box-id=" + itemID + "][data-handbid-item-banner]").hide();
                $("[data-handbid-box-id=" + itemID + "][data-handbid-item-banner='" + status + "']").show();

                $("[data-handbid-item-box=" + itemID + "]").attr("data-handbid-item-box-status", status);
            },

            addLosingItemRow : function (itemID, values, type) {

                this.removeItemFromDashboardList(itemID, "losing");

                var reasonStr = (type == "under_maxbid") ? " by MaxBid. " : ".";

                var auctionKey = (values.auctionKey != undefined) ? values.auctionKey : currentAuctionKey;

                var itemLink = '/auctions/' + auctionKey + '/item/' + values.item.key;

                var itemImage = (values.item.image != undefined) ? values.item.image : values.item.imageUrl;

                this.addDashboardBidLosing(values.item.id, values.item.name, itemLink, values.amount);

                this.removeItemFromDashboardList(itemID, "winning");

                this.recheckAndRecalculateBids();

                var noticeFormatting = {isBidding : true, itemLink : itemLink, itemImage : itemImage};

                this.notice('You are <br>outbid</b> the item <b>' + values.item.name + ' (' + values.item.itemCode + ') </b> at ' + currency_span() + values.amount + "" + reasonStr + " <a href='" + itemLink + "'>GO TO ITEM</a>", "Losing Item", "error", null, noticeFormatting);

            },

            addWinningItemRow : function (itemID, values, type) {

                this.removeItemFromDashboardList(itemID, "winning");

                this.removeItemFromDashboardList(itemID, "purchases");

                var reasonStr = (type == "under_maxbid") ? " by MaxBid! " : " now!";

                var auctionKey = (values.auctionKey != undefined) ? values.auctionKey : currentAuctionKey;

                var itemLink = '/auctions/' + auctionKey + '/item/' + values.item.key;

                var itemImage = (values.item.image != undefined) ? values.item.image : values.item.imageUrl;

                this.addDashboardBidWinning(values.item.id, values.item.name, itemLink, values.amount);

                this.removeItemFromDashboardList(itemID, "losing");

                this.recheckAndRecalculateBids();

                var noticeFormatting = {isBidding : true, itemLink : itemLink, itemImage : itemImage};

                var noticeMessage = 'You are <br>winning</b> the item <b>' + values.item.name + ' (' + values.item.itemCode + ') </b> at ' + currency_span() + values.amount + "" + reasonStr;

                noticeMessage = (type == "maxbid_auto") ? values.message : noticeMessage;

                var noticeHeader = (type == "maxbid_auto") ? "Still Winning!" : "Winning!";

                this.notice(noticeMessage, noticeHeader, "success", null, noticeFormatting);
            },

            checkIfBidsExistsAndChange : function (values, type) {

                var profileID   = $("[data-dashboard-profile-id]").eq(0).data("dashboard-profile-id");
                var itemID      = values.item.id;
                var bidWinnerID = values.winnerId;

                var isBidInWinning = $("[data-winning-item-id=" + itemID + "]").length;
                var isBidInLosing  = $("[data-losing-item-id=" + itemID + "]").length;

                if (isBidInWinning && (bidWinnerID != profileID)) {
                    // You Are Losing This Item.
                    console.log("----- LOSING ITEM -----");

                    //this.addLosingItemRow(itemID, values);

                    this.checkIfMaxBidIsNotActual(values);

                    this.loadMessagesToContainer();
                }
                if (bidWinnerID == profileID) {
                    // You Are Winning This Item.
                    console.log("----- WINNING ITEM -----");

                    this.addWinningItemRow(itemID, values);

                    this.checkIfMaxBidIsNotActual(values);

                    this.loadMessagesToContainer();
                }

            },

            userItemBiddingEvent : function (values) {
                var itemID       = values.item.id,
                    status       = values.status,
                    statusReason = values.statusReason;
                if (status == "losing") {
                    this.removeItemFromDashboardList(itemID, "losing");
                    this.addLosingItemRow(itemID, values, statusReason);
                }
                if (status == "winning" && statusReason == "maxbid_auto") {
                    this.removeItemFromDashboardList(itemID, "winning");
                    this.addWinningItemRow(itemID, values, statusReason);
                    handbid.loadBidsHistoryToContainer(itemID);
                }
                if (status == "removed" && statusReason == "bid_removed") {

                    this.removeItemFromDashboardList(itemID, "purchases", itemID);
                    this.recheckAndRecalculateBids();
                    handbid.loadBidsHistoryToContainer(itemID);
                }
            },

            checkIfMaxBidIsNotActual : function (values) {
                var itemID       = values.item.id,
                    itemBlock    = $("[data-maxbid-item-id='" + itemID + "']").eq(0),
                    itemBlockVal = parseInt(itemBlock.data("proxy-item-max-value"));
                if (itemBlock != undefined && values.amount >= itemBlockVal) {
                    this.removeItemFromDashboardList(itemID, "proxy");
                }
                this.recheckAndRecalculateBids();
            },

            addUserPurchase : function (values) {
                if (values.isDeleted == 1) {
                    this.removeItemFromDashboardList(values.id, "purchases");
                    this.recheckAndRecalculateBids();
                }
                else {
                    this.removeItemFromDashboardList(values.item.id, "winning");
                    this.removeItemFromDashboardList(values.id, "purchases");
                    this.addDashboardBidPurchased(values);
                    this.loadMessagesToContainer();
                }
            },

            getSinglePaymentTemplate : function (payment) {

                var payment_title = '';
                switch (payment.paymentMethod) {
                    case 'creditcard' :
                        payment_title = payment.card + ' xxxx-xxxx-xxxx-' + payment.last4;
                        break;
                    case 'creditcard_external' :
                        payment_title = 'Credit Card (external)';
                        break;
                    case 'cash' :
                        payment_title = 'Cash';
                        break;
                    case 'checking_account' :
                        payment_title = 'Check';
                        break;
                    case 'credited_amount' :
                        payment_title = 'Credit';
                        break;
                    case 'discount_amount' :
                        payment_title = 'Discount';
                        break;
                    default:
                        payment_title = '';
                }

                var template = '<div class="col-xs-0 col-md-4"></div>' +
                               '<div class="col-xs-7 col-md-5">' +
                               '<h4 class="quantity-total">Payment Applied: ' + payment_title +
                               '<span>' + payment.datetime + '</span></h4>' +
                               '</div>' +
                               '<div class="col-xs-5 col-md-3">' +
                               '<span class="bid-amount winning">' +
                               currency_span() +
                               '<span class="handbidInventorySinglePaymentAmount">' + payment.amount + '</span>' +
                               '</span>' +
                               '</div>';

                return template;

            },

            processPayments : function (payments, auction_id) {

                var paymentsBlock = $('.handbid-list-of-purchase-totals .payments-list-' + auction_id);

                paymentsBlock.html('');

                $.map(payments, function (payment) {
                    var payment_str = handbid_main.getSinglePaymentTemplate(payment);
                    paymentsBlock.append(payment_str);
                });

                handbid_main.recheckYourCardItems();

            },

            processUserReceipt : function (values) {
                var receiptID      = values.id;
                var receiptBlock   = $('[data-receipt-block-id="' + receiptID + '"]').eq(0);
                var unpaidControls = $('[data-receipt-block-id="' + receiptID + '"] .unpaidControls');
                var paidControls   = $('[data-receipt-block-id="' + receiptID + '"] .paidControls');
                var unpaidRows     = $('[data-receipt-block-id="' + receiptID + '"] .unpaidRows');
                if (values.paid) {
                    receiptBlock.removeClass("preview").addClass("open");
                    unpaidControls.hide();
                    unpaidRows.hide();
                    paidControls.show();
                }
                else {
                    receiptBlock.addClass("preview").removeClass("open");
                    unpaidControls.show();
                    unpaidRows.show();
                    paidControls.hide();
                }

                if (values.payments != undefined) {
                    handbid_main.processPayments(values.payments, values.auctionId)
                }
            },

            scrollToProfile : function (receipt_id) {

                if (receipt_id) {
                    address_to_pay_receipt = receipt_id;
                }

                var selectorProfile = 'a[data-slider-nav-key="profile-user-info"]:visible';
                var selectorInfo    = 'a[data-slider-nav-key="user-profile"]:visible';
                if ($(selectorInfo).length != 0) {
                    $(selectorInfo).click();
                    setTimeout(function () {
                        $('html,body').animate({scrollTop : $('#profileNewPasswordConfirm').offset().top}, 'normal');
                    }, 300);
                }
                else {
                    $(selectorProfile).click();
                    setTimeout(function () {
                        $(selectorInfo).click();
                        setTimeout(function () {
                            $('html,body').animate({scrollTop : $('#profileNewPasswordConfirm').offset().top}, 'normal');
                        }, 300);
                    }, 300);
                }
            },

            // Pnotify to be in queue
            proposeToFillAddressBeforePay : function (receipt_id) {

                attention_about_address_is_required_to_pay = true;
                var fillAddressNotice                      = new PNotify({
                    title        : 'Address Needed',
                    text         : 'This organization requires your shipping address be on file prior to completing this transaction. Please fill and save it in your profile and return to payment processing.',
                    icon         : 'glyphicon glyphicon-question-sign',
                    type         : 'info',
                    addclass     : 'handbid-message-notice',
                    hide         : false,
                    mouse_reset  : false,
                    confirm      : {
                        confirm : true,
                        buttons : [
                            {
                                text     : 'Add',
                                addClass : 'send-invoice-button',
                                click    : function (notice) {
                                    attention_about_address_is_required_to_pay = false;
                                    notice.remove();
                                    $('#payInvoiceID').val(receipt_id);
                                    handbid_main.scrollToProfile(receipt_id);
                                }
                            }, {
                                text     : 'Cancel',
                                addClass : 'cancel-sending-button',
                                click    : function (notice) {
                                    attention_about_address_is_required_to_pay = false;
                                    notice.remove();
                                }
                            }
                        ]
                    },
                    stack        : false,
                    before_open  : function (PNotify) {
                        handbid_main.fadeInModalOverlayAndPositionModal(PNotify);
                    },
                    before_close : function () {
                        handbid_main.fadeOutModalOverlay();
                    },
                    buttons      : {
                        closer  : false,
                        sticker : false
                    },
                    history      : {
                        history : false
                    }
                });
                fillAddressNotice.get().on('pnotify.cancel', function () {
                    return false;
                });

            },

            // Pnotify to be in queue
            proposeToContinuePayInvoice : function (receipt_id) {

                attention_about_continue_payment = true;
                var continuePaymentNotice        = new PNotify({
                    title        : 'Continue Payment',
                    text         : 'Do you want to continue payment?',
                    icon         : 'glyphicon glyphicon-question-sign',
                    type         : 'info',
                    addclass     : 'handbid-message-notice',
                    hide         : false,
                    mouse_reset  : false,
                    confirm      : {
                        confirm : true,
                        buttons : [
                            {
                                text     : 'Continue',
                                addClass : 'send-invoice-button',
                                click    : function (notice) {
                                    attention_about_continue_payment = false;
                                    notice.remove();
                                    handbid_main.scrollToInvoices(notice, receipt_id);
                                    var button = $('[data-receipt-id="' + receipt_id + '"]').eq(0);
                                    handbid_main.tryToMakePaymentForReceipt(button);
                                }
                            }, {
                                text     : 'Cancel',
                                addClass : 'cancel-sending-button',
                                click    : function (notice) {
                                    attention_about_continue_payment = false;
                                    notice.remove();
                                }
                            }
                        ]
                    },
                    stack        : false,
                    before_open  : function (PNotify) {
                        handbid_main.fadeInModalOverlayAndPositionModal(PNotify);
                    },
                    before_close : function () {
                        handbid_main.fadeOutModalOverlay();
                    },
                    buttons      : {
                        closer  : false,
                        sticker : false
                    },
                    history      : {
                        history : false
                    }
                });
                continuePaymentNotice.get().on('pnotify.cancel', function () {
                    return false;
                });

            },

            initGoogleAutocomplete : function (element_id) {

                autocomplete = new google.maps.places.Autocomplete(
                    /** @type {!HTMLInputElement} */(document.getElementById(element_id)),
                    {types : ['geocode']});

            },

            toggleProfileLocationMap : function () {

                $('#profile-location-map-container').slideToggle();

                var shippingAddressContainer = $('#profileShippingAddress');

                if (profile_location_map == undefined) {

                    var geocoder = new google.maps.Geocoder;

                    var myLatLng = {lat : 39.7642543, lng : -104.9955388};

                    var shippingAddress = shippingAddressContainer.val();

                    if (shippingAddress.trim() != '') {
                        geocoder.geocode({'address' : shippingAddress}, function (results, status) {
                            if (status == google.maps.GeocoderStatus.OK) {
                                myLatLng = results[0].geometry.location.toJSON();
                            }
                        });
                    }

                    profile_location_map = new google.maps.Map(document.getElementById('profile-location-map'), {
                        center : myLatLng,
                        zoom   : 8
                    });

                    var marker = new google.maps.Marker({
                        position  : myLatLng,
                        map       : profile_location_map,
                        draggable : true,
                        animation : google.maps.Animation.DROP,
                        title     : 'Hello World!'
                    });

                    google.maps.event.addListener(profile_location_map, "click", function (event) {

                        var eventLatLng = {lat : event.latLng.lat(), lng : event.latLng.lng()};

                        marker.setPosition(eventLatLng);

                        geocoder.geocode({'location' : eventLatLng}, function (results, status) {

                            if (status === google.maps.GeocoderStatus.OK) {
                                if (results[0]) {
                                    shippingAddressContainer.val(results[0]['formatted_address']);
                                }
                            }
                        });

                    });
                }
            },

            auctionRequiresAddressToPay : function (elem, receipt_id, requireAddresstoPay) {

                var needAddress = true;

                if (elem) {
                    var attr = elem.attr('data-require-address-to-pay');

                    needAddress = (typeof attr !== typeof undefined && attr !== false);
                }
                else {
                    needAddress = requireAddresstoPay;
                }

                if (needAddress) {

                    var address       = $('#profileShippingAddress').val().trim(),
                        addressFilled = (address != '' && address != 'United States');

                    if (needAddress && !addressFilled) {

                        if (!receipt_id) {
                            receipt_id = elem.attr('data-receipt-id')
                        }

                        handbid_main.proposeToFillAddressBeforePay(receipt_id);
                    }

                    return !addressFilled;
                }
                else {
                    return false;
                }
            },

            noticeIfNoCreditCard : function (elem) {
                var attr = elem.attr('data-handbid-credit-cards-required');

                var need_credit_card    = (typeof attr !== typeof undefined && attr !== false);
                var credit_card_rows    = $("[data-handbid-card-row]");
                var cards_count_holder  = $("#footer-credit-cards-count");
                var credit_cards_number = (cards_count_holder.length)
                    ? parseInt(cards_count_holder.val())
                    : credit_card_rows.length;

                if ((need_credit_card && credit_cards_number == 0)) {

                    handbid_modals_main.showSingleModal('credit-card-form');
                }
                return need_credit_card;
            },

            getCountOfPastItemPurchases : function (itemID) {
                var count_of_purchased = 0;
                $.map($('.handbid-list-of-bids-purchases [data-purchased-item-id="' + itemID + '"]'), function (item) {
                    count_of_purchased += parseInt($(item).data('dashboard-quantity'));
                });
                return count_of_purchased;
            },

            confirmIfUserReallyWantToBuy : function (handbid) {

                var purchase_count   = parseInt($('[data-handbid-quantity]').eq(0).html()),
                    purchase_price   = parseFloat($('[data-handbid-item-attribute="buyNowPrice"]').eq(0).html()),
                    purchase_total   = purchase_count * purchase_price,
                    item_details_box = $('.item-details').eq(0),
                    item_id          = item_details_box.data('item-id'),
                    is_donation      = (item_details_box.data('item-is-donation') == 'yes'),
                    is_ticket        = (item_details_box.data('item-is-ticket') == 'yes'),
                    buy_again        = is_donation ? false : handbid.getCountOfPastItemPurchases(item_id),
                    title            = is_donation ? 'Donation Confirmation' : 'Purchase Confirmation',
                    confirm_text     = is_donation ? 'Confirm Donation of ' + currency_span() + purchase_total + '?' : 'Add ' + purchase_count + ' for ' + currency_span() + purchase_total + ' to your cart?',
                    text             = buy_again ? confirm_text + '<br /><br /> Hey! You have already purchased ' + buy_again + ' of this item, are you sure you want to purchase ' + purchase_count + ' more?' : confirm_text;

                attention_about_buying_confirmation = true;
                var bid_notice                      = new PNotify({
                    title        : title,
                    text         : text,
                    icon         : 'glyphicon glyphicon-question-sign',
                    type         : 'info',
                    addclass     : 'handbid-message-notice handbid-left-padding-notice',
                    hide         : false,
                    mouse_reset  : false,
                    confirm      : {
                        confirm : true,
                        buttons : [
                            {
                                text     : 'Yes',
                                addClass : 'bid-here-button',
                                click    : function (notice) {
                                    attention_about_buying_confirmation = false;
                                    notice.remove();
                                    handbid.confirmedPurchase();
                                }
                            }, {
                                text     : 'No, thanks',
                                addClass : 'browse-here-button',
                                click    : function (notice) {
                                    attention_about_buying_confirmation = false;
                                    notice.remove();
                                }
                            }
                        ]
                    },
                    stack        : false,
                    before_open  : function (PNotify) {
                        handbid_main.fadeInModalOverlayAndPositionModal(PNotify);
                    },
                    before_close : function () {
                        handbid_main.fadeOutModalOverlay();
                    },
                    buttons      : {
                        closer  : false,
                        sticker : false
                    },
                    history      : {
                        history : false
                    }
                });
                bid_notice.get().on('pnotify.cancel', function () {
                    return false;
                });
            },

            alreadyHaveMaxBidForItem : function (values) {
                var currentBidderID = parseInt($("[data-dashboard-profile-id]").eq(0).data("dashboard-profile-id"));
                var winnerBidderID  = values.item.winnerId;
                if (winnerBidderID == currentBidderID && values) {
                    var itemName = values.item.name;
                    var newMax   = values.proxyBid;
                    var oldMax   = values.item.highestProxyBid;
                    handbid_main.notice("Cannot create MaxBid at <b>" + itemName + "</b> at " + currency_span() + newMax + ". You already have a maxbid for this item at " + currency_span() + oldMax + " . Please remove the current maxbid to create a new one.", "Already Have MaxBid", "error");
                }
            },

            disableAllBiddingButtonsIfSold : function () {

                $('[data-handbid-bid-button="up"]').addClass("disabled-button");
                $('[data-handbid-bid-button="down"]').addClass("disabled-button");
                $('[data-handbid-bid-button="bid"]').addClass("disabled-button");
                $('[data-handbid-bid-button="proxy"]').addClass("disabled-button");
                $('[data-handbid-bid-button="purchase"]').addClass("disabled-button");
                $('[data-handbid-bid-button="buyItNow"]').addClass("disabled-button");

            },

            isButtonDisabledOrAlreadyActive : function (button) {

                return button.hasClass("disabled-button") || button.hasClass("active");

            },

            scrollBodyToTopOfElement : function (top, time) {
                time = time ? time : 900;
                $('html, body').animate({
                                            scrollTop : top
                                        }, time);

            },

            getCategoryForInitialFilter : function () {
                var comes_from = 'all';
                var hash       = window.location.hash;
                if (hash) {
                    hash = hash.split('-').pop();

                    comes_from = this.getCookie(this.getCookieNameForItem(hash));
                    //this.setCookie(this.getCookieNameForItem(hash), 'all');
                }
                return comes_from;
            },

            goBackToItem : function () {
                var hash = window.location.hash;
                if (hash) {
                    hash                 = hash.split('-').pop();
                    var topElementOffset = $('[data-handbid-item-box="' + hash + '"]').offset();
                    if (topElementOffset != undefined) {

                        var comes_from = this.getCategoryForInitialFilter();

                        if (comes_from != 'all') {
                            setTimeout(function () {
                                $('[data-legacy-category-id="' + hash + '"] a').click();
                                setTimeout(function () {
                                    handbid_main.scrollBodyToTopOfElement(topElementOffset.top);
                                }, 500);
                            }, 500);

                        }
                        else {
                            this.scrollBodyToTopOfElement(topElementOffset.top);
                        }

                    }
                }
            },

            getStatusReasonByCode : function (code) {

                return (status_reasons[code] != undefined) ? status_reasons[code] : code;

            },

            cannotDoIfUnauthorized : function (show_popup) {
                var sessionCookie = $.cookie("handbid-auth");
                if (!sessionCookie) {
                    show_popup = (show_popup != undefined) ? show_popup : true;
                    if(show_popup) {
                        $("[data-handbid-connect]").eq(0).click();
                    }
                    this.loggedIn = false;
                }
                else {
                    this.loggedIn = true;
                }
                // we cannot return this.loggedIn because of this function returns 'true' only in you canNOT press
                //button if you are logged out.
                return !this.loggedIn;
            },

            confirmedPurchase : function () {

                var users_ids      = $('[data-handbid-user-id]'),
                    auction_ids    = $('[data-handbid-auction-id]'),
                    item_ids       = $('[data-handbid-item-id]'),
                    bidUserId      = $("#bidUserId"),
                    bidAuctionId   = $("#bidAuctionId"),
                    bidItemId      = $("#bidItemId"),
                    userId         = (users_ids.length > 0) ? users_ids.attr('data-handbid-user-id') : (parseInt(bidUserId.val()) ? parseInt(bidUserId.val()) : null),
                    auctionId      = (auction_ids.length > 0) ? auction_ids.attr('data-handbid-auction-id') : (parseInt(bidAuctionId.val()) ? parseInt(bidAuctionId.val()) : null),
                    itemId         = (item_ids.length > 0) ? item_ids.attr('data-handbid-item-id') : (parseInt(bidItemId.val()) ? parseInt(bidItemId.val()) : null),
                    amount         = $('[data-handbid-quantity], [data-handbid-bid-amount]'),
                    incrementSpan  = $('.increment span.incrementSpan'),
                    minimalBidSpan = $('.minimalBidAmount span[data-change-attribute="minimumBidAmount"]'),
                    increment      = (incrementSpan.length > 0 ) ? parseInt(incrementSpan[0].innerHTML) : 1,
                    minimalBidAmount = (minimalBidSpan.length > 0 ) ? parseInt(minimalBidSpan[0].innerHTML) : 1;

                var nonce    = $("#bidNonce").val();
                var button   = $('[data-handbid-bid-button="purchase"]').eq(0);
                var perItem  = parseFloat(button.data("handbid-buynow-price"));
                var quantity = parseInt(amount[0].innerHTML);
                button.addClass("active");
                var data = {
                    action    : "handbid_ajax_createbid",
                    nonce     : nonce,
                    userId    : userId,
                    auctionId : auctionId,
                    itemId    : itemId,
                    amount    : perItem,
                    quantity  : quantity
                };

                $.post(
                    ajaxurl,
                    data,
                    function (data) {

                        console.log("-----------------------");
                        console.log("----Buy Items success----");
                        data = JSON.parse(data);

                        button.removeClass("active");
                        var message = "";
                        if (data.status == "failed") {
                            message = handbid.getStatusReasonByCode(data.statusReason);
                            handbid_main.notice(message, data.status.toUpperCase(), data.status);
                        }
                        else {

                            handbid.setPaddleNumberAndWelcomeMessage(data.welcomeForReceipt, data.paddleNumber);
                            handbid.showAreYouHereMessage(data.bidderLocationQuestion);

                            var total_sold_container = $('[data-handbid-item-attribute="totalSoldItems"]').eq(0);
                            var total_sold           = data.item.quantitySold;
                            total_sold_container.html(total_sold);
                            var inventory_remaining_cont = $('[data-handbid-item-attribute="inventoryRemaining"]').eq(0);
                            var inventoryRemaining       = data.item.inventoryRemaining;
                            inventoryRemaining           = (inventoryRemaining == -1) ? "∞" : inventoryRemaining;
                            inventory_remaining_cont.html(inventoryRemaining);
                            var startCount = (data.item.inventoryRemaining != 0) ? 1 : 0;
                            amount.html(startCount);

                            var isAppeal    = (data.item.isAppeal != undefined && data.item.isAppeal == 1);
                            var noticeTitle = (isAppeal) ? "Thank You!" : "Congratulations!";
                            message         = (isAppeal) ? "You donated " + currency_span() + (data.currentAmount * data.quantity)
                                : "You've added " + quantity
                                  + " <br>of Item #" + data.item.id + " <br><b>" + data.item.name
                                  + " to your Cart</b>";
                            handbid_main.notice(message, noticeTitle, "success");

                            handbid_main.removeItemFromDashboardList(itemId, "proxy");
                            handbid_main.recheckAndRecalculateBids();

                            handbid.loadAllToContainers();
                            handbid.reloadPageIfForceRefresh();
                        }

                        return false;
                    }
                );
            },

            // Setup bidding
            setupBidding                           : function (handbid) {

                var userId           = ($('[data-handbid-user-id]').length > 0) ? $('[data-handbid-user-id]').attr('data-handbid-user-id') : (parseInt($("#bidUserId").val()) ? parseInt($("#bidUserId").val()) : null),
                    auctionId        = ($('[data-handbid-auction-id]').length > 0) ? $('[data-handbid-auction-id]').attr('data-handbid-auction-id') : (parseInt($("#bidAuctionId").val()) ? parseInt($("#bidAuctionId").val()) : null),
                    itemId           = ($('[data-handbid-item-id]').length > 0) ? $('[data-handbid-item-id]').attr('data-handbid-item-id') : (parseInt($("#bidItemId").val()) ? parseInt($("#bidItemId").val()) : null),
                    amount           = $('[data-handbid-quantity], [data-handbid-bid-amount]'),
                    increment        = ($('.increment span.incrementSpan').length > 0 ) ? parseInt($('.increment span.incrementSpan')[0].innerHTML) : 1,
                    minimalBidAmount = ($('.minimalBidAmount span[data-change-attribute="minimumBidAmount"]').length > 0 ) ? parseInt($('.minimalBidAmount span[data-change-attribute="minimumBidAmount"]')[0].innerHTML) : 1;

                $('[data-handbid-bid-button="up"]').live('click', function (e) {

                    var inventoryRemaining = parseInt($('[data-handbid-item-attribute="inventoryRemaining"]').eq(0).html());

                    if (handbid.isButtonDisabledOrAlreadyActive($(this))
                        || handbid.cannotDoIfUnauthorized()
                        || handbid.noticeIfNoCreditCard($(this))
                        || inventoryRemaining == 0) {
                        return false;
                    }

                    e.preventDefault();

                    var canBeUp    = true;
                    var maxCanBeUp = true;

                    var amountContainer = amount;
                    var amountDuplicate = null;

                    var isMaxBidButton         = $(this).hasClass("max-bid-up");
                    var isDirectPurchaseButton = $(this).hasClass("isDirectPurchase");

                    if (!isDirectPurchaseButton) {
                        amountContainer = (isMaxBidButton) ? $('[data-handbid-maxbid-amount]') : $('[data-handbid-onlybid-amount]');
                    }

                    var value = parseInt(amountContainer[0].innerHTML) + increment;

                    if (isDirectPurchaseButton) {
                        var inventoryRemaining = ($('[data-handbid-item-attribute="inventoryRemaining"]').length > 0 ) ? parseInt($('[data-handbid-item-attribute="inventoryRemaining"]')[0].innerHTML) : -1;
                        inventoryRemaining     = (inventoryRemaining) ? inventoryRemaining : -1;
                        var totalSoldItems     = ($('[data-handbid-item-attribute="totalSoldItems"]').length > 0 ) ? parseInt($('[data-handbid-item-attribute="totalSoldItems"]')[0].innerHTML) : 0;
                        totalSoldItems         = (totalSoldItems) ? totalSoldItems : 0;
                        canBeUp                = ((inventoryRemaining == -1 ) || ((inventoryRemaining != -1) && (value <= inventoryRemaining)));

                    }
                    else {
                        var buyNowPrice = ($('[data-handbid-buynow-price]').length > 0 ) ? $('[data-handbid-buynow-price]').eq(0).data("handbid-buynow-price") : -1;
                        buyNowPrice     = (buyNowPrice != "" ) ? parseInt(buyNowPrice) : -1;

                        var maxBidCondition = isMaxBidButton ? (value < buyNowPrice) : (value <= buyNowPrice);
                        canBeUp             = ((buyNowPrice <= 0 ) || ((buyNowPrice > 0) && maxBidCondition));
                        maxCanBeUp          = ((buyNowPrice <= 0 ) || ((buyNowPrice > 0) && (value < buyNowPrice)));

                    }
                    if (canBeUp) {
                        amountContainer.html(value);
                        if (!isDirectPurchaseButton && !isMaxBidButton && maxCanBeUp) {
                            $('[data-handbid-maxbid-amount]').html(value);
                        }
                    }

                });

                $('[data-handbid-bid-button="down"]').live('click', function (e) {

                    if (handbid.isButtonDisabledOrAlreadyActive($(this))
                        || handbid.cannotDoIfUnauthorized()
                        || handbid.noticeIfNoCreditCard($(this))) {
                        return false;
                    }

                    e.preventDefault();

                    var amountContainer = amount;

                    var isMaxBidButton         = $(this).hasClass("max-bid-down");
                    var isDirectPurchaseButton = $(this).hasClass("isDirectPurchase");

                    if (!isDirectPurchaseButton) {
                        amountContainer = (isMaxBidButton) ? $('[data-handbid-maxbid-amount]') : $('[data-handbid-onlybid-amount]');
                    }

                    var value = parseInt(amountContainer[0].innerHTML) - increment;

                    minimalBidAmount = ($('.minimalBidAmount span[data-change-attribute="minimumBidAmount"]').length > 0 ) ? parseInt($('.minimalBidAmount span[data-change-attribute="minimumBidAmount"]')[0].innerHTML) : 1;
                    if (value >= minimalBidAmount) {
                        amountContainer.html(value);
                        if (!isDirectPurchaseButton && !isMaxBidButton) {
                            $('[data-handbid-maxbid-amount]').html(value);
                        }
                    }

                });

                $('[data-handbid-bid-button="bid"]').live('click', function (e) {

                    if (handbid.isButtonDisabledOrAlreadyActive($(this))
                        || handbid.cannotDoIfUnauthorized()
                        || handbid.noticeIfNoCreditCard($(this))) {
                        return false;
                    }

                    e.preventDefault();
                    var currentButton = $(this);

                    var needToConfirm = handbid.checkIfWantToShowBidConfirmation();
                    if (needToConfirm) {
                        handbid.notConfirmedBidAction(currentButton, userId, auctionId, itemId);
                    }
                    else {
                        handbid.confirmedBidAction(currentButton, userId, auctionId, itemId);
                    }

                    return false;

                });

                $('[data-handbid-bid-button="proxy"]').live('click', function (e) {

                    if (handbid.isButtonDisabledOrAlreadyActive($(this))
                        || handbid.cannotDoIfUnauthorized()
                        || handbid.noticeIfNoCreditCard($(this))) {
                        return false;
                    }
                    var amountContainer = $('[data-handbid-maxbid-amount]');
                    var total           = amountContainer[0].innerHTML;
                    var nonce           = $("#bidNonce").val();
                    var button          = $(this);
                    button.addClass("active");
                    $(".proxy-bid-dialog-close").hide();
                    var data = {
                        action    : "handbid_ajax_createbid",
                        nonce     : nonce,
                        userId    : userId,
                        auctionId : auctionId,
                        itemId    : itemId,
                        maxAmount : total
                    };
                    $.post(
                        ajaxurl,
                        data,
                        function (data) {

                            console.log("-----------------------");
                            console.log("----Max Bid success----");
                            data = JSON.parse(data);

                            if (data.status == undefined) {
                                handbid.notice("Something went wrong. Please, try again later", "No response from server", "error");
                            }
                            else {

                                if (data.status == "failed") {
                                    var message = "";
                                    if (data.bidType == "max_bid") {
                                        handbid.alreadyHaveMaxBidForItem(data);
                                    }
                                    else {
                                        message = handbid.getStatusReasonByCode(data.statusReason);
                                        handbid.notice(message, data.status.toUpperCase(), data.status);
                                    }
                                }
                                else {

                                    handbid.setPaddleNumberAndWelcomeMessage(data.welcomeForReceipt, data.paddleNumber);
                                    handbid.showAreYouHereMessage(data.bidderLocationQuestion);

                                    data.item.auctionKey = $("#bidder-info-load").data("auction-key");
                                    handbid.addDashboardBidProxy(data.id, data.item.id, data.item.name, data.item.key, data.item.auctionKey, data.maxAmount);

                                    if (data.statusReason == "raised_maxbid") {
                                        if (data.status == "winning") {
                                            handbid.addWinningItemRow(data.item.id, data, data.statusReason);
                                            handbid.loadBidsHistoryToContainer(data.item.id);
                                        }
                                    }

                                    handbid.reloadPageIfForceRefresh();
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

                    e.preventDefault();

                    var inventoryRemaining = parseInt($('[data-handbid-item-attribute="inventoryRemaining"]').eq(0).html());

                    if (handbid.isButtonDisabledOrAlreadyActive($(this))
                        || handbid.cannotDoIfUnauthorized()
                        || handbid.noticeIfNoCreditCard($(this))
                        || inventoryRemaining == 0) {
                        return false;
                    }

                    handbid.confirmIfUserReallyWantToBuy(handbid);

                    return false;
                });

                $('[data-handbid-bid-button="buyItNow"]').live('click', function (e) {

                    if (handbid.isButtonDisabledOrAlreadyActive($(this))
                        || handbid.cannotDoIfUnauthorized()
                        || handbid.noticeIfNoCreditCard($(this))) {
                        return false;
                    }

                    e.preventDefault();

                    var nonce  = $("#bidNonce").val();
                    var total  = parseFloat($(this).data("handbid-buynow-price"));
                    var button = $(this);
                    button.addClass("active");
                    var data = {
                        action    : "handbid_ajax_createbid",
                        nonce     : nonce,
                        userId    : userId,
                        auctionId : auctionId,
                        itemId    : itemId,
                        amount    : total
                    };
                    $.post(
                        ajaxurl,
                        data,
                        function (data) {

                            console.log("-----------------------");
                            console.log("----Buy Now success----");
                            data = JSON.parse(data);

                            handbid.setPaddleNumberAndWelcomeMessage(data.welcomeForReceipt, data.paddleNumber);
                            handbid.showAreYouHereMessage(data.bidderLocationQuestion);

                            $('[data-handbid-item-banner="sold"]').show();
                            handbid.disableAllBiddingButtonsIfSold();
                            button.removeClass("active");
                            handbid.loadInvoicesToContainer(true);
                            handbid.reloadPageIfForceRefresh();
                            return false;
                        }
                    );

                    return false;

                });

                $('[data-handbid-delete-proxy]').live('click', function (e) {
                    if (handbid.isButtonDisabledOrAlreadyActive($(this))
                        || handbid.cannotDoIfUnauthorized()
                        || handbid.noticeIfNoCreditCard($(this))) {
                        return false;
                    }
                    e.preventDefault();

                    var listBidsProxy = $(".handbid-list-of-bids-proxy").eq(0);

                    var nonce  = $("#bidNonce").val();
                    var bidID  = parseInt($(this).data("handbid-delete-proxy"));
                    var button = $(this);
                    var itemID = button.data("item-id");
                    button.addClass("active");
                    var data = {
                        action : "handbid_ajax_removebid",
                        nonce  : nonce,
                        bidID  : bidID
                    };
                    $.post(
                        ajaxurl,
                        data,
                        function (data) {

                            console.log("-----------------------------");
                            console.log("----Delete Maxbid success----");
                            data = JSON.parse(data);

                            handbid.removeItemFromDashboardList(itemID, "proxy");

                            handbid.recheckAndRecalculateBids();

                            button.removeClass("active");
                            return false;
                        }
                    );

                    return false;

                });
            },
            notConfirmedBidAction                  : function (currentButton, userId, auctionId, itemId) {
                attention_about_confirm = true;
                var minimumBidAmount    = $('[data-change-attribute="minimumBidAmount"]').eq(0).html();
                var currency            = $('.handbidAuctionCurrency').eq(0).html();
                var confirmNotify       = new PNotify({
                    title        : '',
                    text         : '<b>Place a bid for ' + currency + '<span data-change-attribute="minimumBidAmount">' + minimumBidAmount + '</span> on this item?</b>',
                    icon         : 'glyphicon glyphicon-question-sign',
                    type         : "info",
                    hide         : false,
                    confirm      : {
                        confirm : true,
                        buttons : [
                            {
                                text  : 'Yes',
                                click : function (notice) {
                                    attention_about_confirm = false;
                                    notice.remove();
                                    handbid_main.confirmedBidAction(currentButton, userId, auctionId, itemId);
                                }
                            }, {
                                text  : 'No',
                                click : function (notice) {
                                    attention_about_confirm = false;
                                    notice.remove();
                                }
                            }
                        ]
                    },
                    buttons      : {
                        closer  : false,
                        sticker : false
                    },
                    history      : {
                        history : false
                    },
                    before_open  : function (noticeK) {
                        noticeK.get().css({
                                              //"top": ($(window).height() / 2) - (noticeK.get().height() / 2) - 80,
                                              //"left": ($(window).width() / 2) - (noticeK.get().width() / 2)
                                          });
                        if (confirm_bid_overlay) confirm_bid_overlay.fadeIn("fast");
                        else confirm_bid_overlay = $("<div />", {
                            "class" : "ui-widget-overlay",
                            "css"   : {
                                "display"    : "none",
                                "position"   : "fixed",
                                "background" : "rgba(0, 0, 0, 0.7)",
                                "top"        : "0",
                                "bottom"     : "0",
                                "right"      : "0",
                                "left"       : "0",
                                "z-index"    : "9999"
                            }
                        }).appendTo("body").fadeIn("fast");
                    },
                    before_close : function () {
                        confirm_bid_overlay.fadeOut("fast");
                    }
                });

            },
            confirmedBidAction                     : function (currentButton, userId, auctionId, itemId) {

                var amountContainer = $('[data-handbid-onlybid-amount]');

                var total   = amountContainer[0].innerHTML;
                var nonce   = $("#bidNonce").val();
                var button  = currentButton;
                var message = "";
                button.addClass("active");
                var data = {
                    action    : "handbid_ajax_createbid",
                    nonce     : nonce,
                    userId    : userId,
                    auctionId : auctionId,
                    itemId    : itemId,
                    amount    : total
                };
                $.post(
                    ajaxurl,
                    data,
                    function (data) {

                        console.log("-----------------------");
                        console.log("----Bid Now success----");
                        data = JSON.parse(data);

                        if (data.status == "failed") {
                            message = handbid.getStatusReasonByCode(data.statusReason);
                            handbid.notice(message, data.status.toUpperCase(), data.status);
                        }
                        else {

                            handbid.setPaddleNumberAndWelcomeMessage(data.welcomeForReceipt, data.paddleNumber);
                            handbid.showAreYouHereMessage(data.bidderLocationQuestion);

                            $('[data-handbid-item-attribute="bidCount"]').html(data.item.bidCount);
                            $('[data-handbid-item-attribute="minimumBidAmount"]').html(currency_span() + data.item.minimumBidAmount);
                            if (data.statusReason == "under_maxbid") {
                                handbid.addLosingItemRow(data.item.id, data, data.statusReason);
                                handbid.loadBidsHistoryToContainer(data.item.id);
                            }

                            handbid.reloadPageIfForceRefresh();
                        }

                        button.removeClass("active");
                        return false;
                    }
                );
            },
            reloadPageIfForceRefresh               : function () {
                if (forcePageRefreshAfterBids) {
                    location.reload();
                }
            },
            reloadPageAfterPurchasesIfForceRefresh : function () {
                if (forcePageRefreshAfterPurchases) {
                    location.reload();
                }
            },

            tryToMakePaymentForReceipt : function (button) {
                setTimeout(
                    function () {
                        if (invoices_loaded) {
                            handbid_main.makePaymentForReceipt(button);
                        }
                        else {
                            handbid_main.tryToMakePaymentForReceipt(button);
                        }
                    },
                    500
                );
            },

            makePaymentForReceipt : function (button) {
                if (handbid.isButtonDisabledOrAlreadyActive(button)
                    || handbid.cannotDoIfUnauthorized()
                    || handbid.noticeIfNoCreditCard(button)) {
                    return false;
                }

                if (handbid.auctionRequiresAddressToPay(button)) {
                    return false;
                }

                var isInventoryPayment = (button.attr("data-inventory-payment-button") != undefined);

                var receiptPaymentBlock = button.parents(".receipt-payment-block").eq(0),
                    cardId              = $(".select-payment-card", receiptPaymentBlock).eq(0).val(),
                    nonce               = button.data("make-payment-nonce"),
                    auctionId           = button.data("auction-id");

                var data = {
                    action    : "handbid_ajax_make_receipt_payment",
                    nonce     : nonce,
                    cardId    : cardId,
                    auctionId : auctionId
                };

                if (!isInventoryPayment) {
                    var receiptBlock   = button.parents(".receiptRow").eq(0),
                        paidControls   = $(".paidControls", receiptBlock).eq(0),
                        unpaidControls = $(".unpaidControls", receiptBlock).eq(0),
                        receiptId      = button.data("receipt-id");

                    data[receiptId] = receiptId;
                }
                button.addClass("active");

                $.post(
                    ajaxurl,
                    data,
                    function (data) {

                        console.log("---------------------------");
                        console.log("----Make payment success----");
                        data = JSON.parse(data);

                        if (data.result != undefined) {

                            if (data.result.data != undefined && data.result.data.error != undefined) {

                                var payment_error_messages = [];

                                for (var propertyName in data.result.data.error) {

                                    var value = data.result.data.error[propertyName];

                                    payment_error_messages.push('<b>' + propertyName + ':</b> ' + value);
                                }

                                handbid_main.notice(payment_error_messages.join('<br>'), "Payment Error", "error");
                            }
                            else {
                                if (data.result.paid) {

                                    if (!isInventoryPayment) {
                                        paidControls.slideDown();
                                        unpaidControls.remove();
                                        receiptBlock.addClass("open").removeClass("preview");
                                        var unpaidInvoicesCountContainer = $(".unpaidInvoicesCountContainer");
                                        var unpaidInvoices               = $(".receipts-list-area li.preview").length;
                                        (unpaidInvoices) ? unpaidInvoicesCountContainer.show() : unpaidInvoicesCountContainer.hide();
                                        unpaidInvoicesCountContainer.html(unpaidInvoices);
                                    }
                                    handbid_main.notice("Your receipt was successfully paid!", "Congratulations!", "success");

                                }
                                else {
                                    handbid_main.notice(data.result.description, "Payment Error", "error");
                                }
                            }
                        }
                        else {
                            handbid_main.notice('Something went wrong. Please try again later', "Payment Error", "error");
                        }

                        button.removeClass("active");
                        return false;
                    }
                );
            },

            recheckYourCardItems : function () {
                var purchases_amounts         = $('.handbid-list-of-bids-purchases li .purchaseTotalAmount'),
                    purchases_payment_amounts = $('.handbidInventorySinglePaymentAmount'),
                    purchases_info_block      = $('.handbid-list-of-purchase-totals'),
                    purchases_payments_block  = $('.handbid-list-of-purchase-totals .payments-list'),
                    purchases_premium_block   = $('.handbid-list-of-purchase-totals .auctionPremiumRow'),
                    purchases_item_tax_block  = $('.handbid-list-of-purchase-totals .itemsTaxRow'),
                    purchases_item_tax_place  = $('.handbid-list-of-purchase-totals .itemsTaxTotal'),
                    purchases_premium_place   = $('.handbid-list-of-purchase-totals .inventoryPremium'),
                    purchases_total_place     = $('.handbidInventoryTotalPurchases'),
                    purchases_due_place       = $('.handbidInventoryBalanceDue'),
                    purchases_card_block      = $('.handbid-list-of-purchase-totals .balanceDuePaymentCards'),
                    purchases_count           = purchases_amounts.length,
                    purchases_payments_count  = purchases_payment_amounts.length,
                    totalAmount               = 0,
                    premiumAmount             = 0,
                    itemTaxesAmount           = 0,
                    paidAmount                = 0,
                    dueAmount                 = 0;

                $.map(purchases_amounts, function (val) {
                    totalAmount += parseFloat($(val).html());
                    itemTaxesAmount += parseFloat($(val).attr('data-dashboard-tax'));
                });

                if (totalAmount) {
                    purchases_info_block.show();

                    purchases_total_place.html(handbid_main.number_format(totalAmount, 2, ".", ","));

                    $.map(purchases_payment_amounts, function (val) {
                        paidAmount += parseFloat($(val).html());
                    });

                    if (paidAmount) {
                        purchases_payments_block.show();
                    }
                    else {
                        purchases_payments_block.hide();
                    }

                    premiumAmount = totalAmount * parseFloat(purchases_premium_block.attr('data-auction-tax-rate'))
                    premiumAmount = Math.round(premiumAmount * 100) / 100

                    if (premiumAmount) {
                        purchases_premium_block.show();
                        purchases_premium_place.html(premiumAmount);
                    }
                    else {
                        purchases_premium_block.hide();
                    }

                    if (itemTaxesAmount) {
                        purchases_item_tax_block.show();
                        purchases_item_tax_place.html(itemTaxesAmount);
                    }
                    else {
                        purchases_item_tax_block.hide();
                    }

                    dueAmount = totalAmount + premiumAmount + itemTaxesAmount - paidAmount;

                    if (dueAmount < 0.01) {
                        dueAmount = 0;
                    }

                    dueAmount = handbid_main.number_format(dueAmount, 2, ".", ",");

                    purchases_due_place.html(dueAmount);

                    if (dueAmount > 0) {
                        purchases_card_block.show();
                    }
                    else {
                        purchases_card_block.hide();
                    }

                }
                else {
                    purchases_info_block.hide();
                }

            },

            initializePaymentButtons : function () {
                $('.make-payment-button').live('click', function (e) {

                    e.preventDefault();

                    handbid_main.makePaymentForReceipt($(this));

                });
            },

            submitBid : function (data) {
            },

            setupConnect               : function () {

                var body = $('body');

                if (body.hasClass('handbid-logged-out')) {

                    this.loggedIn = false;

                    var loginModal = $('[data-handbid-modal-key="login-modal"]');

                    $('[data-handbid-connect]').live('click', function (e) {
                        e.preventDefault();
                        var isRegisterButton = $(this).hasClass("register");
                        if (isRegisterButton) {
                            var ticketsSuppored = ($(this).data("tickets-enabled") == 'yes');
                            if(ticketsSuppored){
                                handbid_main.openLoginPopupForTicketsPurchasing(true);
                            }
                            else{
                                handbid_login_main.displaySpecifiedTabOfLoginPopup('register-form');
                            }
                            setTimeout(function(){
                                handbid_login_main.setFlagOfInitialScreen('register_buy_tickets');
                            }, 1000);
                        }
                        else{
                            setTimeout(function(){
                                handbid_login_main.setFlagOfInitialScreen('initial_login');
                            }, 1000);
                        }
                        loginModal.modal('show');
                    });

                    loginModal.on('hidden.bs.modal', function (e) {
                        handbid_login_main.restoreInitialTabState();
                    });

                }
                else {
                    this.loggedIn = true;
                    $('[data-handbid-connect]').css('display', 'none');

                }
            },
            setupTutorialPopup         : function () {

                var body = $('body');

                var loginModal = $('[data-handbid-modal-key="login-modal"]');

                $('[data-handbid-tutorial]').live('click', function (e) {
                    e.preventDefault();
                    if (handbid_login_main != undefined) {
                        handbid_login_main.changeToTutorialTabState();
                    }
                    loginModal.modal('show');
                });

            },
            setupBidderDashboard       : function () {
                $('.bidder-info-container .stats-bar').live('click.ajax-load', function () {

                    $.ajax({
                               url      : '/wp-admin/admin-ajax.php',
                               type     : 'POST',
                               data     : {
                                   action : 'load_bidder_dashboard'
                               },
                               dataType : 'html',
                               success  : function (response) {
                                   $(response).appendTo($('.bidder-dashboard-inner'));
                               }
                           });

                    $(this).off('.ajax-load');
                })
            },
            setupDeleteCreditCard      : function () {

                $("[data-handbid-delete-credit-card]").live('click', function (e) {

                    e.preventDefault();
                    var button = $(this);

                    var cardID = button.data("handbid-delete-credit-card");
                    var nonce  = $("#deleteCardNonce").val();

                    button.addClass("active");
                    var data = {
                        action : "handbid_ajax_remove_credit_card",
                        cardID : cardID,
                        nonce  : nonce
                    };

                    $.post(
                        ajaxurl,
                        data,
                        function (data) {

                            console.log("-----------------------------");
                            console.log("----Remove Credit Card Success----");

                            try {
                                data = JSON.parse(data);

                            }
                            catch (e) {
                            }

                            button.removeClass("active");

                            if (data.error == undefined) {

                                if (data.resp != undefined && data.resp.data != undefined && data.resp.data.message != undefined
                                    && data.resp.success != undefined && !data.resp.success) {
                                    handbid.notice(data.resp.data.message, "Card Error", "error");
                                }
                                else {
                                    $('[data-handbid-card-row="' + cardID + '"]').remove();
                                    handbid.notice('Your card has been deleted', "Card Success", "success");
                                    var footerCardsCountHolder = $("#footer-credit-cards-count");
                                    if (footerCardsCountHolder != undefined) {
                                        var creditCardFooterNumber = parseInt(footerCardsCountHolder.val()) + 1;
                                        footerCardsCountHolder.val(creditCardFooterNumber);
                                    }
                                    $(".select-payment-card option[data-option-val=" + cardID + "]").remove();
                                    if ($(".credit-card ul.simple-list li").length == 0) {
                                        var list = $(".credit-card ul.simple-list");
                                        list.after('<div class="row no-results-row"> <p style="text-align: left;">Note: Not all auctions use credit cards</p>  <label class="no-results"> You have no cards on file. </label> </div>');
                                        list.remove();
                                        $("[data-handbid-credit-cards-need]").attr("data-handbid-credit-cards-required", "");
                                        $(".select-payment-card").hide();
                                    }
                                }
                            }
                            else {
                                handbid.notice('Something wrong. Please, try again later', "Card Error", "error");
                            }

                        }
                    );

                    return false;
                });
            },
            setupAddCreditCardCallback : function (status, response) {

                adding_cc_state = false;
                var $form       = current_cc_form,
                    container   = $('.bidder-info-container.credit-card ul'),
                    modalClose  = $('[data-handbid-modal-key="credit-card-form"] .modal-close'),
                    statusPlace = $form.find('.credit-card-status').eq(0);

                var isAddingError          = false;
                var isAddingErrorMessage   = "";
                var isAddingSuccess        = false;
                var isAddingSuccessMessage = "";
                var simpleErrorMessage     = "Something wrong. Please, try again later";

                if (response.error != undefined) {
                    isAddingError = true;
                    if (response.error.message != undefined) {
                        isAddingErrorMessage = response.error.message;
                        handbid.notice(isAddingErrorMessage, "Card Error", "error");

                        handbid_login_main.requestToAddCCAfter(false);
                    }
                    else {
                        isAddingErrorMessage = simpleErrorMessage;
                        handbid.notice(simpleErrorMessage, "Card Error", "error");

                        handbid_login_main.requestToAddCCAfter(false);
                    }
                }
                else {
                    if (response.card == undefined) {
                        isAddingError        = true;
                        isAddingErrorMessage = simpleErrorMessage;
                        handbid.notice(simpleErrorMessage, "Card Error", "error");

                        handbid_login_main.requestToAddCCAfter(false);
                    }
                    else {

                        var dataPost          = {
                            action           : "handbid_ajax_add_credit_card",
                            stripeId         : response.id,
                            creditCardHandle : response.card.id,
                            nameOnCard       : $form.find('.ccNameOnCard').val(),
                            nonce            : $("#hb-credit-card-nonce").val()
                        };
                        var addingCardMessage = 'Card was created successfully.<br> Adding it to your profile';
                        handbid.notice(addingCardMessage);
                        isAddingSuccess        = true;
                        isAddingSuccessMessage = addingCardMessage;

                        $.post(
                            ajaxurl,
                            dataPost,
                            function (resp) {

                                try {
                                    resp = JSON.parse(resp);
                                }
                                catch (e) {
                                }
                                resp = resp.resp;

                                if (resp.success != undefined && !resp.success && resp.data != undefined && resp.data.error != undefined) {
                                    var messageParts     = $.map(resp.data.error, function (val, i) {
                                        return val.join("<br>");
                                    });
                                    isAddingErrorMessage = "<b>" + messageParts.join("<br>") + "</b>";
                                    statusPlace.removeClass("card-success").addClass("card-error");
                                    statusPlace.html(isAddingErrorMessage);
                                    handbid.notice(isAddingErrorMessage, "Card Error", "error");

                                    handbid_login_main.requestToAddCCAfter(false);
                                }
                                else {
                                    handbid.notice("Your card has been added successfully", "Card Success", "success");

                                    var footerCardsCountHolder = $("#footer-credit-cards-count");
                                    if (footerCardsCountHolder != undefined) {
                                        var creditCardFooterNumber = parseInt(footerCardsCountHolder.val()) + 1;
                                        footerCardsCountHolder.val(creditCardFooterNumber);
                                    }

                                    var template = $(' <li class="row" data-handbid-card-row="' + resp.id + '"> <div class="col-md-3 col-xs-3"> <h4>Name</h4>' + resp.nameOnCard + '</div> <div class="col-md-3 col-xs-3"> <h4>Card Number</h4> xxxx xxxx xxxx ' + resp.lastFour + '</div> <div class="col-md-3 col-xs-3"> <h4>Exp. Date</h4>' + resp.expMonth + '/' + resp.expYear + '</div> <div class="col-md-3 col-xs-3"> <a class="button pink-solid-button  loading-span-button" data-handbid-delete-credit-card="' + resp.id + '"><em>Delete</em></a></div></li>'),
                                        hasCards = $('.credit-card .no-results-row').length > 0;

                                    var cardSelects = $(".select-payment-card");
                                    cardSelects.show();
                                    $(".select-payment-card option").removeAttr('selected');
                                    cardSelects.append("<option data-option-val='" + resp.id + "' selected='selected' value='" + resp.id + "'>" + resp.nameOnCard + " (xxxx xxxx xxxx " + resp.lastFour + ")</option>");

                                    if (!hasCards) {
                                        template.appendTo(container);
                                    }
                                    else {
                                        $('.credit-card .no-results-row').remove();

                                        var list = null;

                                        if ($('.credit-card .simple-list').length > 0) {
                                            list = $('.credit-card .simple-list');
                                        }
                                        else {
                                            list = $('<ul class="simple-list"></ul>');
                                        }
                                        list.prependTo($('.credit-card'));
                                        template.appendTo(list);

                                    }

                                    var no_cards_class = 'no-cards-on-file';
                                    var cards_block    = $('.no-cards-if-no-cards');
                                    cards_block.removeClass(no_cards_class);

                                    $("[data-handbid-credit-cards-need]").removeAttr("data-handbid-credit-cards-required");
                                    $('[data-handbid-modal-key="credit-card-form"] .modal-close').click();
                                    statusPlace.removeClass("card-error").removeClass("card-success");
                                    statusPlace.html("");

                                    handbid_login_main.requestToAddCCAfter(true);
                                }
                            });

                    }
                }

                $form.find('.submit-cc-button').prop('disabled', false);
                $(".credit-card-form-modal").removeClass("processing");

                if (isAddingError) {
                    statusPlace.removeClass("card-success").addClass("card-error");
                    statusPlace.html(isAddingErrorMessage);
                }
                else {
                    if (isAddingSuccess) {
                        statusPlace.removeClass("card-error").addClass("card-success");
                        statusPlace.html(isAddingSuccessMessage);
                    }
                    else {
                        statusPlace.removeClass("card-error").removeClass("card-success");
                        statusPlace.html("");
                    }
                }

            },
            setupAddCreditCard         : function () {
                var form = $('.creditcard-template');

                form.live('submit', function (event) {
                    if (!adding_cc_state) {
                        adding_cc_state = true;
                        var $form       = $(this);
                        current_cc_form = $form;

                        $form.find('.submit-cc-button').prop('disabled', true);
                        $(".credit-card-form-modal").addClass("processing");

                        Stripe.card.createToken($form, handbid_main.setupAddCreditCardCallback);
                    }

                    return false;
                });

            },
            showCardErrorsIfExists     : function () {

                var ccErrorCookieKey = "handbid-cc-error",
                    ccErrorCookie    = $.cookie(ccErrorCookieKey);
                if (ccErrorCookie != undefined && ccErrorCookie != null && ccErrorCookie != "null" && ccErrorCookie.trim() != "") {
                    handbid_main.notice(ccErrorCookie, "Card Error", "error");
                    $.removeCookie(ccErrorCookieKey, {path : '/'});
                }
                var ccSuccessCookieKey = "handbid-cc-success",
                    ccSuccessCookie    = $.cookie(ccSuccessCookieKey);
                if (ccSuccessCookie != undefined && ccSuccessCookie != null && ccSuccessCookie != "null" && ccSuccessCookie.trim() != "") {
                    handbid_main.notice(ccSuccessCookie, "Card Success", "success");
                    $.removeCookie(ccSuccessCookieKey, {path : '/'});
                }

            },

            setupProvincesSelect     : function () {

                var countriesSelect      = $("#userAddressCountryId");
                var provincesSelect      = $("#userAddressProvinceId");
                var provincesSelectRow   = $(".provincesRow");
                var provincesByCountries = $("#provincesCountByCountry");

                countriesSelect.live("change", function (e) {
                    var countryID     = parseInt(countriesSelect.val());
                    var countryPrevID = parseInt(provincesByCountries.data("current-country"));
                    if (countryID != countryPrevID) {
                        var countryProvinces = provincesByCountries.data("provinces-" + countryID);
                        if (countryProvinces != undefined) {

                            var nonce = countriesSelect.data("provinces-nonce");

                            var data = {
                                action    : "handbid_ajax_get_countries_provinces",
                                nonce     : nonce,
                                countryID : countryID
                            };
                            $.post(
                                ajaxurl,
                                data,
                                function (data) {

                                    data = JSON.parse(data);

                                    provincesSelect.find('option')
                                                   .remove()
                                                   .end()
                                                   .val('');
                                    $.each(data, function (i, item) {
                                        provincesSelect.append($('<option>', {
                                            value : item.value,
                                            text  : item.text
                                        }));
                                        if (i == 0) {
                                            provincesSelect.val(item.value);
                                        }
                                    });
                                    provincesSelectRow.slideDown("fast");

                                }
                            );

                        }
                        else {
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
            setupEditProfile         : function () {
                var form = $('.edit-profile');

                form.on('submit', function (e) {

                    e.preventDefault();

                    var _data = $(this).serialize();

                    $.ajax({
                               url     : rest_endpoint + 'bidder/update',
                               method  : 'PUT',
                               data    : _data,
                               success : function (data) {
                                   handbid.notice('Your profile has been updated');

                                   return false;
                               }
                           });

                    return false;

                });

            },
            setupAuthorizationStatus : function () {

                var bidderDashboardPlace = $("#bidder-info-load"),
                    hasBidderDashboard   = (bidderDashboardPlace.is(":visible") &&
                                            (bidderDashboardPlace.html().trim() != "" || bidderDashboardPlace.hasClass("hidden-page-dashboard") ) );
                var authorized           = ($.cookie('handbid-auth') && hasBidderDashboard) ? true : false;

                if (authorized === true) {
                    $('body').addClass('handbid-logged-in');
                    $(".quick-links > li").clone().appendTo("#menu-mobile-menu");

                    $.ajaxSetup({
                                    headers : {
                                        'Authorization' : $.cookie('handbid-auth').split(": ")[1]
                                    }
                                });
                }
                else {
                    $('body').addClass('handbid-logged-out');
                }

            },
            oldNotice                : function (msg) {

                handbid.noticeContainer = $('<div class="handbid-growl-container"></div>');
                handbid.noticeContainer.appendTo('body');
                handbid.noticeTemplate = '<div class="handbid-growl"><div class="message">Notice Message</div></div>';

                if (msg.indexOf('&') > -1) {
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
            notice                   : function (msg, title, type, hide, formatting) {

                title = (title != undefined) ? title : 'Notice Message';
                hide  = (hide != undefined) ? hide : true;
                type  = (type != undefined) ? type : 'info';
                type  = (type == "failed") ? "error" : type;

                var isBiddingNotice = (formatting != undefined && formatting.isBidding != undefined && formatting.isBidding);
                if (isBiddingNotice) {
                    var itemLink  = (formatting.itemLink != undefined) ? formatting.itemLink : "#";
                    var itemImage = (formatting.itemImage != undefined && formatting.itemImage != "/images/default_photo-75px-white.png")
                        ? formatting.itemImage
                        : $("[data-default-item-image]").eq(0).val();
                    msg           = "<div class='col-xs-4 handbid-notice-image-container'>" +
                                    "<a href='" + itemLink + "'>" +
                                    "<img src='" + itemImage + "'>" +
                                    "</a>" +
                                    "</div>" +
                                    "<div class='col-xs-8 handbid-notice-text-container'>" +
                                    "<h5 class='notice-text-title'>" + title + "</h5>" + msg +
                                    "</div>";
                    title         = "";
                }
                var params = {
                    title       : title,
                    text        : msg,
                    type        : type,
                    hide        : hide,
                    mouse_reset : false,
                    delay       : 5000,
                    addclass    : 'handbid-message-notice',
                    buttons     : {
                        sticker : false
                    }
                };
                if (title == "Broadcast Message") {
                    params.icon = " glyphicon glyphicon-envelope ";
                    params.addclass += " handbid-broadcast-notice";
                }
                if (isBiddingNotice) {
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

            sendInvoice : function (invoice_id, send_to, is_text_message) {

                var notice_title      = 'Send Invoice?',
                    notice_message    = '',
                    completed_message = '';

                if (is_text_message) {
                    notice_message    = 'Text a link to this invoice to ' + send_to + '?';
                    completed_message = 'Your request to Text(SMS) invoice completed.';
                }
                else {
                    notice_message    = 'Send this invoice to ' + send_to + '?';
                    completed_message = 'Your request to Email invoice completed.';
                }

                if (invoice_id != "") {
                    attention_about_send_invoice = true;
                    var sendInvoiceNotice        = new PNotify({
                        title        : notice_title,
                        text         : notice_message,
                        icon         : 'glyphicon glyphicon-question-sign',
                        type         : 'info',
                        addclass     : 'handbid-message-notice',
                        hide         : false,
                        mouse_reset  : false,
                        confirm      : {
                            confirm : true,
                            buttons : [
                                {
                                    text     : 'Send',
                                    addClass : 'send-invoice-button',
                                    click    : function (notice) {
                                        notice.update({
                                                          title    : 'Processing send invoice to ' + send_to,
                                                          text     : '<div class="progress progress-striped active" style="margin:0">\
	                                            <div class="progress-bar" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%">\
		                                        <span class="sr-only">100%</span>\
	                                            </div>\
                                                </div>',
                                                          icon     : 'glyphicon glyphicon-refresh gly-spin',
                                                          addclass : "handbid-paddle-number-notice",
                                                          hide     : false,
                                                          confirm  : {
                                                              confirm : false
                                                          },
                                                          buttons  : {
                                                              closer  : false,
                                                              sticker : false
                                                          },
                                                          history  : {
                                                              history : false
                                                          }
                                                      });
                                        var data = {
                                            action     : "handbid_ajax_send_invoice",
                                            invoice_id : invoice_id,
                                            send_to    : send_to,
                                            send_type  : (is_text_message ? 'sms' : 'email')
                                        };
                                        $.post(
                                            ajaxurl,
                                            data,
                                            function (data) {

                                                console.log("-----------------------");
                                                console.log("----Sending Invoice success----");
                                                data = JSON.parse(data);

                                                var text  = "";
                                                var title = "";
                                                var type  = "";
                                                var icon  = "";

                                                if (data.errors == undefined) {
                                                    text  = completed_message;
                                                    title = 'Done';
                                                    type  = 'success';
                                                    icon  = 'glyphicon glyphicon-ok';

                                                }
                                                else {
                                                    text  = data.errors.join("<br>");
                                                    title = 'Failed';
                                                    type  = 'error';
                                                    icon  = 'glyphicon glyphicon-remove-sign';
                                                }

                                                attention_about_send_invoice = false;
                                                notice.update({
                                                                  title       : title,
                                                                  text        : text,
                                                                  icon        : icon,
                                                                  hide        : true,
                                                                  type        : type,
                                                                  delay       : 3000,
                                                                  mouse_reset : false,
                                                                  confirm     : {
                                                                      confirm : false
                                                                  },
                                                                  buttons     : {
                                                                      closer  : true,
                                                                      sticker : false
                                                                  },
                                                                  history     : {
                                                                      history : false
                                                                  }
                                                              });

                                                return false;
                                            }
                                        );
                                    }
                                }, {
                                    text     : 'Cancel',
                                    addClass : 'cancel-sending-button',
                                    click    : function (notice) {
                                        attention_about_send_invoice = false;
                                        notice.remove();
                                    }
                                }
                            ]
                        },
                        stack        : false,
                        before_open  : function (PNotify) {
                            handbid_main.fadeInModalOverlayAndPositionModal(PNotify);
                        },
                        before_close : function () {
                            handbid_main.fadeOutModalOverlay();
                        },
                        buttons      : {
                            closer  : false,
                            sticker : false
                        },
                        history      : {
                            history : false
                        }
                    });
                    bidNotice.get().on('pnotify.cancel', function () {
                        return false;
                    });
                }

            },

            // Pnotify to be in queue
            showWelcomeMessage : function (welcome_message) {

                if (welcome_message.trim() != '') {

                    attentionAboutWelcome = true;
                    var welcomeNotice     = new PNotify({
                        title        : 'WELCOME!',
                        text         : welcome_message,
                        icon         : 'glyphicon glyphicon-envelope small-envelope',
                        type         : 'info',
                        addclass     : 'handbid-message-notice',
                        hide         : false,
                        mouse_reset  : false,
                        stack        : false,
                        before_open  : function (PNotify) {
                            handbid_main.fadeInModalOverlayAndPositionModal(PNotify);
                        },
                        before_close : function () {
                            attentionAboutWelcome = false;
                            handbid_main.fadeOutModalOverlay();
                        },
                        buttons      : {
                            closer  : true,
                            sticker : false
                        },
                        history      : {
                            history : false
                        }
                    });
                    welcomeNotice.get().on('pnotify.cancel', function () {
                        return false;
                    });
                }
            },

            setPaddleNumberAndWelcomeMessage : function (welcomeForReceipt, paddleNumber) {

                var bidderDashboardPlace = $("#bidder-info-load");

                if (paddleNumber != undefined) {
                    $('#data-profile-current-paddle-number').html(paddleNumber);
                    bidderDashboardPlace.data("profile-paddle-number", current_paddle_number);
                }

                var auctionID             = parseInt(bidderDashboardPlace.data("auction")),
                    profileID             = parseInt(bidderDashboardPlace.data("profile-id")),
                    messageShownCookieKey = "bidder-" + profileID + "-has-welcome-message-" + auctionID,
                    messageShownCookie    = $.cookie(messageShownCookieKey),
                    messageWasNotShown    = (messageShownCookie != 'yes');

                if (messageWasNotShown && welcomeForReceipt != undefined && welcomeForReceipt != '') {
                    $.cookie(messageShownCookieKey, 'yes', {expires : cookie_expire, path : '/'});
                    handbid_main.showWelcomeMessage(welcomeForReceipt);
                }
            },

            // Pnotify to be in queue
            showAreYouHereMessage : function (are_you_here_message) {

                if (are_you_here_message) {

                    var bidderDashboardPlace  = $("#bidder-info-load"),
                        auctionID             = parseInt(bidderDashboardPlace.data("auction")),
                        profileID             = parseInt(bidderDashboardPlace.data("profile-id")),
                        messageShownCookieKey = "bidder-" + profileID + "-has-are-you-here-message-" + auctionID,
                        messageShownCookie    = $.cookie(messageShownCookieKey),
                        messageWasNotShown    = (messageShownCookie != 'yes');

                    if (messageWasNotShown && are_you_here_message != undefined && are_you_here_message != '') {

                        $.cookie(messageShownCookieKey, 'yes', {expires : cookie_expire, path : '/'});
                        attention_about_are_you_at_the_event = true;
                        var welcomeNotice                    = new PNotify({
                            title        : 'Are You Here?',
                            text         : are_you_here_message,
                            icon         : 'glyphicon glyphicon-question-sign',
                            type         : 'info',
                            addclass     : 'handbid-message-notice',
                            hide         : false,
                            mouse_reset  : false,
                            confirm      : {
                                confirm : true,
                                buttons : [
                                    {
                                        text     : 'Yes',
                                        addClass : 'bid-here-button',
                                        click    : function (notice) {
                                            notice.update({
                                                              title    : 'Sending your answer to auction manager',
                                                              text     : '<div class="progress progress-striped active" style="margin:0">\
	                                            <div class="progress-bar" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%">\
		                                        <span class="sr-only">100%</span>\
	                                            </div>\
                                                </div>',
                                                              icon     : 'glyphicon glyphicon-refresh gly-spin',
                                                              addclass : "handbid-paddle-number-notice",
                                                              hide     : false,
                                                              confirm  : {
                                                                  confirm : false
                                                              },
                                                              buttons  : {
                                                                  closer  : false,
                                                                  sticker : false
                                                              },
                                                              history  : {
                                                                  history : false
                                                              }
                                                          });
                                            var data = {
                                                action    : "handbid_ajax_i_am_here",
                                                auctionID : auctionID
                                            };
                                            $.post(
                                                ajaxurl,
                                                data,
                                                function (data) {

                                                    console.log("-----------------------");
                                                    console.log("----I Am Here Notification success----");
                                                    data = JSON.parse(data);

                                                    attention_about_are_you_at_the_event = false;
                                                    notice.update({
                                                                      title       : 'Done',
                                                                      text        : 'Thank you for this notification!',
                                                                      icon        : 'glyphicon glyphicon-ok',
                                                                      hide        : true,
                                                                      type        : 'success',
                                                                      delay       : 3000,
                                                                      mouse_reset : false,
                                                                      confirm     : {
                                                                          confirm : false
                                                                      },
                                                                      buttons     : {
                                                                          closer  : true,
                                                                          sticker : false
                                                                      },
                                                                      history     : {
                                                                          history : false
                                                                      }
                                                                  });

                                                    return false;
                                                }
                                            );
                                        }
                                    }, {
                                        text     : 'No',
                                        addClass : 'browse-here-button',
                                        click    : function (notice) {
                                            attention_about_are_you_at_the_event = false;
                                            notice.remove();
                                        }
                                    }
                                ]
                            },
                            stack        : false,
                            before_open  : function (PNotify) {
                                handbid_main.fadeInModalOverlayAndPositionModal(PNotify);
                            },
                            before_close : function () {
                                attention_about_are_you_at_the_event = false;
                                handbid_main.fadeOutModalOverlay();
                            },
                            buttons      : {
                                closer  : true,
                                sticker : false
                            },
                            history      : {
                                history : false
                            }
                        });
                        welcomeNotice.get().on('pnotify.cancel', function () {
                            return false;
                        });
                    }

                }
            },

            detectIfNeedToShowAreYouHereMessage : function () {

                var bidderDashboardPlace    = $("#bidder-info-load"),
                    auctionLocationQuestion = bidderDashboardPlace.data("auction-locatin-question"),
                    paddleNumber            = bidderDashboardPlace.data("profile-paddle-number"),
                    havePaddleNumber        = (paddleNumber != undefined && (paddleNumber + '').trim() != 'N/A');

                if (auctionLocationQuestion && havePaddleNumber) {

                    handbid_main.showAreYouHereMessage(auctionLocationQuestion);
                }
            },

            detectIfNeedToShowWelcomeMessage : function () {

                var bidderDashboardPlace  = $("#bidder-info-load"),
                    auctionWelcomeMessage = bidderDashboardPlace.data("auction-welcome-message"),
                    paddleNumber          = bidderDashboardPlace.data("profile-paddle-number"),
                    havePaddleNumber      = (paddleNumber != undefined && (paddleNumber + '').trim() != 'N/A');

                if (auctionWelcomeMessage && havePaddleNumber) {
                    handbid_main.setPaddleNumberAndWelcomeMessage(auctionWelcomeMessage);
                }
            },

            // Pnotify to be in queue
            detectIfUserWantToBid : function () {

                var bidderDashboardPlace    = $("#bidder-info-load"),
                    auctionID               = parseInt(bidderDashboardPlace.data("auction")),
                    auctionStatus           = bidderDashboardPlace.data("auction-status"),
                    profileID               = parseInt(bidderDashboardPlace.data("profile-id")),
                    paddleNumber            = bidderDashboardPlace.data("profile-paddle-number"),
                    nonce                   = bidderDashboardPlace.data("paddle-nonce"),
                    viewCookieKey           = "bidder-" + profileID + "-just-view-auction-" + auctionID,
                    viewCookie              = $.cookie(viewCookieKey),
                    bidCookieKey            = "bidder-" + profileID + "-bidding-in-auction-" + auctionID,
                    bidCookie               = $.cookie(bidCookieKey),
                    paddleNumberIsUndefined = (paddleNumber == "N/A" && bidCookie == undefined),
                    welcome_message         = '';

                if (paddleNumber != "N/A" && bidCookie == undefined) {
                    $.cookie(bidCookieKey, paddleNumber, {expires : cookie_expire, path : '/'});
                }

                if (auctionID && profileID && paddleNumberIsUndefined && viewCookie != "yes" && auctionStatus != "closed" && auctionStatus != "reconcile" && auctionStatus != "reconciled") {

                    attention_about_bidding = true;
                    var bidNotice           = new PNotify({
                        title        : 'Register to Bid?',
                        text         : 'Do you want to register to bid in this auction or just browse for now?',
                        icon         : 'glyphicon glyphicon-question-sign',
                        type         : 'info',
                        addclass     : 'handbid-message-notice',
                        hide         : false,
                        mouse_reset  : false,
                        confirm      : {
                            confirm : true,
                            buttons : [
                                {
                                    text     : 'Register',
                                    addClass : 'bid-here-button',
                                    click    : function (notice) {
                                        notice.update({
                                                          title    : 'Receiving the Paddle Number for this Auction',
                                                          text     : '<div class="progress progress-striped active" style="margin:0">\
	                                            <div class="progress-bar" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%">\
		                                        <span class="sr-only">100%</span>\
	                                            </div>\
                                                </div>',
                                                          icon     : 'glyphicon glyphicon-refresh gly-spin',
                                                          addclass : "handbid-paddle-number-notice",
                                                          hide     : false,
                                                          confirm  : {
                                                              confirm : false
                                                          },
                                                          buttons  : {
                                                              closer  : false,
                                                              sticker : false
                                                          },
                                                          history  : {
                                                              history : false
                                                          }
                                                      });
                                        var data = {
                                            action    : "handbid_ajax_get_paddle_number",
                                            auctionID : auctionID,
                                            nonce     : nonce
                                        };
                                        $.post(
                                            ajaxurl,
                                            data,
                                            function (data) {

                                                console.log("-----------------------");
                                                console.log("----Receive Paddle Number success----");
                                                data = JSON.parse(data);

                                                var text  = "";
                                                var title = "";
                                                var type  = "";
                                                var icon  = "";

                                                if (data.paddleId != undefined) {
                                                    $("[data-paddle-for-auction-" + auctionID + "]").html(data.paddleId);
                                                    current_paddle_number = data.paddleId;
                                                    $.cookie(bidCookieKey, current_paddle_number, {
                                                        expires : cookie_expire,
                                                        path    : '/'
                                                    });
                                                    text  = 'Your paddle number for this auction is <b>' + data.paddleId + '</b>';
                                                    title = 'Done';
                                                    type  = 'success';
                                                    icon  = 'glyphicon glyphicon-ok';

                                                    // Remove the Cookie
                                                    $.removeCookie(viewCookieKey);

                                                    if (data.welcomeForReceipt != undefined) {
                                                        welcome_message = data.welcomeForReceipt;

                                                    }

                                                }
                                                else {
                                                    text  = data.errors.join("<br>");
                                                    title = 'Failed';
                                                    type  = 'error';
                                                    icon  = 'glyphicon glyphicon-remove-sign';
                                                }

                                                attention_about_bidding = false;
                                                notice.update({
                                                                  title       : title,
                                                                  text        : text,
                                                                  icon        : icon,
                                                                  hide        : true,
                                                                  type        : type,
                                                                  delay       : 3000,
                                                                  mouse_reset : false,
                                                                  confirm     : {
                                                                      confirm : false
                                                                  },
                                                                  buttons     : {
                                                                      closer  : true,
                                                                      sticker : false
                                                                  },
                                                                  history     : {
                                                                      history : false
                                                                  }
                                                              });

                                                handbid.addProfileActiveAuctions();

                                                return false;
                                            }
                                        );
                                    }
                                }, {
                                    text     : 'Browse',
                                    addClass : 'browse-here-button',
                                    click    : function (notice) {
                                        attention_about_bidding = false;
                                        $.cookie(viewCookieKey, "yes", {expires : cookie_expire, path : '/'});
                                        notice.remove();
                                    }
                                }
                            ]
                        },
                        stack        : false,
                        before_open  : function (PNotify) {
                            handbid_main.fadeInModalOverlayAndPositionModal(PNotify);
                        },
                        before_close : function () {
                            handbid_main.showWelcomeMessage(welcome_message);
                            if (welcome_message.trim() == "") {
                                handbid_main.fadeOutModalOverlay();
                            }

                        },
                        buttons      : {
                            closer  : false,
                            sticker : false
                        },
                        history      : {
                            history : false
                        }
                    });
                    bidNotice.get().on('pnotify.cancel', function () {
                        return false;
                    });
                }
            },

            // Pnotify to be in queue
            detectIfUserWantToBuyTickets : function () {

                var bidderDashboardPlace = $("#bidder-info-load"),
                    haveTickets          = $("[data-handbid-tickets]").length,
                    auctionID            = parseInt(bidderDashboardPlace.data("auction")),
                    auctionStatus        = bidderDashboardPlace.data("auction-status"),
                    profileID            = parseInt(bidderDashboardPlace.data("profile-id")),
                    purchaseRows         = $("[data-purchased-purchase-id]");

                var viewCookie = $.cookie("bidder-" + profileID + "-want-no-tickets-" + auctionID);

                var alreadyHasTickets = handbid_main.detectIfUserAlreadyHasTicketsInPurchases(purchaseRows);

                if (auctionID && profileID && haveTickets && viewCookie != "yes"
                    && auctionStatus != "closed" && auctionStatus != "reconcile" && auctionStatus != "reconciled"
                    && !alreadyHasTickets) {
                    attention_about_tickets = true;
                    var bidNotice           = new PNotify({
                        title        : 'Auction Tickets',
                        text         : 'Current Auction has tickets. Do you want to purchase one of them?',
                        icon         : 'glyphicon glyphicon-question-sign',
                        type         : 'info',
                        addclass     : 'handbid-message-notice',
                        hide         : false,
                        mouse_reset  : false,
                        confirm      : {
                            confirm : true,
                            buttons : [
                                {
                                    text     : 'Yes',
                                    addClass : 'bid-here-button',
                                    click    : function (notice) {
                                        attention_about_tickets = false;
                                        notice.remove();
                                        $("[data-handbid-tickets]").eq(0).click();
                                    }
                                }, {
                                    text     : 'No, thanks',
                                    addClass : 'browse-here-button',
                                    click    : function (notice) {
                                        attention_about_tickets = false;
                                        $.cookie("bidder-" + profileID + "-want-no-tickets-" + auctionID, "yes", {
                                            expires : cookie_expire,
                                            path    : '/'
                                        });
                                        notice.remove();
                                    }
                                }
                            ]
                        },
                        stack        : false,
                        before_open  : function (PNotify) {
                            handbid_main.fadeInModalOverlayAndPositionModal(PNotify);
                        },
                        before_close : function () {
                            handbid_main.fadeOutModalOverlay();
                        },
                        buttons      : {
                            closer  : false,
                            sticker : false
                        },
                        history      : {
                            history : false
                        }
                    });
                    bidNotice.get().on('pnotify.cancel', function () {
                        return false;
                    });
                }

            },

            displayRequiredCardsMessage : function (msg) {

                // Woody added this to prevent the message showing when pages load in the wrong order
                var cards_exist            = $("div.credit-card ul").children("li.row");
                var creditCardFooterNumber = parseInt($("#footer-credit-cards-count").val());
                if (cards_exist.length || creditCardFooterNumber) {
                    return true;
                }
                msg = (msg != undefined) ? msg : "You must supply a credit card to bid in this auction.";

                new PNotify({
                    title       : 'Credit cards required',
                    type        : 'error',
                    text        : '<b>' + msg + '</b>',
                    icon        : 'glyphicon glyphicon-exclamation-sign',
                    addclass    : 'handbid-message-notice',
                    hide        : false,
                    mouse_reset : false,
                    confirm     : {
                        confirm : true,
                        buttons : [
                            {
                                text     : 'Add a card',
                                addClass : 'add-credit-card-button',
                                click    : function (notice) {
                                    handbid_modals_main.showSingleModal('credit-card-form');
                                    notice.remove();

                                }
                            }
                        ]
                    },
                    buttons     : {
                        closer  : false,
                        sticker : false
                    },
                    history     : {
                        history : false
                    }
                });
            },

            lazyShowMoreMessages : function (button) {
                var currentChunk           = parseInt(button.data("current-chunk")) + 1,
                    chunksCount            = parseInt(button.data("chunks-count")),
                    messagesOfCurrentChunk = $(".messages-part-" + currentChunk);
                messagesOfCurrentChunk.slideDown("normal");
                $(".load-less-messages").show();
                button.data("current-chunk", currentChunk);
                if (currentChunk >= chunksCount) {
                    button.hide();
                }

            },

            lazyShowLessMessages : function (button) {
                var allMessages            = $(".message-row"),
                    messagesOfCurrentChunk = $(".messages-part-0");
                allMessages.hide();
                messagesOfCurrentChunk.slideDown("normal");
                var showButton = $(".load-more-messages");
                showButton.data("current-chunk", 0);
                showButton.show();
                button.hide();

            },

            setCircleTimer : function (time) {

                timer_time = time;

                var timeMs          = time * 1000;
                var startColor      = '#6FD57F';
                var endColor        = '#FC5B3F';
                timer_elements      = $("[data-handbid-timer]");
                timer_elements_full = $(".auction-timer-place .numbers-place");

                var element       = document.getElementById('handbid-circle-timer-' + time);
                element.innerHTML = "";
                circle_timer      = new ProgressBar.Circle(element, {
                    color       : startColor,
                    trailColor  : '#fff',
                    trailWidth  : 10,
                    duration    : timeMs,
                    strokeWidth : 15,
                    step        : function (state, circle) {
                        circle.path.setAttribute('stroke', state.color);
                    }
                });

                handbid_main.startTimerNew();

                setTimeout(function () {
                    handbid_main.refreshTimerToAvoidMistakes();
                }, refresh_timer_interval)

                circle_timer.animate(1.0, {
                    from : {color : startColor},
                    to   : {color : endColor}
                });

            },

            startTimerNew : function () {

                timer_time--;
                if (timer_time > 0) {
                    var timerTimeStr = (timer_time + '').toHHMMSS();

                    $.map(timer_elements, function (timer) {
                        $(timer).html(timerTimeStr.simple);
                    });

                    $.map(timer_elements_full, function (timer) {
                        $(timer).html(timerTimeStr.full);
                    });

                    setTimeout(function () {
                        handbid_main.startTimerNew();
                    }, 1000)
                }
                else {
                    handbid_main.changeAuctionTimer(0, false);
                }
            },

            refreshTimerToAvoidMistakes : function () {

                if (timer_time > 0) {
                    $.post(ajaxurl, {
                               action       : "handbid_ajax_auction_info",
                               auction_guid : $('#bidder-info-load').attr("data-auction-guid")
                           },
                           function (resp) {
                               resp = parseInt(resp);
                               if (resp) {
                                   timer_time = resp;
                               }
                           });

                    setTimeout(function () {
                        handbid_main.refreshTimerToAvoidMistakes();
                    }, refresh_timer_interval)
                }
            },

            setTimerRemaining : function (handbid) {
                var timerRemaining = $("#timerRemaining");
                if (timerRemaining.val() != undefined) {
                    var timerTime = parseInt(timerRemaining.val());
                    if (timerTime) {
                        handbid.changeAuctionTimer(timerTime, true);
                    }
                }

            },

            formatTimerTime : function (time) {
                var timeH = Math.floor(time / 3600),
                    timeM = Math.floor((time - timeH * 3600) / 60),
                    timeS = time - timeH * 3600 - timeM * 60;
                if (timeS < 10) timeS = "0" + timeS;
                if (timeM < 10) timeM = "0" + timeM;
                if (timeH < 10) timeH = "0" + timeH;
                if (timeH == "000") timeH = "00";
                if (timeM == "000") timeM = "00";
                return timeH + ":" + timeM + ":" + timeS;
            },

            showTimerRemainingNotice : function (timerTime, timerTitle) {
                timerTitle        = (timerTitle != undefined) ? " <b>" + timerTitle + "</b>" : "";
                var timeFormatted = this.formatTimerTime(timerTime);
                (timer_notice != undefined) ? timer_notice.remove() : '';
                timer_notice = undefined;
                timer_notice = handbid.notice("Auction " + timerTitle + "<br>closes after <b><div data-handbid-timer>" + timeFormatted + "</div></b>", "Closing Auction Timer");
                this.changeAuctionTimer(timerTime, true);
            },

            changeAuctionTimer : function (time, timerIsRunning) {
                var timeFormatted       = this.formatTimerTime(time);
                var timerLayoutPattern  = '<div class="auction-timer-place">' +
                                          '<div class="circle-place col-xs-3"><div class="handbid-circle-timer" id="handbid-circle-timer-' + time + '"></div></div>' +
                                          '<div class="numbers-place col-xs-9" id="handbid-numbers-timer-' + time + '">' +
                                          '<div class="col-xs-4 number-cont"><em class="timer-hours-number">00</em><span>hours</span></div>' +
                                          '<div class="col-xs-4 number-cont"><em class="timer-mins-number">00</em><span>mins</span></div>' +
                                          '<div class="col-xs-4 number-cont secs-number-cont"><em class="timer-secs-number">00</em><span>secs</span></div>' +
                                          '</div>' +
                                          '</div>';
                var toggleButtonPattern = '<span class="btn btn-small btn-default toggle-timer-notice">' +
                                          '<em class="glyphicon glyphicon-chevron-down"></em>' +
                                          '<em class="glyphicon glyphicon-chevron-up"></em>' +
                                          '</span>';
                var titleTimerPattern   = '<h3 class="notice-connection-title">' +
                                          '<b>Auction Closes After' +
                                          '&nbsp;&nbsp;&nbsp;&nbsp;<span data-handbid-timer>' + timeFormatted + '</span>' +
                                          '</b></h3>' + toggleButtonPattern;
                if (timer_message != undefined && timer_message.animating == "out") {
                    timer_message = undefined;
                }
                if (timerIsRunning) {
                    if (timer_message == undefined) {
                        timer_message = new PNotify({
                            title       : titleTimerPattern,
                            type        : 'error',
                            text        : timerLayoutPattern,
                            icon        : '',
                            addclass    : 'handbid-message-notice handbid-timer-top-notice  stack-bar-top',
                            cornerclass : "",
                            width       : "100%",
                            stack       : stack_bar_top,
                            hide        : false,
                            mouse_reset : false,
                            buttons     : {
                                closer  : false,
                                sticker : false
                            },
                            history     : {
                                history : false
                            }
                        });
                        this.setCircleTimer(time);
                    }
                    else {
                        timer_message.update({
                                                 title : titleTimerPattern,
                                                 text  : timerLayoutPattern
                                             });
                        this.setCircleTimer(time);
                    }
                }
                else {
                    if (timer_message != undefined) {
                        timer_message.update({
                                                 title        : '<h3 class="notice-connection-title">' +
                                                                '<b>Auction Closed</b></h3>',
                                                 text         : '',
                                                 hide         : true,
                                                 delay        : 5000,
                                                 before_close : function () {
                                                     handbid_main.loadAllToContainers();
                                                 }
                                             });
                    }
                }
            },

            showExpiredNotice : function () {

                var bidNotice = new PNotify({
                    title        : 'Session Expired',
                    text         : 'Your user session has expired. Please, relogin.',
                    icon         : 'glyphicon glyphicon-off',
                    type         : 'info',
                    addclass     : 'handbid-message-notice',
                    hide         : false,
                    mouse_reset  : false,
                    delay        : 3000,
                    confirm      : false,
                    stack        : false,
                    before_open  : function (PNotify) {
                        PNotify.get().css({
                                              "top"  : ($(window).height() / 2) - (PNotify.get().height() / 2) - 80,
                                              "left" : ($(window).width() / 2) - (PNotify.get().width() / 2)
                                          });
                        if (reload_overlay) reload_overlay.fadeIn("fast");
                        else reload_overlay = $("<div />", {
                            "class" : "ui-widget-overlay",
                            "css"   : {
                                "display"    : "none",
                                "position"   : "fixed",
                                "background" : "rgba(0, 0, 0, 0.7)",
                                "top"        : "0",
                                "bottom"     : "0",
                                "right"      : "0",
                                "left"       : "0",
                                "z-index"    : "9999"
                            }
                        }).appendTo("body").fadeIn("fast");
                    },
                    before_close : function () {
                        reload_overlay.fadeOut("fast");
                        location.reload();
                    },
                    buttons      : {
                        closer  : true,
                        sticker : false
                    },
                    history      : {
                        history : false
                    }
                });
                bidNotice.get().on('pnotify.cancel', function () {
                    return false;
                });

            },

            reloadBidderProfile : function () {
                var bidderInfo    = jQuery("#bidder-info-load"),
                    bidderAuction = parseInt(bidderInfo.data("auction"));

                if (bidderInfo.html() != undefined && bidderInfo.html().trim() != "") {
                    if (bidderAuction) {
                        $.post(ajaxurl, {
                                   action  : "handbid_profile_load",
                                   auction : bidderInfo.data("auction"),
                                   nonce   : bidderInfo.data("load")
                               },
                               function (resp) {
                                   if (bidderInfo.html().trim() != "" && resp.trim() == "") {
                                       //  handbid.showExpiredNotice();
                                   }
                                   else {
                                       bidderInfo.html(resp);

                                       var auctionID = bidderInfo.data("auction");
                                       if (current_paddle_number != undefined && auctionID.trim() != "") {
                                           bidderInfo.data("profile-paddle-number", current_paddle_number);
                                           $("[data-paddle-for-auction-" + auctionID + "]").html(current_paddle_number);
                                       }
                                       bidderInfo.slideDown("normal");
                                       // ($('input[name="action"]').val() == 'handbid_ajax_add_credit_card') ? handbid.setupAddCreditCard() : '';

                                       handbid.setupAddCreditCard();

                                       handbid.setupProvincesSelect();

                                       handbid.loadAllToContainers();
                                   }

                               });

                    }
                    else {
                        // ($('input[name="action"]').val() == 'handbid_ajax_add_credit_card') ? handbid.setupAddCreditCard() : '';

                        handbid.setupAddCreditCard();

                        handbid.setupProvincesSelect();
                        handbid.loadAllToContainers();
                    }
                }
                handbid.applyBidConfirmationChecking();
                ($('.creditcard-template').length > 0) ? handbid.setupAddCreditCard() : '';

            },

            applyBidConfirmationChecking : function (data) {
                $("#bidConfirmationsEnabled").live("change", function (e) {
                    var confirmBids     = $(this).val();
                    var currentBidderID = parseInt($("[data-dashboard-profile-id]").eq(0).data("dashboard-profile-id"));
                    var cookieName      = currentBidderID + "_bid_confirmations";
                    $.cookie(cookieName, confirmBids, {expires : cookie_expire, path : '/'});
                });
            },

            checkIfWantToShowBidConfirmation : function () {
                var currentBidderID = parseInt($("[data-dashboard-profile-id]").eq(0).data("dashboard-profile-id"));
                var cookieName      = currentBidderID + "_bid_confirmations";
                var cookie          = $.cookie(cookieName);
                var needToConfirm   = (cookie == undefined || cookie == "yes");
                needToConfirm       = (currentBidderID != 0 && currentBidderID != undefined) ? needToConfirm : false;
                return needToConfirm;
            },

            redirectFromResetedAuctions : function (data) {

                var bidderDashboardPlace  = $("#bidder-info-load"),
                    auctionID             = parseInt(bidderDashboardPlace.data("auction")),
                    profileID             = parseInt(bidderDashboardPlace.data("profile-id")),
                    messageShownCookieKey = "bidder-" + profileID + "-has-welcome-message-" + auctionID,
                    isHereShownCookieKey  = "bidder-" + profileID + "-has-are-you-here-message-" + auctionID;

                $.cookie(messageShownCookieKey, 'no', {expires : cookie_expire, path : '/'});
                $.cookie(isHereShownCookieKey, 'no', {expires : cookie_expire, path : '/'});

                window.location = "/auctions/?auction-reset"
            },

            redirectFromResetedAuctionsCheck : function () {
                if ($("[data-auction-reset-sign]").length > 0) {
                    this.notice("<b>This auction has been reset, please select another one</b>", "Auction Reset", "info");
                }
            },

            detectIfNeedToContinuePayment : function () {
                if ($("[data-auction-continue-payment-sign]").length > 0) {
                    setTimeout(function () {
                        var receipt_id = parseInt($("[data-auction-continue-payment-sign]").eq(0).val());
                        handbid_main.proposeToContinuePayInvoice(receipt_id);
                    }, 3000);
                }
            },

            checkSocketConnection : function (handbid) {
                socket_retry += socket_retry;
                if (!connectedToSocket && socket_retry <= socket_retry_limit) {
                    if (connect_message == undefined) {
                        connect_message = new PNotify({
                            title       : '<h3 class="notice-connection-title"><b>Unable to connect for real-time updates</b>' +
                                          '<span class="notice-connection-switch">?</span>' +
                                          '</h3>',
                            type        : 'error',
                            text        : '<div class="notice-connection-tip">Handbid uses a live connection to the server to update auction items, ' +
                                          'bids and stats. When it can\'t connect to this live connection, this message will appear. ' +
                                          'You can still bid on items, but you may need to refresh your browser page to see if any prices have changed. ' +
                                          'Please click on the chat/help tab below to let us know this message exists. ' +
                                          'It is likely that your Internet service provider is blocking our connection, ' +
                                          'but we will look into it! Happy Bidding!</div>',
                            icon        : '',
                            addclass    : 'handbid-message-notice handbid-no-connection-notice notice-collapsed stack-bar-top',
                            cornerclass : "",
                            width       : "100%",
                            stack       : stack_bar_top,
                            hide        : false,
                            mouse_reset : false,
                            buttons     : {
                                closer  : false,
                                sticker : false
                            },
                            history     : {
                                history : false
                            }
                        });
                    }
                }
                else {
                    if (connect_message != undefined) {
                        connect_message.remove();
                        connect_message = undefined;
                    }
                }
                setTimeout(function () {
                    handbid.checkSocketConnection(handbid, socket_retry)
                }, 3000);
            },

            changeBackgroundImageIfElementIsVisible : function () {
                $('[data-backgroung-image-url].without-image').each(function () {
                    var visible = $(this).visible("complete");
                    if (visible) {
                        var backGround = $(this).data("backgroung-image-url");
                        if (backGround.trim != "") {
                            $(this).attr("style", "background-image: url('" + backGround + "');");
                        }
                        $(this).removeClass("without-image");
                    }
                });
            },

            updateUserProfile : function (button) {

                var form_inputs         = $('.edit-profile input, .edit-profile select'),
                    password_input      = $('[data-profile-form-password]').eq(0),
                    password_conf_input = $('[data-profile-form-password-confirm]').eq(0);

                var data = {};
                $('[data-profile-form-field]').each(function () {
                    var elem     = $(this),
                        nameAttr = elem.attr('name'),
                        idAttr   = elem.attr('id'),
                        oldElem  = $('#' + idAttr + 'Old'),
                        newValue = elem.val(),
                        oldValue = oldElem.val();

                    if (newValue != oldValue) {
                        data[nameAttr] = newValue;
                    }
                });

                if (password_input.val().trim() != '') {
                    if ((password_input.val().trim() != password_conf_input.val().trim())) {
                        password_input.addClass('required-error');
                        password_conf_input.addClass('required-error');
                    }
                    else {
                        password_input.removeClass('required-error');
                        password_conf_input.removeClass('required-error');
                        data['password'] = password_input.val().trim();
                    }
                }
                else {
                    password_input.removeClass('required-error');
                    password_conf_input.removeClass('required-error');
                }

                if (!$.isEmptyObject(data)) {
                    button.addClass('active');
                    form_inputs.attr('disabled', 'disabled');

                    data['action'] = "handbid_ajax_update_profile";

                    $.post(
                        ajaxurl,
                        data,
                        function (resp) {

                            console.log("----Profile Updating success----");
                            resp = JSON.parse(resp);

                            if (resp.id != undefined) {
                                var profile_name = resp.firstName.substring(0, 1).toUpperCase()
                                                   + '. '
                                                   + resp.lastName.substring(0, 1).toUpperCase()
                                                   + resp.lastName.substring(1);
                                $('.profile-user-info span').html(profile_name);

                                $.map(data, function (val, key) {
                                    var elem    = $('[data-profile-form-field][name="' + key + '"]'),
                                        idAttr  = elem.attr('id'),
                                        oldElem = $('#' + idAttr + 'Old');
                                    oldElem.val(val);
                                });

                                handbid_main.notice('Your Profile was successfully updated', 'Profile Updated', "success");

                                if (address_to_pay_receipt) {
                                    $('[data-slider-nav-key="see-my-receipt"]').click();
                                    handbid_main.loadInvoicesToContainer(null, address_to_pay_receipt);
                                }
                                address_to_pay_receipt = null;

                                var shippingAddress = $('#profileShippingAddress').val();
                                $('#hb-required-profile-address').val(shippingAddress);
                                $('#profile-shipping-address').val(shippingAddress);
                            }
                            else {
                                handbid_main.notice('Your Profile was not updated. Please try later', 'Profile Error', "error");
                                address_to_pay_receipt = null;
                            }

                            button.removeClass('active');
                            form_inputs.removeAttr('disabled');

                        }
                    );
                }
            },

            openLoginPopupForTicketsPurchasing : function (published) {

                handbid_login_main.displaySpecifiedTabOfLoginPopup('purchase-tickets');
                var paddle = $('[data-profile-current-paddle-number]').html();
                $('.reg-paddle-number').html(paddle);
                $('.handbid-login-modal').modal('show');

                $('.handbid-login-modal .tickets-container.purchase-container').addClass('loading');

                var guid = $('[data-handbid-auction-guid]').attr("data-handbid-auction-guid");

                $.post(ajaxurl,
                       {
                           action      : "handbid_ajax_get_auction_ticketing",
                           auctionGuid : guid,
                           published   : published
                       },
                       function (data) {

                           data = JSON.parse(data);

                           if(!published) {
                               handbid_login_main.addCreditCardsToPayForTickets(
                                   handbid_login_main.getBidderCreditCards(data.data)
                               );
                           }

                           var ticketsToAdd     = handbid_login_main.getAuctionTickets(data.data),
                               auctionPremium   = handbid_login_main.getAuctionPremiumCoefficient(data.data);

                           handbid_login_main.goToResultWindowDependsOnTickets(ticketsToAdd, auctionPremium, true);

                           handbid_login_main.getTicketsForAuction();
                       }
                );

            },

            setupTicketsPurchasingViaLoginPopup : function () {

                $('[data-handbid-tickets="open-button"]').click(function () {
                    handbid_login_main.setFlagOfInitialScreen('just_buy_tickets');
                    handbid_main.openLoginPopupForTicketsPurchasing();

                });

            }
        };

    $(document).ready(function () {

        handbid_main = handbid;

        rest_endpoint = $("#apiEndpointsAddress").val();
        handbid.setupAuthorizationStatus();
        handbid.initializePaymentButtons();
        handbid.detectIfUserWantToBuyTickets();
        handbid.detectIfUserWantToBid();
        handbid.redirectFromResetedAuctionsCheck();
        handbid.detectIfNeedToContinuePayment();
        handbid.changeBackgroundImageIfElementIsVisible();
        setTimeout(function () {
            handbid.detectIfNeedToShowAreYouHereMessage()
        }, 1000);
        setTimeout(function () {
            handbid.detectIfNeedToShowWelcomeMessage()
        }, 2000);
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

        //if(this.loggedIn) {
        ($('.bidder-info-container').length > 0) ? handbid.setupBidderDashboard() : '';
        handbid.setupDeleteCreditCard();
        //handbid.setupAddCreditCard();
        //($('.edit-profile').length > 0) ? handbid.setupEditProfile() : '';
        //}
        //else {
        ($('[data-handbid-connect]').length > 0) ? handbid.setupConnect() : '';
        //}
        handbid.setupTutorialPopup();

        ($('[data-handbid-bid]').length > 0 || $('.handbid-list-of-bids-proxy').length > 0 ) ? handbid.setupBidding(handbid) : '';

        handbid.setTimerRemaining(handbid);

        var loadProfileWithAjax = false;

        if (loadProfileWithAjax) {
            handbid.reloadBidderProfile();
        }
        else {
            handbid.setupAddCreditCard();
            handbid.setupProvincesSelect();
            handbid.loadAllToContainers();
        }

        handbid.showCardErrorsIfExists();

        handbid.setupTicketsPurchasingViaLoginPopup();

        $(".handbid-logout a, a.handbid-logout-link").live("click", function (e) {
            e.preventDefault();
            var path         = $(this).attr("href");
            var logoutNotice = new PNotify({
                title       : 'Logout Confirmation',
                text        : 'Are you sure want to logout?',
                icon        : 'glyphicon glyphicon-question-sign',
                type        : "info",
                addclass    : 'handbid-message-notice',
                hide        : false,
                mouse_reset : false,
                confirm     : {
                    confirm : true
                },
                buttons     : {
                    closer  : false,
                    sticker : false
                },
                history     : {
                    history : false
                }
            });
            logoutNotice.get().on('pnotify.confirm', function () {
                $.removeCookie("handbid-auth", {path : '/'});
                window.location = path;
            }).on('pnotify.cancel', function () {
                return false;
            });
        });

        $(".notice-connection-switch").live("click", function (e) {
            e.preventDefault();
            $(".notice-connection-tip").slideToggle("normal");
            $(".handbid-no-connection-notice").toggleClass("notice-collapsed");
        });

        $(".toggle-timer-notice").live("click", function (e) {
            e.preventDefault();
            $(".handbid-timer-top-notice").toggleClass("notice-collapsed");
        });

        $("[data-toggle-invoice-link]").live("click", function (e) {
            e.preventDefault();
            var invoiceID = $(this).data("toggle-invoice-link");
            $(this).toggleClass("opened-invoice");
            $("[data-receipt-block-id=" + invoiceID + "] .invoice-details-container").slideToggle("normal");
        });

        $("[data-toggle-invoice-more-link]").live("click", function (e) {
            e.preventDefault();
            var invoiceID = $(this).data("toggle-invoice-more-link");
            $(this).toggleClass("opened-invoice");
            $("[data-receipt-block-id=" + invoiceID + "] .invoice-more-details-container").slideToggle("normal");
        });

        $(".load-more-messages").live("click", function (e) {
            e.preventDefault();
            var button = $(this);
            handbid.lazyShowMoreMessages(button);
        });

        $(".load-less-messages").live("click", function (e) {
            e.preventDefault();
            var button = $(this);
            handbid.lazyShowLessMessages(button);
        });
        $(".global-footer").prepend("<span class='toggle-info'>Show Footer Info</span>");
        $(".global-footer span.toggle-info").live("click", function (e) {
            e.preventDefault();
            $(".global-footer").toggleClass("show-all");
        });

        $('[data-slider-nav-id="auction-details"]').live("click", function (e) {
            handbid.clickOnFiltersToReorder();
        });

        $('.map-holder-item').live("click", function (e) {
            if (!mapsAreActivated) {
                auctionGoogleMapsInit();
            }
        });

        $('#updateUserProfile').live("click", function (e) {
            e.preventDefault();
            handbid_main.updateUserProfile($(this));
        });

    });

})(jQuery);
