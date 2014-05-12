<?php

class HandbidRouteController {

    public $query_vars = [
        'organization',
        'auction-detail',
        'item-detail'
    ];

    public function __construct($queryVars = null) {
        add_action( 'init', [ $this, 'init' ]);

    }

    public function init() {
        $this->addRedirectRules();
    }

    function addRedirectRules()
    {
        forEach($this->query_vars as $var) {
            add_rewrite_rule(
                '(' . $var . ')/([^/]*)$',
                $var . '/$matches[1]',
                'top'
            );
        }
        flush_rewrite_rules();

    }

}