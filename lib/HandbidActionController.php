<?php

class HandbidActionController
{

    public $viewRenderer;
    public $handbid;

    public function __construct(HandbidViewRenderer $viewRenderer, $handbid)
    {
        $this->viewRenderer = $viewRenderer;
        $this->handbid      = $handbid;

    }

    function init()
    {
        add_feed('handbid-logout', [$this, 'handbid_logout_callback']);
        $this->rewriteRules();
    }

    function rewriteRules()
    {
        /*
         * This function will be called everytime but will not add overhead as add_rewrite_rules will not go into
         * effect until you flush the rewrite rules. These rules will be flushed on install of the Handbid plugin
         */
        add_rewrite_rule(
            'auctions/([^/]+)/?/item/([^/]+)/?',
            'index.php?pagename=auction-item&auction=$matches[1]&item=$matches[2]',
            'top'
        );
        add_rewrite_rule('auctions/([^/]+)/?', 'index.php?pagename=auction&auction=$matches[1]', 'top');

    }

    function _handle_form_action()
    {

        $redirect = '/bidder';

        if ($_POST['form-id'] == "handbid-update-bidder") {
            $values = [
                'firstName' => $_POST['firstName'],
                'lastName'  => $_POST['lastName'],
                'email'     => $_POST['email']
            ];

            if (isset($_FILES['photo'])) {
                $values['photo'] = $_FILES['photo'];
            }

            if (isset($_POST['password']) && isset($_POST['password2'])) {
                $values['password']  = $_POST['password'];
                $values['password2'] = $_POST['password2'];
            }

            $redirect .= '?handbid-notice=' . urlencode('Your profile has been updated.');
            $this->handbid->store('Bidder')->updateProfile($values);
        }

        else if ($_POST['form-id'] == "handbid-add-creditcard") {

            $values = [
                'nameOnCard'     => $_POST['nameOnCard'],
                'cardNum'  => $_POST['cardNum'],
                'cvc'      => $_POST['cvc'],
                'expMonth' => $_POST['expMonth'],
                'expYear'  => $_POST['expYear'],
            ];
            // handbid-add-creditcard
            //handbid-edit-creditcard-x

            $bidder = $this->handbid->store('Bidder')->myProfile();

            try {
                $this->handbid->store('CreditCard')->add($bidder->_id, $values);
                $redirect .= '?handbid-notice=' . urlencode('Your card has been added. Thank you.');
            } catch(\Exception $e) {
                $redirect .= '?handbid-error=' . urlencode($e->getMessage());
            }
        }

        //send them on their way
        wp_redirect($redirect);
        exit;
    }

    function handbid_logout_callback()
    {
        $this->handbid->logout();
        wp_redirect('/');
    }

}