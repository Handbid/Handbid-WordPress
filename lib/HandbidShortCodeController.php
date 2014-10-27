<?php

/**
 * Class HandbidShortCodeController
 *
 * Handles all of the wordpress shortcode mapping to the plugin. This is where all of the shortcodes can
 * be seen and how they interact with the Handbid plugin
 *
 */
class HandbidShortCodeController
{

    public $viewRenderer;
    public $basePath;
    public $state;
    public $handbid;
    public $routeController;

    public function __construct(
        \Handbid\Handbid $handbid,
        HandbidViewRenderer $viewRenderer,
        $basePath,
        $state,
        $routeController,
        $config = []
    )
    {
        $this->handbid = $handbid;
        $this->viewRenderer = $viewRenderer;
        $this->basePath = $basePath;
        $this->state = $state;
        $this->routeController = $routeController;

        // loop through our objects and save them as parameters
        forEach ($config as $k => $v) {
            $this->$k = $v;
        }
    }

    public function init()
    {
        // Loop through and add in shortcodes, it goes:
        // [wordpress_shortcode]              => 'mappedFunctions'
        $shortCodes = [
            'handbid_pager'                 => 'pager',
            'handbid_organization_list'     => 'organizationList',
            'handbid_organization_details'  => 'organizationDetails',
            'handbid_organization_auctions' => 'organizationAuctions',
            'handbid_connect'               => 'connect',
            'handbid_auction_list'          => 'auctionList',
            'handbid_auction_timer'         => 'auctionTimer',
            'handbid_auction_banner'        => 'auctionBanner',
            'handbid_auction_details'       => 'auctionDetails',
            'handbid_auction_item_list'     => 'auctionItemList',
            'handbid_auction_ticket_list'   => 'ticketList',
            'handbid_item_details'          => 'itemDetails',
            'handbid_item_bids'             => 'itemBids',
            'handbid_bid'                   => 'bidNow',
            'handbid_facebook_comments'     => 'facebookComments',
            'handbid_social_share'          => 'socialShare',
            'handbid_bidder_profile'        => 'myProfile',
            'handbid_bidder_notifications'  => 'myNotifications',
            'handbid_bidder_bids'           => 'myBids',
            'handbid_bidder_proxy_bids'     => 'myProxyBids',
            'handbid_bidder_purchases'      => 'myPurchases',
            'handbid_bidder_profile_form'   => 'bidderProfileForm',
            'handbid_is_logged_in'          => 'isLoggedIn',
            'handbid_is_logged_out'         => 'isLoggedOut',
            'handbid_breadcrumb'            => 'breadcrumbs',
            'handbid_bidder_credit_cards'   => 'myCreditCards',
            'handbid_bidder_receipt'        => 'bidderReceipt'
        ];

        forEach ($shortCodes as $shortCode => $callback) {
            add_shortcode($shortCode, [$this, $callback]);
        }
    }

    // Helpers
    public function templateFromAttributes($attributes, $default)
    {

        $templates = [];
        $template = '';

        if (!is_array($attributes) || !isset($attributes['template']) || !$attributes['template']) {
            $templates[] = $template = $default;
        } else {
            $templates[] = $template = $attributes['template'];
        }

        //if the template does not start
        if ($template != DIRECTORY_SEPARATOR) {
            $templates[] = get_template_directory() . DIRECTORY_SEPARATOR . $template;
        }

        return $templates;
    }

    // Organization
    public function organizationDetails($attributes)
    {
        try {

            $template = $this->templateFromAttributes($attributes, 'views/organization/details');

            $organization = $this->state->currentOrg();

            $markup = $this->viewRenderer->render(
                $template,
                [
                    'organization' => $organization
                ]
            );

            return $markup;
        } catch (Exception $e) {
            echo "Oops we could not find the organization you were looking for, Please try again later.";
            $this->logException($e);
            return;
        }
    }

    //
    public function organizationAuctions($attributes)
    {
        try {

            $template = $this->templateFromAttributes($attributes, 'views/auction/list');

            $org = $this->state->currentOrg();

            //let you change how you search
            if(isset($_GET['auction_list'])) {
                $attributes['type'] = $_GET['auction_list'];
            }


            if (!isset($attributes['type']) || !is_array($attributes) || !in_array(
                    $attributes['type'],
                    ['current', 'upcoming', 'byOrg', 'past', 'closed', 'open', 'preview', 'presale']
                )
            ) {
                $attributes['type'] = 'byOrg';
            }

            // Get orgs from handbid server
            if($org) {
                $auctions = $this->handbid->store('Auction')->{$attributes['type']}(0, 25, 'name', 'ASC', $org->_id);
            } else {
                $auctions = [];
            }

            $markup = $this->viewRenderer->render(
                $template,
                [
                    'auctions' => $auctions
                ]
            );

            return $markup;
        } catch (Exception $e) {
            echo "Organizations auctions could not be found, please try again later. Please make sure you have the proper organization key set";
            $this->logException($e);
            return;
        }
    }

    // Auctions

    public function auctionList($attributes)
    {

        try {

            $template = $this->templateFromAttributes($attributes, 'views/auction/list');
            $query = [];

            //let you change how you search
            if(isset($_GET['auction_list'])) {
                $attributes['type'] = $_GET['auction_list'];
            }

            if (!isset($attributes['type']) || !is_array($attributes) || !in_array(
                    $attributes['type'],
                    ['current', 'upcoming', 'all', 'past', 'closed', 'open', 'preview', 'presale']
                )
            ) {
                $attributes['type'] = 'current';
            }

            //paging and sort
            $page = isset($attributes['page']) ? $attributes['page'] : 0;
            $pageSize = isset($attributes['page_size']) ? $attributes['page_size'] : 25;
            $sortField = isset($attributes['sort_field']) ? $attributes['sort_field'] : "name";
            $sortDirection = isset($attributes['sort_direction']) ? $attributes['sort_direction'] : "asc";
            $id = isset($attributes['id']) ? $attributes['id'] : 'auctions';

            $auctions = $this->handbid->store('Auction')->{$attributes['type']}(
                $page,
                $pageSize,
                $sortField,
                $sortDirection
            );

            $total = $this->handbid->store('Auction')->count($attributes['type']);

            $markup = $this->viewRenderer->render(
                $template,
                [
                    'auctions' => $auctions,
                    'total' => $total,
                    'id' => $id,
                    'total' => $total,
                    'page_size' => $pageSize,
                    'page' => $page
                ]
            );

            return $markup;

        } catch (Exception $e) {
            echo "Auctions could not be loaded, please try again later.";
            $this->logException($e);
            return;
        }

    }

    public function organizationList($attributes)
    {

        try {

            $template = $this->templateFromAttributes($attributes, 'views/organization/list');

            //paging and sort
            $page = isset($attributes['page']) ? $attributes['page'] : 0;
            $pageSize = isset($attributes['page_size']) ? $attributes['page_size'] : 25;
            $sortField = isset($attributes['sort_field']) ? $attributes['sort_field'] : "name";
            $sortDirection = isset($attributes['sort_direction']) ? $attributes['sort_direction'] : "asc";
            $logoWidth = isset($attributes['logo_width']) ? $attributes['logo_width'] : 200;
            $logoHeight = isset($attributes['logo_height']) ? $attributes['logo_height'] : false;
            $id = isset($attributes['id']) ? $attributes['id'] : 'orgs';

            $query = [];

            $organizations = $this->handbid->store('Organization')->all(
                $page,
                $pageSize,
                $sortField,
                $sortDirection,
                $query,
                [
                    'logo' => [
                        'w' => $logoWidth,
                        'h' => $logoHeight
                    ]
                ]
            );

            $total = $this->handbid->store('Organization')->count($query);

            $markup = $this->viewRenderer->render(
                $template,
                [
                    'organizations' => $organizations,
                    'total' => $total,
                    'id' => $id,
                    'total' => $total,
                    'page_size' => $pageSize,
                    'page' => $page
                ]
            );

            return $markup;

        } catch (Exception $e) {
            echo "Organizations could not be found, please try again later.";
            $this->logException($e);
            return;
        }

    }

    public function auctionBanner($attributes)
    {

        try {

            $auction = $this->state->currentAuction($attributes);

            $profile = null;
            $totalProxies = null;
            $totalWinning = null;
            $totalLosing = null;
            $totalPurchases = null;

            try {

                $profile = $this->handbid->store('Bidder')->myProfile($auction->_id);
                if ($profile) {

                    $totalWinning = count($this->handbid->store('Bid')->myBids($profile->pin, $auction->_id));
                    $totalLosing = count($this->handbid->store('Bid')->myLosing($profile->pin, $auction->_id));
                    $totalProxies = count($this->handbid->store('Bid')->myProxyBids($profile->pin, $auction->_id));
                    $totalPurchases = count($this->handbid->store('Bid')->myPurchases($profile->pin, $auction->_id));

                }

            } catch (Exception $e) {

                $in = $e;
                //                debug();

            }

            $template = $this->templateFromAttributes($attributes, 'views/auction/banner');

            return $this->viewRenderer->render(
                $template,
                [
                    'auction' => $auction,
                    'winningBids' => $totalWinning,
                    'losingBids' => $totalLosing,
                    'purchases' => $totalPurchases,
                    'profile' => $profile,
                    'proxies' => $totalProxies
                ]
            );

        } catch (Exception $e) {

            echo "Auction banner could not be loaded, Please try again later.";
            $this->logException($e);

            return;

        }

    }

    public function connect($attributes)
    {

        try {
            $template = $this->templateFromAttributes($attributes, 'views/connect');
            $bidder = $this->state->currentBidder($attributes);
            $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";

            $default = $protocol . $_SERVER["HTTP_HOST"] . $_SERVER["REQUEST_URI"];

            return $this->viewRenderer->render(
                $template,
                [
                    'bidder' => $bidder,
                    'passUrl' => isset($attributes['passUrl']) ? $attributes['passUrl'] : $default,
                    'failUrl' => isset($attributes['failUrl']) ? $attributes['failUrl'] : $default,
                ]
            );
        } catch (Exception $e) {
            echo "Rendering connect button failed.";
            $this->logException($e);
            return;
        }


    }

    public function auctionDetails($attributes)
    {

        try {

            $template = $this->templateFromAttributes($attributes, 'views/auction/details');
            $auction = $this->state->currentAuction($attributes);

            $categoryStore = $this->handbid->store('ItemCategory');
            $categories = $categoryStore->byAuction($auction->_id);
            $itemQuery = [
                'options' => [
                    'images' => [
                        'w' => 225,
                        'h' => false
                    ]
                ]
            ];

            $items = $this->handbid->store('Item')->byAuction($auction->_id, $itemQuery);

            $categoryStore->populateNumItems($categories, $items);

            return $this->viewRenderer->render(
                $template,
                [
                    'auction' => $auction,
                    'categories' => $categories,
                    'items' => $items
                ]
            );

        } catch (Exception $e) {

            echo "Auction details could not be loaded, Please try again later.";
            $this->logException($e);

            return;
        }
    }

    public function auctionTimer($attributes)
    {

        try {

            $template = $this->templateFromAttributes($attributes, 'views/auction/timer');
            $auction = $this->state->currentAuction($attributes);

            return $this->viewRenderer->render(
                $template,
                [
                    'auction' => $auction,
                ]
            );

        } catch (Exception $e) {
            $this->logException($e);
            return;
        }
    }

    public function auctionItemList($attributes)
    {

        try {
            $auction = $this->state->currentAuction($attributes);
            $query = [
                'options' => [
                    'images' => [
                        'w' => 225,
                        'h' => false
                    ]
                ]
            ];

            $items = $this->handbid->store('Item')->byAuction($auction->_id, $query);
            $auction = $this->state->currentAuction();
            $template = $this->templateFromAttributes($attributes, 'views/item/list');

            return $this->viewRenderer->render(
                $template,
                [
                    'items' => $items,
                    'auction' => $auction
                ]
            );
        } catch (Exception $e) {
            echo "Auction Item List could not be found, please try again later.";
            $this->logException($e);
            return;
        }

    }

    // Items
    public function itemDetails($attributes)
    {
        try {

            $template = $this->templateFromAttributes($attributes, 'views/item/details');

            $item       = $this->state->currentItem($attributes);
            $auction    = $this->state->currentAuction();
            $related    = null;

            if ($attributes !== '' && $item && in_array( 'include_related', $attributes)) {

                $related = $this->handbid->store('Item')->related($item->_id, [
                    'config' => [
                        'skip'  => isset($attributes['related_skip']) ? $attributes['related_skip'] : 0,
                        'limit'  => isset($attributes['related_limit']) ? $attributes['related_limit'] : 3,
                    ]
                ]);
            }

            return $this->viewRenderer->render(
                $template,
                [
                    'item' => $item,
                    'related' => $related,
                    'auction' => $auction
                ]
            );
        } catch (Exception $e) {
            echo "Item could not be loaded. Please try again later.";
            $this->logException($e);
            return;
        }
    }

    public function itemBids($attributes)
    {
        try {

            $template = $this->templateFromAttributes($attributes, 'views/item/bids');

            $item    = $this->state->currentItem($attributes);
            $profile = $this->state->currentBidder();
            $bids    = null;

            if ($item) {
                $bids = $this->handbid->store('Bid')->itemBids($item->_id);
            }

            return $this->viewRenderer->render(
                $template,
                [
                    'item'    => $item,
                    'profile' => $profile,
                    'bids'    => $bids
                ]
            );
        } catch (Exception $e) {
            echo "Item could not be loaded. Please try again later.";
            $this->logException($e);
            return;
        }
    }

    public function bidNow($attributes)
    {
        try {
            $template = $this->templateFromAttributes($attributes, 'views/item/bid');

            $item       = $this->state->currentItem();
            $auction    = $this->state->currentAuction();

            $bids       = $this->handbid->store('Bid')->itemBids($item->_id);
            $profile    = $this->handbid->store('Bidder')->myProfile();

            return $this->viewRenderer->render(
                $template,
                [
                    'item'      => $item,
                    'bids'      => $bids,
                    'profile'   => $profile,
                    'auction'   => $auction
                ]
            );
        } catch (Exception $e) {

            echo "Bid now feature could not be loaded, please try again later.";
            $this->logException($e);

            return;
        }
    }

    // Social
    public function facebookComments($attributes)
    {
        {
            try {
                $auction = $this->state->currentAuction();
                $item = $this->state->currentItem();
                $customUrl = isset($auction->key) ? $auction->key : '' . isset($item->key) ? $item->key : '';
                $template = $this->templateFromAttributes($attributes, 'views/facebook/comments');

                return $this->viewRenderer->render(
                    $template,
                    [
                        'url' => $customUrl
                    ]
                );
            } catch (Exception $e) {
                echo "Facebook Comments could not be loaded, Please try again later.";
                $this->logException($e);
                return;
            }
        }

    }
    public function socialShare($attributes)
    {
        {
            try {
                $template = $this->templateFromAttributes($attributes, 'views/social/share');

                return $this->viewRenderer->render(
                    $template, []
                );
            } catch (Exception $e) {
                echo "Social Share could not be loaded, Please try again later.";
                $this->logException($e);
                return;
            }
        }

    }

    // Bidder
    public function myProfile($attributes)
    {

        try {
            $template = $this->templateFromAttributes($attributes, 'views/bidder/profile');
            $profile = $this->handbid->store('Bidder')->myProfile();

            if ($profile) {
                $img = wp_get_image_editor($profile->photo);
                if (!is_wp_error($img)) {


                    $thumbWidth  = isset($attributes['thumb_width']) ? $attributes['thumb_width'] : 250;
                    $thumbHeight = isset($attributes['thumb_height']) ? $attributes['thumb_height'] : false;
                    $thumbCrop   = isset($attributes['thumb_crop']) ? $attributes['thumb_crop'] : true;

                    $img->resize($thumbWidth, $thumbHeight, $thumbCrop);
                    $img->save(ABSPATH . 'wp-content/uploads/user-photos/' . $profile->pin . '.png');
                    $newPhoto = get_site_url() . '/wp-content/uploads/user-photos/' . $profile->pin . '.png';
                }

                if (isset($newPhoto)) {
                    $profile->photo = $newPhoto;
                }
            }

            $auction = $this->state->currentAuction();

            $winning    = null;
            $losing     = null;
            $purchases  = null;
            $proxyBids  = null;
            $totalSpent = 0;
            $myAuctions = $this->handbid->store('Auction')->myRecent();

            if ($auction && $profile) {

                $winning    = $this->handbid->store('Bid')->myBids($profile->pin, $auction->_id);
                $losing     = $this->handbid->store('Bid')->myLosing($profile->pin, $auction->_id);
                $purchases  = $this->handbid->store('Bid')->myPurchases($profile->pin, $auction->_id);
                $proxyBids  = $this->handbid->store('Bid')->myProxyBids($profile->pin, $auction->_id);

                foreach($winning as $w) {
                    $totalSpent += $w->amount;
                }

                foreach($purchases as $p) {
                    $totalSpent += $p->grandTotal;
                }

            }

            return $this->viewRenderer->render(
                $template,
                [
                    'auction'       => $auction,
                    'profile'       => $profile,
                    'winning'       => $winning,
                    'losing'        => $losing,
                    'purchases'     => $purchases,
                    'maxBids'       => $proxyBids,
                    'myAuctions'    => $myAuctions,
                    'totalSpent'    => $totalSpent
                ]
            );
        } catch (Exception $e) {
            echo "Profile could not be loaded. Please try again later.";
            $this->logException($e);
            return;
        }
    }

    public function myBids($attributes)
    {
        try {

            $template = $this->templateFromAttributes($attributes, 'views/bidder/bids');
            $profile = $this->handbid->store('Bidder')->myProfile();
            $auction = $this->state->currentAuction();

            return $this->viewRenderer->render(
                $template,
                [
                    'winning' => $this->handbid->store('Bid')->myBids($profile->pin, $auction->_id),
                    'losing' => $this->handbid->store('Bid')->myLosing($profile->pin, $auction->_id),
                    'auction' => $auction
                ]
            );
        } catch (Exception $e) {
            echo "bids could not be loaded, Please try again later.";
            $this->logException($e);
            return;
        }
    }

    public function myNotifications($attributes)
    {
        try {

            $template       = $this->templateFromAttributes($attributes, 'views/bidder/notifications');
            $notifications  = $this->handbid->store('Notification')->all();

            return $this->viewRenderer->render(
                $template,
                [
                    'notifications' => $notifications
                ]
            );

        } catch (Exception $e) {
            echo "notifications could not be loaded, Please try again later.";
            $this->logException($e);
            return;
        }
    }

    public function myProxyBids($attributes)
    {
        try {
            $template = $this->templateFromAttributes($attributes, 'views/bidder/proxybids');
            $profile = $this->handbid->store('Bidder')->myProfile();
            $auction = $this->state->currentAuction();

            return $this->viewRenderer->render(
                $template,
                [
                    'bids' => $this->handbid->store('Bid')->myProxyBids($profile->pin, $auction->_id),
                    'auction' => $auction
                ]
            );
        } catch (Exception $e) {
            echo "Max bids could not be loaded. Please try again later.";
            $this->logException($e);
            return;
        }
    }

    public function myPurchases($attributes)
    {
        try {

            $template = $this->templateFromAttributes($attributes, 'views/bidder/purchases');
            $profile = $this->handbid->store('Bidder')->myProfile();
            $auction = $this->state->currentAuction();

            return $this->viewRenderer->render(
                $template,
                [
                    'purchases' => $this->handbid->store('Bid')->myPurchases($profile->pin, $auction->_id),
                    'auction' => $auction
                ]
            );

        } catch (Exception $e) {
            echo "purchases could not be loaded, Please try again later.";
            $this->logException($e);
            return;
        }
    }

    public function bidderProfileForm($attributes)
    {
        try {

            $template = $this->templateFromAttributes($attributes, 'views/bidder/profile-form');
            $profile = $this->handbid->store('Bidder')->myProfile();

            $redirect = isset($attributes['redirect']) ? $attributes['redirect'] : null;
            $showCreditCardRequiredMessage = isset($attributes['show_credit_card_required_message']) ? $attributes['show_credit_card_required_message'] == 'true' : false;

            return $this->viewRenderer->render(
                $template,
                [
                    'profile'  => $profile,
                    'redirect' => $redirect,
                    'showCreditCardRequiredMessage' => $showCreditCardRequiredMessage
                ]
            );
        } catch (Exception $e) {

            echo "Your profile could not be loaded, Please try again later.";
            $this->logException($e);

            return;
        }
    }

    public function myCreditCards($attributes)
    {
        try {
            $template = $this->templateFromAttributes($attributes, 'views/bidder/credit-cards');
            $profile = $this->handbid->store('Bidder')->myProfile();

            return $this->viewRenderer->render(
                $template,
                [
                    'cards' => $this->handbid->store('CreditCard')->byOwner($profile->_id)
                ]
            );
        } catch (Exception $e) {
            echo "You credit cards could not be loaded. Please try again later.";
            $this->logException($e);
            return;
        }
    }

    public function bidderReceipt($attributes)
    {
        try {
            $template = $this->templateFromAttributes($attributes, 'views/bidder/receipt');
            $auction = $this->state->currentAuction();
            $receipt = null;
            if($auction) {
                $receipt = $this->handbid->store('Receipt')->byAuction($auction->_id);
            }
            return $this->viewRenderer->render(
                $template,
                [
                    'receipt' => $receipt
                ]
            );
        } catch (Exception $e) {
            echo "Your receipt could not be loaded. Please try again later.";
            $this->logException($e);
            return;
        }
    }

    //tickets
    public function ticketList($attributes) {

        try {
            $auction = $this->state->currentAuction($attributes);

            $query = [];//@todo: find out hwo to pass query through attributes. then merge it with our defaults. array_merge([], $query)

            $tickets = $this->handbid->store('Ticket')->byAuction($auction->key, $query);

            if ($tickets) {
                $template = $this->templateFromAttributes($attributes, 'views/ticket/list');

                return $this->viewRenderer->render(
                    $template,
                    [
                        'tickets' => $tickets,
                        'auction' => $auction
                    ]
                );
            }
        } catch (Exception $e) {
            echo "Auction Ticket List could not be found, please try again later.";
            $this->logException($e);
            return null;
        }


        //@todo: try/catch
        //do_shortcode({{shortcode id}}) (no echo needed)
        //handbid->state->currentAuction()  //use this to get the auction id for the shortcode attribute auctionKey
        //hb->store('Ticket')->byAuction( handbid->state->cuttentAuction() )

    }

    // Control flow
    public function isLoggedIn($attributes, $content)
    {
        $profile = $this->handbid->store('Bidder')->myProfile();
        if ($profile) {
            echo do_shortcode($content);
        }
    }

    public function isLoggedOut($attributes, $content)
    {
        $profile = $this->handbid->store('Bidder')->myProfile();
        if (!$profile) {
            echo do_shortcode($content);
        }
    }

    public function breadcrumbs($attributes)
    {

        try {
            $template = $this->templateFromAttributes($attributes, 'views/navigation/breadcrumb');
            $org = $this->state->currentOrg();
            $auction = $this->state->currentAuction();

            return $this->viewRenderer->render(
                $template,
                [
                    'org'     => $org,
                    'auction' => $auction,
                    'item'    => $this->state->currentItem()
                ]
            );
        } catch (Exception $e) {

            echo "Breadcrumb could not be loaded, Please try again later.";
            $this->logException($e);

            return;

        }
    }

    public function pager($attributes)
    {

        try {

            $template = $this->templateFromAttributes($attributes, 'views/navigation/pager');

            $page = $attributes['page'];
            $pageSize = $attributes['page_size'];
            $total = $attributes['total'];
            $id = $attributes['id'];


            return $this->viewRenderer->render(
                $template,
                [
                    'page' => $page,
                    'page_size' => $pageSize,
                    'total' => $total,
                    'id' => $id
                ]
            );
        } catch (Exception $e) {

            $this->logException($e);
            return;

        }


    }

    public function logException($e)
    {

        error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
    }

}
