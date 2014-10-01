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

    function has($name) {
        return array_key_exists($name, $this->context);
    }

    public function set($name, $value) {
        $this->context[$name] = $value;
    }

    public function get($name) {
        return $this->$name;
    }

    public function partial($filePath, $context = null) {

        $parts = explode(DIRECTORY_SEPARATOR, $this->fullPath);
        array_pop($parts);
        $path =  implode(DIRECTORY_SEPARATOR, $parts) . DIRECTORY_SEPARATOR . $filePath;

        $view = new HandbidView($path, $context);

        return $view->render();


    }

}