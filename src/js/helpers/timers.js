function Timers() {
  return this.initialize.apply(this, _slice.call(arguments));
}
$.extend(Timers.prototype, {
  initialize: function() {
    this._timers = {};
  },

  set: function(name, handler, ms) {
    this._timers[name] = setTimeout(handler, ms);
  },

  get: function(name) {
    return this._timers[name];
  },

  clear: function(name) {
    if (name) {
      if (this._timers[name]) {
        clearTimeout(this._timers[name]);
        delete this._timers[name];
      }
    } else {
      this.clearAll();
    }
  },

  clearAll: function() {
    $.each(this._timers, function(i, timer) {
      clearTimeout(timer);
    });
    this._timers = {};
  }
});
