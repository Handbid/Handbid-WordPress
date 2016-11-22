/**
 * @copyright Copyright (c) 2014-2015 Handbid Inc.
 * @category handbid
 * @package Handbid2-WordPress
 * @license Proprietary
 * @link http://www.handbid.com/
 * @author Master of Code (worldclass@masterofcode.com)
 */
var handbid_login_main, cookieExpire = 7;
(function ($) {

    var auction_tickets = [], auction_premium = 0, discounts = [], tickets = null, bidderId = null;
    var is_from_initial_login = false, is_from_register_buy_tickets = false, is_from_just_buy_tickets = false;

    var handbid_login = {

        setFlagOfInitialScreen : function (flag) {
            is_from_initial_login = (flag == 'initial_login');
            is_from_register_buy_tickets = (flag == 'register_buy_tickets');
            is_from_just_buy_tickets = (flag == 'just_buy_tickets');

            is_from_just_buy_tickets ? $('#hb-purchase-tickets-back').hide(): $('#hb-purchase-tickets-back').show();
            is_from_register_buy_tickets ? $('#hb-confirm-tickets-back').hide(): $('#hb-confirm-tickets-back').show();
        },

        displaySpecifiedTabOfLoginPopup : function (tabName, referredFrom) {
            var currentTab = $(".active-container").eq(0);
            var neededTab  = $("[data-tab-name=" + tabName + "]");

            if (neededTab.length != 0) {
                $(".errorsRow").hide();
                currentTab.removeClass("active-container").slideUp("fast");
                neededTab.addClass("active-container").slideDown("fast");
            }

            if (tabName == 'purchase-tickets') {
                var tickets_html = $('.tickets-container.loading-tickets-container').eq(0).html().trim();
                if (tickets_html == '' || referredFrom != undefined) {
                    handbid_login.getTicketsForAuction();
                }
            }

            if (tabName == 'process-payment') {
                handbid_login.loadResultTicketsWithDiscount();
            }

            if (tabName == 'process-success') {
                handbid_login.checkIfOnAuctionPage();
            }
        },

        registerFieldsValidation : function (tabName) {

            var valid           = true;
            var field, fieldType, passField, passConfirm;
            var errorRow        = $("[data-tab-name=" + tabName + "] .errorsRow").eq(0);
            var errorsContainer = $("[data-tab-name=" + tabName + "] .errorsContainer").eq(0);
            errorsContainer.html("");

            $("[data-tab-name=" + tabName + "] input[required]").each(function () {
                field     = $(this);
                fieldType = field.attr("type");
                if ((field.val().trim() == "")
                    || (fieldType == "checkbox" && !field.is(":checked"))) {
                    errorsContainer.append(field.data("required-message") + "<br>");
                    field.addClass("validation-error");
                    valid = false;
                }
                else {
                    field.removeClass("validation-error");
                }
            });

            $("[data-tab-name=" + tabName + "] input.is-email").each(function () {
                field = $(this);
                if (field.val().trim() != "" && !handbid_login.validEmail(field.val())) {
                    field.addClass("validation-email-error");
                    errorsContainer.append(field.data("not-email-message") + "<br>");
                    valid = false;
                }
                else {
                    field.removeClass("validation-email-error");
                }
            });

            if (tabName == "register-form") {
                passField   = $("#reg-password");
                passConfirm = $("#reg-password-confirm");
                if (passField.val() != passConfirm.val()) {
                    errorsContainer.append(passConfirm.data("mismatch-message") + "<br>");
                    passField.addClass("validation-mismatch-error");
                    passConfirm.addClass("validation-mismatch-error");
                    valid = false;
                }
                else {
                    passField.removeClass("validation-mismatch-error");
                    passConfirm.removeClass("validation-mismatch-error");
                }
            }

            valid ? errorRow.slideUp("normal") : errorRow.slideDown("normal");

            return valid;
        },

        restoreInitialTabState : function () {
            this.displaySpecifiedTabOfLoginPopup("login-form");
            $(".cleanable-input").val("");
            $(".to-hide-block").hide();
            $(".validation-error").removeClass("validation-error");
        },

        copyToConfirmField : function (input) {
            var selector = input.data("copy-to");
            $("#" + selector).val(input.val());
        },

        getPhoneNumber : function (thestring) {
            return thestring.replace(/\D+/g, "");
        },

        validEmail : function (thestring) {
            var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
            return re.test(thestring);
        },

        setPaddleNumberToContainer : function (paddle_number, profileID) {

            bidderId = profileID;

            var paddleContainer = $("#reg-complete-have-paddle-number");

            if (paddle_number) {

                var auctionNameContainer  = $("#reg-complete-auction");
                var paddleNumberContainer = $(".reg-paddle-number");
                var auctionName           = $("#confirm-add-to-auction-name").val();
                var auctionID             = $("#confirm-add-to-auction-id").val();

                var bidCookieKey = "bidder-" + profileID + "-bidding-in-auction-" + auctionID;

                auctionNameContainer.html(auctionName);
                paddleNumberContainer.html(paddle_number);
                paddleContainer.show();
                $.cookie(bidCookieKey, paddle_number, {expires : cookieExpire, path : '/'});

            }
            else {
                paddleContainer.hide();
            }
        },

        setAuctionKeysToButtons : function () {

            var closeButton        = $("[data-handbid-modal-key='login-modal'] .modal-close").eq(0);
            var auctionSlug        = $("#confirm-add-to-auction-slug").val();
            var startBiddingButton = $(".start-bidding-button");

            if ((auctionSlug == undefined || auctionSlug.trim() == "") && currentAuctionKey != undefined) {
                auctionSlug = currentAuctionKey;
            }

            var auctionUrl = "/auctions/" + auctionSlug;
            startBiddingButton.attr("href", auctionUrl);
            closeButton.attr("data-reload-href", auctionUrl);

        },

        goToResultWindowDependsOnTickets : function (tickets, premium, reload) {

            var nextPopupWindow = "register-complete";

            auction_tickets = tickets;
            auction_premium = premium;

            if (tickets != undefined) {
                if (tickets.length) {
                    if (is_from_register_buy_tickets) {
                        nextPopupWindow = "confirm-purchase";
                    }
                    else {
                        nextPopupWindow = "process-success";
                    }
                }
                else {
                    nextPopupWindow = "process-success";
                }
            }

            if (!reload) {
                handbid_login.displaySpecifiedTabOfLoginPopup(nextPopupWindow);
            }

        },

        getAuctionTickets : function (profileData) {

            var ticketsToAdd = [];

            if(is_from_register_buy_tickets){
                var tickets = handbid_login.recalculateTotalTicketsPrice();
                if (tickets.length > 0){
                    return tickets;
                }
            }

            if (profileData.auctionTickets != undefined) {
                ticketsToAdd = profileData.auctionTickets;
            }
            if (profileData.ticketing != undefined) {
                ticketsToAdd = profileData.ticketing.auctionTickets;
            }

            return ticketsToAdd;
        },

        getBidderCreditCards : function (profileData) {

            var creditCardsToAdd = [];

            if (profileData.creditCards != undefined) {
                creditCardsToAdd = profileData.creditCards;
            }
            if (profileData.ticketing != undefined) {
                creditCardsToAdd = profileData.ticketing.creditCards;
            }

            return creditCardsToAdd;
        },

        getAuctionPremiumCoefficient : function (profileData) {

            var auctionPremium = 0;

            if (profileData.auctionPremium != undefined) {
                auctionPremium = profileData.auctionPremium;
            }
            if (profileData.ticketing != undefined) {
                auctionPremium = profileData.ticketing.auctionPremium;
            }

            return auctionPremium;
        },

        setShippingAddressAfterLogin : function (profileData) {

            if (profileData.shippingAddress != undefined) {
                $('#hb-required-profile-address').val(profileData.shippingAddress);
            }
        },

        tryToLogin : function (button) {

            var action      = $("#hb-login-form-action").val();
            var username    = $("#hb-login-form-username").val();
            var password    = $("#hb-login-form-password").val();
            var auctionGuid = $("#login-add-to-auction").val();
            var nonce       = $("#hb-login-form-nonce").val();
            var redirect    = $("#hb-login-form-redirect").val();

            var isCurrentlyLoggingIn = $(".isCurrentlyLoggingIn");

            var errorBlock = $("[data-handbid-modal-key='login-modal'] .errorsRow");

            if (!handbid_login.validEmail(username)) {
                username = handbid_login.getPhoneNumber(username);
            }

            button.addClass("active");
            isCurrentlyLoggingIn.slideDown();
            errorBlock.slideUp("normal");
            $.post(ajaxurl,
                   {
                       action      : action,
                       username    : username,
                       password    : password,
                       auctionGuid : auctionGuid,
                       nonce       : nonce
                   },
                   function (data) {
                       data = JSON.parse(data);
                       button.removeClass("active");
                       if (data.success) {

                           errorBlock.slideUp("normal");

                           var profile_data = data.resp.data;

                           if (profile_data.auctionTickets != undefined || (profile_data.ticketing != undefined)) {

                               var credit_cards_to_add = handbid_login_main.getBidderCreditCards(profile_data),
                                   ticketsToAdd        = handbid_login_main.getAuctionTickets(profile_data),
                                   auctionPremium      = handbid_login_main.getAuctionPremiumCoefficient(profile_data);

                               handbid_login_main.setShippingAddressAfterLogin(profile_data);

                               handbid_login.setAuctionKeysToButtons();
                               handbid_login.setPaddleNumberToContainer(profile_data.currentPaddleNumber, profile_data.identity);

                               handbid_login.addCreditCardsToPayForTickets(credit_cards_to_add);
                               handbid_login.goToResultWindowDependsOnTickets(ticketsToAdd, auctionPremium);

                           }
                           else {
                               isCurrentlyLoggingIn.children("h3").html("Successfully Logged In. Redirecting");
                               window.location = redirect;
                           }
                       }
                       else {
                           isCurrentlyLoggingIn.slideUp();
                           errorBlock.slideDown("normal");
                       }
                   }
            );
        },

        tryToRegister : function (button) {

            var action          = $("#hb-reg-form-action").val();
            var firstname       = $("#confirm-firstname").val();
            var lastname        = $("#confirm-lastname").val();
            var password        = $("#confirm-password").val();
            var email           = $("#confirm-email").val();
            var shippingAddress = $("#confirm-address").val();
            var countryCode     = $("#confirm-phone-code").val();
            var mobile          = handbid_login.getPhoneNumber($("#confirm-phone-number").val());
            var deviceType      = $("#confirm-phone-type").val();

            var auctionGuid = $("#confirm-add-to-auction").val();
            var auctionSlug = $("#confirm-add-to-auction-slug").val();
            var auctionName = $("#confirm-add-to-auction-name").val();
            var nonce       = $("#hb-reg-form-nonce").val();

            var errorRow        = $("[data-tab-name='register-form-confirm'] .errorsRow").eq(0);
            var errorsContainer = $("[data-tab-name='register-form-confirm'] .errorsContainer").eq(0);

            button.addClass("active");

            var registration_data = {
                action          : action,
                firstname       : firstname,
                lastname        : lastname,
                password        : password,
                email           : email,
                shippingAddress : shippingAddress,
                countryCode     : countryCode,
                mobile          : mobile,
                deviceType      : deviceType,
                auctionGuid     : auctionGuid,
                auctionSlug     : auctionSlug,
                auctionName     : auctionName,
                nonce           : nonce
            };

            $.post(ajaxurl,
                   registration_data,
                   function (data) {
                       data = JSON.parse(data);
                       button.removeClass("active");
                       if (data.success) {

                           var profileData = data.profile.data;

                           errorRow.hide();
                           errorsContainer.html("");

                           var nameContainer = $("#reg-complete-name");
                           nameContainer.html(data.values.firstname + " " + data.values.lastname);

                           handbid_login.setAuctionKeysToButtons();
                           handbid_login.setPaddleNumberToContainer(profileData.currentPaddleNumber, profileData.identity);

                           var addNewCCBlock = $('#reg-complete-add-card');

                           var auctionRequiresCC = addNewCCBlock.hasClass('add-new-cc-to-register');

                           handbid_login.requestToAddCCAfter(!auctionRequiresCC);

                           var creditCardsToAdd = handbid_login_main.getBidderCreditCards(profileData),
                               ticketsToAdd     = handbid_login_main.getAuctionTickets(profileData),
                               auctionPremium   = handbid_login_main.getAuctionPremiumCoefficient(profileData);

                           handbid_login_main.setShippingAddressAfterLogin(profileData);

                           handbid_login.addCreditCardsToPayForTickets(creditCardsToAdd);
                           handbid_login.goToResultWindowDependsOnTickets(ticketsToAdd, auctionPremium);
                       }
                       else {
                           errorRow.show();
                           errorsContainer.html(data.error);
                       }
                   }
            );
        },

        updateProfileShippingAddress : function (button) {

            if (!button.hasClass('active')) {

                var shippingAddressContainer = $("#profile-shipping-address");
                var shippingAddress          = shippingAddressContainer.val();

                if (shippingAddress.trim() == '') {
                    shippingAddressContainer.addClass('input-error');
                }
                else {
                    shippingAddressContainer.removeClass('input-error');
                    button.addClass("active");
                    $.post(ajaxurl,
                           {
                               action  : "handbid_ajax_update_shipping_address",
                               address : shippingAddress
                           },
                           function (data) {
                               button.removeClass("active");
                               $('#hb-required-profile-address').val(shippingAddress);
                               $('#profileShippingAddress').val(shippingAddress);
                               $('#profileShippingAddressOld').val(shippingAddress);
                               handbid_login.displaySpecifiedTabOfLoginPopup("process-payment");
                               handbid_login.payForTicketsAllCard($('#hb-tickets-make-payment'));
                           }
                    );
                }

            }

        },

        resendPasswordLink : function (button) {

            var emailOrPhone = $("#emailOrPhoneToResetPass").val();
            if (!handbid_login.validEmail(emailOrPhone)) {
                emailOrPhone = handbid_login.getPhoneNumber(emailOrPhone);
            }
            var nonce      = button.data("change-pass-nonce");
            var errorBlock = $("[data-tab-name='forgot-pass'] .errorsRow");

            button.addClass("active");
            $.post(ajaxurl,
                   {
                       action       : "handbid_ajax_reset_password",
                       emailOrPhone : emailOrPhone,
                       nonce        : nonce
                   },
                   function (data) {
                       data = JSON.parse(data);

                       button.removeClass("active");
                       if (data.success) {
                           errorBlock.slideUp("normal");
                           handbid_login.displaySpecifiedTabOfLoginPopup("forgot-pass-sent");
                       }
                       else {
                           errorBlock.slideDown("normal");
                       }

                   }
            );

        },

        sendTextLinkSms : function (button) {

            var auctionId = $("#confirm-add-to-auction-id").val();
            button.addClass("active");
            $.post(ajaxurl,
                   {
                       action    : "handbid_ajax_send_text_link",
                       auctionId : auctionId
                   },
                   function (data) {
                       button.removeClass("active");
                   }
            );

        },

        checkDiscountCode : function (button) {

            if (!button.hasClass("active")) {

                discounts = [];

                var tickets               = handbid_login_main.recalculateTotalTicketsPrice();
                var ticketIds             = $.map(tickets, function (ticket) {
                    return ticket.id;
                });
                var discountFormPlace     = $(".discount-block .form-inline");
                var discountAppliedPlace  = $(".discount-applied.discount-success");
                var discountErrorPlace    = $(".discount-applied.discount-error");
                var discountAmountPlace   = $("#confirm-purchasing-discount");
                var subtotalAmountPlace   = $("#confirm-purchasing-subtotal");
                var surchargesAmountPlace = $("#confirm-purchasing-surcharges");
                var premiumAmountPlace    = $("#confirm-purchasing-premium");
                var totalAmountPlace      = $("#confirm-purchasing-total");
                var fullPricePlaces       = $(".tickets-full-price");
                var discountInput         = $("#discount-code");
                var discountCode          = discountInput.val();

                if (discountCode.trim() != '') {

                    discountInput.removeClass('input-error');

                    button.addClass("active");

                    $.post(ajaxurl,
                           {
                               action       : "handbid_ajax_check_discount_code",
                               ticketIds    : ticketIds,
                               discountCode : discountCode
                           },
                           function (data) {

                               try {
                                   data = JSON.parse(data);
                               }
                               catch (e) {
                               }

                               if (data.success) {
                                   var discountAmount = 0;

                                   discounts = data.apply;

                                   $.map(data.apply, function (discountApplied) {
                                       var appliedTo = parseInt(discountApplied.ticketId);
                                       $.map(tickets, function (ticket) {
                                           if (ticket.id == appliedTo) {
                                               discountAmount += ticket.quantity * discountApplied.amount;
                                           }
                                           return ticket.id;
                                       });
                                   });

                                   discountAmountPlace.html(discountAmount);

                                   var subtotalAmount   = parseFloat(subtotalAmountPlace.html());
                                   var surchargesAmount = parseFloat(surchargesAmountPlace.html());
                                   var premiumPercents  = parseFloat(premiumAmountPlace.attr('data-premium'));

                                   var premiumAmount = ((subtotalAmount - discountAmount + surchargesAmount) * premiumPercents / 100 );
                                   var totalAmount   = premiumAmount + subtotalAmount - discountAmount + surchargesAmount;

                                   var totalAmountOut = handbid_main.number_format(totalAmount, 2, ".", "");
                                   var premiumAmountOut = handbid_main.number_format(premiumAmount, 2, ".", "");

                                   premiumAmountPlace.html(premiumAmountOut);

                                   totalAmountPlace.html(totalAmountOut);
                                   fullPricePlaces.html(totalAmountOut);
                                   handbid_login_main.placeCurrentTotalToTotalPlaces();

                                   discountErrorPlace.slideUp('fast');
                                   discountFormPlace.slideUp('fast');
                                   discountAppliedPlace.slideDown('fast');
                               }
                               else {
                                   var errorMessage = "The code " + (discountCode.toUpperCase()) + " was not applied due to the following reason: " + data.reason;
                                   discountErrorPlace.html(errorMessage);
                                   discountErrorPlace.slideDown('fast');
                               }

                               button.removeClass("active");
                           }
                    );
                }
                else {
                    discountInput.addClass('input-error')
                }
            }

        },

        requestToAddCC : function () {
            handbid_modals_main.showSingleModal('credit-card-form');
        },

        requestToAddCCAfter : function (cardAdded) {

            var startBiddingBlock = $('#reg-complete-start-bidding'),
                addNewCCBlock     = $('#reg-complete-add-card');

            (cardAdded) ? addNewCCBlock.hide() : addNewCCBlock.show();
            (cardAdded) ? startBiddingBlock.show() : startBiddingBlock.hide();
        },

        getTicketsForAuction : function () {

            var tickets_container = $('.tickets-on-register .tickets-container');
            var currencyCode      = $("#login-add-to-auction-currency-code").val();
            var currencySymbol    = $("#login-add-to-auction-currency-symbol").val();
            $("[data-handbid-tickets-quantity]").html(0);
            $("[data-handbid-tickets-total]").html(0);

            tickets_container.html();
            tickets_container.addClass('loading');

            $.post(ajaxurl,
                   {
                       action         : "handbid_ajax_get_auction_tickets_template",
                       tickets        : auction_tickets,
                       premium        : auction_premium,
                       currencyCode   : currencyCode,
                       currencySymbol : currencySymbol
                   },
                   function (data) {

                       tickets_container.removeClass('loading');

                       tickets_container.html(data);

                       if (auction_tickets.length) {
                           handbid_login.setupTicketsPurchasing();
                       }
                   }
            );

        },

        addCreditCardsToPayForTickets : function (cards) {

            var cards_container = $('#tickets-payment-card');

            var no_cards_class = 'no-cards-on-file';
            var cards_block    = $('.no-cards-if-no-cards');

            cards_container.html();

            if (cards != undefined && cards.length) {

                $.map(cards, function (card) {

                    cards_container.append("<option data-option-val='" + card.id + "' value='" + card.id + "'>" + card.nameOnCard + " (xxxx xxxx xxxx " + card.lastFour + ")</option>");

                });
                cards_block.removeClass(no_cards_class);
            }
            else {
                cards_block.addClass(no_cards_class);
            }

        },

        checkIfOnAuctionPage : function () {

            var only_for_auction = $('.block-only-for-auction');
            var for_all_pages    = $('.block-for-all-pages');
            var auctionId        = $("#confirm-add-to-auction-id").val();

            var offset_class = 'col-md-offset-4';
            if (auctionId) {
                only_for_auction.show();
                for_all_pages.removeClass(offset_class);
            }
            else {
                only_for_auction.hide();
                for_all_pages.addClass(offset_class);
            }
        },

        placeCurrentTotalToTotalPlaces : function () {

            var totalPrice = $('#confirm-purchasing-total').html();
            totalPrice     = handbid_main.number_format(totalPrice, 2, ".", "");
            $('#confirm-purchasing-total, .tickets-full-price').html(totalPrice);

        },

        loadCheckedTicketsForConfirmation : function () {

            var tickets_container = $('.confirmed-tickets-container');
            var currencyCode      = $("#login-add-to-auction-currency-code").val();
            var currencySymbol    = $("#login-add-to-auction-currency-symbol").val();
            var tickets           = handbid_login.recalculateTotalTicketsPrice();

            tickets_container.html();
            tickets_container.addClass('loading');

            $.post(ajaxurl,
                   {
                       action         : "handbid_ajax_get_confirmed_tickets_template",
                       tickets        : tickets,
                       premium        : auction_premium,
                       currencyCode   : currencyCode,
                       currencySymbol : currencySymbol
                   },
                   function (data) {

                       tickets_container.removeClass('loading');

                       tickets_container.html(data);

                       handbid_login_main.placeCurrentTotalToTotalPlaces();
                   }
            );

        },

        loadResultTicketsWithDiscount : function () {

            var result_tickets_container = $('.result-tickets-container');
            var currencyCode             = $("#login-add-to-auction-currency-code").val();
            var currencySymbol           = $("#login-add-to-auction-currency-symbol").val();
            var tickets                  = handbid_login.recalculateTotalTicketsPrice();

            result_tickets_container.html();
            result_tickets_container.addClass('loading');

            $.post(ajaxurl,
                   {
                       action         : "handbid_ajax_get_result_tickets_template",
                       tickets        : tickets,
                       discounts      : discounts,
                       currencyCode   : currencyCode,
                       currencySymbol : currencySymbol
                   },
                   function (data) {

                       result_tickets_container.removeClass('loading');

                       result_tickets_container.html(data);

                   }
            );

        },

        recalculateTotalTicketsPrice : function () {

            var totalPrice                    = 0;
            var totalQuantity                 = 0;
            var ticketsPurchaseSkipButton = $('#hb-purchase-tickets-back');
            var ticketsPurchaseContinueButton = $('#hb-purchase-tickets-next');
            var prices                        = $.map($("[data-handbid-ticket-row]"), function (val, i) {
                var parentBlock       = $(val),
                    quantityBlock     = $("[data-handbid-ticket-quantity]", parentBlock).eq(0),
                    quantity          = parseInt(quantityBlock.html());
                if(quantity <= 0){
                    return null;
                }
                var itemID            = parseInt(parentBlock.data("handbid-ticket-row")),
                    itemPrice         = parseFloat($("[data-handbid-ticket-buynow]", parentBlock).eq(0).html()),
                    itemSurcharge     = parseFloat($("[data-handbid-ticket-surcharge]", parentBlock).eq(0).val()),
                    itemSurchargeName = $("[data-handbid-ticket-surcharge-name]", parentBlock).eq(0).val(),
                    itemTitle         = $("[data-handbid-ticket-title]", parentBlock).eq(0).html(),
                    itemDescription   = $("[data-handbid-ticket-description]", parentBlock).eq(0).html();
                totalPrice += quantity * itemPrice;
                totalQuantity += quantity;
                return {
                    id            : itemID,
                    price         : itemPrice,
                    quantity      : quantity,
                    name          : itemTitle,
                    surcharge     : itemSurcharge,
                    surchargeName : itemSurchargeName,
                    description   : itemDescription
                };
            });

            totalPrice = handbid_main.number_format(totalPrice, 2, ".", "");
            $("[data-handbid-tickets-total]").html(totalPrice);
            $(".tickets-full-price").html(totalPrice);
            handbid_login_main.placeCurrentTotalToTotalPlaces();
            $("[data-handbid-tickets-quantity]").html(totalQuantity);

            if (prices.length) {
                ticketsPurchaseContinueButton.removeAttr('disabled');
            }
            else {
                ticketsPurchaseContinueButton.attr('disabled', 'disabled');
            }

            if(!is_from_initial_login) {
                if (prices.length) {
                    ticketsPurchaseSkipButton.attr('disabled', 'disabled');
                }
                else {
                    ticketsPurchaseSkipButton.removeAttr('disabled');
                }
            }

            return prices;
        },

        setupTicketsPurchasing : function () {

            $('[data-handbid-ticket-button="up"]').on('click', function (e) {

                e.preventDefault();

                var parentBlock    = $(this).parents(".ticket-part-container").eq(0),
                    otherButton    = $("[data-handbid-ticket-button='down']", parentBlock).eq(0),
                    quantityBlock  = $("[data-handbid-ticket-quantity]", parentBlock).eq(0),
                    remainingBlock = $("[data-handbid-tickets-remaining]", parentBlock).eq(0),
                    quantity       = parseInt(quantityBlock.html()),
                    remainingSymb  = remainingBlock.val(),
                    remaining      = parseInt(remainingBlock.val());

                var newValue = quantity + 1;

                if (newValue <= remaining || (remainingSymb == "-1" || remainingSymb == "∞")) {
                    quantityBlock.html(newValue);
                    handbid_login_main.recalculateTotalTicketsPrice();
                    otherButton.removeClass("ghosted-out");

                    if (newValue + 1 > remaining && !(remainingSymb == "-1" || remainingSymb == "∞")) {
                        $(this).addClass("ghosted-out");
                    }
                }

            });

            $('[data-handbid-ticket-button="down"]').on('click', function (e) {

                e.preventDefault();

                var parentBlock   = $(this).parents(".ticket-part-container").eq(0),
                    otherButton   = $("[data-handbid-ticket-button='up']", parentBlock).eq(0),
                    quantityBlock = $("[data-handbid-ticket-quantity]", parentBlock).eq(0),
                    quantity      = parseInt(quantityBlock.html());

                var newValue = quantity - 1;

                if (newValue >= 0) {
                    quantityBlock.html(newValue);
                    handbid_login_main.recalculateTotalTicketsPrice();
                    otherButton.removeClass("ghosted-out");

                    if (newValue - 1 < 0) {
                        $(this).addClass("ghosted-out");
                    }
                }
            });

        },

        payForTicketsAllCard : function (button) {

            if (!button.hasClass('active')) {

                var isShippingAddressRequired = parseInt($("#hb-auction-requires-address").val());
                var currentShippingAddress    = $("#hb-required-profile-address").val();

                if (isShippingAddressRequired && (currentShippingAddress.trim() == '')) {
                    handbid_login.displaySpecifiedTabOfLoginPopup("add-shipping-address");
                    return false;
                }

                var auctionId     = $("#confirm-add-to-auction-id").val();
                var cardSelect    = $("#tickets-payment-card");
                var cardText      = $("#tickets-payment-card option:selected").text();
                var cardId        = cardSelect.val();
                var cardNamePlace = $('span[data-card-number]');
                cardNamePlace.html(cardText);

                var nextPopupWindow = "process-success";
                var processErrorBox = $('.process-message-error');

                if (cardId) {

                    button.addClass('active');

                    var to_buy = [];

                    if (tickets == null) {
                        tickets = handbid_login.recalculateTotalTicketsPrice();
                        to_buy  = tickets;
                    }

                    $.map(discounts, function (discountApplied) {
                        var appliedTo = parseInt(discountApplied.ticketId);
                        $.map(to_buy, function (ticket, index) {
                            if (ticket.id == appliedTo) {
                                to_buy[index]['discountId'] = discountApplied.discountId;
                            }
                        });
                    });

                    var userId = (bidderId) ? bidderId : $('#bidder-info-load').attr('data-profile-id');

                    var data = {
                        action    : "handbid_ajax_buy_tickets",
                        userId    : userId,
                        auctionId : auctionId,
                        items     : to_buy
                    };

                    $.post(
                        ajaxurl,
                        data,
                        function (data) {

                            var dataAct = {
                                action    : "handbid_ajax_pay_for_tickets_by_card",
                                auctionId : auctionId,
                                cardId    : cardId
                            };

                            $.post(
                                ajaxurl,
                                dataAct,
                                function (data) {
                                    button.removeClass('active');
                                    data = JSON.parse(data);

                                    if (data.result != undefined) {

                                        var dataData = data.result.data;

                                        if (dataData != undefined
                                            && dataData.error != undefined
                                            && dataData.error.Paid == undefined) {
                                            var payment_error_messages = [];

                                            for (var propertyName in dataData.error) {

                                                var value = dataData.error[propertyName];

                                                payment_error_messages.push(value);
                                            }

                                            processErrorBox.html(payment_error_messages.join('<br>'));
                                            nextPopupWindow = "process-error";
                                        }
                                        else {
                                            if (data.result.paid
                                                ||(dataData != undefined
                                                   && dataData.error != undefined
                                                   && dataData.error.Paid != undefined)) {
                                                nextPopupWindow = "process-success";

                                                $('.hide-if-no-tickets').show();
                                                $('.last-screen-title').html('Successfully Processed!');
                                                tickets = null;

                                                $('.tickets-container.loading-tickets-container.purchase-container').html('');
                                                handbid_main.loadInvoicesToContainer(true);

                                            }
                                            else {
                                                processErrorBox.html(data.result.description);
                                                nextPopupWindow = "process-error";
                                            }
                                        }
                                    }
                                    else {
                                        processErrorBox.html('Something went wrong. Please try again later');
                                        nextPopupWindow = "process-error";
                                    }

                                    handbid_login.displaySpecifiedTabOfLoginPopup(nextPopupWindow);
                                }
                            );
                        }
                    );

                }
                else {
                    processErrorBox.html('There is no card selected');
                    handbid_login.displaySpecifiedTabOfLoginPopup("process-error");
                }
            }
        }
    };

    $(document).ready(function () {

        $('.has-popover').popover();

        $('.login-popup-link').live('click', function (e) {
            e.preventDefault();
            if (!$(this).hasClass("register-next") && !$(this).hasClass("register-confirm")) {
                var tabName = $(this).data("target-tab");
                handbid_login.displaySpecifiedTabOfLoginPopup(tabName);
            }
        });

        $('.tutorialTabs').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
            $(".tutorialTabsContainer").removeClass("active");
            $(this).parent().addClass("active");
        });

        $('#hb-login-form-submit').click(function (e) {
            e.preventDefault();
            if (!$(this).hasClass("active")) {
                handbid_login.tryToLogin($(this));
            }
        });

        $('.copyable-field').on('focusout', function () {
            handbid_login.copyToConfirmField($(this));
        });

        $('.login-popup-link.register-next').on('click', function (e) {
            e.preventDefault();
            if (handbid_login.registerFieldsValidation("register-form")) {
                var tabName = $(this).data("target-tab");

                $('.copyable-field').each(function () {
                    handbid_login.copyToConfirmField($(this));
                });

                handbid_login.displaySpecifiedTabOfLoginPopup(tabName);
            }
        });

        $('#hb-purchase-tickets-back').on('click', function (e) {
            e.preventDefault();
            if(is_from_register_buy_tickets){
                handbid_login.displaySpecifiedTabOfLoginPopup('register-form');
            }
            else{
                handbid_login.displaySpecifiedTabOfLoginPopup('process-success');
                $('.tickets-container.loading-tickets-container.purchase-container').html('');
            }
        });

        $('#hb-purchase-tickets-next').on('click', function (e) {
            e.preventDefault();
            handbid_login.loadCheckedTicketsForConfirmation();
            var isRegistered = $('#bidder-info-load').length;
            if(isRegistered || is_from_initial_login){
                handbid_login.displaySpecifiedTabOfLoginPopup('confirm-purchase');
            }
            else{
                handbid_login.displaySpecifiedTabOfLoginPopup('register-form');
            }
        });

        $('#hb-confirm-tickets-back').on('click', function (e) {
            e.preventDefault();
            handbid_login.displaySpecifiedTabOfLoginPopup('purchase-tickets');
        });

        $('#hb-pay-tickets-skip').on('click', function (e) {
            e.preventDefault();
            if(is_from_register_buy_tickets){
                handbid_login.displaySpecifiedTabOfLoginPopup('confirm-purchase');
            }
            else {
                handbid_login.displaySpecifiedTabOfLoginPopup('purchase-tickets', 'hb-pay-tickets-skip');
            }
        });

        $('#hb-confirm-tickets-pay').on('click', function (e) {
            e.preventDefault();
            handbid_login.displaySpecifiedTabOfLoginPopup('process-payment');
        });

        $('.login-popup-link.register-confirm').on('click', function (e) {
            e.preventDefault();
            if (!$(this).hasClass('active') && handbid_login.registerFieldsValidation("register-form-confirm")) {
                handbid_login.tryToRegister($(this));
            }
        });

        $('#hb-tickets-add-card').on('click', function (e) {
            e.preventDefault();
            handbid_modals_main.showSingleModal('credit-card-form');
        });

        $('#hb-tickets-make-payment').on('click', function (e) {
            e.preventDefault();
            handbid_login.payForTicketsAllCard($(this));
        });

        $('#hb-ticket-payment-error-card').on('click', function (e) {
            e.preventDefault();
            handbid_modals_main.showSingleModal('credit-card-form');
            handbid_login.displaySpecifiedTabOfLoginPopup('process-payment');
        });

        $('#hb-ticket-payment-error-back').on('click', function (e) {
            e.preventDefault();
            handbid_login.displaySpecifiedTabOfLoginPopup('process-payment');
        });

        $('#hb-add-address-skip').on('click', function (e) {
            e.preventDefault();
            handbid_login.displaySpecifiedTabOfLoginPopup('process-payment');
        });

        $('.reset-password-link').on('click', function (e) {
            handbid_login.resendPasswordLink($(this));
        });

        $('#hb-update-shipping-address').on('click', function (e) {
            e.preventDefault();
            handbid_login.updateProfileShippingAddress($(this));
        });

        $('#start-enter-card-button').on('click', function (e) {
            handbid_login.requestToAddCC($(this));
        });

        $('#hb-text-a-link').on('click', function (e) {
            handbid_login.sendTextLinkSms($(this));
        });

        $('#hb-apply-discount-code-button').live('click', function (e) {
            e.preventDefault();
            handbid_login.checkDiscountCode($(this));
        });

        $('.start-bidding-button').live('click', function (e) {
            e.preventDefault();
            var href = $(this).attr('href');
            if (href == '#') {
                $('[data-handbid-modal-key="login-modal"]').modal('hide');
            }
            else {
                window.location = href;
            }
        });

        $('[data-handbid-modal-key="login-modal"]').on('hide.bs.modal', function (e) {

            var close_button = $('[data-handbid-modal-key="login-modal"] .modal-close');

            var tickets_prepared = handbid_login.recalculateTotalTicketsPrice();
            if (tickets_prepared.length) {
                e.preventDefault();
                (new PNotify({
                    title        : 'Confirmation Needed',
                    text         : 'Are you sure? Your ticket purchase will be lost.',
                    icon         : 'glyphicon glyphicon-question-sign',
                    hide         : false,
                    confirm      : {
                        confirm : true
                    },
                    buttons      : {
                        closer  : false,
                        sticker : false
                    },
                    history      : {
                        history : false
                    },
                    addclass     : 'handbid-message-notice',
                    before_open  : function (PNotify) {
                        handbid_main.fadeInModalOverlayAndPositionModal(PNotify);
                    },
                    before_close : function () {
                        handbid_main.fadeOutModalOverlay();
                    }
                })).get().on('pnotify.confirm', function () {

                    $('.tickets-container.loading-tickets-container.purchase-container').html('');
                    close_button.click();
                    handbid_login.restoreInitialTabState();
                    var reloadHref = close_button.data("reload-href");
                    if (reloadHref != undefined) {
                        window.location = reloadHref;
                    }

                }).on('pnotify.cancel', function () {

                });

            }
            else {
                handbid_login.restoreInitialTabState();
                var reloadHref = close_button.data("reload-href");
                if (reloadHref != undefined) {
                    window.location = reloadHref;
                }
            }

        });

        handbid_login_main = handbid_login;

    });

})(jQuery);