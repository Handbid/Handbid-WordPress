<?php

/**
 *
 * Class HandbidInstall
 *
 * Initial install of the plugin, this will set up all of the respective elements that need to be
 * created to have a working base install of Handbid
 *
 */
class HandbidInstall
{

    function __construct()
    {
        $this->createPages();
    }

    // This will create pages that you can then customize to fit your auctions' needs
    public function createPages()
    {

        // Setup the content for each page
        $auctionContent  = "[handbid_auction_banner]\n" .
                           "[handbid_auction_details]\n" .
                           "[handbid_auction_item_list]";

        $auctionsContent = "[handbid_organization_auctions template=\"views/auction/list\" type=\"upcoming\"]";

        $auctionItem     = "[handbid_auction_banner]\n" .
                           "[handbid_item template=\"views/image/photo-gallery\"]\n" .
                           "[handbid_bid template=\"views/item/bid\"]\n" .
                           "[handbid_bid template=\"views/item/bid-history\"]\n" .
                           "[handbid_facebook_comments]";

        $bidder          = "[handbid_is_logged_in]\n" .
                           "\t[handbid_bidder_profile]\n" .
                           "\t[handbid_bidder_credit_cards]\n" .
                           "\t[handbid_bidder_bids]\n" .
                           "\t[handbid_bidder_proxy_bids]\n" .
                           "\t[handbid_bidder_purchases]\n" .
                           "[/handbid_is_logged_in]\n\n" .
                           "[handbid_is_logged_out]\n" .
                           "\tYou must be logged in to view your profile.\n" .
                           "[/handbid_is_logged_out]";

        $organizations   = "[handbid_organization_list]";

        $organization    = "[handbid_organization_auctions]";

        // Insert the post into the database
        $pages = [
            // Used for individual auction
            'auction'     => [
                'post_type'    => 'page',
                'post_title'   => 'Auction',
                'post_name'    => 'auction',
                'post_status'  => 'publish',
                'post_content' => $auctionContent
            ],
            // Used for auction list
            'auctions'    => [
                'post_type'    => 'page',
                'post_title'   => 'Auctions',
                'post_name'    => 'auctions',
                'post_status'  => 'publish',
                'post_content' => $auctionsContent
            ],
            // Used for viewing an auction item
            'auctionItem' => [
                'post_type'    => 'page',
                'post_title'   => 'Auction Item',
                'post_name'    => 'auction-item',
                'post_status'  => 'publish',
                'post_content' => $auctionItem
            ],
            'bidder'      => [
                'post_type'    => 'page',
                'post_title'   => 'Bidder Dashboard',
                'post_name'    => 'bidder',
                'post_status'  => 'publish',
                'post_content' => $bidder
            ],
            'organizations'      => [
                'post_type'    => 'page',
                'post_title'   => 'Organizations',
                'post_name'    => 'organizations',
                'post_status'  => 'publish',
                'post_content' => $organizations
            ],
            'organization'      => [
                'post_type'    => 'page',
                'post_title'   => 'Organization',
                'post_name'    => 'organization',
                'post_status'  => 'publish',
                'post_content' => $organization
            ]
        ];

        foreach ($pages as $page) {
            if(get_page_by_path($page['post_name']) == NULL) {
                wp_insert_post($page);
            }
        }
    }
}