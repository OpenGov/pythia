(function(window, pythia, r, _, clearTimeout, setInterval, setTimeout) {
    "use strict";

    r.init = function (container, element) {
        this._classes    = {};
        this._lastUpdate = 0;
        this._root       = element;

        this._paused     = 0; // The time when we paused
        this._timePaused = 0; // The cumulative amount of time we spent paused

        this.transform = [ 1, 0, 0,
                           0, 1, 0,
                           0, 0, 1
                         ];
        processAnimationsReal._r = this;
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
            if (render !== false)
                this.render();
        } else if (!this.timer) {
            self.timer = setTimeout(function () {
              self.timer = false;
              self.updateTransform();
            }, 15 - step);
        }
    };

    r.refresh = function () {
        refresh(this._root._children);

        function refresh(elements) {
            _.each(elements, function (e) {
                e.refresh();
                refresh(e._children);
            });
        }
    };

    pythia.renderer = pythia.Class(r);

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

    r.processAnimations = function () {
        this.frame = pythia.reqFrame.call(window, processAnimationsReal);
    };

    var last = 0;
    var processAnimationsReal = function () {
        var self      = processAnimationsReal._r,
            now       = pythia.ticks() - self._timePaused,
            timeScale;

        _.each(animations, function (a, id) {
            if (a.start === -1) {
                a.start = now;
                return;
            }

            if (pythia.disableAnimations) {
                timeScale = 1;
            } else {
                timeScale = Math.min((now - a.start) / a.duration,1);
            }

            a.callback.call(a.ctx, timeScale);

            // TODO nested chains
            if (timeScale === 1) {
                delete animations[id];
                if (a.next.length !== 0) {
                    var next = a.next.shift();
                    animations[next.id] = next;
                }
            }
        });
        last = now;
        self.frame = 0;

        self.checkAnim();
    };

    r.killAnimation = function (id) {
        delete animations[id];
    };

    r.checkAnim = function () {
        if (this._paused || _.isEmpty(animations)) {
            if (this._interval) {
                clearTimeout(this._interval);
                this._interval = false;
            }
        } else {
            if (!this._interval) {
                var self = this;
                this._interval = setInterval(function () { self.processAnimations(); }, 17);
            }
        }
    };

    r.Window = pythia.Class({
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

    pythia.mMulM = function () {
        var m2 = arguments[arguments.length - 1],
            m1;

        for (var i = arguments.length - 2; i >= 0; --i) {
            m1 = arguments[i];
            m2 =  [ m1[0] * m2[0] + m1[1] * m2[3] + m1[2] * m2[6],
                    m1[0] * m2[1] + m1[1] * m2[4] + m1[2] * m2[7],
                    m1[0] * m2[2] + m1[1] * m2[5] + m1[2] * m2[8],

                    m1[3] * m2[0] + m1[4] * m2[3] + m1[5] * m2[6],
                    m1[3] * m2[1] + m1[4] * m2[4] + m1[5] * m2[7],
                    m1[3] * m2[2] + m1[4] * m2[5] + m1[5] * m2[8],

                    m1[6] * m2[0] + m1[7] * m2[3] + m1[8] * m2[6],
                    m1[6] * m2[1] + m1[7] * m2[4] + m1[8] * m2[7],
                    m1[6] * m2[2] + m1[7] * m2[5] + m1[8] * m2[8]
                  ];
        }

        return m2;
    };

    pythia.sMulM = function (s, m) {
        return [ s * m[0], s * m[1], s * m[2],
                 s * m[3], s * m[4], s * m[5],
                 s * m[6], s * m[7], s * m[8]
               ];
    };

    pythia.mMulV = function (m, v) {
        return [ m[0] * v[0] + m[1] * v[1] + m[2],
                 m[3] * v[0] + m[4] * v[1] + m[5]
               ];
    };
})(window, pythia, {}, _, clearTimeout, setInterval, setTimeout);
