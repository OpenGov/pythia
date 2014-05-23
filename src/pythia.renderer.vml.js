(function (pythia, doc, math, undefined) {
    "use strict";

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
        return doc.createElement('<pythiavml:' + tagName + ' class="pythiavml">');
    }

    renderer.init = function (container, element) {
        var renderer = this;

        this.container = container;

        doc.createStyleSheet().addRule(".pythiavml", "behavior:url(#default#VML)");
        doc.namespaces.add('pythiavml', 'urn:schemas-microsoft-com:vml');

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
                var cumulativeS = pythia.mCopy(cumulativeT),
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

                var transformedPos = pythia.mMulV(cumulativeT, pos);
                newPos = [transformedPos[0], pos[1]];

            } else if (this._style && this._style.position === 'fixed-vertical') {

                var transformedPos = pythia.mMulV(cumulativeT, pos);
                newPos = [pos[0], transformedPos[1]];

            } else if (this._style && this._style.position === 'fixed') {

                newPos = pos;

            } else {
                newPos = pythia.mMulV(cumulativeT, pos);
            }

            if (this._style && this._style.yrelative === 'bottom') {
                newPos[1] = this._r._size[1] - newPos[1];
            }


            var transform = pythia.mCopy(this.scaleT);

            var totalT = pythia.mMulM(cumulativeS, transform);
            totalT = pythia.mMulM(this.rotateT, totalT);
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
            return pythia.mMulV(totalT, pos);
        });

        function vmlCoord(n) {
            return Math.round(n * zoom);
        }

        pythia.element.extend('updateTransform', function (cumulativeT) {
            var totalT = this.calcTransform(cumulativeT),
                i, len, path, vert;

            if (this.hasClass('line') && this._vertices.length) {
                vert = pythia.mMulV(totalT, this._vertices[0]);
                path = ['M' + vmlCoord(vert[0]) + ' ' + vmlCoord(vert[1]) + 'L'];

                for (i = 0, len = this._vertices.length; i < len; ++i) {
                    vert = pythia.mMulV(this._totalT ,this._vertices[i]);
                    path.push(vmlCoord(vert[0]));
                    path.push(vmlCoord(vert[1]));
                }

                this.vml.path = path.join(' ');
            } else if (this.hasClass('path')) {
                path = [];

                for (i = 0, len = this._path.length; i < len; ++i) {
                    var pt = this._path[i];

                    if (_.isArray(pt)) {
                        vert = pythia.mMulV(totalT, pt);

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

                var pos    = pythia.mMulV(totalT, [0,0]),
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

            for (var key in this._children) {
                var child = this._children[key];
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
            vml.strokecolor  = pythia.color(style.strokeColor).html();
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
            fill.color   = pythia.color(color).html();
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
                dim = pythia.measureText(string, style);
                element.translate([0, -dim[1] / 2]);
            }
            if (style.baseline === 'top') {
                dim = pythia.measureText(string, style);
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

    pythia.renderer.vml = pythia.Class(pythia.renderer, renderer);

    addEvent = function (element, type, fn) {
      $(element).on(type, '.pythiavml', fn);
    };

    contains = function (context, node){
        if (node) do {
            if (node === context) return true;
        } while ((node = node.parentNode));
        return false;
    };
})(pythia, document, Math);
