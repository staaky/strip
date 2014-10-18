module.exports = function(grunt) {

  // Config
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    dirs: {
      dest: ''
    },

    vars: { },

    concat: {
      production: {
        options: {
          process: true
        },
        src: [
        'src/js/intro.js',
        'src/js/setup.js',
        'src/js/skins.js',

        // helpers
        'src/js/helpers/browser.js',
        'src/js/helpers/helpers.js',
        'src/js/helpers/support.js',
        'src/js/helpers/bounds.js',
        'src/js/helpers/imageready.js',
        'src/js/helpers/spinner.js',
        'src/js/helpers/timers.js',
        'src/js/helpers/url.js',
        'src/js/helpers/vimeoready.js',

        // core
        'src/js/options.js',
        'src/js/view.js',
        'src/js/pages.js',
        'src/js/page.js',
        'src/js/window.js',
        'src/js/keyboard.js',

        'src/js/api.js',

        'src/js/outro.js'
        ],
        dest: 'js/strip.pkgd.js'
      }
    },

    uglify: {
      production: {
        options: {
          preserveComments: 'some'
        },
        'src': ['js/strip.pkgd.js'],
        'dest': 'js/strip.pkgd.min.js'
      }
    },

    compress: {
      production: {
        options: {
          archive: '<%= pkg.name %>-<%= pkg.version %>.zip'
        },
        files: [
          { expand: true, cwd: '', src: ['css/**', 'js/**'], dest: '<%= pkg.name %>'}
        ]
      }
    },

    clean: {
      js: 'js/*'
    }
  });

  // Load plugins
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');

  // Tasks
  grunt.registerTask('default', [
    'clean:js',
    'concat:production', 'uglify:production'
  ]);
};