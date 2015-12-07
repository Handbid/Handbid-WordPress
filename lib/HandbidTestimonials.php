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

class HandbidTestimonials {

    private $postTypeSlug = 'hb_testimonial';
    private $metabox;

    public function __construct(){
        $this->metabox = new HBMetabox($this->postTypeSlug);
    }

    public function init(){
        $this->addTestimonialPostType();
    }

    public function addActions(){
        add_action( 'save_post', array( $this->metabox, "saveMetaBoxData"));
    }

    private function addTestimonialPostType(){
        $labels = array(
            'name'               => __( 'Testimonial', 'handbid' ),
            'singular_name'      => __( 'Testimonial', 'handbid' ),
            'menu_name'          => __( 'Testimonials', 'handbid' ),
            'name_admin_bar'     => __( 'Testimonial', 'handbid' ),
            'add_new'            => __( 'Add New', 'handbid' ),
            'add_new_item'       => __( 'Add New Testimonial', 'handbid' ),
            'new_item'           => __( 'New Testimonial', 'handbid' ),
            'edit_item'          => __( 'Edit Testimonial', 'handbid' ),
            'view_item'          => __( 'View Testimonial', 'handbid' ),
            'all_items'          => __( 'All Testimonials', 'handbid' ),
            'search_items'       => __( 'Search Testimonials', 'handbid' ),
            'parent_item_colon'  => __( 'Parent Testimonials:', 'handbid' ),
            'not_found'          => __( 'No Testimonials found.', 'handbid' ),
            'not_found_in_trash' => __( 'No Testimonials found in Trash.', 'handbid' )
        );

        $args = array(
            'labels'             => $labels,
            'description'        => __( 'Description.', 'handbid' ),
            'public'             => true,
            'publicly_queryable' => true,
            'show_ui'            => true,
            'show_in_menu'       => true,
            'query_var'          => true,
            'exclude_from_search'=> true,
            'rewrite'            => array( 'slug' => $this->postTypeSlug ),
            'menu_icon'          => 'dashicons-thumbs-up',
            'capability_type'    => 'post',
            'menu_position'      => null,
            'supports'           => array( 'title', 'editor', 'thumbnail'),
			'register_meta_box_cb' => array( $this->metabox, "addMetaboxesToPostType" )
        );

        register_post_type( $this->postTypeSlug, $args );
    }

}




class HBMetabox extends StdClass {

    private $metaBoxViews;
    private $metaBoxSlug;
    private $metaBoxTitle;
    private $postTypeSlug;


    public function __construct( $postTypeSlug ) {
        $this->postTypeSlug = $postTypeSlug;
        $this->metaBoxSlug  = "handbid-testimonial-meta-box";
        $this->metaBoxTitle = __( "Testimonial Details", HB_LANG );
        $this->metaBoxViews = new HBMetaboxView();
    }

    public function getPostTypeSlug() {
        return $this->postTypeSlug;
    }

    public function getMetaboxSlug() {
        return $this->metaBoxSlug;
    }

    public function getMetaboxTitle() {
        return $this->metaBoxTitle;
    }

    public function outputPostMetabox( $post ) {
        $fields = $this->getFields();
        $values = $this->getValues( $post->ID, $fields );
        $this->metaBoxViews->outputPostMetabox(
            $post, $fields, $values
        );
    }

    public function getFields() {
        return array(
            array(
                "title"        => __( "Person", HB_LANG ),
                "type"         => "text",
                "name"         => "person",
                "default"      => "",
                "autocomplete" => array(),
            ),
            array(
                "title"        => __( "Position of Person", HB_LANG ),
                "type"         => "text",
                "name"         => "position",
                "default"      => "",
                "autocomplete" => array(),
            ),
        );
    }

    function getValues( $postID, &$fields = array() ) {

        $fields = count( $fields ) ? $fields : $this->getFields();
        $result = array();
        foreach ( $fields as $fieldInd => $field ) {
            if ( isset( $field["name"] ) ) {
                $name            = $field["name"];
                $metaName        = "hb_" . $name;
                $value           = get_post_meta( $postID, $metaName, true );
                $result[ $name ] = $value;
            }
        }

        return $result;
    }

    public function addMetaboxesToPostType() {
        add_meta_box( $this->getMetaboxSlug(), $this->getMetaboxTitle(), array(
                $this,
                "outputPostMetabox"
            ), $this->postTypeSlug,
            'normal', 'high' );
    }


    public function saveMetaBoxData( $postID ) {
        if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
            return;
        }

        if ( ! current_user_can( 'edit_post' ) ) {
            return;
        }

        $hb_postmeta = $_POST["hb_postmeta"];
        if ( is_array( $hb_postmeta ) and count( $hb_postmeta ) ) {
            foreach ( $hb_postmeta as $name => $value ) {
                $metaName = "hb_" . $name;
                update_post_meta( $postID, $metaName, $value );
            }
        }
    }


}


class HBMetaboxView extends StdClass{

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
        $value = ($value) ? $value : $field["default"];

        ?>
        <select class="selectpicker"
                name="<?php echo $this->getFieldName($field["name"]); ?>"
                id="<?php echo $this->getFieldID($field["name"]); ?>">
            <?php if (count($options)) { ?>
                <?php foreach ($options as $val => $title) {
                    $selected = ($value == $val) ? " selected " : "";
                    echo '<option ' . $selected . ' value="' . $val . '">' . $title . '</option>';
                }?>
            <?php } ?>
        </select>
    <?php
    }


    private function outputField($field, $value)
    {
        switch ($field["type"]) {
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
        foreach ($fields as $field) {
            $slug = $field["name"];
            $style = "";
            if($slug == "city"){
                $style = ($field["isNational"])? " display: none; " : $style;
            }
            ?>
            <div class="row bottom-margin row-of-field-<?php echo $slug; ?>" style="<?php echo $style; ?>">
                <div class="col-sm-12">
                    <label class="postmeta-field-label"
                           for="<?php echo $this->getFieldID($field["name"]) ?>"><b><?php echo $field["title"]; ?></b></label>
                </div>
                <div class="col-sm-12">
                    <?php $this->outputField($field, $values[$slug]); ?>
                    <?php if (isset($field["help"])) {
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
                    $this->outputOptionsList($fields, $values)?>
                </div>
            </div>
        </div>
    <?php
    }



}