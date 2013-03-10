pythia.element.element('axis', pythia.Class(pythia.element, {
    repath: function () {
        (function (options) {
            var style = this.computeStyle('axis');
            var textStyle = this.computeStyle('axis text');
            var textYStyle = this.computeStyle('axis ytext');

            var position  = options.position   || 'bottom';
            var type      = options.type       || 'ordinal';
            var stepCount = options.stepCount  || 5;
            var format    = options.format     || function (d) { return d; };
            var longest   = options.longest    || 100;
            var shortest   = options.shortest  || 0;
            var labels    = options.labels     || [];

            switch (position) {
                case 'bottom':
                    this.line([[0,100], [100,100]], style);
                    break;
                case 'top':
                    this.line([[0,0], [100,0]], style);
                    break;
                case 'left':
                    this.line([[0,0], [0,100]], style);
                    break;
                case 'right':
                    this.line([[100,0], [100,100]], style);
                    break;
            }


            if (type === 'ordinal') {
                stepSize = 100 / (labels.length - 1);


                var position = 0;
                for (var i = 0; i < labels.length; ++i) {
                    el = labels[i];
                    //this.line([[position,100 - 2], [position,100 + 2]], style);
                    this.text(el, [position, 35], textStyle);
                    position += stepSize;
                }

                this.text(
                    options.label,
                    [50, 33],
                    pythia.style(options.labelStyle)
                );

            } else {
                //var longShort = pythia.axisScale(longest, shortest, stepCount);
                vStep = this._parent.step;

                var yStep = 100 / stepCount;

                for (var i = 0; i <= stepCount ; i++) {
                    var v = format(i * vStep + shortest);
                    var y = 100 - i * yStep;
                    this.text(v, [90, y],
                        pythia.chainStyle(textYStyle,{'text-align':'right'}));
                    if (v == 0) {
                        this.line([[0,y], [100,y]], style);
                    }
                }

                this.text(options.label, [19, 40], pythia.style(options.labelStyle))
                        .rotate(Math.PI / 2);
            }

            this._path = [];

        }).apply(this, this._args);
    }
}));

pythia.axisScale = function (longest, shortest, stepCount) {
    var digits = Math.floor(pythia.log10(longest));
    var str  = (Math.floor(longest).toString());
    var str2 = str.charAt(0) + str.charAt(1);

    for (var i = 2; i < str.length; ++i) {
        str2 += '0';
    }
    if (str2 != longest) {
        var pow = digits - 1 || 1;
        longest = str2.toInt() + Math.pow(10, pow);
    }

    longest = Math.floor(longest);
    var vStep;

    // TODO this is terrible. Solve the 0 problem gracefully
    // If we straddle the axis;
    if (longest > 0 && shortest < 0) {
        var ratio5 = (-1 * shortest) /
                     (longest - shortest) * stepCount;

        var rounded = Math.floor(ratio5);


        if (rounded !== 0) {
            vStep = (-1 * shortest / rounded);
            longest = vStep * stepCount + shortest;
        } else {
            vStep = (longest-shortest)/stepCount;
            vStep = vStep + (1/stepCount * (vStep + shortest));
            shortest = -vStep;
            longest = vStep * stepCount + shortest;
        }
    } else {
        if (shortest > 0) {
            shortest = 0;
            vStep = longest / stepCount;
        } else {
            vStep = (longest-shortest)/stepCount;
        }
    }

    return [longest, shortest, vStep];
}
