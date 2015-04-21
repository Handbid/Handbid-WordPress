(function ($) {

    var handbidLogin = {

            displaySpecifiedTabOfLoginPopup: function (tabName){
                var loginModalTabs = $("container-tab");
                var currentTab = $(".active-container").eq(0);
                var neededTab = $("[data-tab-name="+tabName+"]");

                if(neededTab.length != 0){
                    currentTab.removeClass("active-container").slideUp("fast");
                    neededTab.addClass("active-container").slideDown("fast");
                }


            }
        };



    $(document).ready(function () {

        $('.has-popover').popover();

        $('.login-popup-link').on('click', function(e){
            e.preventDefault();
            var tabName = $(this).data("target-tab");
            handbidLogin.displaySpecifiedTabOfLoginPopup(tabName);
        });

    });

})(jQuery);