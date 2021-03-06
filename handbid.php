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
 * @category  handbid
 * @package   Handbid2-WordPress
 * @license   Proprietary
 * @link      http://www.handbid.com/
 * @author    Master of Code (worldclass@masterofcode.com)
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
        add_filter('body_class', [$this, 'setBodyClasses']);


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
            }
            else
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

        $outerScripts = [
            'socket-io-js'   => $socketIoUrl,
            'stripe-api-js'  => 'https://js.stripe.com/v2/',
            'smooch-chat-js' => 'https://cdn.smooch.io/smooch.min.js',
        ];

        foreach ($outerScripts as $key => $sc)
        {
            wp_register_script($key, $sc, [], null, true);
            wp_enqueue_script($key);
        }

        $scripts = [
            'handbid-details-map-js' => 'resources/js/details-map.js',
            'yii-node-socket-js'     => 'public/js/yii-node-socket.js',
            'node-socket-manager-js' => 'public/js/node-socket-manager.js',
            'stripe-init-js'         => 'public/js/stripe-init.js',
            'smooch-init-js'         => 'public/js/smooch-init.js',

//            'handbid-notices-js'   => 'public/js/pnotify.custom.min.js',
//            'progress-bar-js'      => 'public/plugins/progressbar.js/progressbar.min.js',
//            'cookie-plugin-js'     => 'public/plugins/jquery.cookie/jquery.cookie.js',
//            'visible-plugin-js'    => 'public/plugins/df-visible/jquery.visible.min.js',
//            'handbid-isotope-js'   => 'public/plugins/isotope/isotope.pkgd.min.js',
//            'handbid-unslider-js'  => 'public/plugins/unslider/js/unslider-min.js',
//            'handbid-bootstrap-js' => 'public/plugins/bootstrap/js/bootstrap.min.js',
//            'handbid-select2-js'   => 'public/plugins/select2/js/select2.full.min.js',

            'handbid-pl-js' => 'public/js/plugins.min.js',
            'handbid-js' => 'public/js/app.min.js',

        ];

        foreach ($scripts as $key => $sc)
        {
            wp_register_script($key, plugins_url($sc, __FILE__), [], null, true);
            wp_enqueue_script($key);
        }


        $styles = [
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


            'handid-notices-css'   => 'public/css/pnotify.custom.min.css',
            // Probably should be changed on newest version, but there is problems with plugin docs
            //'smart-app-banner-css'       => 'public/plugins/smart-app-banner/smart-app-banner.css',
            'handid-bootstrap-css' => 'public/plugins/bootstrap/css/bootstrap.min.css',
            'handbid-select2-css'  => 'public/plugins/select2/css/select2.min.css',

            'handid-css' => 'public/css/app.min.css',

        ];

        foreach ($styles as $key => $sc)
        {
            wp_register_style($key, plugins_url($sc, __FILE__));
            wp_enqueue_style($key);
        }

        $outerStyles = [
            //'fonts-google-lato'          => 'https://fonts.googleapis.com/css?family=Lato:300,400,500',
            //'fonts-google-oswald'          => 'https://fonts.googleapis.com/css?family=Oswald',
        ];

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

        return new HandbidRouter($state, $this->handbid);
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
        $qvars[] = 'invoice';
        $qvars[] = 'organization';
        $qvars[] = 'auction';
        $qvars[] = 'item';

        return $qvars;
    }

    function setBodyClasses( $classes ) {

        global $post;

        if($post)
        {
            $classes[] = 'page-'.$post->post_name;
        }

        return $classes;

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
        $y_description  = get_post_meta(get_the_ID(), '_yoast_wpseo_metadesc', true);
        $og_description = (!empty($y_description)) ? $y_description : get_bloginfo("description");
        $og_title       = $site_title;
        $og_image       = $imageGoogle;

        if ($is_auction)
        {
            $og_page_url    = $og_page_url . 'auctions/' . $auction->key . '/';
            $og_title       = implode(' | ', [$auction->organizationName, $auction->name]);
            $og_image       = (!empty($auction->imageUrl)) ? $auction->imageUrl : $og_image;
            $og_description = (!empty($auction->description)) ? $auction->description : $og_description;
        }
        elseif ($is_item)
        {
            $current_item   = $this->state()->currentItem();
            $og_page_url    = $og_page_url . 'auctions/' . $current_item->auction->key . '/item/' . $current_item->key . '/';
            $og_title       = implode(' | ', [$current_item->auction->organizationName, $current_item->auction->name,
                                              $current_item->name]);
            $og_image       = (!empty($current_item->imageUrl)) ? $current_item->imageUrl : $og_image;
            $og_description = (!empty($current_item->description)) ? $current_item->description : $og_description;

        }
        elseif ($is_organization)
        {
            $current_org    = $this->state()->currentOrg();
            $og_page_url    = $og_page_url . 'organizations/' . $current_org->key . '/';
            $og_title       = implode(' | ', [$current_org->name, $site_title]);
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
        <link rel="canonical" href="' . esc_attr($og_page_url) . '" />
        ';
        echo $output;

    }

    function onRenderFooter()
    {

        global $displayBidderProfile, $post;

        $auction   = $this->state()->currentAuction();
        $auctionID = isset($auction->id) ? $auction->id : 0;
        $auctionSlug = isset($auction->key) ? $auction->key : '';
        $bidder    = $this->state()->currentBidder($auctionID);

        echo do_shortcode('[handbid_bidder_login_form  auction_requires_cc=' . (($auction->requireCreditCard) ? 'true' : 'false') . ']');

        echo "<div class='handbid-credit-card-footer-form'>";
        echo "<input type='hidden' id='footer-auction-id' value='" . $auctionID . "'>";
        echo "<input type='hidden' id='footer-auction-slug' value='" . $auctionSlug . "'>";
        echo "<input type='hidden' id='footer-credit-cards-count' value='" . count($bidder->creditCards) . "'>";
        echo do_shortcode('[handbid_bidder_profile_form template="views/bidder/credit-card-form" show_credit_card_required_message=true]');
        echo "</div>";


        $auctionGuid = (isset($auction->auctionGuid)) ? trim($auction->auctionGuid) : "";
        $auctionKey  = (isset($auction->key)) ? trim($auction->key) : "";
        $userGuid    = (isset($bidder->usersGuid)) ? trim($bidder->usersGuid) : "";

        // Determined Values
        $socketUrl     = $this->getSocketUrl();
        $nodeClientUrl = sprintf('%sclient', $socketUrl);

        $params = json_encode(["secure" => true, "cookie" => $userGuid]);

        $smoochSettings = [
            'appToken'   => $this->state->getSmoochToken(),
            'properties' => [],
        ];

        if (isset($bidder->usersGuid))
        {
            $smoochSettings['userId']     = $bidder->email;
            $smoochSettings['email']      = $bidder->email;
            $smoochSettings['givenName']  = $bidder->firstName;
            $smoochSettings['surname']    = $bidder->lastName;
            $smoochSettings['properties'] = array_merge($smoochSettings['properties'], [
                'user.countryCode'       => $bidder->countryCode,
                'user.cellPhone'         => $bidder->userCellPhone,
                'user.guid'              => $bidder->usersGuid,
                'user.fullName'          => $bidder->name,
                'user.creditCards.count' => count($bidder->creditCards),
            ]);
        }

        if (isset($auction->id))
        {
            $smoochSettings['properties'] = array_merge($smoochSettings['properties'], [
                'auction.id'   => $auction->id,
                'auction.name' => $auction->name,
                'auction.guid' => $auction->auctionGuid,
            ]);
        }

        ?>
        <script>
            var auctionChannelId = '<?php echo $auctionGuid; ?>',
                currentAuctionKey = '<?php echo $auctionKey; ?>',
                userChannelId = '<?php echo $userGuid; ?>',
                url = '<?php echo $nodeClientUrl; ?>',
                params = <?php echo $params; ?>,
                stripePublishableKey = '<?php echo $this->state->getStripeApiKey();?>',
                mapsAreActivated = false,
                smoochSettings = <?php echo json_encode($smoochSettings);?>;

            var forcePageRefreshAfterBids = <?php echo (get_option('handbidForceRefresh', 'no') == "yes") ? "true" : "false";?>;
            var forcePageRefreshAfterPurchases = <?php echo (get_option('handbidForceRefreshAfterPurchases', 'no') == "yes") ? "true" : "false";?>;

            var branch_settings = {
                icon: 'http://is2.mzstatic.com/image/thumb/Purple41/v4/ae/fe/3b/aefe3b2f-f700-ade0-a0a9-6ee1a3cf6b8b/source/175x175bb.jpg',
                rating: 4.5,
                reviewCount: 70
            };

            if(navigator.userAgent.toLowerCase().indexOf("android") > -1){
                branch_settings = {
                    icon: 'https://lh3.googleusercontent.com/uiYA8FoF_ghTBsZ_QTRUAylYimM86FurQlVNsMaWdA5XT7HQgclGktOSjsBtGj1JfkKD=w300-rw',
                    rating: 3.5,
                    reviewCount: 28
                };
            }

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


        <script type="text/javascript">
            (function(b,r,a,n,c,h,_,s,d,k){if(!b[n]||!b[n]._q){for(;s<_.length;)c(h,_[s++]);d=r.createElement(a);d.async=1;d.src="https://cdn.branch.io/branch-latest.min.js";k=r.getElementsByTagName(a)[0];k.parentNode.insertBefore(d,k);b[n]=h}})(window,document,"script","branch",function(b,r){b[r]=function(){b._q.push([r,arguments])}},{_q:[],_v:1},"addListener applyCode banner closeBanner creditHistory credits data deepview deepviewCta first getCode init link logout redeem referrals removeListener sendSMS setBranchViewData setIdentity track validateCode".split(" "), 0);

            var branch_key = 'key_live_mdFnqn80e1w80tsQ6uS5UijgAyhd9a3x';

            var banner_settings = {
                icon                  : branch_settings.icon,
                title                 : 'Handbid',
                description           : 'Mobile Silent Auction',
                rating                : branch_settings.rating,
                reviewCount           : branch_settings.reviewCount,
                openAppButtonText     : 'Open',
                downloadAppButtonText : 'Download',
                showiOS               : true,
                showiPad              : true,
                showAndroid           : true,
                showBlackberry        : false,
                showWindowsPhone      : false,
                showKindle            : false,
                showDesktop           : false,
                forgetHide            : false
            };

            var link_settings = {
                data: {
                    auction_image: '<?php echo $auction->imageUrl; ?>',
                    auction_title: '<?php echo $auction->name; ?>',
                    bidder_name: '<?php echo $bidder->firstName . ' ' . $bidder->lastName; ?>',
                    paddle_number: '<?php echo $bidder->currentPaddleNumber; ?>',
                    '$deeplink_path': window.location.pathname
                }
            };

            branch.init(branch_key, {}, function(err, data) {

                if((data.data_parsed.$deeplink_path != undefined)
                   && window
                   && window.location
                   && window.location.search
                   && (window.location.search.indexOf("_branch_match_id") > -1)){
                    var deeplink_path = data.data_parsed.$deeplink_path;
                    deeplink_path = deeplink_path
                        .split('http://').join('')
                        .split('https://').join('')
                        .split('st-wp.handbid.com').join('')
                        .split('www.handbid.com').join('')
                        .split('handbid.com').join('');
                    window.location = deeplink_path;
                }
                else{
                    branch.banner(banner_settings, link_settings);
                }
            });

        </script>

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
        }
        else
        {
            echo '<link rel="stylesheet" href="' . add_query_arg(["action" => "handbid_ajax_customizer_css"], admin_url("admin-ajax.php")) . '" media="all"/>';
        }

        if (isset($_GET["auction-reset"]))
        {
            echo '<input type="hidden" data-auction-reset-sign>';
        }

        if (isset($_GET["pay_invoice"]))
        {
            echo '<input type="hidden" data-auction-continue-payment-sign value="' . intval($_GET["pay_invoice"]) . '">';
        }

        $google_api_key = 'AIzaSyAAq80YJt_UEdNvabAMyZPg3usiPn2e9ek'; // by Woody
        $google_api_key = 'AIzaSyA19yroJEilO86dD8dllbH2j4ZiV2dxbDQ'; // by prod
        $google_api_key = 'AIzaSyAJsBZcOzH5mWubgqRYnefsSIN9aQtAsiI'; // by Serhii - default - need to test

        $google_api_key = (!empty($_GET["google_key"])) ? $_GET["google_key"] : $google_api_key;

        $map_params = [
            'v' => '3.exp',
            'key' => $google_api_key,
            'libraries' => 'places',
        ];



        if ($this->state->getMapVisibility())
        {
            $currentPostID = get_the_ID();
            $currentPost   = get_post($currentPostID);
            if (in_array($currentPost->post_name, ['auction', 'auctions', 'auction-item', 'organization']))
            {
                $map_params['callback'] = 'auctionGoogleMapsInit';
            }
        }

        $map_url = add_query_arg($map_params, 'https://maps.googleapis.com/maps/api/js');

        echo '<script async defer src="' . $map_url . '"></script>';
    }

    function logout()
    {

        if (isset($_COOKIE['handbid-auth']))
        {
            unset($_COOKIE['handbid-auth']);
            setcookie('handbid-auth', null, time() - 3600, COOKIEPATH, COOKIE_DOMAIN);
        }

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
