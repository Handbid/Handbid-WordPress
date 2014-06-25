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

        $path = '';
        if(substr($templatePath, 0, 1) == '/') {
            $path = $templatePath;
        }
        else
        {
            $path = $this->basePath . '/' . $templatePath;
        }

        $view = new HandbidView($path  . '.phtml', $vars);
        return $view->render();
    }
}