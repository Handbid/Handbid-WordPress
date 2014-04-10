<?php
/**
 * Plugin Name: Handbid
 * Author: Jon Hemstreet
 * Author URI: http://www.jonhemstreet.com
 * Version: 0.0.0.65
 * Description: Handbid is fully automated mobile silent auction software specifically designed to increase revenue,
 * drive bid activity, and maximize ROI for non-profits. Eliminating the need for paper bid sheets, Handbid empowers
 * users to bid using a mobile device, the web, or a tablet (kiosk) at the event. Bidders can enter bids remotely or
 * locally, manage their bids with proxy bidding, and instantly view status of all bids.
 *
 */

// Handbid Class Autoloader
$currentFile = __FILE__;
$currentFolder = dirname($currentFile);
$libFolder = $currentFolder . '/lib';

// Loop through lib directory autoloading files and require_once them
if ($handle = opendir($libFolder)) {
    while (false !== ($entry = readdir($handle))) {
        if($entry!="." && $entry!= ".."){
            require_once $libFolder . '/' . $entry;
        }
    }

    closedir($handle);
}

class Handbid {

    public $shortCodeController;
    public $viewRender;
    public $basePath;
    public $state;
    public $actionController;

    function __construct($options = null) {
        add_action( 'init', array( $this, 'init' ) );

        // Dependency Injection
        $this->basePath            = ($options['basePath']) ? $options['basePath'] : dirname(__FILE__);
        $this->viewRender          = ($options['viewRender']) ? $options['viewRender'] : $this->createViewRenderer();
        $this->state               = ($options['state']) ? $options['state'] : $this->state();
        $this->shortCodeController = ($options['createShortCodeController']) ? $options['createShortCodeController'] : $this->createShortCodeController();
        $this->actionController    = ($options['actionController']) ? $options['actionController'] : $this->createActionController();
    }

    function init() {

        // Add javascript
        add_action('wp_enqueue_scripts', array( $this, 'setupJavascript' ) );

        // Setup ShortCodes
        $this->setupShortCodes();

        add_action( 'admin_init', array( $this, 'registerPluginSettings' ) );
        add_action( 'admin_menu', array( $this, 'setupAdminArea' ) );

    }

    // Javascript
    function setupJavascript() {

        $scripts = array('handbid'     => 'public/js/handbid.js',
                         'socket'      =>' public/js/socket.js',
                         'isotope'     =>' public/js/isotope.pkgd.min.js',
                         'modal'       =>' public/js/jquery.modal.min.js',
                         'unslider'    =>' public/js/unslider.min.js',
                         'contactForm' =>' public/js/contactForm.js',
                         'photoGallery'=>' public/js/photoGallery.js',
                         'auctionList' =>' public/js/auctionList.js',
                         'bidNow'      =>' public/js/bidNow.js');

        foreach($scripts as $key=>$sc)
        {
            wp_register_script($key, plugins_url($sc, __FILE__));
            wp_enqueue_script($key);
        }
    }

    // State
    function state() {

        if(!$this->state) {
            $this->state = new state($this->basePath);
        }

        return $this->state;
    }

    // Controllers
    function createActionController($viewRenderer = false) {
        if(!$viewRenderer) {
            $viewRenderer = $this->viewRender;
        }

        return new HandbidActionController($viewRenderer);
    }

    // View Renderer
    function createViewRenderer($basePath = false) {

        if(!$basePath) {
            $basePath = $this->basePath;
        }

        return new HandbidViewRenderer($basePath);
    }

    // ShortCodes
    function createShortCodeController($viewRenderer = false, $state = false) {

        if(!$viewRenderer) {
            $viewRenderer = $this->viewRender;
        }

        if(!$state) {
            $state = $this->state;
        }

        return new ShortCodeController($viewRenderer, $this->basePath, $state);

    }
    function setupShortCodes() {

        // Add Plugin ShortCodes
        $shortCodes = [
            'handbid_auction_results',
            'handbid_auction_banner',
            'handbid_auction_details',
            'handbid_auction_contact_form',
            'handbid_auction_list',
            'handbid_bid_winning',
            'handbid_bid_history',
            'handbid_bid_now',
            'handbid_image_gallery',
            'handbid_item_comment',
            'handbid_item_results',
            'handbid_item_search_bar',
            'handbid_ticket_buy',
        ];

        forEach($shortCodes as $shortCode) {
            add_shortcode( $shortCode, array( $this->shortCodeController, $shortCode ) );
        }
    }

    // Admin
    function registerPluginSettings() {
        register_setting( 'application', 'appId');  // get_option('appId');
        register_setting( 'application', 'apiKey'); // get_option('apiKey');
    }
    function setupAdminArea() {
        add_menu_page('Handbid', 'Handbid', 0, 'handbid-admin-dashboard', array($this->actionController, 'adminSettingsAction'), plugins_url() .'/handbid/public/images/favicon.png');
    }
}

new Handbid;