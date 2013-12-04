(function(p) {
    // Default Options
    //
    // Array of key/value pairs because it's better if options are evaluated in
    // this order.
    var defaultOptions = [
        [ 'container', 'auto' ]
      , [ 'renderer', 'auto' ]
      , [ 'size', [10,10] ]
    ];

    p.canvas = p.Class(pythia.element, {
        init: function (container, options) {
            options = options || {};
            options.container = container;

            this.options(defaultOptions, options);
        },

        renderer: function (r) {
            if (!r) {
                return this._r;
            }

            if (r === 'auto') {
                if (pythia.svgSupported()) {
                    r = 'raphael';
                } else if (pythia.canvasSupported()) {
                    r = 'canvas';
                } else if (pythia.vmlSupported()) {
                    r = 'vml';
                }
            }

            this._r = pythia.renderer[r](this._container, this);

            return this;
        },

        container: function (container) {
            if (!container) {
                return this._r._container;
            }

            if (container === 'auto') {
                container = document.body;
            } else if (typeof container === 'string') {
                container = document.getElementById(container);
            }

            this._container = container;
            //this._r.container(container);

            return this;
        },

        size: function() {
            if (arguments.length) {
                if (_.isArray(arguments[0])) {
                    this._r.size(arguments[0]);
                } else {
                    //TODO auto size by parent?
                    this._r.size([arguments[0], arguments[1]]);
                }
                this.dirtyScale = true;
                return this;
            }
            return this._r._size;
        }
    });
})(pythia);
