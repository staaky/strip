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
