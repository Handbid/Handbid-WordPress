<?php

class Install
{

    function install()
    {
        $this->createPages();
    }

    /*
     * This will create pages that you can then customize to fit your auctions' needs
     */
    public function createPages()
    {

        // Insert the post into the database
        $pages = [
            // Used for individual auction
            'auction'     => [
                'post_type'    => 'page',
                'post_title'   => 'Auction',
                'post_name'    => 'auction',
                'post_content' => 'Auction',
                'post_status'  => 'publish'
            ],
            // Used for auction list
            'auctions'    => [
                'post_type'    => 'page',
                'post_title'   => 'Auctions',
                'post_name'    => 'auctions',
                'post_content' => 'Auctions',
                'post_status'  => 'publish'
            ],
            // Used for viewing an auction item
            'auctionItem' => [
                'post_type'    => 'page',
                'post_title'   => 'Auction Item',
                'post_name'    => 'item',
                'post_content' => 'Auction Item',
                'post_status'  => 'publish'
            ],
        ];


        foreach ($pages as $page) {
            wp_insert_post($page);
        }
    }
}