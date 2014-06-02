"use strict";

var Class = require('../src/class');
var Element = require('../src/element');

module.exports = Class(Element, {
  name: 'path',

  init: function () {
    this._path = [];
  },

  reset: function () {
    this._path = [];
    return this;
  },
  move:  function (v) {
    this._path.push("M", v);
    return this;
  },

  line:  function (v) {
    this._path.push("L", v);
    return this;
  },

  close: function () {
    this._path.push("Z");
    return this;
  },

  curve: function (v1, v2, v3) {
    this._path.push("C", v1, v2, v3);
    return this;
  },

  arc: function (pos, radius, startAngle, angle) {
    this._path.push("A", pos, radius, startAngle, angle);
    return this;
  },

  repath: function () {
    (function (pos, path, style) {
      /*this._path = path;
      this.style(style);
      this.translate(pos);*/
    }).apply(this, this._args);
    return this;
  }
});
