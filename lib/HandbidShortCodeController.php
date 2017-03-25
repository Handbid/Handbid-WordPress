<?php
/**
 * @copyright Copyright (c) 2014-2015 Handbid Inc.
 * @category handbid
 * @package Handbid2-WordPress
 * @license Proprietary
 * @link http://www.handbid.com/
 * @author Master of Code (worldclass@masterofcode.com)
 */

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
        $this->handbid         = $handbid;
        $this->viewRenderer    = $viewRenderer;
        $this->basePath        = $basePath;
        $this->state           = $state;
        $this->routeController = $routeController;

        // loop through our objects and save them as parameters
        forEach ($config as $k => $v)
        {
            $this->$k = $v;
        }
    }

    public function init()
    {
        // Loop through and add in shortcodes, it goes:
        // [wordpress_shortcode]              => 'mappedFunctions'
        $shortCodes = [
            'handbid_header_title'          => 'headerTitle',
            'handbid_pager'                 => 'pager',
            'handbid_organization_list'     => 'organizationList',
            'handbid_organization_details'  => 'organizationDetails',
            'handbid_organization_auctions' => 'organizationAuctions',
            'handbid_connect'               => 'connect',
            'handbid_auction_list'          => 'auctionList',
            'handbid_auction_timer'         => 'auctionTimer',
            'handbid_auction_banner'        => 'auctionBanner',
            'handbid_auction_details'       => 'auctionDetails',
            'handbid_invoice_details'       => 'invoiceDetails',
            'handbid_auction_item_list'     => 'auctionItemList',
            'handbid_auction_ticket_list'   => 'ticketList',
            'handbid_item_details'          => 'itemDetails',
            'handbid_item_bids'             => 'itemBids',
            'handbid_bid'                   => 'bidNow',
            'handbid_facebook_comments'     => 'facebookComments',
            'handbid_social_share'          => 'socialShare',
            'handbid_bidder_profile'        => 'bidderStatBar',
            'handbid_bidder_profile_bar'    => 'myProfile',
            'handbid_bidder_profile_inner'  => 'bidderProfileInner',
            'handbid_bidder_notifications'  => 'myNotifications',
            'handbid_bidder_profile_form'   => 'bidderProfileForm',
            'handbid_bidder_cc_form'        => 'bidderCreditCardForm',
            'handbid_is_logged_in'          => 'isLoggedIn',
            'handbid_is_logged_out'         => 'isLoggedOut',
            'handbid_breadcrumb'            => 'breadcrumbs',
            'handbid_bidder_credit_cards'   => 'myCreditCards',
            'handbid_bidder_receipt'        => 'bidderReceipt',
            'handbid_bidder_login_form'     => 'loginRegisterForm',
            'handbid_customizer_styles'     => 'customizerStyles',
            'handbid_testimonials'          => 'handbidTestimonials',
        ];

        forEach ($shortCodes as $shortCode => $callback)
        {
            add_shortcode($shortCode, [$this, $callback]);
        }

        $this->addAjaxProcess();
    }

    // Helpers
    public function templateFromAttributes($attributes, $default)
    {

        $templates = [];
        $template  = '';

        if (!is_array($attributes) || !isset($attributes['template']) || !$attributes['template'])
        {
            $templates[] = $template = $default;
        } else
        {
            $templates[] = $template = $attributes['template'];
        }

        //if the template does not start
        if ($template != DIRECTORY_SEPARATOR)
        {
            $templates[] = get_template_directory() . DIRECTORY_SEPARATOR . $template;
        }

        return $templates;
    }

    // Organization
    public function organizationDetails($attributes)
    {
        try
        {

            $template = $this->templateFromAttributes($attributes, 'views/organization/details');

            $organization = $this->state->currentOrg();

            $hasLocation = (isset($organization->organizationAddressStreet1))
                ? !!($organization->organizationAddressStreet1)
                : false;
            $this->state->setMapVisibility($hasLocation);

            $markup = $this->viewRenderer->render(
                $template,
                [
                    'organization' => $organization,
                    'hasLocation'  => $hasLocation,
                ]
            );

            return $markup;
        } catch (Exception $e)
        {
            echo "Oops we could not find the organization you were looking for, Please try again later.";
            $this->logException($e);

            return;
        }
    }

    //
    public function organizationAuctions($attributes)
    {
        try
        {

            $template = $this->templateFromAttributes($attributes, 'views/auction/list');

            $org = $this->state->currentOrg();

            //let you change how you search
            if (isset($_GET['auction_list']))
            {
                $attributes['type'] = $_GET['auction_list'];
            }

            if (!isset($attributes['type']) || !is_array($attributes) || !in_array(
                    $attributes['type'],
                    ['current', 'upcoming', 'byOrg', 'past', 'closed', 'open', 'preview', 'presale']
                )
            )
            {
                $attributes['type'] = 'byOrg';
            }

            // Get orgs from handbid server
            if ($org)
            {
                //$profile = $this->handbid->store( 'Bidder' )->myProfile();
                $profile = $this->state->currentBidder();
                $this->handbid->store('Auction')->setBasePublicity(!$profile);
                $auctions = $this->handbid->store('Auction')->{$attributes['type']}(0, 25, 'name', 'ASC', $org->id);
            } else
            {
                $auctions = [];
            }

            $tempOrgAuctions = [];
            if (count($auctions))
            {
                foreach ($auctions as $auctionSingle)
                {
                    if ($org->id == $auctionSingle->organizationId)
                    {
                        $tempOrgAuctions[] = $auctionSingle;
                    }
                }
                $auctions = $tempOrgAuctions;
            }

            $colsCount = $this->state->getGridColsCount();

            $no_auctions_text = ($org && ($attributes['type'] == 'byOrg')) ? 'No Auctions currently running' : 'No Auctions Found';

            $markup = $this->viewRenderer->render(
                $template,
                [
                    'auctions'   => $auctions,
                    'cols_count' => $colsCount,
                    'no_auctions_text' => $no_auctions_text,
                ]
            );

            return $markup;
        } catch (Exception $e)
        {
            echo "Organizations auctions could not be found, please try again later. Please make sure you have the proper organization key set";
            $this->logException($e);

            return;
        }
    }

    // Auctions

    public function auctionList($attributes)
    {

        try
        {

            $template = $this->templateFromAttributes($attributes, 'views/auction/list');
            $query    = [];

            //let you change how you search
            if (isset($_GET['auction_list']))
            {
                $attributes['type'] = $_GET['auction_list'];
            }

            if (!isset($attributes['type']) || !is_array($attributes) || !in_array(
                    $attributes['type'],
                    ['current', 'upcoming', 'all', 'past', 'closed', 'open', 'preview', 'presale']
                )
            )
            {
                $attributes['type'] = 'current';
            }

            $id = isset($attributes['id']) ? $attributes['id'] : 'auctions';

            $auctionParams = isset($_GET[$id]) ? $_GET[$id] : [];

            $page = 0;

            if (isset($auctionParams['page']))
            {
                $page = $auctionParams['page'];
            } else if (isset($attributes['page']))
            {
                $page = $attributes['page'];
            }
            $page                = (int)$page;
            $currentAuctionsPage = $page + 1;

            //paging and sort
            $pageSize      = $this->state->getPageSize((int)$attributes['page_size']);
            $sortField     = isset($attributes['sort_field']) ? $attributes['sort_field'] : "name";
            $sortDirection = isset($attributes['sort_direction']) ? $attributes['sort_direction'] : "asc";
            $id            = isset($attributes['id']) ? $attributes['id'] : 'auctions';

            //$profile = $this->handbid->store( 'Bidder' )->myProfile();
            $profile = $this->state->currentBidder();
            $this->handbid->store('Auction')->setBasePublicity(!$profile);


            $auctionSearch = isset($_GET["search"]) ? $_GET["search"] : false;
            if ($auctionSearch)
            {
                $pageSize = 999999;
                $total    = $pageSize;
            }
            $searchString = strtolower(trim(strip_tags($auctionSearch)));

            if ($auctionSearch)
            {
                $auctions    = [];
                $searchNext  = true;
                $searchLimit = 50;
                $searchPage  = 0;
                while ($searchNext)
                {
                    $tempAuctions = $this->handbid->store('Auction')->all(
                        $searchPage,
                        $searchLimit,
                        $sortField,
                        $sortDirection,
                        $query,
                        [
                            'search' => $searchString,
                        ]
                    );

                    $auctions   = array_merge($auctions, $tempAuctions);
                    $searchNext = (count($tempAuctions) == $searchLimit);
                    $searchPage = ($searchNext) ? ($searchPage + 1) : $searchPage;
                }
            } else
            {
                $auctions = $this->handbid->store('Auction')->byStatus($attributes['type'], $currentAuctionsPage, $pageSize);
            }

            if (!$auctionSearch)
            {
                $total = $this->handbid->store('Auction')->count($attributes['type']);
            }


            $auctions = (is_array($auctions)) ? $auctions : [];

            if (count($auctions) > $pageSize)
            {
                $auctions = array_slice($auctions, $page * $pageSize, $pageSize);
            }

            $colsCount = $this->state->getGridColsCount();

            $markup = $this->viewRenderer->render(
                $template,
                [
                    'auctions'   => $auctions,
                    'total'      => $total,
                    'id'         => $id,
                    'page_size'  => $pageSize,
                    'page'       => $page,
                    'cols_count' => $colsCount,
                    'search'     => $auctionSearch,
                ]
            );

            return $markup;

        } catch (Exception $e)
        {
            echo "Auctions could not be loaded, please try again later.";
            $this->logException($e);

            return;
        }

    }

    public function organizationList($attributes)
    {

        try
        {

            $template = $this->templateFromAttributes($attributes, 'views/organization/list');

            $id = isset($attributes['id']) ? $attributes['id'] : 'orgs';

            $organizationParams = isset($_GET[$id]) ? $_GET[$id] : [];

            $page = 0;

            if (isset($organizationParams['page']))
            {
                $page = $organizationParams['page'];
            } else if (isset($attributes['page']))
            {
                $page = $attributes['page'];
            }
            $page = (int)$page;

            //paging and sort
            $pageSize      = $this->state->getPageSize((int)$attributes['page_size']);
            $sortField     = isset($attributes['sort_field']) ? $attributes['sort_field'] : "name";
            $sortDirection = isset($attributes['sort_direction']) ? $attributes['sort_direction'] : "asc";
            $logoWidth     = isset($attributes['logo_width']) ? $attributes['logo_width'] : 200;
            $logoHeight    = isset($attributes['logo_height']) ? $attributes['logo_height'] : false;

            $query = [];

            $organizationSearch = isset($_GET["search"]) ? $_GET["search"] : false;
            if ($organizationSearch)
            {
                $pageSize = 999999;
                $total    = $pageSize;
            }
            $searchString = strtolower(trim(strip_tags($organizationSearch)));

            //$profile = $this->handbid->store( 'Bidder' )->myProfile();
            $profile = $this->state->currentBidder();
            //$this->handbid->store('Organization')->setBasePublicity(! $profile);
            if ($organizationSearch)
            {
                $organizations = [];
                $searchNext    = true;
                $searchLimit   = 50;
                $searchPage    = 0;
                while ($searchNext)
                {
                    $organizationsTemp = $this->handbid->store('Organization')->all(
                        $searchPage,
                        $searchLimit,
                        $sortField,
                        $sortDirection,
                        $query,
                        [
                            'search' => $searchString,
                        ]
                    );

                    $organizations = array_merge($organizations, $organizationsTemp);
                    $searchNext    = (count($organizationsTemp) == $searchLimit);
                    $searchPage    = ($searchNext) ? ($searchPage + 1) : $searchPage;
                }
            } else
            {
                $organizations = $this->handbid->store('Organization')->all(
                    $page,
                    $pageSize,
                    $sortField,
                    $sortDirection,
                    $query,
                    [
                        'logo' => [
                            'w' => $logoWidth,
                            'h' => $logoHeight,
                        ],
                    ]
                );
            }
            if (!$organizationSearch)
            {
                $total = $this->handbid->store('Organization')->count($query);
            }


            if ($organizationSearch)
            {
                $tempOrganizations = [];

                if (count($organizations))
                {
                    foreach ($organizations as $organization)
                    {
                        $orgName = strtolower(trim(strip_tags($organization->name)));
                        if (strpos($orgName, $searchString) !== false)
                        {
                            $tempOrganizations[] = $organization;
                        }
                    }
                }
                $organizations = $tempOrganizations;
            }


            $organizations = (is_array($organizations)) ? $organizations : [];
            if (count($organizations) > $pageSize)
            {
                $organizations = array_slice($organizations, $page * $pageSize, $pageSize);
            }


            $colsCount = $this->state->getGridColsCount();

            $markup = $this->viewRenderer->render(
                $template,
                [
                    'organizations' => $organizations,
                    'total'         => $total,
                    'id'            => $id,
                    'page_size'     => $pageSize,
                    'page'          => $page,
                    'cols_count'    => $colsCount,
                    'search'        => $organizationSearch,
                ]
            );

            return $markup;

        } catch (Exception $e)
        {
            echo "Organizations could not be found, please try again later.";
            $this->logException($e);

            return;
        }

    }

    public function auctionBanner($attributes)
    {

        try
        {

            $auction = $this->state->currentAuction($attributes);

            $profile        = null;
            $totalProxies   = null;
            $totalWinning   = null;
            $totalLosing    = null;
            $totalPurchases = null;

            try
            {

                //$profile = $this->handbid->store( 'Bidder' )->myProfile( $auction->id );
                $this->state->currentBidder($auction->id);
                if ($profile)
                {

                    $myInventory = $this->state->currentInventory($auction->id);

                    $totalWinning   = count($myInventory->winning);
                    $totalLosing    = count($myInventory->losing);
                    $totalPurchases = count($myInventory->purchases);
                    $totalProxies   = count($myInventory->max_bids);

                }

            } catch (Exception $e)
            {

                $in = $e;
                //                debug();

            }

            $template = $this->templateFromAttributes($attributes, 'views/auction/banner');

            return $this->viewRenderer->render(
                $template,
                [
                    'auction'     => $auction,
                    'winningBids' => $totalWinning,
                    'losingBids'  => $totalLosing,
                    'purchases'   => $totalPurchases,
                    'profile'     => $profile,
                    'proxies'     => $totalProxies,
                ]
            );

        } catch (Exception $e)
        {

            echo "Auction banner could not be loaded, Please try again later.";
            $this->logException($e);

            return;

        }

    }

    public function connect($attributes)
    {

        try
        {
            $template = $this->templateFromAttributes($attributes, 'views/connect');
            $bidder   = $this->state->currentBidder();
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
        } catch (Exception $e)
        {
            echo "Rendering connect button failed.";
            $this->logException($e);

            return;
        }

    }

    public function invoiceDetails($attributes)
    {
        try
        {
            $myInvoices = $this->state->currentReceipts();

            $profile   = $this->state->currentBidder();

            $template = $this->templateFromAttributes($attributes, 'views/bidder/receipt-page');

            return $this->viewRenderer->render(
                $template,
                [
                    'profile'     => $profile,
                    'myInvoices'    => $myInvoices,
                ]
            );

        } catch (Exception $e)
        {
            echo "Invoice details could not be loaded, Please try again later.";
            $this->logException($e);

            return;
        }
    }

    public function auctionDetails($attributes)
    {
        try
        {

            $template = $this->templateFromAttributes($attributes, 'views/auction/details');
            $auction  = $this->state->currentAuction($attributes);

            if ($this->isAuctionSetup($auction))
            {
                return $this->viewRenderer->render('views/auction/setup', []);
            }


            $tickets   = $this->state->getCurrentAuctionTickets();
            $auctionID = (isset($auction->id)) ? $auction->id : 0;
            $bidder    = $this->state->currentBidder($auctionID);

            $items = [];
            if (count($auction->categories))
            {
                forEach ($auction->categories as $category)
                {
                    forEach ($category->items as $item)
                    {
                        if(!$item->isTicket)
                        {
                            $items[] = $item;
                        }
                    }
                }
            }

            if ($bidder)
            {
                $myInventory = $this->state->currentInventory($auctionID);
                $winning     = (isset($myInventory->winning) and is_array($myInventory->winning)) ? $myInventory->winning : [];
                $losing      = (isset($myInventory->losing) and is_array($myInventory->losing)) ? $myInventory->losing : [];;

            } else
            {
                $winning = [];
                $losing  = [];
            }
            $colsCount = $this->state->getGridColsCount(3, "Item");
            $winning   = (is_array($winning)) ? $winning : [];
            $losing    = (is_array($losing)) ? $losing : [];

            $location    = (isset($auction->locations) and is_array($auction->locations) and count($auction->locations)) ? $auction->locations[0] : [];
            $hasLocation = (isset($location->auctionLocationStreet1)) ? !!($location->auctionLocationStreet1) : false;
            $this->state->setMapVisibility($hasLocation);

            return $this->viewRenderer->render(
                $template,
                [
                    'auction'     => $auction,
                    'location'    => $location,
                    'hasLocation' => $hasLocation,
                    'tickets'     => $tickets,
                    'profile'     => $bidder,
                    'items'       => $items,
                    'winning'     => $winning,
                    'losing'      => $losing,
                    'cols_count'  => $colsCount,
                ]
            );

        } catch (Exception $e)
        {

            echo "Auction details could not be loaded, Please try again later.";
            $this->logException($e);

            return;
        }
    }

    public function auctionTimer($attributes)
    {

        try
        {

            $template = $this->templateFromAttributes($attributes, 'views/auction/timer');
            $auction  = $this->state->currentAuction($attributes);

            return $this->viewRenderer->render(
                $template,
                [
                    'auction' => $auction,
                ]
            );

        } catch (Exception $e)
        {
            $this->logException($e);

            return;
        }
    }

    public function auctionItemList($attributes)
    {

        try
        {
            $auction = $this->state->currentAuction();

            forEach ($auction->categories as $category)
            {
                forEach ($category->items as $item)
                {
                    $items[] = $item;
                }
            }
            //$profile = $this->handbid->store( 'Bidder' )->myProfile();
            $profile = $this->state->currentBidder($auction->id);
            if ($profile)
            {
                $myInventory = $this->state->currentInventory($auction->id);
                $winning     = (isset($myInventory->winning) and is_array($myInventory->winning)) ? $myInventory->winning : [];
                $losing      = (isset($myInventory->losing) and is_array($myInventory->losing)) ? $myInventory->losing : [];;

            } else
            {
                $winning = [];
                $losing  = [];
            }

            $template = $this->templateFromAttributes($attributes, 'views/item/list');

            $colsCount = $this->state->getGridColsCount(3, "Item");

            return $this->viewRenderer->render(
                $template,
                [
                    'auction'    => $auction,
                    'items'      => $items,
                    'cols_count' => $colsCount,
                    'winning'    => $winning,
                    'losing'     => $losing,
                ]
            );
        } catch (Exception $e)
        {
            echo "Auction Item List could not be found, please try again later.";
            $this->logException($e);

            return;
        }

    }

    // Items
    public function itemDetails($attributes)
    {
        try
        {

            $template = $this->templateFromAttributes($attributes, 'views/item/details');
            $item    = $this->state->currentItem();
            if(!is_object($item)){
                return $this->viewRenderer->render(
                    $this->templateFromAttributes($attributes, 'views/errors/404'),
                    []
                );
            }
            $auction = $this->state->currentAuction();
            $itemID  = (isset($item->id)) ? $item->id : 0;
            $bids    = $this->state->currentItemBids($itemID);
            $related = false;

            if ($attributes !== '' && $item && in_array('include_related', $attributes))
            {

                $related = $this->handbid->store('Item')->related($itemID, [
                    'config' => [
                        'skip'  => isset($attributes['related_skip']) ? $attributes['related_skip'] : 0,
                        'limit' => isset($attributes['related_limit']) ? $attributes['related_limit'] : 3,
                    ],
                ]);
            }

            //$profile = $this->handbid->store( 'Bidder' )->myProfile();
            $profile = $this->state->currentBidder($auction->id);
            if ($profile)
            {
                $myInventory = $this->state->currentInventory($auction->id);
                $winning     = (isset($myInventory->winning) and is_array($myInventory->winning)) ? $myInventory->winning : [];
                $losing      = (isset($myInventory->losing) and is_array($myInventory->losing)) ? $myInventory->losing : [];;

            } else
            {
                $winning = [];
                $losing  = [];
            }

            return $this->viewRenderer->render(
                $template,
                [
                    'item'    => $item,
                    'bids'    => $bids,
                    'related' => $related,
                    'auction' => $auction,
                    'profile' => $profile,
                    'winning' => $winning,
                    'losing'  => $losing,
                ]
            );
        } catch (Exception $e)
        {
            echo "Item could not be loaded. Please try again later.";
            $this->logException($e);

            return;
        }
    }

    public function sortBidsByTime($a, $b)
    {
        if ((int)$a->microtime == (int)$b->microtime)
        {
            return 0;
        }

        return ((int)$a->microtime > (int)$b->microtime) ? -1 : 1;
    }

    public function itemBids($attributes)
    {
        try
        {

            $template = $this->templateFromAttributes($attributes, 'views/item/bids');

            $item    = $this->state->currentItem($attributes);
            $auction = $this->state->currentAuction();
            $profile = $this->state->currentBidder($auction->id);
            $bids    = null;

            if ($item)
            {
                $itemID = (isset($item->id)) ? $item->id : 0;
                $bids   = $this->state->currentItemBids($itemID);

                usort($bids, [$this, "sortBidsByTime"]);
            }

            return $this->viewRenderer->render(
                $template,
                [
                    'item'    => $item,
                    'profile' => $profile,
                    'bids'    => $bids,
                    'auction' => $auction,
                ]
            );
        } catch (Exception $e)
        {
            echo "Item could not be loaded. Please try again later.";
            $this->logException($e);

            return;
        }
    }

    public function bidNow($attributes)
    {
        try
        {
            $template = $this->templateFromAttributes($attributes, 'views/item/bid');

            $item    = $this->state->currentItem();
            $auction = $this->state->currentAuction();

            $itemID  = (isset($item->id)) ? $item->id : 0;
            $bids    = $this->state->currentItemBids($itemID);
            $profile = $this->handbid->store('Bidder')->myProfile();

            return $this->viewRenderer->render(
                $template,
                [
                    'item'    => $item,
                    'bids'    => $bids,
                    'profile' => $profile,
                    'auction' => $auction,
                ]
            );
        } catch (Exception $e)
        {

            echo "Bid now feature could not be loaded, please try again later.";
            $this->logException($e);

            return;
        }
    }

    // Social
    public function facebookComments($attributes)
    {
        return "";
    }

    public function socialShare($attributes)
    {
        {
            try
            {
                $template = $this->templateFromAttributes($attributes, 'views/social/share');

                return $this->viewRenderer->render(
                    $template, []
                );
            } catch (Exception $e)
            {
                echo "Social Share could not be loaded, Please try again later.";
                $this->logException($e);

                return;
            }
        }

    }

    // Bidder
    public function bidderStatBar($attributes)
    {

        $template = $this->templateFromAttributes($attributes, 'views/bidder/profile-load');

        // $profile  = $this->handbid->store( 'Bidder' )->myProfile();

        $auction = $this->state->currentAuction();

        if ($this->isAuctionSetup($auction))
        {
            return "";
        }

        $auctionID          = (isset($auction->id)) ? $auction->id : 0;
        $profile            = $this->state->currentBidder($auctionID);
        $bidderID           = (isset($profile->id)) ? $profile->id : 0;
        $cookieName         = $bidderID . "_bid_confirmations";
        $cookieNotExists    = empty($_COOKIE[$cookieName]);
        $cookieExistsAndYes = (!empty($_COOKIE[$cookieName]) and $_COOKIE[$cookieName] != "no");
        $bidConfirm         = ($cookieNotExists or $cookieExistsAndYes);
        if ($auction->currentPaddleNumber == "N/A" and $profile)
        {
            $myInventory                  = $this->state->currentInventory($auctionID);
            $auction->currentPaddleNumber = (isset($myInventory->currentPaddleNumber)) ? $myInventory->currentPaddleNumber : $auction->currentPaddleNumber;
        }

        return $this->viewRenderer->render(
            $template, [
                         'profile'    => $profile,
                         'auction'    => $auction,
                         'bidConfirm' => $bidConfirm,
                     ]
        );
    }

    public function myProfile($attributes)
    {
        global $post;

        if(HANDBID_PAGE_TYPE == 'auction-item'){
            if(!is_object($this->state->currentItem())){
                return '';
            }
        }

        try
        {
            $template = $this->templateFromAttributes($attributes, 'views/bidder/profile');

            // $profile  = $this->handbid->store( 'Bidder' )->myProfile();

            $auction = $this->state->currentAuction();
            if (is_null($auction) and isset($attributes["auction"]) and (int)$attributes["auction"])
            {
                $auction = $this->auction = $this->handbid->store('Auction')->byId($attributes["auction"], false);
            }
            $auctionID        = (isset($auction->id)) ? $auction->id : 0;
            $profile          = $this->state->currentBidder($auctionID);
            $isInitialLoading = (isset($attributes["isinitialloading"]));

            $winning    = [];
            $losing     = [];
            $payments   = [];
            $purchases  = null;
            $proxyBids  = null;
            $totalSpent = 0;
            $myAuctions = null;
            $myInvoices = null;

            if ($profile)
            {

                //$myInvoices = $this->handbid->store('Receipt')->allReceipts();

                $myAuctions = [];
                $myMessages = [];
                $myInvoices = [];

                if ($auction && $profile)
                {
                    $myInventory = $this->state->currentInventory($auctionID);

                    $winning = (isset($myInventory->winning) and is_array($myInventory->winning)) ? $myInventory->winning : [];
                    $losing  = (isset($myInventory->losing) and is_array($myInventory->losing)) ? $myInventory->losing : [];
                    $payments  = (isset($myInventory->payments)) ? $myInventory->payments : [];
                    $purchases = $myInventory->purchases;
                    $proxyBids = $myInventory->max_bids;

                    $alreadyInPurchasesIDs = [];
                    if (is_array($purchases) and count($purchases))
                    {
                        foreach ($purchases as $p)
                        {
                            $totalSpent += $p->grandTotal;
                            $alreadyInPurchasesIDs[] = $p->item->id;
                        }
                    }

                    $tempWinning = [];
                    if (is_array($winning) and count($winning))
                    {
                        foreach ($winning as $w)
                        {
                            if (!in_array($w->item->id, $alreadyInPurchasesIDs))
                            {
                                $totalSpent += $w->amount;
                                $tempWinning[] = $w;
                            }
                        }
                    }
                    $winning = $tempWinning;

                }

            }

            return $this->viewRenderer->render(
                $template,
                [
                    'auction'          => $auction,
                    'profile'          => $profile,
                    'winning'          => $winning,
                    'losing'           => $losing,
                    'purchases'        => $purchases,
                    'payments'         => $payments,
                    'maxBids'          => $proxyBids,
                    'totalSpent'       => $totalSpent,
                    'myAuctions'       => $myAuctions,
                    'myInvoices'       => $myInvoices,
                    'notifications'    => $myMessages,
                    'isInitialLoading' => $isInitialLoading,
                    'isInvoicesPage'    => ($post->post_name == 'invoices'),
                ]
            );
        } catch (Exception $e)
        {
            echo "Profile could not be loaded. Please try again later.";
            $this->logException($e);

            return;
        }
    }

    public function bidderProfileInner($attributes)
    {

        try
        {

            $template = $this->templateFromAttributes($attributes, 'views/bidder/dashboard-inner');
            // $profile  = $this->handbid->store( 'Bidder' )->myProfile();

            $auction = $this->state->currentAuction();
            $profile = $this->state->currentBidder($auction->id);

            $winning    = [];
            $losing     = [];
            $purchases  = null;
            $proxyBids  = null;
            $totalSpent = 0;
            $myAuctions = null;

            if ($profile)
            {
                $img = wp_get_image_editor($profile->imageUrl);
                if (!is_wp_error($img))
                {


                    $thumbWidth  = isset($attributes['thumb_width']) ? $attributes['thumb_width'] : 250;
                    $thumbHeight = isset($attributes['thumb_height']) ? $attributes['thumb_height'] : false;
                    $thumbCrop   = isset($attributes['thumb_crop']) ? $attributes['thumb_crop'] : true;

                    $img->resize($thumbWidth, $thumbHeight, $thumbCrop);
                    $img->save(ABSPATH . 'wp-content/uploads/user-photos/' . $profile->pin . '.png');
                    $newPhoto = get_site_url() . '/wp-content/uploads/user-photos/' . $profile->pin . '.png';
                }

                if (isset($newPhoto))
                {
                    $profile->photo = $newPhoto;
                }

                $myAuctions = $this->handbid->store('Auction')->myRecent();

                if ($auction && $profile)
                {

                    $myInventory = $this->state->currentInventory($auction->id);

                    $winning = (isset($myInventory->winning) and is_array($myInventory->winning)) ? $myInventory->winning : [];
                    $losing  = (isset($myInventory->losing) and is_array($myInventory->losing)) ? $myInventory->losing : [];;
                    $purchases = $myInventory->purchases;
                    $proxyBids = $myInventory->max_bids;

                    $alreadyInPurchasesIDs = [];
                    if (is_array($purchases) and count($purchases))
                    {
                        foreach ($purchases as $p)
                        {
                            $totalSpent += $p->grandTotal;
                            $alreadyInPurchasesIDs[] = $p->item->id;
                        }
                    }

                    $tempWinning = [];
                    if (is_array($winning) and count($winning))
                    {
                        foreach ($winning as $w)
                        {
                            if (!in_array($w->item->id, $alreadyInPurchasesIDs))
                            {
                                $totalSpent += $w->amount;
                                $tempWinning[] = $w;
                            }
                        }
                    }
                    $winning = $tempWinning;

                }

            }

            return $this->viewRenderer->render(
                $template,
                [
                    'auction'    => $auction,
                    'profile'    => $profile,
                    'winning'    => $winning,
                    'losing'     => $losing,
                    'purchases'  => $purchases,
                    'maxBids'    => $proxyBids,
                    'myAuctions' => $myAuctions,
                    'totalSpent' => $totalSpent,
                ]
            );
        } catch (Exception $e)
        {
            echo "Profile could not be loaded. Please try again later.";
            $this->logException($e);

            return;
        }
    }

    public function myNotifications($attributes)
    {
        try
        {

            $template = $this->templateFromAttributes($attributes, 'views/bidder/notifications');

            $limit         = (isset($attributes['limit'])) ? $attributes['limit'] : '15';
            $notifications = $this->handbid->store('Notification')->allMessages(0, $limit);

            return $this->viewRenderer->render(
                $template,
                [
                    'notifications' => $notifications,
                    'limit'         => $limit,
                ]
            );

        } catch (Exception $e)
        {
            echo "notifications could not be loaded, Please try again later.";
            $this->logException($e);

            return;
        }
    }

    public function bidderProfileForm($attributes)
    {
        try
        {
            $template = $this->templateFromAttributes($attributes, 'views/bidder/profile-form');
            $auction                       = $this->state->currentAuction();
            $auctionID                     = (isset($auction->id)) ? $auction->id : 0;
            $profile                       = $this->state->currentBidder($auctionID);
            if (is_null($profile) && ($template[0] != 'views/bidder/credit-card-form')) {
                return "You must be logged in to view your profile.";
            }
            $inventory                     = $this->state->currentInventory($auctionID);
            $countries                     = $this->state->getCountriesWithCodes();
            $countryIDs                    = $this->state->getCountriesAndProvinces();
            $redirect                      = isset($attributes['redirect']) ? $attributes['redirect'] : null;
            $redirect                      = isset($_SERVER["HTTP_REFERER"]) ? $_SERVER["HTTP_REFERER"] : $redirect;
            $showCreditCardRequiredMessage = isset($attributes['show_credit_card_required_message']) ? $attributes['show_credit_card_required_message'] == 'true' : false;

            $bidderID           = (isset($profile->id)) ? $profile->id : false;
            $cookieName         = $bidderID . "_bid_confirmations";
            $cookieNotExists    = empty($_COOKIE[$cookieName]);
            $cookieExistsAndYes = (!empty($_COOKIE[$cookieName]) and $_COOKIE[$cookieName] != "no");
            $bidConfirm         = ($cookieNotExists or $cookieExistsAndYes);

            return $this->viewRenderer->render(
                $template,
                [
                    'profile'                       => $profile,
                    'auction'                       => $auction,
                    'inventory'                     => $inventory,
                    'redirect'                      => $redirect,
                    'countries'                     => $countries,
                    'countryIDs'                    => $countryIDs,
                    'bidConfirm'                    => $bidConfirm,
                    'showCreditCardRequiredMessage' => $showCreditCardRequiredMessage,
                ]
            );
        } catch (Exception $e)
        {

            echo "Your profile could not be loaded, Please try again later.";
            $this->logException($e);

            return;
        }
    }

    public function bidderCreditCardForm($attributes)
    {
        return do_shortcode('[handbid_bidder_profile_form template="views/bidder/credit-card-form"]');
    }

    public function myCreditCards($attributes)
    {
        try
        {
            $template = $this->templateFromAttributes($attributes, 'views/bidder/credit-cards');
            //$profile  = $this->handbid->store( 'Bidder' )->myProfile();
            $auction   = $this->state->currentAuction();
            $auctionID = (isset($auction->id)) ? $auction->id : 0;
            $profile   = $this->state->currentBidder($auctionID);

            $cards = (isset($profile->creditCards))
                ?
                $profile->creditCards
                :
                $this->handbid->store('CreditCard')->byOwner($profile->id);

            return $this->viewRenderer->render(
                $template,
                [
                    'cards' => $cards,
                ]
            );
        } catch (Exception $e)
        {
            echo "You credit cards could not be loaded. Please try again later.";
            $this->logException($e);

            return;
        }
    }

    public function bidderReceipt($attributes)
    {
        try
        {
            $template = $this->templateFromAttributes($attributes, 'views/bidder/receipt');
            $auction  = $this->state->currentAuction();
            $receipt  = null;
            if ($auction)
            {
                $receipt = $this->handbid->store('Receipt')->byAuction($auction->id);
            }

            return $this->viewRenderer->render(
                $template,
                [
                    'receipt' => $receipt,
                ]
            );
        } catch (Exception $e)
        {
            echo "Your receipt could not be loaded. Please try again later.";
            $this->logException($e);

            return;
        }
    }

    public function loginRegisterForm($atts)
    {
        $atts              = shortcode_atts(array(
                                                'in_page' => '',
                                            ), $atts);
        $countries         = $this->state->getCountriesWithCodes();
        $auction           = $this->state->currentAuction();
        $auctionID         = (isset($auction->id)) ? $auction->id : 0;
        $profile           = $this->state->currentBidder($auctionID);
        $template          = 'views/bidder/login-form-new';
        $auctionRequiresCC = isset($attributes['auction_requires_cc']) ? $attributes['auction_requires_cc'] == 'true' : false;

        return $this->viewRenderer->render(
            $template,
            [
                "auction"           => $auction,
                "profile"           => $profile,
                "countries"         => $countries,
                "in_page"           => !!(trim($atts["in_page"])),
                "is_logged_in"      => !!($profile),
                "auctionRequiresCC" => $auctionRequiresCC,
            ]
        );
    }

    //tickets
    public function ticketList($attributes)
    {

        try
        {
            $auction   = $this->state->currentAuction($attributes);
            $tickets   = $this->state->getCurrentAuctionTickets();
            $auctionID = (isset($auction->id)) ? $auction->id : 0;
            $profile   = $this->state->currentBidder($auctionID);
            $cards     = $profile->creditCards;
            $query     = [];//@todo: find out hwo to pass query through attributes. then merge it with our defaults. array_merge([], $query)

            if ($tickets)
            {
                $template = $this->templateFromAttributes($attributes, 'views/ticket/list');

                return $this->viewRenderer->render(
                    $template,
                    [
                        'tickets' => $tickets,
                        'auction' => $auction,
                        'profile' => $profile,
                        'cards'   => $cards,
                    ]
                );
            }
        } catch (Exception $e)
        {
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
    public function isLoggedCheck()
    {
        $auction   = $this->state->currentAuction();
        $auctionID = (isset($auction->id)) ? $auction->id : 0;
        //$profile = $this->handbid->store( 'Bidder' )->myProfile();
        $profile = $this->state->currentBidder($auctionID);

        return $profile;
    }

    public function isLoggedIn($attributes, $content)
    {
        $isLogged = $this->isLoggedCheck();
        if ($isLogged)
        {
            echo do_shortcode($content);
        }
    }

    public function isLoggedOut($attributes, $content)
    {
        $isLogged = $this->isLoggedCheck();
        if (!$isLogged)
        {
            echo do_shortcode($content);
        }
    }

    public function breadcrumbs($attributes)
    {

        try
        {
            $template = $this->templateFromAttributes($attributes, 'views/navigation/breadcrumb');
            $org      = $this->state->currentOrg();
            $auction  = $this->state->currentAuction();

            return $this->viewRenderer->render(
                $template,
                [
                    'org'     => $org,
                    'auction' => $auction,
                    'item'    => $this->state->currentItem(),
                ]
            );
        } catch (Exception $e)
        {

            echo "Breadcrumb could not be loaded, Please try again later.";
            $this->logException($e);

            return;

        }
    }

    public function pager($attributes)
    {

        try
        {

            $template = $this->templateFromAttributes($attributes, 'views/navigation/pager');

            $page          = isset($attributes['page']) ? $attributes['page'] : 0;
            $pageSize      = isset($attributes['page_size']) ? $attributes['page_size'] : 25;
            $total         = isset($attributes['total']) ? $attributes['total'] : 0;
            $id            = isset($attributes['id']) ? $attributes['id'] : 0;
            $true_url      = isset($attributes['true_url']) ? $attributes['true_url'] : false;
            $base          = isset($attributes['base']) ? $attributes['base'] : "page";
            $initial_point = isset($attributes['initial_point']) ? (int)$attributes['initial_point'] : 0;

            return $this->viewRenderer->render(
                $template,
                [
                    'page'          => $page,
                    'page_size'     => $pageSize,
                    'total'         => $total,
                    'id'            => $id,
                    'true_url'      => $true_url,
                    'base'          => $base,
                    'initial_point' => $initial_point,
                ]
            );
        } catch (Exception $e)
        {

            $this->logException($e);

            return;

        }

    }


    public function handbidTestimonials($attributes)
    {

        $currentTestimonial = intval($_GET['testimonial']);
        $currentPage        = (intval($_GET['block']) > 0) ? intval($_GET['block']) : 1;
        $perPage            = 5;
        $offset             = ($currentPage - 1) * $perPage;

        $args                = array(
            'posts_per_page' => -1,
            'orderby'        => 'date',
            'order'          => 'DESC',
            'post_type'      => 'hb_testimonial',
            'post_status'    => 'publish',
        );
        $testimonials        = get_posts($args);
        $recentTestimonials  = array_slice($testimonials, 0, 3);
        $displayTestimonials = array_slice($testimonials, $offset, $perPage);

        if ($currentTestimonial)
        {
            $singleTestimonial = get_post($currentTestimonial);
            $singleTestimonial = ($singleTestimonial) ? $singleTestimonial : false;
        } else
        {
            $singleTestimonial = false;
        }

        return $this->viewRenderer->render(
            "views/social/testimonials",
            [
                "testimonials"        => $testimonials,
                "count"               => count($testimonials),
                "perPage"             => $perPage,
                "currentPage"         => $currentPage,
                "offset"              => $offset,
                "singleTestimonial"   => $singleTestimonial,
                "recentTestimonials"  => $recentTestimonials,
                "displayTestimonials" => $displayTestimonials,
            ]
        );

    }

    public function headerTitle($attributes)
    {

        global $post;

        if (!$post)
        {
            return;
        }

        if (is_single())
            return "Blog";
        if (is_search())
            return "Search";
        if (is_page('Get Started Confirmation'))
            return "Get Started";

        if (in_array($post->post_name, ['auction', 'auction-item']))
        {

            $hb = Handbid::instance();

            $auctionStartTime = "";
            $auctionEndTime   = "";
            $auctionTitle     = "";
            $auctionTimeZone  = "";
            $auctionStatus    = "";

            if ($post->post_name == 'auction-item')
            {

                $item             = $hb->state()->currentItem();
                $auction          = $hb->state()->currentAuction();
                $auctionStartTime = (isset($item->auctionStartTime)) ? $item->auctionStartTime : "";
                $auctionEndTime   = (isset($item->auctionEndTime)) ? $item->auctionEndTime : "";
                $auctionTitle     = (isset($item->auctionName)) ? $item->auctionName : "";
                $auctionTimeZone  = (isset($item->auctionTimeZone)) ? $item->auctionTimeZone : "";
                $auctionStatus    = (isset($auction->status)) ? $auction->status : "";

            }
            if ($post->post_name == 'auction' or trim($auctionTitle) == "")
            {

                $auction          = $hb->state()->currentAuction();
                $auctionStartTime = (isset($auction->startTime)) ? $auction->startTime : "";
                $auctionEndTime   = (isset($auction->endTime)) ? $auction->endTime : "";
                $auctionTitle     = (isset($auction->name)) ? $auction->name : "";
                $auctionTimeZone  = (isset($auction->timeZone)) ? $auction->timeZone : "";
                $auctionStatus    = (isset($auction->status)) ? $auction->status : "";

            }
            $timeZone = (trim($auctionTimeZone)) ? $auctionTimeZone : 'America/Denver';
            if (trim($auctionTitle))
            {

                date_default_timezone_set($timeZone);

                $title = $auctionTitle;
                $title .= ($auctionStatus == "setup") ? '<span class="auction-unavailable">auction is currently not available</span>' : "";
                $title .= '<span class="under">';
                $sep = ' &mdash; ';

                if (date('Ymd', $auctionStartTime) == date('Ymd', $auctionEndTime))
                {
                    //The same day of opening and closing
                    $title .= date('M jS g:i a', $auctionStartTime) . $sep . date('g:i a | Y', $auctionEndTime);
                } elseif (date('Ym', $auctionStartTime) == date('Ym', $auctionEndTime))
                {
                    //The same month
                    $title .= date('M jS g:i a', $auctionStartTime) . $sep . date('jS g:i a | Y', $auctionEndTime);
                } elseif (date('Y', $auctionStartTime) == date('Y', $auctionEndTime))
                {
                    //The same year
                    $title .= date('M jS g:i a', $auctionStartTime) . $sep . date('M jS g:i a | Y', $auctionEndTime);
                } else
                {
                    //Different years
                    $title .= date('M jS g:i a | Y', $auctionStartTime) . $sep . date('M jS g:i a | Y', $auctionEndTime);
                }

                $title .= ' ' . date("T", $auctionEndTime);

                $title .= '</span>';

                return $title;
            }
        }
        if ($post->post_name == 'invoices')
        {
            $hb       = Handbid::instance();
            $receipts = $hb->state()->currentReceipts();
            return (is_array($receipts) && count($receipts) && !empty($receipts[0]->name)) ? $receipts[0]->name : "Invoices";
        }

        return get_the_title();

    }

    public function customizerStyles()
    {
        return "<style type='text/css'>" . $this->viewRenderer->render(
            'views/admin/customizer', []
        ) . "</style>";
    }

    public function logException($e)
    {

        error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
    }

    public function isAuctionSetup($auction)
    {
        return (is_object($auction) and $auction->status == "setup");
    }

    public function myProfileAjax()
    {

        $nonce = $_POST["nonce"];

        if (wp_verify_nonce($nonce, "bidder-" . date("Y.m.d")))
        {

            $auction          = (int)$_POST["auction"];
            $isInitialLoading = (isset($_POST["isInitialLoading"]) and (bool)$_POST["isInitialLoading"]);
            echo do_shortcode("[handbid_bidder_profile_bar " . (($auction) ? " auction='" . $auction . "' " : "") . " " . (($isInitialLoading) ? " isInitialLoading='" . $isInitialLoading . "' " : "") . "]");

        }

        exit;
    }

    public function addAjaxProcess()
    {

        $actions = [
            "handbid_profile_load" => "myProfileAjax",
        ];

        foreach ($actions as $action => $handler)
        {
            add_action("wp_ajax_" . $action, [$this, $handler]);
            add_action("wp_ajax_nopriv_" . $action, [$this, $handler]);
        }

    }

}
