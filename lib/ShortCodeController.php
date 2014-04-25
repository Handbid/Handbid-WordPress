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

        if(!isset($attributes['template']) && !$attributes['template']) {
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
            echo "No organization details could be found";
            return;
        }
    }
    public function organizationAuctions($attributes) {
        try {

            $template = $this->templateFromAttributes($attributes, 'views/auction/logo');

            $organization = $this->state->currentOrg();
            $auctions = $this->handbid->store('Auction')->byOrg($organization->_id);

            $markup = $this->viewRenderer->render($template, [
                    'auctions' => $auctions
                ]);

            return $markup;
        }
        catch (Exception $e) {
            echo "No organization auctions could be found";
            return;
        }
    }

    // Auctions
    public function auctionResults ($attributes) {

        try {

            $template = $this->templateFromAttributes($attributes, 'views/auction/logo');


            if(!in_array($attributes['type'], ['recent', 'all', 'past'])) {
                $attributes['type'] = 'recent';
            }

            // Get orgs from handbid server
            $auctions = $this->handbid->store('Auction')->{$attributes['type']}();

            $markup = $this->viewRenderer->render($template, [
                    'auctions' => $auctions
                ]);

            return $markup;
        }
        catch (Exception $e) {
            echo "Error during Auctions List";
            return;
        }

    }
    public function auctionBanner($attributes) {

        try {
            $auction = $this->state->currentAuction();

            $url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' . urlencode($auction->vanityAddress) . '&sensor=true';

            $geolocation = json_decode(file_get_contents($url));

            $location = $geolocation->results[0]->geometry->location;

            $coords = [
                $location->lat,
                $location->lng
            ];

            $template = $this->templateFromAttributes($attributes, 'views/auction/banner');
            return $this->viewRenderer->render($template, [
                    'auction'     => $auction,
                    'coordinates' => $coords
                ]);

        } catch(Exception $e)
        {
            echo 'Error in auction banner';
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
            echo "No Auction found";
            return;
        }


    }
    public function auctionContactForm($attributes) {
        try {
            $template = $this->templateFromAttributes($attributes, 'views/auction/contact-form');
            return $this->viewRenderer->render($template, $this->state->currentAuction());
        }
        catch (Exception $e) {
            echo "Could not find current auction for contact form";
            return;
        }

    }
    public function auctionList($attributes) {

        try {
            $auction = $this->state->currentAuction();
            $items = $this->handbid->store('Item')->byAuction($auction->_id);

            $template = $this->templateFromAttributes($attributes, 'views/auction/list');
            return $this->viewRenderer->render($template, [
                    'categories' => 'category',
                    'items'      => $items
                ]);
        }
        catch (Exception $e) {
            echo $e->getMessage();
            return;
        }

        // Temp dummy data
    }

    // Bids
    public function bidNow($attributes) {
        try {
            $template = $this->templateFromAttributes($attributes, 'views/bid/now');
            return $this->viewRenderer->render($template, $this->state->currentItem());
        }
        catch (Exception $e) {
            echo "No Item Found for Bid Now";
            return;
        }
    }
    public function bidHistory($attributes) {
        try {
            $template = $this->templateFromAttributes($attributes, 'views/bid/history');
            return $this->viewRenderer->render($template, $this->state->currentItem());
        } catch (Exception $e) {
            echo "No Item Found for Bid History";
            return;
        }

    }
    public function bidWinning($attributes) {
        try {
            $template = $this->templateFromAttributes($attributes, 'views/bid/winning');
            return $this->viewRenderer->render($template, $this->state->currentItem());
        }
        catch (Exception $e) {
            echo "No Item found for Bid winning";
            return;
        }


    }

    // Items
    public function itemResults($attributes) {
        try {
            $template = $this->templateFromAttributes($attributes, 'views/item/results');
            return $this->viewRenderer->render($template, $this->state->currentItem());
        }
        catch (Exception $e) {
            echo "No Item was found for Item Results";
            return;
        }
    }
    public function itemSearchBar($attributes) {
        try {
        }
        catch (Exception $e) {
            echo "Error For Search Bar";
            return;
        }
    }

    // Tickets
    public function ticketBuy($attributes) {
        try {
            $auction = $this->state->currentAuction();
        } catch(Exception $e)
        {
            echo "Ticket Buy, No Auction Found";
            return;
        }
    }

    // Image
    public function imageGallery($attributes) {
        try {
            $item = $this->state->currentItem();
            $template = $this->templateFromAttributes($attributes, 'views/image/photo-gallery');
            return $this->viewRenderer->render($template, $item);
        } catch(Exception $e)
        {
            echo 'No Item was found for image gallery';
            return;
        }
    }

}