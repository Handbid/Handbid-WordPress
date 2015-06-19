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
            "handbid_ajax_reset_password",
            "handbid_ajax_get_paddle_number",
            "handbid_ajax_createbid",
            "handbid_ajax_buy_tickets",
            "handbid_ajax_make_receipt_payment",
            "handbid_ajax_removebid",
            "handbid_ajax_add_credit_card",
            "handbid_ajax_get_invoices",
            "handbid_ajax_get_messages",
            "handbid_ajax_send_message",
            "handbid_ajax_remove_credit_card",
            "handbid_ajax_get_countries_provinces",
            "handbid_load_auto_complete_auctions",
            "handbid_load_shortcode_auctions",
        ];
        foreach($ajaxActions as $ajaxAction){
            add_action("wp_ajax_".$ajaxAction, [$this, $ajaxAction."_callback"]);
            add_action("wp_ajax_nopriv_".$ajaxAction, [$this, $ajaxAction."_callback"]);
        }

        $postActions = [
            "handbid_post_update_bidder"
        ];
        foreach($postActions as $postAction){
            add_action("admin_post_".$postAction, [$this, $postAction."_callback"]);
            add_action("admin_post_nopriv_".$postAction, [$this, $postAction."_callback"]);
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

    // ---------------- AJAX CALLBACKS ------------------

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
                'auctionGuid' => $_POST['auctionGuid'],
            ];

            $profile = $this->handbid->store('Bidder')->register($values);

            $result["success"] = (isset($profile->success) and $profile->success) ? $profile->success : 0;
            $result["values"] = $values;
            $result["profile"] = $profile;
            if(! $result["success"]){
                $result["error"] = str_replace("/auth/","",$profile->data->status);
                $result["error"] = trim(strpos($result["error"], "use login") === false)?$result["error"]:$result["error"].'<a class="btn btn-info signup login-popup-link" data-target-tab="login-form">Sign In</a>';
                $result["error"] = trim($result["error"])?$result["error"]:"Something went wrong. Please, try again later. ";
            }

        }
        echo json_encode($result);
        exit;
    }


    function handbid_ajax_reset_password_callback(){
        $nonce = $_POST["nonce"];
        $emailOrPhone = $_POST["emailOrPhone"];
        $result = [];

        if($this->handbid_verify_nonce($nonce, date("d.m.Y") . "reset_pass")){

            $profile = $this->handbid->store('Bidder')->resetPass($emailOrPhone);

            $result = $profile;

        }
        echo json_encode($result);
        exit;
    }


    function handbid_ajax_get_paddle_number_callback(){
        $result = [];

        $nonce = $_POST["nonce"];
        $auctionID = $_POST["auctionID"];

//        if($this->handbid_verify_nonce($nonce, date("d.m.Y") . "add_paddle")){

            $result = $this->handbid->store('Bidder')->addActiveAuction($auctionID);

//        }
//        else{
//            $result = $nonce;
//        }
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

            try {
                $resp = $this->handbid->store('Bid')->createBid($values);
                $result = $resp;
                if(isset($result->data->error)){
                    $result->status = "failed";
                    $reasons = [];
                    foreach((array) $result->data->error as $error){
                        $reasons[] = implode("<br>", $error);
                    }
                    $result->statusReason = implode("<br>", $reasons);
                }
            }
            catch(Exception $e){

            }
        }
        echo json_encode($result);
        exit;
    }

    function handbid_ajax_buy_tickets_callback(){
        $nonce = $_POST["nonce"];
        $result = [
            "success" => [],
            "fail" => [],
            "successID" => [],
            "failID" => [],
        ];

        if($this->handbid_verify_nonce($nonce, date("d.m.Y") . "buy_tickets_array")){
            $items = $_POST["items"];
            if(count($items)){
                foreach($items as $item){
                    $values = [
                        'userId' => (int) $_POST['userId'],
                        'auctionId'  => (int) $_POST['auctionId'],
                        'itemId'    => (int) $item['id'],
                        'amount'    => (int) $item['price'],
                        'quantity'    => (int) $item['quantity']
                    ];
                    try{
                        $resp = $this->handbid->store( 'Bid' )->createBid( $values );
                        $arr = ((isset($resp->status) and $resp->status == "purchase" and !isset($resp->success) ) or $resp->success) ? "success" : "fail" ;
                        $itemId = $values["itemId"];
                        $result[$arr][$itemId] = $resp;
                        $result[$arr."ID"][] = $itemId;
                    }
                    catch(Exception $e){
                        $itemId = $values["itemId"];
                        $result["fail"][$itemId] = $e;
                        $result["failID"][] = $itemId;
                    }
                }
            }
        }
        echo json_encode($result);
        exit;
    }

    function handbid_ajax_make_receipt_payment_callback(){
        $nonce = $_POST["nonce"];
        $response = [];
        $values = [
            "cardId" => (int) $_POST["cardId"],
            "receiptId" => (int) $_POST["receiptId"],
            "auctionId" => (int) $_POST["auctionId"],
        ];
        if($this->handbid_verify_nonce($nonce, date("d.m.Y") . "make_receipt_payment")){
            $profile = $this->state->currentBidder( );
            if(count($profile->creditCards)){
                foreach($profile->creditCards as $card){
                    if($card->id == $values["cardId"]){
                        $values["stripeId"] = $card->stripeId;
                        $values["creditCardHandle"] = $card->creditCardHandle;
                    }
                }
            }
            try {
                $resp = $this->handbid->store('Receipt')->makePayment($values);
                $response["result"] = $resp;
            }
            catch(Exception $e) {
                $response["error"] = $e;
            }
        }
        echo json_encode($response);
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



    function handbid_ajax_add_credit_card_callback(){

        $postData = urldecode($_POST["data"]);
        parse_str($postData, $opts);
        $nonce = $opts["nonce"];
        $result = [
            "opts" => $opts,
        ];

        if($this->handbid_verify_nonce($nonce, date("d.m.Y") . "credit_card")){

            $cardNum = $opts["cardNum"];

            \Stripe\Stripe::setApiKey($this->state->getStripeApiKey());

            try {
                $tok = \Stripe\Token::create(array(
                    "card" => array(
                        "number" => $cardNum,
                        "exp_month" => (int)$opts["expMonth"],
                        "exp_year" => (int)$opts["expYear"],
                        "cvc" => $opts["cvc"],
                        "name" => $opts["nameOnCard"]
                    )
                ));

                $stripeId = $tok->id;
                $creditCardHandle = $tok->card->id;

                $params = [
                    "stripeId" => $stripeId,
                    "creditCardHandle" => $creditCardHandle,
                    "nameOnCard" => $opts["nameOnCard"],
                ];

                try {
                    $resp    = $this->handbid->store( 'CreditCard' )->add( $params );
                    $result["resp"] = $resp;
                }
                catch(Exception $e){
                    $result["error"] = $e;
                }
            }
            catch(Exception $e){
                if(isset($e->jsonBody["error"]["message"])){
                    $result["error"]["message"] = $e->jsonBody["error"]["message"];
                }
                else{
                    $result["error"] = $e;
                }
            }
        }
        echo json_encode($result);
        exit;
    }



    function handbid_ajax_get_invoices_callback(){

        $result = [
            "unpaid" => 0,
            "invoices" => "",
        ];

        $nonce = $_POST["nonce"];

        if($this->handbid_verify_nonce($nonce, date("d.m.Y") . "get_invoices")) {

            $auction = $this->state->currentAuction();
            $profile = $this->state->currentBidder($auction->id);

            $myInvoices = $this->handbid->store('Receipt')->allReceipts();

            $unpaidInvoices = 0;
            if (count($myInvoices)) {
                foreach ($myInvoices as $invoice) {
                    if (!$invoice->paid) {
                        $unpaidInvoices++;
                    }
                }
            }
            $result["unpaid"] = $unpaidInvoices;
            $result["invoices"] = $this->viewRenderer->render(
                'views/bidder/receipt',
                [
                    'profile' => $profile,
                    'myInvoices' => $myInvoices
                ]
            );
        }


        echo json_encode($result);
        exit;
    }



    function handbid_ajax_get_messages_callback(){

        $result = [
            "messages" => "",
        ];

        $nonce = $_POST["nonce"];

        if($this->handbid_verify_nonce($nonce, date("d.m.Y") . "get_messages")) {

            $myMessages = $this->handbid->store( 'Notification' )->allMessages( 0, 255 );

            $result["messages"] = $this->viewRenderer->render(
                'views/bidder/notifications',
                [
                    'notifications' => $myMessages,
                ]
            );
        }


        echo json_encode($result);
        exit;
    }



    function handbid_ajax_send_message_callback(){

        $to = $_POST["email"];
        $body = $_POST["text"];
        $nonce = $_POST["nonce"];
        $auctionName = $_POST["auction"];
        $bidder   = $this->state->currentBidder();

        if($this->handbid_verify_nonce($nonce, date("d.m.Y") . "send_message")) {

            $name = $bidder->firstName . " " . $bidder->lastName;
            $from = $bidder->email;
            $subject = 'New message from bidder '.$name.' at auction "'.$auctionName.'"';
            $headers = 'From: '.$name.' <'.$from.'>' . "\r\n";
            @wp_mail( $to, $subject, $body, $headers );

        }

        exit;
    }



    function handbid_ajax_remove_credit_card_callback(){

        $nonce = $_POST["nonce"];
        $cardID = $_POST["cardID"];
        $result = [
            "id" => $cardID,
        ];

        if($this->handbid_verify_nonce($nonce, date("d.m.Y") . "delete_card")){

                try {
                    $resp = $this->handbid->store( 'CreditCard' )->delete( $cardID );
                    $result["resp"] = $resp;
                }
                catch(Exception $e){
                    $result["resp"] = $e;
                }
        }
        echo json_encode($result);
        exit;
    }



    function handbid_load_auto_complete_auctions_callback(){

        $nonce = $_REQUEST["nonce"];
        $inputIt = $_REQUEST["inputIt"];
        $selectIt = $_REQUEST["selectIt"];
        $search = $_REQUEST["q"];
        $result = [];
        if($this->handbid_verify_nonce($nonce, date("d.m.Y") . "auto_complete")){
            $result["items"] = [];
                try {
                    $auctions = $this->handbid->store('Auction')->all($page = 0, $pageSize = 255, null, null, ["search" => urlencode($search)]);
                    if(count($auctions)) {
                    foreach($auctions as $auction) {
                        $result["items"][] = [
                            "id" => $auction->id,
                            "key" => $auction->key,
                            "name" => $auction->name,
                            "auctionGuid" => $auction->auctionGuid,
                            "status" => $auction->status,
                            "totalItems" => $auction->totalItems,
                            "totalBidders" => $auction->totalBidders,
                            "organization" => $auction->organization->name,
                            "inputIt" => $inputIt,
                            "selectIt" => $selectIt,
                        ];
                    }
                    }
                }
                catch(Exception $e){

                }
        }
        echo json_encode($result);
        exit;
    }



    function handbid_load_shortcode_auctions_callback(){

        $nonce = $_REQUEST["nonce"];
        $inviteCode = $_REQUEST["inviteCode"];
        $result = [];
        if($this->handbid_verify_nonce($nonce, date("d.m.Y") . "check_invite_code") and trim($inviteCode)){
            $result["items"] = [];
                try {
                    $auctions = $this->handbid->store('Auction')->all($page = 0, $pageSize = 255, null, null, []);
                    if(count($auctions)) {
                    foreach($auctions as $auction) {
                        if($auction->shortCode == $inviteCode)
                        $result["items"][] = [
                            "id" => $auction->id,
                            "key" => $auction->key,
                            "name" => $auction->name,
                            "auctionGuid" => $auction->auctionGuid,
                            "status" => $auction->status,
                            "totalItems" => $auction->totalItems,
                            "totalBidders" => $auction->totalBidders,
                            "organization" => $auction->organization->name,
                        ];
                    }
                    }
                }
                catch(Exception $e){

                }
        }
        echo json_encode($result);
        exit;
    }


    function handbid_ajax_get_countries_provinces_callback(){

        $countryID = $_REQUEST["countryID"];
        $nonce = $_REQUEST["nonce"];
        $result = [];
        if($this->handbid_verify_nonce($nonce, date("d.m.Y") . "country_provinces")){
                try {
                    $countriesIDs = $this->state->getCountriesAndProvinces();
                    if(count($countriesIDs)) {
                        foreach ($countriesIDs as $countriesID) {
                            if($countryID == $countriesID->id and isset($countriesID->provinces)) {
                                foreach ($countriesID->provinces as $countryProvince) {
                                    $result[] = [
                                        "value" => $countryProvince->id,
                                        "text" => $countryProvince->countriesRegionsName,
                                    ];
                                }
                            }
                        }
                    }
                }
                catch(Exception $e){

                }
        }
        echo json_encode($result);
        exit;
    }


    // ---------------- POST CALLBACKS ------------------

    function handbid_post_update_bidder_callback(){
        $profile  = $this->handbid->store( 'Bidder' )->myProfile();
        $fieldsToUpdate = [];

        if(isset($_POST["password"]) and ($_POST["password"] != $_POST["password2"])){
            unset($_POST["password"]);
            unset($_POST["password2"]);
        }

        foreach($_POST as $postField => $postFieldValue){
            if(isset($profile->{$postField}) and trim($postFieldValue) and ($profile->{$postField} != $postFieldValue)){
                $fieldsToUpdate[$postField] = $postFieldValue;
            }
        }

        if(isset($_FILES["profile_photo"]) and ! $_FILES["profile_photo"]["error"] ){
            $fieldsToUpdate["imageName"] = $_FILES["profile_photo"]["name"];
            $fieldsToUpdate["image"] = base64_encode(file_get_contents($_FILES["profile_photo"]["tmp_name"]));
        }

        if(count($fieldsToUpdate)){
            $this->handbid->store( 'Bidder' )->updateProfileData($fieldsToUpdate);
        }
        if(isset($_POST["redirect"])){
            wp_redirect($_POST["redirect"]);
        }

    }

}
