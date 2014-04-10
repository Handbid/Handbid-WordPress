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

        // Planning on allowing other file extensions and other rendering engines
        $view = new HandbidView($this->basePath . '/' . $templatePath . '.phtml', $vars);
        return $view->render();
    }
}