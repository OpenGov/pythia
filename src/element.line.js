"use strict";

var Class = require('../src/class');
var Path = require('../src/element.path');
var _ = require('lodash');

module.exports = Class(Path, {
  name: 'line',

  init: function (vertices, style) {
    this._vertices = vertices;
    this._style    = style;
    style.fill     = false;
    style.stroke   = true;
  },

  repath: function () {
    (function () {
      this.reset()
      .move(this._vertices[0]);

      _.each(this._vertices, this.line, this);

    }).apply(this, this._args);
  }
});
