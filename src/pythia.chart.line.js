(function (p) {
    "use strict";

    p.element.element('lineChart', p.Class(p.chart, {
        init: function () {
            this.total            = {};
            this.count            = {};
            this.longest          = 0;
            this.longest_total    = 0;
            this.shortest         = Infinity;
            this.shortest_total   = Infinity;
            this.cumulativeHeight = [];

            this.refresh();
        },

        defaultOptions: [
            ['multiline', false]
          , ['stacked', false]
          , ['percent', false]
          , ['roundLongest', false]
          , ['fill', false] ],

        refresh: function() {
            this._r.pause();
            this.killAllAnimations();
            if (_.isEmpty(this._data._data)) {
                this.clear();
                return;
            }

            this.flipCache();

            var self       = this
              , multiline  = this._opts.multiline  || false
              , stacked    = this._opts.stacked    || false
              , lineWidth  = this._opts.lineWidth  || 0
              , fill       = this._opts.fill       || false
              , percent    = this._opts.percent    || false
              , lineColor  = p.accessor(this._opts.lineColor    , this.style('color'))
              , marker     = this._opts.marker || 4 //TODO
              , cumulativeHeight = []
              , cumulativeValue  = []
              , lastLine
              ;

            var longest = percent ? 100 : p.max(this._data._data, this.dataValue, this.dataLine, multiline, stacked);


            var shortest = percent ? 100 : p.min(this._data._data, this.dataValue, this.dataLine, multiline, stacked);
            var longShort = pythia.axisScale(longest, shortest, 5);
            longest = longShort[0];
            shortest = longShort[1];

            if (this._opts.roundLongest) {
                longest = this.roundLongest(longest);
            }
            this.longest = longest;
            this.shortest = shortest;
            this.step = longShort[2];

            var stepSize;

            var totals = {},
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
                        totals[key] += this.dataValue(d, key, lineKey);
                        counts[key] += 1;
                    }
                }
            }

            var offset = 0;
            if (!percent && !stacked) {
                offset = shortest < 0 ? -1 * shortest : 0;
            }

            if (multiline) {
                stepSize =  100 / (_.size(this.dataLine(data[0])) - 1);
            } else {
                stepSize = 100 / (_.size(data) - 1);
            }

            if (multiline) {
                _.each(data, addLine);
            } else { //not multiline
                addLine(data, 0);
            }
            if (lastLine) {
                lastLine.budgeted._last = true;
                lastLine.actual._last = true;
            }

            function addLine(line, lineNumber) {
                var vertices = [];
                var oldHeight = [];

                var i = 0;
                var points = [];
                var dline = self.dataLine(line);

                for(var key in dline) { if (dline.hasOwnProperty(key)) {
                    var element = dline[key];
                    var value;
                    if (percent) {
                        if (totals[key]) {
                            value = self.dataValue(element, key, lineNumber)/totals[key] * 100;
                        } else {
                            value = 100 / counts[key];
                        }
                    } else {
                        value = self.dataValue(element, key, lineNumber);
                    }

                    var height = (value + offset)/(longest + offset) * 100;

                    oldHeight[i] = cumulativeHeight[i] || 0;
                    cumulativeValue[i] = cumulativeValue[i] || 0;
                    if (stacked && lineNumber) {
                        height = (cumulativeHeight[i] += height);
                        cumulativeValue[i] += value;
                    } else {
                        cumulativeHeight[i] = height;
                        cumulativeValue[i] = value;
                    }
                }}
            }

            this.flushCache();
            this._r.unPause();

            return this;
        },

        add: function (data, key, count, dimension, objects, last_objects, parent_objects) {
            if (dimension === 0) {
                var lineWidth = this._opts.lineWidth || 0,
                    color = objects.lineColor = this._opts.lineColor(data, key),
                    id = objects.id = this.dataLineId(data);
                objects.data = data;

                objects.actual = this.line([[0,0]], p.chainStyle(this.style, {
                    'line-width': lineWidth,
                    'strokeColor': objects.lineColor
                })).data(data, data, id, id);

                objects.budget = this.line( [[0,0]], p.chainStyle(this.style, {
                    'line-width':      lineWidth,
                    'strokeColor':     objects.lineColor,
                    'stroke-dasharray': "8,4"
                })).data(data, data, id, id);

                if (this._opts.fill) {
                    var path = {};
                    path.actual   = this.path().move([0,0]);
                    path.budgeted = this.path().move([0,0]);

                    //path.oldBottom = oldHeight;

                    path.actual.style(p.chainStyle(this.style, {
                        color: color,
                        alpha: 0.60,
                        fill: true,
                        'line-width': 0.5,
                        'strokeColor': color,
                        'stroke-opacity': 1,
                        pointerEvents:'always'
                    }));

                    path.budgeted.style(p.chainStyle(this.style, {
                        color: color,
                        alpha: 0.75,
                        fill: true,
                        'line-width': 1,
                        'strokeColor': color,
                        'stroke-opacity': 0.75,
                        pointerEvents:'always'
                    }));

                    path.actual.addClass('fill');
                    path.budgeted.addClass('fill');

                    path.actual.toBottom();
                    path.budgeted.toBottom();
                    ///path.actual._vertices = vertices;
                    ///path.budgeted._vertices = vertices;

                    path.actual.data(data, data, id, id);
                    path.budgeted.data(data, data, id, id);
                }
            }

            if (dimension === 1) {
                if (!this.total[count]) {
                    this.total[count] = 0;
                    this.count[count] = 0;
                }
                var total = this.total[count] += data;
                this.count[count]++;

                if (total > this.longest_total) {
                    this.longest_total = total;
                }

                if (total < this.shortest_total) {
                    this.shortest_total = total;
                }

                if (data > this.longest) {
                    this.longest = data;
                }
                if (data < this.shortest) {
                    this.shortest = data;
                }

                var self = this;

                return function () {
                    var offset   = 0,
                        stepSize = 100 / (self._dimLengths[dimension] - 1),
                        longest,
                        shortest;

                    if (self._opts.stacked) {
                        longest = self.longest_total;
                        shortest = self.shortest_total;
                    } else {
                        longest = self.longest;
                        shortest = self.shortest;
                    }

                    var longShort = pythia.axisScale(longest, shortest, 5);
                    longest = longShort[0],
                    shortest = longShort[1];

                    if (!self._opts.percent && !self._opts.stacked) {
                        offset = shortest < 0 ? -1 * shortest : 0;
                    }

                    objects.height = (data + offset) / (longest + offset) * 100;

                    if (self._opts.stacked) {
                        objects.bottom = self.cumulativeHeight[count] || 0;
                        objects.height += objects.bottom;
                        self.cumulativeHeight[count] = objects.height;
                    }

                    var y = 100 - objects.height;
                    if (y < 0.001 && y > -0.001) {
                        y = 0;
                    }

                    var vertex = [stepSize * count, y];

                    objects.point = self.circleSlice
                                    ( vertex
                                    , 4
                                    , 0
                                    , Math.PI * 2.1
                                    , pythia.chainStyle
                                        ( self.style
                                        , {color: parent_objects.lineColor
                                        , pointerEvents: 'always'
                                        , stroke: false
                                        , size:'fixed'}
                                        )
                                    ).addClass('point');
                    objects.point.parent(parent_objects.actual);
                    objects.point.data(data, parent_objects.data, key, parent_objects.id);
                    objects.point._total = self.total[count];

                    parent_objects.actual._vertices[count] = vertex;
                };
            }
        },

        doEnter: function (line, budgetLine, points, vertices, fill, budgetFill, fillBottom) {
            var length = vertices.length;
            fillBottom = _.map(fillBottom, function (n) {return 100 - n});
            var budgetYears = this._opts.budgetYearCount;

            return function (scale) {
                var x, y, i, xTmp, furthest = 0;

                fill && fill.reset();
                budgetFill && budgetFill.reset();

                var furthestIndex = scale * (length - 1);

                for (i = 0; i < furthestIndex && i < length - budgetYears; ++i) {
                    x = vertices[i][0];
                    y = vertices[i][1];

                    if (!line._vertices[i]) {
                        line._vertices[i] = [x,y];
                    } else {
                        line._vertices[i][0] = x;
                        line._vertices[i][1] = y;
                    }

                    if (fill) {
                        if (i === 0) {
                            fill.move([x,y]);
                        } else {
                            fill.line([x,y]);
                        }
                    }
                }

                if (i < length - budgetYears) {
                    var furthestPoint = interpolatePoint(vertices, scale);
                    line._vertices[i] = furthestPoint;
                }

                if (i === length - budgetYears) {
                    budgetLine._vertices = [];
                    var j = (i - 1 >= 0) ? i - 1 : 0;
                    for (; j < vertices.length; ++j) {
                        budgetLine._vertices.push([vertices[j][0], vertices[j][1]]);
                    }
                    budgetLine.updateTransform();
                }

                line.updateTransform();

                if (fill) {
                    if (i !== length - budgetYears) {
                        fill.line(furthestPoint);
                        var furthestBot = interpolate(fillBottom, scale);
                        fill.line([line._vertices[i][0], furthestBot]);
                    }

                    var j = i;
                    for (--j; j >= 0; --j) {
                        fill.line([line._vertices[j][0], fillBottom[j]]);
                    }

                    if (i === length - budgetYears) {
                        budgetFill.move([budgetLine._vertices[0][0], budgetLine._vertices[0][1]]);

                        for (j = 0; j < budgetLine._vertices.length; ++j) {
                            budgetFill.line([budgetLine._vertices[j][0], budgetLine._vertices[j][1]]);
                        }
                        // complete the bottom path
                        for (j = j + i - 1; j >= i; --j) {
                            //fill.line([line._vertices[i][0], fillBottom[j]]);
                            budgetFill.line([budgetLine._vertices[j - i][0], fillBottom[j - 1]]);
                        }

                        budgetFill.updateTransform();
                    }

                    fill.updateTransform();
                }
            };
        },

        doExit: function (el) {
            if (el.hasClass('line')) {
                return function (scale) {
                    if (scale === 1) {
                        el.remove();
                        return;
                    }

                    var furthest = interpolatePoint(el._vertices, scale),
                        length = el._vertices.length,
                        furthestIndex = Math.ceil(scale * (length - 1)),
                        newVertices = [furthest];

                    for (var i = furthestIndex; i < length; ++i) {
                        newVertices.push(el._vertices[i]);
                    }

                    el._vertices = newVertices;
                    el.updateTransform();
                };
            } else if (el.hasClass('fill')) {

                var verts = _.filter(el._path, _.isArray);

                return function (scale) {
                    if (scale === 1) {
                        el.remove();
                        return;
                    }

                    var furthest = interpolatePoint(el._vertices, scale);
                    var i = 0;
                    _.each(verts, function (v) {
                        if (v[0] < furthest[0]) {
                            v[0] = furthest[0];
                            if (i < 1) {
                                v[1] = furthest[1];
                                ++i;
                            }
                        }
                    });

                    el.updateTransform();
                };
            }
        },

        doTranslate: function (line, budgetLine, points, oldVertices, newVertices, fill, budgetFill, fillBottom, oldFillBottom) {
            var length      = newVertices.length,
                budgetYears = this._opts.budgetYearCount,
                i;

            while (line._vertices.length < length - budgetYears) {
                var l = line._vertices.length;
                line._vertices.push([newVertices[l][0], [newVertices[l][1]]]);
                if (fill) {
                    oldFillBottom[l]  = newVertices[l][1] + 100;
                }
            }
            if (oldVertices.length > length) {
                for (i = length - budgetYears; i < line._vertices.length; ++i) {
                    line._vertices.pop();
                }
            }

            while (oldVertices.length < length) {
                if (oldVertices.length < length - budgetYears + 1) {
                }
                oldVertices[oldVertices.length] = newVertices[oldVertices.length];
            }
            if (oldVertices.length > length) {
                for (i = length - budgetYears - 1; i < line._vertices.length; ++i) {
                    line._vertices.pop();
                }
            }
            while (budgetLine._vertices.length > budgetYears + 1) {
                budgetLine._vertices.pop();
            }

            return function (scale) {
                var x, y, i;

                if (fill) {
                    fill.reset();
                    budgetFill.reset();
                }

                for (i = 0; i < length; ++i) {
                    x =
                        (newVertices[i][0] - oldVertices[i][0]) * scale +
                        oldVertices[i][0];
                    y = (newVertices[i][1] - oldVertices[i][1]) * scale +
                        oldVertices[i][1];

                    if (i <  length - budgetYears) {
                        line._vertices[i][0] = x;
                        line._vertices[i][1] = y;

                        if (fill) {
                            if (i === 0) {
                                fill.move([x,y]);
                            } else {
                                fill.line([x,y]);
                            }
                        }

                        if (budgetYears) {
                            if (i === length - budgetYears - 1) {
                                budgetLine._vertices[0][0] = x;
                                budgetLine._vertices[0][1] = y;
                                if (fill) {
                                    budgetFill.move([x,y]);
                                }
                            }
                        }
                    } else {
                        var budgetIndex = i - (length - budgetYears) + 1;

                        if (fill) {
                            budgetFill.line([x,y]);
                        }
                        budgetLine._vertices[budgetIndex] = [x,y];
                    }

                    points[i]._pos[0] = x;
                    points[i]._pos[1] = y;
                    points[i].repath();
                    points[i].updateTransform();
                }

                if (fill) {
                    for (var i = length - 1; i >= 0; --i) {
                       var height,
                           heightScale, heightFinal,
                           top = points[i]._pos;

                       if (!fill.wasFill) {
                           heightScale = scale * 100;
                           heightFinal = fillBottom[i];

                           height = 100 - Math.min(heightScale, heightFinal);
                       } else {
                           height = 100 - (scale * (fillBottom[i] - oldFillBottom[i]) +
                                           oldFillBottom[i]);
                       }

                       if (i < length - budgetYears) {
                           fill.line([top[0], height]);

                           if (budgetYears) {
                                if (i === length - budgetYears - 1) {
                                    budgetFill.line([top[0], height]);
                                }
                           }
                       } else {
                           budgetFill.line([top[0], height]);
                       }
                    }

                    fill.oldBottom = fillBottom;
                }

                line.updateTransform();
                budgetLine.updateTransform();
                fill &&
                    fill.updateTransform();
                budgetFill &&
                    budgetFill.updateTransform();
            };

        },

        dofill: function (path, top, bottom) {
            return function (scale) {
                path.reset();
                path.move(top[0]);

                _.each(top, function(v) {
                     path.line(v);
                });

                for (var i = bottom.length - 1; i >= 0; --i) {
                     var y = scale * ((100 - bottom[i]) - top[i][1])

                     path.line([top[i][0], top[i][1] + y]);
                }
                path.updateTransform();
            }
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

    function interpolate(points, t) {
        var count = points.length - 1;

        var startIndex = Math.floor(t * count),
            start      = points[startIndex],
            endIndex   = startIndex === count ? count : startIndex + 1,
            end        = points[endIndex],
            subT       = t * count - startIndex;

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
