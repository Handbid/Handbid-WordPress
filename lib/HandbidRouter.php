<?php
/**
 * @copyright Copyright (c) 2014-2015 Handbid Inc.
 * @category handbid
 * @package Handbid2-WordPress
 * @license Proprietary
 * @link http://www.handbid.com/
 * @author Master of Code (worldclass@masterofcode.com)
 */

/**
 * Class HandbidRouter
 *
 * Handles Handbid routes
 *
 */
class HandbidRouter
{

    public $state;
    public $handbid;

    public function __construct(HandbidState $state, $handbid)
    {
        add_action('init', [$this, 'init']);
        $this->state = $state;
        $this->handbid = $handbid;
        add_action('wp', [$this, 'checkPageState']);
    }

    public function init()
    {
        $this->rewriteRules();
//        $this->checkPageState();

        add_action(
            'template_redirect',
            function() {
                if (strpos($_SERVER["REQUEST_URI"], "autologin") !== false) {

                    $this->handbid->store('Bidder')->setCookie($_REQUEST["id"]);

                    if(!empty($_REQUEST['rid'])){
                        wp_redirect("/user/invoices/?guid=" . $_REQUEST['rid']);
                    }
                    else
                    {

                        $auctionSlug = "";
                        try
                        {
                            $auction     = $this->handbid->store('Auction')->byGuid($_REQUEST["auid"]);
                            $auctionSlug = $auction->key;

                        } catch (Exception $e)
                        {
                        }

                        wp_redirect("/auctions/" . (!empty($auctionSlug) ? $auctionSlug . '/' : ''));

                    }
                    exit;
                }
                if (strpos($_SERVER["REQUEST_URI"], "sharedauction") !== false) {

                    $auctionSlug = "";
                    try
                    {
                        $auction = $this->handbid->store('Auction')->byGuid($_REQUEST["auid"]);
                        $auctionSlug = $auction->key;

                    } catch (Exception $e)
                    {

                    }
                    wp_redirect('/auctions/' . (!empty($auctionSlug) ? $auctionSlug . '/' : ''));

                    exit;
                }
                if (strpos($_SERVER["REQUEST_URI"], "shareditem") !== false) {

                    $auctionSlug = "";
                    $itemSlug    = "";
                    try
                    {
                        $item = $this->handbid->store('Item')->byID($_REQUEST["id"]);
                        if (!empty($item->auction))
                        {
                            $itemSlug    = $item->key;
                            $auctionSlug = $item->auction->key;
                        }
                    } catch (Exception $e)
                    {

                    }
                    wp_redirect('/auctions/' . (!empty($auctionSlug) ? $auctionSlug . '/' : '') . (!empty($itemSlug) ? 'item/' . $itemSlug . '/' : ''));

                    exit;
                }
            }
        );
    }

    function rewriteRules()
    {
        /*
         * This function will be called every page load but will not add overhead as add_rewrite_rules will not go into
         * effect until you flush the rewrite rules. These rules will be flushed on install of the Handbid plugin
         */
        add_rewrite_rule(
            'auctions/([^/]+)/?/item/([^/]+)/?',
            'index.php?pagename=auction-item&auction=$matches[1]&item=$matches[2]',
            'top'
        );
        add_rewrite_rule(
            'auction/([^/]+)/?/items/([^/]+)/?',
            'index.php?pagename=auction-item&auction=$matches[1]&item=$matches[2]',
            'top'
        );

        add_rewrite_rule('auctions/([^/]+)/?', 'index.php?pagename=auction&auction=$matches[1]', 'top');
        add_rewrite_rule('auction/([^/]+)/?', 'index.php?pagename=auction&auction=$matches[1]', 'top');

        add_rewrite_rule('organizations/([^/]+)/?', 'index.php?pagename=organization&organization=$matches[1]', 'top');
        add_rewrite_rule('organization/([^/]+)/?', 'index.php?pagename=organization&organization=$matches[1]', 'top');

        add_rewrite_rule('autologin/([^/]+)/?', 'index.php?action=autologin&organization=$matches[1]', 'top');

        add_rewrite_rule('user/invoices/?', 'index.php?pagename=invoices', 'top');
    }

    function throw404() {

	    if(!is_admin()) {
	        header("HTTP/1.0 404 Not Found - Archive Empty");
            require TEMPLATEPATH.'/404.php';

	        exit;
	    }
    }

    function checkPageState() {

        global $post;

        if(!$post) {
            return;
        }

        $auctionID = 0;

        if(!defined('HANDBID_PAGE_TYPE')){
            define('HANDBID_PAGE_TYPE', $post->post_name);
        }

        if($post->post_name == 'auction') {
            $currentAuction = $this->state->currentAuction();
            $auctionID = $currentAuction->id;
        }

        if($post->post_name == 'auction-item') {
	        $currentItem = $this->state->currentItem();
            $currentAuction = $this->state->currentAuction();
            $auctionID = $currentAuction->id;
        }

        if($post->post_name == 'auction' && !is_object($currentAuction)) {
            $this->throw404();
        }
        else if($post->post_name == 'organization' && !$this->state->currentOrg()) {
            $this->throw404();
        }
        else if($post->post_name == 'auction-item' && !$this->state->currentItem()) {
            $this->throw404();
        }

        $currentBidder = $this->state->currentBidder($auctionID);

    }

}