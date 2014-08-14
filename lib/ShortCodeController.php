<?php

class ShortCodeController
{

    public $viewRenderer;
    public $basePath;
    public $state;
    public $handbid;

    public function __construct(
        \Handbid\Handbid $handbid,
        HandbidViewRenderer $viewRenderer,
        $basePath,
        $state,
        $config = []
    ) {
        $this->handbid      = $handbid;
        $this->viewRenderer = $viewRenderer;
        $this->basePath     = $basePath;
        $this->state        = $state;

        // loop through our objects and save them as parameters
        forEach ($config as $k => $v) {
            $this->$k = $v;
        }
    }

    public function init()
    {
        // Add Plugin ShortCodes
        $shortCodes = [
            'handbid_organization_details'  => 'organizationDetails',
            'handbid_organization_auctions' => 'organizationAuctions',
            'handbid_auction'               => 'auction',
            'handbid_connect'               => 'connect',
            'handbid_auction_results'       => 'auctionResults',
            'handbid_auction_banner'        => 'auctionBanner',
            'handbid_auction_details'       => 'auctionDetails',
            'handbid_auction_contact_form'  => 'auctionContactForm',
            'handbid_auction_item_list'     => 'auctionItemList',
            'handbid_bid_now'               => 'bidNow',
            'handbid_item'                  => 'item',
            'handbid_item_results'          => 'itemResults',
            'handbid_item_description'      => 'itemDescription',
            'handbid_item_search_bar'       => 'itemSearchBar',
            'handbid_item_bid_history'      => 'itemBidHistory',
            'handbid_ticket_buy'            => 'ticketBuy',
            'handbid_image_gallery'         => 'imageGallery',
            'handbid_facebook_comments'     => 'facebookComments',
            'handbid_bidder_profile'        => 'myProfile',
            'handbid_bidder_bids'           => 'myBids',
            'handbid_bidder_proxy_bids'     => 'myProxyBids',
            'handbid_bidder_purchases'      => 'myPurchases',
            'handbid_bidder_profile_form'   => 'bidderProfileForm',
            'handbid_is_logged_in'          => 'isLoggedIn',
            'handbid_is_logged_out'         => 'isLoggedOut'
        ];

        forEach ($shortCodes as $shortCode => $callback) {
            add_shortcode($shortCode, [$this, $callback]);
        }
    }

    // Helpers
    public function templateFromAttributes($attributes, $default)
    {

        $templates = [];
        $template  = '';

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
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }
    }

    public function organizationAuctions($attributes)
    {
        try {

            $template = $this->templateFromAttributes($attributes, 'views/organization/logo');

            $org = $this->state->currentOrg();


            if (!in_array($attributes['type'], ['upcoming', 'all', 'past'])) {
                $attributes['type'] = 'upcoming';
            }

            // Get orgs from handbid server
            $auctions = $this->handbid->store('Auction')->{$attributes['type']}(($org->_id) ? $org->_id : null);

            $markup = $this->viewRenderer->render(
                $template,
                [
                    'auctions' => $auctions
                ]
            );

            return $markup;
        } catch (Exception $e) {
            echo "Organizations Auctions could not be found, please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }
    }

    // Auctions
    public function auction($attributes)
    {

        try {
            $auction = $this->state->currentAuction($attributes);

            $template = $this->templateFromAttributes($attributes, 'views/auction/auction');
            return $this->viewRenderer->render(
                $template,
                [
                    'auction' => $auction
                ]
            );

        } catch (Exception $e) {
            echo "Auction could not be loaded, Please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }

    }

    public function auctionResults($attributes)
    {

        try {

            $template = $this->templateFromAttributes($attributes, 'views/auction/logo');

            if (!isset($attributes['type']) || !is_array($attributes) || !in_array(
                    $attributes['type'],
                    ['upcoming', 'all', 'past']
                )
            ) {
                $attributes['type'] = 'upcoming';
            }

            // Get orgs from handbid server
            $auctions = $this->handbid->store('Auction')->{$attributes['type']}();

            $markup = $this->viewRenderer->render(
                $template,
                [
                    'auctions' => $auctions
                ]
            );

            return $markup;
        } catch (Exception $e) {
            echo "Auctions could not be found, please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }

    }

    public function auctionBanner($attributes)
    {

        try {

            $auction = $this->state->currentAuction($attributes);
            $coords  = $auction->location->coords;

            $profile        = null;
            $totalProxies   = null;
            $totalWinning   = null;
            $totalLosing    = null;
            $totalPurchases = null;

            try {

                $profile           = $this->handbid->store('Bidder')->myProfile($auction->_id);
                $totalWinning      = count($this->handbid->store('Bidder')->myBids($auction->_id));
                $totalLosing       = count($this->handbid->store('Bidder')->myLosing($auction->_id));
                $totalProxies      = count($this->handbid->store('Bidder')->myProxyBids($auction->_id));
                $totalPurchases    = count($this->handbid->store('Bidder')->myPurchases($auction->_id));

            } catch (Exception $e) {

                $in = $e;
                //                debug();

            }

            $template   = $this->templateFromAttributes($attributes, 'views/auction/banner');

            return $this->viewRenderer->render(
                $template,
                [
                    'auction'       => $auction,
                    'coordinates'   => $coords,
                    'winningBids'   => $totalWinning,
                    'losingBids'    => $totalLosing,
                    'purchases'     => $totalPurchases,
                    'profile'       => $profile,
                    'proxies'       => $totalProxies
                ]
            );

        } catch (Exception $e) {

            echo "Auction banner could not be loaded, Please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());

            return;

        }

    }

    public function connect($attributes)
    {

        try {
            $template = $this->templateFromAttributes($attributes, 'views/connect');
            $bidder   = $this->state->currentBidder($attributes);
            $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";

            $default = $protocol . $_SERVER["HTTP_HOST"] . $_SERVER["REQUEST_URI"];

            return $this->viewRenderer->render(
                $template,
                [
                    'bidder'  => $bidder,
                    'passUrl' => isset($attributes['passUrl']) ? $attributes['passUrl'] : $default,
                    'failUrl' => isset($attributes['failUrl']) ? $attributes['failUrl'] : $default,
                ]
            );
        } catch (Exception $e) {
            echo "Rendering connect button failed.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }


    }

    public function auctionDetails($attributes)
    {

        try {
            $template = $this->templateFromAttributes($attributes, 'views/auction/details');
            $auction  = $this->state->currentAuction($attributes);
            return $this->viewRenderer->render(
                $template,
                [
                    'auction' => $auction
                ]
            );
        } catch (Exception $e) {
            echo "Auction details could not be loaded, Please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }


    }

    public function auctionContactForm($attributes)
    {
        try {
            $template = $this->templateFromAttributes($attributes, 'views/auction/contact-form');
            return $this->viewRenderer->render($template, $this->state->currentAuction());
        } catch (Exception $e) {
            echo "Contact form could not be loaded, Please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }

    }

    public function auctionItemList($attributes)
    {

        try {
            $auction = $this->state->currentAuction($attributes);
            $query   = [
                'options' => [
                    'images' => [
                        'w' => 225,
                        'h' => false
                    ]
                ]
            ];

            $items = $this->handbid->store('Item')->biddableByAuction($auction->_id, $query);

            $donorsDirty     = [];
            $categoriesDirty = [
                '_all' => 'All'
            ];

            forEach ($items as $item) {
                if (isset($item->donor)) {
                    $donorsDirty[] = $item->donor;
                }
                if (isset($item->term)) {
                    $categoriesDirty[] = $item->term;
                }
            }

            $donors     = array_unique($donorsDirty);
            $categories = array_unique($categoriesDirty);

            $template = $this->templateFromAttributes($attributes, 'views/item/list');
            return $this->viewRenderer->render(
                $template,
                [
                    'categories' => $categories,
                    'items'      => $items,
                    'donors'     => $donors
                ]
            );
        } catch (Exception $e) {
            echo "Auction Item List could not be found, please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }

    }

    // Bids
    public function bidNow($attributes)
    {
        try {
            $template = $this->templateFromAttributes($attributes, 'views/bid/now');

            $item = $this->state->currentItem();

            $itemStore  = $this->handbid->store('Item');
            $bids       = $itemStore->bids($item->_id);
            $profile = $this->handbid->store('Bidder')->myProfile();

            return $this->viewRenderer->render(
                $template,
                [
                    'item'    => $item,
                    'bids'    => $bids,
                    'profile' => $profile
                ]
            );
        } catch (Exception $e) {

            echo "Bid now feature could not be loaded, please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());

            return;
        }
    }

    public function itemBidHistory($attributes)
    {
        try {
            $template = $this->templateFromAttributes($attributes, 'views/item/bid-history');

            $item = $this->state->currentItem();

            $itemStore  = $this->handbid->store('Item');
            $bids       = $itemStore->bids($item->_id);
            $profile = $this->handbid->store('Bidder')->myProfile();

            return $this->viewRenderer->render(
                $template,
                [
                    'item'    => $item,
                    'bids'    => $bids,
                    'profile' => $profile
                ]
            );
        } catch (Exception $e) {

            echo "Bid now feature could not be loaded, please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());

            return;
        }

    }

    // Items
    public function item($attributes)
    {
        try {
            $template = $this->templateFromAttributes($attributes, 'views/item/item');
            return $this->viewRenderer->render(
                $template,
                [
                    'item' => $this->state->currentItem()
                ]
            );
        } catch (Exception $e) {
            echo "item could not be loaded, Please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }
    }

    public function itemResults($attributes)
    {
        try {
            $template = $this->templateFromAttributes($attributes, 'views/item/results');
            return $this->viewRenderer->render(
                $template,
                [
                    'item' => $this->state->currentItem()
                ]
            );
        } catch (Exception $e) {
            echo "item results could not be loaded, Please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }
    }

    public function itemDescription($attributes)
    {
        try {
            $template = $this->templateFromAttributes($attributes, 'views/item/description');
            return $this->viewRenderer->render(
                $template,
                [
                    'item' => $this->state->currentItem()
                ]
            );
        } catch (Exception $e) {
            echo "Item description could not be loaded, Please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }
    }

    public function itemSearchBar($attributes)
    {
        try {
        } catch (Exception $e) {
            echo "Search bar could not be loaded, Please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }
    }

    // Tickets
    public function ticketBuy($attributes)
    {
        try {
            $auction = $this->state->currentAuction();
        } catch (Exception $e) {
            echo "Ticket purchase could not be loaded, Please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }
    }

    // Image
    public function imageGallery($attributes)
    {
        try {
            $item     = $this->state->currentItem();
            $template = $this->templateFromAttributes($attributes, 'views/image/photo-gallery');
            return $this->viewRenderer->render(
                $template,
                [
                    'item' => $item
                ]
            );
        } catch (Exception $e) {
            echo "Image gallery could not be loaded, Please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }
    }

    // Social
    public function facebookComments($attributes)
    {
        {
            try {
                $org     = get_query_var('organization');
                $auction = get_query_var('auction');
                $item    = get_query_var('item');

                $customUrl = $org . $auction . $item;

                $template = $this->templateFromAttributes($attributes, 'views/facebook/comments');
                return $this->viewRenderer->render(
                    $template,
                    [
                        'url' => $customUrl
                    ]
                );
            } catch (Exception $e) {
                echo "Facebook Comments could not be loaded, Please try again later.";
                error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
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


            $img = wp_get_image_editor( $profile->photo );
            if ( ! is_wp_error( $img ) ) {
                $img->resize( 250, false, true );
                $img->save(ABSPATH.'wp-content/uploads/user-photos/' . $profile->pin . '.jpg');
                $newPhoto = get_site_url() . '/wp-content/uploads/user-photos/' . $profile->pin . '.jpg';
            }

            if(isset($newPhoto)) {
                $profile->photo = $newPhoto;
            }

            return $this->viewRenderer->render(
                $template,
                [
                    'profile' => $profile
                ]
            );
        } catch (Exception $e) {
            echo "bids could not be loaded, Please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }
    }

    public function myBids($attributes)
    {
        try {
            $template = $this->templateFromAttributes($attributes, 'views/bidder/bids');
            return $this->viewRenderer->render(
                $template,
                [
                    'bids' => $this->handbid->store('Bidder')->myBids($this->state->currentAuction()->_id)
                ]
            );
        } catch (Exception $e) {
            echo "bids could not be loaded, Please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }
    }

    public function myProxyBids($attributes)
    {
        try {
            $template = $this->templateFromAttributes($attributes, 'views/bidder/proxybids');
            return $this->viewRenderer->render(
                $template,
                [
                    'bids' => $this->handbid->store('Bidder')->myProxyBids($this->state->currentAuction()->_id)
                ]
            );
        } catch (Exception $e) {
            echo "Max bids could not be loaded, Please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }
    }

    public function myPurchases($attributes)
    {
        try {
            $template = $this->templateFromAttributes($attributes, 'views/bidder/purchases');
            return $this->viewRenderer->render(
                $template,
                [
                    'purchases' => $this->handbid->store('Bidder')->myPurchases($this->state->currentAuction()->_id)
                ]
            );
        } catch (Exception $e) {
            echo "purchases could not be loaded, Please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }
    }

    public function bidderProfileForm($attributes)
    {
        try {
            $template = $this->templateFromAttributes($attributes, 'views/bidder/profile-form');
            return $this->viewRenderer->render(
                $template,
                [
                    'profile' => $this->handbid->store('Bidder')->myProfile()

            ]
            );
        } catch (Exception $e) {
            echo "Your profile could not be loaded, Please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }
    }

    public function updateBidderFormSubmit() {

    }

    public function isLoggedIn($attributes, $content) {
        $profile = $this->handbid->store('Bidder')->myProfile();
        if($profile) {
            echo do_shortcode($content);
        }
    }

    public function isLoggedOut($attributes, $content) {
        $profile = $this->handbid->store('Bidder')->myProfile();
        if(!$profile) {
            echo do_shortcode($content);
        }
    }
}