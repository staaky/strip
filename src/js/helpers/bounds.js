var Bounds = {
  viewport: function() {
    var dimensions = {
      width: $(window).width()
    };

    // Mobile Safari has a bugged viewport height after scrolling
    // Firefox on Android also has problems with height
    if (Browser.MobileSafari || (Browser.Android && Browser.Gecko)) {
      var zoom = document.documentElement.clientWidth / window.innerWidth;
      dimensions.height = window.innerHeight * zoom;
    } else {
      // default
      dimensions.height = $(window).height();
    }

    return dimensions;
  }
};
