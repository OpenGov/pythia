(function(p) {
    p.chart.sankey = p.Class(p.chart, {
        refresh: function() {
            var self       = this
              //filled in during calcDepth
              , depthNodes = {} //Lists of nodes at a given depth
              , depthSum   = {} //Total height of nodes at a given depth
              , nodes      = [] //List of every node
              , lines      = []
              , linesF     = {}
              , linesB     = {}

              , flows        = p.accessor(this._opts.flows, function (node) { return node.out; } )
              , flowTarget   = p.accessor(this._opts.flows, function (flow, key) { return self._data(key); } )
              , flowAmount   = p.accessor(this._opts.flows, function (flow, key) { return flow; } )

              , dataValue    = p.accessor(this._opts.flows, function (d) { return d.value; } )
              , nodeLabel    = p.accessor(this._opts.label, function (d, key)    { return key; } )
              , toolTipText  = p.accessor(this._opts.toolTipText, function (d, key)    { return key; } )
              , nodeClick    = p.accessor(this._opts.nodeClick , p.doNil)

              , depth        = _.max(this._data.map(function (node, key) { return calcDepth(node, key, 0); }))
              , height       = _.max(_.pluck(depthNodes, 'length'))

              , nodeWidth    = this._opts.nodeWidth    || 'auto'
              , nodeSpacing  = this._opts.nodeSpacing  || 'auto'
              , boxColor     = this._opts.boxColor     || 0x58585a

              , nodeMinSpacing = this._opts.nodeMinSpacing || 0.02

              , lineColor  = p.accessor(this._opts.color    , this.style('color'))

              , stepSize
              , nodeHeight = 'auto'
              ;


            /*_.each(depthNodes, function (nodes, depth) {
                depthNodes[depth] = _.sortBy(nodes, function (n) { return -dataValue(n); });
            });*/

            if (this.rects) {
                function remove(e) { e.remove(); }
                _.each(this.rects, remove);
                _.each(this.curves, remove);
                _.each(this.tooltips, remove);
            }

            this.rects = [];
            this.curves = [];
            this.hovers = []
            this.tooltips = [];

            this.style    = this.computeStyle('sankey');
            var stepSize  = (100 / (depth - 1));

            if (nodeWidth === 'auto') {
                if (nodeSpacing === 'auto') {
                    nodeWidth   = (0.4 * stepSize);
                } else {
                    nodeWidth = stepSize - nodeSpacing;
                }
            }

            if (nodeSpacing === 'auto') {
                nodeSpacing = stepSize - nodeWidth - nodeWidth/depth;
            }

            var tallestDepth = _.max(_.map(depthSum, function (sum, depth) {
                return sum + nodeMinSpacing * sum * depthNodes[depth].length;
            }));
            var heightUsed   = [];
            for (var i = 0; i < depth + 1; ++i) {
                heightUsed.push(0);
            }

            var traceTips = [];

            function tracePath(node, lines, direction, height, amount) {
                _.each(lines[node.__pythi.key], function (n) {
                    if (!height || !n.height || !node.__pythi.height) {
                        return 0;
                    }
                    var h = n.height / node.__pythi.height * height;
                    //var v = n.height / node.__pythi.height * node.value;
                    var v = (n.amount / node.value) * amount;
                    //var tooltip = self._opts.drawToolTip.call(self, p.addCommas(v.toFixed(2)), [n.x, n.y]);
                    //tooltip.show();
                    //traceTips.push(tooltip);

                    var curve =
                        self._r.Curve(
                              [ [n.x, n.y]
                              , [n.x + (n.tx - n.x) / 3, n.y]
                              , [n.x + (n.tx - n.x) / 3 * 2, n.ty]
                              , [n.tx, n.ty]
                              ]
                            , p.Style(self.style, {
                                    'width': h
                                  , color: 0xff4444
                                  , pointerEvents: 'none'
                                  , stroke: false
                              })
                        );
                    self.hovers.push(curve);

                    var nextNode = n[direction];
                    tracePath(n[direction], lines, direction, h, v);
                });
            }

            _.each(depthNodes, function (list, depth) {

                var summedHeight = depthSum[depth] / tallestDepth * 100
                  , nodeCount    = list.length
                  , vSpacing     = (100 - summedHeight) / (nodeCount);
                  ;


                _.each(list, function (node, level) {
                    var tooltip;

                    function on() {
                        tracePath(node, linesB, 'source', node.__pythi.height, node.value);
                        tracePath(node, linesF, 'target', node.__pythi.height, node.value);
                        if (!tooltip) {
                            tooltip = self._opts.drawToolTip.call(self, toolTipText(node, node.__pythi.key), [node.__pythi.x + nodeWidth/2, node.__pythi.y + node.__pythi.height/2]);
                            self.tooltips.push(tooltip);
                        }
                        tooltip.show();
                    }
                    function off() {
                        tooltip.hide();

                        _.each(traceTips, function(t) { t.remove(); });

                        _.each(self.hovers, function (h) {
                            h.remove();
                        });
                    }
                    function click() {
                        nodeClick.call(this, node, node.__pythi.key);
                    }

                    node.__pythia.height = dataValue(node) / tallestDepth * 100;
                    node.__pythia.x = (nodeSpacing + nodeWidth) * depth;
                    node.__pythia.y = vSpacing + heightUsed[depth];
                    heightUsed[depth] += node.__pythia.height + vSpacing;

                    var rect = self._r.Rect(
                          [node.__pythia.x, node.__pythia.y]
                        , [nodeWidth, node.__pythia.height]
                        , p.Style(self.style, {color: boxColor})
                        ).on('mouseover', on).on('mouseout', off).on('click')
                        .addChild(self._r.Text(
                              node.__pythia.label
                            , [node.__pythia.x + nodeWidth / 2
                            , node.__pythia.y + node.__pythia.height / 2]
                            , self.computeStyle('sankey text')
                            ));
                    self.rects.push(rect);
                });

            });

            var i = 0;
            _.each(nodes, function (node) {
                var color = lineColor(node, i++);
                _.each(flows(node), function (flow, key) {
                    var target = flowTarget(flow, key)
                      , amount = flowAmount(flow, key)
                      , height = amount / tallestDepth * 100
                      ;
                    if (height < 1) {
                        height = 0.1;
                    }
                    if (!target) {
                        return;
                    }

                    var x  = node.__pythia.x + nodeWidth
                      , y  = node.__pythia.y + node.__pythia.outY
                      , tx = target.__pythia.x
                      , ty = target.__pythia.y + target.__pythia.inY
                      ;

                    var meta = {
                          height: height
                        , amount: amount
                        , x: x
                        , y: y
                        , tx: tx
                        , ty: ty
                        , source: node
                        , target: target
                        , color: color
                    };

                    if (!linesF[node.__pythia.key])
                        linesF[node.__pythia.key]   = {};
                    if (!linesB[target.__pythia.key])
                        linesB[target.__pythia.key] = {};

                    linesF[node.__pythia.key][target.__pythia.key] = meta;
                    linesB[target.__pythia.key][node.__pythia.key] = meta;

                    lines.push(meta);

                    target.__pythia.inY += height;
                    node.__pythia.outY  += height;
                });
            });

            lines = _.sortBy(lines, function (l) {
                return -l.height;
            });

            _.each(lines, function (l) {
                var x = l.x
                  , y = l.y
                  , tx = l.tx
                  , ty = l.ty
                ;

                var curve = self._r.Curve(
                               [ [x, y]
                               , [x + (tx - x) / 3, y]
                               , [x + (tx - x) / 3 * 2, ty]
                               , [tx, ty]
                               ]
                             , p.Style(self.style, {
                                   'width': l.height
                                 , color:   l.color
                               })
                             );

                self.curves.push(curve);

                curve.on('mouseover', function () {
                    curve = self._r.Curve( [ [x, y]
                                           , [x + (tx - x) / 3, y]
                                           , [x + (tx - x) / 3 * 2, ty]
                                           , [tx, ty]
                                           ]
                                         , p.Style(self.style, { 'width': l.height
                                                                     , color: 0xff4444
                                                                     , pointerEvents: 'none'
                                                                    })
                                         );
                    self.hovers.push(curve);

                    tracePath(l.source, linesB, 'source', l.height, l.amount);
                    tracePath(l.target, linesF, 'target', l.height, l.amount);
                });

                curve.on('mouseout', function () {
                    _.each(self.hovers, function (h) {
                        h.remove();
                    });
                    self.hovers = [];
                });
            });

            //Clean up the extra property we've added to track node traversals
            _.each(nodes, function (node) {
                //TODO delete this hack
                node.__pythi = node.__pythia;
                delete node.__pythia;
            });

            self.render();

            //Recursive but not TCO friendly
            function calcDepth(node, key, depth) {
                if (!node.__pythia) {
                  depth = node.depth;

                  nodes.push(node);
                  node.__pythia = {inX: 0, inY: 0, outX: 0, outY: 0};
                  node.__pythia.depth = depth;
                  node.__pythia.label = nodeLabel(node, key);
                  node.__pythia.key   = key;

                  //if (!hasOutFlow(node)) {
                  //    node.__pythia.reach = 1;
                  //} else {
                      var flowDepths = _.map(flows(node), function (flow, key) {
                          var target = flowTarget(flow, key);
                          if (target) {
                              return calcDepth(flowTarget(flow, key), key, depth + 1);
                          }
                          return depth;
                      });

                      node.__pythia.reach = flowDepths.length ? 1 + _.max(flowDepths) : 1;
                  //}

                  if (!depthNodes[depth]) {
                      depthNodes[depth] = [];
                  }
                  depthNodes[depth].push(node);

                  depthSum[depth]      = depthSum[depth]   ? depthSum[depth] + dataValue(node) : dataValue(node);
                  //node.__pythia.height = depthCount[depth];
                  //node.height =
                  //    heightMap[node.depth] ? ++heightMap[node.depth] : heightMap[node.depth] = 1;
                }

                return node.__pythia.reach;
            }

            return self;
        }
    });

})(pythia);
