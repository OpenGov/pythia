(function(P) {
    "use strict";

    //used to create objects
    function pythiaObject() {}

    //Create a basic object with prototype P
    P.Object = function (P) {
        pythiaObject.prototype = P;
        return new pythiaObject();
    }

    //Return an object constructor function
    //
    //object(<base>);
    //Constructed objects will have a prototype built from base
    //
    //object(<object constructor>, <additional properties>);
    //Prototype will be extended with <additional properties>
    P.Class = function (base, properties) {
        base = base || {};

        base = base.__pythia || base; //If base is one of our classes its
                                      //prototype will be in __pythia
        var proto = P.Object(base);
        proto.__super = base;

        //The class constructor function
        var ctor = function () {
            var o = P.Object(proto);

            if (typeof proto.init === 'function')
                proto.init.apply(o, arguments);

            return o;
        }

        ctor.__pythia = proto;

        //Function to add or replace properties in our class
        ctor.extend  = extend;
        ctor.append  = append;
        ctor.prepend = prepend;

        //Fill properties into our prototype
        if (properties) {
            ctor.extend(properties);
        }

        return ctor;
    }

    function extend(name, value) {
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
    }

    function append(method, fn) {
        if (_.isString(method)) {
            chain(this.__pythia, method, fn, 'append');
            return this;
        }

        _.each(method, function (fn, method) {
            chain(this.__pythia, method, fn, 'append');
        }, this);

        return this;
    }

    function prepend(method, fn) {
        if (_.isString(method)) {
            chain(this.__pythia, method, fn, 'prepend');
            return this;
        }

        _.each(method, function (fn, method) {
            chain(this.__pythia, method, fn, 'prepend');
        }, this);

        return this;
    }

    function chain(prototype, method, func, placement) {
        placement = placement || 'append';

        var existingMethod = prototype[method];

        if (_.isFunction(existingMethod)) {
            var chain = existingMethod.pythiaChain;

            if (!chain) {
                chain = [existingMethod];

                prototype[method] = function () {
                    var ret = _.invoke(chain, Function.apply, this, arguments);
                    return ret.slice(-1);
                }
                prototype[method].pythiaChain = chain;
            }

            if (placement === 'append') {
                chain.push(func);
            } else if (placement === 'prepend') {
                chain.unshift(func);
            } else {
                throw "Error Unknown method placement " + placement;
            }


        } else {
            prototype[method] = func;
        }
    }

})(pythia);
