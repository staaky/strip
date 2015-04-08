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
    $(document.documentElement).on('click', '.strip[href]', this._delegateHandler = $.proxy(this.delegate, this));
  },

  stopDelegating: function() {
    if (this._delegateHandler) {
      $(document.documentElement).off('click', '.strip[href]', this._delegateHandler);
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
        isElement = object && object.nodeType == 1;

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
              // adjust the position if we find the given object position
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
      if (!_Strip._fallback) return;
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

  // disable some functions we don't want to run
  $.each('startDelegating stopDelegating initialize'.split(' '), function(i, fn) {
    _Strip[fn] = function() { };
  });

  Strip.hide = function() { return this; };
}
