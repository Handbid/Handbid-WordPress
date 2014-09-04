## Shortcodes

Shortcodes can be found in [`lib/HandbidShortCodeController.php`](/lib/HandbidShortCodeController.php) inside `init()`.

Table of Contents
===
- [Auctions](#auctions)
- [Items](#items)
- [Organizations](#organizations)
- [Bidder](#bidder)
- [Control Flow](#control-flow)
- [Authentication](#authentication)
- [Customization](#customization)

### Auctions
To achieve a list of auctions we can pass a few parameters to the [handbid_auction_list] shortcode.
By default this shortcode will default to upcoming auctions but you can change that by changing the type to "all" or "past"
```
[handbid_auction_list]
```


ShortCode                      |  Optional Attributes                           | Template Vars
-------------------------------|------------------------------------------------|--------------
[handbid_auction_list]         | <ul><li>type="{all,upcoming,past}"</li> <li>page="{0,...,25}"</li> <li>page_size="{{0,...,25}}"</li> <li>sort_field="{{any_field_you_want}}"</li> <li>sort_direction="{asc,dsc}"</li> <li>id="{{any_unique_id_you_want_for_the_pag}}"</li></ul> | <ul><li>auctions</li><li>total</li><li>id</li><li>total</li><li>page_size</li><li>page</li></ul>
[handbid_auction_banner]       | None                                           | <ul><li>auction</li><li>coordinates</li><li>winningBids</li><li>losingBids</li><li>purchases</li> <li>profile</li><li>proxies</li></ul>
[handbid_auction_details]      | None                                           | auction
[handbid_auction_item_list]    | None                                           | <ul><li>items</li><li>auction</li></ul>


If you want to specify which auction you want the to display ( other than the default one ) on a certain page you can do so by passing an auction key to the argument "auctionKey" in the shortcode.


```
[handbid_auction_banner auctionKey="handbid-demo-auction"]
```

### Items
Handbid_item is the generic item shortcode to cover the most basic functionality. The view receives an item which is the current
it. From there you can [customize](#customization) the template to suit your needs.
```
[handbid_item]
```

`handbid_bid` shortcode gives you the ability to access item, bids, profile. This will allow you to
retrieve place bids and show bid history.
```
[handbid_bid]
```

### Organizations
Querying and presenting an organization is one of the more complex features from the Handbid plugin. You will have access to a
few shortcodes that can cover most basic use cases. [handbid_organization_list] shortcode shows a list for all organizations where
[handbid_organization_details] shows the details for a specific organization. Then there is [handbid_organization_auctions] that
will ( as the shortcode name describes ) show a list of the organization's auctions

### Bidder
An important part of Handbid is allow for the [authentication](#authentication) of bidders and allow them to bid. These groups of
shortcodes will allow a bidder to update their profile information as well as viewing their current status on items.


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

### Authentication
There is a shortcode plugin to allow users to login / signup with Handbid, this will drop in a connect to handbid button.
```
[handbid_connect]
```

Once logged in you can use the [Logged in / Logged Out Shortcodes](#control-flow) to show or hide content based on user status.
To log out send the uses to /handbid-logout to log them out

### Customization
This is the file that maps all of the functions to call when a wordpress shortcode is called.
If you want to override a template with a local one, add in the get_template_directory to get the current themes directory and navigate to your file,
you do not need to add an extension to the file, it will be appended on ( .phtml )

```
[handbid_auction_banner template="views/auction/banner"]
```

[Back to main doc](/README.md)