<?php

class ReWriteRulesController {
    public function init() {
        add_filter('query_vars', [ $this, 'addQueryVars' ]);
        add_filter('rewrite_rules_array', [ $this, 'addRewriteRules' ]);
    }

    function addQueryVars($vars) {
        $vars[] = "auction";
        $vars[] = "item";
        return $vars;

    }

    function addRewriteRules($rules) {

//        $newRules = ['auction/([^/]+)/?$' => 'auction/detail/?auction=$matches[1]'];
        $newRules = ['auction/([^/]+)/?$' => 'auction/detail'];
        $rules = $newRules + $rules;
        return $rules;
    }

}