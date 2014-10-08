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
