"use strict";

var Style = require('../src/style');
var Class = require('../src/class');
var Element = require('../src/element');
var util = require('../src/util');
var Line = require('../src/element.line');
var Text = require('../src/element.text');

module.exports = Class(Element, {
  name: 'axis',

  repath: function () {
    (function (options) {
      var style      = pythia.defaultStyle.axis,
          textStyle  = pythia.defaultStyle['axis text'],
          textYStyle = pythia.defaultStyle['axis ytext'];

      var position  = options.position   || 'bottom',
          type      = options.type       || 'ordinal',
          stepCount = options.stepCount  || 5,
          format    = options.format     || function (d) { return '' + d; },
          longest   = options.longest    || 100,
          shortest  = options.shortest   || 0,
          labels    = options.labels     || [],
          spacing   = options.spacing    || 8,
          i;

      switch (position) {
        case 'bottom':
          this.add(Line([[0,100], [100,100]], style));
          break;
        case 'top':
          this.add(Line([[0,0], [100,0]], style));
          break;
        case 'left':
          this.add(Line([[0,0], [0,100]], style));
          break;
        case 'right':
          this.add(Line([[100,0], [100,100]], style));
          break;
      }


      if (type === 'ordinal') {
        var parentOpts = this._parent._opts;

        var base = this._parent.xWidth();
        var width = base * parentOpts.width;
        var start = base * parentOpts.margin;
        var stepSize = width + base * parentOpts.spacing;

        if (labels.length === 1) {
          position = 50;
        } else {
          position = start + (width/2);
        }

        var tallest = 0;
        for (i = 0; i < labels.length; ++i) {
          var measure = util.measureText(labels[i], options.labelStyle);
          if (measure[1] > tallest) {
            tallest = measure[1];
          }
        }

        var labelMeasure = util.measureText(options.label, options.labelStyle);

        this.add(Text(
          options.label,
          [50, labelMeasure[1] + 2],
          Style(textStyle)
        ));

        var y = tallest + spacing + labelMeasure[1];

        for (i = 0; i < labels.length; ++i) {
          var text = labels[i];
          var el = this.add(Text(text, [position, y], textStyle));
          position += stepSize;
          el.axisIndex = i;
          el.addClass('axisLabel');
          el.addClass('axis_' + i);
        }

        var height = y + spacing;
        this._parent._parent._dim[1] = height;

      } else {
        //var longShort = pythia.axisScale(longest, shortest, stepCount);
        var vStep = this._parent.step;

        var yStep = 100 / stepCount;

        var widest = 0;
        for (i = 0; i <= stepCount ; i++) {
          var v = format(i * vStep + shortest);
          var measure = util.measureText(v, textYStyle);
          if (measure[0] > widest) {
            widest = measure[0];
          }
        }

        this.add(Text(options.label, [15, 40], Style(textYStyle)))
                .rotate(Math.PI / 2);
        labelMeasure = util.measureText(options.label, options.labelStyle);

        var x = widest + spacing + labelMeasure[1];
        for (i = 0; i <= stepCount ; i++) {
          var v = format(i * vStep + shortest);
          var y = 100 - i * yStep;
          this.add(Text(v, [x, y],
              Style(textYStyle, {textAlign:'right'})));
          if (v === 0 || v === '0') {
            this.add(Line([[0,y], [100,y]], style));
          }
        }

        var width = x + spacing;
        this._parent._parent._pos[0] = width;
        this._parent._parent._dim[0] = 120 + width;
        this._parent._parent._pos[1] = measure[1] / 2;
        this._parent._parent._dim[1] += measure[1] / 2;
        this._parent._parent.refresh();
      }

      this._path = [];

    }).apply(this, this._args);
  }
});

pythia.axisScale = function (longest, shortest, stepCount) {
  var digits = Math.floor(util.log10(longest)),
      firstDigit, secondDigit,
      str    = (Math.floor(longest).toString()),
      str2   = '';

  if (digits > 1) {
    secondDigit = parseInt(str.charAt(1), 10) + 1;

    if (secondDigit === 10) {
      firstDigit  = parseInt(str.charAt(0), 10) + 1;
      secondDigit = '0';
    } else {
      firstDigit = str.charAt(0);
    }

    str2 += firstDigit + secondDigit;

    for (var i = 2; i < str.length; ++i) {
      str2 += '0';
    }
    longest = parseInt(str2, 10);
  }

  var vStep;

  if (longest > 0 && shortest < 0) {
    var yRange        = (longest - shortest);
    var positiveTicks = Math.ceil(longest / yRange * (stepCount - 1));
    var negativeTicks = Math.ceil(-shortest / yRange * (stepCount - 1));

    vStep = yRange / (positiveTicks + negativeTicks - 1);
    shortest = -vStep * negativeTicks;
    longest = vStep * positiveTicks;
  } else {
    if (shortest >= 0) {
      shortest = 0;
      vStep = longest / stepCount;
    } else {
      longest = 0;
      vStep = -shortest / stepCount;
    }
  }

  return [longest, shortest, vStep];
};
