module.exports = function(grunt) {

  // Config
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    dirs: {
      dest: ''
    },

    vars: { },

    concat: {
      js: {
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
      },
      css: {
        options: {
          process: true
        },
        src: ['src/css/strip.css'],
        dest: 'css/strip.css'
      }
    },

    sync: {
      'css-skins': {
        files: [
          {
            expand: true,
            cwd: 'src/css/strip-skins/',
            src: ['**'],
            dest: 'css/strip-skins/'
          }
        ],
        pretend: false, // disables IO
        updateAndDelete: true,
        verbose: true
      }
    },

    uglify: {
      js: {
        options: {
          preserveComments: 'some'
        },
        'src': ['js/strip.pkgd.js'],
        'dest': 'js/strip.pkgd.min.js'
      }
    },

    clean: {
      js: 'js/*',
      css: 'css/strip.css'
    },

    svgmin: {
        options: {
          plugins: [
            { removeViewBox: false },
            { removeUselessStrokeAndFill: false },
            { removeEmptyAttrs: false }
          ]
        },
        dist: {
          files: [{
              expand: true,        // Enable dynamic expansion.
              cwd: 'src/css/',  // Src matches are relative to this path.
              src: ['**/*.svg'],     // Actual pattern(s) to match.
              dest: 'src/css/',  // Destination path prefix.
          }]
        }
    }
  });

  // Load plugins
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-svgmin');
  grunt.loadNpmTasks('grunt-sync');

  // Tasks
  grunt.registerTask('default', [
    'clean:js', 'concat:js', 'uglify:js',
    'clean:css', 'concat:css', 'sync:css-skins'
  ]);

  grunt.registerTask('svg', ['svgmin']);
};