<?php

class ShortCodeController {

    public $viewRenderer;
    public $basePath;
    public $state;
    public $handbid;

    public function __construct(\Handbid\Handbid $handbid, HandbidViewRenderer $viewRenderer, $basePath, $state, $config = []) {
        $this->handbid = $handbid;
        $this->viewRenderer = $viewRenderer;
        $this->basePath = $basePath;
        $this->state = $state;

        // loop through our objects and save them as parameters
        forEach($config as $k => $v) {
            $this->$k = $v;
        }
    }

    public function init() {
        $this->initShortCode();
    }
    function initShortCode() {

        // Add Plugin ShortCodes
        $shortCodes = [
            'handbid_organization_details' => 'organizationDetails',
            'handbid_organization_auctions'=> 'organizationAuctions',
            'handbid_organization_list'    => 'organizationList',
            'handbid_auction_results'      => 'auctionResults',
            'handbid_auction_banner'       => 'auctionBanner',
            'handbid_auction_details'      => 'auctionDetails',
            'handbid_auction_contact_form' => 'auctionContactForm',
            'handbid_auction_list'         => 'auctionList',
            'handbid_bid_now'              => 'bidNow',
            'handbid_bid_history'          => 'bidHistory',
            'handbid_bid_winning'          => 'bidWinning',
            'handbid_item_results'         => 'itemResults',
            'handbid_item_search_bar'      => 'itemSearchBar',
            'handbid_ticket_buy'           => 'ticketBuy',
            'handbid_image_gallery'        => 'imageGallery'
        ];

        forEach($shortCodes as $shortCode => $callback) {
            add_shortcode( $shortCode, [ $this, $callback ] );
        }
    }

    // Organization
    public function organizationDetails($attributes) {
        try {
            $organization = $this->state->currentOrg();
            return $this->viewRenderer->render('views/organization/details', $organization);
        }
        catch (Exception $e) {
            echo "No organization details could be found";
            return;
        }
    }
    public function organizationAuctions($attributes) {
        try {
            $organization = $this->state->currentOrg();
            return $this->viewRenderer->render('views/organization/auctions', $organization);
        }
        catch (Exception $e) {
            echo "No organization auctions could be found";
            return;
        }
    }

    public function organizationList($attributes) {
        try {
            $organizations = $this->handbid->store('Organization')->all();
            return $this->viewRenderer->render('views/organization/list', $organizations);
        }
        catch (Exception $e) {
            echo "No Organization List";
            return;
        }
    }

    // Auctions
    public function auctionResults ($attributes) {

        try {
            if(!isset($attributes['template']) && !$attributes['template']) {
                $attributes['template'] = 'views/auction/logo';
            }

            if(!in_array($attributes['type'], ['recent', 'all', 'past'])) {
                $attributes['type'] = 'recent';
            }

            // Get orgs from handbid server
            $auctions = $this->handbid->store('Auction')->{$attributes['type']}();

            $markup = $this->viewRenderer->render($attributes['template'], [
                    'auctions' => $auctions
                ]);

            return $markup;
        }
        catch (Exception $e) {
            echo "Error during Auctions List";
            return;
        }

    }
    public function auctionBanner($attributes) {

        try {
            $auction = $this->state->currentAuction();

            $url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' . urlencode($auction->vanityAddress) . '&sensor=true';

            $geolocation = json_decode(file_get_contents($url));

            $location = $geolocation->results[0]->geometry->location;

            $coords = [
                $location->lat,
                $location->lng
            ];

            $attributes = [
                $auction,
                $coords
            ];

            return $this->viewRenderer->render('views/auction/banner', $attributes);

        } catch(Exception $e)
        {
            echo 'Error in auction banner';
            return;
        }

    }
    public function auctionDetails($attributes) {

        try {
            return $this->viewRenderer->render('views/auction/details', $this->state->currentAuction());
        }
        catch(Exception $e) {
            echo "No Auction found";
            return;
        }


    }
    public function auctionContactForm($attributes) {
        try {
            return $this->viewRenderer->render('views/auction/contact-form', $this->state->currentAuction());
        }
        catch (Exception $e) {
            echo "Could not find current auction for contact form";
            return;
        }

    }
    public function auctionList($attributes) {

        try {
//            $auction = $this->state->currentAuction();

            $categories = file_get_contents($this->basePath . '/dummy-data/dummy-categories.json');
            $items = file_get_contents($this->basePath . '/dummy-data/dummy-items.json');

            $json[] = json_decode($categories,true);
            $json[] = json_decode($items,true);

            return $this->viewRenderer->render('views/auction/list', $json);
        }
        catch (Exception $e) {
            echo "No Auction Data Found";
            return;
        }

        // Temp dummy data
    }

    // Bids
    public function bidNow($attributes) {
        try {
            return $this->viewRenderer->render('views/bid/now', $this->state->currentItem());
        }
        catch (Exception $e) {
            echo "No Item Found for Bid Now";
            return;
        }
    }
    public function bidHistory($attributes) {
        try {
            return $this->viewRenderer->render('views/bid/history', $this->state->currentItem());
        } catch (Exception $e) {
            echo "No Item Found for Bid History";
            return;
        }

    }
    public function bidWinning($attributes) {
        try {
            return $this->viewRenderer->render('views/bid/winning', $this->state->currentItem());
        }
        catch (Exception $e) {
            echo "No Item found for Bid winning";
            return;
        }


    }

    // Items
    public function itemResults($attributes) {
        try {
            return $this->viewRenderer->render('views/item/results', $this->state->currentItem());
        }
        catch (Exception $e) {
            echo "No Item was found for Item Results";
            return;
        }
    }
    public function itemSearchBar($attributes) {
        try {
            return $this->viewRenderer->render('views/item/search-bar');
        }
        catch (Exception $e) {
            echo "Error For Search Bar";
            return;
        }
    }

    // Tickets
    public function ticketBuy($attributes) {
        try {
            $auction = $this->state->currentAuction();
            return $this->viewRenderer->render('views/ticket/buy', $this->state->currentAuction());
        } catch(Exception $e)
        {
            echo "Ticket Buy, No Auction Found";
            return;
        }
    }

    // Image
    public function imageGallery($attributes) {
        try {
            $item = $this->state->currentItem();
            return $this->viewRenderer->render('views/image/photo-gallery', $item);
        } catch(Exception $e)
        {
            echo 'No Item was found for image gallery';
            return;
        }
    }

}