/**
 * @copyright Copyright (c) 2014-2015 Handbid Inc.
 * @category handbid
 * @package Handbid2-WordPress
 * @license Proprietary
 * @link http://www.handbid.com/
 * @author Master of Code (worldclass@masterofcode.com)
 */

(function ($) {

    $(document).ready(function () {

        $('[data-tooltip-wrapper]').on('hover', function() {

            $(this).addClass('simple-tooltip-showing');

        });

        $('[data-tooltip-wrapper]').on('click', function() {

            var delay   = $(this).attr('data-tooltip-delay'),
                wrapper = $(this);

            $(this).attr('tooltip-clicked', true);


            if(delay == undefined) {
                delay = 3000;
            }

            $(this).addClass('simple-tooltip-showing');

            setTimeout(function() {

                wrapper.removeClass('simple-tooltip-showing');
                wrapper.removeAttr('tooltip-clicked');

            }, delay);

        });

        $('[data-tooltip-wrapper]').on('mouseleave', function() {

            if($(this).attr('tooltip-clicked') == undefined) {

                $(this).removeClass('simple-tooltip-showing');

            }

        });

    });

}(jQuery));
