<?php
class ShortcodeController {

    public $viewRenderer;
    public $basePath;

    public function __construct( HandbidViewRenderer $viewRenderer, $basePath) {
        $this->viewRenderer = $viewRenderer;
        $this->basePath = $basePath;
    }

    public function handbid_auction_results ($attributes) {

        $markup = '';

        if(!$attributes['template']) {
            $attributes['template'] = 'views/auction/logo.phtml';
        }

        // Temp dummy data
        $auctions = file_get_contents($this->basePath . '/dummy_auctions.json');
        $json = json_decode($auctions,true);

        foreach($json as $auction) {

            $markup = $this->viewRenderer->render($attributes['template'], $auction);

        }

        return $markup;

    }
    public function handbid_bid_history ($attributes) {
//        item = "item-key"
//resultsPerPage = 5
//template = "views/bid/results.phtml"
    }
    public function handbid_bid_now ($attributes) {
//        item = "item-key"
//template = "views/bid/now.phtml"
    }
    public function handbid_item_comment ($attributes) {
//        item = "item-key"
//template = "views/item/comment.phtml"
    }
    public function handbid_item_results ($attributes) {
//        auction = "auction-key"
//template = "views/item/results.phtml"
    }
    public function handbid_item_search_bar ($attributes) {
//        template = "item/search-bar.phtml"
    }
    public function handbid_ticket_buy ($attributes) {
//        template = "views/ticket/buy.phtml"
    }
}