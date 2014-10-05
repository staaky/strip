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
      fit: 'both'
    }, arguments[2] || {});
    
    
    
    var size  = $.extend({}, dimensions),
        scale = 1,
        attempts = 5;
    
    // border
    if (options.border) {
      bounds.width -= 2 * options.border;
      bounds.height -= 2 * options.border;
    }
    
    // decide what to crop
    var fit = { height: true, width: true };
    switch (options.fit)  {
      case 'none': 
        fit = {};
      case 'width':
      case 'height':
        fit = {};
        fit[options.fit] = true;
        break;
    }
    
    // adjust the bounds depending on what to fit (width/height)
    // start
    while (attempts > 0 && 
           ((fit.width  && size.width > bounds.width) || 
            (fit.height && size.height > bounds.height))) {
      
      // TODO: if both dimensions fall underneath a minimum, then don't event continue
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

//missing easing
var easing = {};

(function() {
  //based on easing equations from Robert Penner (http://www.robertpenner.com/easing)
  var baseEasings = {};
  
  $.each(["Quad", "Cubic", "Quart", "Quint", "Expo"], function( i, name ) {
    baseEasings[ name ] = function( p ) {
      return Math.pow( p, i + 2 );
    };
  });
  
  $.extend( baseEasings, {
    Sine: function ( p ) {
      return 1 - Math.cos( p * Math.PI / 2 );
    }
  });
  
  $.each( baseEasings, function( name, easeIn ) {
    easing[ "easeIn" + name ] = easeIn;
    easing[ "easeOut" + name ] = function( p ) {
      return 1 - easeIn( 1 - p );
    };
    easing[ "easeInOut" + name ] = function( p ) {
      return p < 0.5 ?
            easeIn( p * 2 ) / 2 :
        1 - easeIn( p * -2 + 2 ) / 2;
    };
  });
  
  $.each(easing, function(fn_name, fn) {
    if (!$.easing[fn_name]) $.easing[fn_name] = fn;
  });
})();

