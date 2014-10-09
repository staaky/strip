var _slice = Array.prototype.slice;
var _ = {
  isElement: function(object) {
    return object && object.nodeType == 1;
  },

  element: {
    isAttached: (function() {
      function findTopAncestor(element) {
        var ancestor = element;
        while(ancestor && ancestor.parentNode) {
          ancestor = ancestor.parentNode;
        }
        return ancestor;
      }

      return function(element) {
        var topAncestor = findTopAncestor(element);
        return !!(topAncestor && topAncestor.body);
      };
    })()
  }
};


function px(source) {
  var destination = {};
  for (var property in source)
    destination[property] = source[property] + 'px';
  return destination;
}

// deep extend
function deepExtend(destination, source) {
  for (var property in source) {
    if (source[property] && source[property].constructor &&
      source[property].constructor === Object) {
      destination[property] = $.extend({}, destination[property]) || {};
      deepExtend(destination[property], source[property]);
    } else {
      destination[property] = source[property];
    }
  }
  return destination;
}

// deep clone copy
function deepExtendClone(destination, source) {
  return deepExtend($.extend({}, destination), source);
}


// Fit
var Fit = {
  within: function(dimensions, bounds) {
    var options = $.extend({
      height: true,
      width: true
    }, arguments[2] || {});

    var size  = $.extend({}, dimensions),
        scale = 1,
        attempts = 5;

    // border
    if (options.border) {
      bounds.width -= 2 * options.border;
      bounds.height -= 2 * options.border;
    }

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

