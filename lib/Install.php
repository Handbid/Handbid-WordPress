<?php

class Install {

    function install() {
        $this->createPages();
        $this->addRoles();
    }

    public function createPages()
    {

        // Insert the post into the database
        $pages = [
            'auctionItem'        => [
                'post_title'   => 'Auction Item',
                'post_name'    => 'item',
                'post_content' => 'Auction Item',
                'post_status'  => 'publish'
            ],
            'auctionDetail'      => [
                'post_title'   => 'Auction',
                'post_name'    => 'auction',
                'post_content' => 'Auction',
                'post_status'  => 'publish'
            ]
        ];

        // For Organization page
//        'organizationDetail' => [
//            'post_title'   => 'Organization Detail',
//            'post_name'    => 'organization',
//            'post_content' => 'Organization Detail.',
//            'post_status'  => 'publish'
//        ]

        foreach ($pages as $page) {
            wp_insert_post($page);
        }
    }

    function addRoles() {

        add_role(
            'handbid_bidder',
            __('Bidder'),
            [
                'read'           => true, // true allows this capability
                'edit_posts'     => false,
                'delete_posts'   => false, // Use false to explicitly deny
                'show_admin_bar' => false,
                'level_0'        => true
            ]
        );
    }
}