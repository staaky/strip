function View() {
  this.initialize.apply(this, _slice.call(arguments));
}
$.extend(View.prototype, {
  initialize: function (object) {
    var options = arguments[1] || {},
      data = {};

    // string -> element
    if (typeof object === "string") {
      // turn the string into an element
      object = { url: object };
    }

    // element -> object
    else if (object && object.nodeType === 1) {
      var element = $(object);

      object = {
        element: element[0],
        url: element.attr("href"),
        caption: element.attr("data-strip-caption"),
        group: element.attr("data-strip-group"),
        extension: element.attr("data-strip-extension"),
        type: element.attr("data-strip-type"),
        options:
          (element.attr("data-strip-options") &&
            eval("({" + element.attr("data-strip-options") + "})")) ||
          {},
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
      object.options = $.extend(
        true,
        $.extend({}, options),
        $.extend({}, object.options)
      );
    } else {
      object.options = $.extend({}, options);
    }
    // extend the options
    object.options = Options.create(object.options, object.type, object._data);

    // extend this with data
    $.extend(this, object);

    return this;
  },
});
