var Options = {
  defaults: {
    effects: {
      spinner: { show: 200, hide: 200 },
      transition: { min: 175, max: 250 },
      ui: { show: 0, hide: 200 },
      window: { show: 300, hide: 300 }
    },
    hideOnClickOutside: true,
    keyboard: {
      left:  true,
      right: true,
      esc:   true
    },
    loop: true,
    overlap: true,
    preload: [1,2],
    position: true,
    skin: 'strip',
    side: 'right',
    spinner: true,
    toggle: true,
    uiDelay: 3000,
    vimeo: {
      autoplay: 1,
      api: 1,
      title: 1,
      byline: 1,
      portrait: 0,
      loop: 0
    },
    youtube: {
      autoplay: 1,
      controls: 1,
      enablejsapi: 1,
      hd: 1,
      iv_load_policy: 3,
      loop: 0,
      modestbranding: 1,
      rel: 0,
      vq: 'hd1080' // force hd: http://stackoverflow.com/a/12467865
    },

    initialTypeOptions: {
      'image': { },
      'vimeo': {
        width: 1280
      },
      // Youtube needs both dimensions, it doesn't support fetching video dimensions like Vimeo yet.
      // Star this ticket if you'd like to get support for it at some point:
      // https://code.google.com/p/gdata-issues/issues/detail?id=4329
      'youtube': {
        width: 1280,
        height: 720
      }
    }
  },

  create: function(opts, type, data) {
    opts = opts || {};
    data = data || {};

    opts.skin = opts.skin || this.defaults.skin;

    var selected = opts.skin ? $.extend({}, Strip.Skins[opts.skin] || Strip.Skins[this.defaults.skin]) : {},
        merged = $.extend(true, {}, this.defaults, selected);

    // merge initial type options
    if (merged.initialTypeOptions) {
      if (type && merged.initialTypeOptions[type]) {
        merged = $.extend(true, {}, merged.initialTypeOptions[type], merged);
      }
      // these aren't used further, so remove them
      delete merged.initialTypeOptions;
    }

    // safe options to work with
    var options = $.extend(true, {}, merged, opts);

    // set all effect duration to 0 for effects: false
    // IE8 and below never use effects
    if (!options.effects || (Browser.IE && Browser.IE < 9)) {
      options.effects = {};
      $.each(this.defaults.effects, function(name, effect) {
        $.each((options.effects[name] = $.extend({}, effect)), function(option) {
          options.effects[name][option] = 0;
        });
      });

      // disable the spinner when effects are disabled
      options.spinner = false;
    }

    // keyboard
    if (options.keyboard) {
      // when keyboard is true, enable all keys
      if ($.type(options.keyboard) == 'boolean') {
        options.keyboard = {};
        $.each(this.defaults.keyboard, function(key, bool) {
          options.keyboard[key] = true;
        });
      }

      // disable left and right keys for video, because players like
      // youtube use these keys
      if (type == 'vimeo' || type == 'youtube') {
        $.extend(options.keyboard, { left: false, right: false });
      }
    }

    // vimeo & youtube always have no overlap
    if (type == 'vimeo' || type == 'youtube') {
      options.overlap = false;
    }

    return options;
  }
};
