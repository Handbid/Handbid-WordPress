<?php

class HandbidActionController {

    public $viewRenderer;

    public function __construct(HandbidViewRenderer $viewRenderer) {
        $this->viewRenderer = $viewRenderer;
    }

    function auctionDashboardAction() {

    }
    function currentPriceAjaxAction() {

    }
    function bidHistoryAjaxAction() {

    }
    function findItemsAjaxAction() {

    }
    function adminSettingsAction() {
        return $this->viewRenderer->render('views/admin/settings.phtml');
    }
}
