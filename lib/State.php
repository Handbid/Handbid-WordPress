<?php

class State {

    public $basePath;
    public $handbid;
    public $org;
    public $auction;
    public $item;

    public function __construct( $basePath, $handbid ) {
        $this->basePath = $basePath;
        $this->handbid  = $handbid;
    }

    function currentOrg() {

        if(!$this->org) {
            $orgId = get_query_var('organization');
            $this->org = $this->handbid->store('Organization')->byId($orgId);
        }

        return $this->org;
    }

    function currentAuction() {
        if(!$this->auction) {
            $auctionId = get_query_var('auction');
            $this->auction = $this->handbid->store('Auction')->byId($auctionId);
        }

        return $this->auction;
    }

    function currentItem() {
        if(!$this->item) {
            $itemId = get_query_var('item');
            $this->item = $this->handbid->store('Item')->byId($itemId);
        }

        return $this->item;
    }

}