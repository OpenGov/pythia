(function(p) {
    var chartID = 0;

    p.chart = p.Class(p.element, {
        init: function(options) {
            options = options || {};

            this.options(this.defaultOptions, options);
            this._dcache = {_children:{}};

            this.dim = {
                1: function (d, k) {
                    return d.years;
                }
            };

            this._opts.style = options.style || p.defaultStyle;

            this.style      = this.computeStyle('*');
            this.parseStyle(this._opts.style);

            this.dataLine    = p.accessor(options.dataLine, function (d) { return d; });
            this.dataValue   = p.accessor(options.dataValue, function (d) { return d; });
            this.dataValueId = p.accessor(options.dataValue, function (d, k) { return k; });
            this.dataLineId  = p.accessor(options.dataLineId, function (d, k) { return k; });
            this.label       = p.accessor(options.label, function (d) { return d; });
            this.color       = p.accessor(options.color, this.style('color'));
            this.lineColor   = p.accessor(options.lineColor, this.style('color'));

            this.data([]);
            this._cache = {children:{}};

            if (options.title) {
                this._r.Text(options.title, [50, 0], this.computeStyle('title'));
            }
        },

        data: function (data) {
            if (!data.__pythia) {
                data = p.set(data);
            }
            data.register(this);

            this._data = data;

            this.refreshData();
            this.refresh();

            return this;
        },

        refreshData: function () {
            this._dimCount   = 2;
            this._dimLengths = [0,0];

            var data = this._data._data,
                defer,
                deferred = [],
                self = this;

            this.eachData(data, processDim, 0, this._dcache);
            _.each(deferred, run_deferred);

            function processDim(data, key, count, dim, last_cache, parent_cache) {
                var cache = parent_cache._children[key];

                if (cache) {
                    if (self.change) {
                        self.change(data, key, count, dim, cache, last_cache, parent_cache);
                    }
                } else {
                    cache = parent_cache._children[key] = {_children: {}};
                    if (self.add) {
                        defer = self.add(data, key, count, dim, cache, last_cache, parent_cache);
                        if (_.isFunction(defer)) {
                            deferred.push(defer);
                        }
                    }
                }

                dim++;
                if (dim < self._dimCount) {
                    if (self.dim[dim]) {
                        data = self.dim[dim](data);
                    }
                    self.eachData(data, processDim, dim, cache);
                }

                return cache;
            }

            function run_deferred(f) {
                f();
            }
        },

        eachData: function (obj, callback, dim, cache) {
            var i = 0,
                last_cache;
            if (obj.length === +obj.length) {
                for (l = obj.length; i < l; i++) {
                    last_cache = callback(obj[i], i, i, dim, last_cache, cache);
                }
            } else {
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        last_cache = callback(obj[key], key, i++, dim, last_cache, cache);
                    }
                }
            }
            if (i > this._dimLengths[dim]) {
                this._dimLengths[dim] = i;
            }
        },

        flipCache: function () {
            this._oldCache = this._cache;
            this._cache = {children:{}};

            return this;
        },

        flushCache: function (cache) {
            cache = cache || this._oldCache;
            var self = this;

            flush(cache);

            this._oldCache = {children:{}};

            return this;
        },

        traceCache: function (id, cache, skip) {
            if (!_.isArray(id)) {
                var subCache = cache[id];
                if (!subCache) {
                    if (skip) {
                        return 0;
                    }
                    subCache = cache[id] = {children:{}};
                } else {
                }
                return subCache;
            }

            var subCache = cache;
            for (var i = 0; i < id.length; ++i) {
                subCache = cache[id[i]];
                if (!subCache) {
                    if (skip) {
                        return 0;
                    }
                    subCache = cache[id[i]] = {children:{}};
                }
                cache = subCache.children;
            }

            return cache;
        },

        cache: function (id, cacheName, el) {

            if (el) {
                var cache = this.traceCache(id, this._cache);
                cache[cacheName] = el;

                return this;

            } else {
                var cache = this.traceCache(id, this._oldCache, 'skip');

                if (!cache) {
                    return;
                }

                el = cache[cacheName];
                delete cache[cacheName];

                return el;
            }
        },

        parseStyle: function(style) {
            var styles = {}, k;
            for (k in style) { if (style.hasOwnProperty(k)) {
                var nextStyle;
                var levels = k.split(" ");
                var l;
                var subStyle = styles;

                for (l = 0; l < levels.length; ++l) {
                    if (!subStyle.hasOwnProperty(levels[l])) {
                        subStyle[levels[l]] = [];
                    }
                    nextStyle = {};
                    subStyle[levels[l]].push(nextStyle);
                    subStyle = nextStyle;
                }
                nextStyle.__style = k;
            }}
        },

/*        drawLegend: function(style) {
            var self = this;

            self._r.defaultWindow(self.legendWin);
            var v = [0,0];

            var legendItems = {};

            var colorWidth = 5;
            var yspacing   = 1;
            var yspacing   = 8;

            var x          = 0;
            var y          = 0;
            var widest     = 0;

                var text   = self._r.Text(self.label(el, i), [x + colorWidth + 1, y], self.computeStyle('legend'));
                var m      = text.measure();
                var color  = self._r.Rect([x,y], [colorWidth, m[1] * 1.1], p.style({ color: self.color(el,i) }));
                //var marker = self._r.Rect(v, m, { color: color(el,i)});
                widest = Math.max(widest, 5 + m[0]);

                var dy = m[1] + yspacing;
                y += dy;

                if ((y + dy) > 100) {
                    y = 0;
                    x += widest;
                }

                legendItems[i] = {label: text, color: color};
            });
            this._r.defaultWindow(this.chartWin);

            return legendItems;
        },*/


        roundLongest: function(longest) {
            /*var opt  = this._opts.axis;
            var stepCount = 5;

            if (!opt || !(opt[0] || opt[1] || opt[2] || opt[3])) {
                return longest;
            }*/


            var digits = Math.floor(p.log10(longest));
            var str  = (Math.floor(longest).toString());
            var str2 = str.charAt(0) + str.charAt(1);

            for (i = 2; i < str.length; ++i) {
                str2 += '0';
            }
            if (str2 != longest) {
                var pow = digits - 1 || 1;
                longest = str2.toInt() + Math.pow(10, pow);
            }
            //longest = Math.floor(longest * 1.1);
            /*
            var vStep = longest / stepCount;
            var yStep = 100     / stepCount;*/

            /*var vStep = longest / stepCount;
            var digits = Math.floor(p.log10(longest));*/
            /*
            var style = this.computeStyle('axis');

            if (opt) {
                opt[0] && this._r.Line([[-1 ,0]  ,[101,0]]  ,  style); //top
                opt[1] && this._r.Line([[101,0]  ,[101,101]],  style); //right
                opt[2] && this._r.Line([[-1 ,101],[101,101]],  style); //bottom
                opt[3] && this._r.Line([[-1 ,0]  ,[-1  ,101]], style); //left
            }

            var textStyle = this.computeStyle('axis text');

            for (var i = 0; i <= stepCount ; i++) {
                this._r.Text(i * vStep, [-2, 100 - i * yStep], textStyle);
            }*/

            return longest;
        },

        render: function() {
            //this._r.render(this.width, this.height);
            return this;
        },

        size: function(width, height) {
            this._r.size(width, height);
            return this;
        }
    });

    p.chart.append('remove', function () {
        this._oldCache = {children:{}};
        this._cache = {children:{}};
    });

    p.chart.append('clear', function () {
        this._oldCache = {children:{}};
        this._cache = {children:{}};
    });


    var style;

    p.defaultStyle = style = {};

    p.chainStyle = function (style, subStyle) {
        if (!_.isFunction(subStyle)) {
            subStyle = p.style(subStyle);
        }

        return function () {
            var s = subStyle.apply(this, arguments);
            return (typeof s === 'undefined') ?
                style.apply(this, arguments) : s;
        }
    }

    p.style = function (obj) {
        return function (attr, set) {
            if (arguments.length === 2) {
                obj[attr] = set;
                return true;
            }
            return obj[attr];
        }
    }


    style['*'] = {
          'color': [ 0x5578B4
                   , 0xAB72A6
                   , 0xF3715B
                   , 0x00B039
                   , 0xF79750
                   , 0x66C190
                   , 0xA9CEEC
                   , 0xCACEC3
                   , 0xAAA7CA
                   , 0xDF8B96
                   , 0x68B3E2
                   , 0xFFDB4E
                   , 0x96D4C3
                   , 0xA7A9AC
                   , 0xBBBA59
                   , 0xE7A7CB
                   ]

        , 'stroke':     0xffffff
        , 'strokeColor':     0x000000
        , 'dash-array': 'none'

        , 'baseline':   'top'
        , 'text-align': 'center'

        , 'font-family': ''
        , 'font-size':   ''
        , 'font-weight': ''
    };

    style['axis'] = {
          color:        0xcccccc
        , strokeColor:  0xcccccc
        , 'line-width': 2
        , 'text-align': 'right'
        , pointerEvents:'none'
    };

    style['axis text'] = {
          color:        0xcccccc
        , 'font-size':   '14'
        , position: 'fixed-horizontal'
        , yrelative: 'bottom'
        , size: 'fixed'
        , pointerEvents:'none'
    };

    style['axis ytext'] = {
          color:        0xcccccc
        , 'font-size':   '14'
        , position: 'fixed-vertical'
        , size: 'fixed'
        , pointerEvents:'none'
        , baseline: 'middle'
    };

    style['title'] = {
          baseline:'top'
        ,'text-align':'center'
        , position:'fixed'
        , size: 'fixed'
        , color: 0xBBBA59
    };

    style['tooltip'] = {
          'text-align':'center'
        , baseline:'bottom'
        , pointerEvents:'none'
        , size:'fixed'
        , alpha: 0.7

        , color:    '0x313031'
        , strokeWidth: 2
        , strokeColor: '0xA5a8ab'
        , 'z-index':     1
    };

    style['tooltip text'] = {
          color: 0xF9F9F9
        , 'font-size':   '12'
        , alpha: 1
        , pointerEvents:'none'
    };

    style['sankey'] = {
          'baseline': 'middle'
        , 'stroke':   false
    }

    style['sankey text'] = {
          'baseline': 'middle'
        , size: 'fixed'
        , color: '0xffffff'
        , pointerEvents: 'none'
    }

    style['legend'] = {
          color: 0xcccccc
        , 'text-align': 'left'
        , 'baseline':'top'
    }

    function flush(cache) {
        for (key in cache) { if (cache.hasOwnProperty(key)) {
            object = cache[key];
            if (object.remove) {
                var callback;
                //if (self.doExit && (callback = self.doExit(object))) {
                //    self.animate(callback, 500);
                //} else {
                    object.remove();
                //}
            } else {
                flush(object);
            }
        }};
    }
})(pythia);
