(function(window, pythia, doc, r, _, clearTimeout, setInterval, setTimeout) {
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
        processAnimations._r = this;

        pythia.span = doc.createElement('span');
        pythia.span.style.cssText = "position:absolute;left:-9999em;top:-9999em;padding:0;margin:0;line-height:1;";
        doc.body.appendChild(pythia.span);
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

    var last = 0;
    var processAnimations = function () {
        var self           = processAnimations._r,
            frameStartTime = pythia.ticks() - self._timePaused,
            timeScale;

        _.each(animations, function (a, id) {
            if (a.start === -1) {
                a.start = frameStartTime;
                return;
            }

            while (a) {
                if (pythia.disableAnimations) {
                    timeScale = 1;
                } else {
                    timeScale = Math.min((frameStartTime - a.start) / a.duration,1);
                }

                try {
                    a.callback.call(a.ctx, timeScale);
                } catch (e) {
                    // TODO throw sentry error here
                    // failed to animate
                    delete animations[id];
                    throw e;
                }

                // TODO nested chains
                if (timeScale === 1) {
                    delete animations[id];
                    if (a.next.length !== 0) {
                        var next = a.next.shift();
                        next.start = a.start + a.duration;
                        animations[next.id] = next;
                        a = next;
                    } else {
                      a = false;
                    }
                } else {
                    a = false;
                }
            }
        });
        last = frameStartTime;
        self._frame = 0;

        self.checkAnim();
    };

    r.killAnimation = function (id) {
        delete animations[id];
    };

    r.checkAnim = function () {
        if (this._paused || _.isEmpty(animations)) {
            if (this._animating) {
                this._animating = false;
                this._animationDuration = pythia.ticks() - this._animationStart;
                this.trigger('animation_complete', this._animationDuration, this._frameCount);
            }
            if (this._interval) {
                clearTimeout(this._interval);
                this._interval = false;
            }
        } else {
            if (!this._frame) {
                if (!this._animating) {
                    this._animating = true;
                    this._animationStart = pythia.ticks();
                    this._frameCount = 0;
                }
                this._frameCount++;
                this._frame = pythia.requestFrame.call(window, processAnimations);
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

    pythia.mMulM = function (m1, m2) {
        return [m1[0] * m2[0] + m1[1] * m2[3] + m1[2] * m2[6],
                m1[0] * m2[1] + m1[1] * m2[4] + m1[2] * m2[7],
                m1[0] * m2[2] + m1[1] * m2[5] + m1[2] * m2[8],

                m1[3] * m2[0] + m1[4] * m2[3] + m1[5] * m2[6],
                m1[3] * m2[1] + m1[4] * m2[4] + m1[5] * m2[7],
                m1[3] * m2[2] + m1[4] * m2[5] + m1[5] * m2[8],

                m1[6] * m2[0] + m1[7] * m2[3] + m1[8] * m2[6],
                m1[6] * m2[1] + m1[7] * m2[4] + m1[8] * m2[7],
                m1[6] * m2[2] + m1[7] * m2[5] + m1[8] * m2[8]];
    };

    pythia.sMulM = function (s, m) {
        return [s * m[0], s * m[1], s * m[2],
                s * m[3], s * m[4], s * m[5],
                s * m[6], s * m[7], s * m[8]];
    };

    pythia.mMulV = function (m, v) {
        return [ m[0] * v[0] + m[1] * v[1] + m[2],
                 m[3] * v[0] + m[4] * v[1] + m[5]
               ];
    };

    pythia.measureText = function (text, textStyle) {
        var span  = pythia.span,
            style = span.style,
            bounds;

        if (textStyle.fontSize) {
            style.fontSize = textStyle.fontSize;
        }
        doc.body.appendChild(span);
        span.innerHTML = text.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2');
        bounds = span.getBoundingClientRect();

        return [
            bounds.right - bounds.left,
            bounds.bottom - bounds.top
        ];
    };
})(window, pythia, document, {}, _, clearTimeout, setInterval, setTimeout);
