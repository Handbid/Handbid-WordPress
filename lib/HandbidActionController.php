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
        $this->handbid = $handbid;
        $this->state = $state;
    }

    function init()
    {
        add_feed('handbid-logout', [$this, 'handbid_logout_callback']);

        $titleForPost = function ($title, $post, $sep = null) {

            if ($post && $post->post_name == 'auction-item') {

                $item = $this->state->currentItem();
                if ($item) {
                    $post->post_title = $item->name;
                    if ($sep) {
                        $title = ' ' . $sep . ' ' . $post->post_title;
                    } else {
                        $title = $post->post_title;
                    }

                }

            } else if ($post && $post->post_name == 'auction') {

                $auction = $this->state->currentAuction();
                if ($auction) {
                    $post->post_title = $auction->name;
                    if ($sep) {
                        $title = $post->post_title . ' ' . $sep . ' ' . esc_attr(get_bloginfo('name'));
                    } else {
                        $title = $post->post_title;
                    }
                }

            } else if ($post && $post->post_name == 'organization') {

                $org = $this->state->currentOrg();
                if ($org) {
                    $post->post_title = $org->name;
                    if ($sep) {
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

                if (isset($post) && $post->ID != $id) {
                    return $pageTitle;
                }

                return $titleForPost($pageTitle, $post);


            }, 10, 2
        );

        add_action('wp_head', function () {

            global $post;

            if ($post && $post->post_name == 'auction-item') {

                $item = $this->state->currentItem();
                if ($item) {
                    echo '<meta property="og:image" content="' . get_option('handbidCdnEndpoint') . $item->imageUrl . '" />';
                    echo '<link rel=”image_src” href=”' . get_option('handbidCdnEndpoint') . $item->imageUrl . '” />';
                }
            }
        });
    }

    function _handle_form_action()
    {


        $redirect = isset($_POST['redirect']) ? $_POST['redirect'] : '/bidder';

        if (preg_match('/\?/', $redirect)) {
            $questionMarkOrAmpersand = '&';
            list($url, $query) = explode('?', $redirect);
            parse_str($query, $query);
            unset($query['handbid-error'], $query['handbid-notice']);
            $redirect = $url . '?' . http_build_query($query);

        } else {
            $questionMarkOrAmpersand = '?';
        }

        if($_POST['form-id'] == 'handbid-login') {

            $values = [
              'username' => $_POST['username'],
              'password' => $_POST['pin']
            ];

            $this->handbid->store('Bidder')->login($values);

        } else if($_POST['form-id'] == 'handbid-register') {

            $values = [
                'firstname' => $_POST['firstname'],
                'lastname'  => $_POST['lastname'],
                'mobile'    => $_POST['mobile']
            ];

            $profile = $this->handbid->store('Bidder')->register($values);

            if($profile->success == false) {
                $redirect .= $questionMarkOrAmpersand . 'handbid-notice=' . urlencode('Your phone number is already in use.');
            }

        }

        //send them on their way
        wp_redirect($redirect);
        exit;
    }

    function handbid_logout_callback()
    {
        $this->handbid->logout();

        $redirect = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '/';
        wp_redirect($redirect);
    }

}