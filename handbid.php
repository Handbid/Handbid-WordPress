<?php
/**
 * Plugin Name: Handbid
 * Author: Handbid
 * Author URI: http://www.handbid.com
 * Version: 0.0.1.10
 * Description: Handbid is fully automated mobile silent auction software specifically designed to increase revenue,
 * drive bid activity, and maximize ROI for non-profits. Eliminating the need for paper bid sheets, Handbid empowers
 * users to bid using a mobile device, the web, or a tablet (kiosk) at the event. Bidders can enter bids remotely or
 * locally, manage their bids with proxy bidding, and instantly view status of all bids.
 *
 */

/**
 * @copyright Copyright (c) 2014-2015 Handbid Inc.
 * @category handbid
 * @package Handbid2-WordPress
 * @license Proprietary
 * @link http://www.handbid.com/
 * @author Master of Code (worldclass@masterofcode.com)
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
//define images host for now, while it changes
define("HANDBID_IMAGES_HOST", "beta.yii.handbid.com");

require_once($libFolder . '/Handbid-Php/src/Handbid.php');
require_once($libFolder . '/stripe-php/init.php');

class Handbid
{

    public $shortCodeController;
    public $viewRender;
    public $basePath;
    public $state;
    public $actionController;
    public $adminActionController;
    public $router;
    public $handbid;

    static public $_instance;

    function __construct($options = null)
    {

        // Make sure handbid has everything it needs to run
        \Handbid\Handbid::includeDependencies();

        // Dependency Injection
        $this->basePath              = isset($options['basePath']) ? $options['basePath'] : dirname(__FILE__);
        $this->handbid               = isset($options['handbid']) ? $options['handbid'] : $this->createHandbid();
        $this->viewRender            = isset($options['viewRender']) ? $options['viewRender'] : $this->createViewRenderer(
        );
        $this->state                 = isset($options['state']) ? $options['state'] : $this->state();
        $this->router                = isset($options['router']) ? $options['router'] : $this->createRouteController();
        $this->shortCodeController   = isset($options['createShortCodeController']) ? $options['createShortCodeController'] : $this->createShortCodeController(
        );
        $this->actionController      = isset($options['actionController']) ? $options['actionController'] : $this->createActionController(
        );
        $this->adminActionController = isset($options['adminActionController']) ? $options['adminActionController'] : $this->createAdminActionController(
            false,
            $this->state->isLocalOrganizationPlugin()
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
        add_action('wp_head', [$this, 'addAjaxUrl']);
        add_action( 'template_redirect', [$this, 'redirectIfSingleOrganization'] );
        // init controllers
        $this->router->init();
        $this->shortCodeController->init();
        $this->actionController->init();
        $this->adminActionController->init();

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

    function addAjaxUrl() {
        ?>
        <script type="text/javascript">
            var ajaxurl = '<?php echo admin_url('admin-ajax.php'); ?>';
        </script>
    <?php
    }

    function redirectIfSingleOrganization()
    {

        $neededSlug = $this->state->getLocalOrganizationSlug();
        $isLocalCopy = $this->state->isLocalOrganizationPlugin();
        if($neededSlug and $isLocalCopy) {
            $currentOrg = get_query_var("organization");
            if (is_page('organizations') or (is_page('organization') and $currentOrg != $neededSlug)) {
                wp_redirect(home_url('/organizations/' . $neededSlug));
                exit();
            }
        }
    }


    // Javascript
    function initScripts()
    {

        $scripts = array(
            'cookie-plugin-js'         => 'public/js/jquery.cookie.js',
            'handbid-isotope-js'       => 'public/js/isotope.pkgd.min.js',
            'handbid-unslider-js'      => 'public/js/unslider.min.js',
            'handbid-photo-gallery-js' => 'public/js/photoGallery.js',
            'handbid-tab-slider-js'    => 'public/js/slider.js',
            'handbid-auction-page-js'  => 'public/js/auction-details.js',
            'handbid-details-map-js'   => 'public/js/details-map.js',
            'handbid-tooltip-js'       => 'public/js/tooltip.js',
            'handbid-modal-js'         => 'public/js/modal.js',
            'handbid-bootstrap-js'     => 'public/js/bootstrap.js',
            'handbid-select2-js'       => 'public/js/select2.full.js',
            'handbid-login-js'      => 'public/js/login.js',
            'handbid-notices-js'    => 'public/js/pnotify.custom.min.js',
            'handbid-plugin-js'     => 'public/js/handbid.js',
        );

//        //make this a settings
//        wp_register_script(
//            'handbidCore',
//            get_option('handbidJs', 'https://handbid-js-handbid.netdna-ssl.com/handbid.js?cachebuster=234234')
//        );
//        wp_enqueue_script('handbidCore');

        foreach ($scripts as $key => $sc) {
            wp_register_script($key, plugins_url($sc, __FILE__));
            wp_enqueue_script($key);
        }

        $styles = array(
            'handid-bootstrap-css'       => 'public/css/bootstrap.min.css',
            'handid-modal-css'           => 'public/css/modal.css',
            'handid-modal-connect-css'   => 'public/css/modal-connect.css',
            'handid-notices-css'         => 'public/css/pnotify.custom.min.css',
            'handbid-select2-css'        => 'public/css/select2.css',
            'handbid-generic-styles-css' => 'public/css/handbid.css',
            'handbid-less-buttons-css'   => 'public/less/buttons.less',
            'handbid-less-modal-css'     => 'public/less/modal.less',
            'handbid-less-css'    => 'public/less/handbid.less',
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
                'endpoint' => ($endpoint) ? $endpoint : null,
                'cache'    => [
                    'dir' => ABSPATH . 'wp-content/cache'
                ]
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

    function createAdminActionController($viewRenderer = false, $isLocalCopy = false)
    {
        if (!$viewRenderer) {
            $viewRenderer = $this->viewRender;
        }

        return new HandbidAdminActionController($viewRenderer, $isLocalCopy);
    }

    function createRouteController($state = null)
    {
        if (!$state) {
            $state = $this->state;
        }

        return new HandbidRouter($state);
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
    function createShortCodeController($handbid = null, $viewRenderer = false, $state = false, $routeController = null)
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

        if (!$routeController) {
            $routeController = $this->router;
        }

        return new HandbidShortCodeController($handbid, $viewRenderer, $this->basePath, $state, $routeController);

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

        //do we need to prompt for credit card?
        $bidder = $this->state()->currentBidder();

        if(!$bidder) {
            echo do_shortcode('[handbid_bidder_login_form]');
        }

        if ($auction = $this->state()->currentAuction()) {

            if($bidder && !!$auction->requireCreditCard && count($bidder->creditCards) > 0 && ($auction->spendingThreshold == 0 || $auction->spendingThreshold <= $bidder->totalSpent)) {

                echo "<div class='handbid-credit-card-footer-form'>";
                echo do_shortcode('[handbid_bidder_profile_form template="views/bidder/credit-card-form" show_credit_card_required_message=true]');
                echo "</div>";

            }

        }

        echo '<script type="text/javascript">if(jQuery("[data-handbid-auction-guid]").length > 0) { var auctionChannelId = jQuery("[data-handbid-auction-guid]").attr("data-handbid-auction-guid"); } if(jQuery.cookie("handbid-auth")) { var userChannelId = jQuery.cookie("handbid-auth").split(": ")[1]; }</script>';
        echo '<script src="http://beta-yii.hand.bid:3002/socket.io/socket.io.js"></script>';
        echo '<script type="text/javascript" src="' . plugins_url("handbid/public/js/yii-node-socket.js") .  '"></script>';
        echo '<script type="text/javascript" src="' . plugins_url("handbid/public/js/node-socket-manager.js") .  '"></script>';
    }

    function logout()
    {
        $this->handbid->logout();
    }


    /**
     * Sets the current instance for retrieval via Handbid::instance().
     *
     * @param $instance Handbid
     */
    static function setInstance($instance)
    {
        static::$_instance = $instance;
    }

    /**
     * Our singleton instance
     *
     * @return $this
     */
    static public function instance()
    {
        return static::$_instance;
    }
}

$__hb = new Handbid;
Handbid::setInstance($__hb);