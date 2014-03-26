<?php
/**
 * Plugin Name: Handbid
 * Author: Jon Hemstreet
 * Author URI: http://www.jonhemstreet.com
 * Description: Handbid is fully automated mobile silent auction software specifically designed to increase revenue, drive bid activity, and maximize ROI for non-profits. Eliminating the need for paper bid sheets, Handbid empowers users to bid using a mobile device, the web, or a tablet (kiosk) at the event. Bidders can enter bids remotely or locally, manage their bids with proxy bidding, and instantly view status of all bids.
 * Version: 0.0.0.62
 */

$currentFile = __FILE__;
$currentFolder = dirname($currentFile);



// Handbid Store manual addition
// @TODO Make better autoloader
require_once $currentFolder . '/lib/HandbidStore.php';

// Loop through lib directory autoloading files and require_once them
if ($handle = opendir($currentFolder . '/lib')) {
    while (false !== ($entry = readdir($handle))) {
        if($entry!="." && $entry!= ".."){
            require_once $currentFolder . '/lib/' . $entry;
        }
    }

    closedir($handle);
}

class Handbid {

    public $shortCodeController;
    public $viewRender;
    public $basePath;
//    public $store;

    function __construct($options = null) {
        add_action( 'init', array( $this, 'init' ) );

        $this->basePath = dirname(__FILE__);
        $this->viewRender = $this->createViewRenderer();
        $this->shortCodeController = $this->createShortCodeController();
//        $this->store = $this->createStore();

    }

    function init() {
        // Add javascript
        add_action('wp_enqueue_scripts', array( $this, 'handbid_javascript' ) );

        // Add plugin shortcodes
        $shortCodes = [
            'handbid_auction_results',
            'handbid_auction_banner',
            'handbid_auction_details',
            'handbid_auction_contact_form',
            'handbid_auction_list',
            'handbid_bid_history',
            'handbid_bid_now',
            'handbid_item_comment',
            'handbid_item_results',
            'handbid_item_search_bar',
            'handbid_ticket_buy',
        ];

        forEach($shortCodes as $shortCode) {
            add_shortcode( $shortCode, array( $this->shortCodeController, $shortCode ) );
        }

    }

    function handbid_javascript() {
        $scripts=array('handbid-javascript'=>'/public/js/handbid.js',
                       'socket-js'=>'public/js/socket.js');

        foreach($scripts as $key=>$sc)
        {
            wp_register_script( $key, get_template_directory_uri() . $sc, array('javascript') );
            wp_enqueue_script( $key );
        }
    }

    // Handbid Class Functions
    function createStore($type = "bidder") {

    }
    function createActionController() {

    }
    function currentAuction() {

    }
    function currentItem() {

    }
    function createShortCodeController($viewRenderer = false) {

        if(!$viewRenderer) {
            $viewRenderer = $this->viewRender;
        }

        return new ShortCodeController($viewRenderer, $this->basePath);

    }

    function createViewRenderer($basePath = false) {

        if(!$basePath) {
            $basePath = $this->basePath;
        }

        return new HandbidViewRenderer($basePath);
    }

}

new Handbid;