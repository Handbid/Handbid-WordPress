(function ($) {

    var handbidLogin = {

        displaySpecifiedTabOfLoginPopup: function (tabName) {
            var loginModalTabs = $("container-tab");
            var currentTab = $(".active-container").eq(0);
            var neededTab = $("[data-tab-name=" + tabName + "]");

            if (neededTab.length != 0) {
                currentTab.removeClass("active-container").slideUp("fast");
                neededTab.addClass("active-container").slideDown("fast");
            }
        },

        registerFieldsValidation: function (tabName) {
            var valid = true;
            var field, fieldType, passField, passConfirm;
            var errorRow = $("."+tabName+" .errorsRow").eq(0);
            var errorsContainer = $("."+tabName+" .errorsContainer").eq(0);
            errorsContainer.html("");


            $("."+tabName+" input[required]").each(function(){
                field = $(this);
                fieldType = field.attr("type");
                if((field.val().trim() == "")
                || (fieldType == "checkbox" && !field.is(":checked"))){
                    errorsContainer.append(field.data("required-message") + "<br>");
                    field.addClass("validation-error");
                    valid = false;
                }
                else{
                    field.removeClass("validation-error");
                }
            });


            $("."+tabName+" input.is-email").each(function(){
                field = $(this);
                var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
                if(field.val().trim() != "" && ! re.test(field.val())){
                    field.addClass("validation-email-error");
                    errorsContainer.append(field.data("not-email-message") + "<br>");
                    valid = false;
                }
                else{
                    field.removeClass("validation-email-error");
                }
            });



            if(tabName == "register-tab"){
                passField = $("#reg-password");
                passConfirm = $("#reg-password-confirm");
                if(passField.val() != passConfirm.val()){
                    errorsContainer.append(passConfirm.data("mismatch-message") + "<br>");
                    passField.addClass("validation-mismatch-error");
                    passConfirm.addClass("validation-mismatch-error");
                    valid = false;
                }
                else{
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
        },

        copyToConfirmField : function (input) {
            var selector = input.data("copy-to");
            $("#" + selector).val(input.val());
        },

        tryToLogin: function (button) {
            var action = $("#hb-login-form-action").val();
            var username = $("#hb-login-form-username").val();
            var password = $("#hb-login-form-password").val();
            var nonce = $("#hb-login-form-nonce").val();
            var redirect = $("#hb-login-form-redirect").val();

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
                    if(data.success){
                        window.location = redirect;
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
            var mobile = $("#confirm-phone-number").val();
            var deviceType = $("#confirm-phone-type").val();
            var auction = $("#confirm-add-to-auction").val();
            var nonce = $("#hb-reg-form-nonce").val();

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
                    nonce: nonce
                },
                function (data) {
                    console.log(data);
                    data = JSON.parse(data);
                    button.removeClass("active");
                }
            );
        }
    };


    $(document).ready(function () {

        $('.has-popover').popover();

        $('.login-popup-link').on('click', function (e) {
            e.preventDefault();
            if(! $(this).hasClass("register-next") && ! $(this).hasClass("register-confirm")) {
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
        });

        $('.copyable-field').on('focusout', function () {
            handbidLogin.copyToConfirmField($(this));
        });

        $('.login-popup-link.register-next').on('click', function (e) {
            e.preventDefault();
            if(handbidLogin.registerFieldsValidation("register-tab")) {
                var tabName = $(this).data("target-tab");
                handbidLogin.displaySpecifiedTabOfLoginPopup(tabName);
            }
        });

        $('.login-popup-link.register-confirm').on('click', function (e) {
            e.preventDefault();
            if(handbidLogin.registerFieldsValidation("register-confirm-tab")) {
                handbidLogin.tryToRegister($(this));
                var tabName = $(this).data("target-tab");
                //handbidLogin.displaySpecifiedTabOfLoginPopup(tabName);
            }
        });

    });

})(jQuery);