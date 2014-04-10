/**
 * Handle: handbidAdmin
 * Version: 0.0.1
 * Deps: $j
 * Enqueue: true
 */

var $j = jQuery.noConflict();

$j(function() {

        var appId = $j('input[name=handbidAppId]').val(),
            apiKey = $j('input[name=handbidApiKey]').val();

        $j('.testRestEndpoint').click( function() {
            var data = {
                appId: appId,
                apiKey: apiKey
            };


            $j.get( "http://google.com", data, success, "json" );
        } );

        function success( data ) {
            alert( data );
        }

});