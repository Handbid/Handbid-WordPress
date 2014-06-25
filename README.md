# Handbid-WordPress

**This plugin is a work in progress**.

This plugin will give you everything you need to turn your Wordpress install into a full fledged silent auction, fund raising machine!

## Setup
Install the plugin, you will then see a Handbid option in the admin area on the left sidebar. In here is where you can insert your Consumer Key / Consumer Secret
as well as specify the Rest API Url ( defaults to https://rest.handbid.com ). After you put in your values you can then save the changes and test your rest endpoint credentials to ensure that it is configured properly.


## Shortcodes

### Custom Templates
If you want to override a template with a local one, add in the get_template_directory to get the current themes directory and navigate to your file,
you do not need to add an extension to the file, it will be appended on ( .phtml )

```
    echo do_shortcode('[handbid_auction_banner template="' . get_template_directory() . '/views/auction/banner"]');
```

### Auction Specific Shortcode
If you want to specify which auction you want the to display the information on you can do so by passing an auction key to the argument "auctionKey" in the shortcode,
keep in mind that these are only useful for auction shortcodes and will not work with item shortcodes

```
   echo do_shortcode('[handbid_auction_banner auctionKey="my-awesome-auction"]');
```