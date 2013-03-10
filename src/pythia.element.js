(function(p) {
    var elements = {};

    p.element = p.Class({
        init: function () {
            this._w       = 0;
            this._h       = 0;
            this._postion = [0,0];

            this._events = {};
            this._children = {};
            this._opts = {};

            this._class = {};

            this._args = arguments;

            // TODO: generic attribute stacks
            this.transformStack = [];
            this.scaleStack     = [];

            this._animations    = {};

            this.dirtyScale = true;

            this.resetT();
        },

        options: function (defaults, opts) {
            for (var key in defaults) {
                dflt = defaults[key];
                var opt = dflt[0]
                  , val
                  ;

                if (typeof opts[opt] === 'undefined') {
                    val = dflt[1];
                } else {
                    val = opts[opt];
                }

                if (this[opt]) {
                    this[opt].call(this, val);
                }
                this._opts[opt] = val;
            }

            for (var opt in opts) {
                var val = opts[opt];
                if (!this._opts[opt]) {
                    this._opts[opt] = val;
                }
            }
        },

        resetT: function () {
            this.scaleT = [ 1, 0, 0
                          , 0, 1, 0
                          , 0, 0, 1
                          ];
            this.translateT = [ 1, 0, 0
                              , 0, 1, 0
                              , 0, 0, 1
                              ];
            this.rotateT = [ 1, 0, 0
                           , 0, 1, 0
                           , 0, 0, 1
                           ];
            return this;
        },

        pushScale: function () {
            this.scaleStack.push(p.mCopy(this.scaleT));
        },

        popScale: function () {
            if ( (scaleT = this.scaleStack.pop()) ) {
                this.dirtyScale = true;
                this.scaleT = scaleT;
                this.updateTransform();
            }
        },

        pushT: function () {
            this.transformStack.push([p.mCopy(this.translateT), p.mCopy(this.scaleT)]);
        },

        popT: function () {
            // TODO fix
            if ( (transforms = this.transformStack.pop()) ) {
                this.translateT = transforms[0];
                this.scaleT = transforms[1];

                this.dirtyScale = true;
                this.updateTransform();
            }
        },

        scale: function (s, relative) {
            relative = relative || 'center';

            var point  = [0,0];
            var center = this.center();
            var dim    = this.bounds();

            switch (relative) {
                case 'bottom':
                    point[0] = (dim.max[0] - dim.min[0]) / 2;
                    point[1] = (dim.max[1] - dim.min[1]);
                    break;
                case 'top':
                    point[0] = center[0];
                    point[1] = dim.min[1];
                    break;
                case 'center':
                    point[0] = center[0];
                    point[1] = center[1];
                    break;
                default:
                    if (_.isArray(rel)) {
                        point[0] = rel[0];
                        point[1] = rel[1];
                    }
            }

            var yScale, xScale;

            if (_.isArray(s)) {
                xScale = s[0];
                yScale = s[1];
            } else {
                yScale = xScale = s;
            }

            this.scaleT[0] *= xScale;
            this.scaleT[1] *= xScale;
            this.scaleT[3] *= yScale;
            this.scaleT[4] *= yScale;
            //this.scaleT[6] *= Math.sqrt(xScale * xScale + yScale * yScale);

            this.scaleT[2] -= point[0] * (xScale - 1);
            this.scaleT[5] -= point[1] * (yScale - 1);

            this.dirtyScale = true;
            this.updateTransform();
        },

        rotate: function (r) {
            this.rotateT[0] =  Math.cos(r);
            this.rotateT[1] = -Math.sin(r);
            this.rotateT[3] =  Math.sin(r);
            this.rotateT[4] =  Math.cos(r);

            this.dirtyScale = true;
            return this;
        },

        parent: function(p) {
            if (!p) {
                return this._parent;
            }

            if (this._parent) {
                delete this._parent._children[this._id];
            }

            p._children[this._id] = this;
            this._parent = p;

            return this;
        },

        end: function () {
            return this._parent;
        },

        append: function(c) {
            c.parent(this);

            return this;
        },

        data: function(data, line, dataKey, lineKey) {
            this._data        = data;
            this._line        = line;
            this._dataKey     = dataKey;
            this._dataLineKey = lineKey;

            this.addClass('data');
            this.addClass('key' + dataKey);
            this.addClass('lineKey' + lineKey);

            return this;
        },

        refresh: function() {
            this.repath && this.repath();
            return this;
        },

        select: function (q, possible, results) {
            if (!_.isArray(q)) {
                q = q.split('.');
            }

            var elements = this._r._classes[q[0]];

            var i;
            var len = q.length;
            for (i = 1; i < len; ++i) {
                elements = _.filter( elements, function (el) { return el.hasClass(q[i]); } );
            }

            elements =
                _.filter(elements, function (e) {
                    while (e = e._parent) {
                        if (e === this) {
                            return true;
                        }
                    }
                    return false;
                }, this);

            return elements;
        },

        style: function(style, set) {
            if (!arguments.length) {
                return this._style;
            }

            if (arguments.length === 2) {
                this._style(style, set);
                this.refresh();
                this.updateTransform();
                return this;
            }

            this._style = arguments[0];

            return this;
        },

        animate: function (callback, duration) {
            var anim = this._r.animate(this, callback, duration);
            this._animations[anim.id] = anim;
            return anim;
        },

        killAllAnimations: function () {
            _.each(this._animations, function (anim) {
                this._r.killAnimation(anim.id);
                delete this._animations[anim.id];
            }, this);
        },

        remove: function() {
            if (this._parent) {
                delete this._parent._children[this._id];
            }

            _.each(this._children, function (child) {
                child.remove();
            });
            _.each(this._class, function (v,k) { this.removeClass(k);  } , this);
            this._r.remove(this);


            return this;
        },

        clear: function () {
            _.each(this._children, function (el) {el.remove(); } );
        },

        translate: function (t) {
            this.translateT[2] += t[0];
            this.translateT[5] += t[1];
            this.dirtyScale = true;

            return this;
        },

        size: function (dim) {
            this._w = dim[0];
            this._h = dim[1];
            this.dirtyScale = true;

            return this;
        },

        on: function (select, event, callback) {
            if (arguments.length === 2) {
                callback = event;
                event    = select;
                select   = 'this';
            }

            if (!this._events[event]) {
                this._events[event] = {};
            }
            if (!this._events[event][select]) {
                this._events[event][select] = {};
            }

            this._events[event][select] = callback;
            return this;
        },

        hide: function () {
            this.hidden = true;
            return this;
        },

        show: function () {
            this.hidden = false;
            return this;
        },

        addClass: function (cls) {
            if (!this._r._classes[cls]) {
                this._r._classes[cls] = {};
            }
            this._r._classes[cls][this._id] = this;

            this._class[cls] = true;
            return this;
        },

        hasClass: function (cls) {
            return this._class[cls];
        },

        removeClass: function (cls) {
            delete this._r._classes[cls][this._id];
            delete this._class[cls];
            return this;
        },

        invoke: function (evt) {
            if (evt === 'legendOver' && this._legendOver) {
                return;
            }
            if (evt === 'legendOut' && !this._legendOver) {
                return;
            }
            if (evt === 'legendOver') {
                this._legendOver = true;
            }
            if (evt === 'legendOut') {
                this._legendOver = false;
            }
            this.processEvent(evt).call(this);
        },

        processEvent: function (type) {
            return function () {
                var events = this._events[type];
                if (events && events['this']) {
                    events['this'].call(this);
                }

                var el = this;

                while (el._parent) {
                    events = el._parent._events[type];
                    if (events) {
                        _.each(this._class, function (_, cls) {
                            if (events[cls])
                                events[cls].call(this);
                        }, this);
                    }
                    el = el._parent;
                }
                return false;
            }
        },

        computeStyle: function (elm) {
            var style = this._opts.style || [];
            var dflt = p.defaultStyle;
            return function(attr, set) {
                if (arguments.length === 2) {
                    style[elm][attr] = set;
                    return true;
                }
                if (style[elm] && attr in style[elm]) {
                    return style[elm][attr];
                }
                if (style['*'] && attr in style['*']) {
                    return style['*'][attr];
                }
                if (dflt[elm] && attr in dflt[elm]) {
                    return dflt[elm][attr];
                }
                if (dflt['*'] && attr in dflt['*']) {
                    return dflt['*'][attr];
                }
            }
        }

    });

    var elementID = 0;

    p.element.element = function(name, cls) {
        pythia.elements[name] = cls;

        p.element.extend(name, function () {
            var o = p.Object(cls.__pythia);
            o._id = elementID++;
            o.parent(this);
            o._r = this._r;
            o.init.apply(o, arguments);
            o.addClass(name);
            o.refresh();
            return o;
        });

        return cls;
    }
})(pythia);
