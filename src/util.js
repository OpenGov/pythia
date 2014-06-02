"use strict";

exports.mMulM = function (m1, m2) {
  return [m1[0] * m2[0] + m1[1] * m2[3] + m1[2] * m2[6],
          m1[0] * m2[1] + m1[1] * m2[4] + m1[2] * m2[7],
          m1[0] * m2[2] + m1[1] * m2[5] + m1[2] * m2[8],

          m1[3] * m2[0] + m1[4] * m2[3] + m1[5] * m2[6],
          m1[3] * m2[1] + m1[4] * m2[4] + m1[5] * m2[7],
          m1[3] * m2[2] + m1[4] * m2[5] + m1[5] * m2[8],

          m1[6] * m2[0] + m1[7] * m2[3] + m1[8] * m2[6],
          m1[6] * m2[1] + m1[7] * m2[4] + m1[8] * m2[7],
          m1[6] * m2[2] + m1[7] * m2[5] + m1[8] * m2[8]];
};

exports.sMulM = function (s, m) {
  return [s * m[0], s * m[1], s * m[2],
          s * m[3], s * m[4], s * m[5],
          s * m[6], s * m[7], s * m[8]];
};

exports.mMulV = function (m, v) {
  return [ m[0] * v[0] + m[1] * v[1] + m[2],
           m[3] * v[0] + m[4] * v[1] + m[5]
         ];
};

exports.mCopy = function(m) {
  return [m[0], m[1], m[2],
          m[3], m[4], m[5],
          m[6], m[7], m[8]];
};

exports.log10 = function (v) {
  return Math.log(v)/Math.log(10);
};

exports.measureText = function (text, textStyle) {
  var span  = pythia.span,
      style = span.style,
      bounds;

  if (textStyle.fontSize) {
    style.fontSize = textStyle.fontSize + 'px';
  }

  if (textStyle.fontFamily) {
    style.fontFamily = textStyle.fontFamily;
  }

  document.body.appendChild(span);
  span.innerHTML = text.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2');
  bounds = span.getBoundingClientRect();

  return [
    bounds.right - bounds.left + 8,
    bounds.bottom - bounds.top
  ];
};

pythia.span = document.createElement('athena');
// 1.2 to roughly correspond with how raphael ends up spacing fonts
pythia.span.style.cssText = "position:absolute;left:-9999em;top:-9999em;padding:0;margin:0;line-height:1.2";
