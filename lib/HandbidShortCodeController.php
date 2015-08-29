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
class HandbidShortCodeController {

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
		$config = [ ]
	) {
		$this->handbid         = $handbid;
		$this->viewRenderer    = $viewRenderer;
		$this->basePath        = $basePath;
		$this->state           = $state;
		$this->routeController = $routeController;

		// loop through our objects and save them as parameters
		forEach ( $config as $k => $v ) {
			$this->$k = $v;
		}
	}

	public function init() {
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
			'handbid_bidder_bids'           => 'myBids',
			'handbid_bidder_proxy_bids'     => 'myProxyBids',
			'handbid_bidder_purchases'      => 'myPurchases',
			'handbid_bidder_profile_form'   => 'bidderProfileForm',
			'handbid_bidder_cc_form'        => 'bidderCreditCardForm',
			'handbid_is_logged_in'          => 'isLoggedIn',
			'handbid_is_logged_out'         => 'isLoggedOut',
			'handbid_breadcrumb'            => 'breadcrumbs',
			'handbid_bidder_credit_cards'   => 'myCreditCards',
			'handbid_bidder_receipt'        => 'bidderReceipt',
			'handbid_bidder_login_form'     => 'loginRegisterForm',
		];

		forEach ( $shortCodes as $shortCode => $callback ) {
			add_shortcode( $shortCode, [ $this, $callback ] );
		}

        $this->addAjaxProcess();
	}

	// Helpers
	public function templateFromAttributes( $attributes, $default ) {

		$templates = [ ];
		$template  = '';

		if ( ! is_array( $attributes ) || ! isset( $attributes['template'] ) || ! $attributes['template'] ) {
			$templates[] = $template = $default;
		} else {
			$templates[] = $template = $attributes['template'];
		}

		//if the template does not start
		if ( $template != DIRECTORY_SEPARATOR ) {
			$templates[] = get_template_directory() . DIRECTORY_SEPARATOR . $template;
		}

		return $templates;
	}

	// Organization
	public function organizationDetails( $attributes ) {
		try {

			$template = $this->templateFromAttributes( $attributes, 'views/organization/details' );

			$organization = $this->state->currentOrg();

			$markup = $this->viewRenderer->render(
				$template,
				[
					'organization' => $organization
				]
			);

			return $markup;
		} catch ( Exception $e ) {
			echo "Oops we could not find the organization you were looking for, Please try again later.";
			$this->logException( $e );

			return;
		}
	}

	//
	public function organizationAuctions( $attributes ) {
		try {

			$template = $this->templateFromAttributes( $attributes, 'views/auction/list' );

			$org = $this->state->currentOrg();

			//let you change how you search
			if ( isset( $_GET['auction_list'] ) ) {
				$attributes['type'] = $_GET['auction_list'];
			}


			if ( ! isset( $attributes['type'] ) || ! is_array( $attributes ) || ! in_array(
					$attributes['type'],
					[ 'current', 'upcoming', 'byOrg', 'past', 'closed', 'open', 'preview', 'presale' ]
				)
			) {
				$attributes['type'] = 'byOrg';
			}

			// Get orgs from handbid server
			if ( $org ) {
                //$profile = $this->handbid->store( 'Bidder' )->myProfile();
                $profile = $this->state->currentBidder();
                $this->handbid->store('Auction')->setBasePublicity(! $profile);
				$auctions = $this->handbid->store( 'Auction' )->{$attributes['type']}( 0, 25, 'name', 'ASC', $org->id );
			} else {
				$auctions = [ ];
			}

            $colsCount = $this->state->getGridColsCount();

			$markup = $this->viewRenderer->render(
				$template,
				[
					'auctions' => $auctions,
                    'cols_count' => $colsCount,
				]
			);

			return $markup;
		} catch ( Exception $e ) {
			echo "Organizations auctions could not be found, please try again later. Please make sure you have the proper organization key set";
			$this->logException( $e );

			return;
		}
	}

	// Auctions

	public function auctionList( $attributes ) {

		try {

			$template = $this->templateFromAttributes( $attributes, 'views/auction/list' );
			$query    = [ ];

			//let you change how you search
			if ( isset( $_GET['auction_list'] ) ) {
				$attributes['type'] = $_GET['auction_list'];
			}

			if ( ! isset( $attributes['type'] ) || ! is_array( $attributes ) || ! in_array(
					$attributes['type'],
					[ 'current', 'upcoming', 'all', 'past', 'closed', 'open', 'preview', 'presale' ]
				)
			) {
				$attributes['type'] = 'current';
			}

			$id = isset( $attributes['id'] ) ? $attributes['id'] : 'auctions';

			$auctionParams = isset( $_GET[ $id ] ) ? $_GET[ $id ] : [ ];

			$page = 0;

			if ( isset( $auctionParams['page'] ) ) {
				$page = $auctionParams['page'];
			} else if ( isset( $attributes['page'] ) ) {
				$page = $attributes['page'];
			}

			//paging and sort
            $pageSize = $this->state->getPageSize((int) $attributes['page_size']);
			$sortField     = isset( $attributes['sort_field'] ) ? $attributes['sort_field'] : "name";
			$sortDirection = isset( $attributes['sort_direction'] ) ? $attributes['sort_direction'] : "asc";
			$id            = isset( $attributes['id'] ) ? $attributes['id'] : 'auctions';

            //$profile = $this->handbid->store( 'Bidder' )->myProfile();
            $profile = $this->state->currentBidder();
            $this->handbid->store('Auction')->setBasePublicity(! $profile);
            $auctions = $this->handbid->store('Auction')->byStatus($attributes['type'], (int) $page + 1, $pageSize);
            $total = $this->handbid->store('Auction')->count($attributes['type']);

            $colsCount = $this->state->getGridColsCount();

			$markup = $this->viewRenderer->render(
				$template,
				[
					'auctions'  => $auctions,
					'total'     => $total,
					'id'        => $id,
					'page_size' => $pageSize,
					'page'      => $page,
                    'cols_count' => $colsCount,
				]
			);

			return $markup;

		} catch ( Exception $e ) {
			echo "Auctions could not be loaded, please try again later.";
			$this->logException( $e );

			return;
		}

	}

	public function organizationList( $attributes ) {

		try {

			$template = $this->templateFromAttributes( $attributes, 'views/organization/list' );

			$id = isset( $attributes['id'] ) ? $attributes['id'] : 'orgs';

			$organizationParams = isset( $_GET[ $id ] ) ? $_GET[ $id ] : [ ];

			$page = 0;

			if ( isset( $organizationParams['page'] ) ) {
				$page = $organizationParams['page'];
			} else if ( isset( $attributes['page'] ) ) {
				$page = $attributes['page'];
			}

			//paging and sort
			$pageSize = $this->state->getPageSize((int) $attributes['page_size']);
			$sortField     = isset( $attributes['sort_field'] ) ? $attributes['sort_field'] : "name";
			$sortDirection = isset( $attributes['sort_direction'] ) ? $attributes['sort_direction'] : "asc";
			$logoWidth     = isset( $attributes['logo_width'] ) ? $attributes['logo_width'] : 200;
			$logoHeight    = isset( $attributes['logo_height'] ) ? $attributes['logo_height'] : false;

			$query = [ ];

            //$profile = $this->handbid->store( 'Bidder' )->myProfile();
            $profile = $this->state->currentBidder();
            //$this->handbid->store('Organization')->setBasePublicity(! $profile);
			$organizations = $this->handbid->store( 'Organization' )->all(
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

			$total = $this->handbid->store( 'Organization' )->count( $query );

            $colsCount = $this->state->getGridColsCount();

			$markup = $this->viewRenderer->render(
				$template,
				[
					'organizations' => $organizations,
					'total'         => $total,
					'id'            => $id,
					'page_size'     => $pageSize,
					'page'          => $page,
                    'cols_count' => $colsCount,
				]
			);

			return $markup;

		} catch ( Exception $e ) {
			echo "Organizations could not be found, please try again later.";
			$this->logException( $e );

			return;
		}

	}

	public function auctionBanner( $attributes ) {

		try {

			$auction = $this->state->currentAuction( $attributes );

			$profile        = null;
			$totalProxies   = null;
			$totalWinning   = null;
			$totalLosing    = null;
			$totalPurchases = null;

			try {

				//$profile = $this->handbid->store( 'Bidder' )->myProfile( $auction->id );
                $this->state->currentBidder($auction->id);
				if ( $profile ) {

                    $myInventory = $this->state->currentInventory($auction->id);

                    $totalWinning   = count($myInventory->winning);
                    $totalLosing    = count($myInventory->losing);
                    $totalPurchases = count($myInventory->purchases);
                    $totalProxies   = count($myInventory->max_bids);

					//$totalWinning   = count( $this->handbid->store( 'Bid' )->myWinning( $auction->id ) );
					//$totalLosing    = count( $this->handbid->store( 'Bid' )->myLosing( $auction->id ) );
					//$totalProxies   = count( $this->handbid->store( 'Bid' )->myProxyBids( $auction->id ) );
					//$totalPurchases = count( $this->handbid->store( 'Bid' )->myPurchases( $auction->id ) );

				}

			} catch ( Exception $e ) {

				$in = $e;
				//                debug();

			}

			$template = $this->templateFromAttributes( $attributes, 'views/auction/banner' );

			return $this->viewRenderer->render(
				$template,
				[
					'auction'     => $auction,
					'winningBids' => $totalWinning,
					'losingBids'  => $totalLosing,
					'purchases'   => $totalPurchases,
					'profile'     => $profile,
					'proxies'     => $totalProxies
				]
			);

		} catch ( Exception $e ) {

			echo "Auction banner could not be loaded, Please try again later.";
			$this->logException( $e );

			return;

		}

	}

	public function connect( $attributes ) {

		try {
			$template = $this->templateFromAttributes( $attributes, 'views/connect' );
			$bidder   = $this->state->currentBidder( $attributes );
			$protocol = ( ! empty( $_SERVER['HTTPS'] ) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443 ) ? "https://" : "http://";

			$default = $protocol . $_SERVER["HTTP_HOST"] . $_SERVER["REQUEST_URI"];

			return $this->viewRenderer->render(
				$template,
				[
					'bidder'  => $bidder,
					'passUrl' => isset( $attributes['passUrl'] ) ? $attributes['passUrl'] : $default,
					'failUrl' => isset( $attributes['failUrl'] ) ? $attributes['failUrl'] : $default,
				]
			);
		} catch ( Exception $e ) {
			echo "Rendering connect button failed.";
			$this->logException( $e );

			return;
		}


	}

	public function auctionDetails( $attributes ) {

		try {

			$template = $this->templateFromAttributes( $attributes, 'views/auction/details' );
			$auction  = $this->state->currentAuction( $attributes );
			$tickets  = $this->state->getCurrentAuctionTickets(  );
            $bidder   = $this->state->currentBidder( $auction->id );

            $items = [];
            forEach($auction->categories as $category) {
                forEach($category->items as $item) {
                    $items[] = $item;
                }
            }

            if($bidder){
                $myInventory = $this->state->currentInventory($auction->id);
                $winning   = $myInventory->winning;
                $losing    = $myInventory->losing;
            }
            else{
                $winning = [];
                $losing = [];
            }
            $colsCount = $this->state->getGridColsCount(3, "Item");
            $winning= (is_array($winning))?$winning:[];
            $losing= (is_array($losing))?$losing:[];
			return $this->viewRenderer->render(
				$template,
				[
					'auction'    => $auction,
					'tickets'    => $tickets,
					'profile'    => $bidder,
					'items'      => $items,
					'winning'    => $winning,
					'losing'     => $losing,
					'cols_count' => $colsCount,
				]
			);

		} catch ( Exception $e ) {

			echo "Auction details could not be loaded, Please try again later.";
			$this->logException( $e );

			return;
		}
	}

	public function auctionTimer( $attributes ) {

		try {

			$template = $this->templateFromAttributes( $attributes, 'views/auction/timer' );
			$auction  = $this->state->currentAuction( $attributes );

			return $this->viewRenderer->render(
				$template,
				[
					'auction' => $auction,
				]
			);

		} catch ( Exception $e ) {
			$this->logException( $e );

			return;
		}
	}

	public function auctionItemList( $attributes ) {

		try {
			$auction  = $this->state->currentAuction();

			forEach($auction->categories as $category) {
				forEach($category->items as $item) {
					$items[] = $item;
				}
			}
            //$profile = $this->handbid->store( 'Bidder' )->myProfile();
            $profile = $this->state->currentBidder($auction->id);
            if($profile){
                $myInventory = $this->state->currentInventory($auction->id);
                $winning   = $myInventory->winning;
                $losing    = $myInventory->losing;
            }
            else{
                $winning = [];
                $losing = [];
            }

			$template = $this->templateFromAttributes( $attributes, 'views/item/list' );

            $colsCount = $this->state->getGridColsCount(3, "Item");
            $winning= (is_array($winning))?$winning:[];
            $losing= (is_array($losing))?$losing:[];
			return $this->viewRenderer->render(
				$template,
				[
					'auction' => $auction,
					'items'   => $items,
                    'cols_count' => $colsCount,
                    'winning' => $winning,
                    'losing'  => $losing,
				]
			);
		} catch ( Exception $e ) {
			echo "Auction Item List could not be found, please try again later.";
			$this->logException( $e );

			return;
		}

	}

	// Items
	public function itemDetails( $attributes ) {
		try {

			$template = $this->templateFromAttributes( $attributes, 'views/item/details' );
			//$item    = $this->state->currentItem( $attributes );
			$item    = $this->state->currentItem();
			$auction = $this->state->currentAuction();
            $bids = $this->handbid->store( 'Bid' )->itemBids( $item->id );
            $related = false;

			if ( $attributes !== '' && $item && in_array( 'include_related', $attributes ) ) {

				$related = $this->handbid->store( 'Item' )->related( $item->id, [
					'config' => [
						'skip'  => isset( $attributes['related_skip'] ) ? $attributes['related_skip'] : 0,
						'limit' => isset( $attributes['related_limit'] ) ? $attributes['related_limit'] : 3,
					]
				] );
			}

            //$profile = $this->handbid->store( 'Bidder' )->myProfile();
            $profile = $this->state->currentBidder($auction->id);
            if($profile){
                $myInventory = $this->state->currentInventory($auction->id);
                $winning   = $myInventory->winning;
                $losing    = $myInventory->losing;
            }
            else{
                $winning = [];
                $losing = [];
            }
            $winning= (is_array($winning))?$winning:[];
            $losing= (is_array($losing))?$losing:[];
			return $this->viewRenderer->render(
				$template,
				[
					'item'    => $item,
					'bids' => $bids,
					'related' => $related,
					'auction' => $auction,
					'profile' => $profile,
					'winning' => $winning,
					'losing' => $losing,
				]
			);
		} catch ( Exception $e ) {
			echo "Item could not be loaded. Please try again later.";
			$this->logException( $e );

			return;
		}
	}

    public function sortBidsByTime($a, $b){
        if ((int) $a->microtime == (int) $b->microtime) {
            return 0;
        }
        return ((int) $a->microtime > (int) $b->microtime) ? -1 : 1;
    }

	public function itemBids( $attributes ) {
		try {

			$template = $this->templateFromAttributes( $attributes, 'views/item/bids' );

			$item    = $this->state->currentItem( $attributes );
			$profile = $this->state->currentBidder();
			$bids    = null;

			if ( $item ) {
				$bids = $this->handbid->store( 'Bid' )->itemBids( $item->id );

                usort($bids, [$this, "sortBidsByTime"]);
			}

			return $this->viewRenderer->render(
				$template,
				[
					'item'    => $item,
					'profile' => $profile,
					'bids'    => $bids
				]
			);
		} catch ( Exception $e ) {
			echo "Item could not be loaded. Please try again later.";
			$this->logException( $e );

			return;
		}
	}

	public function bidNow( $attributes ) {
		try {
			$template = $this->templateFromAttributes( $attributes, 'views/item/bid' );

			$item    = $this->state->currentItem();
			$auction = $this->state->currentAuction();

			$bids    = $this->handbid->store( 'Bid' )->itemBids( $item->id );
			$profile = $this->handbid->store( 'Bidder' )->myProfile();

			return $this->viewRenderer->render(
				$template,
				[
					'item'    => $item,
					'bids'    => $bids,
					'profile' => $profile,
					'auction' => $auction
				]
			);
		} catch ( Exception $e ) {

			echo "Bid now feature could not be loaded, please try again later.";
			$this->logException( $e );

			return;
		}
	}

	// Social
	public function facebookComments( $attributes ) {
		{
			try {
				$auction   = $this->state->currentAuction();
				$item      = $this->state->currentItem();
				$customUrl = isset( $auction->key ) ? $auction->key : '' . isset( $item->key ) ? $item->key : '';
				$template  = $this->templateFromAttributes( $attributes, 'views/facebook/comments' );

				return $this->viewRenderer->render(
					$template,
					[
						'url' => $customUrl
					]
				);
			} catch ( Exception $e ) {
				echo "Facebook Comments could not be loaded, Please try again later.";
				$this->logException( $e );

				return;
			}
		}

	}

	public function socialShare( $attributes ) {
		{
			try {
				$template = $this->templateFromAttributes( $attributes, 'views/social/share' );

				return $this->viewRenderer->render(
					$template, [ ]
				);
			} catch ( Exception $e ) {
				echo "Social Share could not be loaded, Please try again later.";
				$this->logException( $e );

				return;
			}
		}

	}

	// Bidder
    public function bidderStatBar($attributes) {

        $template = $this->templateFromAttributes( $attributes, 'views/bidder/profile-load' );

        // $profile  = $this->handbid->store( 'Bidder' )->myProfile();

        $auction = $this->state->currentAuction();
        $profile  = $this->state->currentBidder($auction->id);

        return $this->viewRenderer->render(
            $template, [
                'profile'    => $profile,
                'auction'    => $auction,
            ]
        );
    }

	public function myProfile( $attributes ) {

		try {
            $template = $this->templateFromAttributes( $attributes, 'views/bidder/profile' );

            // $profile  = $this->handbid->store( 'Bidder' )->myProfile();

            $auction = $this->state->currentAuction();
            $profile  = $this->state->currentBidder($auction->id);

            if(is_null($auction) and isset($attributes["auction"]) and (int) $attributes["auction"] ){
                $auction = $this->auction = $this->handbid->store('Auction')->byId($attributes["auction"], false);
            }
            $isInitialLoading = (isset($attributes["isinitialloading"]));

            $winning    = null;
            $losing     = null;
            $purchases  = null;
            $proxyBids  = null;
            $totalSpent = 0;
            $myAuctions = null;
            $myInvoices = null;

            if ( $profile ) {


                //$myAuctions = $this->handbid->store( 'Bidder' )->getMyAuctions();
                //$myInvoices = $this->handbid->store( 'Receipt' )->allReceipts();
                //$myMessages = $this->handbid->store( 'Notification' )->allMessages( 0, 255 );

                $myAuctions = [];
                $myInvoices = [];
                $myMessages = [];

                if ( $auction && $profile ) {

                    $myInventory = $this->state->currentInventory($auction->id);
                    // echo "<pre>".print_r($myInventory,true)."</pre>";

                    // $winning   = $this->handbid->store( 'Bid' )->myWinning($auction->id );
                    // $losing    = $this->handbid->store( 'Bid' )->myLosing( $auction->id );
                    // $purchases = $this->handbid->store( 'Bid' )->myPurchases( $auction->id );
                    // $proxyBids = $this->handbid->store( 'Bid' )->myProxyBids( $auction->id );

                    $winning   = $myInventory->winning;
                    $losing    = $myInventory->losing;
                    $purchases = $myInventory->purchases;
                    $proxyBids = $myInventory->max_bids;

                    if($winning) {
                        foreach ( $winning as $w ) {
                            $totalSpent += $w->amount;
                        }
                    }

                    if($purchases) {
                        foreach ($purchases as $p) {
                            $totalSpent += $p->grandTotal;
                        }
                    }

                }

			}
            $winning= (is_array($winning))?$winning:[];
            $losing= (is_array($losing))?$losing:[];
			return $this->viewRenderer->render(
				$template,
				[
					'auction'    => $auction,
					'profile'    => $profile,
					'winning'    => $winning,
					'losing'     => $losing,
					'purchases'  => $purchases,
					'maxBids'    => $proxyBids,
					'totalSpent' => $totalSpent,
					'myAuctions' => $myAuctions,
					'myInvoices' => $myInvoices,
					'notifications' => $myMessages,
					'isInitialLoading' => $isInitialLoading,
				]
			);
		} catch ( Exception $e ) {
			echo "Profile could not be loaded. Please try again later.";
			$this->logException( $e );
			return;
		}
	}

    public function bidderProfileInner( $attributes ) {

        try {

            $template = $this->templateFromAttributes( $attributes, 'views/bidder/dashboard-inner' );
            // $profile  = $this->handbid->store( 'Bidder' )->myProfile();

            $auction = $this->state->currentAuction();
            $profile  = $this->state->currentBidder($auction->id);

            $winning    = null;
            $losing     = null;
            $purchases  = null;
            $proxyBids  = null;
            $totalSpent = 0;
            $myAuctions = null;

            if ( $profile ) {
                $img = wp_get_image_editor( $profile->imageUrl );
                if ( ! is_wp_error( $img ) ) {


                    $thumbWidth  = isset( $attributes['thumb_width'] ) ? $attributes['thumb_width'] : 250;
                    $thumbHeight = isset( $attributes['thumb_height'] ) ? $attributes['thumb_height'] : false;
                    $thumbCrop   = isset( $attributes['thumb_crop'] ) ? $attributes['thumb_crop'] : true;

                    $img->resize( $thumbWidth, $thumbHeight, $thumbCrop );
                    $img->save( ABSPATH . 'wp-content/uploads/user-photos/' . $profile->pin . '.png' );
                    $newPhoto = get_site_url() . '/wp-content/uploads/user-photos/' . $profile->pin . '.png';
                }

                if ( isset( $newPhoto ) ) {
                    $profile->photo = $newPhoto;
                }

                $myAuctions = $this->handbid->store( 'Auction' )->myRecent();

                if ( $auction && $profile ) {

                    $myInventory = $this->state->currentInventory($auction->id);

                    // $winning   = $this->handbid->store( 'Bid' )->myWinning($auction->id );
                    // $losing    = $this->handbid->store( 'Bid' )->myLosing( $auction->id );
                    // $purchases = $this->handbid->store( 'Bid' )->myPurchases( $auction->id );
                    // $proxyBids = $this->handbid->store( 'Bid' )->myProxyBids( $auction->id );

                    $winning   = $myInventory->winning;
                    $losing    = $myInventory->losing;
                    $purchases = $myInventory->purchases;
                    $proxyBids = $myInventory->max_bids;

                    if($winning) {
                        foreach ( $winning as $w ) {
                            $totalSpent += $w->amount;
                        }
                    }

                    if($purchases) {
                        foreach ($purchases as $p) {
                            $totalSpent += $p->grandTotal;
                        }
                    }

                }

            }
            $winning= (is_array($winning))?$winning:[];
            $losing= (is_array($losing))?$losing:[];
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
                    'totalSpent' => $totalSpent
                ]
            );
        } catch ( Exception $e ) {
            echo "Profile could not be loaded. Please try again later.";
            $this->logException( $e );

            return;
        }
    }

	public function myBids( $attributes ) {
		try {

			$template = $this->templateFromAttributes( $attributes, 'views/bidder/bids' );
            // $profile  = $this->handbid->store( 'Bidder' )->myProfile();
            $auction  = $this->state->currentAuction();
			$profile  = $this->state->currentBidder($auction->id);

            $myInventory = $this->state->currentInventory($auction->id);

            // $winning   = $this->handbid->store( 'Bid' )->myWinning($auction->id );
            // $losing    = $this->handbid->store( 'Bid' )->myLosing( $auction->id );

            $winning   = $myInventory->winning;
            $losing    = $myInventory->losing;
            $winning= (is_array($winning))?$winning:[];
            $losing= (is_array($losing))?$losing:[];
			return $this->viewRenderer->render(
				$template,
				[
					'winning' => $winning,
					'losing'  => $losing,
					'auction' => $auction
				]
			);
		} catch ( Exception $e ) {
			echo "bids could not be loaded, Please try again later.";
			$this->logException( $e );

			return;
		}
	}

	public function myNotifications( $attributes ) {
		try {

			$template = $this->templateFromAttributes( $attributes, 'views/bidder/notifications' );

			$limit         = ( isset( $attributes['limit'] ) ) ? $attributes['limit'] : '15';
			$notifications = $this->handbid->store( 'Notification' )->allMessages( 0, $limit );

			return $this->viewRenderer->render(
				$template,
				[
					'notifications' => $notifications,
					'limit'         => $limit
				]
			);

		} catch ( Exception $e ) {
			echo "notifications could not be loaded, Please try again later.";
			$this->logException( $e );

			return;
		}
	}

	public function myProxyBids( $attributes ) {
		try {
			$template = $this->templateFromAttributes( $attributes, 'views/bidder/proxybids' );
            // $profile  = $this->handbid->store( 'Bidder' )->myProfile();
            $auction  = $this->state->currentAuction();
			$profile  = $this->state->currentBidder($auction->id);

            $myInventory = $this->state->currentInventory($auction->id);

            //$proxyBids = $this->handbid->store( 'Bid' )->myProxyBids( $auction->id );

            $proxyBids = $myInventory->max_bids;

			return $this->viewRenderer->render(
				$template,
				[
					'bids'    => $proxyBids,
					'auction' => $auction
				]
			);
		} catch ( Exception $e ) {
			echo "Max bids could not be loaded. Please try again later.";
			$this->logException( $e );

			return;
		}
	}

	public function myPurchases( $attributes ) {
		try {

			$template = $this->templateFromAttributes( $attributes, 'views/bidder/purchases' );
			//$profile  = $this->handbid->store( 'Bidder' )->myProfile();
            $auction  = $this->state->currentAuction();
			$profile  = $this->state->currentBidder($auction->id);

            $myInventory = $this->state->currentInventory($auction->id);

            // $purchases = $this->handbid->store( 'Bid' )->myPurchases( $auction->id );

            $purchases = $myInventory->purchases;

			return $this->viewRenderer->render(
				$template,
				[
					'purchases' => $purchases,
					'auction'   => $auction
				]
			);

		} catch ( Exception $e ) {
			echo "purchases could not be loaded, Please try again later.";
			$this->logException( $e );

			return;
		}
	}

	public function bidderProfileForm( $attributes ) {
		try {

			$template = $this->templateFromAttributes( $attributes, 'views/bidder/profile-form' );
			//$profile  = $this->handbid->store( 'Bidder' )->myProfile();
			$profile  = $this->state->currentBidder();

            $countries                     = $this->state->getCountriesWithCodes();
            $countryIDs                    = $this->state->getCountriesAndProvinces();
			$redirect                      = isset( $attributes['redirect'] ) ? $attributes['redirect'] : null;
			$redirect                      = $_SERVER["HTTP_REFERER"];
			$showCreditCardRequiredMessage = isset( $attributes['show_credit_card_required_message'] ) ? $attributes['show_credit_card_required_message'] == 'true' : false;

			return $this->viewRenderer->render(
				$template,
				[
					'profile'                       => $profile,
					'redirect'                      => $redirect,
					'countries'                      => $countries,
					'countryIDs'                      => $countryIDs,
					'showCreditCardRequiredMessage' => $showCreditCardRequiredMessage
				]
			);
		} catch ( Exception $e ) {

			echo "Your profile could not be loaded, Please try again later.";
			$this->logException( $e );

			return;
		}
	}

	public function bidderCreditCardForm( $attributes ) {
        return do_shortcode('[handbid_bidder_profile_form template="views/bidder/credit-card-form"]');
    }

	public function myCreditCards( $attributes ) {
		try {
			$template = $this->templateFromAttributes( $attributes, 'views/bidder/credit-cards' );
			//$profile  = $this->handbid->store( 'Bidder' )->myProfile();
			$profile  = $this->state->currentBidder();

			$cards = (isset($profile->creditCards)) ?
				$profile->creditCards :
				$this->handbid->store( 'CreditCard' )->byOwner( $profile->id );

			return $this->viewRenderer->render(
				$template,
				[
					'cards' => $cards
				]
			);
		} catch ( Exception $e ) {
			echo "You credit cards could not be loaded. Please try again later.";
			$this->logException( $e );

			return;
		}
	}

	public function bidderReceipt( $attributes ) {
		try {
			$template = $this->templateFromAttributes( $attributes, 'views/bidder/receipt' );
			$auction  = $this->state->currentAuction();
			$receipt  = null;
			if ( $auction ) {
				$receipt = $this->handbid->store( 'Receipt' )->byAuction( $auction->id );
			}

			return $this->viewRenderer->render(
				$template,
				[
					'receipt' => $receipt
				]
			);
		} catch ( Exception $e ) {
			echo "Your receipt could not be loaded. Please try again later.";
			$this->logException( $e );

			return;
		}
	}

    public function loginRegisterForm($atts) {
	    $atts = shortcode_atts( array(
		    'in_page'      => '',
	    ), $atts );
        $countries  = $this->state->getCountriesWithCodes();
	    $profile  = $this->state->currentBidder();
        return $this->viewRenderer->render('views/bidder/login-form-new',
            [
                "countries" => $countries,
                "in_page" => !!(trim($atts["in_page"])),
                "is_logged_in" => !!($profile)
            ]
        );
    }

	//tickets
	public function ticketList( $attributes ) {

		try {
			$auction = $this->state->currentAuction( $attributes );
            $tickets = $this->state->getCurrentAuctionTickets();
            $profile   = $this->state->currentBidder( );
            $cards = $profile->creditCards;
			$query = [ ];//@todo: find out hwo to pass query through attributes. then merge it with our defaults. array_merge([], $query)

//			$tickets = $this->handbid->store( 'Ticket' )->byAuction( $auction->key, $query );
			if ( $tickets ) {
				$template = $this->templateFromAttributes( $attributes, 'views/ticket/list' );

				return $this->viewRenderer->render(
					$template,
					[
						'tickets' => $tickets,
						'auction' => $auction,
						'profile' => $profile,
						'cards' => $cards,
					]
				);
			}
		} catch ( Exception $e ) {
			echo "Auction Ticket List could not be found, please try again later.";
			$this->logException( $e );

			return null;
		}


		//@todo: try/catch
		//do_shortcode({{shortcode id}}) (no echo needed)
		//handbid->state->currentAuction()  //use this to get the auction id for the shortcode attribute auctionKey
		//hb->store('Ticket')->byAuction( handbid->state->cuttentAuction() )

	}

	// Control flow
	public function isLoggedIn( $attributes, $content ) {
		//$profile = $this->handbid->store( 'Bidder' )->myProfile();
		$profile = $this->state->currentBidder();
		if ( $profile ) {
			echo do_shortcode( $content );
		}
	}

	public function isLoggedOut( $attributes, $content ) {
		//$profile = $this->handbid->store( 'Bidder' )->myProfile();
		$profile = $this->state->currentBidder();
		if ( ! $profile ) {
			echo do_shortcode( $content );
		}
	}

	public function breadcrumbs( $attributes ) {

		try {
			$template = $this->templateFromAttributes( $attributes, 'views/navigation/breadcrumb' );
			$org      = $this->state->currentOrg();
			$auction  = $this->state->currentAuction();

			return $this->viewRenderer->render(
				$template,
				[
					'org'     => $org,
					'auction' => $auction,
					'item'    => $this->state->currentItem()
				]
			);
		} catch ( Exception $e ) {

			echo "Breadcrumb could not be loaded, Please try again later.";
			$this->logException( $e );

			return;

		}
	}

	public function pager( $attributes ) {

		try {

			$template = $this->templateFromAttributes( $attributes, 'views/navigation/pager' );

			$page     = isset( $attributes['page'] ) ? $attributes['page'] : 0;
			$pageSize = isset( $attributes['page_size'] ) ? $attributes['page_size'] : 25;
			$total    = isset( $attributes['total'] ) ? $attributes['total'] : 0;
			$id       = isset( $attributes['id'] ) ? $attributes['id'] : 0;

			return $this->viewRenderer->render(
				$template,
				[
					'page'      => $page,
					'page_size' => $pageSize,
					'total'     => $total,
					'id'        => $id
				]
			);
		} catch ( Exception $e ) {

			$this->logException( $e );

			return;

		}

	}

	public function headerTitle( $attributes ) {

        global $post;

        if(!$post) {
            return;
        }

        if(is_single())
            return "Blog";
        if(is_search())
            return "Search";
        if(is_page('Get Started Confirmation'))
            return "Get Started";

        if(in_array($post->post_name, ['auction', 'auction-item'])) {

            $hb = Handbid::instance();

            $auctionStartTime = "";
            $auctionEndTime = "";
            $auctionTitle = "";
	        $auctionTimeZone = "";

            if($post->post_name == 'auction-item'){

                $item       = $hb->state()->currentItem();
                $auctionStartTime = $item->auctionStartTime;
                $auctionEndTime = $item->auctionEndTime;
                $auctionTitle = $item->auctionName;
                $auctionTimeZone = $item->auctionTimeZone;

            }
            if($post->post_name == 'auction' or trim($auctionTitle) == ""){

                $auction    = $hb->state()->currentAuction();
                $auctionStartTime = $auction->startTime;
                $auctionEndTime = $auction->endTime;
                $auctionTitle = $auction->name;
	            $auctionTimeZone = $auction->timeZone;

            }
	        $timeZone = (trim($auctionTimeZone)) ? $auctionTimeZone : 'America/Denver' ;
            if(trim($auctionTitle)){

                $startMins = date(':i', $auctionStartTime);
                $endMins = date(':i', $auctionStartTime);
                $startMins = ($startMins == ':00') ? $startMins : "";
                $endMins = ($endMins == ':00') ? $endMins : "";

                date_default_timezone_set($timeZone);

                $title = $auctionTitle . '<span class="under">' . date('M jS g' . $startMins . 'a', $auctionStartTime) . ' - ';

                $title .= (date('mdY H:i', $auctionStartTime) == date('mdY H:i', $auctionEndTime))?
                    date('g' . $endMins . 'a', $auctionEndTime):
                    date('M jS g' . $endMins . 'a | Y', $auctionEndTime);

                $title .= ' ' . $auctionTimeZone;
                $title .= '</span>';

                return $title;
            }
        }

		return get_the_title();

	}

	public function logException( $e ) {

		error_log( $e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine() );
	}

    public function myProfileAjax(){

        $nonce = $_POST["nonce"];

        if(wp_verify_nonce($nonce, "bidder-".date("Y.m.d"))){

            $auction = (int) $_POST["auction"];
            $isInitialLoading = (bool) $_POST["isInitialLoading"];
            echo do_shortcode("[handbid_bidder_profile_bar ". (($auction) ? " auction='".$auction."' " : "" ) ." ". (($isInitialLoading) ? " isInitialLoading='".$isInitialLoading."' " : "" ) ."]");

        }

        exit;
    }

    public function addAjaxProcess(){

        $actions = [
            "handbid_profile_load" => "myProfileAjax"
        ];

        foreach($actions as $action => $handler){
            add_action("wp_ajax_".$action, [$this, $handler]);
            add_action("wp_ajax_nopriv_".$action, [$this, $handler]);
        }

    }

}
