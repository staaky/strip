/*!
 * Strip - A Less Intrusive Responsive Lightbox - v1.5.1
 * (c) 2014 Nick Stakenburg
 *
 * http://www.stripjs.com
 *
 * Licensing:
 * - Commercial: http://www.stripjs.com/license
 * - Non-commercial: http://creativecommons.org/licenses/by-nc-nd/3.0
 *
 */

// Use AMD or window
;(function(factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else if (jQuery && !window.Strip) {
    window.Strip = factory(jQuery);
  }
}(function($) {


var Strip = {
  version: '1.5.1'
};

Strip.Skins = {
  // the default skin
  'strip': { }
};

var Browser = (function(uA) {
  function getVersion(identifier) {
    var version = new RegExp(identifier + '([\\d.]+)').exec(uA);
    return version ? parseFloat(version[1]) : true;
  }

  return {
    IE: !!(window.attachEvent && uA.indexOf('Opera') === -1) && getVersion('MSIE '),
    Opera:  uA.indexOf('Opera') > -1 && ((!!window.opera && opera.version && parseFloat(opera.version())) || 7.55),
    WebKit: uA.indexOf('AppleWebKit/') > -1 && getVersion('AppleWebKit/'),
    Gecko:  uA.indexOf('Gecko') > -1 && uA.indexOf('KHTML') === -1 && getVersion('rv\:'),
    MobileSafari: !!uA.match(/Apple.*Mobile.*Safari/),
    Chrome: uA.indexOf('Chrome') > -1 && getVersion('Chrome/'),
    ChromeMobile: uA.indexOf('CrMo') > -1 && getVersion('CrMo/'),
    Android: uA.indexOf('Android') > -1 && getVersion('Android '),
    IEMobile: uA.indexOf('IEMobile') > -1 && getVersion('IEMobile/')
  };
})(navigator.userAgent);


var _slice = Array.prototype.slice;
var _ = {
  isElement: function(object) {
    return object && object.nodeType == 1;
  }
};


function px(source) {
  var destination = {};
  for (var property in source)
    destination[property] = source[property] + 'px';
  return destination;
}


// Fit
var Fit = {
  within: function(bounds, dimensions) {
    var options = $.extend({
      height: true,
      width: true
    }, arguments[2] || {});

    var size  = $.extend({}, dimensions),
        scale = 1,
        attempts = 5;

    var fit = { width: options.width, height: options.height };

    // adjust the bounds depending on what to fit (width/height)
    // start
    while (attempts > 0 &&
           ((fit.width  && size.width > bounds.width) ||
            (fit.height && size.height > bounds.height))) {

      // if both dimensions fall underneath a minimum, then don't event continue
      //if (size.width < 100 && size.height < 100) {
        var scaleX = 1, scaleY = 1;

        if (fit.width && size.width > bounds.width) {
          scaleX = (bounds.width / size.width);
        }
        if (fit.height && size.height > bounds.height) {
          scaleY = (bounds.height / size.height);
        }

        // we'll end up using the largest scaled down factor
        var scale = Math.min(scaleX, scaleY);

        // adjust current size, based on original dimensions
        size = {
          width: Math.round(dimensions.width * scale),
          height: Math.round(dimensions.height * scale)
        };
      //}

      attempts--;
    }

    // make sure size is never pressed into negative
    size.width = Math.max(size.width, 0);
    size.height = Math.max(size.height, 0);

    return size;
  }
};

// we only uses some of the jQueryUI easing functions
// add those with a prefix to prevent conflicts
$.extend($.easing, {
  stripEaseInCubic: function (x, t, b, c, d) {
    return c*(t/=d)*t*t + b;
  },

  stripEaseInSine: function (x, t, b, c, d) {
    return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
  },

  stripEaseOutSine: function (x, t, b, c, d) {
    return c * Math.sin(t/d * (Math.PI/2)) + b;
  }
});


var Support = (function() {
  var testElement = document.createElement('div'),
     domPrefixes = 'Webkit Moz O ms Khtml'.split(' ');

  function prefixed(property){
     return testAllProperties(property, 'prefix');
  };

  function testProperties(properties, prefixed ) {
   for ( var i in properties ) {
     if (testElement.style[ properties[i] ] !== undefined ) {
       return prefixed == 'prefix' ? properties[i] : true;
     }
   }
   return false;
  }

  function testAllProperties(property, prefixed ) {
   var ucProperty  = property.charAt(0).toUpperCase() + property.substr(1),
       properties   = (property + ' ' + domPrefixes.join(ucProperty + ' ') + ucProperty).split(' ');

   return testProperties(properties, prefixed);
  }

  // feature detect
  return {
    css: {
       animation: testAllProperties('animation'),
       transform: testAllProperties('transform'),
       prefixed: prefixed
    },

    svg: (!!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect),

    touch: (function() {
      try {
        return !!(('ontouchstart' in window) ||
          window.DocumentTouch && document instanceof DocumentTouch); // firefox on Android
      } catch (e) {
        return false;
      }
    })()

  };
})();


// add mobile touch to support
Support.mobileTouch = Support.touch &&
  (Browser.MobileSafari || Browser.Android || Browser.IEMobile || Browser.ChromeMobile
   || !/^(Win|Mac|Linux)/.test(navigator.platform) // otherwise, assume anything not on Windows, Mac or Linux is a mobile device
  );

var Bounds = {
  viewport: function() {
    var dimensions = {
      height: $(window).height(),
      width:  $(window).width()
    };

    // Mobile Safari has a bugged viewport height after scrolling
    if (Browser.MobileSafari) {
      var zoom = document.documentElement.clientWidth / window.innerWidth;
      dimensions.height = window.innerHeight * zoom;
    }

    return dimensions;
  }
};

/* ImageReady (standalone) - part of Voilà
 * http://github.com/staaky/voila
 * MIT License
 */
var ImageReady = function() {
  return this.initialize.apply(this, Array.prototype.slice.call(arguments));
};

$.extend(ImageReady.prototype, {
  supports: {
    naturalWidth: (function() {
      return ('naturalWidth' in new Image());
    })()
  },

  // NOTE: setTimeouts allow callbacks to be attached
  initialize: function(img, successCallback, errorCallback) {
    this.img = $(img)[0];
    this.successCallback = successCallback;
    this.errorCallback = errorCallback;
    this.isLoaded = false;

    this.options = $.extend({
      natural: true,
      pollFallbackAfter: 1000
    }, arguments[3] || {});

    // a fallback is used when we're not polling for naturalWidth/Height
    // IE6-7 also use this to add support for naturalWidth/Height
    if (!this.supports.naturalWidth || !this.options.natural) {
      setTimeout($.proxy(this.fallback, this));
      return;
    }

    // can exit out right away if we have a naturalWidth
    if (this.img.complete && $.type(this.img.naturalWidth) != 'undefined') {
      setTimeout($.proxy(function() {
        if (this.img.naturalWidth > 0) {
          this.success();
        } else {
          this.error();
        }
      }, this));
      return;
    }

    // we instantly bind to onerror so we catch right away
    $(this.img).bind('error', $.proxy(function() {
      setTimeout($.proxy(function() {
        this.error();
      }, this));
    }, this));

    this.intervals = [
      [1 * 1000, 10],
      [2 * 1000, 50],
      [4 * 1000, 100],
      [20 * 1000, 500]
    ];

    // for testing, 2sec delay
    //this.intervals = [[20 * 1000, 2000]];

    this._ipos = 0;
    this._time = 0;
    this._delay = this.intervals[this._ipos][1];

    // start polling
    this.poll();
  },

  poll: function() {
    this._polling = setTimeout($.proxy(function() {
      if (this.img.naturalWidth > 0) {
        this.success();
        return;
      }

      // update time spend
      this._time += this._delay;

      // use a fallback after waiting
      if (this.options.pollFallbackAfter &&
          this._time >= this.options.pollFallbackAfter &&
          !this._usedPollFallback) {
        this._usedPollFallback = true;
        this.fallback();
      }

      // next i within the interval
      if (this._time > this.intervals[this._ipos][0]) {
        // if there's no next interval, we asume
        // the image image errored out
        if (!this.intervals[this._ipos + 1]) {
          this.error();
          return;
        }

        this._ipos++;

        // update to the new bracket
        this._delay = this.intervals[this._ipos][1];
      }

      this.poll();
    }, this), this._delay);
  },

  fallback: function() {
    var img = new Image();
    this._fallbackImg = img;

    img.onload = $.proxy(function() {
      img.onload = function() {};

      if (!this.supports.naturalWidth) {
        this.img.naturalWidth = img.width;
        this.img.naturalHeight = img.height;
      }

      this.success();
    }, this);

    img.onerror = $.proxy(this.error, this);

    img.src = this.img.src;
  },

  abort: function() {
    if (this._fallbackImg) {
      this._fallbackImg.onload = function() { };
    }

    if (this._polling) {
      clearTimeout(this._polling);
      this._polling = null;
    }
  },

  success: function() {
    if (this._calledSuccess) return;
    this._calledSuccess = true;

    this.isLoaded = true;
    this.successCallback(this);
  },

  error: function() {
    if (this._calledError) return;
    this._calledError = true;

    this.abort();
    if (this.errorCallback) this.errorCallback(this);
  }
});

// Spinner
// Create pure CSS based spinners
function Spinner() { return this.initialize.apply(this, _slice.call(arguments)); };

// mark as supported
Spinner.supported = Support.css.transform && Support.css.animation;

$.extend(Spinner.prototype, {
  initialize: function(element) {
    this.element = $(element);
    if (!this.element[0]) return;

    this.classPrefix = 'strp-';

    this.setOptions(arguments[1] || {});

    this.element.addClass(this.classPrefix + 'spinner');
    this.element.append(this._rotate = $('<div>').addClass(this.classPrefix + 'spinner-rotate'));

    this.build();
    this.start();
  },

  setOptions: function(options) {
    this.options = $.extend({
      show: 200,
      hide: 200
    }, options || {});
  },

  build: function() {
    if (this._build) return;

    this._rotate.html('');

    var d = (this.options.length + this.options.radius) * 2,
        dimensions = { height: d, width: d };

    // we parse stuff below so make sure that happens with a visible spinner
    var is_vis = this.element.is(':visible');
    if (!is_vis) this.element.show();

    // find the amount of lines
    var frame, line;
    this._rotate.append(frame = $('<div>').addClass(this.classPrefix + 'spinner-frame')
      .append(line = $('<div>').addClass(this.classPrefix + 'spinner-line'))
    );

    var lines = parseInt($(line).css('z-index'));
    this.lines = lines;
    // now reset that z-index
    line.css({ 'z-index': 'inherit' });

    frame.remove();

    // reset visibility
    if (!is_vis) this.element.hide();

    // insert frames
    var color;
    for (var i = 0;i<lines;i++) {
      var frame, line;
      this._rotate.append(frame = $('<div>').addClass(this.classPrefix + 'spinner-frame')
        .append(line = $('<div>').addClass(this.classPrefix + 'spinner-line'))
      );

      color = color || line.css('color');
      line.css({ background: color });

      frame.css({ opacity: ((1 / lines) * (i+1)).toFixed(2) });

      var transformCSS = {};
      transformCSS[Support.css.prefixed('transform')] = 'rotate(' + ((360 / lines) * (i + 1)) + 'deg)';
      frame.css(transformCSS);
    }

    this._build = true;
  },

  start: function() {
    var rotateCSS = {};
    rotateCSS[Support.css.prefixed('animation')] = this.classPrefix + 'spinner-spin 1s infinite steps(' + this.lines + ')';
    this._rotate.css(rotateCSS);
  },

  stop: function() {
    var rotateCSS = {};
    rotateCSS[Support.css.prefixed('animation')] = 'none';
    this._rotate.css(rotateCSS);
  },

  show: function(callback) {
    this.build();
    this.start();

    this.element.stop(true).fadeTo(this.options.show, 1, callback);//deferred.resolve);
  },

  hide: function(callback) {
    this.element.stop(true).fadeOut(this.options.hide, $.proxy(function() {
      this.stop();
      if (callback) callback();
    }, this));
  },

  refresh: function() {
    this._build = false;
    this.build();
  }
});

function Timers() { return this.initialize.apply(this, _slice.call(arguments)); };
$.extend(Timers.prototype, {
  initialize: function() {
    this._timers = {};
  },

  set: function(name, handler, ms) {
    this._timers[name] = setTimeout(handler, ms);
  },

  get: function(name) {
    return this._timers[name];
  },

  clear: function(name) {
    if (name) {
      if (this._timers[name]) {
        clearTimeout(this._timers[name]);
        delete this._timers[name];
      }
    } else {
      this.clearAll();
    }
  },

  clearAll: function() {
    $.each(this._timers, function(i, timer) {
      clearTimeout(timer);
    });
    this._timers = {};
  }
});

// uses Types to scan a URI for info
function getURIData(url) {
  var result = { type: 'image' };
  $.each(Types, function(i, type) {
    var data = type.data(url);
    if (data) {
      result = data;
      result.type = i;
      result.url = url;
    }
  });

  return result;
}

function detectExtension(url) {
  var ext = (url || '').replace(/\?.*/g, '').match(/\.([^.]{3,4})$/);
  return ext ? ext[1].toLowerCase() : null;
}


var Types = {
  'image': {
    extensions: 'bmp gif jpeg jpg png webp',
    detect: function(url) {
      return $.inArray(detectExtension(url), this.extensions.split(' ')) > -1;
    },
    data: function(url) {
      if (!this.detect()) return false;

      return {
        extension: detectExtension(url)
      };
    }
  },

  'youtube': {
    detect: function(url) {
      var res = /(youtube\.com|youtu\.be)\/watch\?(?=.*vi?=([a-zA-Z0-9-_]+))(?:\S+)?$/.exec(url);
      if (res && res[2]) return res[2];

      res = /(youtube\.com|youtu\.be)\/(vi?\/|u\/|embed\/)?([a-zA-Z0-9-_]+)(?:\S+)?$/i.exec(url);
      if (res && res[3]) return res[3];

      return false;
    },
    data: function(url) {
      var id = this.detect(url);
      if (!id) return false;

      return {
        id: id
      };
    }
  },

  'vimeo': {
    detect: function(url) {
      var res = /(vimeo\.com)\/([a-zA-Z0-9-_]+)(?:\S+)?$/i.exec(url);
      if (res && res[2]) return res[2];

      return false;
    },
    data: function(url) {
      var id = this.detect(url);
      if (!id) return false;

      return {
        id: id
      };
    }
  }
};


var VimeoReady = (function() {

var VimeoReady = function() { return this.initialize.apply(this, _slice.call(arguments)); };
$.extend(VimeoReady.prototype, {
  initialize: function(url, callback) {
    this.url = url;
    this.callback = callback;

    this.load();
  },

  load: function() {
    // first try the cache
    var cache = Cache.get(this.url);

    if (cache) {
      return this.callback(cache.data);
    }

    var protocol = 'http' + (window.location && window.location.protocol == 'https:' ? 's' : '') + ':',
        video_id = getURIData(this.url).id;

    this._xhr = $.getJSON(protocol + '//vimeo.com/api/oembed.json?url=' + protocol + '//vimeo.com/' + video_id + '&callback=?', $.proxy(function(_data) {
      var data = {
        dimensions: {
          width: _data.width,
          height: _data.height
        }
      };

      Cache.set(this.url, data);

      if (this.callback) this.callback(data);
    }, this));
  },

  abort: function() {
    if (this._xhr) {
      this._xhr.abort();
      this._xhr = null;
    }
  }
});


var Cache = {
  cache:  [],

  get: function(url) {
   var entry = null;
   for(var i=0;i<this.cache.length;i++) {
     if (this.cache[i] && this.cache[i].url == url) entry = this.cache[i];
   }
   return entry;
  },

  set: function(url, data) {
    this.remove(url);
    this.cache.push({ url: url, data: data });
  },

  remove: function(url) {
   for(var i=0;i<this.cache.length;i++) {
     if (this.cache[i] && this.cache[i].url == url) {
       delete this.cache[i];
     }
   }
  }
};

return VimeoReady;

})();

var Options = {
  defaults: {
    effects: {
      spinner: { show: 200, hide: 200 },
      transition: { min: 175, max: 250 },
      ui: { show: 0, hide: 200 },
      window: { show: 300, hide: 300 }
    },
    hideOnClickOutside: true,
    keyboard: {
      left:  true,
      right: true,
      esc:   true
    },
    loop: true,
    overlap: true,
    preload: [1,2],
    position: true,
    skin: 'strip',
    side: 'right',
    spinner: true,
    toggle: true,
    uiDelay: 3000,
    vimeo: {
      autoplay: 1,
      api: 1,
      title: 1,
      byline: 1,
      portrait: 0,
      loop: 0
    },
    youtube: {
      autoplay: 1,
      controls: 1,
      enablejsapi: 1,
      hd: 1,
      iv_load_policy: 3,
      loop: 0,
      modestbranding: 1,
      rel: 0,
      vq: 'hd1080' // force hd: http://stackoverflow.com/a/12467865
    },

    initialTypeOptions: {
      'image': { },
      'vimeo': {
        width: 1280
      },
      // Youtube needs both dimensions, it doesn't support fetching video dimensions like Vimeo yet.
      // Star this ticket if you'd like to get support for it at some point:
      // https://code.google.com/p/gdata-issues/issues/detail?id=4329
      'youtube': {
        width: 1280,
        height: 720
      }
    }
  },

  create: function(opts, type, data) {
    opts = opts || {};
    data = data || {};

    opts.skin = opts.skin || this.defaults.skin;

    var selected = opts.skin ? $.extend({}, Strip.Skins[opts.skin] || Strip.Skins[this.defaults.skin]) : {},
        merged = $.extend(true, {}, this.defaults, selected);

    // merge initial type options
    if (merged.initialTypeOptions) {
      if (type && merged.initialTypeOptions[type]) {
        merged = $.extend(true, {}, merged.initialTypeOptions[type], merged);
      }
      // these aren't used further, so remove them
      delete merged.initialTypeOptions;
    }

    // safe options to work with
    var options = $.extend(true, {}, merged, opts);

    // set all effect duration to 0 for effects: false
    // IE8 and below never use effects
    if (!options.effects || (Browser.IE && Browser.IE < 9)) {
      options.effects = {};
      $.each(this.defaults.effects, function(name, effect) {
        $.each((options.effects[name] = $.extend({}, effect)), function(option) {
          options.effects[name][option] = 0;
        });
      });

      // disable the spinner when effects are disabled
      options.spinner = false;
    }

    // keyboard
    if (options.keyboard) {
      // when keyboard is true, enable all keys
      if ($.type(options.keyboard) == 'boolean') {
        options.keyboard = {};
        $.each(this.defaults.keyboard, function(key, bool) {
          options.keyboard[key] = true;
        });
      }

      // disable left and right keys for video, because players like
      // youtube use these keys
      if (type == 'vimeo' || type == 'youtube') {
        $.extend(options.keyboard, { left: false, right: false });
      }
    }

    // vimeo & youtube always have no overlap
    if (type == 'vimeo' || type == 'youtube') {
      options.overlap = false;
    }

    return options;
  }
};

function View() { this.initialize.apply(this, _slice.call(arguments)); }
$.extend(View.prototype, {
  initialize: function(object) {
   var options = arguments[1] || {},
       data = {};

   // string -> element
   if ($.type(object) == 'string') {
     // turn the string into an element
     object = { url: object };
   }

   // element -> object
   else if (object && object.nodeType == 1) {
     var element = $(object);

     object = {
       element:   element[0],
       url:       element.attr('href'),
       caption:   element.data('strip-caption'),
       group:     element.data('strip-group'),
       extension: element.data('strip-extension'),
       type:      element.data('strip-type'),
       options:   (element.data('strip-options') && eval('({' + element.data('strip-options') + '})')) || {}
     };
   }

   if (object) {
     // detect type if none is set
     if (!object.extension) {
       object.extension = detectExtension(object.url);
     }

     if (!object.type) {
       var data = getURIData(object.url);
       object._data = data;
       object.type = data.type;
     }
   }

   if (!object._data) {
     object._data = getURIData(object.url);
   }

   if (object && object.options) {
      object.options = $.extend(true, $.extend({}, options), $.extend({}, object.options));
   } else {
     object.options = $.extend({}, options);
   }
   // extend the options
   object.options = Options.create(object.options, object.type, object._data);

   // extend this with data
   $.extend(this, object);

   return this;
  }
});

var Pages = {
  initialize: function(element) {
    this.element = element;
    this.pages = {};
    this.uid = 1;
  },

  add: function(views) {
    this.uid++;

    this.views = views;

    this.pages[this.uid] = []; // create room for these pages

    // switched pages, so show the UI on the next resize
    Window._showUIOnResize = true;

    // add pages for all these views
    $.each(views, $.proxy(function(i, view) {
      this.pages[this.uid].push(new Page(view, i + 1, this.views.length));
    }, this));
  },

  show: function(position, callback) {
    var page = this.pages[this.uid][position - 1];

    // never try to reload the exact same frame
    if (this.page && this.page.uid == page.uid) {
      // also hide the window if toggle is enabled
      if (page.view.options.toggle) {
        Window.hide();
        // clear the page so double clicking when hiding will
        // re-open the window even if it's in a hide animation
        this.page = null;
      }

      return;
    }

    // set class names to indicate active state
    Pages.setActiveClass(page);

    // update the page
    this.page = page;

    this.removeHiddenAndLoadingInactive();
    page.show($.proxy(function() {
      // once a page has been fully shown we mark Pages as not being switched anymore
      this._switched = false;
      if (callback) callback();
    }, this));
  },

  getLoadingCount: function() {
    // we only stop loading if all the frames we have are not loading anymore
    var count = 0;
    $.each(this.pages, function(id, pages) {
      $.each(pages, function(j, page) {
        if (page.loading) count++;
      });
    });
    return count;
  },

  // used by the API when opening
  // checks if the page is in the currently open group
  getPositionInActivePageGroup: function(element) {
    var position = 0,
        activeGroup = this.pages[this.uid];

    if (activeGroup) {
      $.each(activeGroup, function(i, page) {
        if (page.view.element && page.view.element == element) {
          position = i + 1;
        }
      });
    }

    return position
  },

  // remove pages not matching the current id
  removeExpired: function(instantly) {
    $.each(this.pages, function(id, pages) {
      if (id != this._id) {
        $.each(pages, function(j, page) {
          page.remove(instantly);
        });
      }
    });
  },


  // Window.hide will call thise when fully closed
  removeAll: function() {
    $.each(this.pages, function(id, pages) {
      $.each(pages, function(j, page) {
        page.remove();
      });
    });

    // empty out pages
    this.pages = {};
  },

  hideVisibleInactive: function(alternateDuration) {
    $.each(this.pages, $.proxy(function(id, pages) {
      $.each(pages, $.proxy(function(j, page) {
          if (page.uid != this.page.uid) {
            page.hide(null, alternateDuration);
          }
      }, this));
    }, this));
  },

  stopInactive: function() {
    $.each(this.pages, $.proxy(function(id, pages) {
      $.each(pages, $.proxy(function(j, page) {
        if (page.uid != this.page.uid && !page.preloading) {
          page.stop();
        }
      }, this));
    }, this));
  },

  // TODO: might be nice to have a hide animation before removal, it's instant now
  removeHiddenAndLoadingInactive: function() {
    // track which inactive page groups are empty
    var empty = [];

    $.each(this.pages, $.proxy(function(uid, pages) {
      // only remove pages in the groups that are currently not active
      if (uid != this.uid) {
        var removed = 0;

        $.each(pages, $.proxy(function(j, page) {
            // remove hidden or loading, but dont'remove frames in animation
            if ((!page.visible || page.loading) && !page.animatingWindow) {
              page.remove();
            }

            if (page.removed) removed++; // count all, not those we remove now
        }, this));

        // if we've removed all pages from this group it's safe to remove it
        // we don't do this in the loop but below
        if (removed == pages.length) {
          empty.push(uid);
        }
      }
    }, this));

    // now remove all empty page groups
    $.each(empty, $.proxy(function(i, uid) {
      delete this.pages[uid];
    }, this));

  },

  stop: function() {
    $.each(this.pages, function(id, pages) {
      $.each(pages, function(j, page) {
        page.stop();
      });
    });
  },

  setActiveClass: function(page) {
    // switch the active element class
    this.removeActiveClasses();

    // add the active class if the new page is bound to an element
    var element = page.view.element;
    if (element) {
      $(element).addClass('strip-active-element strip-active-group');

      // also give other items in the group the active group class
      var group = $(element).data('strip-group');
      if (group) {
        $('.strip[data-strip-group="' + group + '"]').addClass('strip-active-group');
      }
    }
  },

  removeActiveClasses: function() {
    $('.strip-active-group').removeClass('strip-active-group strip-active-element');
  }
};

var Page = (function() {
var uid = 0,
    loadedUrlCache = {};

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

    new ImageReady(this.content[0], $.proxy(function(imageReady) {
      this.loaded = true;
      this.preloading = false;
      this.preloaded = true;

      this.dimensions = {
        width: imageReady.img.naturalWidth,
        height: imageReady.img.naturalHeight
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
    // only when this url hasn't been loaded before
    if (this.view.options.spinner && !loadedUrlCache[this.view.url]) {
      Window.startLoading();
    }

    switch(this.view.type) {
      case 'image':

        // if we had an error before just go through
        if (this.error) {
          if (callback) callback();
          return;
        }

        this.imageReady = new ImageReady(this.content[0], $.proxy(function(imageReady) {
          // mark as loaded
          this._markAsLoaded();

          this.dimensions = {
            width: imageReady.img.naturalWidth,
            height: imageReady.img.naturalHeight
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

    // mark url as loaded so we can avoid
    // showing the spinner again
    loadedUrlCache[this.view.url] = true;

    Window.stopLoading();
  },

  isVideo: function() {
    return /^(youtube|vimeo)$/.test(this.view.type);
  },

  insertVideo: function(callback) {
    // don't insert a video twice
    // and stop if not a video
    if (this.playerIframe || !this.isVideo()) {
      if (callback) callback();
      return;
    }

    var playerVars = $.extend({}, this.view.options[this.view.type] || {}),
        queryString = $.param(playerVars),
        src = {
          vimeo: '//player.vimeo.com/video/{id}?{queryString}',
          youtube: '//www.youtube.com/embed/{id}?{queryString}'
        };

    this.content.append(this.playerIframe = $('<iframe webkitAllowFullScreen mozallowfullscreen allowFullScreen>')
      .attr({
        src: src[this.view.type]
             .replace('{id}', this.view._data.id)
             .replace('{queryString}', queryString),
        height: this.contentDimensions.height,
        width: this.contentDimensions.width,
        frameborder: 0
      })
    );

    if (callback) callback();
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
      if (this.view.options.spinner && Window._spinner) {
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
    if (this.isVideo()) {
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
    var isVideo = this.isVideo();
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

      this.playerIframe.remove();
      this.playerIframe = null;
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

    dimensions = Fit.within(bounds, dimensions);

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
    var win = Window.element,
        isFullscreen = (z == 'width') ? parseInt(win.css('min-width')) > 0 :
                       parseInt(win.css('min-height')) > 0;
        safety = isFullscreen ? 0 : parseInt(win.css('margin-' + (z == 'width' ? 'left' : 'bottom')));
    Window.element.addClass('strp-measured');

    bounds[z] -= safety;

    var paddingX = parseInt(container.css('padding-left')) + parseInt(container.css('padding-right')),
        paddingY = parseInt(container.css('padding-top')) + parseInt(container.css('padding-bottom')),
        padding = { x: paddingX, y: paddingY };

    bounds.width -= paddingX;
    bounds.height -= paddingY;

    var fitted = Fit.within(bounds, dimensions),
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
        page.css({
          width: (isFullscreen ? viewport.width : fitted.width + paddingX) + 'px'
        });

        var initialBoundsHeight = bounds.height;

        content.hide();
        cH = info.outerHeight();
        content.show();

        bounds.height = initialBoundsHeight - cH;

        contentDimensions = Fit.within(bounds, dimensions);

        // left/right requires further adjustment of the caption
        var initialImageSize = $.extend({}, contentDimensions),
            initialCH = cH,
            newCW,
            previousCH,
            shrunkW;

        var attempts = isFullscreen ? 0 : 4; // fullscreen doesn't need extra resizing

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

            contentDimensions = Fit.within(bounds, dimensions);

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
          page.css({ width: viewport.width });
        }

        // height
        content.hide();
        cH = info.outerHeight();
        content.show();

        bounds.height -= cH;
        contentDimensions = Fit.within(bounds, dimensions);
        fitted.height = contentDimensions.height;
      }

      // restore visibility
      if (!pageVisible) page.hide();
      if (!windowVisible) Window.element.hide();
    }


    // page needs a fixed width to remain properly static during animation
    var pageDimensions = {
      width: fitted.width + paddingX,
      height: fitted.height + paddingY + cH
    };
    // fullscreen mode uses viewport dimensions for the page
    if (isFullscreen) pageDimensions = viewport;

    if (z == 'width') {
      page.css({ width: pageDimensions.width + 'px' });
    } else {
      page.css({ height: pageDimensions.height + 'px' });
    }

    container.css({ bottom: cH + 'px' });


    // margins
    var mLeft = -.5 * contentDimensions.width,
        mTop  = -.5 * contentDimensions.height;

    // floor margins on IE6-7 because it doesn't render .5px properly
    if (Browser.IE && Browser.IE < 8) {
      mLeft = Math.floor(mLeft);
      mTop = Math.floor(mTop);
    }

    content.css(px($.extend({}, contentDimensions, {
      'margin-left': mLeft,
      'margin-top': mTop
    })));


    if (this.playerIframe) {
      this.playerIframe.attr(contentDimensions);
    }

    this.contentDimensions = contentDimensions;

    // store for later use within animation
    this.width = pageDimensions.width;
    this.height = pageDimensions.height;

    this.z = this[z];
  }
});

return Page;
})();

var Window = {
  initialize: function() {
    this.queues = [];
    this.queues.hide = $({});

    this.pages = [];

    this.timers = new Timers();

    this.build();
    this.setSkin(Options.defaults.skin);
  },

  build: function() {
    // spinner
    if (Spinner.supported) {
      $(document.body).append(this.spinnerMove = $('<div>').addClass('strp-spinner-move')
        .hide()
        .append(this.spinner = $('<div>').addClass('strp-spinner'))
      );
      this._spinner = new Spinner(this.spinner);

      this._spinnerMoveSkinless = this.spinnerMove[0].className;
    }

    // window
    $(document.body).append(this.element = $('<div>').addClass('strp-window strp-measured')

      .append(this._pages = $('<div>').addClass('strp-pages'))

      .append(this._previous = $('<div>').addClass('strp-nav strp-nav-previous')
        .append($('<div>').addClass('strp-nav-button')
          .append($('<div>').addClass('strp-nav-button-background'))
          .append($('<div>').addClass('strp-nav-button-icon'))
        )
        .hide()
      )

      .append(this._next = $('<div>').addClass('strp-nav strp-nav-next')
        .append($('<div>').addClass('strp-nav-button')
          .append($('<div>').addClass('strp-nav-button-background'))
          .append($('<div>').addClass('strp-nav-button-icon'))
        )
        .hide()
      )

      // close
      .append(this._close = $('<div>').addClass('strp-close')
        .append($('<div>').addClass('strp-close-background'))
        .append($('<div>').addClass('strp-close-icon'))
      )
    );

    Pages.initialize(this._pages);

    // support classes
    if (Support.mobileTouch) this.element.addClass('strp-mobile-touch');
    if (!Support.svg) this.element.addClass('strp-no-svg');


    // events
    this._close.on('click', $.proxy(function(event) {
      event.preventDefault();
      this.hide();
    }, this));

    this._previous.on('click', $.proxy(function(event) {
      this.previous();
      this._onMouseMove(event); // update cursor
    }, this));

    this._next.on('click', $.proxy(function(event) {
      this.next();
      this._onMouseMove(event); // update cursor
    }, this));

    this.hideUI(null, 0); // start with hidden <>
  },

  setSkin: function(skin) {
    if (this._skin) {
      this.element.removeClass('strp-window-skin-' + this._skin);
    }
    this.element.addClass('strp-window-skin-' + skin);

    this._skin = skin;
  },

  setSpinnerSkin: function(skin) {
    if (!this.spinnerMove) return;

    if (this._spinnerSkin) {
      this.spinnerMove.removeClass('strp-spinner-move-skin-' + this._spinnerSkin);
    }

    this.spinnerMove.addClass('strp-spinner-move-skin-' + skin);
    // refresh in case of styling updates
    this._spinner.refresh();

    this._spinnerSkin = skin;
  },


  // Resize
  // window resize (TODO:orientationchange?)
  startObservingResize: function() {
    if (this._isObservingResize) return;

    this._onWindowResizeHandler = $.proxy(this._onWindowResize, this);
    $(window).on('resize orientationchange', this._onWindowResizeHandler);

    this._isObservingResize = true;
  },

  stopObservingResize: function() {
    if (this._onWindowResizeHandler) {
      $(window).off('resize orientationchange', this._onWindowResizeHandler);
      this._onWindowResizeHandler = null;
    }

    this._isObservingResize = false;
  },

  _onWindowResize: function() {
    var page;
    if (!(page = Pages.page)) return;

    if (page.animated || page.animatingWindow) {
      // we're animating, don't stop the animation,
      // instead update dimensions and restart/continue showing
      page.fitToWindow();
      page.show();
    } else {
      // we're not in an animation, resize instantly
      page.fitToWindow();
      this.resize(page.z, null, 0);
      this.adjustPrevNext(null, true);
    }
  },

  resize: function(wh, callback, alternateDuration) {
    var orientation = this.getOrientation(),
        Z = orientation == 'vertical' ? 'Height' : 'Width',
        z = Z.toLowerCase();

    if (wh > 0) {
      this.visible = true;
      this.startObservingResize();

      // onShow callback
      var onShow = this.view && this.view.options.onShow;
      if ($.type(onShow) == 'function') {
        onShow.call(Strip);
      }
    }

    var fromZ = Window.element['outer' + Z](),
        duration;

    // if we're opening use the show duration
    if (fromZ == 0) {
      duration = this.view.options.effects.window.show;

      // add opening class
      this.element.addClass('strp-opening');
      this.opening = true;
    } else if ($.type(alternateDuration) == 'number') {
      // alternate when set
      duration =  alternateDuration;
    } else {
      // otherwise decide on a duration for the transition
      // based on distance
      var transition = this.view.options.effects.transition,
          min = transition.min,
          max = transition.max,
          tdiff = max - min,

          viewport = Bounds.viewport(),

          distance = Math.abs(fromZ - wh),
          percentage = Math.min(1, distance / viewport[z]);

      duration = Math.round(min + (percentage * tdiff));
    }


    if (wh == 0) {
      this.closing = true;
      // we only add the closing class if we're not currently animating the window
      if (!this.element.is(':animated')) {
        this.element.addClass('strp-closing');
      }
    }

    // the animations
    var css = { overflow: 'visible' };
    css[z] = wh + 'px';

    var fx = 1;

    // _getEventSide checks this.element.outerWidth() on mousemove only when
    // this._outerWidth isn't set, we need that during animation,
    // afterResize will set it back along with the cached offsetLeft
    this._outerWidth = null;
    this._offsetLeft = null;

    var onResize = this.view.options.onResize,
        hasOnResize = $.type(onResize) == 'function';

    this.element.stop(true).animate(css, $.extend({
      duration: duration,
      complete: $.proxy(function() {
        if (--fx < 1) this._afterResize(callback);
      }, this)
    }, !hasOnResize ? {} : {
      // we only add step if there's an onResize callback
      step: $.proxy(function(now, fx) {
        if (fx.prop == z) {
          onResize.call(Strip, fx.prop, now, this.side);
        }
      }, this)
    }));

    if (this.spinnerMove) {
      fx++; // sync this effect
      this.spinnerMove.stop(true).animate(css, duration, $.proxy(function() {
        if (--fx < 1) this._afterResize(callback);
      }, this));
    }

    // return the duration for later use in synced animations
    return duration;
  },

  _afterResize: function(callback) {
    this.opening = false;
    this.closing = false;
    this.element.removeClass('strp-opening strp-closing');

    // cache outerWidth and offsetLeft for _getEventSide on mousemove
    this._outerWidth = this.element.outerWidth();
    this._offsetLeft = this.element.offset().left;

    if (callback) callback();
  },


  adjustPrevNext: function(callback, alternateDuration) {
    if (!this.view || !Pages.page) return;
    var page = Pages.page;

    // offset <>
    var windowVisible = this.element.is(':visible');
    if (!windowVisible) this.element.show();

    var pRestoreStyle = this._previous.attr('style');
    //this._previous.attr({ style: '' });
    this._previous.removeAttr('style');
    var pnMarginTop = parseInt(this._previous.css('margin-top')); // the original margin top
    this._previous.attr({ style: pRestoreStyle });

    if (!windowVisible) this.element.hide();

    var iH = page.info ? page.info.outerHeight() : 0;

    var buttons = this._previous.add(this._next),
        css = { 'margin-top': pnMarginTop - iH * .5 };

    var duration = this.view.options.effects.transition.min;
    if ($.type(alternateDuration) == 'number') duration = alternateDuration;

    // adjust <> instantly when opening
    if (this.opening) duration = 0;

    buttons.stop(true).animate(css, duration, callback);

    this._previous[this.mayPrevious() ? 'show' : 'hide']();
    this._next[this.mayNext() ? 'show' : 'hide']();
  },

  resetPrevNext: function() {
    var buttons = this._previous.add(this._next);
    buttons.stop(true).removeAttr('style');
  },


  // Load
  load: function(views, position) {
    this.views = views;

    Pages.add(views);

    if (position) {
      this.setPosition(position);
    }
  },

  // adjust the size based on the current view
  // this might require closing the window first
  setSide: function(side, callback) {
    if (this.side == side) {
      if (callback) callback();
      return;
    }

    // side has change, first close the window if it isn't already closed
    if (this.visible) {
      // NOTE: side should be set here since the window was visible
      // so using resize should be safe

      // hide the UI
      var duration = this.view ? this.view.options.effects.window.hide : 0;
      this.hideUI(null, duration);

      // avoid tracking mouse movement while the window is closing
      this.unbindUI();

      // hide
      this.resize(0, $.proxy(function() {

        // some of the things we'd normally do in hide
        this._safeResetsAfterSwitchSide();

        // we instantly hide the other views here
        Pages.hideVisibleInactive(0);

        this._setSide(side, callback);
      }, this));

      // show the UI on the next resize
      this._showUIOnResize = true;
    } else {
      this._setSide(side, callback);
    }
  },

  _setSide: function(side, callback) {
    this.side = side;

    var orientation = this.getOrientation();

    var elements = this.element;
    if (this.spinnerMove) elements = elements.add(this.spinnerMove);

    elements.removeClass('strp-horizontal strp-vertical')
            .addClass('strp-' + orientation);

    var ss = 'strp-side-';
    elements.removeClass(ss + 'top ' + ss + 'right ' + ss + 'bottom ' + ss + 'left')
            .addClass(ss + side);

    if (callback) callback();
  },

  getOrientation: function(side) {
    return (this.side == 'left' || this.side == 'right') ? 'horizontal' : 'vertical';
  },

  // loading indicator
  startLoading: function() {
    if (!this._spinner) return;

    this.spinnerMove.show();
    this._spinner.show();
  },

  stopLoading: function() {
    if (!this._spinner) return;

    // we only stop loading if there are no loading pages anymore
    var loadingCount = Pages.getLoadingCount();

    if (loadingCount < 1) {
      this._spinner.hide($.proxy(function() {
        this.spinnerMove.hide();
      }, this));
    }
  },

  setPosition: function(position, callback) {
    this._position = position;

    // store the current view
    this.view = this.views[position - 1];

    // we need to make sure that a possible hide effect doesn't
    // trigger its callbacks, as that would cancel the showing/loading
    // of the page started below
    this.stopHideQueue();

    // store the page and show it
    this.page = Pages.show(position, $.proxy(function() {
      var afterPosition = this.view.options.afterPosition;
      if ($.type(afterPosition) == 'function') {
        afterPosition.call(Strip, position);
      }
      if (callback) callback();
    }, this));
  },

  hide: function(callback) {
    var hideQueue = this.queues.hide;
    hideQueue.queue([]); // clear queue

    hideQueue.queue($.proxy(function(next_stop) {
      Pages.stop();
      next_stop();
    }, this));

    hideQueue.queue($.proxy(function(next_unbinds) {
      // ui
      var duration = this.view ? this.view.options.effects.window.hide : 0;
      this.unbindUI();
      this.hideUI(null, duration);

      // close on click outside
      this.unbindHideOnClickOutside();

      // keyboard
      Keyboard.disable();

      next_unbinds();
    }, this));

    hideQueue.queue($.proxy(function(next_zero) {
      // active classes should removed right as the closing effect starts
      // because clicking an element as it closes will re-open it,
      // that needs to be reflected in the class
      Pages.removeActiveClasses();

      this.resize(0, next_zero, this.view.options.effects.window.hide);

      // after we initiate the hide resize, the next resize should bring up the UI again
      this._showUIOnResize = true;
    }, this));

    // callbacks after resize in a separate queue
    // so we can stop the hideQueue without stopping the resize
    hideQueue.queue($.proxy(function(next_after_resize) {
      this._safeResetsAfterSwitchSide();

      // all of the below we cannot safely call safely
      this.stopObservingResize();

      Pages.removeAll();

      this.timers.clear();

      this._position = -1;

      // afterHide callback
      var afterHide = this.view && this.view.options.afterHide;
      if ($.type(afterHide) == 'function') {
        afterHide.call(Strip);
      }

      this.view = null;

      next_after_resize();
    }, this));

    if ($.type(callback) == 'function') {
      hideQueue.queue($.proxy(function(next_callback) {
        callback();
        next_callback();
      }, this));
    }
  },

  // stop all callbacks possibly queued up into a hide animation
  // this allows the hide animation to finish as we start showing/loading
  // a new page, a callback could otherwise interrupt this
  stopHideQueue: function() {
    this.queues.hide.queue([]);
  },

  // these are things we can safely call when switching side as well
  _safeResetsAfterSwitchSide: function() {
    // remove styling from window, so no width: 100%; height: 0 issues
    this.element.removeAttr('style');
    if (this.spinnerMove) this.spinnerMove.removeAttr('style');

    //Pages.removeExpired();
    this.visible = false;
    this.hideUI(null, 0);
    this.timers.clear('ui');
    this.resetPrevNext();

    // clear cached mousemove
    this._x = -1;
    this._y = -1;
  },

  // Previous / Next
  mayPrevious: function() {
    return (this.view && this.view.options.loop && this.views && this.views.length > 1) || this._position != 1;
  },

  previous: function(force) {
    var mayPrevious = this.mayPrevious();

    if (force || mayPrevious) {
      this.setPosition(this.getSurroundingIndexes().previous);
    }
  },

  mayNext: function() {
    var hasViews = this.views && this.views.length > 1;

    return (this.view && this.view.options.loop && hasViews) || (hasViews && this.getSurroundingIndexes().next != 1);
  },

  next: function(force) {
    var mayNext = this.mayNext();

    if (force || mayNext) {
      this.setPosition(this.getSurroundingIndexes().next);
    }
  },

  // surrounding
  getSurroundingIndexes: function() {
    if (!this.views) return {};

    var pos = this._position,
        length = this.views.length;

    var previous = (pos <= 1) ? length : pos - 1,
        next = (pos >= length) ? 1 : pos + 1;

    return {
      previous: previous,
      next: next
    };
  },


  // close when clicking outside of strip or an element opening strip
  bindHideOnClickOutside: function() {
    this.unbindHideOnClickOutside();
    $(document.documentElement).on('click', this._delegateHideOutsideHandler = $.proxy(this._delegateHideOutside, this));
  },

  unbindHideOnClickOutside: function() {
    if (this._delegateHideOutsideHandler) {
      $(document.documentElement).off('click', this._delegateHideOutsideHandler);
      this._delegateHideOutsideHandler = null;
    }
  },

  _delegateHideOutside: function(event) {
    var page = Pages.page;
    if (!this.visible || !(page && page.view.options.hideOnClickOutside)) return;

    var element = event.target;

    if (!$(element).closest('.strip, .strp-window')[0]) {
      this.hide();
    }
  },


  // UI
  bindUI: function() {
    this.unbindUI();

    if (!Support.mobileTouch) {
      this.element.on('mouseenter', this._showUIHandler = $.proxy(this.showUI, this))
                  .on('mouseleave', this._hideUIHandler = $.proxy(this.hideUI, this));

      this.element.on('mousemove', this._mousemoveUIHandler = $.proxy(function(event) {
        // Chrome has a bug that triggers a mousemove events incorrectly
        // we have to work around this by comparing cursor positions
        // so only true mousemove events pass through:
        // https://code.google.com/p/chromium/issues/detail?id=420032
        var x = event.pageX,
            y = event.pageY;

        if (this._hoveringNav || (y == this._y && x == this._x)) {
          return;
        }

        // cache x/y
        this._x = x;
        this._y = y;

        this.showUI();
        this.startUITimer();
      }, this));

      // delegate <> mousemove/click states
      this._pages.on('mousemove', '.strp-container', this._onMouseMoveHandler = $.proxy(this._onMouseMove, this))
                 .on('mouseleave', '.strp-container', this._onMouseLeaveHandler = $.proxy(this._onMouseLeave, this))
                 .on('mouseenter', '.strp-container', this._onMouseEnterHandler = $.proxy(this._onMouseEnter, this));

      // delegate moving onto the <> buttons
      // keeping the mouse on them should keep the buttons visible
      this.element.on('mouseenter', '.strp-nav', this._onNavMouseEnterHandler = $.proxy(this._onNavMouseEnter, this))
                  .on('mouseleave', '.strp-nav', this._onNavMouseLeaveHandler = $.proxy(this._onNavMouseLeave, this));

      $(window).on('scroll', this._onScrollHandler = $.proxy(this._onScroll, this));
    }

    this._pages.on('click', '.strp-container', this._onClickHandler = $.proxy(this._onClick, this));
  },

  // TODO: switch to jQuery.on/off
  unbindUI: function() {
    if (this._showUIHandler) {
      this.element.off('mouseenter', this._showUIHandler)
                  .off('mouseleave', this._hideUIHandler)
                  .off('mousemove', this._mousemoveUIHandler);

      this._pages.off('mousemove', '.strp-container', this._onMouseMoveHandler)
                 .off('mouseleave', '.strp-container', this._onMouseLeaveHandler)
                 .off('mouseenter', '.strp-container', this._onMouseEnterHandler);

      this.element.off('mouseenter', '.strp-nav', this._onNavMouseEnter)
                  .off('mouseleave', '.strp-nav', this._onNavMouseLeave);

      $(window).off('scroll', this._onScrollHandler);

      this._showUIHandler = null;
    }

    if (this._onClickHandler) {
      this._pages.off('click', '.strp-container', this._onClickHandler);
      this._onClickHandler = null;
    }
  },

  // reset cached offsetLeft and outerWidth so they are recalculated after scrolling,
  // the cached values might be incorrect after scrolling left/right
  _onScroll: function() {
    this._offsetLeft = this._outerWidth = null;
  },

  // events bounds by bindUI
  _onMouseMove: function(event) {
    var Side = this._getEventSide(event),
        side = Side.toLowerCase();

    this.element[(this['may' + Side]() ? 'add' : 'remove') + 'Class']('strp-hovering-clickable');
    this._previous[(side != 'next' ? 'add' : 'remove') + 'Class']('strp-nav-previous-hover strp-nav-hover');
    this._next[(side == 'next' ? 'add' : 'remove') + 'Class']('strp-nav-next-hover strp-nav-hover');
  },

  _onMouseLeave: function(event) {
    this.element.removeClass('strp-hovering-clickable');
    this._previous.removeClass('strp-nav-previous-hover')
                  .add(this._next.removeClass('strp-nav-next-hover'))
                  .removeClass('strp-nav-hover');
  },

  _onClick: function(event) {
    var Side = this._getEventSide(event),
        side = Side.toLowerCase();

    this[side]();

    // adjust cursor, doesn't work with effects
    // but _onMouseEnter is used to fix that
    this._onMouseMove(event);
  },

  _onMouseEnter: function(event) {
    // this solves clicking an area and not having an updating cursor
    // when not moving cursor after click. When an overlapping page comes into view
    // it'll trigger a mouseenter after the mouseout on the disappearing page
    // that would normally remove the clickable class
    this._onMouseMove(event);
  },

  _getEventSide: function(event) {
    var offsetLeft = this._offsetLeft || this.element.offset().left,
        left = event.pageX - offsetLeft,
        width = this._outerWidth || this.element.outerWidth();

    return left < .5 * width ? 'Previous' : 'Next';
  },

  _onNavMouseEnter: function(event) {
    this._hoveringNav = true;
    this.clearUITimer();
  },

  _onNavMouseLeave: function(event) {
    this._hoveringNav = false;
    this.startUITimer();
  },

  // Actual UI actions
  showUI: function(callback, alternateDuration) {
    // clear the timer everytime so we can keep clicking elements and fading
    // in the ui while not having the timer interupt that with a hide
    this.clearUITimer();

    // we're only fading the inner button icons since the margin on their wrapper divs might change
    var elements = this.element.find('.strp-nav-button');

    var duration = this.view ? this.view.options.effects.ui.show : 0;
    if ($.type(alternateDuration) == 'number') duration = alternateDuration;

    elements.stop(true).fadeTo(duration, 1, 'stripEaseInSine', $.proxy(function() {
      this.startUITimer();
      if ($.type(callback) == 'function') callback();
    }, this));
  },

  hideUI: function(callback, alternateDuration) {
    var elements = this.element.find('.strp-nav-button');

    var duration = this.view ? this.view.options.effects.ui.hide : 0;
    if ($.type(alternateDuration) == 'number') duration = alternateDuration;

    elements.stop(true).fadeOut(duration, 'stripEaseOutSine', function() {
      if ($.type(callback) == 'function') callback();
    });
  },

  // UI Timer
  // not used on mobile-touch based devices
  clearUITimer: function() {
    if (Support.mobileTouch) return;

    this.timers.clear('ui');
  },

  startUITimer: function() {
    if (Support.mobileTouch) return;

    this.clearUITimer();
    this.timers.set('ui', $.proxy(function(){
      this.hideUI();
    }, this), this.view ? this.view.options.uiDelay : 0);
  }
};

//  Keyboard
//  keeps track of keyboard events when enabled
var Keyboard = {
  enabled: false,

  keyCode: {
    'left':  37,
    'right': 39,
    'esc':   27
  },

  // enable is passed the keyboard option of a page, which can be false
  // or contains multiple buttons to toggle
  enable: function(enabled) {
    this.disable();

    if (!enabled) return;

    $(document).on('keydown', this._onKeyDownHandler = $.proxy(this.onKeyDown, this))
               .on('keyup', this._onKeyUpHandler = $.proxy(this.onKeyUp, this));

    this.enabled = enabled;
  },

  disable: function() {
    this.enabled = false;

    if (this._onKeyUpHandler) {
      $(document).off('keyup', this._onKeyUpHandler)
                 .off('keydown', this._onKeyDownHandler);
      this._onKeyUpHandler = this._onKeyDownHandler = null;
    }
  },

  onKeyDown: function(event) {
    if (!this.enabled || !Window.visible) return;

    var key = this.getKeyByKeyCode(event.keyCode);

    if (!key || (key && this.enabled && !this.enabled[key])) return;

    event.preventDefault();
    event.stopPropagation();

    switch (key) {
      case 'left':
        Window.previous();
        break;
      case 'right':
        Window.next();
        break;
    }
  },

  onKeyUp: function(event) {
    if (!this.enabled || !Window.visible) return;

    var key = this.getKeyByKeyCode(event.keyCode);

    if (!key || (key && this.enabled && !this.enabled[key])) return;

    switch (key) {
      case 'esc':
        Window.hide();
        break;
    }
  },

  getKeyByKeyCode: function(keyCode) {
    for(var key in this.keyCode) {
      if (this.keyCode[key] == keyCode) return key;
    }
    return null;
  }
};

// API

// an unexposed object for internal use
var _Strip = {
  _disabled: false,
  _fallback: true,

  initialize: function() {
    Window.initialize();
    if (!this._disabled) this.startDelegating();
  },

  // click delegation
  startDelegating: function() {
    this.stopDelegating();
    $(document.documentElement).delegate('.strip[href]', 'click', this._delegateHandler = $.proxy(this.delegate, this));
  },

  stopDelegating: function() {
    if (this._delegateHandler) {
      $(document.documentElement).undelegate('.strip[href]', 'click', this._delegateHandler);
      this._delegateHandler = null;
    }
  },

  delegate: function(event) {
    if (this._disabled) return;

    event.stopPropagation();
    event.preventDefault();

    var element = event.currentTarget;

    _Strip.show(element);
  },

  show: function(object) {
    if (this._disabled) {
      this.showFallback.apply(_Strip, _slice.call(arguments));
      return;
    }

    var options = arguments[1] || {},
        position = arguments[2];

    if (arguments[1] && $.type(arguments[1]) == 'number') {
      position = arguments[1];
      options = {};
    }

    var views = [], object_type,
        isElement = _.isElement(object);

    switch ((object_type = $.type(object))) {
      case 'string':
      case 'object':
        var view = new View(object, options),
            _dgo = "data-strip-group-options";

        if (view.group) {
          // extend the entire group

          // if we have an element, look for other elements
          if (isElement) {
            var elements = $('.strip[data-strip-group="' + $(object).data('strip-group') + '"]');

            // find possible group options
            var groupOptions = {};

            elements.filter('[' + _dgo + ']').each(function(i, element) {
              $.extend(groupOptions, eval('({' + ($(element).attr(_dgo) || '') + '})'));
            });

            elements.each(function(i, element) {
              // adjust the position if we find that the given object position
              if (!position && element == object) position = i + 1;
              views.push(new View(element, $.extend({}, groupOptions, options)));
            });
          }
        } else {
          var groupOptions = {};
          if (isElement && $(object).is('[' + _dgo + ']')) {
            $.extend(groupOptions, eval('({' + ($(object).attr(_dgo) || '') + '})'));
            // reset the view with group options applied
            view = new View(object, $.extend({}, groupOptions, options));
          }

          views.push(view);
        }
        break;


      case 'array':
        $.each(object, function(i, item) {
          var view = new View(item, options);
          views.push(view);
        });
        break;
    }

    // if we haven't found a position by now, load the first view
    if (!position || position < 1) {
      position = 1;
    }
    if (position > views.length) position = views.length;

    // Allow API events to pass through by disabling hideOnClickOutside.
    // It is re-enabled when bringing a page into view using a slight delay
    // allowing a possible click event that triggers this show() function to
    // fully bubble up. This is needed when Strip is visible and Strip.show()
    // is called, the click would otherwise bubble down and instantly hide,
    // cancelling the show()
    Window.unbindHideOnClickOutside();

    // if we've clicked an element, search for it in the currently open pagegroup
    var positionInAPG;
    if (isElement && (positionInAPG = Pages.getPositionInActivePageGroup(object))) {
      // if we've clicked the exact same element it'll never re-enable
      // hideOnClickOutside delegation because Pages.show() won't let it
      // through, we re-enable it here in that case
      if (positionInAPG == Window._position) {
        Window.bindHideOnClickOutside();
      }

      Window.setPosition(positionInAPG);
    } else {
      // otherwise start loading and open
      Window.load(views, position);
    }

  },

  showFallback: (function() {
    function getUrl(object) {
      var url, type = $.type(object);

      if (type == 'string') {
        url = object;
      } else if (type == 'array' && object[0]) {
        url = getUrl(object[0]);
      } else if (_.isElement(object) && $(object).attr('href')) {
        var url = $(object).attr('href');
      } else if (object.url) {
        url = object.url;
      } else {
        url = false;
      }

      return url;
    }

    return function(object) {
      if (!this._fallback) return;
      var url = getUrl(object);
      if (url) window.location.href = url;
    };
  })()
};

$.extend(Strip, {
  show: function(object) {
    _Strip.show.apply(_Strip, _slice.call(arguments));
    return this;
  },

  hide: function() {
    Window.hide();
    return this;
  },

  disable: function() {
    _Strip.stopDelegating();
    _Strip._disabled = true;
    return this;
  },

  enable: function() {
    _Strip._disabled = false;
    _Strip.startDelegating();
    return this;
  },

  fallback: function(fallback) {
    _Strip._fallback = fallback;
    return this;
  },

  setDefaultSkin: function(skin) {
    Options.defaults.skin = skin;
    return this;
  }
});


// fallback for old browsers without full position:fixed support
if (
    // IE6
    (Browser.IE && Browser.IE < 7)

    // old Android
    // added a version check because Firefox on Android doesn't have a
    // version number above 4.2 anymore
    || ($.type(Browser.Android) == 'number' && Browser.Android < 3)

    // old WebKit
    || (Browser.MobileSafari && ($.type(Browser.WebKit) == 'number' && Browser.WebKit < 533.18))
  ) {
  // we'll reset the show function
  _Strip.show = _Strip.showFallback;
}

// start
$(document).ready(function(event) {
  _Strip.initialize();
});

return Strip;

}));
