# Strip

_An Unobtrusive Responsive Lightbox_

Strip is a Lightbox that only partially covers the page. This leaves room to interact with the page on larger screens while giving smaller devices the classic Lightbox experience.

![screenshot](https://cloud.githubusercontent.com/assets/5575/4969788/ec4fc80e-686c-11e4-8406-614db6980325.jpg)

- [Strip](#strip)
  - [Usage](#usage)
    - [Installation](#installation)
    - [Basic Usage](#basic-usage)
    - [Groups](#groups)
  - [Media types](#media-types)
    - [Image](#image)
    - [Youtube](#youtube)
    - [Vimeo](#vimeo)
  - [Javascript API](#javascript-api)
      - [Groups](#groups-1)
      - [Links](#links)
  - [Options](#options)
  - [Callbacks](#callbacks)
  - [Skins](#skins)
    - [Default options](#default-options)
    - [Changing the default skin](#changing-the-default-skin)

## Usage

### Installation

Include Strip below the latest 3.x release of [jQuery](https://www.jquery.com/):

```html
<script
  type="text/javascript"
  src="https://code.jquery.com/jquery-3.6.0.min.js"
></script>
<script type="text/javascript" src="/js/strip.pkgd.min.js"></script>
<link rel="stylesheet" type="text/css" href="/css/strip.css" />
```

Alternatively Strip can be installed using [npm](https://npmjs.com/package/@staaky/strip):

```bash
npm install @staaky/strip
```

### Basic Usage

The most basic way to use Strip is by adding the class `strip` to a link:

```html
<a href="image.jpg" class="strip">Show image</a>
```

A caption can be added using the data-strip-caption attribute:

```html
<a href="image.jpg" class="strip" data-strip-caption="Caption below the image"
  >Caption</a
>
```

Or customize Strip by putting [options](#options) on the `data-strip-options` attribute:

```html
<a
  href="http://vimeo.com/32071937"
  class="strip"
  data-strip-options="side: 'top'"
  >Options</a
>
```

### Groups

Create groups by giving links a `data-strip-group` attribute with a unique name:

```html
<a href="image1.jpg" class="strip" data-strip-group="mygroup">Image 1</a>
<a href="image2.jpg" class="strip" data-strip-group="mygroup">Image 2</a>
```

The `data-strip-group-options` attribute can be used to set options for all items in the group:

```html
<a
  href="image1.jpg"
  class="strip"
  data-strip-group="shared-options"
  data-strip-group-options="loop: false, maxWidth: 500"
  >This group</a
>
<a href="image2.jpg" class="strip" data-strip-group="shared-options"
  >has shared options</a
>
```

## Media types

Strip attempts to automatically detect the media type using the given url. The type can also be set to one of the following values using the `data-strip-type` attribute: `image`, `youtube` or `vimeo`.

### Image

Most of the time setting the type will not be required for images, it will be required in cases where Strip cannot detect it based on the url:

```html
<a href="/images/?id=69420" class="strip" data-strip-type="image">Image</a>
```

### Youtube

Strip will detect Youtube links and automatically embed them:

```html
<a href="http://www.youtube.com/watch?v=c0KYU2j0TM4" class="strip">Youtube</a>
```

Options can be set using the `youtube` option, see [YouTube Embedded Players and Player Parameters](https://developers.google.com/youtube/player_parameters?playerVersion=HTML5) for all the available options.

```html
<a
  href="http://www.youtube.com/watch?v=5XD2kNopsUs"
  class="strip"
  data-strip-options="
      width: 853,
      height: 480,
      youtube: { autoplay: 0 }
    "
  >Youtube - Dimensions and options</a
>
```

### Vimeo

Strips embeds Vimeo videos using the Vimeo Player API.

```html
<a href="http://vimeo.com/32071937" class="strip">Vimeo</a>
```

Options can be set using the `vimeo` option, see [Vimeo Player Embedding](https://developer.vimeo.com/player/embedding) for all the available options.

## Javascript API

The API allows Strip to be used with Javascript, as an alternative to using the `strip` class on links.

<table>
<thead>
  <tr>
    <th>Method</th>
    <th></th>
  </tr>
</thead>
<tbody>
<tr><td valign="top">

`Strip.show()`

</td><td>

A single item can be shown by giving `Strip.show()` a url:

```js
Strip.show("image.jpg");
```

Add a caption by using an object instead:

```js
Strip.show({
  url: "image.jpg",
  caption: "Caption for this image",
});
```

This object also accepts [options](#options) to customize Strip:

```js
Strip.show({
  url: "http://vimeo.com/32071937",
  options: {
    side: "top",
  },
});
```

#### Groups

Groups can be shown by giving `Strip.show()` an array with multiple items:

```js
// use urls
Strip.show(["image1.jpg", "image2.jpg"]);

// or objects
Strip.show([
  { url: "image1.jpg", caption: "Caption for this image" },
  { url: "image2.jpg", caption: "Another caption" },
]);
```

[Options](#options) for the entire group can be set using the second argument:

```js
Strip.show(["image1.jpg", "image2.jpg"], {
  loop: false,
  maxWidth: 500,
});
```

Open Strip at a specific position by setting a number as the last argument:

```js
Strip.show(["image1.jpg", "image2.jpg"], 2);
```

#### Links

Links that use the strip class can also be opened by passing `Strip.show()` an element:

```js
Strip.show($("#elementid")[0]);
```

</td></tr>
 <tr><td valign="top">

`Strip.hide()`

</td><td>

Close Strip at any time by calling `Strip.hide()`:

```js
Strip.hide();
```

</td></tr>
 <tr><td valign="top">

`Strip.disable()`

</td><td>

Disables Strip. When disabled, links using the `strip` class will no longer open Strip but work as regular links. Calls to `Strip.show()` will use a fallback to make them behave like regular links.

```js
Strip.disable();
```

Use `Strip.fallback(false)` should you need to disable this fallback as well:

```js
Strip.fallback(false).disable();
```

</td></tr>
 <tr><td valign="top">

`Strip.enable()`

</td><td>

Enable Strip if it was previously disabled.

```js
Strip.enable();
```

</td></tr>
 <tr><td valign="top">

`Strip.fallback()`

</td><td>

When Strip is disabled it will fallback to making `Strip.show()` calls open as regular links. By disabling this fallback API calls will do nothing at all.

```js
Strip.fallback(false);
```

</td></tr>
 <tr><td valign="top">

`Strip.setDefaultSkin()`

</td><td>

Sets the name of the default skin, this skin will be used when no `skin` option is provided.

```js
Strip.setDefaultSkin("custom");
```

</td></tr>

</tbody>
</table>

## Options

<table>
<thead>
  <tr>
    <th>Option</th>
    <th></th>
  </tr>
</thead>
<tbody>
<tr><td valign="top">

`effects`

</td><td>

Sets the duration of individual effects, or disables them when set to _false_.

```
effects: false
```

These are all available effects:

```js
effects: {
  spinner: { show: 200, hide: 200 },
  transition: { min: 175, max: 250 },
  ui: { show: 0, hide: 200 },
  window: { show: 300, hide: 300 }
}
```

</td></tr>
<tr><td valign="top">

`hideOnClickOutside`

</td><td>

Hide Strip when clicking outside of it or an element that could open it, enabled by default.

```
hideOnClickOutside: false
```

</td></tr>
<tr><td valign="top">

`keyboard`

</td><td>

Enable or disable individual keyboard buttons or all of them when set to _false_.

```
keyboard: false
```

Or use an object to toggle individual buttons:

```js
keyboard: {
  left: true,
  right: true,
  esc: false
}
```

**Note:** `youtube` and `vimeo` will always have left and right disabled, because a video could require these keys.

</td></tr>
<tr><td valign="top">

`loop`

</td><td>

When set to true a group becomes a loop, making it possible to move between the first and last item:

```
loop: true
```

</td></tr>
<tr><td valign="top">

`maxHeight`

</td><td>

Sets a maximum height for the content.

```
maxHeight: 500
```

</td></tr>
<tr><td valign="top">

`maxWidth`

</td><td>

Sets a maximum width for the content.

```
maxWidth: 500
```

</td></tr>
<tr><td valign="top">

`overlap`

</td><td>

Allows buttons to overlap the content when set to _true_, which is the default. Disabling overlap will cause buttons to be positioned outside of the content.

```
overlap: false
```

**Note:** Vimeo and Youtube always have `overlap: false` because overlapping buttons could otherwise prevent interaction with the video.

</td></tr>
<tr><td valign="top">

`position`

</td><td>

Show or hide the position indicator.

```
position: false
```

</td></tr>
<tr><td valign="top">

`preload`

</td><td>

Sets the items to preload before and after the current item, or disables preloading when set to _false_.

```
preload: [1,2] // preload 1 before and 2 after
```

```
preload: false // disables preloading
```

</td></tr>
<tr><td valign="top">

`side`

</td><td>

Set the side to position Strip on to `top`, `bottom`, `left` or `right`.

```
side: 'top'
```

</td></tr>
<tr><td valign="top">

`skin`

</td><td>

Sets the skin. If you've provided default options for this skin they'll be applied as a starting point for other options. The default skin is `strip`.

```
skin: 'custom'
```

</td></tr>
<tr><td valign="top">

`spinner`

</td><td>

Disables the loading icon when set to _false_.

```
spinner: false
```

</td></tr>
<tr><td valign="top">

`toggle`

</td><td>

Clicking elements will toggle Strip, this behavior can be disabed by setting `toggle` to _false_. Doing so will keep Strip open even if an element is clicked twice.

```
toggle: false
```

**Note:** `Strip.show()` calls don't use toggle behavior, this only works for elements with `class='strip'`

</td></tr>
<tr><td valign="top">

`vimeo`

</td><td>

Sets the player parameters of a Vimeo video, available options can be found in the Vimeo documentation: [Vimeo Player Embedding](https://developer.vimeo.com/player/embedding).

```js
vimeo: {
  autoplay: 1,
  title: 1,
  byline: 1,
  portrait: 0,
  loop: 0
}
```

</td></tr>
<tr><td valign="top">

`youtube`

</td><td>

youtubeSets the player parameters of a Youtube video, available options can be found in the Youtube documentation: [YouTube Embedded Players and Player Parameters](https://developers.google.com/youtube/player_parameters?playerVersion=HTML5).

```js
youtube: {
  autohide: 1,
  autoplay: 1,
  controls: 1,
  enablejsapi: 1,
  hd: 1,
  iv_load_policy: 3,
  loop: 0,
  modestbranding: 1,
  rel: 0
}
```

</td></tr>

</tbody>
</table>

## Callbacks

Callbacks can be used alongside other [Options](#options).

<table>
<thead>
  <tr>
    <th>Callback</th>
    <th></th>
  </tr>
</thead>
<tbody>
<tr><td valign="top">

`afterPosition`

</td><td>

A function to call after the position changed. The first argument is the current position within the group.

```js
afterPosition: function(position) {
  console.log("You've reached position " + position);
}
```

 </td></tr>
 <tr><td valign="top">

`afterHide`

</td><td>

A function to call after Strip is fully hidden.

```js
afterHide: function() {
  console.log('Strip is no longer visible');
}
```

 </td></tr>
  <tr><td valign="top">

`onResize`

</td><td>

This callback allows you to respond to Strip as it's resizing and make adjustments to your page. You could for example slide your page along or adjust margins. The parameters of onResize give you everything needed to make these adjustments.

```js
onResize: function(fxProperty, fxValue, side) {
  console.log(fxProperty, fxValue, side);
  // logs: 'width', 0, 'right' when starting the animation
  // and adjusts fxValue for each step in the animation
}
```

`fxProperty` is the property currently animated, which can be _'width'_ or _'height'_. `fxValue` is the value of that property at the current step in the animation. side is the current side Strip is positioned on, which can be _'top'_, _'bottom'_, _'left'_ or _'right'_.

 </td></tr>
  <tr><td valign="top">

`onShow`

</td><td>

A function to call when Strip comes into view.

```js
onShow: function() {
  console.log('Strip is visible');
}
```

 </td></tr>
</tbody></table>

## Skins

Custom skins can be added by copying the existing default skin called `strip`, rename it and modify it to your needs. It's recommended to do this in a separate css file so that `strip.css` can be upgraded without losing anything.

Once you have a skin in place it can be used with the `skin` option:

```
skin: 'custom'
```

### Default options

Default options can be provided for a skin by extending `Strip.Skins` with options for your custom skin:

```js
$.extend(Strip.Skins, {
  custom: {
    loop: false,
  },
});
```

### Changing the default skin

The default skin can be changed using `Strip.setDefaultSkin()`.

```js
Strip.setDefaultSkin("custom");
```

---

By [Nick Stakenburg](https://github.com/staaky)
