//  Keyboard
//  keeps track of keyboard events when enabled
var Keyboard = {
  enabled: false,

  keyCode: {
    'left':  37,
    'right': 39,
    'esc':   27
  },

  // enable is passed the keyboard option of a page, which can be false
  // or contains multiple buttons to toggle
  enable: function(enabled) {
    this.disable();

    if (!enabled) return;

    $(document).on('keydown', this._onKeyDownHandler = $.proxy(this.onKeyDown, this))
               .on('keyup', this._onKeyUpHandler = $.proxy(this.onKeyUp, this));

    this.enabled = enabled;
  },

  disable: function() {
    this.enabled = false;

    if (this._onKeyUpHandler) {
      $(document).off('keyup', this._onKeyUpHandler)
                 .off('keydown', this._onKeyDownHandler);
      this._onKeyUpHandler = this._onKeyDownHandler = null;
    }
  },

  onKeyDown: function(event) {
    if (!this.enabled || !Window.visible) return;

    var key = this.getKeyByKeyCode(event.keyCode);

    if (!key || (key && this.enabled && !this.enabled[key])) return;

    event.preventDefault();
    event.stopPropagation();

    switch (key) {
      case 'left':
        Window.previous();
        break;
      case 'right':
        Window.next();
        break;
    }
  },

  onKeyUp: function(event) {
    if (!this.enabled || !Window.visible) return;

    var key = this.getKeyByKeyCode(event.keyCode);

    if (!key || (key && this.enabled && !this.enabled[key])) return;

    switch (key) {
      case 'esc':
        Window.hide();
        break;
    }
  },

  getKeyByKeyCode: function(keyCode) {
    for(var key in this.keyCode) {
      if (this.keyCode[key] == keyCode) return key;
    }
    return null;
  }
};
