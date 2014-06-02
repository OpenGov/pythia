"use strict";

// The global pythia function and object. Entry point to all things pythia.
// Returns a canvas to render stuff onto
var pythia = window.pythia = function (d, options) {
  if (_.isElement(d)) {
    return pythia.canvas(d, options);
  } else if (d) {
    return pythia.set(d, options);
  } else {
    return pythia.canvas(undefined, options);
  }
};

pythia.elements = {};

// Don't do anything
pythia.doNil = function () {};

// The identity function
pythia.id = function (p) { return p; };

// Build accessor functions to pull attributes out of data
pythia.accessor = function(a, deflt) {
  //Use the default if a is undefined
  if (typeof(a) === 'undefined') {
    a = deflt;
  }

  //It's already a function
  if (typeof(a) === 'function') {
    return a;
  }

  //Accessor that cycles through elements of an array
  if (a instanceof Array) {
    var len = a.length;
    return function (d,i) { return a[i % len]; };
  }

  return function () { return a; };
};

pythia.randomColor = function() {
  return Math.random() * 0xffffff;
};

function zipSumNan(e) {
  return (e[0] || 0) + (e[1] || 0);
}

pythia.max = function(data, dataValue, dataLine, multiline, stacked) {
  if (multiline && stacked) {
    //Sum elements element-wise by line
    var sums;
    _.each(data, function(d) {
      var values = _.map(dataLine(d), dataValue);
      if (!sums) {
        sums = values;
      } else {
        //sums = _.map(_.zip(sums, values), function (e) { return (e[0] || 0) + (e[1] || 0) });
        for (var i = 0; i < sums.length || i < values.length; ++i) {
          sums[i] = (sums[i] || 0) + (values[i] || 0);
        }
      }
    });

    return _.max(sums);
  }

  if (multiline) {
    //list of longest elements in each line
    var lineMax = _.map(data, function (d) {
      return _.max(dataLine(d), dataValue);
    });
    //longest element of all
    return dataValue(_.max(lineMax, dataValue));
  }

  return dataValue(_.max(data, dataValue));
};

pythia.shortList = function(data, dataValue, dataLine, multiline, stacked) {
  var sums = [];
  _.each(data, function(d) {
    var values = _.map(dataLine(d), dataValue); 

    for (var i = 0; i < sums.length || i < values.length; ++i) {
      if (values[i] < 0) {
        sums[i] = (sums[i] || 0) + values[i];
      } else {
        sums[i] = sums[i] || 0;
      }
    }
  });

  return sums;
};

pythia.min = function(data, dataValue, dataLine, multiline, stacked) {
  if (multiline && stacked) {
    //Sum elements element-wise by line
    var sums;
    _.each(data, function(d) {
      var values = _.map(dataLine(d), dataValue); 
      if (!sums) {
        sums = values;
      } else {
        for (var i = 0; i < sums.length || i < values.length; ++i) {
          if (values[i] < 0) {
            sums[i] = (sums[i] || 0) + values[i];
          } else {
            sums[i] = sums[i] || 0;
          }
        }
      }
    });

    return _.min(sums);
  }

  if (multiline) {
    //list of longest elements in each line
    var lineMax = _.map(data, function (d) {
      return _.min(dataLine(d), dataValue);
    });
    //longest element of all
    return dataValue(_.min(lineMax, dataValue));
  }

  return dataValue(_.min(data, dataValue));
};

var propertyTable = [];
var defineProperty = Object.defineProperty || function (obj, prop, descriptor) {
  for (var i = 0, len = propertyTable.length; i < len; ++i) {
    if (propertyTable[i] === obj) {
      propertyTable[i][1][prop] = descriptor.value;
      return;
    }
  }

  var properties = {};
  properties[prop] = descriptor.value;

  propertyTable[propertyTable.length] = [obj, properties];
};

var getProperty = Object.defineProperty
                  ? function (obj, prop) { return obj.prop; }
                  : function (obj, prop) {
                        for (var i = 0, len = propertyTable.length; i < len; ++i) {
                            if (propertyTable[i] === obj) {
                                return propertyTable[i][1][prop];
                            }
                        }
                  };
/*
pythia.data = function (data) {
    var readers = {};
    defineProperty(data, '_pythia', {enumerable: false, value: {
          readers: readers

        , sourceRefresh = pythia.doNil

        , refresh: function () {
              sourceRefresh();
              _.each(readers, function(r) {
                  r.refresh();
              });
          }

        , register: function (obj) {
              readers[obj.id] = obj;
          }

        , filter: function (by) {
              var newData = {};
              pythia.data(newData);
              newData._pythia.sourceRefresh = function () {
                  _.filter(data, by);
              }
          }
    }});

    return data;
}*/

pythia.set = function (data, refresh) {

  refresh = refresh || function () {
    return data;
  };

  function a(key) {
    return data[key];
  }

  a._data    = data;
  a._readers = {};
  a.__pythia = true;

  a.register = function (obj) {
    a._readers[obj.id] = obj;
  };

  a.refresh = function () {
    data = refresh();
    _.each(_readers, function(r) {
      r.refresh();
    });
  };


  a.set = function (method, func) {
    var refresh;
    if (_.isString(method)) {
      refresh = function () {
        return a[method](func);
      };
    }
    if (_.isFunction(method)) {
      refresh = function () {
        return method(data);
      };
    }
    return pythia.set(refresh(), refresh);
  };

  a.each = function (func, context) {
    return _.each(a._data, func, context);
  };

  a.map = function (func, context) {
    return _.map(a._data, func, context);
  };

  a.filter = function (func, context) {
    var results = {};
    _.each(data, function(value, key) {
      if (func.call(context, value, key)) {
        results[key] = value;
      }
    });
    return results;
  };

  return a;
};


pythia.refresh = function(data) {
  getProperty(data, '_pythia').refresh();
};

pythia.svgSupported = function () {
  return document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Shape", "1.1");
};

pythia.webGLSupported = function () {
  if (typeof pythia.webGLSupported.yes === "undefined") {
    try {
      var canvas = document.createElement('canvas');
      pythia.webGLSupported.yes = !!(window.WebGLRenderingContext
          && (canvas.getContext('webgl')
            || canvas.getContext('experimental-webgl')));
    } catch(e) {
      pythia.webGLSupported.yes = false;
    }
  }
  return pythia.webGLSupported.yes;
};

pythia.canvasSupported = function () {
  return !! window.CanvasRenderingContext2D;
};

pythia.vmlSupported = function () {
  if (typeof pythia.vmlSupported.yes === "undefined") {
    var a = document.body.appendChild(document.createElement('div'));
    a.innerHTML = '<v:shape id="vml_flag1" adj="1" />';
    var b = a.firstChild;
    b.style.behavior = "url(#default#VML)";
    pythia.vmlSupported.yes = b ? typeof b.adj === "object": true;
    a.parentNode.removeChild(a);
  }
  return pythia.vmlSupported.yes;
};

pythia.ticks = Date.now || function () {
  return new Date().valueOf();
};

pythia.requestFrame =
  window.requestAnimationFrame       ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame    ||
  window.oRequestAnimationFrame      ||
  window.msRequestAnimationFrame     ||
  function (callback) {
    return window.setTimeout(callback, 33);
  };

pythia.cancelFrame =
  window.cancelAnimationFrame       ||
  window.webkitCancelAnimationFrame ||
  window.mozCancelAnimationFrame    ||
  window.oCancelAnimationFrame      ||
  window.msCancelAnimationFrame     ||
  function(id) {
    window.clearTimeout(id);
  };

pythia.addCommas = function (nStr) {
  nStr += '';
  var x = nStr.split('.');
  var x1 = x[0];
  var x2 = x.length > 1 ? '.' + (x[1].length == 1 ? x[1] + '0' : x[1]) : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }
  return x1 + x2;
};

require('../vendor/raphael.js');

pythia.Style = require('../src/style');
pythia.Color = require('../src/color');
pythia.util = require('../src/util');

require('../src/element.js');
require('../src/chart');

pythia.element = {}
pythia.element.canvas = require('../src/element.canvas');
pythia.element.text = require('../src/element.text');
pythia.element.axis = require('../src/axis');
pythia.element.port = require('../src/port');
pythia.element.path = require('../src/element.path');
pythia.element.rect = require('../src/element.rect');
pythia.element.line = require('../src/element.line');
pythia.element.circleSlice = require('../src/element.circleSlice');


pythia.chart = {}
pythia.chart.bar = require('../src/chart.bar');
pythia.chart.line = require('../src/chart.line');
pythia.chart.pie = require('../src/chart.pie');

