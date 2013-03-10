pythia.element.element('port', pythia.Class(pythia.element, {
    init: function (pos, dim, style) {
        this._pos = pos;
        this._dim = dim;
        this.style(style);
    },

    repath: function () {
        var pos = this._pos;
        var dim = this._dim;
        this.scaleT = [ dim[0]/100, 0         , 0
                      , 0         , dim[1]/100, 0
                      , 0         , 0         , 1
                      ];
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
