"use strict";

var Class = require('../src/class');
var Element = require('../src/element');

module.exports = Class(Element, {
  name: 'text',

  repath: function (position, data, style) {
    (function (text, pos, style) {
      this._path  = ['F', text];
      this._style = style;
      this._pos = pos;
      this.translate(pos);

    }).apply(this, this._args);
  }
});
