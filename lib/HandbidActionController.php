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
        $this->rewriteRules();
    }

    function rewriteRules() {
        /*
         * This function will be called everytime but will not add overhead as add_rewrite_rules will not go into
         * effect until you flush the rewrite rules. These rules will be flushed on install of the Handbid plugin
         */
        add_rewrite_rule('auctions/([^/]+)/?/item/([^/]+)/?', 'index.php?pagename=auction-item&auction=$matches[1]&item=$matches[2]', 'top' );
        add_rewrite_rule('auctions/([^/]+)/?', 'index.php?pagename=auction&auction=$matches[1]', 'top' );

    }

    function _handle_form_action() {

        if($_POST['form-id'] == "handbid-update-bidder") {
            $values = [
                'firstName'  => $_POST['firstName'],
                'lastName'   => $_POST['lastName'],
                'email'      => $_POST['email'],
//                'cellPhone'  => $_POST['cellPhone'],

            ];

            if(isset($_FILES['photo'])) {
                $values['photo'] = $_FILES['photo'];
            }

            if(isset($_POST['password']) && isset($_POST['password2'])) {
                $values['password']  = $_POST['password'];
                $values['password2'] = $_POST['password2'];
            }

            $this->handbid->store('Bidder')->updateProfile($values);
            wp_redirect( '/bidder');
        }

    }

    function handbid_logout_callback() {
        $this->handbid->logout();
        wp_redirect( '/');
    }

}