<?php

class HandbidAdminActionController {

    public $viewRenderer;

    public function __construct(HandbidViewRenderer $viewRenderer) {
        $this->viewRenderer = $viewRenderer;
    }

    function setupAdminJavascript() {
        $scripts = array('handbidAdmin' => 'public/js/handbidAdmin.js');

        foreach($scripts as $key=>$sc)
        {

            wp_register_script($key, plugins_url() . '/Handbid-Wordpress/' . $sc);
            wp_enqueue_script($key);
        }

//        wp_localize_script(
//            'handbidAdmin',
//            'handbid',
//            array(
//                'handbidAppId' => get_option('handbidAppId'),
//                'handbidApiKey' => get_option('handbidApiKey')
//            )
//        );

    }
    function setupAdminArea() {
        add_menu_page('Handbid', 'Handbid', 0, 'handbid-admin-dashboard', array($this, 'adminSettingsAction'), plugins_url() .'/Handbid-Wordpress/public/images/favicon.png');

    }
    function registerPluginSettings() {
        register_setting( 'handbid-application', 'handbidAppId');   // get_option('handbidAppId');
        register_setting( 'handbid-application', 'handbidApiKey');  // get_option('handbidApiKey');
    }
    function adminSettingsAction() {
        return $this->viewRenderer->render('views/admin/settings.phtml');
    }
}
