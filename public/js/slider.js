/**
 How to use, make sure the data-slider-nav-id's match

 <div class="slider-content col-md-8" data-slider-nav-id="{{data-slider-nav-id}}">
 <ul class="slider">
 <li data-slider-nav-key="{{slider-key}}">
 Nav Button
 </li>
 </ul>
 </div>

 <ul class="vertical-nav slider-nav auto-open col-md-12" data-slider-nav-id="{{data-slider-nav-id}}">
 <li>
 <a data-slider-nav-key="{{slider-key}}">
 <h4>Title</h4>
 Slide Content
 </a>
 </li>
 </ul>

 **/


(function ($) {

    $(document).ready(function () {

        var sliderDuration = 5000; // Slider Autoscroll Duration in milliseconds
        //var xhrUrl = function( url) {
        //    var result = null;
        //
        //    $.ajax({
        //        url: url,
        //        type: 'get',
        //        success: function(data) {
        //            result = data;
        //        }
        //    });
        //
        //    return result;
        //
        //};


        // Checks for XHR dom elements
//            nav.on('click', function() {
//                if(content.hasClass('active-slide') && content.attr('data-slider-href')) {
//                    var url = content.attr('data-slider-href');
//                    console.log(url);
//                    var data = xhrUrl(url);
//                    console.log(data);
//                }
//            });


        // Setup variables
        var navs = $('.slider-nav.auto-open'),
            viewportHeight = $(window).height(),
            delay = 1000,
            onScroll = function () {

                // Calculating maximum height before anything needs to be shown
                var activationTop = viewportHeight + $(window).scrollTop();

                // Loops through each slider nav and checks if it has been displayed, if not, show it
                navs.each(function (index, nav) {

                    if (!nav.beenShown) {

                        // Calculate the position of the navigation and the point at which to show the slide
                        var top = $(nav).position().top;
                        if (top < activationTop) {
                            // Wait for delay until showing the nav / slide
                            setTimeout(function () {
                                $($('[data-slider-nav-key]', nav)[0]).click();
                                resetProgressBar(nav);
                            }, delay);
                            nav.beenShown = true;
                        }
                    }
                });
            };


        // Arrow navigation
        $('.slider-nav [data-slider-nav-direction]').on('click', function (e) {

            e.preventDefault();

            var direction   = $(this).attr('data-slider-nav-direction'),
                nav         = $(this).closest('.slider-nav'),
                navId       = nav.attr('data-slider-nav-id'),
                activeSlide = $('.slider-nav[data-slider-nav-id="' + navId + '"] .active-slide'),
                el          = activeSlide;

            if(direction == "next" && activeSlide.next().length > 0) {
                el = activeSlide.next();
            }
            else if(direction == "next") {
                el = $('[data-slider-nav-key]:first-of-type', activeSlide.parent());
            }
            else if(direction == "prev" && activeSlide.prev().length > 0) {
                el = activeSlide.prev();
            }
            else if(direction == "prev") {
                el = $('[data-slider-nav-key]:last-of-type', activeSlide.parent());
            }
            resetProgressBar(nav);
            el.click();

        });


        // selects all nav items, and groups them to their respective content
        $('.slider-nav [data-slider-nav-key]').live('click', function () {

            var key        = $(this).attr('data-slider-nav-key'),
                parent     = $(this).closest('.slider-nav'),
                id         = $(parent).attr('data-slider-nav-id'),
                content    = $('.slider-content[data-slider-nav-id="' + id + '"] [data-slider-nav-key="' + key + '"]'),
                nav        = $('.slider-nav[data-slider-nav-id="' + id + '"] [data-slider-nav-key="' + key + '"]'),
                slide      = $('.slider-content[data-slider-nav=' + id + '] [data-slider-nav-key=' + key + ']'),
                toggleMode = parent.attr('data-toggle-mode'),
                hideOnly   = toggleMode && nav.hasClass('active-slide'),
                ignore     = $('.slider-content[data-slider-nav-id="' + id + '"] [data-slider-nav-key] [data-slider-nav-key]');

            // Clearing all active slides & navs
            $('.slider-content[data-slider-nav-id="' + id + '"] [data-slider-nav-key], .slider-nav[data-slider-nav-id="' + id + '"] [data-slider-nav-key]').not(ignore).removeClass('active-slide');

            // Set the selected elements class to active-slide
            if(!hideOnly) {
                var childNav      = $($(content).find('.slider-nav [data-slider-nav-key]')[0]),
                    hasActiveSlide = $(content).find('.slider-nav .active-slide').length > 0;

                if(childNav && !hasActiveSlide) {
                    $(childNav).click();
                }

                $(content).addClass('active-slide');
                $(nav).addClass('active-slide');
                resetProgressBar(nav);
            }

        });

        // slide navigation should be given the "data-slider-nav-item" attribute
        function progressBarAnimation() {

            var navId = $(this).closest('[data-slider-progress]').attr('data-slider-nav-id'),
                nav = $('.slider-nav[data-slider-nav-id="' + navId + '"]');

                if ($('.active-slide', nav).closest('[data-slider-nav-item]').next().length > 0) {
                    $('.active-slide', nav).closest('[data-slider-nav-item]').next().click();
                }
                else {
                    if ($('.active-slide', nav).length > 0) {
                        $($('[data-slider-nav-item]', nav)[0]).click();
                    }

                }

                //nextByNavId(navId,'next', 'li');
                $(this).css('width', 0);

            checkForSliderProgress();

        }

        function resetProgressBar(context) {

            if(context.length > 0) {

                var id = context.closest('.slider-nav').attr('data-slider-nav-id'),
                    progressBar = $('[data-slider-nav-id="' + id + '"][data-slider-progress] .slider-progress-bar');

                progressBar.stop();
                progressBar.css('width', 0);
                progressBar.animate({'width': '100%'}, sliderDuration, 'swing', progressBarAnimation.bind(progressBar));
            }

        };

        function checkForSliderProgress() {
            var progressContainer = $('.slider-content[data-slider-progress]');

            progressContainer.each(function(index, slider) {

                var progressBar = null;
                if($('.slider-progress-bar', slider).length == 1) {
                    progressBar = $('.slider-progress-bar', slider);
                }
                else
                {
                    progressBar = $('<div class="slider-progress-bar"></div>');
                    progressBar.appendTo(slider);
                }

                $(slider).on('mouseenter', function() {
                    progressBar.stop();
                });

                $(slider).on('mouseleave', function() {
                    progressBar.animate({'width': '100%'}, sliderDuration, 'swing', progressBarAnimation.bind(progressBar));
                });

                progressBar.animate({'width': '100%'}, sliderDuration, 'swing', progressBarAnimation.bind(progressBar));

            });

        }

        //function nextByNavId(navid, direction, selector) {
        //
        //    var nav         = $('.slider-nav[data-slider-nav-id=' + navid + ']'),
        //        activeSlide = $('.active-slide', nav),
        //        el          = activeSlide,
        //        slides      = $('data-slider-nav-key');
        //
        //    if(!direction) {
        //        direction = "next";
        //    }
        //
        //    if(selector) {
        //        activeSlide = $(selector);
        //    }
        //
        //    if(direction == "next" && activeSlide.next().length > 0) {
        //        console.log('in next');
        //        el = activeSlide.next();
        //    }
        //    else if(direction == "next") {
        //        console.log('next');
        //        el = $('[data-slider-nav-key]:first-of-type', activeSlide);
        //    }
        //    else if(direction == "prev" && activeSlide.prev().length > 0) {
        //        console.log('in prev');
        //        el = activeSlide.prev();
        //    }
        //    else if(direction == "prev") {
        //        console.log('prev');
        //        el = $('[data-slider-nav-key]:last-of-type', activeSlide.parent());
        //    }
        //
        //    el.click();
        //}

        //progressBar.appendTo(progressContainer);

        //function progress() {
        //    var val = progressbar("value") || 0;
        //
        //    progressbar("value", val + 1);
        //
        //    if (val < 99) {
        //        setTimeout(progress, 100);
        //    }
        //}
        //
        //setTimeout(progress, 3000);


        // Sometimes when people load the page they jump partway down, this will make sure anything
        // that is visible on page load animates in
        onScroll();

        // Make sure we check if we need to show a nav when the user scrolls
        $(window).scroll(onScroll);

        // Check for slider progress
        checkForSliderProgress();

    });
}(jQuery));