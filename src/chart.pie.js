"use strict";

var _ = require('lodash');

var Class = require('../src/class');
var Element = require('../src/element');
var Chart = require('../src/chart');
var CircleSlice = require('../src/element.circleSlice');

module.exports = Class(Chart, {
  name: 'pieChart',

  defaultOptions: [
    ['multiline', false],
    ['x', 50],
    ['y', 50],
    ['radius', 48]
  ],

  refresh: function() {
    //this._r.pause();
    this.killAllAnimations();

    if (_.isEmpty(this._data._data)) {
      this.clear();
      return;
    }

    this.flipCache();

    var self  = this;
    var total = _.reduce(self._data._data, function (sum, el) { return sum + self.dataValue(el); }, 0);
    var count = 0;
    var opts = this._opts;

    self.pos = self.pos || 0;

    if (self._opts.multiline) {
      _.all(self.dataLine(self._data._data[0]), function(line, key) {
        key = self.pos;
        var data = _.zip(_.pluck(_.map(self._data._data, self.dataLine), key), _.keys(self._data._data));

        total = _.reduce(data, function (sum, el) {
          var value = Math.abs(self.dataValue(el[0]));
          return sum + value;
        }, 0);

        addLine(data, key);
        return false;
      });
    } else { //not multiline
      addLine(self._data._data, 0);
    }

    function addLine(data, lineNo) {
      var startAngle = Math.PI / 6;
      var animation;

      _.each(data, function(zipped, i) {
        var el      = zipped[0],
            lineKey = zipped[1],
            line    = self._data._data[lineKey],
            value   = self.dataValue(el, i, lineNo),
            ratio,
            angle,
            opacity = 0.6;

        if (_.isUndefined(value)) {
          return;
        }

        if (value < 0) {
          opacity = 0.01;
        }

        if (total) {
          ratio = (Math.abs(value) / total);
          angle = ratio * 2 * Math.PI;
        } else {
          angle = 2 * Math.PI / data.length;
        }

        var lineId = self.dataLineId(self._data._data[lineKey]),
            slice  = self.cache(lineId, 'slice');

        if (!slice) {
          slice = self.add(CircleSlice(
            [opts.x, opts.y],
            opts.radius,
            startAngle,
            0,
            pythia.Style(self.style, {
              color:         line.color,
              size:          'proportional',
              fillOpacity:   opacity,
              stroke:        line.color,
              strokeColor:   line.color,
              strokeOpacity: 0.6
            })
          )).addClass('slice')
           .data(el, self._data._data[lineKey], lineNo, self._data._data[lineKey].id);

          ratio = angle / (2 * Math.PI);
          var a = self.animate(morph(slice, slice._startAngle, slice._angle, startAngle, angle), ratio * 500);

          if (animation) {
            animation = animation.chain(a);
          } else {
            animation = a;
          }

        } else {
          slice._pos    = [opts.x, opts.y];
          slice._radius = opts.radius;
          slice.data(el, self._data._data[lineKey], lineNo, self._data._data[lineKey].id);

          // Don't flip styles on 0
          if (value < 0) {
            slice.setStyle('fillOpacity', 0.1);
          } else if (value > 0) {
            slice.setStyle('fillOpacity', 0.6);
          }

          ratio = Math.abs(angle) / (2 * Math.PI);
          self.animate(morph(slice, slice._startAngle, slice._angle, startAngle, angle), 500);
        }
        slice.percent = ratio * 100;
        startAngle += angle;
        self.cache(lineId, 'slice', slice);
      });
    }
    this.flushCache();
  //  this._r.unPause();
  }
});

function morph(slice, oldStartAngle, oldAngle, startAngle, angle) {
  return function (scale) {
    slice._startAngle = oldStartAngle + (startAngle - oldStartAngle) * scale;
    slice._angle      = oldAngle + (angle - oldAngle) * scale;

    slice.updateTransform();
  };
}
