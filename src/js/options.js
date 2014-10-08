var Options = (function() {
  var BASE = _Skins.base,
      RESET = deepExtendClone(BASE, _Skins.reset);

  function create(options, type, data) {
    options = options || {};
    data = data || {};

    options.skin = options.skin || Window.defaultSkin;

    var SELECTED = options.skin ? $.extend({}, Strip.Skins[options.skin] || Strip.Skins[Window.defaultSkin]) : { },
        MERGED_SELECTED = deepExtendClone(RESET, SELECTED);

    // first merge the default type options with those of the selected skin
    // put the initial options on there based on the given type
    if (type && MERGED_SELECTED.initialTypeOptions[type]) {
      MERGED_SELECTED = deepExtendClone(MERGED_SELECTED.initialTypeOptions[type], MERGED_SELECTED);
      delete MERGED_SELECTED.initialTypeOptions; // these aren't used further, so remove them
    }

    var MERGED = deepExtendClone(MERGED_SELECTED, options);

    // now we have a safe MERGED object to work with

    // set all effect duration to 0 for effects: false
    // IE8 and below never use effects
    if (!MERGED.effects || (Browser.IE && Browser.IE < 9)) {
      MERGED.effects = {};
      $.each(BASE.effects, function(name, effect) {
        $.each((MERGED.effects[name] = $.extend({}, effect)), function(option) {
          MERGED.effects[name][option] = 0;
        });
      });
    }

    // keyboard
    if (MERGED.keyboard) {
      // when keyboard is true, enable all keys
      if ($.type(MERGED.keyboard) == 'boolean') {
        MERGED.keyboard = {};
        $.each(BASE.keyboard, function(key, bool) {
          MERGED.keyboard[key] = true;
        });
      }

      // disable left and right keys for video, because players like
      // youtube use these keys
      if (type == 'vimeo' || type == 'youtube') {
        $.extend(MERGED.keyboard, { left: false, right: false });
      }
    }

    // vimeo & youtube always have no overlap
    if (type == 'vimeo' || type == 'youtube') {
      MERGED.overlap = false;
    }

    return MERGED;
  }

  return {
    create: create
  };
})();
