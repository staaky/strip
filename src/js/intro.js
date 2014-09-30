/*!
 * Strip - A Less Intrusive Responsive Lightbox - v<%= pkg.version %>
 * (c) <%= grunt.template.today("yyyy") %> Nick Stakenburg
 *
 * http://www.stripjs.com
 *
 * License: http://www.stripjs.com/license
 */

// Use AMD or window
;(function(factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else if (jQuery && !window.Strip) {
    window.Strip = factory(jQuery);
  }
}(function($) {

