<?php

class HandbidAdminActionController {

    public $viewRenderer;

    public function __construct(HandbidViewRenderer $viewRenderer) {
        $this->viewRenderer = $viewRenderer;
    }

    function init() {
        add_action( 'admin_init', [ $this, 'initAdminArea' ] );
        add_action( 'admin_menu', [ $this, 'initAdminMenu' ] );
        add_action( 'wp_ajax_test_app_creds', [ $this, 'testAppCredsAjax' ] );
    }

    function initAdminMenu() {
        add_menu_page('Handbid', 'Handbid', 'administrator', 'handbid-admin-dashboard', [ $this, 'adminSettingsAction' ], plugins_url() .'/handbid/public/images/favicon.png');
    }
    function initAdminArea() {
        add_action( 'admin_footer', [ $this, 'initAdminJavascript' ] );
        $this->registerPluginSettings();
    }

    function initAdminJavascript() {

        $scripts = [ 'handbidAdmin' => 'public/js/handbidAdmin.js' ];

        foreach($scripts as $key=>$sc)
        {
            wp_register_script($key, plugins_url() . '/handbid/' . $sc);
            wp_enqueue_script($key);
        }

        wp_localize_script('handbidAdmin', 'handbidAdmin', [
            'endpoint' => admin_url( 'admin-ajax.php' )
        ]);

    }

    function registerPluginSettings() {

        $settings = [
            'handbidConsumerKey',
            'handbidConsumerSecret',
            'handbidAuctionDetail',
            'handbidItemDetail',
            'handbidOrganization',
            'handbidRestEndpoint',
            'handbidFacebookAppId',
            'handbidOrganizationNotFound',
            'handbidAuctionNotFound',
            'handbidItemNotFound'
        ];

        forEach($settings as $setting) {
            register_setting('handbid-admin',$setting);
        }
    }

    function adminSettingsAction() {
        echo $this->viewRenderer->render('views/admin/settings');
    }
    function testAppCredsAjax() {
        $appId  = $_POST['appId'];
        $apiKey = $_POST['apiKey'];

        $hb = new \Handbid\Handbid($appId, $apiKey);

        try {

            $hb->testAppCreds();

            echo __('Your App is Valid');

        } catch (\Handbid\Exception\App $e) {
            echo $e->getMessage();
        }
        catch (\Exception $e)
        {
            echo $e->getMessage();
        }

        exit;
    }
}