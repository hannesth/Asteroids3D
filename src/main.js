/*

  Asteroids in 3D
*/

const Quaternion = require('quaternion');

let canvas;
let gl;

let NumVerticesSphere = 0;
let NumVerticesAsteroid = 36;

let count = 7;

const sphereIndex = 0;

const points = [];
const colors = [];

const va = vec4(0.0, 0.0, -1.0,1);
const vb = vec4(0.0, 0.942809, 0.333333, 1);
const vc = vec4(-0.816497, -0.471405, 0.333333, 1);
const vd = vec4(0.816497, -0.471405, 0.333333,1);

const shipSpeed = 0.02;

const refSize = 0.2;
const refSpeed = 0.01;

const bulletSize = 0.02;
const bulletSpeed = 0.02;

const viewBoxLength = 15.0;

const initialNumberOfAsteroids = 40;

let pitch = 0.0;
let yaw = 0.0;
let roll = 0.0;
let eye = [0.0, 0.0, 0.0];
let pitchAxis = [1.0, 0.0, 0.0];
let yawAxis = [0.0, 1.0, 0.0];
let rollAxis = [0.0, 0.0, -1.0];
const deltaAngle = 1;


let proLoc;
let mvLoc;

const vertices = [
  vec4( -0.5, -0.5,  0.5, 1.0 ),
  vec4( -0.5,  0.5,  0.5, 1.0 ),
  vec4(  0.5,  0.5,  0.5, 1.0 ),
  vec4(  0.5, -0.5,  0.5, 1.0 ),
  vec4( -0.5, -0.5, -0.5, 1.0 ),
  vec4( -0.5,  0.5, -0.5, 1.0 ),
  vec4(  0.5,  0.5, -0.5, 1.0 ),
  vec4(  0.5, -0.5, -0.5, 1.0 )
];

function triangle(a, b, c) {

  points.push(a);
  points.push(b);
  points.push(c);

  NumVerticesSphere+= 3;
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
  quad( 1, 0, 3, 2 );
  quad( 2, 3, 7, 6 );
  quad( 3, 0, 4, 7 );
  quad( 6, 5, 1, 2 );
  quad( 4, 5, 6, 7 );
  quad( 5, 4, 0, 1 );
}

function divideTriangle(a, b, c, count) {
  if ( count > 0 ) {

    var ab = mix( a, b, 0.5);
    var ac = mix( a, c, 0.5);
    var bc = mix( b, c, 0.5);

    ab = normalize(ab, true);
    ac = normalize(ac, true);
    bc = normalize(bc, true);

    divideTriangle( a, ab, ac, count - 1 );
    divideTriangle( ab, b, bc, count - 1 );
    divideTriangle( bc, c, ac, count - 1 );
    divideTriangle( ab, bc, ac, count - 1 );
  }
  else {
    triangle( a, b, c );
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
  return { data: null, next: null, prev: null, id: null};
};

List.prototype.add = function(data) {
  if (this.start===null){
    this.start=List.makeNode();
    this.end=this.start;
  } else {
    this.end.next = List.makeNode();
    this.end.next.prev = this.end;
    this.end = this.end.next;
  }
  this.end.data = data;
}

List.prototype.remove = function(id) {
  let jo = this.start;

  while (jo != null) {
    if (jo.id === id) {
      jo.prev.next = jo.next;
    } else {
      jo = jo.next;
    }
  }
}

function changePos(position, direction, speed) {
  let dPosition = new Array(3);
  let dx = speed*Math.cos(radians(direction[0]))*Math.cos(radians(direction[1]));
  let dy = speed*Math.sin(radians(direction[0]))*Math.cos(radians(direction[1]));
  let dz = speed*Math.cos(radians(direction[0]))*Math.sin(radians(direction[1]));
  dPosition = [dx, dy, dy];

  let sum = new Array(3);
  for(let i = 0; i <= 2; i++){
      sum[i] = position[i] + dPosition[i];
  }

  return sum;
}


function forward() {
  eye[0] =  eye[0] - shipSpeed*Math.sin(radians(yaw));
  eye[2] =  eye[2] - shipSpeed*Math.cos(radians(yaw));
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

  this.size = Math.floor(Math.random()*3.0) + 1.0;

  let pos = new Array(3);
  pos[0] = Math.random()*(viewBoxLength-this.size) - (viewBoxLength-this.size)/2.0;
  pos[1] = Math.random()*(viewBoxLength-this.size) - (viewBoxLength-this.size)/2.0;
  pos[2] = Math.random()*(viewBoxLength-this.size) - (viewBoxLength-this.size)/2.0;
  this.position = pos;

  let dir = new Array(2);
  dir[0] = Math.random()*360 - 180;
  dir[1] = Math.random()*180 - 90;
  this.direction = dir;

  this.speed = (4-this.size)*refSpeed;
}
Asteroid.prototype.changePosition = function() {
  this.position = changePos(this.position, this.direction, this.speed);
};

Asteroid.prototype.wrapIfOutOfBounds = function() {
  let pos = this.position;
  if(pos[0] < -viewBoxLength){
      pos[0] = viewBoxLength;
  }
  if(pos[0] > viewBoxLength){
      pos[0] = -viewBoxLength;
  }
  if(pos[1] < -viewBoxLength){
      pos[1] = viewBoxLength;
  }
  if(pos[1] > viewBoxLength){
      pos[1] = -viewBoxLength;
  }
  if(pos[2] < -viewBoxLength){
      pos[2] = viewBoxLength;
  }
  if(pos[2] > viewBoxLength){
      pos[2] = -viewBoxLength;
  }

  this.position = pos;
};

function Bullet() {
  this.position = eye;

  this.direction = [yaw, pitch];
}

Bullet.prototype.changePosition = function() {
  console.log(this.position);
  this.position = changePos(this.position, this.direction, bulletSpeed);
};

Bullet.prototype.wrapIfOutOfBounds = function() {
  let pos = this.position;
  if(pos[0] < -viewBoxLength){
      pos[0] = viewBoxLength;
  }
  if(pos[0] > viewBoxLength){
      pos[0] = -viewBoxLength;
  }
  if(pos[1] < -viewBoxLength){
      pos[1] = viewBoxLength;
  }
  if(pos[1] > viewBoxLength){
      pos[1] = -viewBoxLength;
  }
  if(pos[2] < -viewBoxLength){
      pos[2] = viewBoxLength;
  }
  if(pos[2] > viewBoxLength){
      pos[2] = -viewBoxLength;
  }

  this.position = pos;
};

window.onload = function init()
{
  canvas = document.querySelector( "canvas" );

  gl = WebGLUtils.setupWebGL( canvas );
  if ( !gl ) { alert( "WebGL isn't available" ); }

  // insert vertices into array: points
  cube();
  tetrahedron(va, vb, vc, vd, count);

  gl.viewport( 0, 0, canvas.width, canvas.height );
  gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

  gl.enable(gl.DEPTH_TEST);

  //
  //  Load shaders and initialize attribute buffers
  //
  let program = initShaders( gl, "vertex-shader", "fragment-shader" );
  gl.useProgram( program );

  let vBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

  let vPosition = gl.getAttribLocation( program, "vPosition" );
  gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vPosition );

  proLoc = gl.getUniformLocation( program, "projectionMatrix" );
  mvLoc = gl.getUniformLocation( program, "modelViewMatrix" );

  // Event listener for keyboard
  window.addEventListener("keydown", function(e){
    switch( e.keyCode ) {
      case 38:    // upp ör
          eye[1] += shipSpeed;
          break;
      case 40:    // niður ör
          eye[1] -= shipSpeed;
          break;
      case 37:    // vinstri ör
          yaw += deltaAngle;
          break;
      case 39:    // hægri ör
          yaw -= deltaAngle;
          break;
      case 88:    // x
          bulletList.add(new Bullet());
          break;
      case 90:    // z
          forward();
          break;
    }
  });

  render();
}


// Initialize asteroids
let asteroidList = new List();
for(let i=1; i <= initialNumberOfAsteroids; i++){
  asteroidList.add(new Asteroid(3));
}

let bulletList = new List();

//  Render the view
function render()
{
  setTimeout(function() {
      window.requestAnimFrame( render );
      gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      //  proj = perspective(fovy, aspect, near, far)
      let proj = perspective( 75.0, 1.0, 0.2, 100.0 );
      gl.uniformMatrix4fv(proLoc, false, flatten(proj));


      let currentAsteroid = asteroidList.start;
      while (currentAsteroid !== null) {

        let position = currentAsteroid.data.position;
        let realSize = refSize*currentAsteroid.data.size;
        let mv = mat4();
        mv = mult(mv, scalem(realSize, realSize, realSize));
        mv = mult(mv, rotateY(yaw));
        mv = mult(mv, translate(-eye[0], -eye[1], -eye[2]));
        mv = mult(mv, translate(position[0], position[1], position[2]));


        gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
        gl.drawArrays( gl.TRIANGLES, 0, NumVerticesAsteroid );

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

  }, 25)
}
