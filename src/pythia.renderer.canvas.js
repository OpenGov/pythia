"use strict";

var color = require('../src/color');

(function(p) {
  p.renderer.canvas = p.object(p.renderer, {
    init: function (container) {
      this.__super.init.call(this);
      var _r      = this;

      this.Element.extend('visible', true);

      this.Element.extend('getBounds', function() {
        return {min: this.min, max: this.max};
      });

      this.Element.extend('center', function() {
        return [(this.min[0] + (this.max[0] - this.min[0]) / 2)
               ,(this.min[1] + (this.max[1] - this.min[1]) / 2)
               ];
      });

      this.Element.extend('on', function (event, callback) {
        this.events[event] = callback;
        return this;
      });

      this.Element.extend('hide', function () {
        this.visible = false;
        return this;
      });

      this.Element.extend('show', function () {
        this.visible = true;
        return this;
      });

      this.Text.extend('measureText', function() {
        //TODO height calc
        return [_r._ctx.measureText(this.path[2]).width, 11];
      });

      this.Element.extend('draw', function (checkX, checkY) {
          var path  = this.path
            , style = this.style || p.style({})
            , fill = (typeof(style('fill')) === 'undefined') ? true : false
            , opacity = style('opacity')

            , index = 0;

          if (this.visible === false) {
              //TODO FIREFOX?
              //_r._ctx.setAlpha(0);
          } else {
              //_r._ctx.setAlpha(opacity);
          }

          _r._ctx.lineWidth = style('strokeWidth') || 1;
          _r._ctx.strokeStyle = color(style('strokeColor')).html();
          _r._ctx.fillStyle   = color(style('color') || style('fillColor')).html();
          _r._ctx.beginPath();

          var min = [Infinity, Infinity];
          var max = [-Infinity, -Infinity];

          var minMax = function () {
              _.each(arguments, function(pos) {
                  (pos[0] > max[0]) && (max[0] = pos[0]);
                  (pos[0] < min[0]) && (min[0] = pos[0]);
                  (pos[1] > max[1]) && (max[1] = pos[1]);
                  (pos[1] < min[1]) && (min[1] = pos[1]);
              });
          }
          var minMaxX = function () {
              _.each(arguments, function(x) {
                  (x > max[0]) && (max[0] = x);
                  (x < min[0]) && (min[0] = x);
              });
          }
          var minMaxY = function () {
              _.each(arguments, function(y) {
                  (y > max[1]) && (max[1] = y);
                  (y < min[1]) && (min[1] = y);
              });
          }

          while (index < path.length) {
              switch (path[index]) {
                  case 'F':
                      _r._ctx.textBaseline = style('baseline') || 'middle';
                      _r._ctx.textAlign    = style('text-align');

                      var pos  = this.toTransform([0,0]);
                      var text = path[index + 1];
                      var width = _r._ctx.measureText(text).width;
                      var height = 11;

                      var x;
                      switch (_r._ctx.textAlign) {
                          case 'left':
                              minMaxX(pos[0], pos[0] + width);
                              break;
                          case 'right':
                              minMaxX(pos[0], pos[0] - width);
                              break;
                          default:
                              minMaxX(pos[0] + width/2, pos[0] - width/2);
                              break;
                      }
                      switch (_r._ctx.textAlign) {
                          case 'top':
                              minMaxY(pos[1], pos[1] + height);
                              break;
                          case 'bottom':
                              minMaxY(pos[1], pos[1] - height);
                              break;
                          default:
                              minMaxY(pos[1] - height/2, pos[1] + height/2);
                              break;
                      }

                      _r._ctx.fillText(text, pos[0], pos[1]);
                      index += 2;
                      break;

                  case 'M':
                      var to = this.toTransform(path[index + 1]);
                      _r._ctx.moveTo(to[0], to[1]);
                      minMax(path[index + 1]);
                      index += 2;
                      break;

                  case 'L':
                      var to = this.toTransform(path[index + 1]);
                       
                      _r._ctx.lineTo(to[0], to[1]);
                      minMax(path[index + 1]);
                      index += 2;
                      break;

                  case 'LP':
                      var to = this.toProportionalTransform(path[index + 1]);
                       
                      _r._ctx.lineTo(to[0], to[1]);
                      minMax(to);
                      index += 2;
                      break;

                  case 'C':
                      var v1 = this.toTransform(path[index + 1]);
                      var v2 = this.toTransform(path[index + 2]);
                      var v3 = this.toTransform(path[index + 3]);

                      _r._ctx.bezierCurveTo(v1[0], v1[1]
                                         ,v2[0], v2[1]
                                         ,v3[0], v3[1]
                                         );
                      index += 4;
                      break;

                  case 'Ci':
                      var pos        = path[index + 1];
                      var radius     = path[index + 2];
                      _r._ctx.arc(pos[0], pos[1], radius, 0, Math.PI * 2);
                      minMax([pos[0] + radius, pos[1] + radius]
                            ,[pos[0] - radius, pos[1] - radius]
                            );
                      index += 3;
                      break;

                  case 'A':
                      var pos        = this.toTransform(path[index + 1]);
                      var radius     = path[index + 2];
                      var startAngle = path[index + 3];
                      var endAngle   = path[index + 4] + startAngle;
                      var endPoint   = [ radius * Math.cos(endAngle) + pos[0]
                                       , radius * Math.sin(endAngle) + pos[1]];
                      var startPoint = [ radius * Math.cos(startAngle) + pos[0]
                                       , radius * Math.sin(startAngle) + pos[1]];
                      minMax(pos, startPoint, endPoint);
                  var tt = this.totalTransform();
                  var xScale   = Math.sqrt(tt[0] * tt[0] + tt[1] * tt[1]);
                  var yScale   = Math.sqrt(tt[3] * tt[3] + tt[4] * tt[4]);
                  radius *= Math.min(xScale, yScale);
                      
                      var n = 3 * Math.PI / 2
                        , w = Math.PI
                        , s = Math.PI/2
                        ;
                      if (startAngle < s && endAngle > s) {
                          minMaxY(pos[1] + radius);
                      }
                      if (startAngle < w && endAngle > w) {
                          minMaxX(pos[0] - radius);
                      }
                      if (startAngle < n && endAngle > n) {
                          minMaxY(pos[1] - radius);
                      }

                      _r._ctx.arc(pos[0], pos[1], radius, startAngle, endAngle);
                      //_r._ctx.arcTo(endPoint[0], endPoint[1], startPoint[0], startPoint[1], radius);
                      index += 5;

                      /* highlight the bounding box corners
                      _r._ctx.closePath();
                      _r._ctx.moveTo(min[0], max[1]);
                      _r._ctx.arc(min[0], max[1], 5, 0, Math.PI);

                      _r._ctx.closePath();
                      _r._ctx.moveTo(min[0], min[1]);
                      _r._ctx.arc(min[0], min[1], 5, 0, Math.PI);

                      _r._ctx.closePath();
                      _r._ctx.moveTo(max[0], max[1]);
                      _r._ctx.arc(max[0], max[1], 5, 0, Math.PI);

                      _r._ctx.closePath();
                      _r._ctx.moveTo(max[0], min[1]);
                      _r._ctx.arc(max[0], min[1], 5, 0, Math.PI);
                      _r._ctx.closePath();*/
                      break;

                  case 'Z':
                      _r._ctx.closePath();
                      index = path.length;;
                      break;

                  default:
                      p.log("Error: Invalid path", path[index], path);
                      index = path.length; //Break out of the while loop if we don't know what's going on
              }
          }
          this.min = min;
          this.max = max;

          var pointInPath = false;
          if (typeof checkX !== 'undefined') {
              if (_r._ctx.isPointInPath(checkX, checkY)) {
                  pointInPath = true;
              }
              if (checkX >= min[0] && checkX <= max[0]) {
                if (checkY >= min[1] && checkY <= max[1]) {
                  pointInPath = true;
                }
              }
          }

          if (fill) {
              _r._ctx.fill();
          }

          if (style('stroke')) {
              _r._ctx.stroke();
          }
          //TODO FIREFOX?
          //_r._ctx.setAlpha(1);

          return pointInPath;
      });//draw
    },

    container: function (container) {
        var _r = this
          , hovered
          ;

        if (!container) {
            return this._container;
        }

        //Create and add the container
        this._canvas = document.createElement('canvas');
        this._ctx    = this._canvas.getContext('2d');
        container.appendChild(this._canvas);

        //TODO support older ie
        this._canvas.addEventListener('mouseover', function (event) {
        });


        this._canvas.addEventListener('mousemove', function (event) {
            var offsets = _r.offsets(event);
            var elements = _r.checkPoint(offsets.x, offsets.y);
            var newHover = elements.pop();

            if (newHover && newHover !== hovered
                    && newHover.events.mouseover) {
                newHover.events.mouseover.apply(this);
                _r.render();
            }

            if (hovered && hovered !== newHover && hovered.events.mouseout) {
                hovered.events.mouseout.call(hovered, event);
                _r.render();
            }
            /*_r._ctx.strokeStyle = p.color('#ff0000').html();
            _r._ctx.setAlpha(1);

            _r._ctx.moveTo(offsets.x, offsets.y);
            _r._ctx.lineTo(offsets.x + 10, offsets.y);

            _r._ctx.moveTo(offsets.x, offsets.y);
            _r._ctx.lineTo(offsets.x, offsets.y + 10);*/

            hovered = newHover;
        });

        this._canvas.addEventListener('mouseout', function (event) {
            if (hovered && hovered.events.mouseout) {
                hovered.events.mouseout.call(hovered, event);
                _r.render();
            }
            hovered = false;
        });

        return this;
    },

    path: function(path, options, c) {
    },

    size: function(dim) {
        this._canvas.setAttribute('width', dim[0]);
        this._canvas.setAttribute('height', dim[1]);

        this.__super.size.call(this, dim);
    },

    render: function () {
        this._canvas.width = this._canvas.width;

        for (var i = -3; i <= 3; ++i) {
            render(this.Z[i].children);
        }

        function render(elements) {
            _.each(elements, function (e) {
                if (e.visible) {
                    e.draw();
                    if (!_.isEmpty(e.children)) {
                        render(e.children);
                    }
                }
            });
        }
    },

    checkPoint: function (x, y) {
        this._canvas.width = this._canvas.width;
        var intersectElements = [];
        for (var i = -3; i <= 3; ++i) {
            render(this.Z[i].children);
        }
        return intersectElements;

        function render(elements) {
            _.each(elements, function (e) {
                if (e.visible || e.style('pointerEvents') === 'always') {
                    if (e.draw(x,y) && e.style('pointerEvents') !== 'none') {
                        intersectElements.push(e);
                    }
                    if (!_.isEmpty(e.children)) {
                        render(e.children);
                    }
                }
            });
        }
    },

    // Get coordinates relative to _canvas element
    // http://stackoverflow.com/a/5932203 Ryan Artecona
    offsets: function(event) {
        var totalOffsetX = 0;
        var totalOffsetY = 0;
        var canvasX = 0;
        var canvasY = 0;
        var currentElement = this._canvas;

        do {
            totalOffsetX += currentElement.offsetLeft;
            totalOffsetY += currentElement.offsetTop;
        } while((currentElement = currentElement.offsetParent));

        canvasX = event.pageX - totalOffsetX;
        canvasY = event.pageY - totalOffsetY;

        return {x:canvasX, y:canvasY};
    },

    remove: function() {
        this._container.removeChild(this._canvas);
    }
  });
})(pythia);
