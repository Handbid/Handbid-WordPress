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
 * Class HandbidState
 *
 * Determines the current state of Handbid. Which Organization, Auction and / or Item is one currently being
 * looked at
 *
 */
class HandbidState
{

    private $stripeApiKey = "pk_Yidx0zkypJ6stL4BO6VnDfslNBYXF";
    private $stripeApiKeyLive = "pk_hHpGKGGc39SSpUlP2TwghF4hONv1v";

    public $basePath;
    public $handbid;
    public $org;
    public $auction;
    public $item;
    public $itemBids;
    public $inventory;
    public $bidder;
    public $bidderNotAvailable = false;
    public $bidderAuctionID = null;
    public $countriesAndProvinces;
    public $mapVisibility;

    public function __construct($basePath, $handbid)
    {
        $this->basePath = $basePath;
        $this->handbid = $handbid;
    }

    public function getStripeApiKey(){
	    $stripeMode = get_option('handbidStripeMode', 'test');
        return ($stripeMode == "test")?$this->stripeApiKey:$this->stripeApiKeyLive;
    }

    public function currentOrg($attributes = null)
    {

        try {

            $profile = $this->currentBidder();
            $this->handbid->store('Organization')->setBasePublicity(! $profile);

            if (!$this->org) {
                $orgKey = (isset($attributes['organization']) && $attributes['organization']) ? $attributes['organization'] : get_query_var(
                    'organization'
                );

                if (!$orgKey) {
                    $orgKey = get_option('handbidDefaultOrganizationKey');
                }

                if ($orgKey) {
                    $this->org = $this->handbid->store('Organization')->byKey($orgKey);
                }

            }

            return $this->org;
        } catch (Exception $e) {

            return null;
        }
    }

    public function currentAuction($attributes = null)
    {

        try {

            $profile = $this->currentBidder();
            $this->handbid->store('Auction')->setBasePublicity(! $profile);

            if ($this->auction && !$attributes) {
                return $this->auction;
            }
	        elseif($this->item and isset($this->item->auction)){
		        $this->auction = $this->item->auction;
		        return $this->auction;
	        }

            $auctionKey = (isset($attributes['key']) && $attributes['key']) ? $attributes['key'] : get_query_var(
                'auction'
            );

            $auctionID = (isset($attributes['id']) && $attributes['id']) ? $attributes['id'] : false;

            if (!$auctionKey) {
                $auctionKey = get_option('handbidDefaultAuctionKey');
            }

            if ($auctionKey) {

                $query = ['options' => []];

                if (isset($attributes['thumb_width'])) {
                    $query['options']['images'] = ['w' => $attributes['thumb_width']];
                }

                if (isset($attributes['thumb_height'])) {
                    $query['options']['images'] = ['h' => $attributes['thumb_height']];
                }

                $this->auction = $this->handbid->store('Auction')->byKey($auctionKey, $query, false);
            }
            elseif ($auctionID) {

                $query = ['options' => []];

                $this->auction = $this->handbid->store('Auction')->byID($auctionID, $query, false);
            }

            return $this->auction;

        } catch (Exception $e) {

            return null;
        }
    }

    public function getCurrentAuctionTickets($attributes = null){
        $auction = $this->currentAuction($attributes);
        $auctionTicketItems = [];
        if($auction->enableTicketSales) {
            if (count($auction->categories)) {
                foreach ($auction->categories as $category) {
                    if (count($category->items)) {
                        foreach ($category->items as $item) {
                            if ($item->isTicket) {
                                $auctionTicketItems[] = $item;
                            }
                        }
                    }
                }
            }
        }
        return $auctionTicketItems;
    }

    public function currentItem($attributes = null)
    {
        try {

            $profile = $this->currentBidder();
            $this->handbid->store('Item')->setBasePublicity(! $profile);

            if (!$this->item || $attributes) {

                $itemKey = (isset($attributes['key']) && $attributes['key']) ? $attributes['key'] : get_query_var(
                    'item'
                );
                $auctionKey = (isset($attributes['auction']) && $attributes['auction']) ? $attributes['auction'] : get_query_var(
                    'auction'
                );

                if ($itemKey) {

                    $query = ['options' => []];

                    if (isset($attributes['thumb_width'])) {
                        $query['options']['images'] = ['w' => $attributes['thumb_width']];
                    }

                    if (isset($attributes['thumb_height'])) {

                        if (!isset($query['options']['images'])) {
                            $query['options']['images'] = [];
                        }

                        $query['options']['images']['h'] = $attributes['thumb_height'];
                    }

                    $itemKey = $itemKey . '?auction='. $auctionKey;

                    $this->item = $this->handbid->store('Item')->byKey($itemKey, $query);

	                if(isset($this->item->auction)){
		                $this->auction = $this->item->auction;
	                }
	                if(isset($this->item->bids)){
		                $this->itemBids = $this->item->bids;
	                }
                }
            }

            return $this->item;

        } catch (Exception $e) {

            return null;
        }

    }

    public function currentItemBids($itemID = null){
	    if(!is_array($this->itemBids)){
		    $this->itemBids = $this->handbid->store( 'Bid' )->itemBids( $itemID );
	    }
	    return $this->itemBids;
    }


    public function currentBidder($auction_id = null)
    {
        try {
            if (($this->bidder and $auction_id == null) or ($this->bidder and $auction_id == $this->bidderAuctionID) or $this->bidderNotAvailable) {
                return $this->bidder;
            }
            $this->bidder =  $this->handbid->store('Bidder')->myProfile($auction_id);
            $this->bidderAuctionID = $auction_id;

            if(!$this->bidder){
                $this->bidderNotAvailable = true;
                setcookie('handbid-auth', null, -1, COOKIEPATH, COOKIE_DOMAIN);
            }
            return $this->bidder;

        } catch (Exception $e) {

            return null;
        }

    }

    public function currentInventory($auctionID, $attributes = null)
    {
        try {

            if ($this->inventory && !$attributes) {
                return $this->inventory;
            }

            if ($auctionID) {
                $this->inventory = $this->handbid->store( 'Auction' )->auctionMyInventory( $auctionID );
            }

            return $this->inventory;

        } catch (Exception $e) {

            return null;
        }

    }

    public function getGridColsCount($default = 0, $type = "")
    {
        $colCount = (int)get_option('handbidDefaultColCount' . $type);
        if (!$colCount) {
            $colCount = ($default) ? $default : 4;
        }
        return $colCount;
    }

    public function getPageSize($default = 0, $type = "")
    {
	    if($default){
		    return $default;
	    }
        $colCount = (int) get_option('handbidDefaultPageSize', 25);
        return $colCount;
    }

    public function getLocalOrganizationSlug()
    {
        $slug = get_option('handbidShowOnlyMyOrganization');
        return trim($slug) ? trim($slug) : false;
    }

    public function setMapVisibility($mapVisibility)
    {
        $this->mapVisibility = $mapVisibility;
    }

    public function getMapVisibility()
    {
        return $this->mapVisibility;
    }

    public function isLocalOrganizationPlugin()
    {
        return false;
    }

    public function getCountriesWithCodes()
    {
        $countries = array(
            array("code" => "AF", "name" => "Afghanistan", "d_code" => "+93"),
            array("code" => "AL", "name" => "Albania", "d_code" => "+355"),
            array("code" => "DZ", "name" => "Algeria", "d_code" => "+213"),
            array("code" => "AS", "name" => "American Samoa", "d_code" => "+1"),
            array("code" => "AD", "name" => "Andorra", "d_code" => "+376"),
            array("code" => "AO", "name" => "Angola", "d_code" => "+244"),
            array("code" => "AI", "name" => "Anguilla", "d_code" => "+1"),
            array("code" => "AG", "name" => "Antigua", "d_code" => "+1"),
            array("code" => "AR", "name" => "Argentina", "d_code" => "+54"),
            array("code" => "AM", "name" => "Armenia", "d_code" => "+374"),
            array("code" => "AW", "name" => "Aruba", "d_code" => "+297"),
            array("code" => "AU", "name" => "Australia", "d_code" => "+61"),
            array("code" => "AT", "name" => "Austria", "d_code" => "+43"),
            array("code" => "AZ", "name" => "Azerbaijan", "d_code" => "+994"),
            array("code" => "BH", "name" => "Bahrain", "d_code" => "+973"),
            array("code" => "BD", "name" => "Bangladesh", "d_code" => "+880"),
            array("code" => "BB", "name" => "Barbados", "d_code" => "+1"),
            array("code" => "BY", "name" => "Belarus", "d_code" => "+375"),
            array("code" => "BE", "name" => "Belgium", "d_code" => "+32"),
            array("code" => "BZ", "name" => "Belize", "d_code" => "+501"),
            array("code" => "BJ", "name" => "Benin", "d_code" => "+229"),
            array("code" => "BM", "name" => "Bermuda", "d_code" => "+1"),
            array("code" => "BT", "name" => "Bhutan", "d_code" => "+975"),
            array("code" => "BO", "name" => "Bolivia", "d_code" => "+591"),
            array("code" => "BA", "name" => "Bosnia and Herzegovina", "d_code" => "+387"),
            array("code" => "BW", "name" => "Botswana", "d_code" => "+267"),
            array("code" => "BR", "name" => "Brazil", "d_code" => "+55"),
            array("code" => "IO", "name" => "British Indian Ocean Territory", "d_code" => "+246"),
            array("code" => "VG", "name" => "British Virgin Islands", "d_code" => "+1"),
            array("code" => "BN", "name" => "Brunei", "d_code" => "+673"),
            array("code" => "BG", "name" => "Bulgaria", "d_code" => "+359"),
            array("code" => "BF", "name" => "Burkina Faso", "d_code" => "+226"),
            array("code" => "MM", "name" => "Burma Myanmar", "d_code" => "+95"),
            array("code" => "BI", "name" => "Burundi", "d_code" => "+257"),
            array("code" => "KH", "name" => "Cambodia", "d_code" => "+855"),
            array("code" => "CM", "name" => "Cameroon", "d_code" => "+237"),
            array("code" => "CA", "name" => "Canada", "d_code" => "+1"),
            array("code" => "CV", "name" => "Cape Verde", "d_code" => "+238"),
            array("code" => "KY", "name" => "Cayman Islands", "d_code" => "+1"),
            array("code" => "CF", "name" => "Central African Republic", "d_code" => "+236"),
            array("code" => "TD", "name" => "Chad", "d_code" => "+235"),
            array("code" => "CL", "name" => "Chile", "d_code" => "+56"),
            array("code" => "CN", "name" => "China", "d_code" => "+86"),
            array("code" => "CO", "name" => "Colombia", "d_code" => "+57"),
            array("code" => "KM", "name" => "Comoros", "d_code" => "+269"),
            array("code" => "CK", "name" => "Cook Islands", "d_code" => "+682"),
            array("code" => "CR", "name" => "Costa Rica", "d_code" => "+506"),
            array("code" => "CI", "name" => "Côte d'Ivoire", "d_code" => "+225"),
            array("code" => "HR", "name" => "Croatia", "d_code" => "+385"),
            array("code" => "CU", "name" => "Cuba", "d_code" => "+53"),
            array("code" => "CY", "name" => "Cyprus", "d_code" => "+357"),
            array("code" => "CZ", "name" => "Czech Republic", "d_code" => "+420"),
            array("code" => "CD", "name" => "Democratic Republic of Congo", "d_code" => "+243"),
            array("code" => "DK", "name" => "Denmark", "d_code" => "+45"),
            array("code" => "DJ", "name" => "Djibouti", "d_code" => "+253"),
            array("code" => "DM", "name" => "Dominica", "d_code" => "+1"),
            array("code" => "DO", "name" => "Dominican Republic", "d_code" => "+1"),
            array("code" => "EC", "name" => "Ecuador", "d_code" => "+593"),
            array("code" => "EG", "name" => "Egypt", "d_code" => "+20"),
            array("code" => "SV", "name" => "El Salvador", "d_code" => "+503"),
            array("code" => "GQ", "name" => "Equatorial Guinea", "d_code" => "+240"),
            array("code" => "ER", "name" => "Eritrea", "d_code" => "+291"),
            array("code" => "EE", "name" => "Estonia", "d_code" => "+372"),
            array("code" => "ET", "name" => "Ethiopia", "d_code" => "+251"),
            array("code" => "FK", "name" => "Falkland Islands", "d_code" => "+500"),
            array("code" => "FO", "name" => "Faroe Islands", "d_code" => "+298"),
            array("code" => "FM", "name" => "Federated States of Micronesia", "d_code" => "+691"),
            array("code" => "FJ", "name" => "Fiji", "d_code" => "+679"),
            array("code" => "FI", "name" => "Finland", "d_code" => "+358"),
            array("code" => "FR", "name" => "France", "d_code" => "+33"),
            array("code" => "GF", "name" => "French Guiana", "d_code" => "+594"),
            array("code" => "PF", "name" => "French Polynesia", "d_code" => "+689"),
            array("code" => "GA", "name" => "Gabon", "d_code" => "+241"),
            array("code" => "GE", "name" => "Georgia", "d_code" => "+995"),
            array("code" => "DE", "name" => "Germany", "d_code" => "+49"),
            array("code" => "GH", "name" => "Ghana", "d_code" => "+233"),
            array("code" => "GI", "name" => "Gibraltar", "d_code" => "+350"),
            array("code" => "GR", "name" => "Greece", "d_code" => "+30"),
            array("code" => "GL", "name" => "Greenland", "d_code" => "+299"),
            array("code" => "GD", "name" => "Grenada", "d_code" => "+1"),
            array("code" => "GP", "name" => "Guadeloupe", "d_code" => "+590"),
            array("code" => "GU", "name" => "Guam", "d_code" => "+1"),
            array("code" => "GT", "name" => "Guatemala", "d_code" => "+502"),
            array("code" => "GN", "name" => "Guinea", "d_code" => "+224"),
            array("code" => "GW", "name" => "Guinea-Bissau", "d_code" => "+245"),
            array("code" => "GY", "name" => "Guyana", "d_code" => "+592"),
            array("code" => "HT", "name" => "Haiti", "d_code" => "+509"),
            array("code" => "HN", "name" => "Honduras", "d_code" => "+504"),
            array("code" => "HK", "name" => "Hong Kong", "d_code" => "+852"),
            array("code" => "HU", "name" => "Hungary", "d_code" => "+36"),
            array("code" => "IS", "name" => "Iceland", "d_code" => "+354"),
            array("code" => "IN", "name" => "India", "d_code" => "+91"),
            array("code" => "ID", "name" => "Indonesia", "d_code" => "+62"),
            array("code" => "IR", "name" => "Iran", "d_code" => "+98"),
            array("code" => "IQ", "name" => "Iraq", "d_code" => "+964"),
            array("code" => "IE", "name" => "Ireland", "d_code" => "+353"),
            array("code" => "IL", "name" => "Israel", "d_code" => "+972"),
            array("code" => "IT", "name" => "Italy", "d_code" => "+39"),
            array("code" => "JM", "name" => "Jamaica", "d_code" => "+1"),
            array("code" => "JP", "name" => "Japan", "d_code" => "+81"),
            array("code" => "JO", "name" => "Jordan", "d_code" => "+962"),
            array("code" => "KZ", "name" => "Kazakhstan", "d_code" => "+7"),
            array("code" => "KE", "name" => "Kenya", "d_code" => "+254"),
            array("code" => "KI", "name" => "Kiribati", "d_code" => "+686"),
            array("code" => "XK", "name" => "Kosovo", "d_code" => "+381"),
            array("code" => "KW", "name" => "Kuwait", "d_code" => "+965"),
            array("code" => "KG", "name" => "Kyrgyzstan", "d_code" => "+996"),
            array("code" => "LA", "name" => "Laos", "d_code" => "+856"),
            array("code" => "LV", "name" => "Latvia", "d_code" => "+371"),
            array("code" => "LB", "name" => "Lebanon", "d_code" => "+961"),
            array("code" => "LS", "name" => "Lesotho", "d_code" => "+266"),
            array("code" => "LR", "name" => "Liberia", "d_code" => "+231"),
            array("code" => "LY", "name" => "Libya", "d_code" => "+218"),
            array("code" => "LI", "name" => "Liechtenstein", "d_code" => "+423"),
            array("code" => "LT", "name" => "Lithuania", "d_code" => "+370"),
            array("code" => "LU", "name" => "Luxembourg", "d_code" => "+352"),
            array("code" => "MO", "name" => "Macau", "d_code" => "+853"),
            array("code" => "MK", "name" => "Macedonia", "d_code" => "+389"),
            array("code" => "MG", "name" => "Madagascar", "d_code" => "+261"),
            array("code" => "MW", "name" => "Malawi", "d_code" => "+265"),
            array("code" => "MY", "name" => "Malaysia", "d_code" => "+60"),
            array("code" => "MV", "name" => "Maldives", "d_code" => "+960"),
            array("code" => "ML", "name" => "Mali", "d_code" => "+223"),
            array("code" => "MT", "name" => "Malta", "d_code" => "+356"),
            array("code" => "MH", "name" => "Marshall Islands", "d_code" => "+692"),
            array("code" => "MQ", "name" => "Martinique", "d_code" => "+596"),
            array("code" => "MR", "name" => "Mauritania", "d_code" => "+222"),
            array("code" => "MU", "name" => "Mauritius", "d_code" => "+230"),
            array("code" => "YT", "name" => "Mayotte", "d_code" => "+262"),
            array("code" => "MX", "name" => "Mexico", "d_code" => "+52"),
            array("code" => "MD", "name" => "Moldova", "d_code" => "+373"),
            array("code" => "MC", "name" => "Monaco", "d_code" => "+377"),
            array("code" => "MN", "name" => "Mongolia", "d_code" => "+976"),
            array("code" => "ME", "name" => "Montenegro", "d_code" => "+382"),
            array("code" => "MS", "name" => "Montserrat", "d_code" => "+1"),
            array("code" => "MA", "name" => "Morocco", "d_code" => "+212"),
            array("code" => "MZ", "name" => "Mozambique", "d_code" => "+258"),
            array("code" => "NA", "name" => "Namibia", "d_code" => "+264"),
            array("code" => "NR", "name" => "Nauru", "d_code" => "+674"),
            array("code" => "NP", "name" => "Nepal", "d_code" => "+977"),
            array("code" => "NL", "name" => "Netherlands", "d_code" => "+31"),
            array("code" => "AN", "name" => "Netherlands Antilles", "d_code" => "+599"),
            array("code" => "NC", "name" => "New Caledonia", "d_code" => "+687"),
            array("code" => "NZ", "name" => "New Zealand", "d_code" => "+64"),
            array("code" => "NI", "name" => "Nicaragua", "d_code" => "+505"),
            array("code" => "NE", "name" => "Niger", "d_code" => "+227"),
            array("code" => "NG", "name" => "Nigeria", "d_code" => "+234"),
            array("code" => "NU", "name" => "Niue", "d_code" => "+683"),
            array("code" => "NF", "name" => "Norfolk Island", "d_code" => "+672"),
            array("code" => "KP", "name" => "North Korea", "d_code" => "+850"),
            array("code" => "MP", "name" => "Northern Mariana Islands", "d_code" => "+1"),
            array("code" => "NO", "name" => "Norway", "d_code" => "+47"),
            array("code" => "OM", "name" => "Oman", "d_code" => "+968"),
            array("code" => "PK", "name" => "Pakistan", "d_code" => "+92"),
            array("code" => "PW", "name" => "Palau", "d_code" => "+680"),
            array("code" => "PS", "name" => "Palestine", "d_code" => "+970"),
            array("code" => "PA", "name" => "Panama", "d_code" => "+507"),
            array("code" => "PG", "name" => "Papua New Guinea", "d_code" => "+675"),
            array("code" => "PY", "name" => "Paraguay", "d_code" => "+595"),
            array("code" => "PE", "name" => "Peru", "d_code" => "+51"),
            array("code" => "PH", "name" => "Philippines", "d_code" => "+63"),
            array("code" => "PL", "name" => "Poland", "d_code" => "+48"),
            array("code" => "PT", "name" => "Portugal", "d_code" => "+351"),
            array("code" => "PR", "name" => "Puerto Rico", "d_code" => "+1"),
            array("code" => "QA", "name" => "Qatar", "d_code" => "+974"),
            array("code" => "CG", "name" => "Republic of the Congo", "d_code" => "+242"),
            array("code" => "RE", "name" => "Réunion", "d_code" => "+262"),
            array("code" => "RO", "name" => "Romania", "d_code" => "+40"),
            array("code" => "RU", "name" => "Russia", "d_code" => "+7"),
            array("code" => "RW", "name" => "Rwanda", "d_code" => "+250"),
            array("code" => "BL", "name" => "Saint Barthélemy", "d_code" => "+590"),
            array("code" => "SH", "name" => "Saint Helena", "d_code" => "+290"),
            array("code" => "KN", "name" => "Saint Kitts and Nevis", "d_code" => "+1"),
            array("code" => "MF", "name" => "Saint Martin", "d_code" => "+590"),
            array("code" => "PM", "name" => "Saint Pierre and Miquelon", "d_code" => "+508"),
            array("code" => "VC", "name" => "Saint Vincent and the Grenadines", "d_code" => "+1"),
            array("code" => "WS", "name" => "Samoa", "d_code" => "+685"),
            array("code" => "SM", "name" => "San Marino", "d_code" => "+378"),
            array("code" => "ST", "name" => "São Tomé and Príncipe", "d_code" => "+239"),
            array("code" => "SA", "name" => "Saudi Arabia", "d_code" => "+966"),
            array("code" => "SN", "name" => "Senegal", "d_code" => "+221"),
            array("code" => "RS", "name" => "Serbia", "d_code" => "+381"),
            array("code" => "SC", "name" => "Seychelles", "d_code" => "+248"),
            array("code" => "SL", "name" => "Sierra Leone", "d_code" => "+232"),
            array("code" => "SG", "name" => "Singapore", "d_code" => "+65"),
            array("code" => "SK", "name" => "Slovakia", "d_code" => "+421"),
            array("code" => "SI", "name" => "Slovenia", "d_code" => "+386"),
            array("code" => "SB", "name" => "Solomon Islands", "d_code" => "+677"),
            array("code" => "SO", "name" => "Somalia", "d_code" => "+252"),
            array("code" => "ZA", "name" => "South Africa", "d_code" => "+27"),
            array("code" => "KR", "name" => "South Korea", "d_code" => "+82"),
            array("code" => "ES", "name" => "Spain", "d_code" => "+34"),
            array("code" => "LK", "name" => "Sri Lanka", "d_code" => "+94"),
            array("code" => "LC", "name" => "St. Lucia", "d_code" => "+1"),
            array("code" => "SD", "name" => "Sudan", "d_code" => "+249"),
            array("code" => "SR", "name" => "Suriname", "d_code" => "+597"),
            array("code" => "SZ", "name" => "Swaziland", "d_code" => "+268"),
            array("code" => "SE", "name" => "Sweden", "d_code" => "+46"),
            array("code" => "CH", "name" => "Switzerland", "d_code" => "+41"),
            array("code" => "SY", "name" => "Syria", "d_code" => "+963"),
            array("code" => "TW", "name" => "Taiwan", "d_code" => "+886"),
            array("code" => "TJ", "name" => "Tajikistan", "d_code" => "+992"),
            array("code" => "TZ", "name" => "Tanzania", "d_code" => "+255"),
            array("code" => "TH", "name" => "Thailand", "d_code" => "+66"),
            array("code" => "BS", "name" => "The Bahamas", "d_code" => "+1"),
            array("code" => "GM", "name" => "The Gambia", "d_code" => "+220"),
            array("code" => "TL", "name" => "Timor-Leste", "d_code" => "+670"),
            array("code" => "TG", "name" => "Togo", "d_code" => "+228"),
            array("code" => "TK", "name" => "Tokelau", "d_code" => "+690"),
            array("code" => "TO", "name" => "Tonga", "d_code" => "+676"),
            array("code" => "TT", "name" => "Trinidad and Tobago", "d_code" => "+1"),
            array("code" => "TN", "name" => "Tunisia", "d_code" => "+216"),
            array("code" => "TR", "name" => "Turkey", "d_code" => "+90"),
            array("code" => "TM", "name" => "Turkmenistan", "d_code" => "+993"),
            array("code" => "TC", "name" => "Turks and Caicos Islands", "d_code" => "+1"),
            array("code" => "TV", "name" => "Tuvalu", "d_code" => "+688"),
            array("code" => "UG", "name" => "Uganda", "d_code" => "+256"),
            array("code" => "UA", "name" => "Ukraine", "d_code" => "+380"),
            array("code" => "AE", "name" => "United Arab Emirates", "d_code" => "+971"),
            array("code" => "GB", "name" => "United Kingdom", "d_code" => "+44"),
            array("code" => "US", "name" => "United States", "d_code" => "+1"),
            array("code" => "UY", "name" => "Uruguay", "d_code" => "+598"),
            array("code" => "VI", "name" => "US Virgin Islands", "d_code" => "+1"),
            array("code" => "UZ", "name" => "Uzbekistan", "d_code" => "+998"),
            array("code" => "VU", "name" => "Vanuatu", "d_code" => "+678"),
            array("code" => "VA", "name" => "Vatican City", "d_code" => "+39"),
            array("code" => "VE", "name" => "Venezuela", "d_code" => "+58"),
            array("code" => "VN", "name" => "Vietnam", "d_code" => "+84"),
            array("code" => "WF", "name" => "Wallis and Futuna", "d_code" => "+681"),
            array("code" => "YE", "name" => "Yemen", "d_code" => "+967"),
            array("code" => "ZM", "name" => "Zambia", "d_code" => "+260"),
            array("code" => "ZW", "name" => "Zimbabwe", "d_code" => "+263"),
        );
        return $countries;
    }

    function getCountriesAndProvinces(){
        $countriesFileName = str_replace("\\","/",HANDBID_PLUGIN_PATH . "public/json/countriesAndProvinces.json");
        if($this->countriesAndProvinces){
            return $this->countriesAndProvinces;
        }
        else{

            if(is_file($countriesFileName) and is_readable($countriesFileName)){
                try{
                    $countriesAndProvinces = json_decode(file_get_contents($countriesFileName));
                    if(is_array($countriesAndProvinces)){
                        $this->countriesAndProvinces = $countriesAndProvinces;
                        return $this->countriesAndProvinces;
                    }
                }
                catch(Exception $e){ }
            }

            $countryIDs   = $this->handbid->store( 'Bidder' )->getCountries();
            $provinceIDs  = $this->handbid->store( 'Bidder' )->getProvinces();
            $provincesByCountry = [];
            if(count($countryIDs)) {
                foreach ($provinceIDs as $provinceID) {
                    $countriesId = $provinceID->countriesId;
                    $provincesByCountry[$countriesId][] = $provinceID;
                }
                foreach ($countryIDs as $i => $countryID) {
                    $countryId = $countryID->id;
                    if (isset($provincesByCountry[$countryId])) {
                        $countryIDs[$i]->provinces = $provincesByCountry[$countryId];
                    }
                }
            }
            if(is_array($countryIDs)){
                file_put_contents($countriesFileName, json_encode($countryIDs));
            }
            $this->countriesAndProvinces = $countryIDs;
            return $this->countriesAndProvinces;
        }

    }

}