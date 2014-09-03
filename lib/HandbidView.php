<?php

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

    public function get($name) {
        return $this->$name;
    }

}