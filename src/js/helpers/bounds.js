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
