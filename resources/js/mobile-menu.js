/**
 * Created by dev on 3/9/16.
 */

(function ($) {

    $(document).ready(function () {
        //    Mobile menu

        var $mobileMenu = $(".mobile-menu");


        $mobileMenu.find('a[data-slider-nav-key="see-my-receipt"]').on("click", function() {
            var profileLinkVisible = $('a[data-slider-nav-key="profile-user-info"]');
            profileLinkVisible.click();
            $(".quick-links").find('a[data-slider-nav-key="see-my-receipt"]').click();
            $('html,body').animate({scrollTop: profileLinkVisible.offset().top},'normal');
        });

        $mobileMenu.find('a[data-slider-nav-key="user-profile"]').on("click", function() {
            var profileLinkVisible = $('a[data-slider-nav-key="profile-user-info"]');
            profileLinkVisible.click();
            $(".quick-links").find('a[data-slider-nav-key="user-profile"]').click();
            $('html,body').animate({scrollTop: profileLinkVisible.offset().top},'normal');
        });

        $mobileMenu.find('a[data-slider-nav-key="update-credit-card"]').on("click", function() {
            var profileLinkVisible = $('a[data-slider-nav-key="profile-user-info"]');
            profileLinkVisible.click();
            $(".quick-links").find('a[data-slider-nav-key="update-credit-card"]').click();
            $('html,body').animate({scrollTop: profileLinkVisible.offset().top},'normal');
        });

        $mobileMenu.find('a[data-slider-nav-key="bidder-notifications"]').on("click", function() {
            var profileLinkVisible = $('a[data-slider-nav-key="profile-user-info"]');
            profileLinkVisible.click();
            $(".quick-links").find('a[data-slider-nav-key="bidder-notifications"]').click();
            $('html,body').animate({scrollTop: profileLinkVisible.offset().top},'normal');
        });
    });

}(jQuery));
