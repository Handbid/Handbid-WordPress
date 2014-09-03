![alt tag](docs/images/handbid.png "Handbid")

Wordpress Plugin - Dev only (not for use by non-contributors yet)
====

**This plugin is a work in progress**.

This plugin will give you everything you need to turn your Wordpress install into a full fledged silent auction, fund raising machine!

### step 1 - get the code
We'll assume you are in the root of your Wordpress install.

```bash
$ git clone git@github.com:Handbid/Handbid-WordPress.git wp-content/plugins/handbid
$ cd wp-content/plugins/handbid
$ git submodule init
$ git submodule update
$ cd lib/Handbid-Php
$ git checkout master
$ git pull
```

### step 2 - configure the plugin
Are you using [VVV](https://github.com/Varying-Vagrant-Vagrants/VVV)? If not, you should, it's pretty nice.

1. Visit /wp-admin/plugins.php in the browser and activate the plugin
2. Select the `Handbid` option in the left menu of the admin area
3. Complete the form
4. Visit "Settings" > "Permalinks" and change "Default" to "Post Name"

### Shortcodes
[Learn The Shortcodes](docs/shortcodes.md)

### Attribution

```html
<a href="http://handbid.com" target="_blank" class="powered-by-handbid">Powered by Handbid</a>
```

###Questions for Jon
1. Why does [handbid_auction_results] show a list of auctions while [handbid_item_results] only show a single item?
    - I added [handbid_auction_list] and [handbid_item_list] and both do what is expected, but i left the old ones in there
2. [handbid_auction_details] acts just like [handbid_item_results]
    - I have created [handbid_item_details]
3. there is a mix of camelCase and hyphen-seperated class names
     - suggest you go with hyphen '-' since that is what bootstrap and wordpress use (and this is the worpdress plugin)
4. redundant code https://www.dropbox.com/s/vct0k5s0ebvny5h/Screenshot%202014-08-25%2017.31.04.png?dl=0
    - consider having itemDescription call item itemResults passing the proper template (or when a change is made, you'll be making the change in many spots)
5. [handbid_item] seems redundant
