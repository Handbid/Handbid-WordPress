<?php
/**
 * Plugin Name: Handbid
 * Author: Jon Hemstreet
 * Author URI: http://www.jonhemstreet.com
 * Description: Handbid is fully automated mobile silent auction software specifically designed to increase revenue, drive bid activity, and maximize ROI for non-profits. Eliminating the need for paper bid sheets, Handbid empowers users to bid using a mobile device, the web, or a tablet (kiosk) at the event. Bidders can enter bids remotely or locally, manage their bids with proxy bidding, and instantly view status of all bids.
 * Version: 0.0.0.63
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

    function __construct($options = null) {
        add_action( 'init', array( $this, 'init' ) );

        // Dependency Injection
        $this->basePath            = ($options['basePath']) ? $options['basePath'] : dirname(__FILE__);
        $this->viewRender          = ($options['viewRender']) ? $options['viewRender'] : $this->createViewRenderer();
        $this->state               = ($options['state']) ? $options['state'] : $this->state();
        $this->shortCodeController = ($options['createShortCodeController']) ? $options['state'] : $this->createShortCodeController();

    }

    function init() {

        // Add javascript
        add_action('wp_enqueue_scripts', array( $this, 'setupJavascript' ) );

        // Setup ShortCodes
        $this->setupShortCodes();
    }

    function createActionController() {

    }

    function state() {

        if(!$this->state) {
            $this->state = new state($this->basePath);
        }

        return $this->state;
    }

    // Javascript
    function setupJavascript() {

        $scripts = array('handbid' => '/public/js/handbid.js',
                         'socket'  =>' public/js/socket.js',
                         'bidNow'  =>' public/js/bidNow.js');

        foreach($scripts as $key=>$sc)
        {
            wp_register_script($key, plugins_url($sc, __FILE__));
            wp_enqueue_script($key);
        }
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

}

new Handbid;