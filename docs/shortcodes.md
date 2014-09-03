## Shortcodes

Shortcodes can be found in [`lib/HandbidShortCodeController.php`](/lib/HandbidShortCodeController.php) inside `init()`.

Table of Contents
===
- [Auctions](#auctions)
- [Items](#items)
- [Control Flow](#control-flow)
- [Customization](#customization)

### Auctions
To achieve a list of aguctions we can pass a few parameters to the [handbid_auction_list] shortcode.
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

## Control flow
Handbid has the ability to know if a user is logged in vs logged out. You can do so by wrapping any logic you
wish to be only available to certain users by wrapping the content in the shortcode

```
    [handbid_is_logged_in]
        Logged In
    [/handbid_is_logged_in]
    [handbid_is_logged_out]
        Logged Out
    [/handbid_is_logged_out]
```

You are also provided with breadcrumb support which is a basic bread crumb system with the
ability to distinguish what auctions and or Item you are on, this will output a bread crumb menu

```
    [handbid_breadcrumb]
```

### Customization
This is the file that maps all of the functions to call when a wordpress shortcode is called.
If you want to override a template with a local one, add in the get_template_directory to get the current themes directory and navigate to your file,
you do not need to add an extension to the file, it will be appended on ( .phtml )

```
    [handbid_auction_banner template="views/auction/banner"]
```

[Back to main doc](/README.md)