/////////////////////////////////////////////////////////////////
//      Asteroids in 3D
//      based upon cube-tex.js
//      by Hjálmtýr Hafsteinsson, mars 2017
//
//
/////////////////////////////////////////////////////////////////


let canvas;
let gl;

let NumVertices = 36;

let program;

let points = [];
let colors = [];

let xAxis = 0;
let yAxis = 1;
let zAxis = 2;

let axis = 0;
let theta = [0, 0, 0];

let movement = false; // Do we rotate?
let spinX = 0;
let spinY = 0;
let origX;
let origY;

let maxNumber = 20;
let refSize = 0.2;
let refSpeed = 0.01;
let consoleCount = 0;

let viewBoxLength = 15.0;

let initialNumberOfAsteroids = 40;

let pitch = 0.0;
let yaw = 0.0;
let dPitch = 5.0;
let dYaw = 5.0;
let eye = [0.0, 0.0, 0.0];
let delta = 0.0;
let deltaAngle = 0.5;

let mv;

let axisRotationMatrix;

let proLoc;
let mvLoc;

var vertices = [vec4(-0.5, -0.5, 0.5, 1.0), vec4(-0.5, 0.5, 0.5, 1.0), vec4(0.5, 0.5, 0.5, 1.0), vec4(0.5, -0.5, 0.5, 1.0), vec4(-0.5, -0.5, -0.5, 1.0), vec4(-0.5, 0.5, -0.5, 1.0), vec4(0.5, 0.5, -0.5, 1.0), vec4(0.5, -0.5, -0.5, 1.0)];

// RGBA colors
var vertexColors = [vec4(0.0, 0.0, 0.0, 1.0), // black
vec4(1.0, 0.0, 0.0, 1.0), // red
vec4(1.0, 1.0, 0.0, 1.0), // yellow
vec4(0.0, 1.0, 0.0, 1.0), // green
vec4(0.0, 0.0, 1.0, 1.0), // blue
vec4(1.0, 0.0, 1.0, 1.0), // magenta
vec4(0.0, 1.0, 1.0, 1.0), // cyan
vec4(1.0, 1.0, 1.0, 1.0) // white
];

function quad(a, b, c, d) {
    colors.push(vertexColors[a]);
    points.push(vertices[a]);
    colors.push(vertexColors[a]);
    points.push(vertices[b]);
    colors.push(vertexColors[a]);
    points.push(vertices[c]);
    colors.push(vertexColors[a]);
    points.push(vertices[a]);
    colors.push(vertexColors[a]);
    points.push(vertices[c]);
    colors.push(vertexColors[a]);
    points.push(vertices[d]);
}

function colorCube() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

function List() {
    this.start = null;
    this.end = null;
}

List.makeNode = function () {
    return { data: null, next: null };
};

List.prototype.add = function (data) {
    if (this.start === null) {
        this.start = List.makeNode();
        this.end = this.start;
    } else {
        this.end.next = List.makeNode();
        this.end = this.end.next;
    }
    this.end.data = data;
};

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

    let pos = new Array(3);
    pos[0] = Math.random() * (viewBoxLength - this.size) - (viewBoxLength - this.size) / 2.0;
    pos[1] = Math.random() * (viewBoxLength - this.size) - (viewBoxLength - this.size) / 2.0;
    pos[2] = Math.random() * (viewBoxLength - this.size) - (viewBoxLength - this.size) / 2.0;
    this.position = pos;

    let dir = new Array(2);
    dir[0] = Math.random() * 360 - 180;
    dir[1] = Math.random() * 180 - 90;
    this.direction = dir;

    this.speed = (4 - this.size) * refSpeed;
}

Asteroid.prototype.setPosition = function (pos) {
    this.position = pos;
};

Asteroid.prototype.getSize = function () {
    return this.size;
};
Asteroid.prototype.getPosition = function () {
    return this.position;
};
Asteroid.prototype.getDirection = function () {
    return this.direction;
};
Asteroid.prototype.getSpeed = function () {
    return this.speed;
};
Asteroid.prototype.changePosition = function () {
    let position = this.position;
    let direction = this.direction;
    let speed = this.speed;

    let dPosition = new Array(3);
    let dx = speed * Math.cos(radians(direction[0])) * Math.cos(radians(direction[1]));
    let dy = speed * Math.sin(radians(direction[0])) * Math.cos(radians(direction[1]));
    let dz = speed * Math.cos(radians(direction[0])) * Math.sin(radians(direction[1]));
    dPosition = [dx, dy, dy];

    let sum = new Array(3);
    for (let i = 0; i <= 2; i++) {
        sum[i] = position[i] + dPosition[i];
    }

    this.position = sum;
};

Asteroid.prototype.wrapIfOutOfBounds = function () {
    let pos = this.position;
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

    colorCube();

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    let program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    let vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    proLoc = gl.getUniformLocation(program, "projectionMatrix");
    mvLoc = gl.getUniformLocation(program, "modelViewMatrix");

    // Event listener for keyboard
    window.addEventListener("keydown", function (e) {
        switch (e.keyCode) {
            case 38:
                // upp ör
                if (pitch < 90) {
                    pitch += deltaAngle;
                }
                break;
            case 40:
                // niður ör
                if (pitch > -90) {
                    pitch -= deltaAngle;
                }
                break;
            case 37:
                // vinstri ör
                yaw += deltaAngle;
                break;
            case 39:
                // hægri ör
                yaw -= deltaAngle;
                break;
            case 32:
                // bilstöng
                delta += 10;
                break;
        }
    });

    render();
};

// Initialize asteroids
let asteroidList = new List();
for (let i = 1; i <= initialNumberOfAsteroids; i++) {
    asteroidList.add(new Asteroid(3));
}

//  Render the view
function render() {
    setTimeout(function () {
        window.requestAnimFrame(render);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        //  proj = perspective(fovy, aspect, near, far)
        let proj = perspective(50.0, 1.0, 0.2, 100.0);
        gl.uniformMatrix4fv(proLoc, false, flatten(proj));

        let mvStack = [];

        mv = pitchYawView(eye, pitch, yaw);

        let position;
        let realSize;
        let currentAsteroid = asteroidList.start;
        while (currentAsteroid !== null) {
            mvStack.push(mv);

            position = currentAsteroid.data.getPosition();
            realSize = refSize * currentAsteroid.data.size;

            mv = mult(mv, translate(position[0], position[1], position[2]));
            mv = mult(mv, scalem(realSize, realSize, realSize));

            gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
            gl.drawArrays(gl.TRIANGLES, 0, NumVertices);

            mv = mvStack.pop();

            currentAsteroid.data.changePosition();
            currentAsteroid.data.wrapIfOutOfBounds();

            currentAsteroid = currentAsteroid.next;
        }
    }, 25);
}
//# sourceMappingURL=script.js.map