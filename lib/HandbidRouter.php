<?php

/**
 * Class HandbidRouter
 *
 * Handles Handbid routes
 *
 */
class HandbidRouter
{

    public $state;

    public function __construct(HandbidState $state)
    {
        add_action('init', [$this, 'init']);
        $this->state = $state;
        add_action('wp', [$this, 'checkPageState']);
    }

    public function init()
    {
        $this->rewriteRules();
//        $this->checkPageState();
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
        add_rewrite_rule('auctions/([^/]+)/?', 'index.php?pagename=auction&auction=$matches[1]', 'top');

        add_rewrite_rule('organizations/([^/]+)/?', 'index.php?pagename=organization&organization=$matches[1]', 'top');

    }

    function throw404() {

//        ob_clean();
        header("HTTP/1.0 404 Not Found - Archive Empty");
        require TEMPLATEPATH.'/404.php';

        exit;
    }

    function checkPageState() {

        global $post;

        if(($post->post_name == 'auction' || $post->post_name == 'auctions') && !$this->state->currentAuction()) {
            $this->throw404();
        }
        else if(($post->post_name == 'organization' || $post->post_name == 'organizations') && !$this->state->currentOrg()) {
            $this->throw404();
        }
        else if($post->post_name == 'auction-item' && !$this->state->currentItem()) {
            $this->throw404();
        }
        else if($post->post_name == 'bidder' && !$this->state->currentBidder()) {
            $this->throw404();
        }

    }

}