var WistiaReady = (function() {

var WistiaReady = function() { return this.initialize.apply(this, _slice.call(arguments)); };
$.extend(WistiaReady.prototype, {
  initialize: function(url, callback) {
    this.url = url;
    this.callback = callback;

    this.load();
  },

  load: function() {
    // first try the cache
    var cache = Cache.get(this.url);

    if (cache) {
      return this.callback(cache.data);
    }

    var protocol = 'http' + (window.location && window.location.protocol == 'https:' ? 's' : '') + ':',
        video_url = getURIData(this.url).url;

    video_url = video_url.replace(/.*?:\/\//g, "//");

    this._xhr = $.getJSON(protocol + '//fast.wistia.com/oembed?url=' + protocol + video_url + '&callback=?', $.proxy(function(_data) {
      var data = {
        dimensions: {
          width: _data.width,
          height: _data.height
        }
      };

      Cache.set(this.url, data);

      if (this.callback) this.callback(data);
    }, this));
  },

  abort: function() {
    if (this._xhr) {
      this._xhr.abort();
      this._xhr = null;
    }
  }
});


var Cache = {
  cache:  [],

  get: function(url) {
   var entry = null;
   for(var i=0;i<this.cache.length;i++) {
     if (this.cache[i] && this.cache[i].url == url) entry = this.cache[i];
   }
   return entry;
  },

  set: function(url, data) {
    this.remove(url);
    this.cache.push({ url: url, data: data });
  },

  remove: function(url) {
   for(var i=0;i<this.cache.length;i++) {
     if (this.cache[i] && this.cache[i].url == url) {
       delete this.cache[i];
     }
   }
  }
};

return WistiaReady;

})();
