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

        $view = new HandbidView($this->basePath . '/' . $templatePath, $vars);
        return $view->render();
    }
}