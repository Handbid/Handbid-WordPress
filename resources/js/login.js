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
                handbidLogin.getTicketsForAuction();
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

        changeToTutorialTabState: function () {
            this.displaySpecifiedTabOfLoginPopup("tutorial-info-1");
            $(".cleanable-input").val("");
            $(".to-hide-block").hide();
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

        formatRepo: function (repo) {
            return repo.name + " ("+repo.totalItems+" items, by "+repo.organization+")";
        },

        formatRepoSelection: function (repo) {
            //console.log(repo);
            if(repo.auctionGuid != undefined){
                $(repo.inputIt).val(repo.auctionGuid);
                $("#confirm-add-to-auction-slug").val(repo.key);
                $("#confirm-add-to-auction-name").val(repo.name);
            }
            if(repo.text != "----") {
                $(".loadAuctionsToAutoCompleteRegisterTextContainer").show();
                $(".loadAuctionsToAutoCompleteRegisterText").html(repo.name);
                $(".loadAuctionsToAutoCompleteRegisterSelectContainer").hide();
                $(".loadAuctionsToAutoCompleteConfirmTextContainer").show();
                $(".loadAuctionsToAutoCompleteConfirmText").html(repo.name);
                $(".loadAuctionsToAutoCompleteConfirmSelectContainer").hide();
            }
            return repo.name;
        },

        loadAuctionsToAutoComplete: function (select) {
            //console.log(select);
            var nonce = select.data("auto-complete-nonce");
            var selectIt = select.data("auto-complete-select");
            var inputIt = select.data("auto-complete-input");

            select.select2({
                ajax: {
                    url: ajaxurl,
                    action: 'handbid_load_auto_complete_auctions',
                    //dataType: 'json',
                    delay: 250,
                    data: function (params) {
                        return {
                            q: params.term, // search term
                            page: params.page,
                            nonce: nonce,
                            selectIt: selectIt,
                            inputIt: inputIt,
                            action: 'handbid_load_auto_complete_auctions'
                        };
                    },
                    processResults: function (data, page) {
                        var items;
                        try {
                            data = JSON.parse(data);
                            items = data.items;
                        }
                        catch (e) {
                            items = [];
                        }
                        //console.log(items);

                        return {
                            results: items
                        };
                    },
                    escapeMarkup: function (markup) {
                        return markup;
                    }, // let our custom formatter work
                    cache: true
                },
                //escapeMarkup: function (markup) { return markup; }, // let our custom formatter work
                minimumInputLength: 1,
                templateResult: handbidLogin.formatRepo, // omitted for brevity, see the source of this page
                templateSelection: handbidLogin.formatRepoSelection // omitted for brevity, see the source of this page
            });
        },

        loadAuctionsByShortCode: function (button) {
            var inviteCode = $("#inviteShortCodeInput").val();
            var nonce = button.data("check-invite-nonce");

            var errorBlock = $(".invite-code-tab .errorsRow");

            var inputsForValues = $(".autoCompleteHiddenRegister, .autoCompleteHiddenConfirm");
            var textElem = $(".loadAuctionsToAutoCompleteRegisterText, .loadAuctionsToAutoCompleteConfirmText");
            var textContainers = $(".loadAuctionsToAutoCompleteRegisterTextContainer, .loadAuctionsToAutoCompleteConfirmTextContainer");
            var selectContainers = $(".loadAuctionsToAutoCompleteRegisterSelectContainer, .loadAuctionsToAutoCompleteConfirmSelectContainer");

            button.addClass("active");
            $.post(ajaxurl,
                {
                    action: "handbid_load_shortcode_auctions",
                    inviteCode: inviteCode,
                    nonce: nonce
                },
                function (data) {
                    console.log(data);
                    data = JSON.parse(data);
                    button.removeClass("active");
                    if (data.items != undefined && data.items.length > 0) {
                        errorBlock.slideUp("normal");
                        var repo = data.items[0];

                        inputsForValues.val(repo.auctionGuid);
                        textElem.html(repo.name);
                        textContainers.show();
                        selectContainers.hide();
                        handbidLogin.displaySpecifiedTabOfLoginPopup("register-form");
                    }
                    else{
                        errorBlock.slideDown("normal");
                    }
                }
            );
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
                    console.log(data);
                    data = JSON.parse(data);
                    button.removeClass("active");
                    if (data.success) {
                        isCurrentlyLoggingIn.children("h3").html("Successfully Logged In. Redirecting");
                        errorBlock.slideUp("normal");
                        window.location = redirect;
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
            var countryCode = $("#confirm-phone-code").val();
            var mobile = handbidLogin.getPhoneNumber($("#confirm-phone-number").val());
            var deviceType = $("#confirm-phone-type").val();
            var auctionID = $("#confirm-add-to-auction-id").val();
            var auctionGuid = $("#confirm-add-to-auction").val();
            var auctionSlug = $("#confirm-add-to-auction-slug").val();
            var auctionName = $("#confirm-add-to-auction-name").val();
            var nonce = $("#hb-reg-form-nonce").val();

            var errorRow = $("[data-tab-name='register-form-confirm'] .errorsRow").eq(0);
            var errorsContainer = $("[data-tab-name='register-form-confirm'] .errorsContainer").eq(0);


            button.addClass("active");
            $.post(ajaxurl,
                {
                    action: action,
                    firstname: firstname,
                    lastname: lastname,
                    password: password,
                    email: email,
                    countryCode: countryCode,
                    mobile: mobile,
                    deviceType: deviceType,
                    auctionGuid: auctionGuid,
                    auctionSlug: auctionSlug,
                    auctionName: auctionName,
                    nonce: nonce
                },
                function (data) {
                    console.log(data);
                    data = JSON.parse(data);
                    console.log(data);
                    button.removeClass("active");
                    if(data.success){
                        errorRow.hide();
                        errorsContainer.html("");
                        var nameContainer = $("#reg-complete-name");
                        var auctionNameContainer = $("#reg-complete-auction");
                        var paddleNumberContainer = $("#reg-paddle-number");
                        var paddleContainer = $("#reg-complete-have-paddle-number");
                        var closeButton = $("[data-handbid-modal-key='login-modal'] .modal-close").eq(0);
                        var startBiddingButton = $("#start-bidding-button");
                        nameContainer.html(data.values.firstname + " " + data.values.lastname);
                        if((auctionSlug == undefined || auctionSlug.trim() == "") && currentAuctionKey != undefined){
                            auctionSlug = currentAuctionKey;
                        }

                        var auctionUrl = "/auctions/" + auctionSlug;
                        if(data.profile.data.currentPaddleNumber){
                            var paddleNumber = data.profile.data.currentPaddleNumber,
                                profileID = data.profile.data.identity,
                                bidCookieKey = "bidder-"+profileID+"-bidding-in-auction-"+auctionID;

                            startBiddingButton.attr("href", auctionUrl);
                            closeButton.attr("data-reload-href", auctionUrl);
                            auctionNameContainer.html(auctionName);
                            paddleNumberContainer.html(paddleNumber);
                            paddleContainer.show();
                            $.cookie(bidCookieKey, paddleNumber, { expires: cookieExpire, path: '/' });

                        }
                        else{
                            startBiddingButton.attr("href", auctionUrl);
                            closeButton.attr("data-reload-href", auctionUrl);
                            paddleContainer.hide();
                        }

                        var addNewCCBlock = $('#reg-complete-add-card');

                        var auctionRequiresCC = addNewCCBlock.hasClass('add-new-cc-to-register');

                        handbidLogin.requestToAddCCAfter(!auctionRequiresCC);

                        var buyingTickets = false;

                        if(buyingTickets){
                            handbidLogin.displaySpecifiedTabOfLoginPopup("purchase-tickets");
                        }
                        else {
                            handbidLogin.displaySpecifiedTabOfLoginPopup("register-complete");
                        }
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
            //console.log(nonce);
            button.addClass("active");
            $.post(ajaxurl,
                {
                    action: "handbid_ajax_reset_password",
                    emailOrPhone: emailOrPhone,
                    nonce: nonce
                },
                function (data) {
                    console.log(data);
                    data = JSON.parse(data);
                    console.log(data);
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

            var auction_id = 7;

            var tickets_container = $('.tickets-on-register .tickets-container');
            var buy_button = $('#hb-purchase-tickets-next');

            tickets_container.html();
            tickets_container.addClass('loading');

            $.post(ajaxurl,
                   {
                       action: "handbid_ajax_get_auction_tickets",
                       auction_id: auction_id
                   },
                   function (data) {

                       data = JSON.parse(data);
                       console.log(data);

                       tickets_container.removeClass('loading');

                       tickets_container.html(data.result);

                       if(data.success){
                           handbidLogin.setupTicketsPurchasing();
                           buy_button.removeAttr('disabled');
                       }
                       else{
                           buy_button.attr('disabled', 'disabled');
                       }
                   }
            );

        },

        recalculateTotalTicketsPrice: function(){

            var totalPrice = 0;
            var totalQuantity = 0;
            var prices = $.map($("[data-handbid-ticket-id]"), function (val, i) {
                var parentBlock = $(val),
                    quantityBlock = $("[data-handbid-ticket-quantity]", parentBlock).eq(0),
                    quantity = parseInt(quantityBlock.html()),
                    itemID = parseInt(parentBlock.data("handbid-ticket-id")),
                    itemPrice = parseInt(parentBlock.data("handbid-ticket-price")),
                    itemTitle = $("[data-handbid-ticket-title]", parentBlock).eq(0).html();
                totalPrice += quantity * itemPrice;
                totalQuantity += quantity;
                return (quantity > 0) ? {id: itemID, price: itemPrice, quantity: quantity, name: itemTitle} : null;
            });
            totalPrice = handbidMain.number_format(totalPrice, 0, ".", ",");
            $("[data-handbid-tickets-total]").html(totalPrice);
            $("[data-handbid-tickets-quantity]").html(totalQuantity);
            return prices;
        },


        setupTicketsPurchasing: function () {

            $('[data-handbid-ticket-button="up"]').live('click', function (e) {

                e.preventDefault();

                var parentBlock = $(this).parents("[data-handbid-ticket-id]").eq(0),
                    otherButton = $("[data-handbid-ticket-button='down']", parentBlock).eq(0),
                    quantityBlock = $("[data-handbid-ticket-quantity]", parentBlock).eq(0),
                    remainingBlock = $("[data-handbid-tickets-remaining]", parentBlock).eq(0),
                    quantity = parseInt(quantityBlock.html()),
                    remainingSymb = remainingBlock.val(),
                    remaining = parseInt(remainingBlock.val()),
                    itemStep = parseInt(parentBlock.data("handbid-ticket-step"));

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

                var parentBlock = $(this).parents("[data-handbid-ticket-id]").eq(0),
                    otherButton = $("[data-handbid-ticket-button='up']", parentBlock).eq(0),
                    quantityBlock = $("[data-handbid-ticket-quantity]", parentBlock).eq(0),
                    remainingBlock = $("[data-handbid-tickets-remaining]", parentBlock).eq(0),
                    quantity = parseInt(quantityBlock.html()),
                    remaining = parseInt(remainingBlock.val()),
                    itemStep = parseInt(parentBlock.data("handbid-ticket-step"));

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

            $('#hb-purchase-tickets-back').live('click', function (e) {
                e.preventDefault();
            });

            $('#hb-purchase-tickets-next').live('click', function (e) {
                e.preventDefault();
            });

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

        $('.login-popup-link.register-confirm').on('click', function (e) {
            e.preventDefault();
            if (handbidLogin.registerFieldsValidation("register-form-confirm")) {
                handbidLogin.tryToRegister($(this));
                var tabName = $(this).data("target-tab");
                //handbidLogin.displaySpecifiedTabOfLoginPopup(tabName);
            }
        });

        $('.loadAuctionsToAutoComplete').each(function (e) {
            handbidLogin.loadAuctionsToAutoComplete($(this));
        });

        $('.inviteShortCodeButton').live("click", function (e) {
            e.preventDefault();
            handbidLogin.loadAuctionsByShortCode($(this));
        });

        $('.reset-password-link').on('click', function (e) {
            handbidLogin.resendPasswordLink($(this));
        });

        $('#start-enter-card-button').on('click', function (e) {
            handbidLogin.requestToAddCC($(this));
        });

        $('.exit-tutorial-link').on('click', function (e) {
            $("[data-handbid-modal-key='login-modal'] .modal-close").click();
        });

        $('.change-auto-complete-auction').on('click', function (e) {
            e.preventDefault();
            $(".loadAuctionsToAutoCompleteConfirmTextContainer").hide();
            $(".loadAuctionsToAutoCompleteConfirmText").html("");
            $(".loadAuctionsToAutoCompleteConfirmSelectContainer").show();
            $(".autoCompleteHiddenConfirm").val("");
            $(".loadAuctionsToAutoCompleteRegisterTextContainer").hide();
            $(".loadAuctionsToAutoCompleteRegisterText").html("");
            $(".loadAuctionsToAutoCompleteRegisterSelectContainer").show();
            $(".autoCompleteHiddenRegister").val("");
        });

        handbidLoginMain = handbidLogin;

    });

})(jQuery);