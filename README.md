Pythia
======

A charting library.

Canvas
------

Entry point to all things pythia. Creates and returns a pythia canvas.

    pythia(domElement, options);

If domElement is undefined the body element is used.

### options
* size
  - An array of two numbers [width, height]

* renderer
  - Either 'raphael' or 'canvas'


Elements
--------

The canvas, charts, and primitives like paths, and rectangles are all
Elements. Elements can be styled, transformed, and can listen for events.

Starting with the canvas, Elements are created within each other. Every
element has methods to create element primitives that become children of the
element.

### element.size(size);

Get or set the size of the element. Size is an array of two numbers

### element.hide();

Hide element from view.

### element.show();

Display an element that was hidden.

### element.scale(scale, relative='center');

Scale element by scale relative to some point. Relative can be a position or one of the following strings: 'bottom', 'top', 'center'.

### element.rotate(r);

Rotate element by angle r

### element.rotate(t);

Translate element horizontally by t[0] and vertically by t[1]

### element.clear();

Delete all of the element's children

### element.addClass(className);

Add class to element. These are not HTML classes.

### element.removeClass(className);

Remove class from element.

### element.select(selector);

Select elements among children

### element.on(selector, event, callback);

Set up an event listener. When the call back is invoked the this keyword will
refer to the element that triggered the event.

#### Supported events

    mouseover

    mouseout

    click


Charts
------

Charts are elements composed of primitive elements representing data.

### chart(options);
* dimensions: 2
* getDimensions: { 0: function (data) { return data;}, 1: function (data, key) { return data[key]; } }
* getValue: { 0: function (data, key) { return key;}, 1: function (data, key) { return data[key]; } }

### chart.data(data);

Add or update data displayed on the chart. This method invokes one of the
following methods for each item in the data set.

    add
    remove
    change

If any of these methods returns a function, the function will be invoked after
all the data has been iterated over once.

### lineChart(options);

#### lineChart(options);
##### options
* multiline: false
* stacked: false
* percent: false
* fill: false

#### pieChart(options);
##### options
* radius: 50
* x: 50
* y: 50
* multiline: false

#### barChart(options);
##### options
* multiline: false
* stacked: false


Animation
----------

The animate function takes a callback and a duration in milliseconds.

    element.animate(callback, duration);

The callback receives a single number between 0 and 1 reflecting how much time
has passed. At 0 the animation has just started. At 1 the animation should be
put in its completed state.

    animation_callback(time_scale);


Element Primitives
------------------

Position and dimensions values are always an array of two numbers.

### element.path();

Draw an arbitrary path

Jump to position
    path.move(position);

Draw a line to position.
    path.line(position);

Complete path and fill it in.
    path.close();

Draw an arc around a position

    path.arc(position, radius, startAngle, angle);

### element.circleSlice(position, radius, startAngle, angle, slice);


### element.rect(position, dimensions);


Styles
------

I'm not too happy with this implementation. The way styles work is likely to
change.
