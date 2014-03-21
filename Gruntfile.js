module.exports = function(grunt) {
  "use strict";

  var sourceFiles = [
    'vendor/raphael.js',

    'src/pythia.js',
    'src/pythia.class.js',
    'src/pythia.color.js',

    'src/pythia.element.js',
    'src/pythia.port.js',
    'src/pythia.element.path.js',
    'src/pythia.element.rect.js',
    'src/pythia.line.js',
    'src/pythia.axis.js',
    'src/pythia.text.js',
    'src/pythia.element.circleslice.js',

    'src/pythia.chart.js',
    'src/pythia.chart.bar.js',
    'src/pythia.chart.line.js',
    'src/pythia.chart.pie.js',

    'src/pythia.canvas.js',

    'src/pythia.renderer.js',
    'src/pythia.renderer.raphael.js',
    'src/pythia.renderer.vml.js'
  ];

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    concat: {
      options: {
        banner: "define(function (require) {\n  var _ = require('lodash');",
        footer: '  return pythia;\n});',
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
