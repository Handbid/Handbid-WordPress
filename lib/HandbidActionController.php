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

        add_action("handbid_create_nonce", [$this, "handbid_create_nonce"]);
        add_action("handbid_verify_nonce", [$this, "handbid_verify_nonce"], 10, 2);
        add_action("wp_ajax_handbid_ajax_login", [$this, "handbid_ajax_login_callback"]);
        add_action("wp_ajax_nopriv_handbid_ajax_login", [$this, "handbid_ajax_login_callback"]);
        add_action("wp_ajax_handbid_ajax_registration", [$this, "handbid_ajax_registration_callback"]);
        add_action("wp_ajax_nopriv_handbid_ajax_registration", [$this, "handbid_ajax_registration_callback"]);
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

    function handbid_create_nonce($action = -1){
        return wp_create_nonce($_SERVER["SERVER_SIGNATURE"]." ". $action);
    }

    function handbid_verify_nonce($nonce, $action = -1){
        return wp_verify_nonce($nonce, $_SERVER["SERVER_SIGNATURE"]." ". $action);
    }

    function handbid_ajax_login_callback(){
        $nonce = $_POST["nonce"];
        $result = [
            "success" => 0,
            "error" => "no",
        ];
        if($this->handbid_verify_nonce($nonce, date("d.m.Y") . "login")){

            $values = [
                'username' => $_POST['username'],
                'password' => $_POST['password']
            ];

            $resp = $this->handbid->store('Bidder')->login($values);

            $result["success"] = (isset($resp->success) and $resp->success) ? $resp->success : 0;

        }
        echo json_encode($result);
        exit;
    }

    function handbid_ajax_registration_callback(){
        $nonce = $_POST["nonce"];
        $result = [
            "success" => 0,
            "error" => "no",
        ];

        if($this->handbid_verify_nonce($nonce, date("d.m.Y") . "register")){

            $values = [
                'firstname' => $_POST['firstname'],
                'lastname'  => $_POST['lastname'],
                'mobile'    => $_POST['mobile'],
                'password'  => $_POST['password'],
                'email'     => $_POST['email'],
                'deviceType'=> $_POST['deviceType'],
                'countryCode' => $_POST['countryCode'],
            ];

            $profile = $this->handbid->store('Bidder')->register($values);

            $result["success"] = (isset($profile->success) and $profile->success) ? $profile->success : 0;

        }
//        echo "<pre>".print_r($profile,true)."</pre>";
        echo json_encode($result);
        exit;
    }

}