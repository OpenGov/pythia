pythia.element.element('port', pythia.Class(pythia.element, {
    init: function (pos, dim, style) {
        this._pos   = pos;
        this._dim   = dim;
        this._style = style;
    },

    repath: function () {
        var pos = this._pos;
        var dim = this._dim;
        this.translateT = [ 0, 0, pos[0]
                          , 0, 0, pos[1]
                          , 0, 0, 1
                          ];
        return this;
    },

    resize: function (pos, dim) {
        this._pos = pos;
        this._dim = dim;
    }
}));
