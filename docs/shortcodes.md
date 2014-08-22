## Shortcodes

### Custom Templates
If you want to override a template with a local one, add in the get_template_directory to get the current themes directory and navigate to your file,
you do not need to add an extension to the file, it will be appended on ( .phtml )

```
    echo do_shortcode('[handbid_auction_banner template="views/auction/banner"]');
```

### Auction Specific Shortcode
If you want to specify which auction you want the to display the information on you can do so by passing an auction key to the argument "auctionKey" in the shortcode,
keep in mind that these are only useful for auction shortcodes and will not work with item shortcodes

```
   echo do_shortcode('[handbid_auction_banner auctionKey="my-awesome-auction"]');
```