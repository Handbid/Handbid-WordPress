/**
 * @copyright Copyright (c) 2014-2015 Handbid Inc.
 * @category handbid
 * @package Handbid2-WordPress
 * @license Proprietary
 * @link http://www.handbid.com/
 * @author Master of Code (worldclass@masterofcode.com)
 */

(function ($) {


    "use strict";

    /**
     * Maps
     */
    $(document).ready(function () {

        var addy = $('.details-map').attr('data-address'),
            key = 'AIzaSyCHLASKZkAlS4aX2JCcnR9XVqkrPpfdvvw',
            small,
            smallOptions = {scrollwheel: false, zoom: 12, disableDefaultUI: true},
            large,
            center,
            geocoder,
            largeOptions = {scrollwheel: false, zoom: 17, disableDefaultUI: true};


        // selects all nav items, and groups them to their respective content
        $('.slider-nav [data-slider-nav-key="map"]').on('click', function () {

            if (!small) {

                window.getDirections = function () {

                    var myAddy = prompt('Enter your address.');

                    if (myAddy) {
                        window.open('https://maps.google.com/maps?saddr=' + myAddy + '&daddr=' + addy);
                    }
                };

                geocoder = new google.maps.Geocoder();

                small = new google.maps.Map($('#small-map')[0], smallOptions);
                large = new google.maps.Map($('#large-map')[0], largeOptions);

                geocoder.geocode({'address': addy}, function (results, status) {

                    if (status === google.maps.GeocoderStatus.OK) {

                        center = results[0].geometry.location;

                        small.setCenter(center);
                        large.setCenter(center);

                        new google.maps.Marker({
                            map: small,
                            icon: '/wp-content/themes/handbid/public/images/auction-details/small-pin.png',
                            position: results[0].geometry.location
                        });

                        var largeMarker = new google.maps.Marker({
                            map: large,
                            icon: '/wp-content/themes/handbid/public/images/auction-details/large-pin.png',
                            position: results[0].geometry.location
                        });

                        var infowindow = new google.maps.InfoWindow({
                            content: $('#map-marker-content').html()
                        });

                        google.maps.event.addListenerOnce(large, 'tilesloaded', function () {
                            setTimeout(function () {
                                infowindow.open(large, largeMarker);
                            }, 1000);
                        });

                    } else {
                        alert("Geocode was not successful for the following reason: " + status);
                    }
                });


            }


        });

    });



}(jQuery));