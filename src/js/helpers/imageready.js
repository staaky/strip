/* ImageReady (standalone) - part of Voilà
 * http://voila.nickstakenburg.com
 * MIT License
 */
var ImageReady = (function($) {

var Poll = function() {
  return this.initialize.apply(this, Array.prototype.slice.call(arguments));
};
$.extend(Poll.prototype, {
  initialize: function() {
    this.options = $.extend({
      test: function() {},
      success: function() {},
      timeout: function() {},
      callAt: false,
      intervals: [
        [0, 0],
        [1 * 1000, 10],
        [2 * 1000, 50],
        [4 * 1000, 100],
        [20 * 1000, 500]
      ]
    }, arguments[0] || {});

    this._test = this.options.test;
    this._success = this.options.success;
    this._timeout = this.options.timeout;

    this._ipos = 0;
    this._time = 0;
    this._delay = this.options.intervals[this._ipos][1];
    this._callTimeouts = [];

    this.poll();
    this._createCallsAt();
  },

  poll: function() {
    this._polling = setTimeout($.proxy(function() {
      if (this._test()) {
        this.success();
        return;
      }

      // update time
      this._time += this._delay;

      // next i within the interval
      if (this._time >= this.options.intervals[this._ipos][0]) {
        // timeout when no next interval
        if (!this.options.intervals[this._ipos + 1]) {
          if ($.type(this._timeout) == 'function') {
            this._timeout();
          }
          return;
        }

        this._ipos++;

        // update to the new bracket
        this._delay = this.options.intervals[this._ipos][1];
      }

      this.poll();
    }, this), this._delay);
  },

  success: function() {
    this.abort();
    this._success();
  },

  _createCallsAt: function() {
    if (!this.options.callAt) return;

    // start a timer for each call
    $.each(this.options.callAt, $.proxy(function(i, at) {
      var time = at[0], fn = at[1];

      var timeout = setTimeout($.proxy(function() {
        fn();
      }, this), time);

      this._callTimeouts.push(timeout);
    }, this));
  },

  _stopCallTimeouts: function() {
    $.each(this._callTimeouts, function(i, timeout) {
      clearTimeout(timeout);
    });
    this._callTimeouts = [];
  },

  abort: function() {
    this._stopCallTimeouts();

    if (this._polling) {
      clearTimeout(this._polling);
      this._polling = null;
    }
  }
});


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
      method: 'onload',
      pollFallbackAfter: 1000
    }, arguments[3] || {});

    // onload and a fallback for no naturalWidth support (IE6-7)
    if (this.options.method == 'onload' || !this.supports.naturalWidth) {
      this.load();
      return;
    }

    // start polling
    this.poll();
  },

  // NOTE: Polling for naturalWidth is only reliable if the
  // <img>.src never changes. naturalWidth isn't always reset
  // to 0 after the src changes (depending on how the spec
  // was implemented). The spec even seems to be against
  // this, making polling unreliable in those cases.
  poll: function() {
    this._poll = new Poll({
      test: $.proxy(function() {
        return this.img.naturalWidth > 0;
      }, this),

      success: $.proxy(function() {
        this.success();
      }, this),

      timeout: $.proxy(function() {
        // error on timeout
        this.error();
      }, this),

      callAt: [
        [this.options.pollFallbackAfter, $.proxy(function() {
          this.load();
        }, this)]
      ]
    });
  },

  load: function() {
    this._loading = setTimeout($.proxy(function() {
      var image = new Image();
      this._onloadImage = image;

      image.onload = $.proxy(function() {
        image.onload = function() {};

        if (!this.supports.naturalWidth) {
          this.img.naturalWidth = image.width;
          this.img.naturalHeight = image.height;
          image.naturalWidth = image.width;
          image.naturalHeight = image.height;
        }

        this.success();
      }, this);

      image.onerror = $.proxy(this.error, this);

      image.src = this.img.src;
    }, this));
  },

  success: function() {
    if (this._calledSuccess) return;

    this._calledSuccess = true;

    // stop loading/polling
    this.abort();

    // some time to allow layout updates, IE requires this!
    this.waitForRender($.proxy(function() {
      this.isLoaded = true;
      this.successCallback(this);
    }, this));
  },

  error: function() {
    if (this._calledError) return;

    this._calledError = true;

    // stop loading/polling
    this.abort();

    // don't wait for an actual render on error, just timeout
    // to give the browser some time to render a broken image icon
    this._errorRenderTimeout = setTimeout($.proxy(function() {
      if (this.errorCallback) this.errorCallback(this);
    }, this));
  },

  abort: function() {
    this.stopLoading();
    this.stopPolling();
    this.stopWaitingForRender();
  },

  stopPolling: function() {
    if (this._poll) {
      this._poll.abort();
      this._poll = null;
    }
  },

  stopLoading: function() {
    if (this._loading) {
      clearTimeout(this._loading);
      this._loading = null;
    }

    if (this._onloadImage) {
      this._onloadImage.onload = function() { };
      this._onloadImage.onerror = function() { };
    }
  },

  // used by success() only
  waitForRender: function(callback) {
    this._renderTimeout = setTimeout(callback);
  },

  stopWaitingForRender: function() {
    if (this._renderTimeout) {
      clearTimeout(this._renderTimeout);
      this._renderTimeout = null;
    }

    if (this._errorRenderTimeout) {
      clearTimeout(this._errorRenderTimeout);
      this._errorRenderTimeout = null;
    }
  }
});

return ImageReady;
})(jQuery);
