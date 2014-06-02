"use strict";

var _ = require('lodash');

var color = require('../src/color');
var Class = require('../src/class');
var Element = require('../src/element');
var Chart = require('../src/chart');
var Rect = require('../src/element.rect');

module.exports = Class(Chart, {
  name: 'barChart',

  defaultOptions: [
    ['multiline', false],
    ['roundLongest', false],
    ['stacked', false],
    ['width', 1],
    ['spacing', 0.5],
    ['margin', 0.5]
  ],

  refresh: function() {
//    this._r.pause();
    this.killAllAnimations();
    if (_.isEmpty(this._data._data)) {
      this.clear();
      return;
    }

    this.flipCache();

    var self             = this,
        opts             = this._opts,
        xBase            = this.xWidth(),
        xWidth           = xBase * opts.width,
        xStart           = xBase * opts.margin,
        xSpacing         = xBase * opts.spacing,
        barLineSpacing   = opts.barLineSpacing || 0.001,
        lineCount        = this._data && _.size(this._data._data),
        highest          = pythia.max(this._data._data, this.dataValue, this.dataLine, opts.multiline, opts.stacked),
        lineColor        = pythia.accessor(this._opts.lineColor , this._style.color),
        multiline        = opts.multiline,
        stacked          = opts.stacked,
        fill             = opts.fill        || false,
        percent          = opts.percent     || false,
        cumulativeHeight = [],
        cumulativeValue  = [],
        lastLine,
        longest      = percent ? 100 : pythia.max(this._data._data, this.dataValue, this.dataLine, multiline, stacked),
        shortList    = pythia.shortList(this._data._data, this.dataValue, this.dataLine, multiline, stacked),
        shortest     = _.min(shortList),
        // Negative stacked graphs need to pull positive lines down
        // twice as far so the upper most line reflects the sum of
        /// all the data points
        negativeDrag = 1;

    var stepSize,
        totals = {},
        counts = {};

    var data = this._data._data;
    if (multiline && percent) {
      for (var lineKey in data) {
        var line = self.dataLine(data[lineKey]);
        for (var key in line) {
          var d = line[key];
          if (_.isUndefined(totals[key])) {
            totals[key] = 0;
            counts[key] = 0;
          }
          totals[key] += Math.abs(this.dataValue(d, key, lineKey));
          counts[key] += 1;
        }
      }

      this.stepCount = 4;

      if (shortest < 0) {
        var minPercent = 0,
            negative25,
            i, len;

        for (i = 0, len = shortList.length; i < len; ++i) {
          shortList[i] = (shortList[i]/totals[i]) * 100;
          if (shortList[i] < minPercent) {
            minPercent = shortList[i];
          }
        }

        negative25 = Math.floor(minPercent / 25);
        shortest   = negative25 * 25;
        this.stepCount -= negative25;
      }

      this.step = (100 - shortest) / this.stepCount;
    } else {
      if (shortest < 0 && this.hasPositiveData()) {
        negativeDrag = 2;
      }

      var longShort = pythia.axisScale(longest, shortest * negativeDrag, 5);

      longest        = longShort[0];
      shortest       = longShort[1];
      this.step      = longShort[2];
      this.stepCount = 5;
    }

    if (this._opts.roundLongest) {
      longest = this.roundLongest(longest);
    }

    this.longest  = longest;
    this.shortest = shortest;

    if (this._opts.roundLongest) {
      highest = this.roundLongest(longest);
    }
    this.longest = highest;


    if (opts.multiline) {
      _.each(data.reverse(), addLine);
    } else { //not multiline
      addLine(data, 0);
    }

    function addLine(line, lineNo) {
      var i = 0;
      _.each(self.dataLine(line), function(element, key) {
        var value = self.dataValue(element, key, lineNo);
        var height = value / highest * 100;
        var x, y = 100 - height;

        if (opts.stacked) {
          if (lineNo) {
            y -= cumulativeHeight[key];
            cumulativeHeight[key] += height;
          } else {
            cumulativeHeight[key] = height;
          }
        }

        var blSpacing = barLineSpacing * self._w;

        x = xStart + (xWidth + xSpacing + barLineSpacing) * i;

        if (opts.multiline && !opts.stacked) {
          x = x * lineCount + (lineNo * (xWidth + barLineSpacing));
        }

        var color = lineColor(line, lineNo);
        var style = {
          color: color,
          fillOpacity: 0.8,
          strokeOpacity: 1,
          strokeWidth: 0,
          strokeColor: color
        };

        var bar;
        var cacheId = [self.dataLineId(line), key];

        bar =
          Rect([x,y], [xWidth, height], style)
              .addClass('bar')
              .data(value, line, key, line.id);
        self.add(bar);
        bar._style = style;
        self.cache([self.dataLineId(line)], 'bar', []);

        self.cache(cacheId, 'bar', bar);

        bar.toBottom().refresh();
        ++i;
      });
    }

    this.flushCache();
//    this._r.unPause();
  }
});
