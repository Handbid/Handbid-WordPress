<?php

/**
 * Plugin Name: Handbid
 * Author: Jon Hemstreet
 * Author URI: http://www.jonhemstreet.com
 * Version: 0.0.1.9
 * Description: Handbid is fully automated mobile silent auction software specifically designed to increase revenue,
 * drive bid activity, and maximize ROI for non-profits. Eliminating the need for paper bid sheets, Handbid empowers
 * users to bid using a mobile device, the web, or a tablet (kiosk) at the event. Bidders can enter bids remotely or
 * locally, manage their bids with proxy bidding, and instantly view status of all bids.
 *
 */

// Handbid Class Autoloader
$currentFile   = __FILE__;
$currentFolder = dirname($currentFile);
$libFolder     = $currentFolder . '/lib';

// Loop through lib directory autoloading files and require_once them
if ($handle = opendir($libFolder)) {
    while (false !== ($entry = readdir($handle))) {
        if ($entry != "." && $entry != ".." && strpos($entry, '.php') > 0) {
            require_once $libFolder . '/' . $entry;
        }
    }

    closedir($handle);
}

require_once($libFolder . '/Handbid-Php/src/Handbid.php');


class Handbid
{

    public $shortCodeController;
    public $viewRender;
    public $basePath;
    public $state;
    public $actionController;
    public $adminActionController;
    public $routeController;
    public $handbid;

    function __construct($options = null)
    {

        // Make sure handbid has everything it needs to run
        \Handbid\Handbid::includeDependencies();

        // Fresh Installer

//        register_deactivation_hook( __FILE__, [ $this, 'uninstall' ] );

        // Dependency Injection
        $this->basePath              = isset($options['basePath']) ? $options['basePath'] : dirname(__FILE__);
        $this->handbid               = isset($options['handbid']) ? $options['handbid'] : $this->createHandbid();
        $this->viewRender            = isset($options['viewRender']) ? $options['viewRender'] : $this->createViewRenderer(
        );
        $this->state                 = isset($options['state']) ? $options['state'] : $this->state();
        $this->shortCodeController   = isset($options['createShortCodeController']) ? $options['createShortCodeController'] : $this->createShortCodeController(
        );
        $this->actionController      = isset($options['actionController']) ? $options['actionController'] : $this->createActionController(
        );
        $this->adminActionController = isset($options['adminActionController']) ? $options['adminActionController'] : $this->createAdminActionController(
        );
        $this->routeController       = isset($options['routeController']) ? $options['routeController'] : $this->createRouteController(
        );

        register_activation_hook( __FILE__, [ $this, 'install' ] );
        add_action('init', [$this, 'init']);
        add_action('wp_footer', [$this, 'onRenderFooter']);
        add_filter('query_vars', [$this, 'registerVariables']);

        // Temporary fix for showing admin bar
        add_action('after_setup_theme', [ $this, 'remove_admin_bar' ]);

    }

    function init()
    {

        // Add javascript
        add_action('wp_enqueue_scripts', [$this, 'initJavascript']);
        // init controllers
        $this->shortCodeController->init();
        $this->adminActionController->init();

    }

    function install()
    {
        $install = new Install();
        $install->install();
    }

    function uninstall()
    {
        $uninstall = new Uninstall();
        $uninstall->uninstall();
    }

    // Javascript
    function initJavascript()
    {

        $scripts = array(
//            'handbid'              => 'public/js/handbid.js',
//            'handbidSocket'        => 'public/js/socket.js',
            'handbidIsotope'       => 'public/js/isotope.pkgd.min.js',
            'handbidModal'         => 'public/js/jquery.modal.min.js',
            'handbidUnslider'      => 'public/js/unslider.min.js',
//            'handbidContactForm'   => 'public/js/contactForm.js',
//            'handbidPhotoGallery'  => 'public/js/photoGallery.js',
//            'handbidAuctionList'   => 'public/js/auctionList.js',
//            'handbidAuctionBanner' => 'public/js/auctionBanner.js',
//            'handbidBidNow'        => 'public/js/bidNow.js'
        );

        wp_register_script('handbidCore', 'https://handbid-js-handbid.netdna-ssl.com/handbid.js');
        wp_enqueue_script('handbidCore');

        foreach ($scripts as $key => $sc) {
            wp_register_script($key, plugins_url($sc, __FILE__));
            wp_enqueue_script($key);
        }
    }

    function createHandbid()
    {
        $endpoint = get_option('handbidRestEndpoint');
        return new \Handbid\Handbid(
            get_option('handbidConsumerKey'), get_option('handbidConsumerSecret'), [
                'endpoint' => ($endpoint) ? $endpoint : null
            ]
        );
    }

    // State
    function state()
    {

        if (!$this->state) {
            $this->state = new state($this->basePath, $this->handbid);
        }

        return $this->state;
    }

    // Controllers
    function createActionController($viewRenderer = false)
    {
        if (!$viewRenderer) {
            $viewRenderer = $this->viewRender;
        }

        return new HandbidActionController($viewRenderer);
    }

    function createAdminActionController($viewRenderer = false)
    {
        if (!$viewRenderer) {
            $viewRenderer = $this->viewRender;
        }

        return new HandbidAdminActionController($viewRenderer);
    }

    function createRouteController()
    {
        return new HandbidRouteController();
    }

    // View Renderer
    function createViewRenderer($basePath = false)
    {

        if (!$basePath) {
            $basePath = $this->basePath;
        }

        return new HandbidViewRenderer($basePath);
    }

    // ShortCodes
    function createShortCodeController($handbid = null, $viewRenderer = false, $state = false)
    {

        if (!$viewRenderer) {
            $viewRenderer = $this->viewRender;
        }

        if (!$handbid) {
            $handbid = $this->handbid;
        }

        if (!$state) {
            $state = $this->state;
        }
        return new ShortCodeController($handbid, $viewRenderer, $this->basePath, $state);

    }

    // Query Variable Support
    function registerVariables($qvars)
    {
        $qvars[] = 'organization';
        $qvars[] = 'auction';
        $qvars[] = 'item';
        return $qvars;
    }


    // Temporary fix to remove admin bar
    function remove_admin_bar() {
        if (!current_user_can('administrator') && !is_admin()) {
            show_admin_bar(false);
        }
    }

    function onRenderFooter() {
        if($this->state()->currentAuction()) {

            echo '<script type="text/javascript">handbid.connectToAuction("' . $this->state()->currentAuction()->key . '");</script>';

        }
    }

}

new Handbid;