/*!
 * Strip - A Less Intrusive Responsive Lightbox - v<%= pkg.version %>
 * (c) 2014-<%= grunt.template.today("yyyy") %> Nick Stakenburg
 *
 * http://www.stripjs.com
 *
 * Licensing:
 * - Commercial: http://www.stripjs.com/license
 * - Non-commercial: http://creativecommons.org/licenses/by-nc-nd/3.0
 *
 */

// Use AMD or window
;(function(factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else if (jQuery && !window.Strip) {
    window.Strip = factory(jQuery);
  }
}(function($) {

