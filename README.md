![alt tag](https://raw.githubusercontent.com/Handbid/Handbid-WordPress/master/docs/images/handbid.png "Handbid")

Wordpress Plugin
====

**This plugin is a work in progress**.

This plugin will give you everything you need to turn your Wordpress install into a full fledged silent auction, fund raising machine!

## Setup

Clone this repo into you plugins folder (wp-content/plugins)
    - git clone git@github.com:Handbid/Handbid-WordPress.git handbid

Cd into the newly cloned handbid folder and init and update the submodule
    - git submodule init
    - git submodule update

Now that we have the plugin cloned and ready to go lets hop into the admin area and install it (/wp-admin/plugins.php)

Let's now hop into the handbid admin dashboard to configure our plugin, you can do so by either clicking the handbid link
in the menu bar or by going to (/wp-admin/admin.php?page=handbid-admin-dashboard).
    - Default Auction key will be used on any auction related shortcodes if a auctionkey is not provided as an attribute
    - Default Organization key will be used if an organization key is not passed as an attribute
    - Facebook App Id will be used for facebook comments support