pythia.element.element('axis', pythia.Class(pythia.element, {
    repath: function () {
        (function (options) {
            var style      = pythia.defaultStyle.axis,
                textStyle  = pythia.defaultStyle['axis text'],
                textYStyle = pythia.defaultStyle['axis ytext'];

            var position  = options.position   || 'bottom',
                type      = options.type       || 'ordinal',
                stepCount = options.stepCount  || 5,
                format    = options.format     || function (d) { return d; },
                longest   = options.longest    || 100,
                shortest  = options.shortest   || 0,
                labels    = options.labels     || [],
                i;

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

                if (labels.length === 1) {
                    position = 50;
                } else {
                    position = 0;
                }

                var labelHeight = pythia.measureText(options.label, options.labelStyle)[1];

                for (i = 0; i < labels.length; ++i) {
                    var text = labels[i];

                    this.text(text, [position, 55], textStyle);
                    position += stepSize;
                }

                this.text(
                    options.label,
                    [50, labelHeight + 2],
                    pythia.Style(options.labelStyle)
                );

            } else {
                //var longShort = pythia.axisScale(longest, shortest, stepCount);
                vStep = this._parent.step;

                var yStep = 100 / stepCount;

                for (i = 0; i <= stepCount ; i++) {
                    var v = format(i * vStep + shortest);
                    var y = 100 - i * yStep;
                    this.text(v, [90, y],
                        pythia.Style(textYStyle, {textAlign:'right'}));
                    if (v === 0) {
                        this.line([[0,y], [100,y]], style);
                    }
                }

                this.text(options.label, [19, 40], pythia.Style(options.labelStyle))
                        .rotate(Math.PI / 2);
            }

            this._path = [];

        }).apply(this, this._args);
    }
}));

pythia.axisScale = function (longest, shortest, stepCount) {
    var digits = Math.floor(pythia.log10(longest)),
        firstDigit, secondDigit,
        str    = (Math.floor(longest).toString()),
        str2   = '';

    if (digits > 1) {
        secondDigit = parseInt(str.charAt(1), 10) + 1;

        if (secondDigit === 10) {
            firstDigit  = parseInt(str.charAt(0), 10) + 1;
            secondDigit = '0';
        } else {
            firstDigit = str.charAt(0);
        }

        str2 += firstDigit + secondDigit;

        for (var i = 2; i < str.length; ++i) {
            str2 += '0';
        }
        longest = parseInt(str2, 10);
    }

    var vStep;

    if (longest > 0 && shortest < 0) {
        yRange        = (longest - shortest);
        positiveTicks = Math.ceil(longest / yRange * (stepCount - 1));
        negativeTicks = Math.ceil(-shortest / yRange * (stepCount - 1));

        vStep = yRange / (positiveTicks + negativeTicks - 1);
        shortest = -vStep * negativeTicks;
        longest = vStep * positiveTicks;
    } else {
        if (shortest >= 0) {
            shortest = 0;
            vStep = longest / stepCount;
        } else {
            longest = 0;
            vStep = -shortest / stepCount;
        }
    }

    return [longest, shortest, vStep];
};
