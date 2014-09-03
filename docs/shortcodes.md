## Shortcodes

Shortcodes can be found in [`lib/HandbidShortcodeController.php`](lib/HandbidShortcodeController.php) inside `init()`.

Table of Contents
===
- [Auctions](#auctions)
- [Items](#items)
- [Customization](#customization)

### Auctions
To achieve a list of auctions we can pass a few parameters to the [handbid_auction_list] shortcode.
By default this shortcode will default to upcoming auctions but you can change that by changing the type to "all" or "past"
```
    [handbid_auction_list]
```

If you want to specify which auction you want the to display ( other than the default one ) on a certain page you can do so by passing an auction key to the argument "auctionKey" in the shortcode.

```
   [handbid_auction_banner auctionKey="handbid-demo-auction"]
```

### Items
```
    [handbid_item template="views/item/description"]
```

### Customization
This is the file that maps all of the functions to call when a wordpress shortcode is called.
If you want to override a template with a local one, add in the get_template_directory to get the current themes directory and navigate to your file,
you do not need to add an extension to the file, it will be appended on ( .phtml )

```
    [handbid_auction_banner template="views/auction/banner"]
```

[Back to main doc](/)