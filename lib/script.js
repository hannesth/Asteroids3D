"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

(function () {
  function e(t, n, r) {
    function s(o, u) {
      if (!n[o]) {
        if (!t[o]) {
          var a = typeof require == "function" && require;if (!u && a) return a(o, !0);if (i) return i(o, !0);var f = new Error("Cannot find module '" + o + "'");throw f.code = "MODULE_NOT_FOUND", f;
        }var l = n[o] = { exports: {} };t[o][0].call(l.exports, function (e) {
          var n = t[o][1][e];return s(n ? n : e);
        }, l, l.exports, e, t, n, r);
      }return n[o].exports;
    }var i = typeof require == "function" && require;for (var o = 0; o < r.length; o++) {
      s(r[o]);
    }return s;
  }return e;
})()({ 1: [function (require, module, exports) {
    /**
     * @license Quaternion.js v2.0.0 22/02/2016
     *
     * Copyright (c) 2016, Robert Eisele (robert@xarg.org)
     * Dual licensed under the MIT or GPL Version 2 licenses.
     **/
    (function (root) {

      'use strict';

      /**
       * Calculates log(sqrt(a^2+b^2)) in a way to avoid overflows
       *
       * @param {number} a
       * @param {number} b
       * @returns {number}
       */

      function logHypot(a, b) {

        var _a = Math.abs(a);
        var _b = Math.abs(b);

        if (a === 0) {
          return Math.log(_b);
        }

        if (b === 0) {
          return Math.log(_a);
        }

        if (_a < 3000 && _b < 3000) {
          return Math.log(a * a + b * b) * 0.5;
        }

        return Math.log(a / Math.cos(Math.atan2(b, a)));
      }

      /*
       * Default is the multiplicative one element
       *
       */
      var P = {
        'w': 1,
        'x': 0,
        'y': 0,
        'z': 0
      };

      function parse(dest, w, x, y, z) {

        // Most common internal use case with 4 params
        if (z !== undefined) {
          dest['w'] = w;
          dest['x'] = x;
          dest['y'] = y;
          dest['z'] = z;
          return;
        }

        if ((typeof w === "undefined" ? "undefined" : _typeof(w)) === 'object' && y === undefined) {

          // Check for quats, for example when an object gets cloned
          if ('w' in w || 'x' in w || 'y' in w || 'z' in w) {
            dest['w'] = w['w'] || 0;
            dest['x'] = w['x'] || 0;
            dest['y'] = w['y'] || 0;
            dest['z'] = w['z'] || 0;
            return;
          }

          // Check for complex numbers
          if ('re' in w && 'im' in w) {
            dest['w'] = w['re'];
            dest['x'] = w['im'];
            dest['y'] = 0;
            dest['z'] = 0;
            return;
          }

          // Check for array
          if (w.length === 4) {
            dest['w'] = w[0];
            dest['x'] = w[1];
            dest['y'] = w[2];
            dest['z'] = w[3];
            return;
          }

          // Check for augmented vector
          if (w.length === 3) {
            dest['w'] = 0;
            dest['x'] = w[0];
            dest['y'] = w[1];
            dest['z'] = w[2];
            return;
          }

          throw new Error('Invalid object');
        }

        // Parse string values
        if (typeof w === 'string' && y === undefined) {

          var tokens = w.match(/\d+\.?\d*e[+-]?\d+|\d+\.?\d*|\.\d+|./g);
          var plus = 1;
          var minus = 0;

          var iMap = { 'i': 'x', 'j': 'y', 'k': 'z' };

          if (tokens === null) {
            throw new Error('Parse error');
          }

          // Reset the current state
          dest['w'] = dest['x'] = dest['y'] = dest['z'] = 0;

          for (var i = 0; i < tokens.length; i++) {

            var c = tokens[i];
            var d = tokens[i + 1];

            if (c === ' ' || c === '\t' || c === '\n') {
              /* void */
            } else if (c === '+') {
              plus++;
            } else if (c === '-') {
              minus++;
            } else {

              if (plus + minus === 0) {
                throw new Error('Parse error' + c);
              }
              var g = iMap[c];

              // Is the current token an imaginary sign?
              if (g !== undefined) {

                // Is the following token a number?
                if (d !== ' ' && !isNaN(d)) {
                  c = d;
                  i++;
                } else {
                  c = '1';
                }
              } else {

                if (isNaN(c)) {
                  throw new Error('Parser error');
                }

                g = iMap[d];

                if (g !== undefined) {
                  i++;
                }
              }

              dest[g || 'w'] += parseFloat((minus % 2 ? '-' : '') + c);
              plus = minus = 0;
            }
          }

          // Still something on the stack
          if (plus + minus > 0) {
            throw new Error('Parser error');
          }
          return;
        }

        // If no single variable was given AND it was the constructor, set it to the identity
        if (w === undefined && dest !== P) {
          dest['w'] = 1;
          dest['x'] = dest['y'] = dest['z'] = 0;
        } else {

          dest['w'] = w || 0;

          // Note: This isn't setFromAxis, it's just syntactic sugar!
          if (x && x.length === 3) {
            dest['x'] = x[0];
            dest['y'] = x[1];
            dest['z'] = x[2];
          } else {
            dest['x'] = x || 0;
            dest['y'] = y || 0;
            dest['z'] = z || 0;
          }
        }
      }

      function numToStr(n, char, prev) {

        var ret = '';

        if (n !== 0) {

          if (prev !== '') {
            ret += n < 0 ? ' - ' : ' + ';
          } else if (n < 0) {
            ret += '-';
          }

          n = Math.abs(n);

          if (1 !== n || char === '') {
            ret += n;
          }
          ret += char;
        }
        return ret;
      }

      /**
       * Quaternion constructor
       *
       * @constructor
       * @param {number|Object|string} w real
       * @param {number=} x imag
       * @param {number=} y imag
       * @param {number=} z imag
       * @returns {Quaternion}
       */
      function Quaternion(w, x, y, z) {

        if (!(this instanceof Quaternion)) {
          return new Quaternion(w, x, y, z);
        }

        parse(this, w, x, y, z);
      }

      Quaternion.prototype = {
        'w': 1,
        'x': 0,
        'y': 0,
        'z': 0,
        /**
         * Adds two quaternions Q1 and Q2
         *
         * @param {number|Object|string} w real
         * @param {number=} x imag
         * @param {number=} y imag
         * @param {number=} z imag
         * @returns {Quaternion}
         */
        'add': function add(w, x, y, z) {

          parse(P, w, x, y, z);

          // Q1 + Q2 := [w1, v1] + [w2, v2] = [w1 + w2, v1 + v2]

          return new Quaternion(this['w'] + P['w'], this['x'] + P['x'], this['y'] + P['y'], this['z'] + P['z']);
        },
        /**
         * Subtracts a quaternions Q2 from Q1
         *
         * @param {number|Object|string} w real
         * @param {number=} x imag
         * @param {number=} y imag
         * @param {number=} z imag
         * @returns {Quaternion}
         */
        'sub': function sub(w, x, y, z) {

          parse(P, w, x, y, z);

          // Q1 - Q2 := Q1 + (-Q2)
          //          = [w1, v1] - [w2, v2] = [w1 - w2, v1 - v2]

          return new Quaternion(this['w'] - P['w'], this['x'] - P['x'], this['y'] - P['y'], this['z'] - P['z']);
        },
        /**
         * Calculates the additive inverse, or simply it negates the quaternion
         *
         * @returns {Quaternion}
         */
        'neg': function neg() {

          // -Q := [-w, -v]

          return new Quaternion(-this['w'], -this['x'], -this['y'], -this['z']);
        },
        /**
         * Calculates the length/modulus/magnitude or the norm of a quaternion
         *
         * @returns {number}
         */
        'norm': function norm() {

          // |Q| := sqrt(|Q|^2)

          // The unit quaternion has |Q| = 1

          var w = this['w'];
          var x = this['x'];
          var y = this['y'];
          var z = this['z'];

          return Math.sqrt(w * w + x * x + y * y + z * z);
        },
        /**
         * Calculates the squared length/modulus/magnitude or the norm of a quaternion
         *
         * @returns {number}
         */
        'normSq': function normSq() {

          // |Q|^2 := [w, v] * [w, -v]
          //        = [w^2 + dot(v, v), -w * v + w * v + cross(v, -v)]
          //        = [w^2 + |v|^2, 0]
          //        = [w^2 + dot(v, v), 0]
          //        = dot(Q, Q)
          //        = Q * Q'

          var w = this['w'];
          var x = this['x'];
          var y = this['y'];
          var z = this['z'];

          return w * w + x * x + y * y + z * z;
        },
        /**
         * Normalizes the quaternion to have |Q| = 1 as long as the norm is not zero
         * Alternative names are the signum, unit or versor
         *
         * @returns {Quaternion}
         */
        'normalize': function normalize() {

          // Q* := Q / |Q|

          // unrolled Q.scale(1 / Q.norm())

          var w = this['w'];
          var x = this['x'];
          var y = this['y'];
          var z = this['z'];

          var norm = Math.sqrt(w * w + x * x + y * y + z * z);

          if (norm < Quaternion['EPSILON']) {
            return Quaternion['ZERO'];
          }

          norm = 1 / norm;

          return new Quaternion(w * norm, x * norm, y * norm, z * norm);
        },
        /**
         * Calculates the Hamilton product of two quaternions
         * Leaving out the imaginary part results in just scaling the quat
         *
         * @param {number|Object|string} w real
         * @param {number=} x imag
         * @param {number=} y imag
         * @param {number=} z imag
         * @returns {Quaternion}
         */
        'mul': function mul(w, x, y, z) {

          parse(P, w, x, y, z);

          // Q1 * Q2 = [w1 * w2 - dot(v1, v2), w1 * v2 + w2 * v1 + cross(v1, v2)]

          // Not commutative because cross(v1, v2) != cross(v2, v1)!

          var w1 = this['w'];
          var x1 = this['x'];
          var y1 = this['y'];
          var z1 = this['z'];

          var w2 = P['w'];
          var x2 = P['x'];
          var y2 = P['y'];
          var z2 = P['z'];

          return new Quaternion(w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2, w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2, w1 * y2 + y1 * w2 + z1 * x2 - x1 * z2, w1 * z2 + z1 * w2 + x1 * y2 - y1 * x2);
        },
        /**
         * Scales a quaternion by a scalar, faster than using multiplication
         *
         * @param {number} s scaling factor
         * @returns {Quaternion}
         */
        'scale': function scale(s) {

          return new Quaternion(this['w'] * s, this['x'] * s, this['y'] * s, this['z'] * s);
        },
        /**
         * Calculates the dot product of two quaternions
         *
         * @param {number|Object|string} w real
         * @param {number=} x imag
         * @param {number=} y imag
         * @param {number=} z imag
         * @returns {number}
         */
        'dot': function dot(w, x, y, z) {

          parse(P, w, x, y, z);

          // dot(Q1, Q2) := w1 * w2 + dot(v1, v2)

          return this['w'] * P['w'] + this['x'] * P['x'] + this['y'] * P['y'] + this['z'] * P['z'];
        },
        /**
         * Calculates the inverse of a quat for non-normalized quats such that
         * Q^-1 * Q = 1 and Q * Q^-1 = 1
         *
         * @returns {Quaternion}
         */
        'inverse': function inverse() {

          // Q^-1 := Q' / |Q|^2
          //       = [w / (w^2 + |v|^2), -v / (w^2 + |v|^2)]

          // Proof:
          // Q * Q^-1 = [w, v] * [w / (w^2 + |v|^2), -v / (w^2 + |v|^2)]
          //          = [1, 0]
          // Q^-1 * Q = [w / (w^2 + |v|^2), -v / (w^2 + |v|^2)] * [w, v]
          //          = [1, 0].

          var w = this['w'];
          var x = this['x'];
          var y = this['y'];
          var z = this['z'];

          var normSq = w * w + x * x + y * y + z * z;

          if (normSq === 0) {
            return Quaternion['ZERO']; // TODO: Is the result zero or one when the norm is zero?
          }

          normSq = 1 / normSq;

          return new Quaternion(w * normSq, -x * normSq, -y * normSq, -z * normSq);
        },
        /**
         * Multiplies a quaternion with the inverse of a second quaternion
         *
         * @param {number|Object|string} w real
         * @param {number=} x imag
         * @param {number=} y imag
         * @param {number=} z imag
         * @returns {Quaternion}
         */
        'div': function div(w, x, y, z) {

          parse(P, w, x, y, z);

          // Q1 / Q2 := Q1 * Q2^-1

          var w1 = this['w'];
          var x1 = this['x'];
          var y1 = this['y'];
          var z1 = this['z'];

          var w2 = P['w'];
          var x2 = P['x'];
          var y2 = P['y'];
          var z2 = P['z'];

          var normSq = w2 * w2 + x2 * x2 + y2 * y2 + z2 * z2;

          if (normSq === 0) {
            return Quaternion['ZERO']; // TODO: Is the result zero or one when the norm is zero?
          }

          normSq = 1 / normSq;

          return new Quaternion((w1 * w2 + x1 * x2 + y1 * y2 + z1 * z2) * normSq, (x1 * w2 - w1 * x2 - y1 * z2 + z1 * y2) * normSq, (y1 * w2 - w1 * y2 - z1 * x2 + x1 * z2) * normSq, (z1 * w2 - w1 * z2 - x1 * y2 + y1 * x2) * normSq);
        },
        /**
         * Calculates the conjugate of a quaternion
         *
         * @returns {Quaternion}
         */
        'conjugate': function conjugate() {

          // Q' = [s, -v]

          // If the quaternion is normalized,
          // the conjugate is the inverse of the quaternion - but faster
          // Q' * Q = Q * Q' = 1

          // Additionally, the conjugate of a unit quaternion is a rotation with the same
          // angle but the opposite axis.

          // Moreover the following property holds:
          // (Q1 * Q2)' = Q2' * Q1'

          return new Quaternion(this['w'], -this['x'], -this['y'], -this['z']);
        },
        /**
         * Calculates the natural exponentiation of the quaternion
         *
         * @returns {Quaternion}
         */
        'exp': function exp() {

          var w = this['w'];
          var x = this['x'];
          var y = this['y'];
          var z = this['z'];

          var vNorm = Math.sqrt(x * x + y * y + z * z);
          var wExp = Math.exp(w);
          var scale = wExp / vNorm * Math.sin(vNorm);

          if (vNorm === 0) {
            //return new Quaternion(wExp * Math.cos(vNorm), 0, 0, 0);
            return new Quaternion(wExp, 0, 0, 0);
          }

          return new Quaternion(wExp * Math.cos(vNorm), x * scale, y * scale, z * scale);
        },
        /**
         * Calculates the natural logarithm of the quaternion
         *
         * @returns {Quaternion}
         */
        'log': function log() {

          var w = this['w'];
          var x = this['x'];
          var y = this['y'];
          var z = this['z'];

          if (y === 0 && z === 0) {
            return new Quaternion(logHypot(w, x), Math.atan2(x, w), 0, 0);
          }

          var qNorm2 = x * x + y * y + z * z + w * w;
          var vNorm = Math.sqrt(x * x + y * y + z * z);

          var scale = Math.atan2(vNorm, w) / vNorm;

          return new Quaternion(Math.log(qNorm2) * 0.5, x * scale, y * scale, z * scale);
        },
        /**
         * Calculates the power of a quaternion raised to a real number or another quaternion
         *
         * @param {number|Object|string} w real
         * @param {number=} x imag
         * @param {number=} y imag
         * @param {number=} z imag
         * @returns {Quaternion}
         */
        'pow': function pow(w, x, y, z) {

          parse(P, w, x, y, z);

          if (P['y'] === 0 && P['z'] === 0) {

            if (P['w'] === 1 && P['x'] === 0) {
              return this;
            }

            if (P['w'] === 0 && P['x'] === 0) {
              return Quaternion['ONE'];
            }

            // Check if we can operate in C
            // Borrowed from complex.js
            if (this['y'] === 0 && this['z'] === 0) {

              var a = this['w'];
              var b = this['x'];

              if (a === 0 && b === 0) {
                return Quaternion['ZERO'];
              }

              var arg = Math.atan2(b, a);
              var loh = logHypot(a, b);

              if (P['x'] === 0) {

                if (b === 0 && a >= 0) {

                  return new Quaternion(Math.pow(a, P['w']), 0, 0, 0);
                } else if (a === 0) {

                  switch (P['w'] % 4) {
                    case 0:
                      return new Quaternion(Math.pow(b, P['w']), 0, 0, 0);
                    case 1:
                      return new Quaternion(0, Math.pow(b, P['w']), 0, 0);
                    case 2:
                      return new Quaternion(-Math.pow(b, P['w']), 0, 0, 0);
                    case 3:
                      return new Quaternion(0, -Math.pow(b, P['w']), 0, 0);
                  }
                }
              }

              a = Math.exp(P['w'] * loh - P['x'] * arg);
              b = P['x'] * loh + P['w'] * arg;
              return new Quaternion(a * Math.cos(b), a * Math.sin(b), 0, 0);
            }
          }

          // Normal quaternion behavior
          // q^p = e^ln(q^p) = e^(ln(q)*p)
          return this.log().mul(P).exp();
        },
        /**
         * Checks if two quats are the same
         *
         * @param {number|Object|string} w real
         * @param {number=} x imag
         * @param {number=} y imag
         * @param {number=} z imag
         * @returns {boolean}
         */
        'equals': function equals(w, x, y, z) {

          parse(P, w, x, y, z);

          var eps = Quaternion['EPSILON'];

          // maybe check for NaN's here?
          return Math.abs(P['w'] - this['w']) < eps && Math.abs(P['x'] - this['x']) < eps && Math.abs(P['y'] - this['y']) < eps && Math.abs(P['z'] - this['z']) < eps;
        },
        /**
         * Checks if all parts of a quaternion are finite
         *
         * @returns {boolean}
         */
        'isFinite': function (_isFinite) {
          function isFinite() {
            return _isFinite.apply(this, arguments);
          }

          isFinite.toString = function () {
            return _isFinite.toString();
          };

          return isFinite;
        }(function () {

          return isFinite(this['w']) && isFinite(this['x']) && isFinite(this['y']) && isFinite(this['z']);
        }),
        /**
         * Checks if any of the parts of the quaternion is not a number
         *
         * @returns {boolean}
         */
        'isNaN': function (_isNaN) {
          function isNaN() {
            return _isNaN.apply(this, arguments);
          }

          isNaN.toString = function () {
            return _isNaN.toString();
          };

          return isNaN;
        }(function () {

          return isNaN(this['w']) || isNaN(this['x']) || isNaN(this['y']) || isNaN(this['z']);
        }),
        /**
         * Gets the Quaternion as a well formatted string
         *
         * @returns {string}
         */
        'toString': function toString() {

          var w = this['w'];
          var x = this['x'];
          var y = this['y'];
          var z = this['z'];
          var ret = '';

          if (isNaN(w) || isNaN(x) || isNaN(y) || isNaN(z)) {
            return 'NaN';
          }

          // Alternative design?
          // '(%f, [%f %f %f])'

          ret = numToStr(w, '', ret);
          ret += numToStr(x, 'i', ret);
          ret += numToStr(y, 'j', ret);
          ret += numToStr(z, 'k', ret);

          if ('' === ret) return '0';

          return ret;
        },
        /**
         * Returns the real part of the quaternion
         *
         * @returns {number}
         */
        'real': function real() {

          return this['w'];
        },
        /**
         * Returns the imaginary part of the quaternion as a 3D vector / array
         *
         * @returns {Quaternion}
         */
        'imag': function imag() {

          return [this['x'], this['y'], this['z']];
        },
        /**
         * Gets the actual quaternion as a 4D vector / array
         *
         * @returns {Array}
         */
        'toVector': function toVector() {

          return [this['w'], this['x'], this['y'], this['z']];
        },
        /**
         * Calculates the 3x3 rotation matrix for the current quat
         *
         * @param {boolean=} d2
         * @see https://en.wikipedia.org/wiki/Rotation_matrix#Quaternion
         * @returns {Array}
         */
        'toMatrix': function toMatrix(d2) {

          var w = this['w'];
          var x = this['x'];
          var y = this['y'];
          var z = this['z'];

          var n = w * w + x * x + y * y + z * z;
          var s = n === 0 ? 0 : 2 / n;
          var wx = s * w * x,
              wy = s * w * y,
              wz = s * w * z;
          var xx = s * x * x,
              xy = s * x * y,
              xz = s * x * z;
          var yy = s * y * y,
              yz = s * y * z,
              zz = s * z * z;

          if (d2) {
            return [[1 - (yy + zz), xy - wz, xz + wy], [xy + wz, 1 - (xx + zz), yz - wx], [xz - wy, yz + wx, 1 - (xx + yy)]];
          }

          return [1 - (yy + zz), xy - wz, xz + wy, xy + wz, 1 - (xx + zz), yz - wx, xz - wy, yz + wx, 1 - (xx + yy)];
        },
        /**
         * Calculates the homogeneous 4x4 rotation matrix for the current quat
         *
         * @param {boolean=} d2
         * @returns {Array}
         */
        'toMatrix4': function toMatrix4(d2) {

          var w = this['w'];
          var x = this['x'];
          var y = this['y'];
          var z = this['z'];

          var n = w * w + x * x + y * y + z * z;
          var s = n === 0 ? 0 : 2 / n;
          var wx = s * w * x,
              wy = s * w * y,
              wz = s * w * z;
          var xx = s * x * x,
              xy = s * x * y,
              xz = s * x * z;
          var yy = s * y * y,
              yz = s * y * z,
              zz = s * z * z;

          if (d2) {
            return [[1 - (yy + zz), xy - wz, xz + wy, 0], [xy + wz, 1 - (xx + zz), yz - wx, 0], [xz - wy, yz + wx, 1 - (xx + yy), 0], [0, 0, 0, 1]];
          }

          return [1 - (yy + zz), xy - wz, xz + wy, 0, xy + wz, 1 - (xx + zz), yz - wx, 0, xz - wy, yz + wx, 1 - (xx + yy), 0, 0, 0, 0, 1];
        },
        /**
         * Clones the actual object
         *
         * @returns {Quaternion}
         */
        'clone': function clone() {

          return new Quaternion(this);
        },
        /**
         * Rotates a vector according to the current quaternion
         *
         * @param {Array} v The vector to be rotated
         * @returns {Array}
         */
        'rotateVector': function rotateVector(v) {

          // [0, v'] = Q * [0, v] * Q'

          // Q
          var w1 = this['w'];
          var x1 = this['x'];
          var y1 = this['y'];
          var z1 = this['z'];

          // [0, v]
          var w2 = 0;
          var x2 = v[0];
          var y2 = v[1];
          var z2 = v[2];

          // Q * [0, v]
          var w3 = /*w1 * w2*/-x1 * x2 - y1 * y2 - z1 * z2;
          var x3 = w1 * x2 + /*x1 * w2 +*/y1 * z2 - z1 * y2;
          var y3 = w1 * y2 + /*y1 * w2 +*/z1 * x2 - x1 * z2;
          var z3 = w1 * z2 + /*z1 * w2 +*/x1 * y2 - y1 * x2;

          var w4 = w3 * w1 + x3 * x1 + y3 * y1 + z3 * z1;
          var x4 = x3 * w1 - w3 * x1 - y3 * z1 + z3 * y1;
          var y4 = y3 * w1 - w3 * y1 - z3 * x1 + x3 * z1;
          var z4 = z3 * w1 - w3 * z1 - x3 * y1 + y3 * x1;

          return [x4, y4, z4];
        }
      };

      Quaternion['ZERO'] = new Quaternion(0, 0, 0, 0); // This is the additive identity Quaternion
      Quaternion['ONE'] = new Quaternion(1, 0, 0, 0); // This is the multiplicative identity Quaternion
      Quaternion['I'] = new Quaternion(0, 1, 0, 0);
      Quaternion['J'] = new Quaternion(0, 0, 1, 0);
      Quaternion['K'] = new Quaternion(0, 0, 0, 1);
      Quaternion['EPSILON'] = 1e-16;

      /**
       * Creates quaternion by a rotation given as axis and angle
       *
       * @param {Array} axis The axis around which to rotate
       * @param {number} angle The angle in radians
       * @returns {Quaternion}
       */
      Quaternion['fromAxisAngle'] = function (axis, angle) {

        // Q = [cos(angle / 2), v * sin(angle / 2)]

        var halfAngle = angle * 0.5;

        var a = axis[0];
        var b = axis[1];
        var c = axis[2];

        var sin = Math.sin(halfAngle);
        var cos = Math.cos(halfAngle);

        var sin_norm = sin / Math.sqrt(a * a + b * b + c * c);

        return new Quaternion(cos, a * sin_norm, b * sin_norm, c * sin_norm);
      };

      /**
       * Calculates the quaternion to rotate one vector onto the other
       *
       * @param {Array} u
       * @param {Array} v
       */
      Quaternion['fromBetweenVectors'] = function (u, v) {

        var a = u[0];
        var b = u[1];
        var c = u[2];

        var x = v[0];
        var y = v[1];
        var z = v[2];

        var dot = a * x + b * y + c * z;
        var w1 = b * z - c * y;
        var w2 = c * x - a * z;
        var w3 = a * y - b * x;

        return new Quaternion(dot + Math.sqrt(dot * dot + w1 * w1 + w2 * w2 + w3 * w3), w1, w2, w3).normalize();
      };

      /**
       * Creates a quaternion by a rotation given by Euler angles
       *
       * @param {number} phi
       * @param {number} theta
       * @param {number} psi
       * @param {string=} order
       * @returns {Quaternion}
       */
      Quaternion['fromEuler'] = function (phi, theta, psi, order) {

        var _x = theta * 0.5;
        var _y = psi * 0.5;
        var _z = phi * 0.5;

        var cX = Math.cos(_x);
        var cY = Math.cos(_y);
        var cZ = Math.cos(_z);

        var sX = Math.sin(_x);
        var sY = Math.sin(_y);
        var sZ = Math.sin(_z);

        if (order === undefined || order === 'ZXY') {
          return new Quaternion(cX * cY * cZ - sX * sY * sZ, sX * cY * cZ - cX * sY * sZ, cX * sY * cZ + sX * cY * sZ, cX * cY * sZ + sX * sY * cZ);
        }

        if (order === 'XYZ') {
          return new Quaternion(cX * cY * cZ - sX * sY * sZ, sX * cY * cZ + cX * sY * sZ, cX * sY * cZ - sX * cY * sZ, cX * cY * sZ + sX * sY * cZ);
        }

        if (order === 'YXZ') {
          return new Quaternion(cX * cY * cZ + sX * sY * sZ, sX * cY * cZ + cX * sY * sZ, cX * sY * cZ - sX * cY * sZ, cX * cY * sZ - sX * sY * cZ);
        }

        if (order === 'ZYX') {
          return new Quaternion(cX * cY * cZ + sX * sY * sZ, sX * cY * cZ - cX * sY * sZ, cX * sY * cZ + sX * cY * sZ, cX * cY * sZ - sX * sY * cZ);
        }

        if (order === 'YZX') {
          return new Quaternion(cX * cY * cZ - sX * sY * sZ, sX * cY * cZ + cX * sY * sZ, cX * sY * cZ + sX * cY * sZ, cX * cY * sZ - sX * sY * cZ);
        }

        if (order === 'XZY') {
          return new Quaternion(cX * cY * cZ + sX * sY * sZ, sX * cY * cZ - cX * sY * sZ, cX * sY * cZ - sX * cY * sZ, cX * cY * sZ + sX * sY * cZ);
        }
        return null;
      };

      if (typeof define === 'function' && define['amd']) {
        define([], function () {
          return Quaternion;
        });
      } else if ((typeof exports === "undefined" ? "undefined" : _typeof(exports)) === 'object') {
        module['exports'] = Quaternion;
      } else {
        root['Quaternion'] = Quaternion;
      }
    })(this);
  }, {}], 2: [function (require, module, exports) {
    /*
    
      Asteroids in 3D
    */

    var Quaternion = require('quaternion');

    var canvas = void 0;
    var gl = void 0;

    var NumVerticesSphere = 0;
    var NumVerticesAsteroid = 36;

    var count = 7;

    var sphereIndex = 0;

    var points = [];
    var colors = [];

    var va = vec4(0.0, 0.0, -1.0, 1);
    var vb = vec4(0.0, 0.942809, 0.333333, 1);
    var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
    var vd = vec4(0.816497, -0.471405, 0.333333, 1);

    var shipSpeed = 0.02;

    var refSize = 0.2;
    var refSpeed = 0.01;

    var bulletSize = 0.02;
    var bulletSpeed = 0.02;

    var viewBoxLength = 15.0;

    var initialNumberOfAsteroids = 40;

    var pitch = 0.0;
    var yaw = 0.0;
    var roll = 0.0;
    var eye = [0.0, 0.0, 0.0];
    var pitchAxis = [1.0, 0.0, 0.0];
    var yawAxis = [0.0, 1.0, 0.0];
    var rollAxis = [0.0, 0.0, -1.0];
    var deltaAngle = 1;

    var proLoc = void 0;
    var mvLoc = void 0;

    var vertices = [vec4(-0.5, -0.5, 0.5, 1.0), vec4(-0.5, 0.5, 0.5, 1.0), vec4(0.5, 0.5, 0.5, 1.0), vec4(0.5, -0.5, 0.5, 1.0), vec4(-0.5, -0.5, -0.5, 1.0), vec4(-0.5, 0.5, -0.5, 1.0), vec4(0.5, 0.5, -0.5, 1.0), vec4(0.5, -0.5, -0.5, 1.0)];

    function triangle(a, b, c) {

      points.push(a);
      points.push(b);
      points.push(c);

      NumVerticesSphere += 3;
    }

    function quad(a, b, c, d) {
      points.push(vertices[a]);
      points.push(vertices[b]);
      points.push(vertices[c]);
      points.push(vertices[a]);
      points.push(vertices[c]);
      points.push(vertices[d]);
    }

    function cube() {
      quad(1, 0, 3, 2);
      quad(2, 3, 7, 6);
      quad(3, 0, 4, 7);
      quad(6, 5, 1, 2);
      quad(4, 5, 6, 7);
      quad(5, 4, 0, 1);
    }

    function divideTriangle(a, b, c, count) {
      if (count > 0) {

        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var bc = mix(b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        divideTriangle(a, ab, ac, count - 1);
        divideTriangle(ab, b, bc, count - 1);
        divideTriangle(bc, c, ac, count - 1);
        divideTriangle(ab, bc, ac, count - 1);
      } else {
        triangle(a, b, c);
      }
    }

    function tetrahedron(a, b, c, d, n) {
      divideTriangle(a, b, c, n);
      divideTriangle(d, c, b, n);
      divideTriangle(a, d, b, n);
      divideTriangle(a, c, d, n);
    }

    function List() {
      this.start = null;
      this.end = null;
      this.counter = 0;
    }

    List.makeNode = function () {
      return { data: null, next: null, prev: null, id: null };
    };

    List.prototype.add = function (data) {
      if (this.start === null) {
        this.start = List.makeNode();
        this.end = this.start;
      } else {
        this.end.next = List.makeNode();
        this.end.next.prev = this.end;
        this.end = this.end.next;
      }
      this.end.data = data;
    };

    List.prototype.remove = function (id) {
      var jo = this.start;

      while (jo != null) {
        if (jo.id === id) {
          jo.prev.next = jo.next;
        } else {
          jo = jo.next;
        }
      }
    };

    function changePos(position, direction, speed) {
      var dPosition = new Array(3);
      var dx = speed * Math.cos(radians(direction[0])) * Math.cos(radians(direction[1]));
      var dy = speed * Math.sin(radians(direction[0])) * Math.cos(radians(direction[1]));
      var dz = speed * Math.cos(radians(direction[0])) * Math.sin(radians(direction[1]));
      dPosition = [dx, dy, dy];

      var sum = new Array(3);
      for (var i = 0; i <= 2; i++) {
        sum[i] = position[i] + dPosition[i];
      }

      return sum;
    }

    function forward() {
      eye[0] = eye[0] - shipSpeed * Math.sin(radians(yaw));
      eye[2] = eye[2] - shipSpeed * Math.cos(radians(yaw));
    }

    //Asteroid "Class" description:
    // Three types of sizes for asteroids.
    // If value is zero then it is not drawn
    // Vector of length maxNumber.
    // Possible values : {0, 1, 2, 3}


    // Two angles theta and phi for 3D direction
    // Matrix of size maxNumber x 2
    // -180 < theta < 180
    // -90< phi < 90
    function Asteroid() {

      this.size = Math.floor(Math.random() * 3.0) + 1.0;

      var pos = new Array(3);
      pos[0] = Math.random() * (viewBoxLength - this.size) - (viewBoxLength - this.size) / 2.0;
      pos[1] = Math.random() * (viewBoxLength - this.size) - (viewBoxLength - this.size) / 2.0;
      pos[2] = Math.random() * (viewBoxLength - this.size) - (viewBoxLength - this.size) / 2.0;
      this.position = pos;

      var dir = new Array(2);
      dir[0] = Math.random() * 360 - 180;
      dir[1] = Math.random() * 180 - 90;
      this.direction = dir;

      this.speed = (4 - this.size) * refSpeed;
    }
    Asteroid.prototype.changePosition = function () {
      this.position = changePos(this.position, this.direction, this.speed);
    };

    Asteroid.prototype.wrapIfOutOfBounds = function () {
      var pos = this.position;
      if (pos[0] < -viewBoxLength) {
        pos[0] = viewBoxLength;
      }
      if (pos[0] > viewBoxLength) {
        pos[0] = -viewBoxLength;
      }
      if (pos[1] < -viewBoxLength) {
        pos[1] = viewBoxLength;
      }
      if (pos[1] > viewBoxLength) {
        pos[1] = -viewBoxLength;
      }
      if (pos[2] < -viewBoxLength) {
        pos[2] = viewBoxLength;
      }
      if (pos[2] > viewBoxLength) {
        pos[2] = -viewBoxLength;
      }

      this.position = pos;
    };

    function Bullet() {
      this.position = eye;

      this.direction = [yaw, pitch];
    }

    Bullet.prototype.changePosition = function () {
      console.log(this.position);
      this.position = changePos(this.position, this.direction, bulletSpeed);
    };

    Bullet.prototype.wrapIfOutOfBounds = function () {
      var pos = this.position;
      if (pos[0] < -viewBoxLength) {
        pos[0] = viewBoxLength;
      }
      if (pos[0] > viewBoxLength) {
        pos[0] = -viewBoxLength;
      }
      if (pos[1] < -viewBoxLength) {
        pos[1] = viewBoxLength;
      }
      if (pos[1] > viewBoxLength) {
        pos[1] = -viewBoxLength;
      }
      if (pos[2] < -viewBoxLength) {
        pos[2] = viewBoxLength;
      }
      if (pos[2] > viewBoxLength) {
        pos[2] = -viewBoxLength;
      }

      this.position = pos;
    };

    window.onload = function init() {
      canvas = document.querySelector("canvas");

      gl = WebGLUtils.setupWebGL(canvas);
      if (!gl) {
        alert("WebGL isn't available");
      }

      // insert vertices into array: points
      cube();
      tetrahedron(va, vb, vc, vd, count);

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.0, 0.0, 0.0, 1.0);

      gl.enable(gl.DEPTH_TEST);

      //
      //  Load shaders and initialize attribute buffers
      //
      var program = initShaders(gl, "vertex-shader", "fragment-shader");
      gl.useProgram(program);

      var vBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

      var vPosition = gl.getAttribLocation(program, "vPosition");
      gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vPosition);

      proLoc = gl.getUniformLocation(program, "projectionMatrix");
      mvLoc = gl.getUniformLocation(program, "modelViewMatrix");

      // Event listener for keyboard
      window.addEventListener("keydown", function (e) {
        switch (e.keyCode) {
          case 38:
            // upp ör
            eye[1] += shipSpeed;
            break;
          case 40:
            // niður ör
            eye[1] -= shipSpeed;
            break;
          case 37:
            // vinstri ör
            yaw += deltaAngle;
            break;
          case 39:
            // hægri ör
            yaw -= deltaAngle;
            break;
          case 88:
            // x
            bulletList.add(new Bullet());
            break;
          case 90:
            // z
            forward();
            break;
        }
      });

      render();
    };

    // Initialize asteroids
    var asteroidList = new List();
    for (var i = 1; i <= initialNumberOfAsteroids; i++) {
      asteroidList.add(new Asteroid(3));
    }

    var bulletList = new List();

    //  Render the view
    function render() {
      setTimeout(function () {
        window.requestAnimFrame(render);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        //  proj = perspective(fovy, aspect, near, far)
        var proj = perspective(75.0, 1.0, 0.2, 100.0);
        gl.uniformMatrix4fv(proLoc, false, flatten(proj));

        var currentAsteroid = asteroidList.start;
        while (currentAsteroid !== null) {

          var position = currentAsteroid.data.position;
          var realSize = refSize * currentAsteroid.data.size;
          var mv = mat4();
          mv = mult(mv, scalem(realSize, realSize, realSize));
          mv = mult(mv, rotateY(yaw));
          mv = mult(mv, translate(-eye[0], -eye[1], -eye[2]));
          mv = mult(mv, translate(position[0], position[1], position[2]));

          gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
          gl.drawArrays(gl.TRIANGLES, 0, NumVerticesAsteroid);

          currentAsteroid.data.changePosition();
          currentAsteroid.data.wrapIfOutOfBounds();

          currentAsteroid = currentAsteroid.next;
        }

        /*
        let currentBullet = bulletList.start;
        while (currentBullet !== null) {
           position = currentBullet.data.position;
           mv = pitchYawView(eye, pitch, yaw);
          mv = mult( mv, scalem(bulletSize, bulletSize, bulletSize));
          mv = mult( mv, translate(position[0], position[1], position[2]));
           gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
          gl.drawArrays( gl.TRIANGLES, NumVerticesAsteroid, NumVerticesSphere );
           currentBullet.data.changePosition();
          currentBullet.data.wrapIfOutOfBounds();
           currentBullet = currentBullet.next;
        }
         */
      }, 25);
    }
  }, { "quaternion": 1 }] }, {}, [2]);
//# sourceMappingURL=script.js.map