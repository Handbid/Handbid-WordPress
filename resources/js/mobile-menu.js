/**
 * Created by dev on 3/9/16.
 */

(function ($) {

    $(document).ready(function () {
        //    Mobile menu

        var $mobileMenu = $(".mobile-menu");


        $mobileMenu.find('a[data-slider-nav-key]').on("click", function() {
            var profileLinkVisible = $('.slider-nav[data-slider-nav-id="bidder-dashboard"] .slider-nav-mobile a[data-slider-nav-key="profile-user-info"]'),
                key                = $(this).attr('data-slider-nav-key');

            if (!$('.slider-nav[data-slider-nav-id="bidder-dashboard"]').has('.active-slide').length) {
                profileLinkVisible[0].click();
            }

            $('.slider-nav[data-slider-nav-id="bidder-dashboard-inner"] [data-slider-nav-key="' + key + '"]')[0].click();

            $('html,body').animate({scrollTop: profileLinkVisible.offset().top},'normal');
        });
    });

}(jQuery));
