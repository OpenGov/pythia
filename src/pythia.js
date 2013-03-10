(function(window) {

    // The global pythia function and object. Entry point to all things pythia.
    // Returns a canvas to render stuff onto
    var p = window.pythia = function (d, options) {
        if (_.isElement(d)) {
            return p.canvas(d, options);
        } else if (d) {
            return p.set(d, options);
        } else {
            return p.canvas(undefined, options);
        }
    }

    //Wrapper for console.log that won't throw errors in browsers.
    p.log = function() {
        if (typeof window.console === 'object') {
            window.console.log.apply(window.console, arguments);
        }
    }

    p.logOne = function(obj) {
        var parts = [];
        _.each(obj, function (c) {
            parts.push(c);
        });
        p.log.apply(this, parts);
    }

    //Don't do anything
    p.doNil = function () {}

    //The identity function
    p.id    = function (p) { return p; }

    //Build accessor functions to pull attributes out of data
    p.accessor = function(a, deflt) {
        //Use the default if a is undefined
        if (typeof(a) === 'undefined')
            a = deflt;

        //It's already a function
        if (typeof(a) === 'function')
            return a;

        //Accessor that cycles through elements of an array
        if (a instanceof Array) {
            var len = a.length;
            return function (d,i) { return a[i % len]; };
        }

        return function () { return a; };
    }

    p.mCopy = function(m) {
        return [m[0], m[1], m[2]
              , m[3], m[4], m[5]
              , m[6], m[7], m[8]
              ];
    }

    p.randomColor = function() {
        return Math.random() * 0xffffff;
    }

    function zipSumNan(e) {
        return (e[0] || 0) + (e[1] || 0)
    }

    p.max = function(data, dataValue, dataLine, multiline, stacked) {

        var highest = 0;

        if (multiline && stacked) {
            //Sum elements element-wise by line
            var sums;
            _.each(data, function(d, i) {
                var values = _.map(dataLine(d), dataValue);
                if (!sums) {
                    sums = values;
                } else {
                    //sums = _.map(_.zip(sums, values), function (e) { return (e[0] || 0) + (e[1] || 0) });
                    for (var i = 0; i < sums.length || i < values.length; ++i) {
                        sums[i] = (sums[i] || 0) + (values[i] || 0)
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
    }

    p.min = function(data, dataValue, dataLine, multiline, stacked) {

        var highest = 0;

        if (multiline && stacked) {
            //Sum elements element-wise by line
            var sums;
            _.each(data, function(d, i) {
                var values = _.map(dataLine(d), dataValue); 
                if (!sums) {
                    sums = values;
                } else {
                    for (var i = 0; i < sums.length || i < values.length; ++i) {
                        sums[i] = (sums[i] || 0) + (values[i] || 0)
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
    }

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
    }

    var getProperty = Object.defineProperty
                      ? function (obj, prop) { return obj.prop; }
                      : function (obj, prop) {
                            for (var i = 0, len = propertyTable.length; i < len; ++i) {
                                if (propertyTable[i] === obj) {
                                    return propertyTable[i][1][prop];
                                }
                            }
                      }
    /*
    p.data = function (data) {
        var readers = {};
        defineProperty(data, '_pythia', {enumerable: false, value: {
              readers: readers

            , sourceRefresh = p.doNil

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
                  p.data(newData);
                  newData._pythia.sourceRefresh = function () {
                      _.filter(data, by);
                  }
              }
        }});

        return data;
    }*/

    p.set = function (data, refresh) {

        refresh = refresh || function () {
            return data;
        }

        function a(key) {
            return data[key];
        }

        a._data    = data;
        a._readers = {};
        a.__pythia = true;

        a.register = function (obj) {
            a._readers[obj.id] = obj;
        }

        a.refresh = function () {
            data = refresh();
            _.each(_readers, function(r) {
                r.refresh();
            });
        }


        a.set = function (method, func) {
            var refresh;
            if (_.isString(method)) {
                refresh = function () {
                    return a[method](func);
                }
            }
            if (_.isFunction(method)) {
                var refresh = function () {
                    return method(data);
                }
            }
            return p.set(refresh(), refresh);
        }

        a.each = function (func, context) {
            return _.each(a._data, func, context)
        }

        a.map = function (func, context) {
            return _.map(a._data, func, context)
        }

        a.filter = function (func, context) {
            var results = {}
            _.each(data, function(value, key) {
              if (func.call(context, value, key))
                results[key] = value;
            });
            return results;
        }

        return a;
    }


    p.refresh = function(data) {
        getProperty(data, '_pythia').refresh();
    }

    p.svgSupported = function () {
        return document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Shape", "1.1")
    }

    p.webGLSupported = function () {
        if (typeof p.webGLSupported.yes === "undefined") {
            try {
                var canvas = document.createElement('canvas');
                p.webGLSupported.yes = !!(window.WebGLRenderingContext
                          && (canvas.getContext('webgl')
                              || canvas.getContext('experimental-webgl')));
            } catch(e) {
                p.webGLSupported.yes = false;
            }
        }
        return p.webGLSupported.yes;
    }

    p.canvasSupported = function () {
        return !! window.CanvasRenderingContext2D;
    }

    p.vmlSupported = function () {
        if (typeof p.vmlSupported.yes === "undefined") {
            var a = document.body.appendChild(document.createElement('div'));
            a.innerHTML = '<v:shape id="vml_flag1" adj="1" />';
            var b = a.firstChild;
            b.style.behavior = "url(#default#VML)";
            p.vmlSupported.yes = b ? typeof b.adj === "object": true;
            a.parentNode.removeChild(a);
        }
        return p.vmlSupported.yes;
    }

    p.ticks = Date.now || function () {
        return new Date().valueOf();
    }

    p.reqFrame =
        window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function (callback) {
            return window.setTimeout(callback, 62);
        };

    p.cancelFrame =
        window.cancelAnimationFrame       ||
        window.webkitCancelAnimationFrame ||
        window.mozCancelAnimationFrame    ||
        window.oCancelAnimationFrame      ||
        window.msCancelAnimationFrame     ||
        function(id) {
            window.clearTimeout(id);
        };

    var cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;



    p.log10 = function (v) {
        return Math.log(v)/Math.log(10);
    }

    p.addCommas = function (nStr) {
        nStr += '';
        var x = nStr.split('.');
        var x1 = x[0];
        var x2 = x.length > 1 ? '.' + (x[1].length == 1 ? x[1] + '0' : x[1]) : '';
        var rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) {
            x1 = x1.replace(rgx, '$1' + ',' + '$2');
        }
        return x1 + x2;
    }

    p.elements = {};
})(this);
