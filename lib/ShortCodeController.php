<?php

class ShortCodeController {

    public $viewRenderer;
    public $basePath;

    public function __construct( HandbidViewRenderer $viewRenderer, $basePath) {
        $this->viewRenderer = $viewRenderer;
        $this->basePath = $basePath;
    }

    // Auctions
    public function handbid_auction_results ($attributes) {

        if(!$attributes['template']) {
            $attributes['template'] = 'views/auction/logo.phtml';
        }

        // Temp dummy data
        $auctions = file_get_contents($this->basePath . '/dummy-data/dummy-auctions.json');
        $json = json_decode($auctions,true);

        foreach($json as $auction) {

            $markup = $this->viewRenderer->render($attributes['template'], $auction);

        }

        return $markup;

    }
    public function handbid_auction_banner($attributes) {

        // Temp dummy data
        $auction = file_get_contents($this->basePath . '/dummy-data/dummy-auction.json');
        $json = json_decode($auction,true);

        return $this->viewRenderer->render('views/auction/map.phtml', $auction);

    }
    public function handbid_auction_details($attributes) {

        // Temp dummy data
        $auction = file_get_contents($this->basePath . '/dummy-data/dummy-auction.json');
        $json = json_decode($auction,true);

        return $this->viewRenderer->render('views/auction/details.phtml', $auction);

    }
    public function handbid_auction_contact_form($attributes) {

        // Temp dummy data
        $auction = file_get_contents($this->basePath . '/dummy-data/dummy-auction.json');
        $json = json_decode($auction,true);

        return $this->viewRenderer->render('views/auction/contact-form.phtml', $auction);

    }
    public function handbid_auction_list($attributes) {

        // Temp dummy data
        $auction = file_get_contents($this->basePath . '/dummy-data/dummy-auction.json');
        $json = json_decode($auction,true);

        return $this->viewRenderer->render('views/auction/auction-list.phtml', $auction);

    }

    // Bids
    public function handbid_bid_history($attributes) {
//        item = "item-key"
//resultsPerPage = 5
//template = "views/bid/results.phtml"
    }
    public function handbid_bid_now($attributes) {
//        item = "item-key"
//template = "views/bid/now.phtml"
    }

    // Items
    public function handbid_item_comment($attributes) {
//        item = "item-key"
//template = "views/item/comment.phtml"
    }
    public function handbid_item_results($attributes) {
//        auction = "auction-key"
//template = "views/item/results.phtml"
    }
    public function handbid_item_search_bar($attributes) {
//        template = "item/search-bar.phtml"
    }

    // Tickets
    public function handbid_ticket_buy($attributes) {
//        template = "views/ticket/buy.phtml"
    }

}