<?php
/**
 * @copyright Copyright (c) 2014-2015 Handbid Inc.
 * @category handbid
 * @package Handbid2-WordPress
 * @license Proprietary
 * @link http://www.handbid.com/
 * @author Master of Code (worldclass@masterofcode.com)
 */

/**
 *
 * Class HandbidAdminActionController
 *
 * Handles all of the admin related actions, Controls the Handbid admin menu item and admin options
 *
 */
class HandbidAdminActionController
{

    public $viewRenderer;
    public $isLocalCopy;

    public function __construct(HandbidViewRenderer $viewRenderer, $isLocalCopy = false)
    {
        $this->viewRenderer = $viewRenderer;
        $this->isLocalCopy = $isLocalCopy;
    }

    function init()
    {
        add_action('admin_init', [$this, 'registerPluginSettings']);
        add_action('admin_menu', [$this, 'initAdminMenu']);
    }

    function initAdminMenu()
    {
        // Add in a Handbid menu item in the admin bar on the left
        add_menu_page(
            'Handbid', // Page Title
            'Handbid', // Menu Title
            'administrator', // Role of which user can view this menu
            'handbid-admin-dashboard', // url slug
            [$this, 'adminSettingsAction'], // Callback function
            plugins_url() . '/handbid/public/images/favicon.png' // image for menu item path
        );
    }

    function initAdminArea()
    {
        $this->registerPluginSettings();
    }

    function registerPluginSettings()
    {

        // Registering Handbid admin setting fields
        $settings = [
            'handbidRestEndpoint',
            'handbidFacebookAppId',
            'handbidDefaultAuctionKey',
            'handbidDefaultOrganizationKey',
            'handbidJs',
            'handbidShowOnlyMyOrganization',
            'handbidCdnEndpoint',
            'handbidDefaultColCount',
            'handbidDefaultColCountItem',
            'handbidDefaultPageSize',
            'handbidStripeMode',
        ];

        forEach ($settings as $setting) {
            register_setting('handbid-admin', $setting);
        }
    }

    function adminSettingsAction()
    {
        echo $this->viewRenderer->render('views/admin/settings',
            [
                "is_local" => $this->isLocalCopy
            ]
        );
    }

}