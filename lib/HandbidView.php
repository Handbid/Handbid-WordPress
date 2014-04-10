<?php

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

        ob_end_flush();

        return $out;

    }

    function __get($name)
    {
        return $this->context[$name];
    }

}