module.exports = function(grunt) {
  "use strict";

  grunt.initConfig({
    browserify: {
      options: {
        watch: true,
        bundleOptions: {
          standalone: 'pythia'
        }
      },
      dist: {
        src: 'src/pythia.js',
        dest: 'dist/pythia.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');


  grunt.registerTask('dist', ['browserify:dist']);
  grunt.registerTask('default', ['dist']);
};
