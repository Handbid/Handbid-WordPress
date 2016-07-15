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
 * Class HandbidTestimonials
 *
 * Sets custom post type to work with Testimonials
 *
 */
class HandbidTestimonials
{

    private $postTypeSlug = 'hb_testimonial';
    private $metabox;

    public function __construct()
    {
        $this->metabox = new HBMetabox($this->postTypeSlug);
    }

    public function init()
    {
        $this->addTestimonialPostType();
    }

    public function addActions()
    {
        add_action('save_post', array($this->metabox, "saveMetaBoxData"));
    }

    private function addTestimonialPostType()
    {
        $labels = array(
            'name'               => __('Testimonial', 'handbid'),
            'singular_name'      => __('Testimonial', 'handbid'),
            'menu_name'          => __('Testimonials', 'handbid'),
            'name_admin_bar'     => __('Testimonial', 'handbid'),
            'add_new'            => __('Add New', 'handbid'),
            'add_new_item'       => __('Add New Testimonial', 'handbid'),
            'new_item'           => __('New Testimonial', 'handbid'),
            'edit_item'          => __('Edit Testimonial', 'handbid'),
            'view_item'          => __('View Testimonial', 'handbid'),
            'all_items'          => __('All Testimonials', 'handbid'),
            'search_items'       => __('Search Testimonials', 'handbid'),
            'parent_item_colon'  => __('Parent Testimonials:', 'handbid'),
            'not_found'          => __('No Testimonials found.', 'handbid'),
            'not_found_in_trash' => __('No Testimonials found in Trash.', 'handbid'),
        );

        $args = array(
            'labels'               => $labels,
            'description'          => __('Description.', 'handbid'),
            'public'               => true,
            'publicly_queryable'   => true,
            'show_ui'              => true,
            'show_in_menu'         => true,
            'query_var'            => true,
            'exclude_from_search'  => true,
            'rewrite'              => array('slug' => $this->postTypeSlug),
            'menu_icon'            => 'dashicons-thumbs-up',
            'capability_type'      => 'post',
            'menu_position'        => null,
            'supports'             => array('title', 'editor', 'thumbnail'),
            'register_meta_box_cb' => array($this->metabox, "addMetaboxesToPostType"),
        );

        register_post_type($this->postTypeSlug, $args);
    }

    public function addCustomSidebar()
    {
        register_sidebar(array(
                             'name'          => __('Testimonials Sidebar', 'handbid'),
                             'id'            => 'sidebar-testimonials',
                             'description'   => __('Widgets in this area will be shown on testimonials page.', 'handbid'),
                             'before_widget' => '<div id="%1$s" class="widget %2$s">',
                             'after_widget'  => '</div>',
                             'before_title'  => '<h4>',
                             'after_title'   => '</h4>',
                         ));
        register_widget('HBTestimonialsWidget');
    }

}


class HBMetabox extends StdClass
{

    private $metaBoxViews;
    private $metaBoxSlug;
    private $metaBoxTitle;
    private $postTypeSlug;


    public function __construct($postTypeSlug)
    {
        $this->postTypeSlug = $postTypeSlug;
        $this->metaBoxSlug  = "handbid-testimonial-meta-box";
        $this->metaBoxTitle = __("Testimonial Details", 'handbid');
        $this->metaBoxViews = new HBMetaboxView();
    }

    public function getPostTypeSlug()
    {
        return $this->postTypeSlug;
    }

    public function getMetaboxSlug()
    {
        return $this->metaBoxSlug;
    }

    public function getMetaboxTitle()
    {
        return $this->metaBoxTitle;
    }

    public function outputPostMetabox($post)
    {
        $fields = $this->getFields();
        $values = $this->getValues($post->ID, $fields);
        $this->metaBoxViews->outputPostMetabox(
            $post, $fields, $values
        );
    }

    public function getFields()
    {
        return array(
            array(
                "title"        => __("Person", 'handbid'),
                "type"         => "text",
                "name"         => "person",
                "default"      => "",
                "autocomplete" => array(),
            ),
            array(
                "title"        => __("Position of Person", 'handbid'),
                "type"         => "text",
                "name"         => "position",
                "default"      => "",
                "autocomplete" => array(),
            ),
            array(
                "title"        => __("Teaser Sentence", 'handbid'),
                "type"         => "text",
                "name"         => "teaser",
                "default"      => "",
                "autocomplete" => array(),
            ),
        );
    }

    function getValues($postID, &$fields = array())
    {

        $fields = count($fields) ? $fields : $this->getFields();
        $result = array();
        foreach ($fields as $fieldInd => $field)
        {
            if (isset($field["name"]))
            {
                $name          = $field["name"];
                $metaName      = "hb_" . $name;
                $value         = get_post_meta($postID, $metaName, true);
                $result[$name] = $value;
            }
        }

        return $result;
    }

    public function addMetaboxesToPostType()
    {
        add_meta_box($this->getMetaboxSlug(), $this->getMetaboxTitle(), array(
            $this,
            "outputPostMetabox",
        ), $this->postTypeSlug,
                     'normal', 'high');
    }


    public function saveMetaBoxData($postID)
    {
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE)
        {
            return;
        }

        if (!current_user_can('edit_post'))
        {
            return;
        }

        $hb_postmeta = $_POST["hb_postmeta"];
        if (is_array($hb_postmeta) and count($hb_postmeta))
        {
            foreach ($hb_postmeta as $name => $value)
            {
                $metaName = "hb_" . $name;
                update_post_meta($postID, $metaName, $value);
            }
        }
    }


}


class HBMetaboxView extends StdClass
{

    private function getFieldName($fieldName, $is_array = false)
    {
        $result = "hb_postmeta[" . $fieldName . "]";

        return $is_array ? $result . "[]" : $result;
    }

    private function getFieldID($fieldName, $append = false)
    {
        $result = "hb_postmeta_" . $fieldName;

        return $append ? $result . "_" . $append : $result;
    }


    private function outputFieldText($field, $value)
    {
        $value = ($value) ? $value : $field["default"];
        ?>
        <input type="text" class="form-control" style="width: 100%; margin-bottom: 10px;"
               name="<?php echo $this->getFieldName($field["name"]); ?>"
               id="<?php echo $this->getFieldID($field["name"]); ?>"
               data-value="<?php echo $value ?>"
               value="<?php echo $value ?>">
        <?php
    }

    private function outputFieldSelect($field, $value)
    {

        $options = (is_array($field["options"]) and count($field["options"])) ? $field["options"] : array();
        $value   = ($value) ? $value : $field["default"];

        ?>
        <select class="selectpicker"
                name="<?php echo $this->getFieldName($field["name"]); ?>"
                id="<?php echo $this->getFieldID($field["name"]); ?>">
            <?php if (count($options))
            { ?>
                <?php foreach ($options as $val => $title)
            {
                $selected = ($value == $val) ? " selected " : "";
                echo '<option ' . $selected . ' value="' . $val . '">' . $title . '</option>';
            } ?>
            <?php } ?>
        </select>
        <?php
    }


    private function outputField($field, $value)
    {
        switch ($field["type"])
        {
            case "text":
                $this->outputFieldText($field, $value);
                break;
            case "select":
                $this->outputFieldSelect($field, $value);
                break;
            default:
                $this->outputFieldText($field, $value);
        }
    }

    private function outputOptionsList($fields, $values)
    {
        foreach ($fields as $field)
        {
            $slug  = $field["name"];
            $style = "";
            if ($slug == "city")
            {
                $style = ($field["isNational"]) ? " display: none; " : $style;
            }
            ?>
            <div class="row bottom-margin row-of-field-<?php echo $slug; ?>" style="<?php echo $style; ?>">
                <div class="col-sm-12">
                    <label class="postmeta-field-label"
                           for="<?php echo $this->getFieldID($field["name"]) ?>"><b><?php echo $field["title"]; ?></b></label>
                </div>
                <div class="col-sm-12">
                    <?php $this->outputField($field, $values[$slug]); ?>
                    <?php if (isset($field["help"]))
                    {
                        echo "<p class='howto'>" . $field["help"] . "</p>";
                    } ?>
                </div>
            </div>
            <?php
        }
    }


    public function outputPostMetabox($post, $fields, $values)
    {

        ?>
        <div id="wrb-meta-wrap">
            <div role="tabpanel">
                <div class="bottom-buffer">
                    <?php
                    $this->outputOptionsList($fields, $values) ?>
                </div>
            </div>
        </div>
        <?php
    }


}

class HBTestimonialsWidget extends WP_Widget
{

    function __construct()
    {
        parent::__construct(
            'hb_testimonials_widget',
            __('Recent Testimonials', 'handbid'),
            array('description' => __('Widget for displaying recent Handbid Testimonials', 'handbid'),)
        );
    }

    function widget($args, $instance)
    {
        echo $args['before_widget'];
        if (!empty($instance['title']))
        {
            echo $args['before_title'] . apply_filters('widget_title', $instance['title']) . $args['after_title'];
        }
        echo '<p class="howto">' . $instance["subtitle"] . '</p>';

        $arguments        = array(
            'posts_per_page' => (int)$instance['number'],
            'orderby'        => 'date',
            'order'          => 'DESC',
            'post_type'      => 'hb_testimonial',
            'post_status'    => 'publish',
        );
        $testimonials_arr = get_posts($arguments);
        ?>
        <ul class="testimonials-list">
            <?php foreach ($testimonials_arr as $testimonial)
            { ?>
                <li>
                    <a href="<?php echo add_query_arg(["testimonial" => $testimonial->ID], get_permalink()); ?>"
                       data-testimonial-id="<?php echo $testimonial->ID; ?>">
                        <img
                            src="<?php echo wp_get_attachment_image_src(get_post_thumbnail_id($testimonial->ID), "medium")[0] ?>">
                        <span class="testimonial-title"><?php echo get_the_title($testimonial->ID); ?></span>
                        <span
                            class="testimonial-date"><?php echo date("F Y", strtotime($testimonial->post_date)) ?></span>
                    </a>
                </li>
            <?php } ?>
        </ul>
        <?php

        echo $args['after_widget'];
    }

    function update($new_instance, $old_instance)
    {
        $instance             = array();
        $instance['title']    = (!empty($new_instance['title'])) ? strip_tags($new_instance['title']) : '';
        $instance['subtitle'] = (!empty($new_instance['subtitle'])) ? strip_tags($new_instance['subtitle']) : '';
        $instance['number']   = (!empty($new_instance['number'])) ? strip_tags($new_instance['number']) : 3;

        return $instance;
    }

    function form($instance)
    {
        $title    = !empty($instance['title']) ? $instance['title'] : __('Recent Testimonials', 'text_domain');
        $subtitle = !empty($instance['subtitle']) ? $instance['subtitle'] : __('What customers say about Handbid', 'text_domain');
        $number   = !empty($instance['number']) ? $instance['number'] : 3;
        ?>
        <p>
            <label for="<?php echo $this->get_field_id('title'); ?>"><?php _e('Title:'); ?></label>
            <input class="widefat" id="<?php echo $this->get_field_id('title'); ?>"
                   name="<?php echo $this->get_field_name('title'); ?>" type="text"
                   value="<?php echo esc_attr($title); ?>">
        </p>
        <p>
            <label for="<?php echo $this->get_field_id('subtitle'); ?>"><?php _e('Subtitle:'); ?></label>
            <input class="widefat" id="<?php echo $this->get_field_id('title'); ?>"
                   name="<?php echo $this->get_field_name('subtitle'); ?>" type="text"
                   value="<?php echo esc_attr($subtitle); ?>">
        </p>
        <p>
            <label for="<?php echo $this->get_field_id('number'); ?>"><?php _e('Number:'); ?></label>
            <input class="widefat" id="<?php echo $this->get_field_id('number'); ?>"
                   name="<?php echo $this->get_field_name('number'); ?>" type="number"
                   value="<?php echo esc_attr($number); ?>" min="1">
        </p>
        <?php
    }
}