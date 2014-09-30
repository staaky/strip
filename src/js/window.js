var Window = {
  defaultSkin: 'strip',

  initialize: function() {
    this.queues = [];
    this.queues.showhide = $({});

    this.pages = [];

    this.timers = new Timers();

    this.build();
    this.setSkin(this.defaultSkin);
  },
  
  build: function() {
    // spinner
    if (Spinner.supported) {
      $(document.body).append(this.spinnerMove = $('<div>').addClass('strp-spinner-move')
        .hide()
        .append(this.spinner = $('<div>').addClass('strp-spinner'))
      );
      this._spinner = new Spinner(this.spinner);

      this._spinnerMoveSkinless = this.spinnerMove[0].className;
    }

    // window
    $(document.body).append(this.element = $('<div>').addClass('strp-window strp-measured')

      .append(this._pages = $('<div>').addClass('strp-pages'))

      .append(this._previous = $('<div>').addClass('strp-nav strp-nav-previous')
        .append($('<div>').addClass('strp-nav-button')
          .append($('<div>').addClass('strp-nav-button-background'))
          .append($('<div>').addClass('strp-nav-button-icon'))
        )
        .hide()
      )

      .append(this._next = $('<div>').addClass('strp-nav strp-nav-next')
        .append($('<div>').addClass('strp-nav-button')
          .append($('<div>').addClass('strp-nav-button-background'))
          .append($('<div>').addClass('strp-nav-button-icon'))
        )
        .hide()
      )

      // close
      .append(this._close = $('<div>').addClass('strp-close')
        .append($('<div>').addClass('strp-close-background'))
        .append($('<div>').addClass('strp-close-icon'))
      )
    );

    Pages.initialize(this._pages);

    // support classes
    if (Support.mobileTouch) this.element.addClass('strp-mobile-touch');
    if (!Support.svg) this.element.addClass('strp-no-svg');


    // events
    this._close.bind('click', $.proxy(function(event) {
      event.preventDefault();
      this.hide();
    }, this));

    this._previous.bind('click', $.proxy(function(event) {
      this.previous();
      this._onMouseMove(event); // update cursor
    }, this));

    this._next.bind('click', $.proxy(function(event) {
      this.next();
      this._onMouseMove(event); // update cursor
    }, this));

    this.hideUI(null, 0); // start with hidden <>
  },

  setSkin: function(skin) {
    if (this._skin) {
      this.element.removeClass('strp-window-skin-' + this._skin);
    }
    this.element.addClass('strp-window-skin-' + skin);

    this._skin = skin;
  },

  setSpinnerSkin: function(skin) {
    if (!this.spinnerMove) return;

    if (this._spinnerSkin) {
      this.spinnerMove.removeClass('strp-spinner-move-skin-' + this._spinnerSkin);
    }

    this.spinnerMove.addClass('strp-spinner-move-skin-' + skin);
    // refresh in case of styling updates
    this._spinner.refresh();

    this._spinnerSkin = skin;
  },

  setDefaultSkin: function(skin) {
    this.defaultSkin = skin;
  },


  // Resize
  // window resize (TODO:orientationchange?)
  startObservingResize: function() {
    if (this._isObservingResize) return;

    this._onWindowResizeHandler = $.proxy(this._onWindowResize, this);
    $(window).bind('resize orientationchange', this._onWindowResizeHandler);

    this._isObservingResize = true;
  },

  stopObservingResize: function() {
    if (this._onWindowResizeHandler) {
      $(window).unbind('resize orientationchange', this._onWindowResizeHandler);
      this._onWindowResizeHandler = null;
    }

    this._isObservingResize = false;
  },

  _onWindowResize: function() {
    var page;
    if (!(page = Pages.page)) return;

    if (page.animated || page.animatingWindow) {
      // we're animating, don't stop the animation,
      // instead update dimensions and restart/continue showing
      page.fitToWindow();
      page.show();
    } else {
      // we're not in an animation, resize instantly
      page.fitToWindow();
      this.resize(page.z, null, 0);
      this.adjustPrevNext(null, true);
    }
  },

  resize: function(wh, callback, alternateDuration) {
    var orientation = this.getOrientation();

    var Z = orientation == 'vertical' ? 'Height' : 'Width',
        z = Z.toLowerCase();

    if (wh > 0) {
      this.visible = true;
      this.startObservingResize();

      // onShow callback
      var onShow = this.view && this.view.options.onShow;
      if ($.type(onShow) == 'function') {
        onShow.call(Strip);
      }
    }

    var fromZ = Window.element['outer' + Z]();
    var duration;
    
    // if we're opening use the show duration
    if (fromZ == 0) {
      duration = this.view.options.effects.window.show;

      // add opening class
      this.element.addClass('strp-opening');
      this.opening = true;
    } else if ($.type(alternateDuration) == 'number') {
      // alternate when set
      duration =  alternateDuration;
    } else {
      // otherwise decide on a duration for the transition
      // based on distance
      var transition = this.view.options.effects.transition,
          min = transition.min,
          max = transition.max,
          tdiff = max - min;

      var viewport = Bounds.viewport();
      
      var distance = Math.abs(fromZ - wh),
          percentage = Math.min(1, distance / viewport[z]);

      duration = Math.round(min + (percentage * tdiff));
    }

    if (wh == 0) {
      this.closing = true;
      // we only add the closing class if we're not currently animating the window
      if (!this.element.is(':animated')) {
        this.element.addClass('strp-closing');
      }
    }

    // the animations
    var css = { overflow: 'visible' };
    css[z] = wh + 'px';

    var fx = 1;

    // _getEventSide checks this.element.outerWidth() on mousemove only when 
    // this._outerWidth isn't set, we need that during animation, 
    // afterResize will set it back along with the cached offsetLeft
    this._outerWidth = null;
    this._offsetLeft = null;
 
    this.element.stop(true).animate(css, duration, $.proxy(function() {
      if (--fx < 1) this._afterResize(callback);
    }, this));
    
    if (this.spinnerMove) {
      fx++; // sync this effect
      this.spinnerMove.stop(true).animate(css, duration, $.proxy(function() {
        if (--fx < 1) this._afterResize(callback);
      }, this));
    }
    
    // return the duration for later use in synced animations
    return duration; 
  },

  _afterResize: function(callback) {
    this.opening = false;
    this.closing = false;
    this.element.removeClass('strp-opening strp-closing');

    // cache outerWidth and offsetLeft for _getEventSide on mousemove
    this._outerWidth = this.element.outerWidth();
    this._offsetLeft = this.element.offset().left;

    if (callback) callback();
  },
  

  adjustPrevNext: function(callback, alternateDuration) {
    if (!this.view || !Pages.page) return;
    var page = Pages.page;

    // offset <>
    var windowVisible = this.element.is(':visible');
    if (!windowVisible) this.element.show();

    var pRestoreStyle = this._previous.attr('style'); 
    //this._previous.attr({ style: '' });
    this._previous.removeAttr('style');
    var pnMarginTop = parseInt(this._previous.css('margin-top')); // the original margin top
    this._previous.attr({ style: pRestoreStyle });

    if (!windowVisible) this.element.hide();

    var iH = page.info ? page.info.outerHeight() : 0;

    var buttons = this._previous.add(this._next),
        css = { 'margin-top': pnMarginTop - iH * .5 };

    var duration = this.view.options.effects.transition.min;
    if ($.type(alternateDuration) == 'number') duration = alternateDuration;

    // adjust <> instantly when opening
    if (this.opening) duration = 0;
    
    buttons.stop(true).animate(css, duration, callback);

    this._previous[this.mayPrevious() ? 'show' : 'hide']();
    this._next[this.mayNext() ? 'show' : 'hide']();
  },

  resetPrevNext: function() {
    var buttons = this._previous.add(this._next);
    buttons.stop(true).removeAttr('style');
  },


  // Load
  load: function(views, position) {
    var options = $.extend({
    
    }, arguments[2] || {});

    this.views = views;

    Pages.add(views);

    if (position) {
      this.setPosition(position, $.proxy(function() {
        // if we're not loading anymore, the window has been closed, don't use the callback
        if (!this._loading) return;
        //this._loading = false;

        if (options.callback) options.callback();
      }, this));
    }
  },

  // adjust the size based on the current view
  // this might require closing the window first
  setSide: function(side, callback) {
    if (this.side == side) {
      if (callback) callback();
      return;
    }

    // side has change, first close the window if it isn't already closed
    if (this.visible) {
      // NOTE: side should be set here since the window was visible
      // so using resize should be safe
      
      // avoid tracking mouse movement while the window is closing
      this.unbindUI();

      // resize instantly
      this.resize(0, $.proxy(function() {

        // some of the things we'd normally do in hide
        this._safeResetsAfterSwitchSide();

        // we instantly hide the other views here
        Pages.hideVisibleInactive(0);

        this._setSide(side, callback);
      }, this));
    } else {
      this._setSide(side, callback);
    }    
  },

  _setSide: function(side, callback) {
    this.side = side;

    var orientation = this.getOrientation();

    var elements = this.element;
    if (this.spinnerMove) elements = elements.add(this.spinnerMove);

    elements.removeClass('strp-horizontal strp-vertical')
            .addClass('strp-' + orientation);

    var elements = this.element;
    if (this.spinnerMove) elements = elements.add(this.spinnerMove);
    
    var ss = 'strp-side-';
    elements.removeClass(ss + 'top ' + ss + 'right ' + ss + 'bottom ' + ss + 'left')
            .addClass(ss + side);

    if (callback) callback();
  },

  getOrientation: function(side) {
    return (this.side == 'left' || this.side == 'right') ? 'horizontal' : 'vertical';
  },

  // loading indicator
  startLoading: function() {
    if (!this._spinner) return;


    this.spinnerMove.show();
    this._spinner.show();
  },

  stopLoading: function() {
    if (!this._spinner) return;

    // we only stop loading if there are no loading pages anymore
    var loadingCount = Pages.getLoadingCount();

    if (loadingCount < 1) {
      this._spinner.hide($.proxy(function() {
        this.spinnerMove.hide();
      }, this));
    }
  },

  setPosition: function(position, callback) {
    this._position = position;

    // store the current view
    this.view = this.views[position - 1];

    // store the page and show it
    this.page = Pages.show(position, $.proxy(function() {
      var afterPosition = this.view.options.afterPosition;
      if ($.type(afterPosition) == 'function') {
        afterPosition.call(Strip, position);
      }
      if (callback) callback();
    }, this));
  },

  hide: function(callback) {
    var shq = this.queues.showhide;
    shq.queue([]); // clear queue

    shq.queue($.proxy(function(next_stop) {
      Pages.stop();
      next_stop();
    }, this));

    shq.queue($.proxy(function(next_unbind_hide_ui) {
      var duration = this.view ? this.view.options.effects.window.hide : 0;
      this.unbindUI();
      this.hideUI(null, duration);
      next_unbind_hide_ui();
    }, this));

    shq.queue($.proxy(function(next_zero) {
      this.resize(0, $.proxy(function() {
        
        this._safeResetsAfterSwitchSide();

        // all of the below we cannot safely call safely
        this.stopObservingResize();

        Pages.removeAll();

        this._position = -1;

        // afterHide callback
        var afterHide = this.view && this.view.options.afterHide;
        if ($.type(afterHide) == 'function') {
          afterHide.call(Strip);
        }

        this.view = null;

        next_zero();
      }, this), this.view.options.effects.window.hide);
    }, this));

    if ($.type(callback) == 'function') {
      shq.queue($.proxy(function(next_callback) {

        if (callback) callback();
        next_callback();
      }, this));
    }   
  },

  // these are things we can safely call when switching side as well
  _safeResetsAfterSwitchSide: function() {
    // remove styling from window, so no width: 100%; height: 0 issues
    this.element.removeAttr('style');
    if (this.spinnerMove) this.spinnerMove.removeAttr('style');


    //Pages.removeExpired();
    this.visible = false;
    this.timers.clear();
    this.hideUI(null, 0);
    this.resetPrevNext();
    this._cachedMouseMoveEvent = null;
  },

  // Previous / Next 
  mayPrevious: function() {
    return (this.view && this.view.options.loop && this.views && this.views.length > 1) || this._position != 1;
  },

  previous: function(force) {
    var mayPrevious = this.mayPrevious();
    
    if (force || mayPrevious) {
      this.setPosition(this.getSurroundingIndexes().previous);
    }
  },

  mayNext: function() {
    var hasViews = this.views && this.views.length > 1;
    
    return (this.view && this.view.options.loop && hasViews) || (hasViews && this.getSurroundingIndexes().next != 1);
  },
  
  next: function(force) {
    var mayNext = this.mayNext();
    
    if (force || mayNext) {
      this.setPosition(this.getSurroundingIndexes().next);
    }
  },

  // surrounding
  getSurroundingIndexes: function() {
    if (!this.views) return {};
  
    var pos = this._position,
        length = this.views.length;
    
    var previous = (pos <= 1) ? length : pos - 1,
        next = (pos >= length) ? 1 : pos + 1;
    
    return {     
      previous: previous,
      next: next
    };
  },

  // UI
  bindUI: function() {
    this.unbindUI();

    if (!Support.mobileTouch) {
      this.element.bind('mouseenter', this._showUIHandler = $.proxy(this.showUI, this))
                  .bind('mouseleave', this._hideUIHandler = $.proxy(this.hideUI, this));
    
      this.element.bind('mousemove', this._mousemoveUIHandler = $.proxy(function() {
        this.showUI();
        this.startUITimer();
      }, this));

      // <> mousemove/click states
      this._pages.delegate('.strp-container', 'mousemove', this._onMouseMoveHandler = $.proxy(this._onMouseMove, this))
                 .delegate('.strp-container', 'mouseout', this._onMouseOutHandler = $.proxy(this._onMouseOut, this))
                 .delegate('.strp-container', 'mouseenter', this._onMouseEnterHandler = $.proxy(this._onMouseEnter, this));

      
      
      $(window).bind('scroll', this._onScrollHandler = $.proxy(this._onScroll, this));
    }

    this._pages.delegate('.strp-container', 'click', this._onClickHandler = $.proxy(this._onClick, this));
  },

  // TODO: switch to jQuery.on/off
  unbindUI: function() {
    if (this._showUIHandler) {
      this.element.unbind('mouseenter', this._showUIHandler)
                  .unbind('mouseleave', this._hideUIHandler)
                  .unbind('mousemove', this._mousemoveUIHandler);

      this._pages.undelegate('.strp-container', 'mousemove', this._onMouseMoveHandler)
                 .undelegate('.strp-container', 'mouseout', this._onMouseOutHandler)
                 .undelegate('.strp-container', 'mouseenter', this._onMouseEnterHandler);

      $(window).unbind('scroll', this._onScrollHandler);
    }

    if (this._onClickHandler) {
      this._pages.undelegate('.strp-container', 'click', this._onClickHandler);
      this._onClickHandler = null;
    }
  },

  // reset cached offsetLeft and outerWidth so they are recalculated after scrolling,
  // the cached values might be incorrect after scrolling left/right
  _onScroll: function() {
    this._offsetLeft = this._outerWidth = null;
  },

  // events bounds by bindUI
  _onMouseMove: function(event) {
    var Side = this._getEventSide(event),
        side = Side.toLowerCase();

    this.element[(this['may' + Side]() ? 'add' : 'remove') + 'Class']('strp-hovering-clickable');
    this._previous[(side != 'next' ? 'add' : 'remove') + 'Class']('strp-nav-previous-hover strp-nav-hover');
    this._next[(side == 'next' ? 'add' : 'remove') + 'Class']('strp-nav-next-hover strp-nav-hover');
  },

  _onMouseOut: function(event) {
    this.element.removeClass('strp-hovering-clickable');
    this._previous.removeClass('strp-nav-previous-hover')
                  .add(this._next.removeClass('strp-nav-next-hover'))
                  .removeClass('strp-nav-hover');
  },

  _onClick: function(event) {
    var Side = this._getEventSide(event),
        side = Side.toLowerCase();

    this[side]();

    // adjust cursor, doesn't work with effects
    // but _onMouseEnter is used to fix that
    this._onMouseMove(event);
  },

  _onMouseEnter: function(event) {
    // this solves clicking an area and not having an updating cursor
    // when not moving cursor after click. When an overlapping page comes into view
    // it'll trigger a mouseenter after the mouseout on the disappearing page
    // that would normally remove the clickable class
    this._onMouseMove(event);
  },

  _getEventSide: function(event) {
    var offsetLeft = this._offsetLeft || this.element.offset().left;
    var left = event.pageX - offsetLeft;
    var width = this._outerWidth || this.element.outerWidth();    

    return left < .5 * width ? 'Previous' : 'Next';
  },

  // Actual UI actions
  showUI: function(callback, alternateDuration) {
    // clear the timer everytime so we can keep clicking elements and fading
    // in the ui while not having the timer interupt that with a hide
    this.clearUITimer();

    // we're only fading the inner button icons since the margin on their wrapper divs might change
    var elements = this.element.find('.strp-nav-button');

    var duration = this.view ? this.view.options.effects.ui.show : 0;
    if ($.type(alternateDuration) == 'number') duration = alternateDuration;
 
    elements.stop(true).fadeTo(duration, 1, $.proxy(function() {
      this.startUITimer();
      if ($.type(callback) == 'function') callback();
    }, this));
  },
  
  hideUI: function(callback, alternateDuration) {
    var elements = this.element.find('.strp-nav-button');

    var duration = this.view ? this.view.options.effects.ui.hide : 0;
    if ($.type(alternateDuration) == 'number') duration = alternateDuration;
    
    elements.stop(true).fadeOut(duration, function() {
      if ($.type(callback) == 'function') callback();
    });
  },
  
  // UI Timer
  clearUITimer: function() { this.timers.clear('ui'); },
  
  startUITimer: function() {
    this.clearUITimer();
    this.timers.set('ui', $.proxy(function(){ 
      this.hideUI();
    }, this), this.view ? this.view.options.uiDelay : 0);
  }
};

// don't hide the UI on mobile
if (Support.mobileTouch) {
  $.each('showUI hideUI clearUITimer startUITimer'.split(' '), function(i, fn) {
    Window[fn] = function() { };
  });
}