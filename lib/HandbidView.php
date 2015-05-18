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
 * Class HandbidView
 *
 * Handles the actual rendering of the templates as well as variable mixins
 *
 */
class HandbidView {

    public $fullPath;
    public $context;

    function __construct($fullPath, $context) {
        $this->fullPath = $fullPath;
        $this->context = $context;
    }

    function render() {

        ob_start();

        include($this->fullPath);

        $out = ob_get_contents();

        ob_end_clean();

        return $out;

    }

    function __get($name)
    {
        return $this->context[$name];
    }

    function has($name) {
        return array_key_exists($name, $this->context);
    }

    public function set($name, $value) {
        $this->context[$name] = $value;
    }

    public function get($name, $default = null) {
        return isset($this->context[$name]) ? $this->$name : $default;
    }

    public function partial($filePath, $context = null) {

        $path = str_replace("/", DIRECTORY_SEPARATOR, $this->fullPath);
        $parts = explode(DIRECTORY_SEPARATOR, $path);
        array_pop($parts);
        $path =  implode(DIRECTORY_SEPARATOR, $parts) . DIRECTORY_SEPARATOR . $filePath;

        $view = new HandbidView($path, $context);

        return $view->render();

    }

    public function url($href, $query = [], $options = []) {

        $url = (isset($href)) ? $href : $_SERVER['REQUEST_URI'];

        @list($url, $_query) = explode('?', $url);

        if($_query != null) {
            parse_str($_query, $_query);
        }
        else {
            $_query = [];
        }

        $query = array_merge($_query, $query);

        $url .= '?' . http_build_query($query);

        return $url;
    }

}