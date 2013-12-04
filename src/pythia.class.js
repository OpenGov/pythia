(function(pythia) {
    "use strict";

    var append, prepend, extend, on, trigger;

    // Used to create objects
    function Pythia() {}

    // Create a basic object with prototype <proto>
    pythia.Object = function (proto) {
        Pythia.prototype = proto;
        return new Pythia();
    };

    // Create a basic object with prototype <proto> and *shallow* copies of
    // <properties>
    pythia.Style = function (proto, properties) {
        Pythia.prototype = proto;

        var o = new Pythia(),
            prop;

        for (prop in properties) { if (properties.hasOwnProperty(prop)) {
            o[prop] = properties[prop];
        }}

        return o;
    };

    // Return an object constructor function
    //
    // Class(<base>);
    // Constructed objects will have a prototype built from base
    //
    // Class(<base>, <additional properties>);
    // Constructed objects will have <additional properties>
    pythia.Class = function (base, properties) {
        base = base || {};

        base = base.__pythia || base; // If base is one of our classes its
                                      // prototype will be in __pythia
        var proto = pythia.Object(base);
        proto.__super = base;

        // The class constructor function
        var ctor = function () {
            var o = pythia.Object(proto);

            if (typeof proto.init === 'function') {
                proto.init.apply(o, arguments);
            }

            return o;
        };

        ctor.__pythia = proto;

        // Functions to add or replace properties in our class
        ctor.extend  = extend;
        ctor.append  = append;
        ctor.prepend = prepend;

        // Event handling functions
        proto.on      = proto.on || on;
        proto.removeAllListeners = proto.removeAllListeners || removeAllListeners;
        proto.trigger = proto.trigger || trigger;

        // Fill properties into our prototype
        if (properties) {
            ctor.extend(properties);
        }

        return ctor;
    };

    pythia.inherits = function (constructor, superConstructor) {
        constructor.__super = superConstructor;
        constructor.prototype = pythia.Object(superConstructor.prototype);
    };

    on = function (eventName, callback) {
        var events, callbackList;

        events = this._events  = this._events  || {};
        this._eventId = this._eventId || 0;
        this._eventId++;

        callbackList = events[eventName] = events[eventName] || [];
        callbackList.push([callback, this._eventId]);

        return this._eventId;
    };

    trigger = function (eventName) {
        var callbackList, args = [], i, len;

        for (i = 1, len = arguments.length; i < len; ++i) {
            args[i - 1] = arguments[i];
        }

        callbackList = this._events && this._events[eventName];

        if (callbackList) {
            for (i = 0, len = callbackList.length; i < len; ++i) {
                callbackList[i][0].apply(this, args);
            }
        }

        return;
    };

    function EventEmitter() {
    }
    pythia.EventEmitter = EventEmitter;

    EventEmitter.prototype.on                 = on;
    EventEmitter.prototype.emit               = trigger;
    EventEmitter.prototype.removeAllListeners = removeAllListeners;

    function removeAllListeners(eventName) {
      delete this._events[eventName];
    };

    extend = function (name, value) {
        if (_.isString(name)) {

            if (name === 'init') {
                this.append('init', value);
            } else {
                this.__pythia[name] = value;
            }

            return;
        }

        _.each(name, function (value, name) {
            if (name === 'init') {
                this.append('init', value);
            } else {
                this.__pythia[name] = value;
            }
        }, this);

        return this;
    };

    append = function (method, fn) {
        if (_.isString(method)) {
            chain(this.__pythia, method, fn, 'append');
            return this;
        }

        _.each(method, function (fn, method) {
            chain(this.__pythia, method, fn, 'append');
        }, this);

        return this;
    };

    prepend = function (method, fn) {
        if (_.isString(method)) {
            chain(this.__pythia, method, fn, 'prepend');
            return this;
        }

        _.each(method, function (fn, method) {
            chain(this.__pythia, method, fn, 'prepend');
        }, this);

        return this;
    };

    function chain(prototype, method, func, placement) {
        placement = placement || 'append';

        var existingMethod = prototype[method],
            pchain;

        if (_.isFunction(existingMethod)) {
            if (prototype.hasOwnProperty(method)) {
                pchain = existingMethod.pythiaChain;
            }

            if (!pchain) {
                pchain = [existingMethod];

                prototype[method] = function () {
                    var ret, i, len;

                    for (i = 0, len = pchain.length; i < len; ++i) {
                        ret = pchain[i].apply(this, arguments);
                    }
                    return ret;
                };
                prototype[method].pythiaChain = pchain;
            }

            if (placement === 'append') {
                pchain.push(func);
            } else if (placement === 'prepend') {
                pchain.unshift(func);
            } else {
                throw "Error Unknown method placement " + placement;
            }


        } else {
            prototype[method] = func;
        }
    }

})(pythia);
