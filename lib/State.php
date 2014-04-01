<?php

class State {

    public $auction;
    public $item;

    function currentAuction() {
        if(!$this->auction) {
            $auction = file_get_contents($this->basePath . '/dummy-data/dummy-auction.json');
                $auction = json_decode($auction,true);
                $this->auction = $auction;
        }

        return $this->auction;
    }

    function currentItem() {
        if(!$this->item) {
            $item = file_get_contents($this->basePath . '/dummy-data/dummy-item.json');
            $item = json_decode($item,true);
            $this->item = $item;
        }

        return $this->item;
    }

}