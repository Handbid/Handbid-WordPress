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
        $this->handbid      = $handbid;
        $this->state        = $state;
    }

    function init()
    {
        add_feed('handbid-logout', [$this, 'handbid_logout_callback']);

        $titleForPost = function ($title, $post, $sep = null)
        {

            if ($post && $post->post_name == 'auction-item')
            {

                $item = $this->state->currentItem();
                if ($item)
                {
                    $post->post_title = (isset($item->name)) ? $item->name : get_the_title();
                    if ($sep)
                    {
                        $title = ' ' . $sep . ' ' . $post->post_title;
                    } else
                    {
                        $title = $post->post_title;
                    }

                }

            } else if ($post && $post->post_name == 'auction')
            {

                $auction = $this->state->currentAuction();
                if ($auction)
                {
                    $post->post_title = $auction->name;
                    if ($sep)
                    {
                        $title = $post->post_title . ' ' . $sep . ' ' . esc_attr(get_bloginfo('name'));
                    } else
                    {
                        $title = $post->post_title;
                    }
                }

            } else if ($post && $post->post_name == 'organization')
            {

                $org = $this->state->currentOrg();
                if ($org)
                {
                    $post->post_title = $org->name;
                    if ($sep)
                    {
                        $title = $post->post_title . ' ' . $sep . ' ' . esc_attr(get_bloginfo('name'));
                    } else
                    {
                        $title = $post->post_title;
                    }
                }

            }

            return $title;
        };

        add_filter('wp_title', function ($title, $sep, $seplocation) use ($titleForPost)
        {

            global $post;

            return $titleForPost($title, $post, $sep);

            return $title;

        }, 10, 3);

        //modify currently loaded post to match auction or item name
        add_filter(
            'the_title',
            function ($pageTitle, $id) use ($titleForPost)
            {

                global $post;

                if (isset($post) && $post->ID != $id)
                {
                    return $pageTitle;
                }

                return $titleForPost($pageTitle, $post);


            }, 10, 2
        );

        add_action('wp_head', function ()
        {

            global $post;

            if ($post && $post->post_name == 'auction-item')
            {

                $item = $this->state->currentItem();
                if ($item)
                {
                    $item->imageUrl = (isset($item->imageUrl)) ? $item->imageUrl : "";
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
            "handbid_ajax_auction_info",
            "handbid_ajax_i_am_here",
            "handbid_ajax_reset_password",
            "handbid_ajax_get_paddle_number",
            "handbid_ajax_send_invoice",
            "handbid_ajax_createbid",
            "handbid_ajax_buy_tickets",
            "handbid_ajax_pay_for_tickets",
            "handbid_ajax_make_receipt_payment",
            "handbid_ajax_removebid",
            "handbid_ajax_add_credit_card",
            "handbid_ajax_get_invoices",
            "handbid_ajax_get_messages",
            "handbid_ajax_get_bid_history",
            "handbid_ajax_send_message",
            "handbid_ajax_remove_credit_card",
            "handbid_ajax_get_countries_provinces",
            "handbid_load_auto_complete_auctions",
            "handbid_load_shortcode_auctions",
            "handbid_ajax_customizer_css",
            "handbid_ajax_get_testimonial",
        ];
        foreach ($ajaxActions as $ajaxAction)
        {
            add_action("wp_ajax_" . $ajaxAction, [$this, $ajaxAction . "_callback"]);
            add_action("wp_ajax_nopriv_" . $ajaxAction, [$this, $ajaxAction . "_callback"]);
        }

        $postActions = [
            "handbid_post_update_bidder",
        ];
        foreach ($postActions as $postAction)
        {
            add_action("admin_post_" . $postAction, [$this, $postAction . "_callback"]);
            add_action("admin_post_nopriv_" . $postAction, [$this, $postAction . "_callback"]);
        }

        add_action("admin_post_handbid_ajax_add_credit_card", [$this, "handbid_ajax_add_credit_card_post_callback"]);
        add_action("admin_post_nopriv_handbid_ajax_add_credit_card", [$this, "handbid_ajax_add_credit_card_post_callback"]);
    }

    function _handle_form_action()
    {


        $redirect = isset($_POST['redirect']) ? $_POST['redirect'] : '/bidder';

        if (preg_match('/\?/', $redirect))
        {
            $questionMarkOrAmpersand = '&';
            list($url, $query) = explode('?', $redirect);
            parse_str($query, $query);
            unset($query['handbid-error'], $query['handbid-notice']);
            $redirect = $url . '?' . http_build_query($query);

        } else
        {
            $questionMarkOrAmpersand = '?';
        }

        if ($_POST['form-id'] == 'handbid-login')
        {

            $values = [
                'username' => $_POST['username'],
                'password' => $_POST['pin'],
            ];

            $this->handbid->store('Bidder')->login($values);

        } else if ($_POST['form-id'] == 'handbid-register')
        {

            $values = [
                'firstname' => $_POST['firstname'],
                'lastname'  => $_POST['lastname'],
                'mobile'    => $_POST['mobile'],
            ];

            $profile = $this->handbid->store('Bidder')->register($values);

            if ($profile->success == false)
            {
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

        if(isset($_COOKIE['handbid-auth'])) {
            unset($_COOKIE['handbid-auth']);
            setcookie('handbid-auth', null, time()-3600, COOKIEPATH, COOKIE_DOMAIN);
        }

        $redirect = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '/';
        wp_redirect($redirect);
    }

    function handbid_create_nonce($action = -1)
    {
        return wp_create_nonce($_SERVER["SERVER_SIGNATURE"] . " " . $action);
    }

    function handbid_verify_nonce($nonce, $action = -1)
    {
//        return wp_verify_nonce($nonce, $_SERVER["SERVER_SIGNATURE"]." ". $action);
        return true;
    }

    // ---------------- AJAX CALLBACKS ------------------

    function handbid_ajax_login_callback()
    {
        $nonce  = isset($_POST['nonce']) ? $_POST['nonce'] : 'nonce';
        $result = [
            "success" => 0,
            "error"   => "no",
        ];
        if ($this->handbid_verify_nonce($nonce, date("d.m.Y") . "login"))
        {

            $values = [
                'username'    => $_POST['username'],
                'password'    => $_POST['password'],
                'auctionGuid' => $_POST['auctionGuid'],
                'pin'         => $_POST['password'],
            ];

            $resp = $this->handbid->store('Bidder')->login($values);

            $result["success"] = (isset($resp->success) and $resp->success) ? $resp->success : 0;
            $result["resp"]    = $resp;
        }
        echo json_encode($result);
        exit;
    }

    function handbid_ajax_registration_callback()
    {
        $nonce  = isset($_POST['nonce']) ? $_POST['nonce'] : 'nonce';
        $result = [
            "success" => 0,
            "error"   => "no",
        ];

        if ($this->handbid_verify_nonce($nonce, date("d.m.Y") . "register"))
        {

            $values = [
                'firstname'   => $_POST['firstname'],
                'lastname'    => $_POST['lastname'],
                'mobile'      => $_POST['mobile'],
                'password'    => $_POST['password'],
                'email'       => $_POST['email'],
                'deviceType'  => (isset($_POST['deviceType'])) ? $_POST['deviceType'] : "other",
                'countryCode' => $_POST['countryCode'],
                'auctionGuid' => $_POST['auctionGuid'],
            ];

            $profile = $this->handbid->store('Bidder')->register($values);

            $baseError = "Something went wrong. Please, try again later.";
            if (!$profile)
            {
                $result["error"] = $baseError;
            } else
            {
                $result["success"] = (isset($profile->success) and $profile->success) ? $profile->success : 0;
                $result["values"]  = $values;
                $result["profile"] = $profile;
                if (!$result["success"])
                {
                    $result["error"] = str_replace("/auth/", "", $profile->data->error->message);
                    $result["error"] = trim(strpos($result["error"], "use login") === false) ? $result["error"] : $result["error"] . '<a class="btn btn-info signup login-popup-link" data-target-tab="login-form-new">Sign In</a>';
                    $result["error"] = trim($result["error"]) ? $result["error"] : $baseError;
                }
            }

        }
        echo json_encode($result);
        exit;
    }


    function handbid_ajax_reset_password_callback()
    {
        $nonce        = isset($_POST['nonce']) ? $_POST['nonce'] : 'nonce';
        $emailOrPhone = $_POST["emailOrPhone"];
        $result       = [];

        if ($this->handbid_verify_nonce($nonce, date("d.m.Y") . "reset_pass"))
        {

            $profile = $this->handbid->store('Bidder')->resetPass($emailOrPhone);

            $result = $profile;

        }
        echo json_encode($result);
        exit;
    }


    function handbid_ajax_auction_info_callback()
    {
        $auction_guid = $_POST["auction_guid"];

        if(!empty($auction_guid)){
            try{
                $auction = $this->handbid->store('Auction')->byGuid($auction_guid);
                if(!empty($auction->timerRemaining)){
                    echo intval($auction->timerRemaining);
                    exit;
                }
            }
            catch(Exception $e){}
        }
        echo 0;
        exit;
    }


    function handbid_ajax_i_am_here_callback()
    {
        $auctionID = $_POST["auctionID"];

        if(!empty($auction_guid)){
            try
            {
                $this->handbid->store('Auction')
                              ->onSite([
                                           'auctionId' => $auctionID,
                                           'onSite'    => 1,
                                       ]);
            }
            catch(Exception $e){}
        }
        echo 0;
        exit;
    }


    function handbid_ajax_get_paddle_number_callback()
    {
        $result = [];

        $nonce     = isset($_POST['nonce']) ? $_POST['nonce'] : 'nonce';
        $auctionID = isset($_POST['auctionID']) ? $_POST['auctionID'] : 0;

//        if($this->handbid_verify_nonce($nonce, date("d.m.Y") . "add_paddle")){

        $result = $this->handbid->store('Bidder')->addActiveAuction($auctionID);

//        }
//        else{
//            $result = $nonce;
//        }
        echo json_encode($result);
        exit;
    }


    function handbid_ajax_send_invoice_callback()
    {
        $invoice_id = isset($_POST['invoice_id']) ? $_POST['invoice_id'] : 0;
        $send_to = isset($_POST['send_to']) ? $_POST['send_to'] : 0;
        $send_type = isset($_POST['send_type']) ? $_POST['send_type'] : 'email';

        if($invoice_id)
        {
            $data = [
                'sendType' => $send_type
            ];

            if($send_type == 'email'){
                $data['email'] = $send_to;
            }

            $result = $this->handbid->store('Receipt')->sendInvoice($invoice_id, $data);

            echo json_encode($result);
        }
        else{
            echo json_encode(['errors' => ['No Invoice ID Provided']]);
        }

        exit;
    }

    function handbid_ajax_createbid_callback()
    {
        $nonce  = isset($_POST['nonce']) ? $_POST['nonce'] : 'nonce';
        $result = [
            "status"       => "failed",
            "statusReason" => "no_response",
        ];

        if ($this->handbid_verify_nonce($nonce, date("d.m.Y") . "bid"))
        {

            $values = [
                'userId'    => (int)$_POST['userId'],
                'auctionId' => (int)$_POST['auctionId'],
                'itemId'    => (int)$_POST['itemId'],
            ];
            if (isset($_POST["amount"]))
            {
                $values["amount"] = (int)$_POST["amount"];
            }
            if (isset($_POST["maxAmount"]))
            {
                $values["maxAmount"] = (int)$_POST["maxAmount"];
            }
            if (isset($_POST["quantity"]))
            {
                $values["quantity"] = (int)$_POST["quantity"];
            }

            try
            {
                $resp   = $this->handbid->store('Bid')->createBid($values);
                $result = $resp;
                if (isset($result->data->error))
                {
                    $result->status = "failed";
                    $reasons        = [];
                    foreach ((array)$result->data->error as $error)
                    {
                        $reasons[] = implode("<br>", $error);
                    }
                    $result->statusReason = implode("<br>", $reasons);
                }
            } catch (Exception $e)
            {

            }
        }
        echo json_encode($result);
        exit;
    }

    function handbid_ajax_buy_tickets_callback()
    {
        $nonce  = isset($_POST['nonce']) ? $_POST['nonce'] : 'nonce';
        $result = [
            "success"   => [],
            "fail"      => [],
            "successID" => [],
            "failID"    => [],
        ];

        if ($this->handbid_verify_nonce($nonce, date("d.m.Y") . "buy_tickets_array"))
        {
            $items = $_POST["items"];
            if (count($items))
            {
                foreach ($items as $item)
                {
                    $values = [
                        'userId'    => (int)$_POST['userId'],
                        'auctionId' => (int)$_POST['auctionId'],
                        'itemId'    => (int)$item['id'],
                        'amount'    => (int)$item['price'],
                        'quantity'  => (int)$item['quantity'],
                    ];
                    try
                    {
                        $resp                  = $this->handbid->store('Bid')->createBid($values);
                        $arr                   = ((isset($resp->status) and $resp->status == "purchase" and !isset($resp->success)) or $resp->success) ? "success" : "fail";
                        $itemId                = $values["itemId"];
                        $result[$arr][$itemId] = $resp;
                        $result[$arr . "ID"][] = $itemId;
                    } catch (Exception $e)
                    {
                        $itemId                  = $values["itemId"];
                        $result["fail"][$itemId] = $e;
                        $result["failID"][]      = $itemId;
                    }
                }
            }
        }
        echo json_encode($result);
        exit;
    }


    function handbid_ajax_pay_for_tickets_callback()
    {
        $nonce    = isset($_POST['nonce']) ? $_POST['nonce'] : 'nonce';
        $response = [];
        $values   = [
            "receiptId" => (int)$_POST["receiptId"],
            "auctionId" => (int)$_POST["auctionId"],
        ];
        if ($this->handbid_verify_nonce($nonce, date("d.m.Y") . "paddle-nonce"))
        {
            $profile = $this->state->currentBidder();

            if (count($profile->creditCards))
            {
                $ccCount = count($profile->creditCards);
                $ccIndex = 0;
                $paid    = false;
                while (!$paid and $ccIndex < $ccCount)
                {
                    $card = $profile->creditCards[$ccIndex];
                    $ccIndex++;
                    //foreach($profile->creditCards as $card){
                    $tempValues = [
                        "cardId"           => $card->id,
                        "stripeId"         => $card->stripeId,
                        "creditCardHandle" => $card->creditCardHandle,
                        "receiptId"        => $values["receiptId"],
                        "auctionId"        => $values["auctionId"],
                    ];
                    try
                    {
                        $resp               = $this->handbid->store('Receipt')->makePayment($tempValues);
                        $response["result"] = $resp->paid;
                        if ($resp->paid)
                        {
                            $paid                = true;
                            $response["paid_by"] = $card;
                        }
                    } catch (Exception $e)
                    {
                        $response["errors"] = ["Something went wrong. Please, try again later"];
                    }
                }
            }
        }
        echo json_encode($response);
        exit;
    }

    function handbid_ajax_make_receipt_payment_callback()
    {
        $nonce    = isset($_POST['nonce']) ? $_POST['nonce'] : 'nonce';
        $response = [];
        $values   = [
            "cardId"    => (int)$_POST["cardId"],
            "receiptId" => (int)$_POST["receiptId"],
            "auctionId" => (int)$_POST["auctionId"],
        ];
        if ($this->handbid_verify_nonce($nonce, date("d.m.Y") . "make_receipt_payment"))
        {
            $profile = $this->state->currentBidder();
            if (count($profile->creditCards))
            {
                foreach ($profile->creditCards as $card)
                {
                    if ($card->id == $values["cardId"])
                    {
                        $values["stripeId"]         = $card->stripeId;
                        $values["creditCardHandle"] = $card->creditCardHandle;
                    }
                }
            }
            try
            {
                $resp               = $this->handbid->store('Receipt')->makePayment($values);
                $response["result"] = $resp;
            } catch (Exception $e)
            {
                $response["error"] = $e;
            }
        }
        echo json_encode($response);
        exit;
    }


    function handbid_ajax_removebid_callback()
    {
        $nonce  = isset($_POST['nonce']) ? $_POST['nonce'] : 'nonce';
        $result = [
            "status"       => "failed",
            "statusReason" => "no_response",
        ];

        if ($this->handbid_verify_nonce($nonce, date("d.m.Y") . "bid"))
        {

            $bidID = (int)$_POST["bidID"];

            $resp = $this->handbid->store('Bid')->removeBid($bidID);
//            if(isset($resp->status)){
            $result = $resp;
//            }
        }
        echo json_encode($result);
        exit;
    }


    function handbid_ajax_add_credit_card_callback()
    {

        $nonce            = isset($_POST['nonce']) ? $_POST['nonce'] : 'nonce';
        $stripeId         = isset($_POST['stripeId']) ? $_POST['stripeId'] : '';
        $creditCardHandle = isset($_POST['creditCardHandle']) ? $_POST['creditCardHandle'] : '';
        $nameOnCard       = isset($_POST['nameOnCard']) ? $_POST['nameOnCard'] : '';

        $params = [
            "stripeId"         => $stripeId,
            "creditCardHandle" => $creditCardHandle,
            "nameOnCard"       => $nameOnCard,
        ];
        $result = [
            "opts" => $params,
        ];

        if ($this->handbid_verify_nonce($nonce, date("d.m.Y") . "credit_card"))
        {

            try
            {
                $resp           = $this->handbid->store('CreditCard')->add($params);
                $result["resp"] = $resp;
            } catch (Exception $e)
            {
                $result["error"] = $e;
            }
        }
        echo json_encode($result);
        exit;
    }


    function handbid_ajax_add_credit_card_post_callback()
    {

        $opts   = $_POST;
        $nonce  = $opts["nonce"];
        $nonce  = isset($opts['nonce']) ? $opts['nonce'] : 'nonce';
        $result = [
            "opts" => $opts,
        ];

        if ($this->handbid_verify_nonce($nonce, date("d.m.Y") . "credit_card"))
        {

            $cardNum = $opts["cardNum"];

            \Stripe\Stripe::setApiKey($this->state->getStripeApiKey());

            try
            {
                $tok = \Stripe\Token::create(array(
                                                 "card" => array(
                                                     "number"    => $cardNum,
                                                     "exp_month" => (int)$opts["expMonth"],
                                                     "exp_year"  => (int)$opts["expYear"],
                                                     "cvc"       => $opts["cvc"],
                                                     "name"      => $opts["nameOnCard"],
                                                 ),
                                             ));

                $stripeId         = $tok->id;
                $creditCardHandle = $tok->card->id;

                $params = [
                    "stripeId"         => $stripeId,
                    "creditCardHandle" => $creditCardHandle,
                    "nameOnCard"       => $opts["nameOnCard"],
                ];

                try
                {
                    $resp           = $this->handbid->store('CreditCard')->add($params);
                    $result["resp"] = $resp;
                } catch (Exception $e)
                {
                    $result["error"] = $e;
                }
            } catch (Exception $e)
            {
                if (isset($e->jsonBody["error"]["message"]))
                {
                    $result["error"]["message"] = $e->jsonBody["error"]["message"];
                } else
                {
                    $result["error"] = $e;
                }
            }
        }
        $cookieLifeTime = time() + 3600;
        if (isset($result["error"]["message"]))
        {
            setcookie("handbid-cc-error", $result["error"]["message"], $cookieLifeTime, COOKIEPATH, COOKIE_DOMAIN);
        } elseif (isset($result["error"]))
        {
            setcookie("handbid-cc-error", "Something wrong. Please, try again later", $cookieLifeTime, COOKIEPATH, COOKIE_DOMAIN);
        } else
        {
            setcookie("handbid-cc-success", "Your card has been added successfully", $cookieLifeTime, COOKIEPATH, COOKIE_DOMAIN);
        }
        $redirect = (!empty($_POST["redirect"])) ? $_POST["redirect"] : get_permalink(get_page_by_title("Auctions"));
        wp_redirect($redirect);
    }


    function handbid_ajax_get_invoices_callback()
    {

        $result = [
            "unpaid"   => 0,
            "invoices" => "",
        ];

        $nonce = isset($_POST['nonce']) ? $_POST['nonce'] : 'nonce';

        if ($this->handbid_verify_nonce($nonce, date("d.m.Y") . "get_invoices"))
        {

            $auction   = $this->state->currentAuction();
            $auctionID = (isset($auction->id)) ? $auction->id : 0;
            $profile   = $this->state->currentBidder($auctionID);

            $myInvoices = $this->handbid->store('Receipt')->allReceipts();

            $unpaidInvoices = 0;
            if (count($myInvoices))
            {
                foreach ($myInvoices as $invoice)
                {
                    if (!$invoice->paid)
                    {
                        $unpaidInvoices++;
                    }
                }
            }
            $result["unpaid"]   = $unpaidInvoices;
            $result["invoices"] = $this->viewRenderer->render(
                'views/bidder/receipt',
                [
                    'profile'    => $profile,
                    'auction'    => $auction,
                    'myInvoices' => $myInvoices,
                ]
            );
        }


        echo json_encode($result);
        exit;
    }


    function handbid_ajax_get_messages_callback()
    {

        $result = [
            "messages" => "",
        ];

        $nonce = isset($_POST['nonce']) ? $_POST['nonce'] : 'nonce';

        if ($this->handbid_verify_nonce($nonce, date("d.m.Y") . "get_messages"))
        {

            $myMessages = $this->handbid->store('Notification')->allMessages(0, 255);

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


    function handbid_ajax_get_bid_history_callback()
    {

        $result = [
            "history" => "",
        ];

        $nonce = isset($_POST['nonce']) ? $_POST['nonce'] : 'nonce';

        $itemID = (int)$_REQUEST["itemID"];

        if ($this->handbid_verify_nonce($nonce, date("d.m.Y") . "get_bids_" . $itemID))
        {

            if ($itemID)
            {
                $bids = $this->handbid->store('Bid')->itemBids($itemID);

                $result["history"] = $this->viewRenderer->render(
                    'views/item/bids',
                    [
                        'itemID' => $itemID,
                        'bids'   => $bids,
                    ]
                );
            }
        }


        echo json_encode($result);
        exit;
    }


    function handbid_ajax_send_message_callback()
    {

        $body       = $_POST["text"];
        $nonce      = isset($_POST['nonce']) ? $_POST['nonce'] : 'nonce';
        $auctionOrg = $_POST["auctionOrg"];
        $bidder     = $this->state->currentBidder();
        $result     = "";

        if ($this->handbid_verify_nonce($nonce, date("d.m.Y") . "send_message"))
        {

            $name          = $bidder->firstName . " " . $bidder->lastName;
            $from          = $bidder->email;
            $userCellPhone = $bidder->userCellPhone;

            $params = [
                "name"     => $name,
                "email"    => $from,
                "phone"    => $userCellPhone . "",
                "orgName"  => $auctionOrg,
                "comments" => $body,
            ];

            try
            {
                $result = $this->handbid->store('Bidder')->createLead($params);

            } catch (Exception $e)
            {
                $result = $e;
            }
        }
        echo json_encode($result);
        exit;
    }


    function handbid_ajax_remove_credit_card_callback()
    {

        $nonce  = isset($_POST['nonce']) ? $_POST['nonce'] : 'nonce';
        $cardID = $_POST["cardID"];
        $result = [
            "id" => $cardID,
        ];

        if ($this->handbid_verify_nonce($nonce, date("d.m.Y") . "delete_card"))
        {

            try
            {
                $resp           = $this->handbid->store('CreditCard')->delete($cardID);
                $result["resp"] = $resp;
            } catch (Exception $e)
            {
                $result["resp"] = $e;
            }
        }
        echo json_encode($result);
        exit;
    }


    function handbid_load_auto_complete_auctions_callback()
    {

        $nonce    = isset($_REQUEST['nonce']) ? $_REQUEST['nonce'] : 'nonce';
        $inputIt  = $_REQUEST["inputIt"];
        $selectIt = $_REQUEST["selectIt"];
        $search   = $_REQUEST["q"];
        $result   = [];
        if ($this->handbid_verify_nonce($nonce, date("d.m.Y") . "auto_complete"))
        {
            $result["items"] = [];
            try
            {
                $auctions = $this->handbid->store('Auction')->all($page = 0, $pageSize = 255, null, null, ["search" => urlencode($search)]);
                if (count($auctions))
                {
                    foreach ($auctions as $auction)
                    {
                        $result["items"][] = [
                            "id"           => $auction->id,
                            "key"          => $auction->key,
                            "name"         => $auction->name,
                            "auctionGuid"  => $auction->auctionGuid,
                            "status"       => $auction->status,
                            "totalItems"   => $auction->totalItems,
                            "totalBidders" => $auction->totalBidders,
                            "organization" => $auction->organization->name,
                            "inputIt"      => $inputIt,
                            "selectIt"     => $selectIt,
                        ];
                    }
                }
            } catch (Exception $e)
            {

            }
        }
        echo json_encode($result);
        exit;
    }


    function handbid_load_shortcode_auctions_callback()
    {

        $nonce      = isset($_REQUEST['nonce']) ? $_REQUEST['nonce'] : 'nonce';
        $inviteCode = $_REQUEST["inviteCode"];
        $result     = [];
        if ($this->handbid_verify_nonce($nonce, date("d.m.Y") . "check_invite_code") and trim($inviteCode))
        {
            $result["items"] = [];
            try
            {
                $auctions = $this->handbid->store('Auction')->all($page = 0, $pageSize = 255, null, null, []);
                if (count($auctions))
                {
                    foreach ($auctions as $auction)
                    {
                        if ($auction->shortCode == $inviteCode)
                            $result["items"][] = [
                                "id"           => $auction->id,
                                "key"          => $auction->key,
                                "name"         => $auction->name,
                                "auctionGuid"  => $auction->auctionGuid,
                                "status"       => $auction->status,
                                "totalItems"   => $auction->totalItems,
                                "totalBidders" => $auction->totalBidders,
                                "organization" => $auction->organization->name,
                            ];
                    }
                }
            } catch (Exception $e)
            {

            }
        }
        echo json_encode($result);
        exit;
    }


    function handbid_ajax_get_countries_provinces_callback()
    {

        $countryID = $_REQUEST["countryID"];
        $nonce     = isset($_REQUEST['nonce']) ? $_REQUEST['nonce'] : 'nonce';
        $result    = [];
        if ($this->handbid_verify_nonce($nonce, date("d.m.Y") . "country_provinces"))
        {
            try
            {
                $countriesIDs = $this->state->getCountriesAndProvinces();
                if (count($countriesIDs))
                {
                    foreach ($countriesIDs as $countriesID)
                    {
                        if ($countryID == $countriesID->id and isset($countriesID->provinces))
                        {
                            foreach ($countriesID->provinces as $countryProvince)
                            {
                                $result[] = [
                                    "value" => $countryProvince->id,
                                    "text"  => $countryProvince->countriesRegionsName,
                                ];
                            }
                        }
                    }
                }
            } catch (Exception $e)
            {

            }
        }
        echo json_encode($result);
        exit;
    }


    public function handbid_ajax_get_testimonial_callback()
    {

        $postID      = (int)$_POST["testimonial_id"];
        $testimonial = get_post($postID);

        echo $this->viewRenderer->render(
            "views/social/single-testimonial",
            [
                "testimonial" => $testimonial,
                "is_initial"  => false,
            ]
        );
        exit;

    }


    // ---------------- POST CALLBACKS ------------------

    function handbid_post_update_bidder_callback()
    {
        $profile        = $this->handbid->store('Bidder')->myProfile();
        $fieldsToUpdate = [];

        if (isset($_POST["password"]) and ($_POST["password"] != $_POST["password2"]))
        {
            unset($_POST["password"]);
            unset($_POST["password2"]);
        }

        foreach ($_POST as $postField => $postFieldValue)
        {
            if (!in_array($postField, ["redirect", "action", "password2"]) and trim($postFieldValue) and ($profile->{$postField} != $postFieldValue))
            {
                $fieldsToUpdate[$postField] = $postFieldValue;
            }
        }

        if (isset($_FILES["profile_photo"]) and !$_FILES["profile_photo"]["error"])
        {
            $fieldsToUpdate["imageName"] = $_FILES["profile_photo"]["name"];
            $fieldsToUpdate["image"]     = base64_encode(file_get_contents($_FILES["profile_photo"]["tmp_name"]));
        }

        if (count($fieldsToUpdate))
        {
            $this->handbid->store('Bidder')->updateProfileData($fieldsToUpdate);
        }
        if (isset($_POST["redirect"]))
        {
            $redirect_link = $_POST["redirect"];

            if (!empty($_POST["payInvoiceID"]))
            {
                $redirect_link = add_query_arg(['pay_invoice' => $_POST["payInvoiceID"]], $redirect_link);
            }
            else{
                $redirect_link = preg_replace('/[\?&]pay_invoice=\d*/ui', '', $redirect_link);
            }
            wp_redirect($redirect_link);
        }

    }


    function handbid_ajax_customizer_css_callback()
    {
        header("Content-type: text/css");
        echo $this->viewRenderer->render(
            'views/admin/customizer', []
        );
        exit;
    }
}
