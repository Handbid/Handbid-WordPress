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
 * Class HandbidViewRenderer
 *
 * This class is used for determining the template candidates
 *
 */
class HandbidViewRenderer
{

    public $basePath;

    public function __construct($basePath)
    {
        $this->basePath = $basePath;
    }

    public function render($templatePath, $vars = [])
    {
        $templates = is_array($templatePath) ? $templatePath : [$templatePath];
        // $templates = array_reverse($templates);
        foreach ($templates as $template) {

            $path = '';
            if ($template[0] == '/') {
                $path = $template;
            } else {
                $path = $this->basePath . '/' . $template;
            }

            $path .= '.phtml';

            if (file_exists($path)) {
                $view = new HandbidView($path, $vars);
                return $view->render();
            }

        }

        throw new \Exception('Failed to render templates. I looked for them at ' . print_r($templates, true));

    }
}