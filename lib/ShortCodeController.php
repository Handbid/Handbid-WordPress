<?php

class ShortCodeController {

    public $viewRenderer;
    public $basePath;
    public $state;
    public $handbid;

    public function __construct(\Handbid\Handbid $handbid, HandbidViewRenderer $viewRenderer, $basePath, $state, $config = []) {
        $this->handbid = $handbid;
        $this->viewRenderer = $viewRenderer;
        $this->basePath = $basePath;
        $this->state = $state;

        // loop through our objects and save them as parameters
        forEach($config as $k => $v) {
            $this->$k = $v;
        }
    }

    public function init() {
        $this->initShortCode();
    }
    function initShortCode() {

        // Add Plugin ShortCodes
        $shortCodes = [
            'handbid_organization_details' => 'organizationDetails',
            'handbid_organization_auctions'=> 'organizationAuctions',
            'handbid_auction_results'      => 'auctionResults',
            'handbid_auction_banner'       => 'auctionBanner',
            'handbid_auction_details'      => 'auctionDetails',
            'handbid_auction_contact_form' => 'auctionContactForm',
            'handbid_auction_list'         => 'auctionList',
            'handbid_bid_now'              => 'bidNow',
            'handbid_bid_history'          => 'bidHistory',
            'handbid_bid_winning'          => 'bidWinning',
            'handbid_item_results'         => 'itemResults',
            'handbid_item_search_bar'      => 'itemSearchBar',
            'handbid_ticket_buy'           => 'ticketBuy',
            'handbid_image_gallery'        => 'imageGallery'
        ];

        forEach($shortCodes as $shortCode => $callback) {
            add_shortcode( $shortCode, [ $this, $callback ] );
        }
    }

    // Helpers
    public function templateFromAttributes($attributes, $default) {

        if(!is_array($attributes) || !isset($attributes['template']) || !$attributes['template']) {
            $attributes['template'] = $default;
        }

        return $attributes['template'];
    }

    // Organization
    public function organizationDetails($attributes) {
        try {

            $template = $this->templateFromAttributes($attributes, 'views/organization/details');

            $organization = $this->state->currentOrg();

            $markup = $this->viewRenderer->render($template, [
                    'organization' => $organization
                ]);

            return $markup;
        }
        catch (Exception $e) {
            echo "Oops we could not find the organization you were looking for, Please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }
    }
    public function organizationAuctions($attributes) {
        try {

            $template = $this->templateFromAttributes($attributes, 'views/auction/logo');

            $org = $this->state->currentOrg();


            if(!in_array($attributes['type'], ['upcoming', 'all', 'past'])) {
                $attributes['type'] = 'upcoming';
            }

            // Get orgs from handbid server
            $auctions = $this->handbid->store('Auction')->{$attributes['type']}(($org->_id) ? $org->_id : null);

            $markup = $this->viewRenderer->render($template, [
                    'auctions' => $auctions
                ]);

            return $markup;
        }
        catch (Exception $e) {
            echo "Organizations Auctions could not be found, please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }
    }

    // Auctions
    public function auctionResults ($attributes) {

        try {

            $template = $this->templateFromAttributes($attributes, 'views/auction/logo');


            if(!is_array($attributes) || !in_array($attributes['type'], ['upcoming', 'all', 'past'])) {
                $attributes['type'] = 'upcoming';
            }

            // Get orgs from handbid server
            $auctions = $this->handbid->store('Auction')->{$attributes['type']}();

            $markup = $this->viewRenderer->render($template, [
                    'auctions' => $auctions
                ]);

            return $markup;
        }
        catch (Exception $e) {
            echo "Auctions could not be found, please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }

    }
    public function auctionBanner($attributes) {

        try {
            $auction = $this->state->currentAuction();

            $url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' . urlencode($auction->vanityAddress) . '&sensor=true';

            $geolocation = json_decode(file_get_contents($url));
            $coords = '';

            if(!$geolocation->status == "ZERO_RESULTS") {

                $location = $geolocation->results[0]->geometry->location;

                $coords = [
                    $location->lat,
                    $location->lng
                ];

            }
            else
            {
                error_log('Recieved ZERO_RESULTS from google maps in auction banner shortCode.');
            }

            $template = $this->templateFromAttributes($attributes, 'views/auction/banner');
            return $this->viewRenderer->render($template, [
                    'auction'     => $auction,
                    'coordinates' => $coords
                ]);

        } catch(Exception $e)
        {
            echo "Auction banner could not be loaded, Please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }

    }
    public function auctionDetails($attributes) {

        try {
            $template = $this->templateFromAttributes($attributes, 'views/auction/details');
            $auction = $this->state->currentAuction();
            return $this->viewRenderer->render($template, [
                    'auction'      => $auction
                ]);
        }
        catch(Exception $e) {
            echo "Auction details could not be loaded, Please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }


    }
    public function auctionContactForm($attributes) {
        try {
            $template = $this->templateFromAttributes($attributes, 'views/auction/contact-form');
            return $this->viewRenderer->render($template, $this->state->currentAuction());
        }
        catch (Exception $e) {
            echo "Contact form could not be loaded, Please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }

    }
    public function auctionList($attributes) {

        try {
            $auction = $this->state->currentAuction();
            $items = $this->handbid->store('Item')->byAuction($auction->_id);

            // Get donors
            $donorsDirty = [];

            forEach($items as $item) {
                if($item->donor) {
                    $donorsDirty[] = $item->donor;
                }
            }

            $donors     = array_unique($donorsDirty);

            $template = $this->templateFromAttributes($attributes, 'views/auction/list');
            return $this->viewRenderer->render($template, [
                    'categories' => [
                        '_all' => 'All'
                    ],
                    'items'      => $items,
                    'donors'     => $donors
                ]);
        }
        catch (Exception $e) {
            echo "Auctions could not be found, please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }

    }

    // Bids
    public function bidNow($attributes) {
        try {
            $template = $this->templateFromAttributes($attributes, 'views/bid/now');
            return $this->viewRenderer->render($template, [
                    'item' => $this->state->currentItem()
                ]);
        }
        catch (Exception $e) {
            echo "Bid now feature could not be loaded, please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }
    }
    public function bidHistory($attributes) {
        try {
            $auction    = $this->state->currentAuction();
            $item       = $this->state->currentItem();
            $bidHistory = $this->handbid->store('Bid')->byItem($auction->_id, $item->_id);

            $template = $this->templateFromAttributes($attributes, 'views/bid/history');
            return $this->viewRenderer->render($template, [
                    'item'       => $this->state->currentItem(),
                    'bidHistory' => $bidHistory
                ]);
        } catch (Exception $e) {
            echo "Bid history could not be loaded, please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }

    }
    public function bidWinning($attributes) {
        try {
            $template = $this->templateFromAttributes($attributes, 'views/bid/winning');
            return $this->viewRenderer->render($template, [
                    'item' => $this->state->currentItem()
                ]);
        }
        catch (Exception $e) {
            echo "winning bid could note be loaded, Please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }


    }

    // Items
    public function itemResults($attributes) {
        try {
            $template = $this->templateFromAttributes($attributes, 'views/item/results');
            return $this->viewRenderer->render($template, [
                    'item' => $this->state->currentItem()
                ]);
        }
        catch (Exception $e) {
            echo "item results could not be loaded, Please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }
    }
    public function itemSearchBar($attributes) {
        try {
        }
        catch (Exception $e) {
            echo "Search bar could not be loaded, Please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }
    }

    // Tickets
    public function ticketBuy($attributes) {
        try {
            $auction = $this->state->currentAuction();
        } catch(Exception $e)
        {
            echo "Ticket purchase could not be loaded, Please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }
    }

    // Image
    public function imageGallery($attributes) {
        try {
            $item = $this->state->currentItem();
            $template = $this->templateFromAttributes($attributes, 'views/image/photo-gallery');
            return $this->viewRenderer->render($template, [
                    'item' => $item
                ]);
        } catch(Exception $e)
        {
            echo "Image gallery could not be loaded, Please try again later.";
            error_log($e->getMessage() . ' on' . $e->getFile() . ':' . $e->getLine());
            return;
        }
    }

}