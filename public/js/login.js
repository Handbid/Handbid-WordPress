/**
 * @copyright Copyright (c) 2014-2015 Handbid Inc.
 * @category handbid
 * @package Handbid2-WordPress
 * @license Proprietary
 * @link http://www.handbid.com/
 * @author Master of Code (worldclass@masterofcode.com)
 */
var handbidLoginMain;
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
        },

        registerFieldsValidation: function (tabName) {
            var valid = true;
            var field, fieldType, passField, passConfirm;
            var errorRow = $("." + tabName + " .errorsRow").eq(0);
            var errorsContainer = $("." + tabName + " .errorsContainer").eq(0);
            errorsContainer.html("");


            $("." + tabName + " input[required]").each(function () {
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


            $("." + tabName + " input.is-email").each(function () {
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


            if (tabName == "register-tab") {
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
            var nonce = $("#hb-login-form-nonce").val();
            var redirect = $("#hb-login-form-redirect").val();

            var errorBlock = $(".login-modal-tab .errorsRow");

            if(!handbidLogin.validEmail(username)){
                username = handbidLogin.getPhoneNumber(username);
            }

            button.addClass("active");
            $.post(ajaxurl,
                {
                    action: action,
                    username: username,
                    password: password,
                    nonce: nonce
                },
                function (data) {
                    console.log(data);
                    data = JSON.parse(data);
                    button.removeClass("active");
                    if (data.success) {
                        errorBlock.slideUp("normal");
                        window.location = redirect;
                    }
                    else{
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
            var auctionGuid = $("#confirm-add-to-auction").val();
            var auctionSlug = $("#confirm-add-to-auction-slug").val();
            var auctionName = $("#confirm-add-to-auction-name").val();
            var nonce = $("#hb-reg-form-nonce").val();

            var errorRow = $(".register-confirm-tab .errorsRow").eq(0);
            var errorsContainer = $(".register-confirm-tab .errorsContainer").eq(0);


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
                        var closeButton = $(".handbid-modal.user-modal.login-modal-tab .modal-close").eq(0);
                        var startBiddingButton = $("#start-bidding-button");
                        nameContainer.html(data.values.firstname + " " + data.values.lastname);
                        if((auctionSlug == undefined || auctionSlug.trim() == "") && currentAuctionKey != undefined){
                            auctionSlug = currentAuctionKey;
                        }

                        var auctionUrl = "/auctions/" + auctionSlug;
                        if(data.profile.data.currentPaddleNumber){
                            startBiddingButton.attr("href", auctionUrl);
                            closeButton.attr("data-reload-href", auctionUrl);
                            auctionNameContainer.html(auctionName);
                            paddleNumberContainer.html(data.profile.data.currentPaddleNumber);
                            paddleContainer.show();
                        }
                        else{
                            startBiddingButton.attr("href", auctionUrl);
                            closeButton.attr("data-reload-href", auctionUrl);
                            paddleContainer.hide();
                        }
                        handbidLogin.displaySpecifiedTabOfLoginPopup("register-complete");
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
            var errorBlock = $(".forgot-pass-tab .errorsRow");
            //console.log(nonce);
            button.addClass("active");
            $.post(ajaxurl,
                {
                    action: "handbid_ajax_reset_password",
                    emailOrPhone: emailOrPhone,
                    nonce: nonce
                },
                function (data) {
                    //console.log(data);
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

        $('.handbid-modal .modal-close').on('click', function () {
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
            if (handbidLogin.registerFieldsValidation("register-tab")) {
                var tabName = $(this).data("target-tab");
                handbidLogin.displaySpecifiedTabOfLoginPopup(tabName);
            }
        });

        $('.login-popup-link.register-confirm').on('click', function (e) {
            e.preventDefault();
            if (handbidLogin.registerFieldsValidation("register-confirm-tab")) {
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

        $('.exit-tutorial-link').on('click', function (e) {
            $(".handbid-simplified-login-modal .modal-close").click();
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