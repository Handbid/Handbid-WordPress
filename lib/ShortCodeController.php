<?php

class ShortCodeController {

    public $viewRenderer;
    public $basePath;
    public $auction;

    public function __construct( HandbidViewRenderer $viewRenderer, $basePath) {
        $this->viewRenderer = $viewRenderer;
        $this->basePath = $basePath;
        $this->auction = $this->check_url_for_auction();
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

        return $this->viewRenderer->render('views/auction/banner.phtml', $this->auction);

    }
    public function handbid_auction_details($attributes) {

        return $this->viewRenderer->render('views/auction/details.phtml', $this->auction);

    }
    public function handbid_auction_contact_form($attributes) {

        return $this->viewRenderer->render('views/auction/contact-form.phtml', $this->auction);

    }
    public function handbid_auction_list($attributes) {

        // Temp dummy data
        $categories = file_get_contents($this->basePath . '/dummy-data/dummy-categories.json');
        $items = file_get_contents($this->basePath . '/dummy-data/dummy-items.json');

        $json[] = json_decode($categories,true);
        $json[] = json_decode($items,true);

        return $this->viewRenderer->render('views/auction/auction-list.phtml', $json);

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

    // Add query support
    function check_url_for_auction() {

        $auction = null;

        if($_GET['auction']) {
            if($this->auction) {
                $_GET['auction'] = $this->auction;
            }
            else
            {
                $auction = file_get_contents($this->basePath . '/dummy-data/dummy-auction.json');
                $auction = json_decode($auction,true);
                $this->auction = $auction;
            }
        }

        return $auction;
    }

}