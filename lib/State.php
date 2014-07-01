<?php

class State
{

    public $basePath;
    public $handbid;
    public $org;
    public $auction;
    public $item;

    public function __construct($basePath, $handbid)
    {
        $this->basePath = $basePath;
        $this->handbid  = $handbid;
    }

    function currentOrg()
    {

        if (!$this->org) {
            $orgKey    = get_query_var('organization');
            $this->org = $this->handbid->store('Organization')->byKey($orgKey);
        }

        return $this->org;
    }

    function currentAuction($attributes = null)
    {

        $auctionKey = (isset($attributes['auctionkey']) && $attributes['auctionkey']) ? $attributes['auctionkey'] : get_query_var(
            'auction'
        );

        if (!$auctionKey) {
            $auctionKey = get_option('handbidDefaultAuctionKey');
        }

        $this->auction = $this->handbid->store('Auction')->byKey($auctionKey);

        return $this->auction;
    }

    function currentItem()
    {
        if (!$this->item) {
            $itemKey    = get_query_var('item');
            $this->item = $this->handbid->store('Item')->byKey($itemKey);
        }

        return $this->item;
    }

}