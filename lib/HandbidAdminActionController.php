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
 * Class HandbidAdminActionController
 *
 * Handles all of the admin related actions, Controls the Handbid admin menu item and admin options
 *
 */
class HandbidAdminActionController
{

    public $viewRenderer;
    public $isLocalCopy;

    public function __construct(HandbidViewRenderer $viewRenderer, $isLocalCopy = false)
    {
        $this->viewRenderer = $viewRenderer;
        $this->isLocalCopy = $isLocalCopy;
    }

    function init()
    {
        add_action('admin_init', [$this, 'registerPluginSettings']);
        add_action('admin_menu', [$this, 'initAdminMenu']);
        add_action('customize_register', [$this, 'themeCustomizerRegister']);
        add_filter("handbid_customizer_font_face", array($this, "filterCustomizerFontFace"), 10, 1);
    }

    function initAdminMenu()
    {
        // Add in a Handbid menu item in the admin bar on the left
        add_menu_page(
            'Handbid', // Page Title
            'Handbid', // Menu Title
            'administrator', // Role of which user can view this menu
            'handbid-admin-dashboard', // url slug
            [$this, 'adminSettingsAction'], // Callback function
            plugins_url() . '/handbid/public/images/favicon.png' // image for menu item path
        );
    }

    function initAdminArea()
    {
        $this->registerPluginSettings();
    }

    function registerPluginSettings()
    {

        // Registering Handbid admin setting fields
        $settings = [
            'handbidRestEndpoint',
            'handbidFacebookAppId',
            'handbidDefaultAuctionKey',
            'handbidDefaultOrganizationKey',
            'handbidSocketUrl',
            'handbidShowOnlyMyOrganization',
            'handbidCdnEndpoint',
            'handbidDefaultColCount',
            'handbidDefaultColCountItem',
            'handbidDefaultPageSize',
            'handbidStripeMode',
            'handbidForceRefresh',
            'handbidDisplayProfileDashboardOn',
        ];

        forEach ($settings as $setting) {
            register_setting('handbid-admin', $setting);
        }
    }

    function adminSettingsAction()
    {
        echo $this->viewRenderer->render('views/admin/settings',
            [
                "is_local" => $this->isLocalCopy
            ]
        );
    }


    function getFontFaces()
    {
        $fontFaces = [
            "Arial", "Verdana", "Times", "Times New Roman", "Georgia", "Trebuchet MS",
            "Sans", "Sans-serif", "Comic Sans MS", "Courier New", "Garamond", "Helvetica",
            "Palatino", "Tahoma", "Impact", "Arial Black", "Arial Narrow", "Gill Sans",
        ];
        sort($fontFaces);
        $fontFaces = array_unique($fontFaces);
        array_unshift($fontFaces, "Lato");
        return $fontFaces;
    }


    function filterCustomizerFontFace($fontFace)
    {
        $fontFaces = $this->getFontFaces();
        if($fontFace == (int) $fontFace){
            return $fontFaces[$fontFace];
        }
        return $fontFace;
    }



    function themeCustomizerRegister($wp_customize){

        $fontFaces = $this->getFontFaces();

        $sections = [[
            "title" => "Main Settings",
            "slug" => "main_settings",
            "options" => [
                [
                    "label" => "Main Website Font",
                    "description" => "Default Font family",
                    "type" => "select",
                    "settings" => "default_font",
                    "default" => "Lato",
                    "choices" => $fontFaces
                ],
                [
                    "label" => "Main text color",
                    "description" => "Text color on the page",
                    "type" => "color",
                    "settings" => "main_text_color",
                    "default" => "#6e828a"
                ],
            ]
        ], [
                "title" => "Auction List",
                "slug" => "auction_list",
                "options" => [
                    [
                        "label" => "Open Color",
                        "description" => "Color for open auctions",
                        "type" => "color",
                        "settings" => "open_color",
                        "default" => "#9fb94a"
                    ],
                    [
                        "label" => "Presale Color",
                        "description" => "Color for presale auctions",
                        "type" => "color",
                        "settings" => "presale_color",
                        "default" => "#e94d70"
                    ],
                    [
                        "label" => "Preview Color",
                        "description" => "Color for preview auctions",
                        "type" => "color",
                        "settings" => "preview_color",
                        "default" => "#f78e1e"
                    ],
                    [
                        "label" => "Closed Color",
                        "description" => "Color for closed auctions",
                        "type" => "color",
                        "settings" => "closed_color",
                        "default" => "#6e828a"
                    ],
                ]
            ],[
                "title" => "Auction Page",
                "slug" => "auction_page",
                "options" => [
                    [
                        "label" => "Default Color",
                        "description" => "Color of item header by default",
                        "type" => "color",
                        "settings" => "default_color",
                        "default" => "#f78e1e"
                    ],
                    [
                        "label" => "Open Item Color",
                        "description" => "Color at the top of an auction item",
                        "type" => "color",
                        "settings" => "open_color",
                        "default" => "#9fb94a"
                    ],
                    [
                        "label" => "Live Color",
                        "description" => "Color of banner over a live auction item",
                        "type" => "color",
                        "settings" => "live_color",
                        "default" => "#f78e1e"
                    ],
                    [
                        "label" => "Sold Out Color",
                        "description" => "Sold out banner color",
                        "type" => "color",
                        "settings" => "sold_color",
                        "default" => "#e94d70"
                    ],
                    [
                        "label" => "Winning Color",
                        "description" => "Winning banner color",
                        "type" => "color",
                        "settings" => "winning_color",
                        "default" => "#9fb94a"
                    ],
                    [
                        "label" => "SubHeading Color",
                        "description" => "Sub heading color on the page (e.g. Categories)",
                        "type" => "color",
                        "settings" => "subheading_color",
                        "default" => "#9fb94a"
                    ],
                    [
                        "label" => "Sold/Bids Color",
                        "description" => "Text color for sold/bids counters",
                        "type" => "color",
                        "settings" => "sold_bids_color",
                        "default" => "#4cb0ce"
                    ],
                    [
                        "label" => "Tab Bg Color",
                        "description" => "",
                        "type" => "color",
                        "settings" => "tab_bg_color",
                        "default" => "#4cb0ce"
                    ],
                ]
            ],[
                "title" => "Notifications",
                "slug" => "notifications",
                "options" => [
                    [
                        "label" => "General Message Color",
                        "description" => "Color of general messages (e.g. Unpaid Invoice)",
                        "type" => "color",
                        "settings" => "general_color",
                        "default" => "#4CB0CE"
                    ],
                    [
                        "label" => "Winning Color",
                        "description" => "Color of winning messages",
                        "type" => "color",
                        "settings" => "winning_color",
                        "default" => "#9FB94A"
                    ],
                    [
                        "label" => "Losing Color",
                        "description" => "Color of losing messages",
                        "type" => "color",
                        "settings" => "losing_color",
                        "default" => "#E94D70"
                    ],
                    [
                        "label" => "Auction Message Color",
                        "description" => "Color of general auction messages",
                        "type" => "color",
                        "settings" => "broadcast_color",
                        "default" => "#1672B3"
                    ],
                    [
                        "label" => "Message Text Color",
                        "description" => "Color of message text",
                        "type" => "color",
                        "settings" => "message_text_color",
                        "default" => "#ffffff"
                    ],
                    [
                        "label" => "Message Font Family",
                        "description" => "Font family for messages",
                        "type" => "select",
                        "settings" => "messages_font",
                        "default" => "Lato",
                        "choices" => $fontFaces
                    ],
                    [
                        "label" => "Timer Bg Color",
                        "description" => "Timer banner bg color",
                        "type" => "color",
                        "settings" => "timer_color",
                        "default" => "#E94D70"
                    ],
                    [
                        "label" => "SocketDown Color",
                        "description" => "Unable to connect bg color",
                        "type" => "color",
                        "settings" => "unable_connect_color",
                        "default" => "#E94D70"
                    ],
                ]
            ],[
                "title" => "Item Detail Page",
                "slug" => "item_detail_page",
                "options" => [
                    [
                        "label" => "Item Name Font",
                        "description" => "Font family for item name",
                        "type" => "select",
                        "settings" => "item_name_font",
                        "default" => "Lato",
                        "choices" => $fontFaces
                    ],
                    [
                        "label" => "Category Name Font",
                        "description" => "Font family for category",
                        "type" => "select",
                        "settings" => "category_name_font",
                        "default" => "Lato",
                        "choices" => $fontFaces
                    ],
                    [
                        "label" => "Bid controls color",
                        "description" => "Bidder controls and minimum bid font color",
                        "type" => "color",
                        "settings" => "bid_controls_color",
                        "default" => "#9fb94a"
                    ],
                    [
                        "label" => "Bid Button color",
                        "description" => "Bid button bg color",
                        "type" => "color",
                        "settings" => "bid_button_color",
                        "default" => "#9fb94a"
                    ],
                    [
                        "label" => "MaxBid Color",
                        "description" => "Max Bid bg color",
                        "type" => "color",
                        "settings" => "maxbid_color",
                        "default" => "#b6c0c5"
                    ],
                    [
                        "label" => "Buy It Now Color",
                        "description" => "Buy It Now Bg Color",
                        "type" => "color",
                        "settings" => "buy_it_now_color",
                        "default" => "#e94d70"
                    ],
                ]
            ],
        ];

        $wp_customize->add_panel( 'handbid', array(
            'title' => __( 'HANDBID' ),
            'priority' => 160,
        ) );

        foreach($sections as $section){
            $wp_customize->add_section( $section["slug"] , array(
                'title' => $section["title"],
                'description'   => (isset($section["description"]))?$section["description"]:"",
                'capability'     => 'edit_theme_options',
                'panel' => 'handbid',
            ) );

            foreach($section["options"] as $option){
                $optionName = "handbid_theme_options[".$section["slug"]."][".$option["settings"]."]";
                $optionSlug = "handbid_theme_options_".$section["slug"]."_".$option["settings"];


                if($option["type"] == "color") {
                    $wp_customize->add_setting($optionName, array(
                        'default' => (isset($option["default"])) ? $option["default"] : "",
                        'sanitize_callback' => 'sanitize_hex_color',
                        'capability' => 'edit_theme_options',
                        'type' => 'option',
                    ));

                    $wp_customize->add_control(new WP_Customize_Color_Control($wp_customize, $optionName, array(
                        'label' => $option["label"],
                        'section' => $section["slug"],
                        'description'   => (isset($option["description"]))?$option["description"]:"",
                        'settings' => $optionName,
                    )));
                }
                elseif($option["type"] == "select") {
                    $wp_customize->add_setting(
                        $optionName,
                        array(
                            'default' => (isset($option["default"])) ? $option["default"] : "",
                            'transport' => 'refresh',
                            'capability' => 'edit_theme_options',
                            'type' => 'option'
                        )
                    );

                    $wp_customize->add_control($optionSlug, array(
                        'default' => (isset($option["default"])) ? $option["default"] : "",
                        'label' => $option["label"],
                        'section' => $section["slug"],
                        'settings' => $optionName,
                        'description'   => (isset($option["description"]))?$option["description"]:"",
                        'type'    => 'select',
                        'choices' => $option["choices"]
                    ));

                }
                else {
                    $wp_customize->add_setting(
                        $optionName,
                        array(
                            'default' => (isset($option["default"])) ? $option["default"] : "",
                            'transport' => 'postMessage',
                            'capability' => 'edit_theme_options',
                            'type' => 'option'
                        )
                    );

                    $wp_customize->add_control($optionSlug, array(
                        'label' => $option["label"],
                        'section' => $section["slug"],
                        'settings' => $optionName,
                    ));
                }



            }
        }
//
//
//
//
//
//
//
//
//        $wp_customize->add_section('themename_color_scheme', array(
//            'title'    => __('Color Scheme', 'themename'),
//            'description' => '',
//            'priority' => 120,
//        ));
//
//        //  =============================
//        //  = Text Input                =
//        //  =============================
//        $wp_customize->add_setting('themename_theme_options[text_test]', array(
//            'default'        => 'Arse!',
//            'capability'     => 'edit_theme_options',
//            'type'           => 'option',
//
//        ));
//
//        $wp_customize->add_control('themename_text_test', array(
//            'label'      => __('Text Test', 'themename'),
//            'section'    => 'themename_color_scheme',
//            'settings'   => 'themename_theme_options[text_test]',
//        ));
//
//        //  =============================
//        //  = Radio Input               =
//        //  =============================
//        $wp_customize->add_setting('themename_theme_options[color_scheme]', array(
//            'default'        => 'value2',
//            'capability'     => 'edit_theme_options',
//            'type'           => 'option',
//        ));
//
//        $wp_customize->add_control('themename_color_scheme', array(
//            'label'      => __('Color Scheme', 'themename'),
//            'section'    => 'themename_color_scheme',
//            'settings'   => 'themename_theme_options[color_scheme]',
//            'type'       => 'radio',
//            'choices'    => array(
//                'value1' => 'Choice 1',
//                'value2' => 'Choice 2',
//                'value3' => 'Choice 3',
//            ),
//        ));
//
//        //  =============================
//        //  = Checkbox                  =
//        //  =============================
//        $wp_customize->add_setting('themename_theme_options[checkbox_test]', array(
//            'capability' => 'edit_theme_options',
//            'type'       => 'option',
//        ));
//
//        $wp_customize->add_control('display_header_text', array(
//            'settings' => 'themename_theme_options[checkbox_test]',
//            'label'    => __('Display Header Text'),
//            'section'  => 'themename_color_scheme',
//            'type'     => 'checkbox',
//        ));
//
//
//        //  =============================
//        //  = Select Box                =
//        //  =============================
//        $wp_customize->add_setting('themename_theme_options[header_select]', array(
//            'default'        => 'value2',
//            'capability'     => 'edit_theme_options',
//            'type'           => 'option',
//
//        ));
//        $wp_customize->add_control( 'example_select_box', array(
//            'settings' => 'themename_theme_options[header_select]',
//            'label'   => 'Select Something:',
//            'section' => 'themename_color_scheme',
//            'type'    => 'select',
//            'choices'    => array(
//                'value1' => 'Choice 1',
//                'value2' => 'Choice 2',
//                'value3' => 'Choice 3',
//            ),
//        ));
//
//
//        //  =============================
//        //  = Image Upload              =
//        //  =============================
//        $wp_customize->add_setting('themename_theme_options[image_upload_test]', array(
//            'default'           => 'image.jpg',
//            'capability'        => 'edit_theme_options',
//            'type'           => 'option',
//
//        ));
//
//        $wp_customize->add_control( new WP_Customize_Image_Control($wp_customize, 'image_upload_test', array(
//            'label'    => __('Image Upload Test', 'themename'),
//            'section'  => 'themename_color_scheme',
//            'settings' => 'themename_theme_options[image_upload_test]',
//        )));
//
//        //  =============================
//        //  = File Upload               =
//        //  =============================
//        $wp_customize->add_setting('themename_theme_options[upload_test]', array(
//            'default'           => 'arse',
//            'capability'        => 'edit_theme_options',
//            'type'           => 'option',
//
//        ));
//
//        $wp_customize->add_control( new WP_Customize_Upload_Control($wp_customize, 'upload_test', array(
//            'label'    => __('Upload Test', 'themename'),
//            'section'  => 'themename_color_scheme',
//            'settings' => 'themename_theme_options[upload_test]',
//        )));
//
//
//        //  =============================
//        //  = Color Picker              =
//        //  =============================
//        $wp_customize->add_setting('themename_theme_options[link_color]', array(
//            'default'           => '#000',
//            'sanitize_callback' => 'sanitize_hex_color',
//            'capability'        => 'edit_theme_options',
//            'type'           => 'option',
//
//        ));
//
//        $wp_customize->add_control( new WP_Customize_Color_Control($wp_customize, 'link_color', array(
//            'label'    => __('Link Color', 'themename'),
//            'section'  => 'themename_color_scheme',
//            'settings' => 'themename_theme_options[link_color]',
//        )));
//
//
//        //  =============================
//        //  = Page Dropdown             =
//        //  =============================
//        $wp_customize->add_setting('themename_theme_options[page_test]', array(
//            'capability'     => 'edit_theme_options',
//            'type'           => 'option',
//
//        ));
//
//        $wp_customize->add_control('themename_page_test', array(
//            'label'      => __('Page Test', 'themename'),
//            'section'    => 'themename_color_scheme',
//            'type'    => 'dropdown-pages',
//            'settings'   => 'themename_theme_options[page_test]',
//        ));
//
//        // =====================
//        //  = Category Dropdown =
//        //  =====================
//        $categories = get_categories();
//        $cats = array();
//        $i = 0;
//        foreach($categories as $category){
//            if($i==0){
//                $default = $category->slug;
//                $i++;
//            }
//            $cats[$category->slug] = $category->name;
//        }
//
//        $wp_customize->add_setting('_s_f_slide_cat', array(
//            'default'        => $default
//        ));
//        $wp_customize->add_control( 'cat_select_box', array(
//            'settings' => '_s_f_slide_cat',
//            'label'   => 'Select Category:',
//            'section'  => '_s_f_home_slider',
//            'type'    => 'select',
//            'choices' => $cats,
//        ));
    }



}