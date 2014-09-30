var Pages = {
	initialize: function(element) {
	  this.element = element;
	  this.pages = {};
	  this.uid = 1;

    this._loading = {};
	},

	add: function(views) {
		this.uid++;

    this.views = views;

    this.pages[this.uid] = []; // create room for these pages

    // add pages for all these views
    $.each(views, $.proxy(function(i, view) {
    	this.pages[this.uid].push(new Page(view, i + 1, this.views.length));
    }, this));
	},

	show: function(position, callback) {
    var page = this.pages[this.uid][position - 1];

    // never try to reload the exact same frame
    if (this.page && this.page.uid == page.uid) return;

    this.page = page; // store

    this.removeHiddenAndLoadingInactive();
    page.show(callback);
	},

  getLoadingCount: function() {
    // we only stop loading if all the frames we have are not loading anymore
    var count = 0;
    $.each(this.pages, function(id, pages) {
      $.each(pages, function(j, page) {
        if (page.loading) count++;
      });
    });
    return count;
  },

  // used by the API when opening
  // checks if the page is in the currently open group
  getPositionInActivePageGroup: function(element) {
    var position = 0;
    var activeGroup = this.pages[this.uid];

    if (activeGroup) {
      $.each(activeGroup, function(i, page) {
        if (page.view.element && page.view.element == element) {
          position = i + 1;
        }
      });
    }

    return position
  },

  // remove pages not matching the current id
	removeExpired: function(instantly) {
    $.each(this.pages, function(id, pages) {
    	if (id != this._id) {
	    	$.each(pages, function(j, page) {
	        page.remove(instantly);  
	    	});
      }
    });
	},


  // Window.hide will call thise when fully closed
	removeAll: function() {
    $.each(this.pages, function(id, pages) {
    	$.each(pages, function(j, page) {
        page.remove();
	    });
    });

    // empty out pages
    this.pages = {};
	},

	hideVisibleInactive: function(alternateDuration) {
		$.each(this.pages, $.proxy(function(id, pages) {
    	$.each(pages, $.proxy(function(j, page) {
	        if (page.uid != this.page.uid) {
	        	page.hide(null, alternateDuration);
	        }
	    }, this));
    }, this));
	},

	stopInactive: function() {
		$.each(this.pages, $.proxy(function(id, pages) {
    	$.each(pages, $.proxy(function(j, page) {
        if (page.uid != this.page.uid && !page.preloading) {
        	page.stop();
        }
	    }, this));
    }, this));
	},

  // TODO: might be nice to have a hide animation before removal, it's instant now
  removeHiddenAndLoadingInactive: function() {
    // track which inactive page groups are empty
    var empty = [];

    $.each(this.pages, $.proxy(function(uid, pages) {
      // only remove pages in the groups that are currently not active
      if (uid != this.uid) {
        var removed = 0;

        $.each(pages, $.proxy(function(j, page) {
            // remove hidden or loading, but dont'remove frames in animation
            if ((!page.visible || page.loading) && !page.animatingWindow) {
              page.remove();
            }

            if (page.removed) removed++; // count all not those we remove now
        }, this));

        // if we've removed all pages from this group it's safe to remove it
        // we don't do this in the loop but below
        if (removed == pages.length) {
          empty.push(uid);
        }
      }
    }, this));

    // now removed all the emptied out page groups
    $.each(empty, $.proxy(function(i, uid) {
      delete this.pages[uid];
    }, this));

  },

	stop: function() {
		$.each(this.pages, function(id, pages) {
    	$.each(pages, function(j, page) {
      	page.stop();
	    });
    });
	}
};
