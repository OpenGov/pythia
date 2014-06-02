var _ = require('lodash'); var $ = require('jquery');"use strict";

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

;"use strict";

var Class = require('../src/class');
var _ = require('lodash');

var r = {};

"use strict";

r.init = function (container, element) {
  this._lastUpdate = 0;
  this._root       = element;

  this._paused     = 0; // The time when we paused
  this._timePaused = 0; // The cumulative amount of time we spent paused

  this.transform = [ 1, 0, 0,
                     0, 1, 0,
                     0, 0, 1
                   ];
  processAnimations._r = this;
};

r.unPause = function () {
  if (this._paused) {
    this._timePaused += pythia.ticks() - this._paused;
    this._paused = 0;
    this.checkAnim();
  }
};

r.pause = function () {
  if (!this._paused) {
    this._paused = pythia.ticks();
    this.checkAnim();
  }
};

r.size = function (dim) {
  this._size = dim;
  this.transform = [ dim[0]/100, 0         , 0,
                     0         , dim[1]/100, 0,
                     0         , 0         , 1
                   ];
  this.updateTransform();
};

r.updateTransform = function (render) {
  var self = this;
  var now = pythia.ticks();
  var step = now - this._lastUpdate;
  if (step > 15) {
    this._lastUpdate = now;
    if (self.timer) {
      clearTimeout(self.timer);
      self.timer = false;
    }

    //TODO slice relies on this. It's wrong. Delete and fix slice
    this._root.updateTransform(this.transform);
    if (render !== false) {
      this.render();
    }
  } else if (!this.timer) {
    self.timer = setTimeout(function () {
      self.timer = false;
      self.updateTransform();
    }, 15 - step);
  }
};

r.refresh = function () {
  refresh(this._root.children);

  function refresh(elements) {
    _.each(elements, function (e) {
      e.refresh();
      refresh(e.children);
    });
  }
};

pythia.renderer = Class(r);

r.defaultWindow = function(win) {
  this.win = win;
};

var animationId = 0;
var animations = {};

r.animate = function (ctx, callback, duration) {
  var id = animationId++;
  var start;

  var anim = animations[id] = {
    id: id,
    callback: callback,
    duration: duration,
    ctx: ctx,
    start:   -1,
    next:    [],
    chain: function (a) {
      delete animations[a.id];
      anim.next.push(a);
      return a;
    }
  };
  this.checkAnim();

  return anim;
};

var last = 0;
var processAnimations = function () {
  var self           = processAnimations._r,
      frameStartTime = pythia.ticks() - self._timePaused,
      timeScale;

  _.each(animations, function (a, id) {
    if (a.start === -1) {
      a.start = frameStartTime;
      return;
    }

    while (a) {
      if (pythia.disableAnimations) {
        timeScale = 1;
      } else {
        timeScale = Math.min((frameStartTime - a.start) / a.duration,1);
      }

      try {
        a.callback.call(a.ctx, timeScale);
      } catch (e) {
        // TODO throw sentry error here
        // failed to animate
        delete animations[id];
        throw e;
      }

      // TODO nested chains
      if (timeScale === 1) {
        delete animations[id];
        if (a.next.length !== 0) {
          var next = a.next.shift();
          next.start = a.start + a.duration;
          animations[next.id] = next;
          a = next;
        } else {
          a = false;
        }
      } else {
        a = false;
      }
    }
  });
  last = frameStartTime;
  self._frame = 0;

  self.checkAnim();
};

r.killAnimation = function (id) {
  delete animations[id];
};

r.checkAnim = function () {
  if (this._paused || _.isEmpty(animations)) {
    if (this._animating) {
      this._animating = false;
      this._animationDuration = pythia.ticks() - this._animationStart;
      this.trigger('animation_complete', this._animationDuration, this._frameCount);
    }
    if (this._interval) {
      clearTimeout(this._interval);
      this._interval = false;
    }
  } else {
    if (!this._frame) {
      if (!this._animating) {
        this._animating = true;
        this._animationStart = pythia.ticks();
        this._frameCount = 0;
      }
      this._frameCount++;
      this._frame = pythia.requestFrame.call(window, processAnimations);
    }
  }
};

r.Window = Class({
  init: function (x, y, w, h) {
    this.translateT = [ 1, 0, x,
                        0, 1, y,
                        0, 0, 1
                      ];
    this.scaleT = [ w/100, 0    , 0,
                    0    , h/100, 0,
                    0    , 0    , 1
                  ];

    this.transform = [ w/100, 0    , x,
                       0    , h/100, y,
                       0    , 0    , 1
                     ];
    //Are we using these?
    this.x = x;
    this.y = y;
    this.scaleX = w/100;
    this.scaleY = h/100;
  },

  add: function (el) {
    el.window = this;
    return this;
  }
});
;"use strict";

var Class = require('../src/class');
var Color = require('../src/color');
var Element = require('../src/element');
var Path = require('../src/element.path');
var Text = require('../src/element.text');
var util = require('../src/util');

var r = {};

r.remove = function (el) {
  if (el._raph) {
    el._raph.remove();
  }
};

r.init = function (container, element) {
  var r = this;
  this._paper = Raphael(container).setSize(10,10);

  if (Element.__pythia.refresh.pythiaChain) {
    Element.__pythia.refresh.pythiaChain.pop();
  }
  Element.append('refresh', function () {
      var self = this;

      var old = this._raph;
      if (this._path)
          this._raph = r.path(this._path, this._style, this._raph);

      this._mousedOver = false;

      var onMouseOver = self.processEvent('mouseover');
      var onMouseOut = self.processEvent('mouseout');
      //TODO fix events on refreshed text
      if (old !== this._raph) {
          //this._raph.hover(this.processEvent('mouseover'), this.processEvent('mouseout'), this, this);
          this._raph.hover(function () {
              if (!self._mousedOver) {
                  self._mousedOver = true;
                  onMouseOver.call(self);
              }
          }, function () {
              if (self._mousedOver) {
                  self._mousedOver = false;
                  onMouseOut.call(self);
              }
          }, this, this);
          this._raph.click(this.processEvent('click'), this);
      }

      return this;
  });

  Element.extend('center', function () {
      var box = this._raph.getBBox(true);
      return [box.x + box.width/2, box.y + box.height/2];
  });

  Element.extend('bounds', function () {
      var box = this._raph.getBBox(true);
      return {min: [box.x, box.y], max:[box.x2, box.y2]};
  });

  function elementToTop(e) {
      e.toTop();
  }
  function elementToBottom(e) {
      e.toBottom();
  }

  Element.extend('toTop', function () {
      if (this._raph)
          this._raph.toFront();
      _.each(this.children, elementToTop);
  });

  Element.extend('toBottom', function () {
      _.each(this.children, elementToBottom);
      if (this._raph)
          this._raph.toBack();
      return this;
  });

  Element.extend('calcTransform', function (cumulativeT) {
      var scaleX, scaleY, cumulativeS;
      // Fix for bug sometimes on pie (esp. large initial views)
      // neither cumulativeT nor _parent._totalT will be initialized
      // so default to identity matrix
      // TODO: Find specific cause
      cumulativeT = cumulativeT || this._parent._totalT || [1,0,0,0,1,0,0,0,1];
      this._scale = 1;

      if (this.hasClass('port')) {
          scaleX = Math.sqrt(cumulativeT[0] * cumulativeT[0] + cumulativeT[1] * cumulativeT[1]);
          scaleY = Math.sqrt(cumulativeT[3] * cumulativeT[3] + cumulativeT[4] * cumulativeT[4]);
          var sx = ((this._r._size[0] - this._dim[0]) / 100) / scaleX;
          var sy = ((this._r._size[1] - this._dim[1]) / 100) / scaleY;
          this.scaleT = [ sx, 0 , 0,
                          0 , sy, 0,
                          0 , 0 , 1
                        ];
      }

      if (this._style.size === 'fixed') {
          cumulativeS = util.mCopy(cumulativeT);

          scaleX = Math.sqrt(cumulativeT[0] * cumulativeT[0] + cumulativeT[1] * cumulativeT[1]);
          scaleY = Math.sqrt(cumulativeT[3] * cumulativeT[3] + cumulativeT[4] * cumulativeT[4]);
          cumulativeS[0] = cumulativeT[0] / scaleX;
          cumulativeS[1] = cumulativeT[1] / scaleX;
          cumulativeS[3] = cumulativeT[3] / scaleY;
          cumulativeS[4] = cumulativeT[4] / scaleY;
      } else {
          cumulativeS = cumulativeT;
      }

      var pos = [this.translateT[2], this.translateT[5]];

      if (this.hasClass('text')) {
          if (this._raph) {
              if (this._style.baseline === 'bottom') {
                  var box = this._raph.getBBox(true);
                  pos[1] -= box.height/2;
              } else if (this._style.baseline === 'top') {
                  var box = this._raph.getBBox(true);
                  // If the text has been rotated rotate the baseline
                  // shift approprately
                  var tx = -this.rotateT[1] * box.height/2,
                      ty = this.rotateT[4] * box.height/2;

                  pos[0] += tx;
                  pos[1] += ty;
              }
          }
      }

      var newPos;
      if (this._style && this._style['position'] === 'fixed-horizontal') {

          var transformedPos = util.mMulV(cumulativeT, pos);
          newPos = [transformedPos[0], pos[1]];

      } else if (this._style && this._style['position'] === 'fixed-vertical') {

          var transformedPos = util.mMulV(cumulativeT, pos);
          newPos = [pos[0], transformedPos[1]];

      } else if (this._style && this._style['position'] === 'fixed') {

          newPos = pos;

      } else {
          newPos = util.mMulV(cumulativeT, pos);
      }

      if (this._style && this._style['yrelative'] === 'bottom') {
          newPos[1] = this._r._size[1] - newPos[1];
      }


      var transform = util.mCopy(this.scaleT);

      var totalT = util.mMulM(cumulativeS, transform);
      totalT = util.mMulM(this.rotateT, totalT);
      totalT[2] = newPos[0];
      totalT[5] = newPos[1];


      if (this._style.size === 'proportional') {
          var scaleX = Math.sqrt(totalT[0] * totalT[0] + totalT[1] * totalT[1]);
          var scaleY = Math.sqrt(totalT[3] * totalT[3] + totalT[4] * totalT[4]);

          if (scaleX > scaleY) {
              var rescale = scaleY / scaleX;
              totalT[0] *= rescale;
              totalT[1] *= rescale;
              this._proportionalDim = 0;
              this._scale = scaleY;
          } else {
              var rescale = scaleX / scaleY;
              totalT[3] *= rescale;
              totalT[4] *= rescale;
              this._proportionalDim = 1;
              this._scale = scaleX;
          }
      }

      this._proportianalScale = rescale;

      this._totalT = totalT;

      return this._totalT;
  });

  Element.extend('renderedPos', function (pos) {
      var totalT = this.calcTransform();
      return util.mMulV(totalT, pos);
  });

  Element.extend('updateTransform', function (cumulativeT) {
      var totalT = this.calcTransform(cumulativeT),
          i, len, path;

      // Workaround for bad line scaling in firefox and older webkit
      // and IE
      if (this.hasClass('line') && this._vertices.length) {
          var vert = util.mMulV(this._totalT, this._vertices[0]);

          path = ['M' + vert[0] + ' ' + vert[1] + 'L'];

          for (i = 0, len = this._vertices.length; i < len; ++i) {
              vert = util.mMulV(this._totalT ,this._vertices[i]);
              path.push(vert[0]);
              path.push(vert[1]);
          }

          this._raph.node.style.strokeWidth = this._style.strokeWidth || this.strokeWidth || 2;

          this._raph.attr('path', path.join(' '));
      } else if (this.hasClass('path') || this.hasClass('rect')) {
          path = [];
          for (i = 0, len = this._path.length; i < len; ++i) {
              var pt = this._path[i];
              if (_.isArray(pt)) {
                  path.push(util.mMulV(this._totalT, pt));
              } else {
                  path.push(pt);
              }
          }

          if (len) {
              this._raph.attr('path', path);
          }
      } else if (this.hasClass('circleSlice') && this._pos) {
          var scaleX = Math.sqrt(totalT[0] * totalT[0] + totalT[1] * totalT[1]);
          var scaleY = Math.sqrt(totalT[3] * totalT[3] + totalT[4] * totalT[4]);
          var isCircle;

          if ((1.99 * Math.PI) < this._angle) {
              isCircle = true;
          }

          var pos    = util.mMulV(totalT, [0,0]);
          var radius = this._radius * (scaleX > scaleY ? scaleX : scaleY);
          var pathL = [];

          if (false && isCircle) {
              if (!this._raph.isCircle) {
                  var oldattr = this._raph.attr();
                  this._raph.remove();
                  this._raph = this._r._paper.circle(pos[0], pos[1], radius);
                  this._raph.attr(oldattr);
                  this._raph.isCircle = true;
              } else {
                  this._raph.attr({cx:pos[0], cy:pos[1], radius:radius});
              }
          } else {
              var vertCount = Math.floor(radius * this._angle / Math.PI);
              vertCount = Math.max(vertCount, 15);
              var vertices = arc(pos[0], pos[1], radius, this._startAngle, this._angle, vertCount);

              for (var i = 0, len = vertices.length; i < len; ++i) {
                  var v = vertices[i];
                  pathL.push(v[0]);
                  pathL.push(v[1]);
              }
              var joinL = pathL.join(',');

              if (isCircle) {
                  var path = 'M' + vertices[0].join(',') + 'L' + joinL;
              } else {
                  var path = 'M' + pos.join(',') + 'L' + joinL;
              }

              this._raph.attr('path', path + 'Z');
          }
      } else {
          var m =  Raphael.matrix(
                         totalT[0], totalT[1],  totalT[3]
                       , totalT[4], totalT[2],  totalT[5]);

          if (this._raph) {
              this._raph.transform(m.toTransformString());
          }
      }

      if (this.hasClass('axis')) {
          this.toBottom();
      }

      for (var key in this.children) {
          var child = this.children[key];
          if (!child._totalT || this.dirtyScale || this.dirtyPos) {
              child.dirtyScale = true;
              child.updateTransform();
          }
      }

      this.dirtyScale = false;

      return this;
  });

  Path.extend('arc', function (pos, radius, startAngle, angle) {
      var self = this;
      var endAngle = startAngle + angle;
      var p2 = Math.PI/2;

      var a = 0;
      while (a < angle) {
          arc(startAngle, (angle - a) < p2 ? (angle - a) : p2);
          a += Math.PI/2;
          startAngle += Math.PI/2;
      }

      function arc(start, angle) {
          var endPoint = [radius * Math.cos(startAngle + angle) + pos[0],
                          radius * Math.sin(startAngle + angle) + pos[1]];
          self._path.push('A', radius, radius, startAngle, 0, 1, endPoint);
      }

      return this;
  });

  if (Path.__pythia.parent.pythiaChain) {
    Path.__pythia.parent.pythiaChain.pop();
  }
  Path.append('parent', function () {
    if (this._parent._raph && this._raph && this._parent._raph.node) {
      if (this._parent._raph.node.nextSibling) {
        this._raph.node.parentNode.insertBefore
          (this._raph.node, this._parent._raph.node.nextSibling);
      } else {
        this._raph.node.parentNode.appendChild(this._raph.node);
      }
    }
  });

  if (Text.__pythia.parent.pythiaChain) {
    Text.__pythia.parent.pythiaChain.pop();
  }
  Text.append('parent', function () {
      if (this._parent._raph && this._raph && this._parent._raph.node) {
          if (this._parent._raph.node.nextSibling) {
            this._raph.node.parentNode.insertBefore
              (this._raph.node, this._parent._raph.node.nextSibling);
          } else {
            this._raph.node.parentNode.appendChild(this._raph.node);
          }
      }
  });
};

r.path = function(path, style, raphPath) {
  style = style || {};

  var fill    = (typeof(style.fill) === 'undefined') ? true : style.fill,
      attr    = {};

  attr.fill   = fill ? (Color(style.color).html() || Color(style.fillColor).html())  : "none";
  if (style.stroke !== false) {
    attr.stroke          = Color(style.strokeColor).html();
    attr['stroke-width'] = style.strokeWidth || 1;

    if (style.strokeOpacity) {
        attr['stroke-opacity'] = style.strokeOpacity;
    }
  } else {
    attr.stroke = "none";
  }

  if (style.opacity) {
    attr.opacity = style.opacity;
  }

  if (style.fillOpacity) {
    attr['fill-opacity'] = style.fillOpacity;
  }

  if (path[0] === 'F') {
    if (style.fontSize) {
      attr['font-size'] = style.fontSize;
    }
    if (style.fontFamily) {
      attr['font-family'] = style.fontFamily;
    }
    if (style.fontWeight) {
      attr['font-weight'] = style.fontWeight;
    }
    if (style.textAlign === 'right') {
      attr['text-anchor'] = 'end';
    }
    if (style.textAlign === 'left') {
      attr['text-anchor'] = 'start';
    }

    attr.stroke = 'none';
    if (raphPath) {
      raphPath.remove();
    }
    raphPath = this._paper.text(0, 0, path[1]).attr(attr);
    style.baseline = style.baseline || 'middle';

    var box = raphPath.getBBox(true);

    if (style.baseline === 'bottom') {
      raphPath.translate(0, -box.height/2);
    }
    if (style.baseline === 'top') {
      raphPath.translate(0, box.height/2);
    }
  } else {
    if (raphPath && path.length) {
      raphPath.attr('path', path);
      raphPath.attr(attr);
    } else {
      raphPath = this._paper.path(path).attr(attr);
    }
    if (style['stroke-dasharray']) {
      raphPath.node.setAttribute('stroke-dasharray', style['stroke-dasharray']);
    }
  }

  if (attr.stroke !== 'none') {
    raphPath.node.style.strokeWidth = attr['stroke-width'];
    //raphPath.node.style.vectorEffect = 'non-scaling-stroke';
  }

  if (style.pointerEvents === 'none') {
    raphPath.node.style.pointerEvents = 'none';
  }

  if (style.zIndex) {
    raphPath.node.style.zIndex = style.zIndex;
  }

  this.render();

  return raphPath;
};

r.size = function(dim) {
  this._paper.setSize(dim[0], dim[1]);
  this.__super.size.call(this, dim);
};

function arc(cx, cy, r, startAngle, angle, steps) {
  var theta           = angle / (steps - 1),
      tangetialFactor = Math.tan(theta),
      radialFactor    = Math.cos(theta),
      x               = r * Math.cos(startAngle),
      y               = r * Math.sin(startAngle),
      vertices        = [],
      tx,
      ty,
      i;

  for(i = 0; i < steps; ++i) {
    vertices.push([x + cx, y + cy]);

    tx = -y;
    ty = x;

    x += tx * tangetialFactor;
    y += ty * tangetialFactor;

    x *= radialFactor;
    y *= radialFactor;
  }
  return vertices;
}

r.render = pythia.doNil;

pythia.renderer.raphael = Class(pythia.renderer, r);
;"use strict";

var Class = require('../src/class');
var color = require('../src/color');
var util = require('../src/util');

var renderer  = {},
    addEvent,
    contains,
    zoom      = 21600,
    cssText   = "position: absolute; width: 1px; height: 1px",
    coordsize = zoom + ' ' + zoom;

renderer.remove = function (el) {
  var mother;

  if (el.vml && (mother = el.vml.parentNode)) {
    mother.removeChild(el.vml);
  }
};

function createNode(tagName) {
  return document.createElement('<pythiavml:' + tagName + ' class="pythiavml">');
}

renderer.init = function (container, element) {
  var renderer = this;

  this.container = container;

  document.createStyleSheet().addRule(".pythiavml", "behavior:url(#default#VML)");
  document.namespaces.add('pythiavml', 'urn:schemas-microsoft-com:vml');

  addEvent(container, 'click', function (evt) {
    var domEl = evt.target || evt.srcElement,
        id    = domEl.getAttribute('pythia_id');

    if (id) {
      element = pythia.getElement(id);
      if (element) {
        element.invoke('click');
      }
    }
  });

  addEvent(container, 'mouseenter', function (evt) {
    var domEl = evt.currentTarget || evt.target || evt.srcElement,
        from  = evt.fromElement,
        id    = domEl.getAttribute('pythia_id');

    if (!from || (from !==  domEl && !contains(domEl, from))) {
      if (id) {
        element = pythia.getElement(id);
        if (element) {
          if (!element._style || element._style.pointerEvents !== 'none') {
            element.invoke('mouseover');
          }
        }
      }
    }
  });

  addEvent(container, 'mouseleave', function (evt) {
      var domEl = evt.target || evt.srcElement,
          id    = domEl.getAttribute('pythia_id');

      if (id) {
          element = pythia.getElement(id);
          if (element) {
              if (!element._style || element._style.pointerEvents !== 'none') {
                element.invoke('mouseout');
              }
          }
      }
  });

  if (pythia.element.__pythia.refresh.pythiaChain) {
    pythia.element.__pythia.refresh.pythiaChain.pop();
  }
  pythia.element.append('refresh', function () {
      if (this._path) {
          renderer.path(this);
      }
      return this;
  });

  pythia.element.extend('center', function () {
      return [10,10];
  });

  pythia.element.extend('bounds', function () {
      return {min: [10,10], max:[20,20]};
  });

  function elementToTop(e) {
      e.toTop();
  }
  function elementToBottom(e) {
      e.toBottom();
  }

  pythia.element.extend('toTop', function () {
  });

  pythia.element.extend('toBottom', function () {
      var parnt;

      if (this.vml) {
          parnt = this.vml.parentNode;
          parnt.insertBefore(this.vml, parnt.firstChild);
      }
      return this;
  });

  pythia.element.extend('calcTransform', function (cumulativeT) {
      // Fix for bug sometimes on pie (esp. large initial views)
      // neither cumulativeT nor _parent._totalT will be initialized
      // so default to identity matrix
      // TODO: Find specific cause
      cumulativeT = cumulativeT || this._parent._totalT || [1,0,0,0,1,0,0,0,1];
      this._scale = 1;

      if (this.hasClass('port')) {
          var scaleX = Math.sqrt(cumulativeT[0] * cumulativeT[0] + cumulativeT[1] * cumulativeT[1]);
          var scaleY = Math.sqrt(cumulativeT[3] * cumulativeT[3] + cumulativeT[4] * cumulativeT[4]);
          var sx = ((this._r._size[0] - this._dim[0]) / 100) / scaleX;
          var sy = ((this._r._size[1] - this._dim[1]) / 100) / scaleY;
          this.scaleT = [ sx, 0 , 0,
                          0 , sy, 0,
                          0 , 0 , 1
                        ];
      }

      if (this._style && this._style.size === 'fixed') {
          var cumulativeS = util.mCopy(cumulativeT),
              scaleX      = Math.sqrt(cumulativeT[0] * cumulativeT[0] + cumulativeT[1] * cumulativeT[1]),
              scaleY      = Math.sqrt(cumulativeT[3] * cumulativeT[3] + cumulativeT[4] * cumulativeT[4]);

          cumulativeS[0] = cumulativeT[0] / scaleX;
          cumulativeS[1] = cumulativeT[1] / scaleX;
          cumulativeS[3] = cumulativeT[3] / scaleY;
          cumulativeS[4] = cumulativeT[4] / scaleY;
      } else {
          cumulativeS = cumulativeT;
      }


      var pos = [this.translateT[2], this.translateT[5]];

      var newPos;
      if (this._style && this._style.position === 'fixed-horizontal') {

          var transformedPos = util.mMulV(cumulativeT, pos);
          newPos = [transformedPos[0], pos[1]];

      } else if (this._style && this._style.position === 'fixed-vertical') {

        var transformedPos = util.mMulV(cumulativeT, pos);
        newPos = [pos[0], transformedPos[1]];

      } else if (this._style && this._style.position === 'fixed') {

          newPos = pos;

      } else {
          newPos = util.mMulV(cumulativeT, pos);
      }

      if (this._style && this._style.yrelative === 'bottom') {
          newPos[1] = this._r._size[1] - newPos[1];
      }


      var transform = util.mCopy(this.scaleT);

      var totalT = util.mMulM(cumulativeS, transform);
      totalT = util.mMulM(this.rotateT, totalT);
      totalT[2] = newPos[0];
      totalT[5] = newPos[1];


      if (this._style && this._style.size === 'proportional') {
          var scaleX = Math.sqrt(totalT[0] * totalT[0] + totalT[1] * totalT[1]);
          var scaleY = Math.sqrt(totalT[3] * totalT[3] + totalT[4] * totalT[4]);

          if (scaleX > scaleY) {
              var rescale = scaleY / scaleX;
              totalT[0] *= rescale;
              totalT[1] *= rescale;
              this._proportionalDim = 0;
              this._scale = scaleY;
          } else {
              var rescale = scaleX / scaleY;
              totalT[3] *= rescale;
              totalT[4] *= rescale;
              this._proportionalDim = 1;
              this._scale = scaleX;
          }
      }

      this._proportianalScale = rescale;

      this._totalT = totalT;

      return this._totalT;
  });

  pythia.element.extend('renderedPos', function (pos) {
      var totalT = this.calcTransform();
      return util.mMulV(totalT, pos);
  });

  function vmlCoord(n) {
      return Math.round(n * zoom);
  }

  pythia.element.extend('updateTransform', function (cumulativeT) {
      var totalT = this.calcTransform(cumulativeT),
          i, len, path, vert;

      if (this.hasClass('line') && this._vertices.length) {
          vert = util.mMulV(totalT, this._vertices[0]);
          path = ['M' + vmlCoord(vert[0]) + ' ' + vmlCoord(vert[1]) + 'L'];

          for (i = 0, len = this._vertices.length; i < len; ++i) {
              vert = util.mMulV(this._totalT ,this._vertices[i]);
              path.push(vmlCoord(vert[0]));
              path.push(vmlCoord(vert[1]));
          }

          this.vml.path = path.join(' ');
      } else if (this.hasClass('path')) {
          path = [];

          for (i = 0, len = this._path.length; i < len; ++i) {
              var pt = this._path[i];

              if (_.isArray(pt)) {
                  vert = util.mMulV(totalT, pt);

                  path.push(vmlCoord(vert[0]));
                  path.push(vmlCoord(vert[1]));
              } else {
                  path.push(pt);
              }
          }

          this.vml.path = path.join(' ');
      } else if (this.hasClass('circleSlice') && this._pos) {
          var scaleX = Math.sqrt(totalT[0] * totalT[0] + totalT[1] * totalT[1]),
              scaleY = Math.sqrt(totalT[3] * totalT[3] + totalT[4] * totalT[4]),
              isCircle = (1.99 * Math.PI) < this._angle;

          var pos    = util.mMulV(totalT, [0,0]),
              radius = this._radius * (scaleX > scaleY ? scaleX : scaleY),
              pathL = [];

          var vertCount = Math.floor(radius * this._angle / Math.PI);
          vertCount = Math.max(vertCount, 15);
          var vertices = arc(pos[0], pos[1], radius, this._startAngle, this._angle, vertCount);

          for (i = 0, len = vertices.length; i < len; ++i) {
              var v = vertices[i];
              pathL.push(vmlCoord(v[0]));
              pathL.push(vmlCoord(v[1]));
          }
          if (isCircle) {
              pos = vertices[0];
          }

          pos[0] = vmlCoord(pos[0]);
          pos[1] = vmlCoord(pos[1]);

          var joinL = pathL.join(' ');
          path = 'M' + pos.join(' ') + ' L' + joinL;

          this.vml.path = path;
      } else {
          if (this.vml) {
              //this.vml.rotation = math.atan2(totalT[0], totalT[3]);
              if (this.vmlPath) {
                  this.vmlPath.v = 'M2 2L' + (2 + totalT[0]) + ' ' + (2 + totalT[1]);
                  this.vml.coordorigin = -vmlCoord(totalT[2]) + ' ' + -vmlCoord(totalT[5]);
              }
          }
      }

      for (var key in this.children) {
          var child = this.children[key];
          if (!child._totalT || this.dirtyScale || this.dirtyPos) {
              child.dirtyScale = true;
              child.updateTransform();
          }
      }

      return;
      if (true) {
          var m =  Raphael.matrix(
                         totalT[0], totalT[1],  totalT[3]
                       , totalT[4], totalT[2],  totalT[5]);

          if (this._raph) {
              this._raph.transform(m.toTransformString());
          }
      }

      if (this.hasClass('axis')) {
          this.toBottom();
      }

      this.dirtyScale = false;

      return this;
  });

  pythia.elements.path.extend('arc', function (pos, radius, startAngle, angle) {
      var self = this;
      var endAngle = startAngle + angle;
      var p2 = Math.PI/2;

      var a = 0;
      while (a < angle) {
          arc(startAngle, (angle - a) < p2 ? (angle - a) : p2);
          a += Math.PI/2;
          startAngle += Math.PI/2;
      }

      function arc(start, angle) {
          var endPoint = [radius * Math.cos(startAngle + angle) + pos[0],
                          radius * Math.sin(startAngle + angle) + pos[1]];
          self._path.push('A', radius, radius, startAngle, 0, 1, endPoint);
      }

      return this;
  });

  if (pythia.elements.path.__pythia.parent.pythiaChain) {
    pythia.elements.path.__pythia.parent.pythiaChain.pop();
  }
  pythia.elements.path.append('parent', function () {
      if (this.vml && this._parent.vml) {
          if (this._parent.vml.nextSibling) {
            this.vml.parentNode.insertBefore(this.vml, this._parent.vml.nextSibling);
          } else {
            this.vml.parentNode.appendChild(this.vml);
          }
      }
  });

  if (pythia.elements.text.__pythia.parent.pythiaChain) {
    pythia.elements.text.__pythia.parent.pythiaChain.pop();
  }
  pythia.elements.text.append('parent', function () {
      if (this.vml && this._parent.vml) {
          if (this._parent.vml.nextSibling) {
            this.vml.parentNode.insertBefore(this.vml, this._parent.vml.nextSibling);
          } else {
            this.vml.parentNode.appendChild(this.vml);
          }
      }
  });

  this.updateTransform(false);
};

renderer.path = function(element) {
    var vml   = element.vml,
        fill  = element.vmlFill,
        style = element._style,
        color, strokeWidth;

    if (!vml) {
        vml  = element.vml = createNode('shape'),
        vml.style.cssText = cssText;
        vml.coordsize     = coordsize;
        vml.setAttribute('pythia_id', element._id);
        this.container.appendChild(vml);
    }

    if (element._path[0] === 'F') {
        renderer.text(element);
    }

    if (style.zIndex) {
        vml.style.zIndex = style.zIndex;
    }

    if (style.pointerEvents === 'none') {
        vml.style.pointerEvents = 'none';
    }

    if (style.stroke !== false) {
        vml.strokecolor  = color(style.strokeColor).html();
        vml.strokeWeight = style.strokeWidth || 1;

        if (style.strokeOpacity) {
            vml.strokeOpacity = style.strokeOpacity;
        }
    } else {
        vml.stroked = false;
    }

    if (style.fill !== false) {
        if (!fill) {
            fill = element.vmlFill = createNode('fill');
            vml.appendChild(fill);
        }

        color        = style.color || style.fillColor || 0;
        fill.color   = color(color).html();
        if (style.fillOpacity !== undefined) {
            fill.opacity = style.fillOpacity;
        } else if (style.opacity !== undefined) {
            fill.opacity = style.opacity;
        }

        vml.filled   = true;
    } else {
        vml.filled = false;
    }
};

renderer.text = function (element) {
    var vml    = element.vml,
        path   = element.vmlPath,
        skew   = element.vmlSkew,
        style  = element._style,
        text   = element.vmlText,
        string = element._path[1],
        dim;

    if (!path) {
        path = element.vmlPath = createNode("path");
        path.textpathok = true;
        text    = element.vmlText = createNode("textpath");
        text.on = true;

        if (style.textAlign) {
            text.style['v-text-align'] = style.textAlign;
        }

        if (style.baseline === 'bottom') {
            dim = util.measureText(string, style);
            element.translate([0, -dim[1] / 2]);
        }
        if (style.baseline === 'top') {
            dim = util.measureText(string, style);
            element.translate([0, dim[1] / 2]);
        }

        if (style.fontSize) {
            text.style.fontSize = style.fontSize;
        }

        if (style.fontFamily) {
            text.style.fontFamily = style.fontFamily;
        }

        vml.appendChild(path);
        vml.appendChild(text);
    }

    text.string = string;
};

function arc(cx, cy, r, startAngle, angle, steps) {
    var theta           = angle / (steps - 1),
        tangetialFactor = Math.tan(theta),
        radialFactor    = Math.cos(theta),
        x               = r * Math.cos(startAngle),
        y               = r * Math.sin(startAngle),
        vertices        = [],
        tx,
        ty,
        i;

    for(i = 0; i < steps; ++i) {
        vertices.push([x + cx, y + cy]);

        tx = -y;
        ty = x;

        x += tx * tangetialFactor;
        y += ty * tangetialFactor;

        x *= radialFactor;
        y *= radialFactor;
    }
    return vertices;
}

var setStyle = function (el, name, value) {
    if (el.style.setProperty) {
        el.style.setProperty(name, value, '');
    }
    el.style[name] = value;
};

renderer.size = function(dim) {
    this.__super.size.call(this, dim);
};


renderer.render = pythia.doNil;

pythia.renderer.vml = Class(pythia.renderer, renderer);

addEvent = function (element, type, fn) {
  $(element).on(type, '.pythiavml', fn);
};

contains = function (context, node){
    if (node) do {
        if (node === context) return true;
    } while ((node = node.parentNode));
    return false;
};
module.exports = pythia;