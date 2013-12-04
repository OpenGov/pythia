pythia.element.element('text', pythia.Class(pythia.element, {
    repath: function (position, data, style) {
        (function (text, pos, style) {
            this._path  = ['F', text];
            this._style = style;
            this.translate(pos);

        }).apply(this, this._args);
    }
}));
