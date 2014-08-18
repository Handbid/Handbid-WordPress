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

    public function currentOrg()
    {

        if (!$this->org) {
            $orgKey    = get_query_var('organization');
            $this->org = $this->handbid->store('Organization')->byKey($orgKey);
        }

        return $this->org;
    }

    public function currentAuction($attributes = null)
    {

        if($this->auction && !isset($attributes['breadcrumb'])) {
            return $this->auction;
        }

        $auctionKey = (isset($attributes['auctionkey']) && $attributes['auctionkey']) ? $attributes['auctionkey'] : get_query_var(
            'auction'
        );
        if (!$auctionKey && !isset($attributes['breadcrumb'])) {
            $auctionKey = get_option('handbidDefaultAuctionKey');
        }

        if ($auctionKey) {
            $this->auction = $this->handbid->store('Auction')->byKey($auctionKey);
        }

        return $this->auction;
    }

    public function currentBidder()
    {
        return $this->handbid->store('Bidder')->myProfile();
    }

    public function currentItem()
    {
        if (!$this->item) {
            $itemKey    = get_query_var('item');
            if($itemKey) {
                $this->item = $this->handbid->store('Item')->byKey($itemKey);
            }
        }

        return $this->item;
    }

}