<?php
/*
 *
 * Handbid view renderer
 *
 */

class HandbidViewRenderer {

    public $basePath;

    public function __construct($basePath) {
        $this->basePath = $basePath;
    }

    public function render($templatePath, $vars = []) {

        $template = file_get_contents($this->basePath . '/' . $templatePath);
        return $template;
    }
}