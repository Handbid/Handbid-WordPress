<?php

class ShortCodeController {

    public $viewRenderer;
    public $basePath;
    public $state;

    public function __construct( HandbidViewRenderer $viewRenderer, $basePath, $state, $config = []) {
        $this->viewRenderer = $viewRenderer;
        $this->basePath = $basePath;
        $this->state = $state;

        // loop through our objects and save them as parameters
        forEach($config as $k => $v) {
            $this->$k = $v;
        }
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

        return $this->viewRenderer->render('views/auction/banner.phtml', $this->state->currentAuction());

    }
    public function handbid_auction_details($attributes) {

        return $this->viewRenderer->render('views/auction/details.phtml', $this->state->currentAuction());

    }
    public function handbid_auction_contact_form($attributes) {

        return $this->viewRenderer->render('views/auction/contact-form.phtml', $this->state->currentAuction());

    }
    public function handbid_auction_list($attributes) {

        // Temp dummy data
        $categories = file_get_contents($this->basePath . '/dummy-data/dummy-categories.json');
        $items = file_get_contents($this->basePath . '/dummy-data/dummy-items.json');

        $json[] = json_decode($categories,true);
        $json[] = json_decode($items,true);

        return $this->viewRenderer->render('views/auction/list.phtml', $json);

    }

    // Bids
    public function handbid_bid_now($attributes) {
        return $this->viewRenderer->render('views/bid/now.phtml', $this->state->currentItem());
    }
    public function handbid_bid_history($attributes) {
        return $this->viewRenderer->render('views/bid/history.phtml', $this->state->currentItem());
    }
    public function handbid_bid_winning($attributes) {
        return $this->viewRenderer->render('views/bid/winning.phtml', $$this->state->currentItem());
    }

    // Items
    public function handbid_item_comment($attributes) {
//        item = "item-key"
//template = "views/item/comment.phtml"
    }
    public function handbid_item_results($attributes) {
        return $this->viewRenderer->render('views/item/results.phtml', $this->state->currentItem());
    }
    public function handbid_item_search_bar($attributes) {
//        template = "item/search-bar.phtml"
    }

    // Tickets
    public function handbid_ticket_buy($attributes) {
//        template = "views/ticket/buy.phtml"
    }

    // Image
    public function handbid_image_gallery($attributes) {
        return $this->viewRenderer->render('views/auction/banner.phtml', $this->state->currentAuction());
    }

}