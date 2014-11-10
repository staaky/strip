module.exports = function(grunt) {

  // Config
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    dirs: {
      dest: 'dist'
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
        dest: '<%= dirs.dest %>/js/strip.pkgd.js'
      },
      css: {
        options: {
          process: true
        },
        src: ['src/css/strip.css'],
        dest: '<%= dirs.dest %>/css/strip.css'
      }
    },

    copy: {
      'css': {
        files: [
          {
            expand: true,
            cwd: 'src/css/strip-skins/',
            src: ['**'],
            dest: '<%= dirs.dest %>/css/strip-skins/'
          }
        ]
      }
    },

    uglify: {
      js: {
        options: {
          preserveComments: 'some'
        },
        'src': ['<%= dirs.dest %>/js/strip.pkgd.js'],
        'dest': '<%= dirs.dest %>/js/strip.pkgd.min.js'
      }
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
          expand: true,
          cwd: 'src/css/',
          src: ['**/*.svg'],
          dest: 'src/css/'
        }]
      }
    },

    clean: {
      dest: '<%= dirs.dest %>/*'
    }
  });

  // Load plugins
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-svgmin');
  grunt.loadNpmTasks('grunt-sync');

  // Tasks
  grunt.registerTask('default', [
    'clean:dest',
    'concat:js', 'uglify:js',
    'concat:css', 'copy:css'
  ]);

  grunt.registerTask('svg', ['svgmin']);
};