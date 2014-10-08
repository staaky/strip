var ImageReady = function() { return this.initialize.apply(this, _slice.call(arguments)); };
$.extend(ImageReady.prototype, {
  _supports: {
    naturalWidth: (function() {
      return ('naturalWidth' in new Image())
    })()
  },

  initialize: function(img, callback, errorCallback) {
    this.img = $(img);
    this.callback = callback;
    this.errorCallback = errorCallback;

    // fallback for browsers without support for naturalWidth/Height
    // IE7-8
    if (!this._supports.naturalWidth) {
      this.fallback();
      return;
    }

    this.img.bind('error', $.proxy(this.error, this));

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

    this.tick();
  },

  tick: function() {
    this._ticking = setTimeout($.proxy(function() {
      if (this.img[0].naturalWidth > 0) {
        this.callback(this.img[0]);
        return;
      }

      // update time spend
      this._time += this._delay;

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

      this.tick();
    }, this), this._delay);
  },

  fallback: function() {
    var img = new Image();
    this._fallbackImg = img;

    img.onload = $.proxy(function() {
      img.onload = function() {};

      this.img[0].naturalWidth = img.width;
      this.img[0].naturalHeight = img.height;

      this.callback(this.img[0]);
    }, this);

    img.onerror = $.proxy(this.error, this);

    img.src = this.img.attr('src');
  },

  abort: function() {
    // IE < 9
    if (this._fallbackImg) {
      this._fallbackImg.onload = function() { };
    }

    if (this._ticking) {
      clearTimeout(this._ticking);
      this._ticking = 0;
    }
  },

  error: function() {
    if (this.errored) return;
    this.errored = true;

    this.abort();
    if (this.errorCallback) this.errorCallback();
  }
});
