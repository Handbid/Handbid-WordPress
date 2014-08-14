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
        }

    }

    function handbid_logout_callback() {
        $this->handbid->logout();
        wp_redirect( '/');
    }

}