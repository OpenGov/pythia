pythia.color = pythia.Class({
    hex: function(hex) {
        if (typeof hex === 'undefined')
            return ~~ (this.r * 255) << 16 ^ ~~ (this.g * 255) << 8 ^ ~~ (this.b * 255);

        this.r = (hex >> 16 & 255) / 255;
        this.g = (hex >> 8 & 255)  / 255;
        this.b = (hex & 255)       / 255;

        return this;
    },

    multiply: function(color) {
        return pythia.color(this.r * color.r, this.g * color.g, this.b * color.b);
    },

    //TODO this should also function as a setter
    html: function() {
        var hex = this.hex().toString(16);
        var i;

        for (var i = hex.length; i < 6; ++i) {
            hex = '0' + hex;
        }
        return '#' + hex;
    },

    //one hex parameter or three floating point rgb values
    init: function() {
        if (arguments.length === 1) {
            this.hex(arguments[0]);
        }

        if (arguments.length === 3) {
            this.r = arguments[0];
            this.g = arguments[1];
            this.b = arguments[2];
        }

        return this;
    }
});
