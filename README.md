![alt tag](https://raw.githubusercontent.com/Handbid/Handbid-WordPress/master/docs/images/handbid.png "Handbid")

Wordpress Plugin - Dev only (not for use by non-contributors yet)
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


### step 1 - get the code
We'll assume you are in the root of your Wordpress install.

```bash
$ git clone git@github.com:Handbi/Handbid-Worpdress.git wp-content/plugins/handbid
$ cd wp-content/plugins/handbid
$ git submodule init
$ git submodule update
$ cd lib/Handbid-Php
$ git checkout master
$ git pull
```

### step 2 - configure the plugin
Are you using [VVV](https://github.com/Varying-Vagrant-Vagrants/VVV)? If not, you should, it's pretty nice.

1. Visit local.wordpress.dev/wp-admin/plugins.php and activate the plugin
2. Select the `Handbid` option in the left menu of the admin area
3. Complete the form
4. Visit "Settings" > "Permalinks" and change "Default" to "Post Name"

###Questions for Jon
1. Why does [handbid_auction_results] show a list of auctions while [handbid_item_results] only show a single item?
    - I added [handbid_auction_list] and [handbid_item_list] and both do what is expected, but i left the old ones in there
2. [handbid_auction_details] acts just like [handbid_item_results]
    - I have created [handbid_item_details]
3. Just noticed there is a [handbid_auction] that seems to be what [handbid_auction_details] was supposed to be but is empty
    - suggest you remove unused shortcodes
4. Same empty shortcode exists for items [handbid_item]. it seems to have turned into [handbid_item_detail]
    - suggest you remove unused shortcodes
5. views/auction/logo.phtml puts all auctions in a <div class="clientListBlock">
    - suggest you change it to auctionListBlock (unless "client" means something)
6. there is a mix of camelCase and hyphen-seperated class names
     - suggest you go with hyphen '-' since that is what bootstrap and wordpress use (and this is the worpdress plugin)
7. views/auction/full.phtml errors out of the gate: https://www.dropbox.com/s/znmx83tn9ytdbqo/Screenshot%202014-08-25%2016.53.56.png?dl=0
    - suggest you test every template so they don't ship with errors
8. stylesheet id's are hyphen seperated for everything but ours (which are camelCase) https://www.dropbox.com/s/3xvpoewmz1z4nrr/Screenshot%202014-08-25%2017.21.10.png?dl=0
    - we should always stay consistent with the environment we are using (we are guests here)
9. shouldn't ShortCodeController be prefixed with Handbid? In fact, shouldn't every class we introduce into Wordpress be named that way? https://www.dropbox.com/s/voe1f9hznxh6nj3/Screenshot%202014-08-25%2017.23.31.png?dl=0
    - suggest we prefix `Handbid` to every class name where it is not already done
10. redundant code https://www.dropbox.com/s/vct0k5s0ebvny5h/Screenshot%202014-08-25%2017.31.04.png?dl=0
    - consider having itemDescription call item itemResults passing the proper template (or when a change is made, you'll be making the change in many spots)
