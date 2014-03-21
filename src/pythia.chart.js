(function(p) {
    var chartID = 0;

    p.chart = p.Class(p.element, {
        init: function(options) {
            options = options || {};

            this.options(this.defaultOptions, options);

            this._opts.style = options.style || p.defaultStyle;

            this.dataLine    = p.accessor(options.dataLine,   function (d) { return d; });
            this.dataValue   = p.accessor(options.dataValue,  function (d) { return d; });
            this.dataValueId = p.accessor(options.dataValue,  function (d, k) { return k; });
            this.dataLineId  = p.accessor(options.dataLineId, function (d, k) { return k; });
            this.label       = p.accessor(options.label,      function (d) { return d; });
            this.color       = p.accessor(options.color,      this._style.color);
            this.lineColor   = p.accessor(options.lineColor,  this._style.color);

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

            this.refresh();

            return this;
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
            var cache;

            if (el) {
                cache = this.traceCache(id, this._cache);
                cache[cacheName] = el;

                return this;

            } else {
                cache = this.traceCache(id, this._oldCache, 'skip');

                if (!cache) {
                    return;
                }

                el = cache[cacheName];
                delete cache[cacheName];

                return el;
            }
        },

        roundLongest: function(longest) {
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

            return longest;
        },

        render: function() {
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
                   ],

        //'stroke':      0xffffff,
        stroke:        false,
        strokeColor:   0x000000,
        'dash-array':  'none',

        baseline:      'top',
        textAlign:     'center',

        'font-family': '',
        fontSize:      '',
        'font-weight': ''
    };

    style.axis = {
        color:        0xcccccc,
        strokeColor:  0xcccccc,
        strokeWidth: 2,
        textAlign: 'right',
        stroke: false,
        pointerEvents:'none'
    };

    style['axis text'] = {
        color:         0xcccccc,
        fontSize:      '14',
        position:      'fixed-horizontal',
        fontFamily:    'Helvetica',
        yrelative:     'bottom',
        size:          'fixed',
        stroke:        false,
        pointerEvents: 'none',
        baseline:      'bottom'
    };

    style['axis ytext'] = {
        color:         0xcccccc,
        fontSize:      '14',
        position:      'fixed-vertical',
        fontFamily:    'Helvetica',
        size:          'fixed',
        stroke:        false,
        pointerEvents: 'none',
        baseline:      'middle'
    };

    style.title = {
        baseline:'top',
        textAlign:'center',
        position:'fixed',
        size: 'fixed',
        color: 0xBBBA59,
        stroke: false
    };

    style.tooltip = {
        textAlign: 'center',
        baseline: 'bottom',
        pointerEvents:'none',
        size:'fixed',
        opacity: 0.7,

        color:       '0x313031',
        strokeWidth: 1,
        strokeColor: '0xA5a8ab',
        zIndex:      1
    };

    style['tooltip text'] = {
        color:         0xF9F9F9,
        fontFamily:    'proxima-nova',
        fontSize:      '12',
        opacity:       1,
        pointerEvents: 'none',
        baseline:      'top',
        stroke:        false,
        zIndex:        2
    };

    function flush(cache) {
        var key;

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
        }}
    }

})(pythia);
