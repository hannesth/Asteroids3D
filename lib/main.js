"use strict";

/*

  Asteroids in 3D
*/
var count1 = 1;
var Quaternion = require('quaternion');

var canvas = void 0;
var gl = void 0;

var NumVerticesSphere = 0;
var NumVerticesAsteroid = 36;

var count = 5;

var sphereIndex = 0;

var points = [];
var colors = [];

var va = vec4(0.0, 0.0, -1.0, 1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333, 1);

var shipSpeed = 0.04;

var refSize = 0.2;
var refSpeed = 0.01;

var bulletSize = 0.005;
var bulletSpeed = 0.03;

var viewBoxLength = 20.0;

var initialNumberOfAsteroids = 20;

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

var keyPressed = {};

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
  position[0] += speed * Math.cos(radians(direction[0])) * Math.cos(radians(direction[1]));
  position[1] += speed * Math.sin(radians(direction[0])) * Math.cos(radians(direction[1]));
  position[2] += speed * Math.cos(radians(direction[0])) * Math.sin(radians(direction[1]));
  return position;
}

function forward(pos, dir, speed) {
  pos[0] -= speed * Math.sin(radians(dir));
  pos[2] -= speed * Math.cos(radians(dir));
  return pos;
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
  var posB = eye.slice();
  posB[1] -= 2;
  this.position = posB;

  this.direction = yaw.valueOf();
}

Bullet.prototype.changePosition = function () {
  this.position = forward(this.position, this.direction, bulletSpeed);
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

function interf() {
  if (keyPressed["38"]) eye[1] += shipSpeed; // upp ör
  if (keyPressed["40"]) eye[1] -= shipSpeed; // niður ör
  if (keyPressed["37"]) yaw += deltaAngle; // vinstri ör
  if (keyPressed["39"]) yaw -= deltaAngle; // hægri ör
  if (keyPressed["88"]) bulletList.add(new Bullet()); // x
  if (keyPressed["90"]) eye = forward(eye, yaw, shipSpeed); // z
}

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
  window.addEventListener('keydown', function (e) {
    keyPressed[e.keyCode] = true;
  }, false);
  document.addEventListener('keyup', function (e) {
    keyPressed[e.keyCode] = false;
  }, false);

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

    interf();

    //  proj = perspective(fovy, aspect, near, far)
    var proj = perspective(75.0, 1.0, 0.01, 100.0);
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

    var currentBullet = bulletList.start;
    while (currentBullet !== null) {

      var _position = currentBullet.data.position;

      var _mv = mat4();
      _mv = mult(_mv, scalem(bulletSize, bulletSize, bulletSize));
      _mv = mult(_mv, rotateY(yaw));
      _mv = mult(_mv, translate(-eye[0], -eye[1], -eye[2]));
      _mv = mult(_mv, translate(_position[0], _position[1], _position[2]));

      gl.uniformMatrix4fv(mvLoc, false, flatten(_mv));
      gl.drawArrays(gl.TRIANGLES, NumVerticesAsteroid, NumVerticesSphere);

      currentBullet.data.changePosition();
      currentBullet.data.wrapIfOutOfBounds();

      currentBullet = currentBullet.next;
    }
  }, 25);
}
//# sourceMappingURL=main.js.map