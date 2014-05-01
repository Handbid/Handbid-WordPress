var $j = jQuery.noConflict();

$j(function () {

    var $unslider = $j('.banner');
    $unslider.unslider({
        speed: 500,               //  The speed to animate each slide (in milliseconds)
        delay: 3000,              //  The delay between slide animations (in milliseconds)
        keys:  true,               //  Enable keyboard (left, right) arrow shortcuts
        fluid: false              //  Support responsive design. May break non-responsive designs
    });

    $j('.unslider-arrow').click(function () {
        var fn = this.className.split(' ')[1];

        //  Either do unslider.data('unslider').next() or .prev() depending on the className
        $unslider.data('unslider')[fn]();
    });
});

