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


### Get up to speed
Handbid will create a few pages for you Auction, Auctions, Auction Item and Bidder Dashboard

- **Auctions** will list out your auctions for your organization. By default this will filter by upcoming, you can also use all or Past.
- **Auction** will be to view your default auction. You can send a user to /auction and they will see your auction.
- **Auction Item** will be for viewing an individual auction item, the url will be /auctions/{{auctionKey}}/item/{{itemKey}}
- **Bidder Dashboard** will be for managing and updating the currently logged in users profile.
- **Organizations** will be for viewing all organizations
- **Organization** will be for viewing a single organization's details

### Attribution

```html
<a href="http://handbid.com" target="_blank" class="powered-by-handbid">Powered by Handbid</a>
```
