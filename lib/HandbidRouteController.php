<?php

class HandbidRouteController
{

    public $query_vars = [
        'organization' => 'organization',
        'auction'      => 'auction-detail',
        'item'         => 'item-detail'
    ];

    public function __construct($queryVars = null)
    {
        add_action('init', [$this, 'init']);
//        add_filter('page_rewrite_rules', [ $this, 'addRedirectRules' ] );

    }

    public function init()
    {

    }

    function addRedirectRules()
    {
        forEach ($this->query_vars as $k => $v) {
            add_rewrite_rule(
                $k . '/([^/]*)',
                $v . '/?' . $k . '=$matches[1]',
                'top'
            );
        }
    }
}