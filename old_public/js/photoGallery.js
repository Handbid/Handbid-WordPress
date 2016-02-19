/**
 * @copyright Copyright (c) 2014-2015 Handbid Inc.
 * @category handbid
 * @package Handbid2-WordPress
 * @license Proprietary
 * @link http://www.handbid.com/
 * @author Master of Code (worldclass@masterofcode.com)
 */

var $j = jQuery.noConflict();

$j(function () {

    var $unslider = $j('.banner');
    $unslider.unslider({
        speed: 500,               //  The speed to animate each slide (in milliseconds)
        delay: 6000,              //  The delay between slide animations (in milliseconds)
        keys:  true,              //  Enable keyboard (left, right) arrow shortcuts
        fluid: false              //  Support responsive design. May break non-responsive designs
    });

    $j('.unslider-arrow').click(function () {
        var fn = this.className.split(' ')[1];

        //  Either do unslider.data('unslider').next() or .prev() depending on the className
        $unslider.data('unslider')[fn]();
    });
});

