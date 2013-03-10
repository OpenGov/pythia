pythia.element.element('line', pythia.Class(pythia.elements.path, {
    init: function (vertices, style) {
        this._vertices = vertices;
        this._styl = style;
    },

    repath: function () {
        (function () {
            this.reset()
                .style(pythia.chainStyle(this._styl, {fill:false}))
                .move(this._vertices[0])

            _.each(this._vertices, this.line, this);

        }).apply(this, this._args);
    }
}));
