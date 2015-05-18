<?php
/**
 * @copyright Copyright (c) 2014-2015 Handbid Inc.
 * @category handbid
 * @package Handbid2-WordPress
 * @license Proprietary
 * @link http://www.handbid.com/
 * @author Master of Code (worldclass@masterofcode.com)
 */

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

        $ajaxActions = [
            "handbid_ajax_login",
            "handbid_ajax_registration",
            "handbid_ajax_createbid",
            "handbid_ajax_removebid",
        ];
        foreach($ajaxActions as $ajaxAction){
            add_action("wp_ajax_".$ajaxAction, [$this, $ajaxAction."_callback"]);
            add_action("wp_ajax_nopriv_".$ajaxAction, [$this, $ajaxAction."_callback"]);
        }
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
                'password' => $_POST['password'],
                'pin' => $_POST['password']
            ];

            $resp = $this->handbid->store('Bidder')->login($values);

            $result["success"] = (isset($resp->success) and $resp->success) ? $resp->success : 0;
            $result["resp"] = $resp;
            if($resp->data->token){
                setcookie('PHPSESSID', $resp->data->token, time()+3600*24, "/", $_SERVER["HTTP_HOST"], false);
            }
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
            $result["values"] = $values;
            $result["profile"] = $profile;

        }
        echo json_encode($result);
        exit;
    }

    function handbid_ajax_createbid_callback(){
        $nonce = $_POST["nonce"];
        $result = [
            "status" => "failed",
            "statusReason" => "no_response",
        ];

        if($this->handbid_verify_nonce($nonce, date("d.m.Y") . "bid")){

            $values = [
                'userId' => (int) $_POST['userId'],
                'auctionId'  => (int) $_POST['auctionId'],
                'itemId'    => (int) $_POST['itemId']
            ];
            if(isset($_POST["amount"])){
                $values["amount"] = (int) $_POST["amount"];
            }
            if(isset($_POST["maxAmount"])){
                $values["maxAmount"] = (int) $_POST["maxAmount"];
            }
            if(isset($_POST["quantity"])){
                $values["quantity"] = (int) $_POST["quantity"];
            }

            $resp    = $this->handbid->store( 'Bid' )->createBid( $values );
            if(isset($resp->status)){
                $result = $resp;
            }
        }
        echo json_encode($result);
        exit;
    }


    function handbid_ajax_removebid_callback(){
        $nonce = $_POST["nonce"];
        $result = [
            "status" => "failed",
            "statusReason" => "no_response",
        ];

        if($this->handbid_verify_nonce($nonce, date("d.m.Y") . "bid")){

            $bidID = (int) $_POST["bidID"];

            $resp    = $this->handbid->store( 'Bid' )->removeBid( $bidID );
//            if(isset($resp->status)){
                $result = $resp;
//            }
        }
        echo json_encode($result);
        exit;
    }

}
