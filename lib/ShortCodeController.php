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
            'handbid_auction_results'      => 'auctionResults',
            'handbid_auction_banner'       => 'auctionBanner',
            'handbid_auction_details'      => 'auctionDetails',
            'handbid_auction_contact_form' => 'auctionContactForm',
            'handbid_auction_list'         => 'auctionList',
            'handbid_bid_now'              => 'bidNow',
            'handbid_bid_history'          => 'bidHistory',
            'handbid_bid_winning'          => 'bidWinning',
            'handbid_item_comment'         => 'itemComment',
            'handbid_item_results'         => 'itemResults',
            'handbid_item_search_bar'      => 'itemSearchBar',
            'handbid_ticket_buy'           => 'ticketBuy',
            'handbid_image_gallery'        => 'imageGallery'
        ];

        forEach($shortCodes as $shortCode => $callback) {
            add_shortcode( $shortCode, [ $this, $callback ] );
        }
    }

    // Auctions
    public function auctionResults ($attributes) {

//        echo "auction results"; exit;

        if(!isset($attributes['template']) && !$attributes['template']) {
            $attributes['template'] = 'views/auction/logo';
        }

        // Get orgs from handbid server
        $orgs = $this->handbid->store('Organization')->all();

        $markup = $this->viewRenderer->render($attributes['template'], [
            'organizations' => $orgs
        ]);

        return $markup;

    }
    public function auctionBanner($attributes) {

        $auction = $this->state->currentAuction();

        $url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' . urlencode($auction[0]['vanityAddress']) . '&sensor=true';

        $geolocation = json_decode(file_get_contents($url));

        $location = $geolocation->results[0]->geometry->location;

        $coords = [
            $location->lat,
            $location->lng
        ];

        $attributes = [
            $this->state->currentAuction(),
            $coords
        ];

        return $this->viewRenderer->render('views/auction/banner', $attributes);

    }
    public function auctionDetails($attributes) {

        return $this->viewRenderer->render('views/auction/details', $this->state->currentAuction());

    }
    public function auctionContactForm($attributes) {

        return $this->viewRenderer->render('views/auction/contact-form', $this->state->currentAuction());

    }
    public function auctionList($attributes) {

        // Temp dummy data
        $categories = file_get_contents($this->basePath . '/dummy-data/dummy-categories.json');
        $items = file_get_contents($this->basePath . '/dummy-data/dummy-items.json');

        $json[] = json_decode($categories,true);
        $json[] = json_decode($items,true);

        return $this->viewRenderer->render('views/auction/list', $json);

    }

    // Bids
    public function bidNow($attributes) {
        return $this->viewRenderer->render('views/bid/now', $this->state->currentItem());
    }
    public function bidHistory($attributes) {
        return $this->viewRenderer->render('views/bid/history', $this->state->currentItem());
    }
    public function bidWinning($attributes) {
        return $this->viewRenderer->render('views/bid/winning', $this->state->currentItem());
    }

    // Items
    public function itemComment($attributes) {
//        item = "item-key"
//template = "views/item/comment"
    }
    public function itemResults($attributes) {
        return $this->viewRenderer->render('views/item/results', $this->state->currentItem());
    }
    public function itemSearchBar($attributes) {
        return $this->viewRenderer->render('views/item/search-bar');
    }

    // Tickets
    public function ticketBuy($attributes) {
        return $this->viewRenderer->render('views/ticket/buy', $this->state->currentAuction());
    }

    // Image
    public function imageGallery($attributes) {
        return $this->viewRenderer->render('views/image/photo-gallery', $this->state->currentItem());
    }

}