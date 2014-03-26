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

//include product files
require_once $currentFolder . '/handbid-shortcode-controller.php';
require_once $currentFolder . '/handbid-view-renderer.php';
require_once $currentFolder . '/handbid-view.php';

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
        add_shortcode( 'handbid_auction_results', array( $this->shortCodeController, 'handbid_auction_results' ) );
        add_shortcode( 'handbid_bid_history', array( $this->shortCodeController, 'handbid_bid_history' ) );
        add_shortcode( 'handbid_bid_now', array( $this->shortCodeController, 'handbid_bid_now' ) );
        add_shortcode( 'handbid_item_comment', array( $this->shortCodeController, 'handbid_item_comment' ) );
        add_shortcode( 'handbid_item_results', array( $this->shortCodeController, 'handbid_item_results' ) );
        add_shortcode( 'handbid_item_search_bar', array( $this->shortCodeController, 'handbid_item_search_bar' ) );
        add_shortcode( 'handbid_ticket_buy', array( $this->shortCodeController, 'handbid_ticket_buy' ) );

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

        return new ShortcodeController($viewRenderer, $this->basePath);

    }

    function createViewRenderer($basePath = false) {

        if(!$basePath) {
            $basePath = $this->basePath;
        }

        return new HandbidViewRenderer($basePath);
    }

}

new Handbid;