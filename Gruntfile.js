module.exports = function(grunt) {

  // Config
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    dirs: {
      dest: 'dist/<%= pkg.name %>-<%= pkg.version %>'
    },

    vars: { },

    concat: {
      production: {
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

        'src/js/outro.js',
        ],
        dest: '<%= dirs.dest %>/js/strip/strip.js'
      }
    },
    
    copy: {
      production: {
        files: [
          {
            expand: true,
            cwd: 'src/css/',
            src: ['**'],
            dest: '<%= dirs.dest %>/css/'
          }
        ],
      }
    },
    
    uglify: {
      production: {
        options: {
          preserveComments: 'some'
        },
        'src': ['<%= dirs.dest %>/js/strip/strip.js'],
        'dest': '<%= dirs.dest %>/js/strip/strip.min.js'
      }
    },

    clean: {
      dist: 'dist/'
    }

  });

  // Load plugins
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');

  // Tasks
  grunt.registerTask('default', [
    'clean:dist',
    'concat:production', 'copy:production', 'uglify:production'
  ]);

};