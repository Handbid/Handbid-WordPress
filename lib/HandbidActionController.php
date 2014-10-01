<?php

/**
 *
 * Class HandbidActionController
 *
 * Handles all of the front end facing actions
 *
 */
class HandbidActionController
{

    public $viewRenderer;
    public $handbid;
    public $state;

    public function __construct(HandbidViewRenderer $viewRenderer, $handbid, $state)
    {
        $this->viewRenderer = $viewRenderer;
        $this->handbid      = $handbid;
        $this->state        = $state;
    }

    function init()
    {
        add_feed('handbid-logout', [$this, 'handbid_logout_callback']);

        $titleForPost = function ($title, $post, $sep = null) {

            if ($post && $post->post_name == 'auction-item') {

                $item = $this->state->currentItem();
                if($item) {
                    $post->post_title = $item->name;
                    if($sep) {
                        $title = ' ' . $sep . ' ' . $post->post_title;
                    } else {
                        $title = $post->post_title;
                    }

                }

            } else if($post && $post->post_name == 'auction') {

                $auction = $this->state->currentAuction();
                if($auction) {
                    $post->post_title = $auction->name;
                    if($sep) {
                        $title = $post->post_title . ' ' . $sep . ' ' . esc_attr(get_bloginfo('name'));
                    } else {
                        $title = $post->post_title;
                    }
                }

            }else if($post && $post->post_name == 'organization') {

                $org = $this->state->currentOrg();
                if($org) {
                    $post->post_title = $org->name;
                    if($sep) {
                        $title = $post->post_title . ' ' . $sep . ' ' . esc_attr(get_bloginfo('name'));
                    } else {
                        $title = $post->post_title;
                    }
                }

            }

            return $title;
        };

        add_filter('wp_title', function ($title, $sep, $seplocation) use ($titleForPost) {

                global $post;

                return $titleForPost($title, $post, $sep);

                return $title;

        }, 10, 3);

        //modify currently loaded post to match auction or item name
        add_filter(
            'the_title',
            function ($pageTitle, $id) use ($titleForPost) {

                global $post;

                if(isset($post) && $post->ID != $id) {
                    return $pageTitle;
                }

                return $titleForPost($pageTitle, $post);



            }, 10, 2
        );

        add_action('wp_head', function() {

                global $post;

                if ($post && $post->post_name == 'auction-item') {

                    $item = $this->state->currentItem();
                    if($item) {
                        echo '<meta property="og:image" content="' . $item->images[0] . '" />';
                        echo '<link rel=”image_src” href=”' . $item->images[0] . '” />';
                    }
                }
        });
    }

    function _handle_form_action()
    {


        $redirect = isset($_POST['redirect']) ? $_POST['redirect'] :  '/bidder';

        if (preg_match('/\?/', $redirect)) {
            $questionMarkOrAmpersand = '&';
        }
        else {
            $questionMarkOrAmpersand = '?';
        }

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

            $redirect .= $questionMarkOrAmpersand . 'handbid-notice=' . urlencode('Your profile has been updated.');
            $this->handbid->store('Bidder')->updateProfile($values);
        } else {
            if ($_POST['form-id'] == "handbid-add-creditcard") {

                $values = [
                    'nameOnCard' => $_POST['nameOnCard'],
                    'cardNum'    => $_POST['cardNum'],
                    'cvc'        => $_POST['cvc'],
                    'expMonth'   => $_POST['expMonth'],
                    'expYear'    => $_POST['expYear'],
                ];
                // handbid-add-creditcard
                //handbid-edit-creditcard-x

                $bidder = $this->handbid->store('Bidder')->myProfile();

                try {
                    $this->handbid->store('CreditCard')->add($bidder->_id, $values);
                    $redirect .= $questionMarkOrAmpersand . 'handbid-notice=' . urlencode('Your card has been added. Thank you.');
                } catch (\Exception $e) {
                    $redirect .= $questionMarkOrAmpersand . 'handbid-error=' . urlencode($e->getMessage());
                }
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