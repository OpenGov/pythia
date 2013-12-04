(function (p) {
    "use strict";

    p.element.element('lineChart', p.Class(p.chart, {
        init: function () {
            this.refresh();
        },

        defaultOptions: [
          ['multiline', false],
          ['stacked', false],
          ['percent', false],
          ['roundLongest', false],
          ['fill', false]],

        refresh: function() {
            this._r.pause();
            this.killAllAnimations();
            if (_.isEmpty(this._data._data)) {
                this.clear();
                return;
            }

            this.flipCache();

            var lines;
            this.lines = lines = [];

            var self             = this,
                multiline        = this._opts.multiline   || false,
                stacked          = this._opts.stacked     || false,
                strokeWidth      = this._opts.strokeWidth || 0,
                fill             = this._opts.fill        || false,
                percent          = this._opts.percent     || false,
                lineColor        = p.accessor(this._opts.lineColor , this._style.color),
                marker           = this._opts.marker      || 4, //TODO
                cumulativeHeight = [],
                cumulativeValue  = [],
                lastLine,
                longest      = percent ? 100 : p.max(this._data._data, this.dataValue, this.dataLine, multiline, stacked),
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

                // Mark the x axis in units of 25%
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
                if (shortest < 0 && longest > 0) {
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


            var yOffset    = shortest < 0 ? -1 * shortest : 0, // Account for negative space below the x axis
                yTransform = 100/(longest + yOffset),          // Multiply y values into height in the renderer
                zeroHeight = yOffset * yTransform;             // Height of the zero x axis

            var dSize,
                types = [];

            if (multiline) {
                dSize = _.size(this.dataLine(data[0]));
            } else {
                dSize = _.size(data);
            }

            if (dSize > 1) {
                stepSize =  100 / (dSize - 1);
            } else {
                stepSize = 100;
            }

            if (multiline) {
                _.each(data.reverse(), addLine);
            } else { //not multiline
                addLine(data, 0);
            }
            if (lastLine) {
                for (var l = 0; l < lastLine.length; ++l) {
                  lastLine[l]._last = true;
                }
            }

            function addLine(line, lineNumber) {
                var vertices     = [],
                    oldHeight    = [],
                    i            = 0,
                    line_i       = 0,
                    points       = [],
                    current_type = '',
                    dline        = self.dataLine(line),
                    dLineId      = self.dataLineId(line);

                var cached = self.cache(dLineId, 'line'),
                    lineElements = cached || [],
                    color = lineColor(line, lineNumber),
                    colorStyle = {strokeColor: color, lineColor: color, color: color};


                for(var key in dline) { if (dline.hasOwnProperty(key)) {
                    var element = dline[key];
                    var value, height, offsetHeight;

                    if (percent) {
                        if (totals[key]) {
                            value = self.dataValue(element, key, lineNumber)/totals[key] * 100;
                        } else {
                            value = 100 / counts[key];
                        }
                    } else {
                        value = self.dataValue(element, key, lineNumber);
                    }
                    oldHeight[i] = cumulativeHeight[i] = cumulativeHeight[i] || (zeroHeight + ((negativeDrag * shortList[i]) * yTransform));

                    if (stacked) {
                        height = value * yTransform;
                    } else {
                        height = (value + yOffset) * yTransform;
                    }

                    cumulativeValue[i] = cumulativeValue[i] || 0;

                    if (stacked) {
                        if (value < 0) {
                            offsetHeight = oldHeight[i];
                            cumulativeHeight[i] = oldHeight[i] -= height;
                        } else {
                            offsetHeight = cumulativeHeight[i] = oldHeight[i] + height;
                        }
                    } else {
                        cumulativeHeight[i] += height;
                        offsetHeight = height;
                    }

                    cumulativeValue[i] += value;

                    var y = 100 - offsetHeight;
                    if (y < 0.001 && y > -0.001) {
                        y = 0;
                    }

                    var vertex;
                    if (dSize > 1) {
                        vertex = [stepSize * i, y];
                        vertices.push(vertex);
                        points.push([value, key, vertex, value]);
                    } else {
                        vertex = [50, y];
                        points.push([value, key, vertex, value]);
                        vertices = [[0,y], vertex, [100,y]];
                        vertices[0].type = line.sortedTypes[key];
                        vertices[2].type = line.sortedTypes[key];
                    }
                    vertex.type = line.sortedTypes[key];
                    ++i;

                    if (vertex.type !== current_type) {
                        var el    = lineElements[line_i] = self.cache([dLineId, line_i], 'lineSegment'),
                            style = pythia.Style(colorStyle, self.elementTypeStyle('line', vertex.type));

                        if (!el) {
                            el = self.line([vertices[0]], style);
                            el.addClass('lineSegment');
                            el.data(line, line, line.id, line.id);
                        } else {
                            lineElements[line_i].setStyles(style);
                            lineElements[line_i].refresh();
                        }

                        lineElements[line_i] = el;
                        current_type = el.type = vertex.type;
                        self.cache([dLineId, line_i], 'lineSegment', el);

                        line_i++;
                    }
                }}

                lines.push(lineElements);
                self.cache(self.dataLineId(line), 'line', []);

                var pointElements = [];

                for(var l = 0; l < points.length; ++l) {
                    var pdata = points[l];
                    var point = self.cache([self.dataLineId(line), l], 'point');


                    if (!point) {
                        point = self.circleSlice(
                            pdata[2],
                            4,
                            0,
                            Math.PI * 2.1,
                            pythia.Style(colorStyle, self.elementTypeStyle('vertex', 'default'))
                        ).addClass('point');

                        point._style.pointerEvents = 'always';
                    }
                    point.parent(lineElements[0]);

                    point.data(pdata[0], line, pdata[1], line.id);
                    point._total = cumulativeValue[l];
                    point.value = pdata[3];


                    pointElements.push(point);
                    self.cache([self.dataLineId(line), l], 'point', point);
                }

                var path;

                if (fill) {
                    path = self.cache([dLineId], 'fill') || [];

                    for (i = 0; i < lineElements.length; ++i) {
                        path[i] = self.cache([dLineId, i], 'fillSegment');

                        if (!path[i]) {
                            path[i] = self.path()
                                          .move(vertices[0])
                                          .addClass('fill')
                                          .toBottom();
                            path[i]._vertices = vertices;

                            path[i].oldBottom = oldHeight;
                            path[i]._vertices = vertices;
                        } else {
                            path[i].wasFill = true;
                            path.oldBottom = path[i].oldBottom;
                        }

                        path[i]._style = pythia.Style(colorStyle, self.elementTypeStyle('fill', lineElements[i].type));
                        path[i].refresh();

                        self.cache([dLineId, i], 'fillSegment', path[i]);
                    }

                    for (i = 0; i < path.length; ++i) {
                        path[i].data(line, line, line.id, line.id);
                    }
                    self.cache([self.dataLineId(line)], 'fill', []);
                }

                if (cached) {
                    self.animate(
                        self.doTranslate(
                            lineElements,
                            pointElements,
                            vertices,
                            path,
                            oldHeight,
                            fill && path[0].oldBottom && path[0].oldBottom.slice(0)
                        ),
                        400
                    );
                } else {
                    self.animate(
                        self.doEnter(
                            lineElements,
                            pointElements,
                            vertices,
                            path,
                            oldHeight
                        ),
                        400
                    );
                }
                lastLine = lineElements;
            }

            this.flushCache();
            this._r.unPause();

            return this;
        },

        elementTypeStyle: function (element, type) {
            var elementStyle = this._opts.elementStyle[element],
                typeStyle = elementStyle[type];

            if (typeStyle) {
              return typeStyle;
            } else {
              return elementStyle['default'];
            }
        },


        doEnter: function (lines, points, vertices, fills, fillBottom) {
            var length = vertices.length,
                self = this;
            fillBottom = _.map(fillBottom, function (n) {return 100 - n;});

            return function (scale) {
                var x, y, i, line_i = 0, xTmp, furthest = 0;

                var furthestIndex = scale * (length - 1),
                    line = lines[0],
                    fill,
                    offset = 0,
                    type,
                    v_i;

                if (fills) {
                    for (i = 0; i < fills.length; ++i) {
                        fills[i].reset();
                        fills[i].lineElement = lines[i];
                    }
                    fill = fills[0];
                    fill.offset = offset;
                    fill.lineElement = line;
                }

                for (i = 0; i < furthestIndex && i < length; ++i) {
                    v_i = i - offset;
                    x = vertices[i][0];
                    y = vertices[i][1];
                    type = vertices[i].type;

                    if (!line._vertices[v_i]) {
                        line._vertices[v_i] = [x,y];
                    } else {
                        line._vertices[v_i][0] = x;
                        line._vertices[v_i][1] = y;
                    }

                    if (fill) {
                        if (v_i === 0) {
                            fill.move([x,y]);
                        } else {
                            fill.line([x,y]);
                        }
                    }

                    if (i + 1 < length && vertices[i + 1].type !== type) {
                        type = vertices[i + 1].type;
                        line.updateTransform();
                        line_i++;
                        line = lines[line_i];
                        offset = i;
                        line._vertices[0] = [x, y];

                        if (fill) {
                            fill = fills[line_i];
                            fill.move([x,y]);
                            fill.lineElement = line;
                            fill.offset = offset;
                        }
                    }
                }

                var furthestPoint, furthestLine;

                if (i < length) {
                    furthestPoint = interpolatePoint(vertices, scale);
                    furthestLine = line;
                    line._vertices[i - offset] = furthestPoint;
                }

                line.updateTransform();

                if (fill) {
                    var j;

                    for (i = 0; i < fills.length; ++i) {
                        fill = fills[i];
                        line = fill.lineElement;
                        j = line._vertices.length - 1;
                        offset = fill.offset;

                        if (j) {
                            if (furthestPoint && line === furthestLine) {
                                var furthestBottom = interpolate(fillBottom, offset, scale);
                                fill.line(furthestPoint);
                                fill.line([furthestPoint[0], furthestBottom]);
                                j--;
                            }
                            for (; j >= 0; --j) {
                                fill.line([line._vertices[j][0], fillBottom[j + offset]]);
                            }
                            fill.updateTransform();
                        }
                    }
                }
            };
        },


        doTranslate: function (lines, points, newVertices, fills, fillBottom, oldFillBottom) {
            var length = newVertices.length,
                i;

            return function (scale) {
                var x, y, i, v_i, line, fill, oldVertex, type, offset = 0, line_i = 0;
                line = lines[0];
                type = lines[0].type;

                if (fills) {
                    for (i = 0; i < fills.length; ++i) {
                        fills[i].reset();
                    }
                    fill = fills[0];
                    fill.lineElement = line;
                    fill.offset = 0;
                }

                for (i = 0; i < length; ++i) {
                    v_i = i - offset;

                    oldVertex = line._vertices[v_i];
                    if (oldVertex === undefined) {
                        oldVertex = line._vertices[v_i === 0 ? v_i + 1 : v_i - 1];
                        if (oldVertex === undefined) {
                            oldVertex = [0, 0];
                        }
                        line._vertices[v_i] = [];
                    }

                    x = (newVertices[i][0] - oldVertex[0]) * scale + oldVertex[0];
                    y = (newVertices[i][1] - oldVertex[1]) * scale + oldVertex[1];

                    line._vertices[v_i][0] = x;
                    line._vertices[v_i][1] = y;

                    if (fill) {
                        if (i === 0) {
                            fill.move([x,y]);
                        } else {
                            fill.line([x,y]);
                        }
                    }

                    if (points.length > 1) {
                        points[i]._pos = [x,y];
                        points[i].repath();
                        points[i].updateTransform();
                    }

                    if (i + 1 < length && newVertices[i + 1].type !== type) {
                        line._vertices.splice(i - offset + 1, line._vertices.length);

                        type = newVertices[i + 1].type;
                        line_i++;
                        line.updateTransform();
                        line = lines[line_i];
                        offset = i;
                        line._vertices[0] = [x, y];


                        if (fill) {
                            fill = fills[line_i];
                            fill.move([x,y]);
                            fill.lineElement = line;
                            fill.offset = offset;
                        }
                    }
                }

                line._vertices.splice(i - offset, line._vertices.length);

                if (points.length === 1) {
                    points[0]._pos = [50,0];
                    points[0].repath();
                    points[0].updateTransform();

                    fillBottom = [0,0,0];
                }

                if (fill) {
                    var j, jlen, vertices;

                    for (j = 0, jlen = fills.length; j < jlen; ++j) {
                        fill = fills[j];
                        offset = fill.offset;
                        vertices = fill.lineElement._vertices;

                        for (i = vertices.length - 1; i >= 0; --i) {
                           var height,
                               heightScale, heightFinal;

                           if (!fill.wasFill) {
                               heightScale = scale * 100;
                               heightFinal = fillBottom[i + offset];

                               height = 100 - Math.min(heightScale, heightFinal);
                           } else {
                               height = 100 - (scale * (fillBottom[i + offset] - oldFillBottom[i + offset]) + oldFillBottom[i + offset]);
                               height = height || (100 - fillBottom[i + offset]);
                           }

                           fill.line([vertices[i][0], height]);
                        }
                        fill.updateTransform();

                        fill.oldBottom = fillBottom;
                    }
                }

                line.updateTransform();
                if (fill) {
                    fill.updateTransform();
                }
            };
        }
    }));


    function interpolateDim(points, dim, t) {
        var count = points.length - 1;

        var startIndex = furthestIndex(count, t),
            start      = points[startIndex][dim],
            endIndex   = startIndex === t * count ? startIndex : startIndex + 1,
            end        = points[endIndex][dim],
            subT       = t - startIndex;

        return start + subT * (end - start);
    }

    function interpolate(points, offset, t) {
        var count = points.length - 1;

        var startIndex = Math.floor(t * count),
            start      = points[startIndex],
            endIndex   = startIndex === count ? count : startIndex + 1,
            end        = points[endIndex],
            subT       = (t * count) - startIndex;

        return start + subT * (end - start);
    }

    function interpolatePoint(points, t) {
        var count = points.length - 1;

        var startIndex = Math.floor(t * count),
            start      = points[startIndex],
            endIndex   = startIndex === count ? count : startIndex + 1,
            end        = points[endIndex],
            subT       = t * count - startIndex;

        return [start[0] + subT * (end[0] - start[0]),
                start[1] + subT * (end[1] - start[1])];
    }

})(pythia);
