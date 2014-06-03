"use strict";

var Class = require('../src/class');
var Path = require('../src/element.path');

module.exports = Class(Path, {
  name: 'rect',

  init: function (pos, dim , style) {
    this._pos = pos;
    this._dim = dim;
    this._style = style;
  },

  repath: function () {
    (function () {
      var pos = this._pos;
      var dim = this._dim;

      this.resetT();
      this.reset()
          .move([0, 0])
          .line([dim[0], 0])
          .line(dim)
          .line([0, dim[1]])
          .close()
          .translate(pos);
    }).apply(this, this._args);
    return this;
  },

  center: function () {
    var pos = this._pos;
    var dim = this._dim;

    return [pos[0] + dim[0]/2, pos[1] + dim[1]/2];
  }
});
