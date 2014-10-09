var Page = (function() {
var uid = 0;

function Page() { return this.initialize.apply(this, _slice.call(arguments)); };
$.extend(Page.prototype, {
  initialize: function(view, position, total) {
    this.view = view;
    this.dimensions = { width: 0, height: 0 };
    this.uid = uid++;

    // store position/total views for later use
    this._position = position;
    this._total = total;

    this.animated = false;
    this.visible = false;

    this.queues = {};
    this.queues.showhide = $({});
  },

  // create the page, this doesn't mean it's loaded
  // should happen instantly
  create: function() {
    if (this._created) return;

    Pages.element.append(this.element = $('<div>').addClass('strp-page')
      .append(this.container = $('<div>').addClass('strp-container'))
      .css({ opacity: 0 })
      .hide()
    );

    var hasPosition = (this.view.options.position && this._total > 1);
    if (this.view.caption || hasPosition) {
      this.element.append(this.info = $('<div>').addClass('strp-info')
        .append(this.info_padder = $('<div>').addClass('strp-info-padder'))
      );

      // insert caption first because it floats right
      if (hasPosition) {
        this.element.addClass('strp-has-position');

        this.info_padder.append($('<div>').addClass('strp-position')
          .html(this._position + ' / ' + this._total)
        );
      }

      if (this.view.caption) {
        this.info_padder.append(this.caption = $('<div>').addClass('strp-caption')
          .html(this.view.caption)
        );
      }
    }

    switch (this.view.type) {
      case 'image':
        this.container.append(this.content = $('<img>')
          .attr({ src: this.view.url })
        );
        break;

      case 'vimeo':
      case 'youtube':
        this.container.append(this.content = $('<div>'));
        break;
    }

    // ui
    this.element.addClass('strp' + (this.view.options.overlap ? '' : '-no') + '-overlap');

    // no sides
    if (this._total < 2) {
      this.element.addClass('strp-no-sides');
    }

    this.content.addClass('strp-content-element');

    this._created = true;
  },

  //surrounding
  _getSurroundingPages: function() {
    var preload;
    if (!(preload = this.view.options.preload)) return [];

    var pages = [],
        begin = Math.max(1, this._position - preload[0]),
        end = Math.min(this._position + preload[1], this._total),
        pos = this._position;

    // add the pages after this one first for the preloading order
    for (var i = pos;i<=end;i++) {
      var page = Pages.pages[Pages.uid][i-1];
      if (page._position != pos) pages.push(page);
    }

    for (var i = pos;i>=begin;i--) {
      var page = Pages.pages[Pages.uid][i-1];
      if (page._position != pos) pages.push(page);
    }

    return pages;
  },

  preloadSurroundingImages: function() {
    var pages = this._getSurroundingPages();

    $.each(pages, $.proxy(function(i, page) {
      page.preload();
    }, this));
  },

  // preload is a non-abortable preloader,
  // so that it doesn't interfere with our regular load
  preload: function() {
    if (this.preloading || this.preloaded
      || this.view.type != 'image'
      || !this.view.options.preload
      || this.loaded // page might be loaded before it's preloaded so also stop there
      ) {
      return;
    }

    // make sure the page is created
    this.create();

    this.preloading = true;


    new ImageReady(this.content[0], $.proxy(function(image) {
      this.loaded = true;
      this.preloading = false;
      this.preloaded = true;

      this.dimensions = {
        width: image.naturalWidth,
        height: image.naturalHeight
      };
    }, this));
  },

  // the purpose of load is to set dimensions
  // we use it to set dimensions even for content that doesn't load like youtube
  load: function(callback, isPreload) {
    // make sure the page is created
    this.create();


    // exit early if already loaded
    if (this.loaded) {
      if (callback) callback();
      return;
    }

    // abort possible previous (pre)load
    this.abort();

    // loading indicator, we don't show it when preloading frames
    this.loading = true;

    // start spinner
    Window.startLoading();

    switch(this.view.type) {
      case 'image':

        // if we had an error before just go through
        if (this.error) {
          if (callback) callback();
          return;
        }

        this.imageReady = new ImageReady(this.content[0], $.proxy(function(image) {
          // mark as loaded
          this._markAsLoaded();

          this.dimensions = {
            width: image.naturalWidth,
            height: image.naturalHeight
          };

          if (callback) callback();
        }, this), $.proxy(function() {
          // mark as loaded
          this._markAsLoaded();

          this.content.hide();
          this.container.append(this.error = $('<div>').addClass('strp-error'));
          this.element.addClass('strp-has-error');

          this.dimensions = {
            width: this.error.outerWidth(),
            height: this.error.outerHeight()
          };

          if (callback) callback();
        }, this));

        break;

      case 'vimeo':

        this.vimeoReady = new VimeoReady(this.view.url, $.proxy(function(data) {
          // mark as loaded
          this._markAsLoaded();

          this.dimensions = {
            width: data.dimensions.width,
            height: data.dimensions.height
          };

          if (callback) callback();
        }, this));

        break;

      case 'youtube':
        // mark as loaded
        this._markAsLoaded();

        this.dimensions = {
          width: this.view.options.width,
          height: this.view.options.height
        };

        if (callback) callback();
        break;
    }
  },

  // helper for load()
  _markAsLoaded: function() {
    this.loading = false;
    this.loaded = true;
    Window.stopLoading();
  },


  insertVideo: function(callback) {
    // don't insert a video twice
    if (this.playerIframe) {
      if (callback) callback();
      return;
    }

    switch (this.view.type) {
      case 'vimeo':
        var playerVars = $.extend({}, this.view.options.vimeo || {}),
            queryString = $.param(playerVars);

        this.content.append(this.playerIframe = $('<iframe webkitAllowFullScreen mozallowfullscreen allowFullScreen>').attr({
          src: '//player.vimeo.com/video/' + this.view._data.id + '?' + queryString,
          height: this.contentDimensions.height,
          width: this.contentDimensions.width,
          frameborder: 0
        }));

        if (callback) callback();
        break;

      case 'youtube':
        var playerVars = this.view.options.youtube || {},
            queryString = $.param(playerVars);

        this.content.append(this.playerIframe = $('<iframe webkitAllowFullScreen mozallowfullscreen allowFullScreen>').attr({
          src: '//www.youtube.com/embed/' + this.view._data.id + '?' + queryString,
          height: this.contentDimensions.height,
          width: this.contentDimensions.width,
          frameborder: 0
        }));

        if (callback) callback();
        break;
    }
  },


  raise: function() {
    // no need to raise if we're already the topmost element
    // this helps avoid unnecessary detaching of the element
    var lastChild = Pages.element[0].lastChild;
    if (lastChild && lastChild == this.element[0]) {
      return;
    }

    Pages.element.append(this.element);
  },

  show: function(callback) {
    var shq = this.queues.showhide;
    shq.queue([]); // clear queue

    this.animated = true;
    this.animatingWindow = false;


    shq.queue(function(next_stopped_inactive) {
      Pages.stopInactive();
      next_stopped_inactive();
    });

    shq.queue($.proxy(function(next_side) {
      Window.setSide(this.view.options.side, next_side);
    }, this));

    // make sure the current page is inserted
    shq.queue($.proxy(function(next_loaded) {

      // give the spinner the options of this page
      if (Window._spinner) {
        Window.setSpinnerSkin(this.view.options.skin);
        Window._spinner.setOptions(this.view.options.effects.spinner);
        Window._spinner.refresh();
      }

      // load
      this.load($.proxy(function() {
        this.preloadSurroundingImages();
        next_loaded();
      }, this));
    }, this));

    shq.queue($.proxy(function(next_utility) {
      this.raise();

      Window.setSkin(this.view.options.skin);
      Window.bindUI(); // enable ui controls

      // keyboard
      Keyboard.enable(this.view.options.keyboard);

      this.fitToWindow();

      next_utility();
    }, this));

    // we bind hide on click outside with a delay so API calls can pass through.
    // more in this in api.js
    shq.queue($.proxy(function(next_bind_hide_on_click_outside) {
      Window.timers.set('bind-hide-on-click-outside', $.proxy(function() {
        Window.bindHideOnClickOutside();
        next_bind_hide_on_click_outside();
      }, this), 1);
    }, this));

    // vimeo and youtube use this for insertion
    if (this.view.type == 'vimeo' || this.view.type == 'youtube') {
      shq.queue($.proxy(function(next_video_inserted) {
        this.insertVideo($.proxy(function() {
          next_video_inserted();
        }));
      }, this));
    }


    shq.queue($.proxy(function(next_shown_and_resized) {
      this.animatingWindow = true; // we're modifying Window size

      var fx = 3;

      // store duration on resize and use it for the other animations
      var z = this.getOrientation() == 'horizontal' ? 'width' : 'height';

      var duration = Window.resize(this[z], function() {
        if (--fx < 1) next_shown_and_resized();
      }, duration);

      this._show(function() {
        if (--fx < 1) next_shown_and_resized();
      }, duration);

      Window.adjustPrevNext(function(){
        if (--fx < 1) next_shown_and_resized();
      }, duration);

      if (Window._showUIOnResize) {
        Window.showUI(null, duration);

        // don't show the UI the next time, it'll show up
        // when we set this flag again
        Window._showUIOnResize = false;
      }

      // we also don't track this
      Pages.hideVisibleInactive(duration);
    }, this));


    shq.queue($.proxy(function(next_set_visible) {
      // Window.resize takes this into account
      this.animatingWindow = false;

      this.animated = false;

      this.visible = true;

      // NOTE: disabled to allow the UI to fade out at all times
      //Window.startUITimer();

      if (callback) callback();

      next_set_visible();
    }, this));
  },

  _show: function(callback, alternateDuration) {
    var duration = !Window.visible ? 0 :
                   ($.type(alternateDuration) == 'number') ? alternateDuration :
                   this.view.options.effects.transition.min;

    this.element.stop(true).show().fadeTo(duration || 0, 1, callback);
  },

  hide: function(callback, alternateDuration) {
    if (!this.element) return; // nothing to hide yet

    this.removeVideo();

    // abort possible loading
    this.abort();

    var duration = this.view.options.effects.transition.min;
    if ($.type(alternateDuration) == 'number') duration = alternateDuration;

    // hide video instantly
    var isVideo = this.view.type == 'youtube' || this.view.type == 'vimeo';
    if (isVideo) duration = 0;

    // stop, delay & effect
    this.element.stop(true)
    // we use alternative easing to minize background color showing through a lowered opacity fade
    // while images are trading places
    .fadeTo(duration, 0, 'stripEaseInCubic', $.proxy(function() {
      this.element.hide();
      this.visible = false;
      if (callback) callback();
    }, this));
  },

  // stop everything
  stop: function() {
    var shq = this.queues.showhide;
    shq.queue([]); // clear queue

    // stop animations
    if (this.element) this.element.stop(true);

    // stop possible loading
    this.abort();
  },


  removeVideo: function() {
    if (this.playerIframe) {
      // this fixes a bug where sound keep playing after
      // removing the iframe in IE10+
      this.playerIframe[0].src = '//about:blank';

      this.playerIframe.css({
        transform: 'translateZ(0px)'
      });

      this.playerIframe.remove();
      this.playerIframe = null;

      // WORKAROUND:
      // Chrome has a visual glitch when removing the iframe with video
      // from the page as it is initializing, this happens when you open a video
      // and instantly close it, but giving the iframe some time to initialize.
      // It keeps a visible element on the page not accessible by the DOM.
      //
      // a workaround is needed that forces a layout update, we do this on all
      // WebKit based browsers just in case
      //
      // further investigation is needed to file a proper bug report
      //
      if (Browser.WebKit && Support.css.transform) {
        // set translateZ on the html tag for a short duration.
        // best workaround we have right now

        // first look for a possible restore value we've stored on the html tag
        var $html = $('html'),
            restoreStyle = $html.data('strip-restore-style'),
            cssProp = Support.css.prefixed('transform');

        // if none was set find it
        if (!restoreStyle) {
          var style = $html.attr('style') || ' ';
          $html.data('strip-restore-style', style);
          restoreStyle = style;
        }

        // this is the hack causing the layout update
        var css = {};
        css[cssProp] = 'translateZ(0px)';
        $html.css(css);

        // restore the original style
        setTimeout(function() {
          if (restoreStyle === ' ') $html.removeAttr('style');
          else $html.attr('style', restoreStyle);
          $html.data('strip-restore-style', false);
        });

        // alternative workaround, not liking the full page overlap
        /*var div;
        $(document.body).append(div = $('<div>').css({
          position: 'fixed',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          background: 'transparent'
        }));

        setTimeout(function() {
          div.remove();
        });*/
      }

    }
  },

  remove: function() {
    this.stop();
    this.removeVideo();
    if (this.element) this.element.remove();
    this.visible = false;
    this.removed = true;
  },

  abort: function() {
    if (this.imageReady && !this.preloading) {
      this.imageReady.abort();
      this.imageReady = null;
    }

    if (this.vimeoReady) {
      this.vimeoReady.abort();
      this.vimeoReady = null;
    }

    this.loading = false;
    Window.stopLoading();
  },

  _getDimensionsFitToView: function() {
    var bounds = $.extend({}, this.dimensions),
        dimensions = $.extend({}, this.dimensions);

    var options = this.view.options;
    if (options.maxWidth) bounds.width = options.maxWidth;
    if (options.maxHeight) bounds.heigth = options.maxHeight;

    dimensions = Fit.within(dimensions, bounds);

    return dimensions;
  },

  getOrientation: function(side) {
    return (this.view.options.side == 'left' || this.view.options.side == 'right') ? 'horizontal' : 'vertical';
  },

  fitToWindow: function() {
    var page = this.element,
        dimensions = this._getDimensionsFitToView(),
        viewport = Bounds.viewport(),
        bounds = $.extend({}, viewport),
        orientation = this.getOrientation(),
        z = orientation == 'horizontal' ? 'width' : 'height';

    var container = page.find('.strp-container');

    // add the safety
    Window.element.removeClass('strp-measured');
    var safety = parseInt(Window.element.css('margin-' + (z == 'width' ? 'left' : 'bottom')));
    Window.element.addClass('strp-measured');
    bounds[z] -= safety;

    var paddingX = parseInt(container.css('padding-left')) + parseInt(container.css('padding-right')),
        paddingY = parseInt(container.css('padding-top')) + parseInt(container.css('padding-bottom')),
        padding = { x: paddingX, y: paddingY };

    bounds.width -= paddingX;
    bounds.height -= paddingY;

    var fitted = Fit.within(dimensions, bounds),
        contentDimensions = $.extend({}, fitted),
        content = this.content;

    // if we have an error message, use that as content instead
    if (this.error) {
      content = this.error;
    }

    var info = this.info,
        cH = 0;

    // when there's an info bar size has to be adjusted
    if (info) {
      // make sure the window and the page are visible during all of this
      var windowVisible = Window.element.is(':visible');
      if (!windowVisible) Window.element.show();

      var pageVisible = page.is(':visible');
      if (!pageVisible) page.show();

      // width
      if (z == 'width') {
        page.css({ width: fitted.width + paddingX + 'px' });

        var initialBoundsHeight = bounds.height;

        content.hide();
        cH = info.outerHeight();
        content.show();

        bounds.height = initialBoundsHeight - cH;

        contentDimensions = Fit.within(dimensions, bounds);

        // left/right requires further adjustment of the caption
        var initialImageSize = $.extend({}, contentDimensions),
            initialCH = cH,
            newCW,
            previousCH,
            shrunkW;

        var attempts = 4;

        while (attempts > 0 && (shrunkW = fitted.width - contentDimensions.width)) {
          page.css({ width: (fitted.width + paddingX - shrunkW) + 'px' });

          previousCH = cH;

          content.hide();
          cH = info.outerHeight();

          newCW = Math.max(this.caption  ? this.caption.outerWidth() + paddingX : 0,
                           this.position ? this.position.outerWidth() + paddingX : 0);
          content.show();

          if (cH == previousCH && (newCW <= (fitted.width + paddingX - shrunkW))) {
            // safe to keep this width, so store it
            fitted.width -= shrunkW;
          } else {
            // we try again with the increased caption
            bounds.height = initialBoundsHeight - cH;

            contentDimensions = Fit.within(dimensions, bounds);

            // restore if the last attempt failed
            if (attempts - 1 <= 0) {
              // otherwise the caption increased in height, go back
              page.css({ width: fitted.width + paddingX  + 'px' });
              contentDimensions = initialImageSize;
              cH = initialCH;
            }
          }

          attempts--;
        }

      } else {
        // fix IE7 not respecting width:100% in the CSS
        // so info height is measured correctly
        if (Browser.IE && Browser.IE < 8) {
          page.css({ width: Bounds.viewport().width });
        }

        // height
        content.hide();
        cH = info.outerHeight();
        content.show();

        bounds.height -= cH;
        contentDimensions = Fit.within(dimensions, bounds);
        fitted.height = contentDimensions.height;
      }

      // restore visibility
      if (!pageVisible) page.hide();
      if (!windowVisible) Window.element.hide();
    }


    // page needs a fixed width to remain properly static during animation
    if (z == 'width') {
      page.css({ width: fitted.width + paddingX + 'px' });
    } else {
      page.css({ height: fitted.height + paddingY + cH + 'px' });
    }

    container.css({ bottom: cH + 'px' });

    content.css(px($.extend({}, contentDimensions, {
      // floor because old IE doesn't render .5px properly
      'margin-left': Math.floor(-.5 * contentDimensions.width),
      'margin-top': Math.floor(-.5 * contentDimensions.height)
    })));

    if (this.playerIframe) {
      this.playerIframe.attr(contentDimensions);
    }

    this.contentDimensions = contentDimensions;

    // store for later use within animation
    this.width = fitted.width + paddingX;
    this.height = fitted.height + paddingY + cH;

    this.z = this[z];
  }
});

return Page;
})();
