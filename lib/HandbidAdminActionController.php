<?php

class HandbidAdminActionController
{

    public $viewRenderer;

    public function __construct(HandbidViewRenderer $viewRenderer)
    {
        $this->viewRenderer = $viewRenderer;
    }

    function init()
    {
        add_action('admin_init', [$this, 'initAdminArea']);
        add_action('admin_menu', [$this, 'initAdminMenu']);
    }

    function initAdminMenu()
    {
        add_menu_page(
            'Handbid',
            'Handbid',
            'administrator',
            'handbid-admin-dashboard',
            [$this, 'adminSettingsAction'],
            plugins_url() . '/handbid/public/images/favicon.png'
        );
    }

    function initAdminArea()
    {
        add_action('admin_footer', [$this, 'initAdminJavascript']);
        $this->registerPluginSettings();
    }

    function initAdminJavascript()
    {

        $scripts = ['handbidAdmin' => 'public/js/handbidAdmin.js'];

        foreach ($scripts as $key => $sc) {
            wp_register_script($key, plugins_url() . '/handbid/' . $sc);
            wp_enqueue_script($key);
        }

        wp_localize_script(
            'handbidAdmin',
            'handbidAdmin',
            [
                'endpoint' => admin_url('admin-ajax.php')
            ]
        );

    }

    function registerPluginSettings()
    {

        // Registering Handbid admin setting fields
        $settings = [
            'handbidRestEndpoint',
            'handbidFacebookAppId',
            'handbidDefaultAuctionKey',
            'handbidJs'
        ];

        forEach ($settings as $setting) {
            register_setting('handbid-admin', $setting);
        }
    }

    function adminSettingsAction()
    {
        echo $this->viewRenderer->render('views/admin/settings');
    }

}