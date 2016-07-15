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
if ($handle = opendir($libFolder))
{
    while (false !== ($entry = readdir($handle)))
    {
        if ($entry != "." && $entry != ".." && strpos($entry, '.php') > 0)
        {
            require_once $libFolder . '/' . $entry;
        }
    }

    closedir($handle);
}

require_once($libFolder . '/Handbid-Php/src/Handbid.php');
require_once($libFolder . '/stripe-php/init.php');

if (!defined("HANDBID_PLUGIN_URL"))
{
    define("HANDBID_PLUGIN_URL", plugin_dir_url(__FILE__));
}
if (!defined("HANDBID_PLUGIN_PATH"))
{
    define("HANDBID_PLUGIN_PATH", plugin_dir_path(__FILE__));
}
if (!defined("HANDBID_APP_APPSTORE_ID"))
{
    define("HANDBID_APP_APPSTORE_ID", "433831139");
}
if (!defined("HANDBID_APP_APPSTORE"))
{
    define("HANDBID_APP_APPSTORE", "https://itunes.apple.com/us/app/handbid/id" . HANDBID_APP_APPSTORE_ID . "?l=ru&ls=1&mt=8");
}
if (!defined("HANDBID_APP_APPSTORE_IPAD_ID"))
{
    define("HANDBID_APP_APPSTORE_IPAD_ID", "476689122");
}
if (!defined("HANDBID_APP_APPSTORE_IPAD"))
{
    define("HANDBID_APP_APPSTORE_IPAD", "https://itunes.apple.com/us/app/bidpad/id" . HANDBID_APP_APPSTORE_IPAD_ID . "?l=ru&ls=1&mt=8");
}
if (!defined("HANDBID_APP_GOOGLEPLAY_ID"))
{
    define("HANDBID_APP_GOOGLEPLAY_ID", "com.handbid.android");
}
if (!defined("HANDBID_APP_GOOGLEPLAY"))
{
    define("HANDBID_APP_GOOGLEPLAY", "https://play.google.com/store/apps/details?id=" . HANDBID_APP_GOOGLEPLAY_ID);
}
if (!defined("HANDBID_DEFAULT_CURRENCY"))
{
    define("HANDBID_DEFAULT_CURRENCY", "USD");
}
if (!defined("HANDBID_DEFAULT_CURRENCY_SYMBOL"))
{
    define("HANDBID_DEFAULT_CURRENCY_SYMBOL", "$");
}

class Handbid
{

    public $shortCodeController;
    public $viewRender;
    public $basePath;
    public $state;
    public $testimonials;
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
        $this->viewRender            = isset($options['viewRender']) ? $options['viewRender'] : $this->createViewRenderer();
        $this->state                 = isset($options['state']) ? $options['state'] : $this->state();
        $this->testimonials          = isset($options['state']) ? $options['state'] : $this->testimonials();
        $this->router                = isset($options['router']) ? $options['router'] : $this->createRouteController();
        $this->shortCodeController   = isset($options['createShortCodeController']) ? $options['createShortCodeController'] : $this->createShortCodeController();
        $this->actionController      = isset($options['actionController']) ? $options['actionController'] : $this->createActionController();
        $this->adminActionController = isset($options['adminActionController'])
            ? $options['adminActionController']
            : $this->createAdminActionController(
                false,
                $this->state->isLocalOrganizationPlugin()
            );

        register_activation_hook(__FILE__, [$this, 'install']);
        add_action('init', [$this, 'init']);
        add_action('init', [$this->testimonials, 'addActions']);
        add_action('wp_footer', [$this, 'onRenderFooter']);
        add_action('wp_head', [$this, 'onRenderHeader'], 1);
        add_filter('query_vars', [$this, 'registerVariables']);

        // Temporary fix for showing admin bar
        add_action('after_setup_theme', [$this, 'remove_admin_bar']);

        add_action('widgets_init', [$this->testimonials, "addCustomSidebar"]);

    }

    function init()
    {

        // Add javascript
        add_action('wp_enqueue_scripts', [$this, 'initScripts']);
        add_action('wp_head', [$this, 'addAjaxUrl']);
        add_action('template_redirect', [$this, 'redirectIfSingleOrganization']);
        add_action('template_redirect', [$this, 'loginPageThemeRedirect']);
        // init controllers
        $this->router->init();
        $this->shortCodeController->init();
        $this->actionController->init();
        $this->adminActionController->init();
        $this->testimonials->init();

        add_action(
            'admin_post_submit-form',
            [$this->actionController, '_handle_form_action']
        ); // If the user is logged in
        add_action(
            'admin_post_nopriv_submit-form',
            [$this->actionController, '_handle_form_action']
        ); // If the user in not logged in

        add_filter('handbid_cdn_image_thumbnail', [$this, 'cdnThumbImage'], 100, 1);
        add_filter('handbid_cdn_image_gallery', [$this, 'cdnGalleryImage'], 100, 1);


    }

    function install()
    {
        // As of PHP4 this will create a new Class of Install and call the install function
        new HandbidInstall();
        flush_rewrite_rules();
    }

    function addAjaxUrl()
    {
        ?>
        <script type="text/javascript">
            var ajaxurl = '<?php echo admin_url('admin-ajax.php'); ?>';
        </script>
        <?php
    }

    function cdnThumbImage($imageUrl)
    {
        $wrongForThumbnail = "-/format/jpeg/-/quality/lightest/";
        //too big..
        $rightForThumbnail = "-/preview/600x400/-/quality/lightest/-/scale_crop/600x400/center/";
        //$rightForThumbnail = "-/preview/300x200/-/quality/lightest/-/scale_crop/300x200/center/";
        if (strpos($imageUrl, "ucarecdn.com") !== false)
        {
            if (strpos($imageUrl, $wrongForThumbnail) !== false)
            {
                $imageUrl = str_replace($wrongForThumbnail, "", $imageUrl);
            }
            $imageUrl = $imageUrl . $rightForThumbnail;
        }

        return $imageUrl;
    }

    function cdnGalleryImage($imageUrl)
    {
        $wrongForGallery = "-/format/jpeg/-/quality/lightest/";
        $rightForGallery = "-/preview/650x500/-/setfill/e7e7e7/-/crop/650x500/center/-/quality/lightest/";
        if (strpos($imageUrl, "ucarecdn.com") !== false)
        {
            if (strpos($imageUrl, $wrongForGallery) !== false)
            {
                $imageUrl = str_replace($wrongForGallery, "", $imageUrl);
            }
            $imageUrl = $imageUrl . $rightForGallery;
        }

        return $imageUrl;
    }

    function redirectIfSingleOrganization()
    {

        $neededSlug  = $this->state->getLocalOrganizationSlug();
        $isLocalCopy = $this->state->isLocalOrganizationPlugin();
        if ($neededSlug and $isLocalCopy)
        {
            $currentOrg = get_query_var("organization");
            if (is_page('organizations') or (is_page('organization') and $currentOrg != $neededSlug))
            {
                wp_redirect(home_url('/organizations/' . $neededSlug));
                exit();
            }
        }
    }

    function loginPageThemeRedirect()
    {
        global $wp, $post, $wp_query;
        $pluginDir = dirname(__FILE__);
        if (get_query_var("pagename", "") == 'log-in')
        {
            $templateFileName = 'login-form-new.phtml';
            $returnTemplate   = $pluginDir . '/views/bidder/' . $templateFileName;
            $returnTemplate   = str_replace("\\", "/", $returnTemplate);
            if (have_posts())
            {
                get_header();
                echo do_shortcode("[handbid_bidder_login_form in_page='1']");
                get_footer();
                die();
            } else
            {
                $wp_query->is_404 = true;
            }
        }
    }


    // Javascript
    function initScripts()
    {

        $socketUrl   = $this->getSocketUrl();
        $socketIoUrl = sprintf('%ssocket.io/socket.io.js', $socketUrl);

        $outerScripts = array(
            'socket-io-js'   => $socketIoUrl,
            'stripe-api-js'  => 'https://js.stripe.com/v2/',
            'smooch-chat-js' => 'https://cdn.smooch.io/smooch.min.js',
        );

        foreach ($outerScripts as $key => $sc)
        {
            wp_register_script($key, $sc, [], null, true);
            wp_enqueue_script($key);
        }

        $scripts = array(
            //'handbid-details-map-js'   => 'public/js/details-map.js',

            //'smart-app-banner-js'      => 'public/js/smart-app-banner.js',
            //'smart-app-banner-init-js' => 'public/js/smart-app-banner-init.js',

            'yii-node-socket-js'     => 'public/js/yii-node-socket.js',
            'node-socket-manager-js' => 'public/js/node-socket-manager.js',
            'stripe-init-js'         => 'public/js/stripe-init.js',
            'smooch-init-js'         => 'public/js/smooch-init.js',

            'handbid-notices-js' => 'public/js/pnotify.custom.min.js',      // Probably should be changed on newest version, but there is problems with plugin docs

            //'progress-bar-js'          => 'public/js/progress-bar.js',
            //'cookie-plugin-js'         => 'public/js/jquery.cookie.js',
            //'visible-plugin-js'        => 'public/js/jquery.visible.min.js',
            //'handbid-isotope-js'       => 'public/js/isotope.pkgd.min.js',
            //'handbid-unslider-js'      => 'public/js/unslider.min.js',
            //'handbid-photo-gallery-js' => 'public/js/photoGallery.js',
            //'handbid-tab-slider-js'    => 'public/js/slider.js',
            //'handbid-auction-page-js'  => 'public/js/auction-details.js',
            //'handbid-tooltip-js'       => 'public/js/tooltip.js',
            //'handbid-bootstrap-js'     => 'public/js/bootstrap.js',
            //'handbid-select2-js'       => 'public/js/select2.full.js',
            //'handbid-login-js'         => 'public/js/login.js',
            //'handbid-plugin-js'        => 'public/js/handbid.js',
            //'handbid-modal-js'         => 'public/js/modal.js',


            'progress-bar-js'      => 'public/plugins/progressbar.js/progressbar.min.js',
            'cookie-plugin-js'     => 'public/plugins/jquery.cookie/jquery.cookie.js',
            'visible-plugin-js'    => 'public/plugins/df-visible/jquery.visible.min.js',
            'handbid-isotope-js'   => 'public/plugins/isotope/isotope.pkgd.min.js',
            'handbid-unslider-js'  => 'public/plugins/unslider/js/unslider-min.js',
            'handbid-bootstrap-js' => 'public/plugins/bootstrap/js/bootstrap.min.js',
            'handbid-select2-js'   => 'public/plugins/select2/js/select2.full.min.js',

            'handbid-js' => 'public/js/app.min.js',

        );

        foreach ($scripts as $key => $sc)
        {
            wp_register_script($key, plugins_url($sc, __FILE__), [], null, true);
            wp_enqueue_script($key);
        }


        $styles = array(
            //'smart-app-banner-css'       => 'public/css/smart-app-banner.css',
            //'handid-bootstrap-css'       => 'public/css/bootstrap.min.css',
            //'handid-modal-css'           => 'public/css/modal.css',
            //'handid-modal-connect-css'   => 'public/css/modal-connect.css',
            //'handbid-select2-css'        => 'public/css/select2.css',
            //'handbid-generic-styles-css' => 'public/css/handbid.css',
            //'handbid-less-buttons-css'   => 'public/less/buttons.less',
            //'handbid-less-modal-css'     => 'public/less/modal.less',
            //'handbid-less-css'           => 'public/less/handbid.less',
            //'handbid-less-responsive-css'=> 'public/less/responsive-fix.less',


            'handid-notices-css'   => 'public/css/pnotify.custom.min.css', // Probably should be changed on newest version, but there is problems with plugin docs
            //'smart-app-banner-css'       => 'public/plugins/smart-app-banner/smart-app-banner.css',
            'handid-bootstrap-css' => 'public/plugins/bootstrap/css/bootstrap.min.css',
            'handbid-select2-css'  => 'public/plugins/select2/css/select2.min.css',

            'handid-css' => 'public/css/app.min.css',

        );

        foreach ($styles as $key => $sc)
        {
            wp_register_style($key, plugins_url($sc, __FILE__));
            wp_enqueue_style($key);
        }

        $outerStyles = array(
            //'fonts-google-lato'          => 'https://fonts.googleapis.com/css?family=Lato:300,400,500',
            //'fonts-google-oswald'          => 'https://fonts.googleapis.com/css?family=Oswald',
        );

        foreach ($outerStyles as $key => $sc)
        {
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
                                                    'dir' => ABSPATH . 'wp-content/cache',
                                                ],
                                            ]
        );
    }

    // State
    function state()
    {

        if (!$this->state)
        {
            $this->state = new HandbidState($this->basePath, $this->handbid);
        }

        return $this->state;
    }

    // State
    function testimonials()
    {

        if (!$this->testimonials)
        {
            $this->testimonials = new HandbidTestimonials();
        }

        return $this->testimonials;
    }

    // Controllers
    function createActionController($viewRenderer = false)
    {
        if (!$viewRenderer)
        {
            $viewRenderer = $this->viewRender;
        }

        return new HandbidActionController($viewRenderer, $this->handbid, $this->state);
    }

    function createAdminActionController($viewRenderer = false, $isLocalCopy = false)
    {
        if (!$viewRenderer)
        {
            $viewRenderer = $this->viewRender;
        }

        return new HandbidAdminActionController($viewRenderer, $isLocalCopy);
    }

    function createRouteController($state = null)
    {
        if (!$state)
        {
            $state = $this->state;
        }

        return new HandbidRouter($state);
    }

    // View Renderer
    function createViewRenderer($basePath = false)
    {

        if (!$basePath)
        {
            $basePath = $this->basePath;
        }

        return new HandbidViewRenderer($basePath);
    }

    // ShortCodes
    function createShortCodeController($handbid = null, $viewRenderer = false, $state = false, $routeController = null)
    {

        if (!$viewRenderer)
        {
            $viewRenderer = $this->viewRender;
        }

        if (!$handbid)
        {
            $handbid = $this->handbid;
        }

        if (!$state)
        {
            $state = $this->state;
        }

        if (!$routeController)
        {
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
        if (!current_user_can('administrator') && !is_admin())
        {
            show_admin_bar(false);
        }
    }

    function getSocketUrl()
    {
        $socketUrl = get_option('handbidSocketUrl', 'https://socket.hand.bid');
        $socketUrl = (substr($socketUrl, -1) != "/") ? $socketUrl . "/" : $socketUrl;

        return $socketUrl;
    }


    function onRenderHeader()
    {

        global $post;
        $is_auction      = ($post->post_name == 'auction');
        $is_item         = ($post->post_name == 'auction-item');
        $is_organization = ($post->post_name == 'organization');

        $affiliateIOS    = "http://www.apple.com/itunes/affiliates/";
        $affiliateGoogle = "";

        $imageIOS    = "http://a3.mzstatic.com/us/r30/Purple3/v4/b9/fa/47/b9fa4799-502e-e4ba-6a96-bd5ce38929cb/icon175x175.jpeg";
        $imageGoogle = "https://lh3.googleusercontent.com/uiYA8FoF_ghTBsZ_QTRUAylYimM86FurQlVNsMaWdA5XT7HQgclGktOSjsBtGj1JfkKD=w300-rw";

        $auction = $this->state()->currentAuction();

        $og_page_url    = ($is_auction or $is_item or $is_organization or is_home()) ? get_bloginfo("url") . '/' : get_permalink();
        $site_title     = get_bloginfo('title');
        $og_description = get_bloginfo("description");
        $og_title       = $site_title;
        $og_image       = $imageGoogle;

        if ($is_auction)
        {
            $og_page_url    = $og_page_url . 'auctions/' . $auction->key . '/';
            $og_title       = implode(' | ', [$site_title, $auction->name]);
            $og_image       = (!empty($auction->imageUrl)) ? $auction->imageUrl : $og_image;
            $og_description = (!empty($auction->description)) ? $auction->description : $og_description;
        } elseif ($is_item)
        {
            $current_item   = $this->state()->currentItem();
            $og_page_url    = $og_page_url . 'auctions/' . $current_item->auction->key . '/item/' . $current_item->key . '/';
            $og_title       = implode(' | ', [$site_title, $current_item->auction->name, $current_item->name]);
            $og_image       = (!empty($current_item->imageUrl)) ? $current_item->imageUrl : $og_image;
            $og_description = (!empty($current_item->description)) ? $current_item->description : $og_description;

        } elseif ($is_organization)
        {
            $current_org    = $this->state()->currentOrg();
            $og_page_url    = $og_page_url . 'organizations/' . $current_org->key . '/';
            $og_title       = implode(' | ', [$site_title, $current_org->name]);
            $og_image       = (!empty($current_org->logo)) ? $current_org->logo : $og_image;
            $og_description = (!empty($current_org->description)) ? $current_org->description : $og_description;
        }

        if (!defined('HANDBID_FB_SHARE_URL'))
        {
            define('HANDBID_FB_SHARE_URL', $og_page_url);
        }

        $bidderToken = isset($_COOKIE["handbid-auth"]) ? str_replace("Authorization: Bearer ", "", $_COOKIE["handbid-auth"]) : "";
        $auctionGuid = isset($auction->auctionGuid) ? $auction->auctionGuid : "";

        $dataLink = add_query_arg(
            [
                "id"   => $bidderToken,
                "auid" => $auctionGuid,
            ],
            get_bloginfo("url") . "/autologin"
        );

        if (!defined("HANDBID_APP_REFERRER"))
        {
            define("HANDBID_APP_REFERRER", $dataLink);
        }

        $dataLinkIos = str_replace(["https", "http"], "handbid", $dataLink);


        $output = '
        <meta name="apple-itunes-app" content="app-id=' . HANDBID_APP_APPSTORE_ID . ', app-argument=' . $dataLinkIos . '" >
        <meta name="google-play-app" content="app-id=' . HANDBID_APP_GOOGLEPLAY_ID . ', app-argument=' . $dataLink . '">
        <link rel="apple-touch-icon" href="' . $imageIOS . '">
        <link rel="android-touch-icon" href="' . $imageGoogle . '" />


        <meta property="al:android:url" content="' . $dataLink . '">
        <meta property="al:android:package" content="' . HANDBID_APP_GOOGLEPLAY_ID . '">
        <meta property="al:android:app_name" content="Handbid">
        <meta property="al:android:class" content="' . HANDBID_APP_GOOGLEPLAY_ID . '.screens.activities.HandbidAutologinActivity">

        <meta property="al:web:url"
          content="' . $dataLink . '" />

        <meta property="og:title" content="' . esc_attr($og_title) . '" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="' . esc_attr($og_page_url) . '" />
        <meta property="og:image" content="' . esc_attr($og_image) . '" />
        <meta property="og:description" content="' . esc_attr($og_description) . '" />
        <meta property="fb:app_id" content="' . esc_attr(get_option('handbidFacebookAppId')) . '" />
        <link rel="canonical" href="' . esc_attr($og_page_url) . '" />
        ';
        echo $output;

    }

    function onRenderFooter()
    {

        global $displayBidderProfile, $post;

        //do we need to prompt for credit card?
        $auction   = $this->state()->currentAuction();
        $auctionID = isset($auction->id) ? $auction->id : 0;
        $bidder    = $this->state()->currentBidder($auctionID);

        //if(!$bidder) {
        echo do_shortcode('[handbid_bidder_login_form  auction_requires_cc=' . (($auction->requireCreditCard) ? 'true' : 'false') . ']');
        //}

        if (!$displayBidderProfile)
        {
            echo "<div class='handbid-credit-card-footer-form'>";
            echo "<input type='hidden' id='footer-credit-cards-count' value='" . count($bidder->creditCards) . "'>";
            echo do_shortcode('[handbid_bidder_profile_form template="views/bidder/credit-card-form" show_credit_card_required_message=true]');
            echo "</div>";
        }
        // Set Values

        $auctionGuid = (isset($auction->auctionGuid)) ? trim($auction->auctionGuid) : "";
        $auctionKey  = (isset($auction->key)) ? trim($auction->key) : "";
        $userGuid    = (isset($bidder->usersGuid)) ? trim($bidder->usersGuid) : "";

        // Determined Values
        $socketUrl     = $this->getSocketUrl();
        $nodeClientUrl = sprintf('%sclient', $socketUrl);

        $params = json_encode(["secure" => true, "cookie" => $userGuid]);

        ?>
        <script>
            var auctionChannelId = '<?php echo $auctionGuid; ?>',
                currentAuctionKey = '<?php echo $auctionKey; ?>',
                userChannelId = '<?php echo $userGuid; ?>',
                url = '<?php echo $nodeClientUrl; ?>',
                params = <?php echo $params; ?>,
                stripePublishableKey = '<?php echo $this->state->getStripeApiKey();?>',
                smoochAppToken = '<?php echo $this->state->getSmoochToken();?>',
                mapsAreActivated = false;

            var forcePageRefreshAfterBids = <?php echo (get_option('handbidForceRefresh', 'no') == "yes") ? "true" : "false";?>;
            var forcePageRefreshAfterPurchases = <?php echo (get_option('handbidForceRefreshAfterPurchases', 'no') == "yes") ? "true" : "false";?>;

        </script>
        <script type="text/javascript">
            (function (h, l, i, n, k, s) {
                s = h.createElement(i);
                s.type = "text/javascript";
                s.async = 1;
                s.src = l + n + ".js";
                k = h.getElementsByTagName(i)[0];
                k.parentNode.insertBefore(s, k);
            })(document, "//cdn.hokolinks.com/banner/v1/", "script", "af303d2c3f3fb386");
        </script>
        <script type="text/javascript">
            WebFontConfig = {
                google: {families: ['Lato:300,400,500', 'Oswald']}
            };
            (function () {
                var wf = document.createElement('script');
                wf.src = ('https:' == document.location.protocol ? 'https' : 'http') +
                    '://ajax.googleapis.com/ajax/libs/webfont/1.5.18/webfont.js';
                wf.type = 'text/javascript';
                wf.async = 'true';
                var s = document.getElementsByTagName('script')[0];
                s.parentNode.insertBefore(wf, s);
            })(); </script>

        <?php if (!defined('HANDBID_PAGE_TYPE') or (defined('HANDBID_PAGE_TYPE') and HANDBID_PAGE_TYPE == 'auction-item'))
    { ?>
        <script>(function (d, s, id) {
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) return;
                js = d.createElement(s);
                js.id = id;
                js.src = "//connect.facebook.net/en_US/sdk.js#xfbml=1&appId=<?php echo get_option('handbidFacebookAppId'); ?>&version=v2.0";
                fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));</script>
    <?php } ?>
        <?php

        $currencyCode   = (isset($auction->currencyCode)) ? $auction->currencyCode : HANDBID_DEFAULT_CURRENCY;
        $currencySymbol = (isset($auction->currencySymbol)) ? $auction->currencySymbol : HANDBID_DEFAULT_CURRENCY_SYMBOL;

        $spendingThreshold = (isset($auction->spendingThreshold)) ? (int)$auction->spendingThreshold : 0;
        echo '<input type="hidden" data-auction-spending-threshold value="' . $spendingThreshold . '">';

        echo '<input type="hidden" data-auction-currency-code="' . $currencyCode . '">';
        echo '<input type="hidden" data-auction-currency-symbol="' . $currencySymbol . '">';

        echo '<input type="hidden" data-initial-auction-category value="' . (($post->post_name == 'auction' and !empty($_GET["initial-category"])) ? ((int)$_GET["initial-category"]) : 0) . '">';

        $bidderID = (isset($bidder->id)) ? $bidder->id : 0;
        echo '<input type="hidden" data-dashboard-profile-id="' . $bidderID . '">';
        echo '<input type="hidden" data-default-item-image value="' . plugins_url("handbid/public/images/default-item-image.jpg") . '">';
        echo '<input type="hidden" data-handbid-app-appstore value="' . HANDBID_APP_APPSTORE . '">';
        echo '<input type="hidden" data-handbid-app-appstore-ipad value="' . HANDBID_APP_APPSTORE_IPAD . '">';
        echo '<input type="hidden" data-handbid-app-googleplay value="' . HANDBID_APP_GOOGLEPLAY . '">';

        $isCustomizerPage = (isset($_SERVER["HTTP_REFERER"]) and (explode("?", basename($_SERVER["HTTP_REFERER"]))[0] == "customize.php"));
        if ($isCustomizerPage)
        {
            echo do_shortcode("[handbid_customizer_styles]");
        } else
        {
            echo '<link rel="stylesheet" href="' . add_query_arg(array("action" => "handbid_ajax_customizer_css"), admin_url("admin-ajax.php")) . '" media="all"/>';
        }

        if (isset($_GET["auction-reset"]))
        {
            echo '<input type="hidden" data-auction-reset-sign>';
        }

        if ($this->state->getMapVisibility())
        {
            $currentPostID = get_the_ID();
            $currentPost   = get_post($currentPostID);
            if (in_array($currentPost->post_name, ['auction', 'organization']))
            {
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
