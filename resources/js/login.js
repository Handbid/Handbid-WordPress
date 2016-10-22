/**
 * @copyright Copyright (c) 2014-2015 Handbid Inc.
 * @category handbid
 * @package Handbid2-WordPress
 * @license Proprietary
 * @link http://www.handbid.com/
 * @author Master of Code (worldclass@masterofcode.com)
 */
var handbidLoginMain, cookieExpire = 7;
(function ($) {

    var auction_tickets = [], tickets = null, bidderId = null;

    var handbidLogin = {

        displaySpecifiedTabOfLoginPopup: function (tabName) {
            var currentTab = $(".active-container").eq(0);
            var neededTab = $("[data-tab-name=" + tabName + "]");

            if (neededTab.length != 0) {
                $(".errorsRow").hide();
                currentTab.removeClass("active-container").slideUp("fast");
                neededTab.addClass("active-container").slideDown("fast");
            }

            if (tabName == 'purchase-tickets') {
                var tickets_html = $('.tickets-container.loading-tickets-container').eq(0).html().trim();
                if(tickets_html == '') {
                    handbidLogin.getTicketsForAuction();
                }
            }

            if (tabName == 'process-payment') {
                if(!tickets) {
                    handbidLogin.purchaseTickets();
                }
            }

            if (tabName == 'process-success') {
                handbidLogin.checkIfOnAuctionPage();
            }
        },

        registerFieldsValidation: function (tabName) {

            var valid = true;
            var field, fieldType, passField, passConfirm;
            var errorRow = $("[data-tab-name=" + tabName + "] .errorsRow").eq(0);
            var errorsContainer = $("[data-tab-name=" + tabName + "] .errorsContainer").eq(0);
            errorsContainer.html("");


            $("[data-tab-name=" + tabName + "] input[required]").each(function () {
                field = $(this);
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
                if (field.val().trim() != "" && ! handbidLogin.validEmail(field.val())) {
                    field.addClass("validation-email-error");
                    errorsContainer.append(field.data("not-email-message") + "<br>");
                    valid = false;
                }
                else {
                    field.removeClass("validation-email-error");
                }
            });


            if (tabName == "register-form") {
                passField = $("#reg-password");
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

        restoreInitialTabState: function () {
            this.displaySpecifiedTabOfLoginPopup("login-form");
            $(".cleanable-input").val("");
            $(".to-hide-block").hide();
            $(".validation-error").removeClass("validation-error");
        },

        copyToConfirmField: function (input) {
            var selector = input.data("copy-to");
            $("#" + selector).val(input.val());
        },

        getPhoneNumber: function (thestring) {
            return thestring.replace(/\D+/g, "");
        },

        validEmail: function (thestring) {
            var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
            return re.test(thestring);
        },

        setPaddleNumberToContainer: function (paddleNumber, profileID) {

            bidderId = profileID;

            var paddleContainer = $("#reg-complete-have-paddle-number");

            if(paddleNumber){


                var auctionNameContainer = $("#reg-complete-auction");
                var paddleNumberContainer = $(".reg-paddle-number");
                var auctionName = $("#confirm-add-to-auction-name").val();
                var auctionID = $("#confirm-add-to-auction-id").val();

                var bidCookieKey = "bidder-"+profileID+"-bidding-in-auction-"+auctionID;

                auctionNameContainer.html(auctionName);
                paddleNumberContainer.html(paddleNumber);
                paddleContainer.show();
                $.cookie(bidCookieKey, paddleNumber, { expires: cookieExpire, path: '/' });

            }
            else{
                paddleContainer.hide();
            }
        },

        setAuctionKeysToButtons: function () {

            var closeButton = $("[data-handbid-modal-key='login-modal'] .modal-close").eq(0);
            var auctionSlug = $("#confirm-add-to-auction-slug").val();
            var startBiddingButton = $(".start-bidding-button");

            if((auctionSlug == undefined || auctionSlug.trim() == "") && currentAuctionKey != undefined){
                auctionSlug = currentAuctionKey;
            }

            var auctionUrl = "/auctions/" + auctionSlug;
            startBiddingButton.attr("href", auctionUrl);
            closeButton.attr("data-reload-href", auctionUrl);

        },

        goToResultWindowDependsOnTickets: function (tickets) {

            var nextPopupWindow = "register-complete";

            auction_tickets = tickets;

            if(tickets != undefined)
            {
                if(tickets.length)
                {
                    nextPopupWindow = "purchase-tickets";
                }
                else{
                    nextPopupWindow = "process-success";
                }
            }
            handbidLogin.displaySpecifiedTabOfLoginPopup(nextPopupWindow);

        },

        tryToLogin: function (button) {
            var action = $("#hb-login-form-action").val();
            var username = $("#hb-login-form-username").val();
            var password = $("#hb-login-form-password").val();
            var auctionGuid = $("#login-add-to-auction").val();
            var nonce = $("#hb-login-form-nonce").val();
            var redirect = $("#hb-login-form-redirect").val();

            var isCurrentlyLoggingIn = $(".isCurrentlyLoggingIn");

            var errorBlock = $("[data-handbid-modal-key='login-modal'] .errorsRow");

            if(!handbidLogin.validEmail(username)){
                username = handbidLogin.getPhoneNumber(username);
            }

            button.addClass("active");
            isCurrentlyLoggingIn.slideDown();
            errorBlock.slideUp("normal");
            $.post(ajaxurl,
                {
                    action: action,
                    username: username,
                    password: password,
                    auctionGuid: auctionGuid,
                    nonce: nonce
                },
                function (data) {
                    data = JSON.parse(data);
                    button.removeClass("active");
                    if (data.success) {

                        errorBlock.slideUp("normal");

                        var profileData = data.resp.data;

                        if(profileData.auctionTickets != undefined) {

                            handbidLogin.setAuctionKeysToButtons();
                            handbidLogin.setPaddleNumberToContainer(profileData.currentPaddleNumber, profileData.identity);

                            handbidLogin.addCreditCardsToPayForTickets(profileData.creditCards);
                            handbidLogin.goToResultWindowDependsOnTickets(profileData.auctionTickets);

                        }
                        else{
                            isCurrentlyLoggingIn.children("h3").html("Successfully Logged In. Redirecting");
                            window.location = redirect;
                        }
                    }
                    else{
                        isCurrentlyLoggingIn.slideUp();
                        errorBlock.slideDown("normal");
                    }
                }
            );
        },

        tryToRegister: function (button) {
            var action = $("#hb-reg-form-action").val();
            var firstname = $("#confirm-firstname").val();
            var lastname = $("#confirm-lastname").val();
            var password = $("#confirm-password").val();
            var email = $("#confirm-email").val();
            var shippingAddress = $("#confirm-address").val();
            var countryCode = $("#confirm-phone-code").val();
            var mobile = handbidLogin.getPhoneNumber($("#confirm-phone-number").val());
            var deviceType = $("#confirm-phone-type").val();

            var auctionGuid = $("#confirm-add-to-auction").val();
            var auctionSlug = $("#confirm-add-to-auction-slug").val();
            var auctionName = $("#confirm-add-to-auction-name").val();
            var nonce = $("#hb-reg-form-nonce").val();

            var errorRow = $("[data-tab-name='register-form-confirm'] .errorsRow").eq(0);
            var errorsContainer = $("[data-tab-name='register-form-confirm'] .errorsContainer").eq(0);


            button.addClass("active");

            var registration_data = {
                action: action,
                firstname: firstname,
                lastname: lastname,
                password: password,
                email: email,
                shippingAddress: shippingAddress,
                countryCode: countryCode,
                mobile: mobile,
                deviceType: deviceType,
                auctionGuid: auctionGuid,
                auctionSlug: auctionSlug,
                auctionName: auctionName,
                nonce: nonce
            };

            $.post(ajaxurl,
                   registration_data,
                function (data) {
                    data = JSON.parse(data);
                    button.removeClass("active");
                    if(data.success){

                        var profileData = data.profile.data;

                        errorRow.hide();
                        errorsContainer.html("");

                        var nameContainer = $("#reg-complete-name");
                        nameContainer.html(data.values.firstname + " " + data.values.lastname);

                        handbidLogin.setAuctionKeysToButtons();
                        handbidLogin.setPaddleNumberToContainer(profileData.currentPaddleNumber, profileData.identity);

                        var addNewCCBlock = $('#reg-complete-add-card');

                        var auctionRequiresCC = addNewCCBlock.hasClass('add-new-cc-to-register');

                        handbidLogin.requestToAddCCAfter(!auctionRequiresCC);

                        handbidLogin.addCreditCardsToPayForTickets(profileData.creditCards);
                        handbidLogin.goToResultWindowDependsOnTickets(profileData.auctionTickets);
                    }
                    else{
                        errorRow.show();
                        errorsContainer.html(data.error);
                    }
                }
            );
        },

        resendPasswordLink: function(button){

            var emailOrPhone = $("#emailOrPhoneToResetPass").val();
            if(!handbidLogin.validEmail(emailOrPhone)){
                emailOrPhone = handbidLogin.getPhoneNumber(emailOrPhone);
            }
            var nonce = button.data("change-pass-nonce");
            var errorBlock = $("[data-tab-name='forgot-pass'] .errorsRow");

            button.addClass("active");
            $.post(ajaxurl,
                {
                    action: "handbid_ajax_reset_password",
                    emailOrPhone: emailOrPhone,
                    nonce: nonce
                },
                function (data) {
                    data = JSON.parse(data);

                    button.removeClass("active");
                    if(data.success){
                        errorBlock.slideUp("normal");
                        handbidLogin.displaySpecifiedTabOfLoginPopup("forgot-pass-sent");
                    }
                    else{
                        errorBlock.slideDown("normal");
                    }

                }
            );

        },

        sendTextLinkSms: function(button){

            var auctionId = $("#confirm-add-to-auction-id").val();
            button.addClass("active");
            $.post(ajaxurl,
                {
                    action: "handbid_ajax_send_text_link",
                    auctionId: auctionId
                },
                function (data) {
                    button.removeClass("active");
                }
            );

        },

        requestToAddCC: function(){
            handbidModalsMain.showSingleModal('credit-card-form');
        },

        requestToAddCCAfter: function(cardAdded){

            var startBiddingBlock = $('#reg-complete-start-bidding'),
                addNewCCBlock = $('#reg-complete-add-card');

            (cardAdded) ? addNewCCBlock.hide() : addNewCCBlock.show();
            (cardAdded) ? startBiddingBlock.show() : startBiddingBlock.hide();
        },

        getTicketsForAuction: function(){

            var tickets_container = $('.tickets-on-register .tickets-container');
            var currencyCode = $("#login-add-to-auction-currency-code").val();
            var currencySymbol = $("#login-add-to-auction-currency-symbol").val();

            tickets_container.html();
            tickets_container.addClass('loading');

            $.post(ajaxurl,
                   {
                       action: "handbid_ajax_get_auction_tickets_template",
                       tickets: auction_tickets,
                       currencyCode: currencyCode,
                       currencySymbol: currencySymbol
                   },
                   function (data) {

                       tickets_container.removeClass('loading');

                       tickets_container.html(data);

                       if(auction_tickets.length){
                           handbidLogin.setupTicketsPurchasing();
                       }
                   }
            );

        },

        purchaseTickets: function(){

            tickets = handbidLogin.recalculateTotalTicketsPrice();
            var payContainer = $(".pay-for-purchased-containers");
            var auctionId = $("#confirm-add-to-auction-id").val();
            var userId = bidderId;
            payContainer.addClass('loading');
            var data = {
                action: "handbid_ajax_buy_tickets",
                userId: userId,
                auctionId: auctionId,
                items: tickets
            };
            $.post(
                ajaxurl,
                data,
                function (data) {

                    payContainer.removeClass('loading');
                }
            );
        },

        addCreditCardsToPayForTickets: function(cards){

            var cards_container = $('#tickets-payment-card');

            cards_container.html();

            if(cards != undefined && cards.length) {

                $.map(cards, function (card) {

                    cards_container.append("<option data-option-val='" + card.id + "' value='" + card.id + "'>" + card.nameOnCard + " (xxxx xxxx xxxx " + card.lastFour + ")</option>");

                });

            }

        },

        checkIfOnAuctionPage: function(){

            var only_for_auction = $('.block-only-for-auction');
            var for_all_pages = $('.block-for-all-pages');
            var auctionId  = $("#confirm-add-to-auction-id").val();

            var offset_class = 'col-md-offset-4';
            if(auctionId){
                only_for_auction.show();
                for_all_pages.removeClass(offset_class);
            }
            else{
                only_for_auction.hide();
                for_all_pages.addClass(offset_class);
            }
        },

        loadCheckedTicketsForConfirmation: function(){

            var tickets_container = $('.confirmed-tickets-container');
            var result_tickets_container = $('.result-tickets-container');
            var currencyCode = $("#login-add-to-auction-currency-code").val();
            var currencySymbol = $("#login-add-to-auction-currency-symbol").val();
            var tickets = handbidLogin.recalculateTotalTicketsPrice();

            tickets_container.html();
            tickets_container.addClass('loading');

            $.post(ajaxurl,
                   {
                       action: "handbid_ajax_get_confirmed_tickets_template",
                       tickets: tickets,
                       currencyCode: currencyCode,
                       currencySymbol: currencySymbol
                   },
                   function (data) {

                       data = JSON.parse(data);

                       tickets_container.removeClass('loading');

                       tickets_container.html(data.confirm_tickets);
                       result_tickets_container.html(data.result_tickets);
                   }
            );

        },

        recalculateTotalTicketsPrice: function(){

            var totalPrice = 0;
            var totalQuantity = 0;
            var ticketsPurchaseContinueButton = $('#hb-purchase-tickets-next');
            var prices = $.map($("[data-handbid-ticket-row]"), function (val, i) {
                var parentBlock = $(val),
                    quantityBlock = $("[data-handbid-ticket-quantity]", parentBlock).eq(0),
                    quantity = parseInt(quantityBlock.html()),
                    itemID = parseInt(parentBlock.data("handbid-ticket-row")),
                    itemPrice = parseInt($("[data-handbid-ticket-buynow]", parentBlock).eq(0).html()),
                    itemTitle = $("[data-handbid-ticket-title]", parentBlock).eq(0).html(),
                    itemDescription = $("[data-handbid-ticket-description]", parentBlock).eq(0).html();
                totalPrice += quantity * itemPrice;
                totalQuantity += quantity;
                return (quantity > 0) ?
                {
                    id: itemID,
                    price: itemPrice,
                    quantity: quantity,
                    name: itemTitle,
                    description: itemDescription
                }
                : null;
            });
            totalPrice = handbidMain.number_format(totalPrice, 0, ".", ",");
            $("[data-handbid-tickets-total]").html(totalPrice);
            $(".tickets-full-price").html(totalPrice);
            $("[data-handbid-tickets-quantity]").html(totalQuantity);

            if(prices.length){
                ticketsPurchaseContinueButton.removeAttr('disabled');
            }
            else{
                ticketsPurchaseContinueButton.attr('disabled','disabled');
            }

            return prices;
        },


        setupTicketsPurchasing: function () {

            $('[data-handbid-ticket-button="up"]').live('click', function (e) {

                e.preventDefault();

                var parentBlock = $(this).parents(".ticket-part-container").eq(0),
                    otherButton = $("[data-handbid-ticket-button='down']", parentBlock).eq(0),
                    quantityBlock = $("[data-handbid-ticket-quantity]", parentBlock).eq(0),
                    remainingBlock = $("[data-handbid-tickets-remaining]", parentBlock).eq(0),
                    quantity = parseInt(quantityBlock.html()),
                    remainingSymb = remainingBlock.val(),
                    remaining = parseInt(remainingBlock.val()),
                    itemStep = 1;

                var newValue = quantity + itemStep;
                if (newValue <= remaining || (remainingSymb == "-1" || remainingSymb == "∞")) {
                    quantityBlock.html(newValue);
                    handbidLoginMain.recalculateTotalTicketsPrice();
                    otherButton.removeClass("ghosted-out");

                    if (newValue + itemStep > remaining && !(remainingSymb == "-1" || remainingSymb == "∞")) {
                        $(this).addClass("ghosted-out");
                    }
                }

            });

            $('[data-handbid-ticket-button="down"]').live('click', function (e) {

                e.preventDefault();

                var parentBlock = $(this).parents(".ticket-part-container").eq(0),
                    otherButton = $("[data-handbid-ticket-button='up']", parentBlock).eq(0),
                    quantityBlock = $("[data-handbid-ticket-quantity]", parentBlock).eq(0),
                    remainingBlock = $("[data-handbid-tickets-remaining]", parentBlock).eq(0),
                    quantity = parseInt(quantityBlock.html()),
                    remaining = parseInt(remainingBlock.val()),
                    itemStep = 1;

                var newValue = quantity - itemStep;
                if (newValue >= 0) {
                    quantityBlock.html(newValue);
                    handbidLoginMain.recalculateTotalTicketsPrice();
                    otherButton.removeClass("ghosted-out");

                    if (newValue - itemStep < 0) {
                        $(this).addClass("ghosted-out");
                    }
                }
            });

            $('#hb-purchase-tickets-next').live('click', function (e) {
                e.preventDefault();
            });

        },


        payForTicketsAllCard: function (button) {


            if(!button.hasClass('active')) {


                var auctionId  = $("#confirm-add-to-auction-id").val();
                var cardSelect = $("#tickets-payment-card");
                var cardText = $("#tickets-payment-card option:selected").text();
                var cardId     = cardSelect.val();
                var cardNamePlace = $('span[data-card-number]');
                cardNamePlace.html(cardText);

                var nextPopupWindow = "process-success";
                var processErrorBox = $('.process-message-error');

                if(cardId) {

                    button.addClass('active');
                    var dataAct = {
                        action   : "handbid_ajax_pay_for_tickets_by_card",
                        auctionId: auctionId,
                        cardId   : cardId
                    };

                    $.post(
                        ajaxurl,
                        dataAct,
                        function (data) {
                            button.removeClass('active');
                            data = JSON.parse(data);

                            if (data.result != undefined) {

                                if (data.result.data != undefined && data.result.data.error != undefined) {

                                    var payment_error_messages = [];

                                    for (var propertyName in data.result.data.error) {

                                        var value = data.result.data.error[propertyName];

                                        payment_error_messages.push('<b>' + propertyName + ':</b> ' + value);
                                    }

                                    processErrorBox.html(payment_error_messages.join('<br>'));
                                    nextPopupWindow = "process-error";
                                }
                                else {
                                    if (data.result.paid) {
                                        nextPopupWindow = "process-success";

                                        $('.hide-if-no-tickets').show();
                                        $('.last-screen-title').html('Successfully Processed!');

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

                            handbidLogin.displaySpecifiedTabOfLoginPopup(nextPopupWindow);
                        }
                    );
                }
                else{
                    processErrorBox.html('There is no card selected');
                    handbidLogin.displaySpecifiedTabOfLoginPopup("process-error");
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
                handbidLogin.displaySpecifiedTabOfLoginPopup(tabName);
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
                handbidLogin.tryToLogin($(this));
            }
        });

        $('[data-handbid-modal-key="login-modal"] .modal-close').on('click', function () {
            handbidLogin.restoreInitialTabState();
            var reloadHref = $(this).data("reload-href");
            if(reloadHref != undefined){
                window.location = reloadHref;
            }
        });

        $('.copyable-field').on('focusout', function () {
            handbidLogin.copyToConfirmField($(this));
        });

        $('.login-popup-link.register-next').on('click', function (e) {
            e.preventDefault();
            if (handbidLogin.registerFieldsValidation("register-form")) {
                var tabName = $(this).data("target-tab");
                handbidLogin.displaySpecifiedTabOfLoginPopup(tabName);
            }
        });

        $('#hb-purchase-tickets-back').on('click', function (e) {
            e.preventDefault();
            handbidLogin.displaySpecifiedTabOfLoginPopup('process-success');
        });

        $('#hb-purchase-tickets-next').on('click', function (e) {
            e.preventDefault();
            handbidLogin.loadCheckedTicketsForConfirmation();
            handbidLogin.displaySpecifiedTabOfLoginPopup('confirm-purchase');
        });

        $('#hb-confirm-tickets-back').on('click', function (e) {
            e.preventDefault();
            handbidLogin.displaySpecifiedTabOfLoginPopup('purchase-tickets');
        });

        $('#hb-pay-tickets-skip').on('click', function (e) {
            e.preventDefault();
            handbidLogin.displaySpecifiedTabOfLoginPopup('process-success');
        });

        $('#hb-confirm-tickets-pay').on('click', function (e) {
            e.preventDefault();
            handbidLogin.displaySpecifiedTabOfLoginPopup('process-payment');
        });

        $('.login-popup-link.register-confirm').on('click', function (e) {
            e.preventDefault();
            if (handbidLogin.registerFieldsValidation("register-form-confirm")) {
                handbidLogin.tryToRegister($(this));
                var tabName = $(this).data("target-tab");
                //handbidLogin.displaySpecifiedTabOfLoginPopup(tabName);
            }
        });

        $('#hb-tickets-add-card').on('click', function (e) {
            e.preventDefault();
            handbidModalsMain.showSingleModal('credit-card-form');
        });

        $('#hb-tickets-make-payment').on('click', function (e) {
            e.preventDefault();
            handbidLogin.payForTicketsAllCard($(this));
        });

        $('#hb-ticket-payment-error-card').on('click', function (e) {
            e.preventDefault();
            handbidModalsMain.showSingleModal('credit-card-form');
            handbidLogin.displaySpecifiedTabOfLoginPopup('process-payment');
        });

        $('#hb-ticket-payment-error-back').on('click', function (e) {
            e.preventDefault();
            handbidLogin.displaySpecifiedTabOfLoginPopup('process-payment');
        });

        $('.reset-password-link').on('click', function (e) {
            handbidLogin.resendPasswordLink($(this));
        });

        $('#start-enter-card-button').on('click', function (e) {
            handbidLogin.requestToAddCC($(this));
        });

        $('#hb-text-a-link').on('click', function (e) {
            handbidLogin.sendTextLinkSms($(this));
        });

        handbidLoginMain = handbidLogin;

    });

})(jQuery);