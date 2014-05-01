/**
 * Handle: handbidAdmin
 * Version: 0.0.1
 * Deps: $j
 * Enqueue: true
 */

var $j = jQuery.noConflict();

$j(function () {

    var appId = $j('input[name=handbidConsumerKey]').val(),
        apiKey = $j('input[name=handbidConsumerSecret]').val(),
        endpoint = handbidAdmin.endpoint;

    $j('.testRestEndpoint').click(function () {
        var data = {
            action: 'test_app_creds',
            appId:  appId,
            apiKey: apiKey
        };

        $j.post(endpoint, data, success);
    });

    function success(data) {
        alert(data);
    }

});