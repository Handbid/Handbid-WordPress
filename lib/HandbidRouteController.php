<?php

/**
 * Class HandbidRouteController
 *
 * Handles Handbid routes
 *
 */
class HandbidRouteController
{

    public function __construct()
    {
        add_action('init', [$this, 'init']);
    }

    public function init()
    {
        $this->rewriteRules();
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

    }
}