pythia.element.element('circleSlice', pythia.Class(pythia.elements.path, {
    init: function (pos, radius, startAngle, angle, style) {
        this._pos = pos;
        this._radius = radius;
        this._startAngle = startAngle;
        this._angle = angle;
        this._style = style;
    },

    repath: function () {
        (function () {
            //this._pos = pos;

            //var tt = p.mMulM(this.transform, p.mMulM(r.transform, this.win.transform));
            //var tt = this.totalTransform();

            //var xScale   = Math.sqrt(tt[0] * tt[0] + tt[1] * tt[1]);
            //var yScale   = Math.sqrt(tt[3] * tt[3] + tt[4] * tt[4]);
            //var scale = Math.min(xScale, yScale);

            //this.radius = radius = radius * scale;
            this.radius = this._radius;

            var start = [ this._radius * Math.cos(this._startAngle)
                        , this._radius * Math.sin(this._startAngle)];

            this.resetT();
            this.reset()
                .move([0, 0])
                .line(start)
                .arc([0,0], this._radius, this._startAngle, this._angle)
                .close()
                .translate(this._pos)

        }).apply(this, this._args);
        return this;
    },

    origin: function () {
        return this._pos;
    },

    center: function () {
        return (function () {

            if ((1.99 * Math.PI) < this._angle) {
                return this._pos;
            }
            var centerAngle  = this._startAngle + this._angle / 2;
            var centerRadius = this._radius / 2;

            var scale = [ centerRadius * Math.cos(centerAngle)
                        , centerRadius * Math.sin(centerAngle)];
            scale[this._proportionalDim] *= this._proportianalScale;

            var centerPoint = [ scale[0] + this._pos[0]
                              , scale[1] + this._pos[1]];

            return centerPoint;
        }).apply(this, this._args);
    }
}));
