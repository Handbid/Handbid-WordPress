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

Now the joys of submodules, lets cd inside /lib/Handbid-Php and make sure we are on the master branch and pull just to make sure!
    - git checkout master
    - git pull

Next lets hop into the admin area and install the handbid plugin (/wp-admin/plugins.php)

Let's now hop into the handbid admin dashboard to configure our plugin, you can do so by either clicking the handbid link
in the menu bar or by going to (/wp-admin/admin.php?page=handbid-admin-dashboard).
    - Default Auction key will be used on any auction related shortcodes if a auctionkey is not provided as an attribute
    - Default Organization key will be used if an organization key is not passed as an attribute
    - Facebook App Id will be used for facebook comments support


Now that we have the plugin configured we need to make a change to the way wordpress renders its urls so that it is more human friendly to read.
    - Lets go to the admin sidebar menu and go "Settings" > "Permalinks", change the setting from "Default" to "Post Name"

