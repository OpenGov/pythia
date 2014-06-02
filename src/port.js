"use strict";

var Class = require('../src/class');
var Element = require('../src/element');

module.exports = Class(Element, {
  name: 'port',

  init: function (opts) {
    this._pos   = opts.pos;
    this._dim   = opts.dim;
    this._style = opts.style;
  },

  repath: function () {
    var pos = this._pos;
    var dim = this._dim;
    this.translateT = [ 0, 0, pos[0]
                      , 0, 0, pos[1]
                      , 0, 0, 1
                      ];
    return this;
  },

  resize: function (pos, dim) {
    this._pos = pos;
    this._dim = dim;
  }
});
