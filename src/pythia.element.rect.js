pythia.element.element('rect', pythia.Class(pythia.elements.path, {
    repath: function () {
        (function (pos, dim, style) {
            this.reset()
                .style(style)
                .move([0     , 0     ])
                .line([dim[0], 0     ])
                .line([dim[0], dim[1]])
                .line([0     , dim[1]])
                .close()
                .translate(pos);
        }).apply(this, this._args);
    }
}));
