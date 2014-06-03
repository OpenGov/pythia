"use strict";

var _ = require('lodash');

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
      if (this._path) {
        this._raph = r.path(this._path, this._style, this._raph);
      }

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
