"use strict"

function Pythia() {}

// Create a basic object with prototype <proto> and *shallow* copies of
// <properties>
module.exports = function (proto, properties) {
  Pythia.prototype = proto;

  var o = new Pythia(),
      prop;

  for (prop in properties) {
    if (properties.hasOwnProperty(prop)) {
      o[prop] = properties[prop];
    }
  }

  return o;
};
