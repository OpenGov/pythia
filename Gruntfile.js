module.exports = function(grunt) {
  "use strict";

  var sourceFiles = [
    'src/pythia.js'
  ];

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    concat: {
      options: {
        banner: "var _ = require('lodash'); var $ = require('jquery');",
        footer: 'module.exports = pythia;',
        separator: ';'
      },
      dist: {
        src: sourceFiles,
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    watch: {
      src: sourceFiles,
      tasks: ['concat']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('default', ['concat']);
};
