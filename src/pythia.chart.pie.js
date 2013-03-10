(function(p) {
    p.element.element('pieChart', p.Class(p.chart, {
        init: function () {
            var self        = this;
            this.radius     = self._opts.radius  || 50;
            this.x          = self._opts.x       || 50;
            this.y          = self._opts.y       || 50;

            this.refresh();
        },

        defaultOptions: [
            ['multiline', false]
        ],

        refresh: function() {
            "use strict";
            this._r.pause();
            this.killAllAnimations();
            if (_.isEmpty(this._data._data)) {
                this.clear();
                return;
            }

            this.flipCache();

            var self  = this
              , total = _.reduce(self._data._data, function (sum, el) { return sum + self.dataValue(el); }, 0);
            var count = 0;

            //var legend = self.drawLegend.call(self);
            self.pos = self.pos || 0;

            if (self._opts.multiline) {
                _.all(self.dataLine(self._data._data[0]), function(line, key) {
                    key = self.pos;
                    var data = _.zip(_.pluck(_.map(self._data._data, self.dataLine), key), _.keys(self._data._data));

                    total = _.reduce(data, function (sum, el) {
                        var value = self.dataValue(el[0]);

                        if (value > 0) {
                            return sum + value;
                        } else {
                            return sum;
                        }
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
                    var el      = zipped[0];
                    var lineKey = zipped[1];
                    var line = self._data._data[lineKey];

                    var value = self.dataValue(el, i, lineNo);
                    if (value < 0) {
                        return;
                    }
                    if (_.isUndefined(value)) {
                        return;
                    }

                    var ratio, angle;

                    if (total) {
                        ratio = (value / total);
                        angle = ratio * 2 * Math.PI
                    } else {
                        angle = 2 * Math.PI / data.length;
                    }

                    var lineId = self.dataLineId(self._data._data[lineKey]);
                    var slice = self.cache(lineId, 'slice');
                    if (!slice) {
                        var alpha;
                        if (Browser.chrome) {
                            alpha = 1;
                        } else {
                            alpha = 0.6;
                        }
                        slice = self.circleSlice(
                                      [self.x, self.y]
                                    , self.radius
                                    , startAngle
                                    , 0
                                    , p.chainStyle(self.style, {
                                          color: line.color,
                                          size: 'proportional',
                                          alpha: alpha,
                                          stroke: false
                                    })
                                    ).addClass('slice')
                                     .data(el, self._data._data[lineKey], lineNo, self._data._data[lineKey].id)

                        var ratio = angle / (2 * Math.PI);
                        var a = self.animate(morph(slice, slice._startAngle, slice._angle, startAngle, angle), ratio * 200);

                        if (animation) {
                            animation = animation.chain(a);
                        } else {
                            animation = a;
                        }

                    } else {
                        slice._pos        = [self.x, self.y];
                        slice._radius     = self.radius;
                        slice.data(el, self._data._data[lineKey], lineNo, self._data._data[lineKey].id)
                        var ratio = Math.abs(angle) / (2 * Math.PI);
                        var a = self.animate(morph(slice, slice._startAngle, slice._angle, startAngle, angle), 500);
                    }
                    slice.percent = ratio * 100;
                    startAngle += angle;
                    self.cache(lineId, 'slice', slice);
                });
            }
            this.flushCache();
            this._r.unPause();
        }
    }))

    function morph(slice, oldStartAngle, oldAngle, startAngle, angle) {
        return function (scale) {
            slice._startAngle = oldStartAngle + (startAngle - oldStartAngle) * scale;
            slice._angle      = oldAngle + (angle - oldAngle) * scale;

            slice.updateTransform();
        }
    }

})(pythia);
