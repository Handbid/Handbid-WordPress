<?php

/**
 * Plugin Name: Handbid
 * Author: Handbid
 * Author URI: http://www.handbid.com
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

        register_activation_hook(__FILE__, [$this, 'install']);
        add_action('init', [$this, 'init']);
        add_action('wp_footer', [$this, 'onRenderFooter']);
        add_filter('query_vars', [$this, 'registerVariables']);

        // Temporary fix for showing admin bar
        add_action('after_setup_theme', [$this, 'remove_admin_bar']);

    }

    function init()
    {

        // Add javascript
        add_action('wp_enqueue_scripts', [$this, 'initScripts']);
        // init controllers
        $this->shortCodeController->init();
        $this->actionController->init();
        $this->adminActionController->init();
        $this->routeController->init();

        add_action(
            'admin_post_submit-form',
            [$this->actionController, '_handle_form_action']
        ); // If the user is logged in
        add_action(
            'admin_post_nopriv_submit-form',
            [$this->actionController, '_handle_form_action']
        ); // If the user in not logged in


    }

    function install()
    {
        // As of PHP4 this will create a new Class of Install and call the install function
        new HandbidInstall();
        flush_rewrite_rules();
    }


    // Javascript
    function initScripts()
    {

        $scripts = array(
            'handbid-isotope'       => 'public/js/isotope.pkgd.min.js',
            'handbid-unslider'      => 'public/js/unslider.min.js',
            'handbid-photo-gallery' => 'public/js/photoGallery.js',
        );

        //make this a settings
        wp_register_script(
            'handbidCore',
            get_option('handbidJs', 'https://handbid-js-handbid.netdna-ssl.com/handbid.js?cachebuster=234234')
        );
        wp_enqueue_script('handbidCore');

        foreach ($scripts as $key => $sc) {
            wp_register_script($key, plugins_url($sc, __FILE__));
            wp_enqueue_script($key);
        }

        $styles = array(
            'handid-modal'           => 'public/css/modal.css',
            'handbid-generic-styles' => 'public/css/handbid.css'
        );

        foreach ($styles as $key => $sc) {
            wp_register_style($key, plugins_url($sc, __FILE__));
            wp_enqueue_style($key);
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
            $this->state = new HandbidState($this->basePath, $this->handbid);
        }

        return $this->state;
    }

    // Controllers
    function createActionController($viewRenderer = false)
    {
        if (!$viewRenderer) {
            $viewRenderer = $this->viewRender;
        }

        return new HandbidActionController($viewRenderer, $this->handbid, $this->state);
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
        return new HandbidShortCodeController($handbid, $viewRenderer, $this->basePath, $state);

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
    function remove_admin_bar()
    {
        if (!current_user_can('administrator') && !is_admin()) {
            show_admin_bar(false);
        }
    }

    function onRenderFooter()
    {
        if ($this->state()->currentAuction()) {

            echo '<script type="text/javascript">handbid.connectToAuction("' . $this->state()->currentAuction(
                )->key . '");</script>';

        }
    }

    function logout()
    {
        $this->handbid->logout();
    }


}

new Handbid;