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

require_once($libFolder . '/Handbid-Php/src/Handbid.php');
require_once($libFolder . '/stripe-php/init.php');

if(!defined("HANDBID_PLUGIN_URL")){
	define("HANDBID_PLUGIN_URL", plugin_dir_url( __FILE__ ));
}
if(!defined("HANDBID_PLUGIN_PATH")){
	define("HANDBID_PLUGIN_PATH", plugin_dir_path( __FILE__ ));
}
if(!defined("HANDBID_APP_APPSTORE_ID")){
	define("HANDBID_APP_APPSTORE_ID", "433831139");
}
if(!defined("HANDBID_APP_APPSTORE")){
	define("HANDBID_APP_APPSTORE", "https://itunes.apple.com/us/app/handbid/id".HANDBID_APP_APPSTORE_ID."?l=ru&ls=1&mt=8");
}
if(!defined("HANDBID_APP_APPSTORE_IPAD_ID")){
	define("HANDBID_APP_APPSTORE_IPAD_ID", "476689122");
}
if(!defined("HANDBID_APP_APPSTORE_IPAD")){
	define("HANDBID_APP_APPSTORE_IPAD", "https://itunes.apple.com/us/app/bidpad/id".HANDBID_APP_APPSTORE_IPAD_ID."?l=ru&ls=1&mt=8");
}
if(!defined("HANDBID_APP_GOOGLEPLAY_ID")){
	define("HANDBID_APP_GOOGLEPLAY_ID", "com.handbid.android");
}
if(!defined("HANDBID_APP_GOOGLEPLAY")){
	define("HANDBID_APP_GOOGLEPLAY", "https://play.google.com/store/apps/details?id=".HANDBID_APP_GOOGLEPLAY_ID);
}
if(!defined("HANDBID_DEFAULT_CURRENCY")){
	define("HANDBID_DEFAULT_CURRENCY", "USD");
}
if(!defined("HANDBID_DEFAULT_CURRENCY_SYMBOL")){
	define("HANDBID_DEFAULT_CURRENCY_SYMBOL", "$");
}

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
        add_action('wp_head', [$this, 'onRenderHeader'], 1);
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
	    add_action( 'template_redirect', [$this, 'loginPageThemeRedirect']);
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

        add_filter('handbid_cdn_image_thumbnail', [$this, 'cdnThumbImage'], 100, 1 );
        add_filter('handbid_cdn_image_gallery', [$this, 'cdnGalleryImage'], 100, 1 );


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

    function cdnThumbImage($imageUrl) {
        $wrongForThumbnail = "-/format/jpeg/-/quality/lightest/";
        //too big..
        $rightForThumbnail = "-/preview/600x400/-/quality/lightest/-/scale_crop/600x400/center/";
        //$rightForThumbnail = "-/preview/300x200/-/quality/lightest/-/scale_crop/300x200/center/";
        if(strpos($imageUrl, "ucarecdn.com") !== FALSE){
            if(strpos($imageUrl, $wrongForThumbnail) !== FALSE){
                $imageUrl = str_replace($wrongForThumbnail, "", $imageUrl);
            }
            $imageUrl = $imageUrl . $rightForThumbnail;
        }
        return $imageUrl;
    }

    function cdnGalleryImage($imageUrl) {
        $wrongForGallery = "-/format/jpeg/-/quality/lightest/";
        $rightForGallery = "-/preview/650x500/-/setfill/e7e7e7/-/crop/650x500/center/-/quality/lightest/";
        if(strpos($imageUrl, "ucarecdn.com") !== FALSE){
            if(strpos($imageUrl, $wrongForGallery) !== FALSE){
                $imageUrl = str_replace($wrongForGallery, "", $imageUrl);
            }
            $imageUrl = $imageUrl . $rightForGallery;
        }
        return $imageUrl;
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

	function loginPageThemeRedirect() {
		global $wp, $post, $wp_query;
		$pluginDir = dirname( __FILE__ );
		if (get_query_var("pagename","") == 'log-in') {
			$templateFileName = 'login-form-new.phtml';
			$returnTemplate = $pluginDir . '/views/bidder/' . $templateFileName;
			$returnTemplate = str_replace("\\","/",$returnTemplate);
			if (have_posts()) {
				get_header();
				echo do_shortcode("[handbid_bidder_login_form in_page='1']");
				get_footer();
				die();
			} else {
				$wp_query->is_404 = true;
			}
		}
	}


    // Javascript
    function initScripts()
    {

        $socketUrl = $this->getSocketUrl();
        $socketIoUrl = sprintf('%ssocket.io/socket.io.js', $socketUrl);

        $outerScripts = array(
            'socket-io-js'           => $socketIoUrl,
            'stripe-api-js'          => 'https://js.stripe.com/v2/',
        );

        foreach ($outerScripts as $key => $sc) {
            wp_register_script($key, $sc, [], null, true);
            wp_enqueue_script($key);
        }

        $scripts = array(
            'smart-app-banner-js'      => 'public/js/smart-app-banner.js',
            'smart-app-banner-init-js' => 'public/js/smart-app-banner-init.js',
            'yii-node-socket-js'       => 'public/js/yii-node-socket.js',
            'node-socket-manager-js'   => 'public/js/node-socket-manager.js',
            'stripe-init-js'           => 'public/js/stripe-init.js',
            'progress-bar-js'          => 'public/js/progress-bar.js',
            'cookie-plugin-js'         => 'public/js/jquery.cookie.js',
            'visible-plugin-js'        => 'public/js/jquery.visible.min.js',
            'handbid-isotope-js'       => 'public/js/isotope.pkgd.min.js',
            'handbid-unslider-js'      => 'public/js/unslider.min.js',
            'handbid-photo-gallery-js' => 'public/js/photoGallery.js',
            'handbid-tab-slider-js'    => 'public/js/slider.js',
            'handbid-auction-page-js'  => 'public/js/auction-details.js',
            'handbid-details-map-js'   => 'public/js/details-map.js',
            'handbid-tooltip-js'       => 'public/js/tooltip.js',
            'handbid-bootstrap-js'     => 'public/js/bootstrap.js',
            'handbid-select2-js'       => 'public/js/select2.full.js',
            'handbid-login-js'         => 'public/js/login.js',
            'handbid-notices-js'       => 'public/js/pnotify.custom.min.js',
            'handbid-plugin-js'        => 'public/js/handbid.js',
            'handbid-modal-js'         => 'public/js/modal.js',
        );

        foreach ($scripts as $key => $sc) {
            wp_register_script($key, plugins_url($sc, __FILE__), [], null, true);
            wp_enqueue_script($key);
        }


        $styles = array(
            'smart-app-banner-css'       => 'public/css/smart-app-banner.css',
            'handid-bootstrap-css'       => 'public/css/bootstrap.min.css',
            'handid-modal-css'           => 'public/css/modal.css',
            'handid-modal-connect-css'   => 'public/css/modal-connect.css',
            'handid-notices-css'         => 'public/css/pnotify.custom.min.css',
            'handbid-select2-css'        => 'public/css/select2.css',
            'handbid-generic-styles-css' => 'public/css/handbid.css',
            'handbid-less-buttons-css'   => 'public/less/buttons.less',
            'handbid-less-modal-css'     => 'public/less/modal.less',
            'handbid-less-css'           => 'public/less/handbid.less',
            'handbid-less-responsive-css'=> 'public/less/responsive-fix.less',
        );

        foreach ($styles as $key => $sc) {
            wp_register_style($key, plugins_url($sc, __FILE__));
            wp_enqueue_style($key);
        }

        $outerStyles = array(
            'fonts-google-oswald'          => 'https://fonts.googleapis.com/css?family=Oswald',
        );

        foreach ($outerStyles as $key => $sc) {
            wp_register_style($key, $sc);
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

    function getSocketUrl(){
        $socketUrl = get_option('handbidSocketUrl', 'https://socket.hand.bid');
        $socketUrl = (substr($socketUrl, -1) != "/")? $socketUrl."/":$socketUrl;
        return $socketUrl;
    }


    function onRenderHeader() {

        $affiliateIOS = "http://www.apple.com/itunes/affiliates/";
        $affiliateGoogle = "";

        $imageIOS = "http://a3.mzstatic.com/us/r30/Purple3/v4/b9/fa/47/b9fa4799-502e-e4ba-6a96-bd5ce38929cb/icon175x175.jpeg";
        $imageGoogle = "https://lh3.googleusercontent.com/uiYA8FoF_ghTBsZ_QTRUAylYimM86FurQlVNsMaWdA5XT7HQgclGktOSjsBtGj1JfkKD=w300-rw";

        $auction = $this->state()->currentAuction();

        $bidderToken = isset($_COOKIE["handbid-auth"])? str_replace("Authorization: Bearer ","",$_COOKIE["handbid-auth"]):"";
        $auctionGuid = isset($auction->auctionGuid) ? $auction->auctionGuid : "";
        $dataLink = add_query_arg(
            [
                "id" => $bidderToken,
                "auid" => $auctionGuid,
            ],
            get_bloginfo("url")."/autologin"
        );

        if(!defined("HANDBID_APP_REFERRER")){
            define("HANDBID_APP_REFERRER", $dataLink);
        }

        $dataLink = str_replace(["http", "https"], "handbid", $dataLink);

        $output='
        <meta name="apple-itunes-app" content="app-id='.HANDBID_APP_APPSTORE_ID.', affiliate-data='.$affiliateIOS.', app-argument='.$dataLink.'" >
        <meta name="google-play-app" content="app-id='.HANDBID_APP_GOOGLEPLAY_ID.', affiliate-data='.$affiliateGoogle.', app-argument='.$dataLink.'">
        <link rel="apple-touch-icon" href="'.$imageIOS.'">
        <link rel="android-touch-icon" href="'.$imageGoogle.'" />
        ';
        echo $output;

    }

    function onRenderFooter()
    {

        global $displayBidderProfile;

        //do we need to prompt for credit card?
        $auction = $this->state()->currentAuction();
        $auctionID = isset($auction->id)?$auction->id:0;
        $bidder = $this->state()->currentBidder($auctionID);

        //if(!$bidder) {
            echo do_shortcode('[handbid_bidder_login_form]');
        //}

        if (false) {

            if($bidder && !!$auction->requireCreditCard && count($bidder->creditCards) > 0 && ($auction->spendingThreshold == 0 || $auction->spendingThreshold <= $bidder->totalSpent)) {

                echo "<div class='handbid-credit-card-footer-form'>";
                echo do_shortcode('[handbid_bidder_profile_form template="views/bidder/credit-card-form" show_credit_card_required_message=true]');
                echo "</div>";

            }

        }

        if (!$displayBidderProfile) {
                echo "<div class='handbid-credit-card-footer-form'>";
                echo "<input type='hidden' id='footer-credit-cards-count' value='".count($bidder->creditCards)."'>";
                echo do_shortcode('[handbid_bidder_profile_form template="views/bidder/credit-card-form" show_credit_card_required_message=true]');
                echo "</div>";
        }
        // Set Values

        $auctionGuid = (isset($auction->auctionGuid))?trim($auction->auctionGuid):"";
        $auctionKey = (isset($auction->key))?trim($auction->key):"";
        $userGuid = (isset($bidder->usersGuid))?trim($bidder->usersGuid):"";

        // Determined Values
        $socketUrl = $this->getSocketUrl();
        $nodeClientUrl = sprintf('%sclient', $socketUrl);

        $params = json_encode(["secure" => true, "cookie" => $userGuid]);

        ?>
        <script>
            var auctionChannelId = '<?php echo $auctionGuid; ?>',
                currentAuctionKey = '<?php echo $auctionKey; ?>',
                userChannelId = '<?php echo $userGuid; ?>',
                url = '<?php echo $nodeClientUrl; ?>',
                params = <?php echo $params; ?>,
                stripePublishableKey = '<?php echo $this->state->getStripeApiKey();?>';

            var forcePageRefreshAfterBids = <?php echo (get_option('handbidForceRefresh', 'no') == "yes") ? "true" : "false" ;?>;

        </script>
        <?php

        $currencyCode = (isset($auction->currencyCode))? $auction->currencyCode : HANDBID_DEFAULT_CURRENCY;
        $currencySymbol = (isset($auction->currencySymbol))? $auction->currencySymbol : HANDBID_DEFAULT_CURRENCY_SYMBOL;

        echo '<input type="hidden" data-auction-currency-code="'.$currencyCode.'">';
        echo '<input type="hidden" data-auction-currency-symbol="'.$currencySymbol.'">';

        $bidderID = (isset($bidder->id)) ? $bidder->id : 0;
        echo '<input type="hidden" data-dashboard-profile-id="'.$bidderID.'">';
        echo '<input type="hidden" data-default-item-image value="'.plugins_url("handbid/public/images/default-item-image.jpg").'">';
        echo '<input type="hidden" data-handbid-app-appstore value="'.HANDBID_APP_APPSTORE.'">';
        echo '<input type="hidden" data-handbid-app-appstore-ipad value="'.HANDBID_APP_APPSTORE_IPAD.'">';
        echo '<input type="hidden" data-handbid-app-googleplay value="'.HANDBID_APP_GOOGLEPLAY.'">';

        $isCustomizerPage = (isset($_SERVER["HTTP_REFERER"]) and (explode("?",basename($_SERVER["HTTP_REFERER"]))[0] == "customize.php"));
        if($isCustomizerPage){
            echo do_shortcode("[handbid_customizer_styles]");
        }
        else{
            echo '<link rel="stylesheet" href="' . add_query_arg(array("action"=>"handbid_ajax_customizer_css"), admin_url("admin-ajax.php")) .  '" media="all"/>';
        }

        if(isset($_GET["auction-reset"])){
            echo '<input type="hidden" data-auction-reset-sign>';
        }

        if($this->state->getMapVisibility()) {
            $currentPostID = get_the_ID();
            $currentPost = get_post($currentPostID);
            if ($currentPost->post_name == 'auction') {
                echo '<script async defer src="https://maps.googleapis.com/maps/api/js?v=3.exp&callback=auctionGoogleMapsInit"></script>';
            }
        }
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
