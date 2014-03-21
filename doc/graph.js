
document.addEvent('domready', function() {
    var chart;
    var everything;
    var expanded = {};
    var year = 2009;

    var requestor = new Request.JSON({
          url: '/data/sankey'
        , onSuccess: function(payload) {
              everything = JSON.decode(payload.data);

              var yeardiv = document.id('years');
              yeardiv.addEvent('click:relay(.yearspan)', function () {
                  year = this.get('text');
                  expanded = {};
                  updateData();
              });
              _.each(everything, function (v, k) {
                  var yearspan = new Element('a', {
                      text:k
                    , class:'yearspan'
                    , onclick: 'return false'
                    , href: '#' + k
                  });
                  yeardiv.appendChild(yearspan);
              });


              chart =  pythia(document.id('sankey'))
                  .size([1280,400])
                  .chart('sankey', {
                      label: function (node, key) {
                         var split = key.split(':');
                         return split[1] || split[0];
                      },
                      toolTipText: function (node, key) {
                          return key + '\n(' + node.connection +')\n$'
                                     + pythia.addCommas(node.value) + '\n ';
                      },
                      nodeClick: function (node, key) {
                         if (node.connection === 'superfund'
                             || node.connection === 'department') {
                            expanded[key] = true;
                         }
                         if (node.connection === 'superfund') {
                            _.each(node.out, function(f, key) {
                                if (everything[year][key].connection === 'fund') {
                                    expanded[key] = true;
                                }
                            });
                         }
                         if (node.connection === 'department') {
                            _.each(node.out, function(f, key) {
                                if (everything[year][key].connection === 'division') {
                                    expanded[key] = true;
                                }
                            });
                         }
                         updateData();
                      }
                  })

              updateData();
          }
    }).get();


    function updateData() {
        var yearData = pythia(everything[year]);
        chart.data(yearData.set('filter', defaultFilter));
    }


    function defaultFilter(node, key) {
        switch (node.connection) {
            case 'division':
            case 'fund':
                if (expanded[key])
                    return true;
                return false;
            case 'department':
            case 'superfund':
                if (expanded[key])
                    return false;
                return true;
        }
        return true;
    }
});
