<?php

class HandbidActionController {

    public $viewRenderer;
    public $handbid;

    public function __construct(HandbidViewRenderer $viewRenderer, $handbid) {
        $this->viewRenderer = $viewRenderer;
        $this->handbid = $handbid;

    }

    function init()
    {
        add_feed( 'handbid-logout', [$this, 'handbid_logout_callback'] );
    }

    function handbid_logout_callback() {
        $this->handbid->logout();
        wp_redirect( '/');
    }

}