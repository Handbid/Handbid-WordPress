<?php

class HandbidAdminActionController {

    public $viewRenderer;

    public function __construct(HandbidViewRenderer $viewRenderer) {
        $this->viewRenderer = $viewRenderer;
    }

    function init() {

        add_action('wp_ajax_test_app_creds', [ $this, 'testAppCredsAjax' ]);
        add_action( 'admin_menu', [ $this, 'initAdminArea' ] );
        add_action( 'admin_footer', [ $this, 'initAdminJavascript' ] );
        $this->registerPluginSettings();
    }

    function testAppCredsAjax() {

    }
    function initAdminArea() {
        add_menu_page('Handbid', 'Handbid', 0, 'handbid-admin-dashboard', [ $this, 'adminSettingsAction' ], plugins_url() .'/Handbid-Wordpress/public/images/favicon.png');

    }
    function initAdminJavascript() {

        $scripts = array('handbidAdmin' => 'public/js/handbidAdmin.js');

        foreach($scripts as $key=>$sc)
        {

            wp_register_script($key, plugins_url() . '/Handbid-Wordpress/' . $sc);
            wp_enqueue_script($key);
        }

        wp_localize_script('handbidAdmin', 'handbidAdmin', [
            'endpoint' => admin_url( 'admin-ajax.php' )
        ]);

    }
    function registerPluginSettings() {
        register_setting( 'handbid-application', 'handbidAppId');   // get_option('handbidAppId');
        register_setting( 'handbid-application', 'handbidApiKey');  // get_option('handbidApiKey');
    }
    function adminSettingsAction() {
        return $this->viewRenderer->render('views/admin/settings');
    }
}