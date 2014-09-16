<?php

/**
 * Class HandbidState
 *
 * Determines the current state of Handbid. Which Organization, Auction and / or Item is one currently being
 * looked at
 *
 */
class HandbidState
{

    public $basePath;
    public $handbid;
    public $org;
    public $auction;
    public $item;

    public function __construct($basePath, $handbid)
    {
        $this->basePath        = $basePath;
        $this->handbid         = $handbid;
    }

    public function currentOrg()
    {

        try {
            if (!$this->org) {
                $orgKey = (isset($attributes['organization']) && $attributes['organization']) ? $attributes['organization'] : get_query_var(
                    'organization'
                );

                if (!$orgKey) {
                    $orgKey = get_option('handbidDefaultOrganizationKey');
                }

                $this->org = $this->handbid->store('Organization')->byKey($orgKey);
            }

            return $this->org;
        } catch (Exception $e) {

            return null;
        }
    }

    public function currentAuction($attributes = null)
    {

        try {

            if ($this->auction && !$attributes) {
                return $this->auction;
            }

            $auctionKey = (isset($attributes['key']) && $attributes['key']) ? $attributes['key'] : get_query_var(
                'auction'
            );
            if (!$auctionKey) {
                $auctionKey = get_option('handbidDefaultAuctionKey');
            }

            if ($auctionKey) {

                $query = ['options' => []];

                if(isset($attributes['thumb_width'])) {
                    $query['options']['images'] = ['w' => $attributes['thumb_width']];
                }

                if(isset($attributes['thumb_height'])) {
                    $query['options']['images'] = ['h' => $attributes['thumb_height']];
                }

                $this->auction = $this->handbid->store('Auction')->byKey($auctionKey, $query);
            }

            return $this->auction;

        } catch (Exception $e) {

            return null;
        }
    }

    public function currentBidder()
    {
        try {
            return $this->handbid->store('Bidder')->myProfile();
        } catch (Exception $e) {

            return null;
        }

    }

    public function currentItem($attributes = null)
    {
        try {

            if (!$this->item && !$attributes) {

                $itemKey = (isset($attributes['key']) && $attributes['key']) ? $attributes['key'] : get_query_var(
                    'item'
                );

                if ($itemKey) {

                    $query = ['options' => []];

                    if(isset($attributes['thumb_width'])) {
                        $query['options']['images'] = ['w' => $attributes['thumb_width']];
                    }

                    if(isset($attributes['thumb_height'])) {
                        $query['options']['images'] = ['h' => $attributes['thumb_height']];
                    }

                    $this->item = $this->handbid->store('Item')->byKey($itemKey, $query);
                }
            }

            return $this->item;

        } catch (Exception $e) {

            return null;
        }

    }

}