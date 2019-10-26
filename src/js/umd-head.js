/*!
 * Strip - An Unobtrusive Responsive Lightbox - v<%= pkg.version %>
 * (c) 2014-<%= grunt.template.today("yyyy") %> Nick Stakenburg
 *
 * http://www.stripjs.com
 *
 * @license: https://creativecommons.org/licenses/by/4.0
 */

// UMD wrapper
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['jquery'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node/CommonJS
    module.exports = factory(require('jquery'));
  } else {
    // Browser global
    root.Strip = factory(jQuery);
  }
}(this, function($) {
