(function(p) {
    p.element.element('barChart', p.Class(p.chart, {
        init: function () {

            this.multiline  = this._opts.multiline;
            this.stacked    = this._opts.stacked;

            this.color      = p.accessor(this._opts.color, 0xffffff);
            this.lineColor  = p.accessor(this._opts.color, this.style('color'));

            this.barHoverIn   = p.accessor(this._opts.barHoverIn , p.doNil);
            this.barHoverOut  = p.accessor(this._opts.barHoverOut, p.doNil);
            this.bars = {}

            this.refresh();
        },

        defaultOptions: [
            ['multiline', false]
          , ['roundLongest', false]
          , ['stacked', false]
        ],

        //This may be getting convoluted. Might be better off with separate
        //refresh functions
        refresh: function() {
            //TODO HACK in all graphs
            this.clear();
            if (_.isEmpty(this._data._data))
                return;

            var self             = this
              , cumulativeHeight = []
              , barWidth         = self._opts.barWidth   || self.calcBarWidth()
              , barSpacing       = self._opts.barSpacing || self.calcBarWidth()
              , barLineSpacing   = self._opts.barLineSpacing || 0.001
              , lineCount        = self._data && _.size(self._data._data)
              , highest          = p.max(self._data._data, self.dataValue, self.dataLine, self.multiline, self.stacked)
              ;

            if (this._opts.roundLongest) {
                highest = this.roundLongest(longest);
            }
            this.longest = highest;

            if (self.multiline) {
                _.each(self._data._data, addLine(line, lineNo));
            } else { //not multiline
                addLine(self._data._data, 0);
            }

            function addLine(line, lineNo) {
                var i = 0;
                _.each(self.dataLine(line), function(element, key) {
                    var value = self.dataValue(element, key, lineNo);
                    var height = value / highest * 100;
                    var x, y = 100 - height;

                    if (self.stacked) {
                        if (lineNo) {
                            y -= cumulativeHeight[key];
                            cumulativeHeight[key] += height;
                        } else {
                            cumulativeHeight[key] = height;
                        }
                    }

                    var blSpacing = barLineSpacing * self._w;

                    x = (barWidth + barSpacing + barLineSpacing) * i;

                    if (self.multiline && !self.stacked) {
                        x = x * lineCount + (lineNo * (barWidth + barLineSpacing));
                    }

                    var linePColor = p.color(self.lineColor(self._data, lineNo));
                    var barPColor  = p.color(self.color(element, i, lineNo));
                    var usePColor  = linePColor.multiply(barPColor);

                    var bar = self.rect( [x, y]
                                       , [barWidth, height]
                                       , p.style({color: usePColor.hex()})
                                       ).addClass('bar')
                                        .data(element, line, key, lineNo);
                                           
                    ++i;
                });
            }
        },

        //TODO this should be a function that calculates width, barSpacing, and
        //barLineSpacing
        calcBarWidth: function () {
            if (!this._data)
                return 0;

            if (this.multiline && this.stacked)
                return 100 / (_.size(this.dataLine(this._data._data[0])) * 2);
            if (this.multiline)
                return (100 / (_.size(this.dataLine(this._data._data[0])) * 2)) / this._data._data.length;

            return 100 / (_.size(this._data._data) * 2);
        }
    })); //P.chart.bar
})(pythia);
