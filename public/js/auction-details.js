/**
 * @copyright Copyright (c) 2014-2015 Handbid Inc.
 * @category handbid
 * @package Handbid2-WordPress
 * @license Proprietary
 * @link http://www.handbid.com/
 * @author Master of Code (worldclass@masterofcode.com)
 */

var timerForSearch;
(function ($) {


    var mobilecheck = function () {
        var check = false;
        (function(a,b){if(/(android|bb\d+|meego).+mobile|ipad|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
        return check;
    };

    "use strict";

    /**
     * Stick controls. I take anything with class of "sticky" and assume the only element
     * in it as what you want to have "stick" as the user scrolls
     *
     * In other words, wrap node you want to stick to the screen in a div with a class of "sticky"
     *
     */
    $(document).ready(function () {


        $('.sticky').each(function (index, sticky) {

            var child = $('> *', sticky)[0],
                sticking = false,
                height,
                marginTop = 0, //used for "inner scroll" (when category list is taller than viewport)
                lastScroll = $(window).scrollTop(),
                topOffset = $(sticky).attr('data-sticky-margin-top');//from the dom's perspective, calling this
                                                                     // margin-top makes sense, but we are
                                                                     // setting the "top" property, so we'll
                                                                     // call it topOffset
            if (!topOffset) {
                topOffset = 0;
            } else {
                topOffset = parseInt(topOffset);
            }


            //lets only kick in if have scrolled far enough
            $(window).scroll(function () {

                var scrollTop = $(window).scrollTop(),
                    top = $(sticky).position().top - topOffset,
                    bottom,
                    maxBottom = $('.global-footer').position().top - 3,
                    visible = $(child).is(":visible"),
                    scrollDistance = scrollTop - lastScroll;


                if (!visible) {
                    return;
                }

                //if we are on a mobile device, turn sticky off
                if(mobilecheck()) {
                    return;
                }


                height = $(child).height() + parseInt($(child).css('padding-top')) + parseInt($(child).css('padding-bottom'));

                //are we scrolled to the point where we need to become sticky?
                if (scrollTop >= top && !sticking) {

                    sticking = true;

                    $(sticky).height(height);
                    //$(sticky).width($(child).width());

                    $(child).css({
                        position: 'fixed',
                        top: topOffset + 'px',
                        transition: 'none',
                        width: $(child).width() + 'px'
                    });


                    $(child).addClass('sticking');


                } else if (sticking && scrollTop < top) {

                    $(child).css({
                        position: '',
                        top: '',
                        marginTop: '',
                        width: '',
                        height: '',
                        zIndex: '',
                        backgroundColor: ''
                    });

                    marginTop = 0;
                    $(child).removeClass('sticking');
                    sticking = false;
                }

                //extra positioning (don't go too far, etc.)
                if (sticking) {

                    var viewPortHeight = $(window).height();

                    //height needs to include top offset from this point forward for caluclations
                    height = height + topOffset;

                    //is the stick child taller than our viewport
                    if (marginTop !== 0 || height > viewPortHeight) {

                        //are we sticking down past the bottom of the viewport and scrolling down
                        if (marginTop + height > viewPortHeight && scrollDistance > 0) {
                            marginTop -= scrollDistance;
                        }
                        //we are scrolling up and may need to slide down
                        else if (scrollDistance < 0 && marginTop < 0) {
                            marginTop -= scrollDistance;
                        }

                        //safety checks (clamp values)
                        if (marginTop > 0) {
                            marginTop = 0;
                        }

                        //new margin can never be less than the difference between our and the viewports height
                        else if (marginTop < viewPortHeight - height) {
                            marginTop = viewPortHeight - height;
                        }


                    }

                    //get the bottom of the child
                    bottom = scrollTop + marginTop + height;

                    //are we passed the footer?
                    if (bottom > maxBottom) {
                        marginTop = marginTop - (bottom - maxBottom);
                    }

                    $(child).css({
                        marginTop: marginTop + 'px'
                    });

                }

                //track progress
                lastScroll = scrollTop;

            });
        });

    });

    /**
     * Isotope filtering
     * @type {{}}
     */

    var filterItems = {},
        searchTerm = false,
        debounce = 500,
        searchTimeout,
        sortAscending,
        sortBy,
        sortData = {
            name: function (elem) {
                return $('h3 .nameLowerCase', elem).html();
            },
            price: function (elem) {
                return parseInt($('.currentItemPrice', elem).html().replace('$', ''));
            },
            bids: function (elem) {
                return parseInt($('.bids em', elem).html());
            }
        },
        iso;


    //sorting methods (these do not need to be on the window)
    window._sortNameAsc = function () {
        sortAscending = true;
        sortBy = 'name';
    };

    window._sortNameDesc = function () {
        sortAscending = false;
        sortBy = 'name';
    };

    window._sortPriceAsc = function () {
        sortAscending = true;
        sortBy = 'price';
    };

    window._sortPriceDesc = function () {
        sortAscending = false;
        sortBy = 'price';
    };

    window._sortBidsAsc = function () {
        sortAscending = true;
        sortBy = 'bids';
    };

    window._sortBidsDesc = function () {
        sortAscending = false;
        sortBy = 'bids';
    };


    //default sort name asc
    window._sortNameAsc();

    function escapeRegExp(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

    function prepareIsotope(){
        if (!iso) {

            iso = $('.item-list').isotope({
                itemSelector: '.simple-box',
                layoutMode: 'masonry',
                getSortData: sortData,
                sortAscending: sortAscending,
                sortBy: sortBy,
                masonry: {
                    columnWidth: '.sizer'
                }
            });

        }
        return true;
    }

    function showSearchPlaceholder(){
        var numItems = $('[data-handbid-item-box]:visible').length;
        if (numItems == 0) {
            $('.message-no-isotope-results').fadeIn('slow');
        }
        else{
            $('.message-no-isotope-results').fadeOut('fast');
        }
    }

    function showSearchPlaceholderCallBack(){
        if(timerForSearch != undefined){
            timerForSearch = undefined;
        }
        timerForSearch = setTimeout(showSearchPlaceholder, 1000);
    }


    function refreshSearchResults() {

        var selectors = [],
            selector;

        $.each(filterItems, function (key, value) {
            selectors.push(value);
        });

        selector = selectors.join('');

        //refresh with new options
        if (iso) {
            iso.isotope({
                sortAscending: sortAscending,
                sortBy: sortBy,
                filter: function () {

                    //text search
                    if (searchTerm) {

                        var regex = new RegExp(escapeRegExp(searchTerm), 'i'),
                            html = $(this).html();

                        if (regex && html && !regex.test(html)) {
                            return false;
                        }
                    }

                    return selector ? matchesSelector(this, selector) : true;
                }
            });

            showSearchPlaceholderCallBack();
        }
        return true;
    }

    function checkAndUpdateIsotope(){
        (iso) ? refreshSearchResults() : prepareIsotope() && refreshSearchResults();
    }

    $(document).ready(function () {

        var searchEnabled = true;
        //alert("ready");
        //prepareIsotope();
        //refreshSearchResults();

        //show iso on first load of items tab
        $('.slider-nav [data-slider-nav-key="items"]').on('click', function () {

            //prepareIsotope();

            var top = $(".sticky-for-sort-bar").offset().top;

            //scroll to filter bar
            if ($(window).scrollTop() > top) {
                $('html, body').animate({scrollTop: top}, 500);
            }

        });


        //search box
        $('.fancy-search .query').on('keydown', function (e) {

            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }

            var charCode = e.charCode || e.keyCode,
                go = function () {
                    searchTerm = $(this).val();

                    searchEnabled = false;
                    //reset filters whenever someone searches
                    $('.filters .section [data-selector="*"] a').click();
                    searchEnabled = true;


                    checkAndUpdateIsotope();
                }.bind(this);


            if (charCode === 13) {
                go();
                return false;
            }

            searchTimeout = setTimeout(go, debounce);

        });


        //hide/show reset button
        $('.fancy-search .query').on('keyup', function () {

            var val = $(this).val();

            if (!val || val.length === 0) {
                $('.fancy-search .reset').hide();
            } else {
                $('.fancy-search .reset').show();
            }

        });

        //reset search button
        $('.fancy-search .reset').on('click', function (e) {

            e.preventDefault();
            $('.fancy-search .query').val('');

            searchTerm = false;
            $(this).hide();

            checkAndUpdateIsotope();

        });

        //sort select
        $('select[name="sort"], select[name="mobile-sort"]').on('change', function () {
            var sort = $(this).val();
            if (window[sort]) {
                window[sort]();
                checkAndUpdateIsotope();
            } else {
                console.log('not found', sort);
            }
        });

        //the filter controls
        $('.filters .section').each(function (index, section) {

            var key = $(section).attr('data-section');

            $('[data-selector] a', section).on('click', function (e) {

                e.preventDefault();

                //remove select class
                $('[data-selector]', section).removeClass('selected');
                $(this).parent().addClass('selected');

                var selector = $(this).parent().attr('data-selector');

                //i want to ignore *'s
                if (selector === '*') {
                    delete filterItems[key];
                } else {
                    filterItems[key] = selector;
                }

                if (searchEnabled) {
                    $('.fancy-search .query').val('');
                    searchTerm = false;
                    checkAndUpdateIsotope();
                }

            });

        });

        //mobile filter controls
        $('select[name="mobile-type"], select[name="mobile-category"]').on('change', function () {

            var selector = $(this).val(),
                key = $(this).attr('name').split('-')[1];


            //i want to ignore *'s
            if (selector === '*') {
                delete filterItems[key];
            } else {
                filterItems[key] = selector;
            }

            if (searchEnabled) {
                $('.fancy-search .query').val('');
                searchTerm = false;
                checkAndUpdateIsotope();
            }

        });

        setTimeout(function() {
            var firstCatLink = $('ul.by-category li.selected a')[0];
            if(firstCatLink != undefined){
                firstCatLink.click();
            }
        }, 3500);


        //reset search button
        $('[data-slider-nav-key="items"]').on('click', function (e) {

            e.preventDefault();
            checkAndUpdateIsotope();

        });

        var wasNotVisible = true;

        $( window ).scroll(function() {
            if(wasNotVisible) {
                var container = $('.container[data-slider-nav-key="items"]');
                var isVisible = container.is(":visible");
                if (isVisible) {
                    checkAndUpdateIsotope();
                    wasNotVisible = false;
                }
            }
        });

    });


    $(window).load(function () {
        prepareIsotope();
        checkAndUpdateIsotope();
    });


}(jQuery));