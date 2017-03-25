/////////////////////////////////////////////////////////////////
//      Asteroids in 3D 
//      based upon cube-tex.js 
//      by Hjálmtýr Hafsteinsson, mars 2017
//
//
/////////////////////////////////////////////////////////////////
/*

To-do list
- Wrap world 
- Multiple asteroids
- Spaceship
- Spaceship viewing angle
- Spaceship movement with arrow keys
- Collision detection for spaceship
- If collision Start at initial location
- Shooting mechanism
- Collision detection for shot
- If collision Split Asteroid into two asteroids one size smaller
- Point system

*/


var canvas;
var gl;

var NumVertices  = 36;

var program;
var texture;

var points = [];
var texCoords = [];

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var axis = 0;
var theta = [ 0, 0, 0 ];

var movement = false;     // Do we rotate?
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var maxNumber = 20;
var refSize = 0.2;
var refSpeed = 0.1;
var consoleCount = 0;

var viewBoxLength = 20.0;

var zDist = -4.0;

var proLoc;
var mvLoc;

function List() {
    this.start = null;
    this.end = null;

}

List.makeNode = function(){
    return {data:null, next:null};
};

List.prototype.add = function(data){
    if(this.start===null){
        this.start=List.makeNode();
        this.end=this.start;
    }
    else {
        this.end.next = List.makeNode();
        this.end = this.end.next;
    }
    this.end.data = data;
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
function Asteroid(size) {
    
    this.size = size;

    var pos = new Array(3);
    pos[0] = Math.random()*(2.0-size) - (2.0-size)/2.0;
    pos[1] = Math.random()*(2.0-size) - (2.0-size)/2.0;
    pos[2] = Math.random()*(2.0-size) - (2.0-size)/2.0;
    this.position = pos;

    var dir = new Array(2);
    dir[0] = Math.random()*360 - 180;
    dir[1] = Math.random()*180 - 90;
    this.direction = dir;

    this.speed = (4-this.size)*refSpeed;
}

Asteroid.prototype.setPosition = function(pos) {
        this.position = pos;
};

Asteroid.prototype.getSize = function() {
        return this.size;
};
Asteroid.prototype.getPosition = function() {
        return this.position;
};
Asteroid.prototype.getDirection = function() {
        return this.direction;
};
Asteroid.prototype.getSpeed = function() {
        return this.speed;
};
Asteroid.prototype.changePosition = function() {
        var position = this.position;
        var direction = this.direction;
        var speed = this.speed;

        var dPosition = new Array(3);
        var dx = speed*Math.cos(radians(direction[0]))*Math.cos(radians(direction[1]));
        var dy = speed*Math.sin(radians(direction[0]))*Math.cos(radians(direction[1]));
        var dz = speed*Math.cos(radians(direction[0]))*Math.sin(radians(direction[1]));
        dPosition = [dx, dy, dy];

        var sum = new Array(3);
        for(var i = 0; i <= 2; i++){
            sum[i] = position[i] + dPosition[i];
        }

        this.position = sum;
};

Asteroid.prototype.wrapIfOutOfBounds = function() {
    var pos = this.position;
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



function configureTexture( image ) {
    texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
}



// Initialize asteroids
var asteroidList = new List();
for(var i=1; i<= 10; i++){
    asteroidList.add(new Asteroid(3));
}


window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    colorCube();

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

/*    
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );
*/
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW );
    
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );

    var image = document.getElementById("texImage");
    configureTexture( image );

    proLoc = gl.getUniformLocation( program, "projection" );
    mvLoc = gl.getUniformLocation( program, "modelview" );
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);


    
    
    

    //event listeners for mouse
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault();         // Disable drag and drop
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
            spinY = ( spinY + (e.offsetX - origX) ) % 360;
            spinX = ( spinX + (origY - e.offsetY) ) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    } );
    
    // Event listener for keyboard
     window.addEventListener("keydown", function(e){
         switch( e.keyCode ) {
            case 38:    // upp ör
                zDist += 0.1;
                break;
            case 40:    // niður ör
                zDist -= 0.1;
                break;
         }
     }  );  

    // Event listener for mousewheel
     window.addEventListener("mousewheel", function(e){
         if( e.wheelDelta > 0.0 ) {
             zDist += 0.1;
         } else {
             zDist -= 0.1;
         }
     }  );  

    render();
}



function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

function quad(a, b, c, d) 
{
    var vertices = [
        vec3( -0.5, -0.5,  0.5 ),
        vec3( -0.5,  0.5,  0.5 ),
        vec3(  0.5,  0.5,  0.5 ),
        vec3(  0.5, -0.5,  0.5 ),
        vec3( -0.5, -0.5, -0.5 ),
        vec3( -0.5,  0.5, -0.5 ),
        vec3(  0.5,  0.5, -0.5 ),
        vec3(  0.5, -0.5, -0.5 )
    ];

    var texCo = [
        vec2(0, 0),
        vec2(0, 1),
        vec2(1, 1),
        vec2(1, 0)
    ];

    //vertex texture coordinates assigned by the index of the vertex
    var indices = [ a, b, c, a, c, d ];
    var texind  = [ 1, 0, 3, 1, 3, 2 ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        texCoords.push( texCo[texind[i]] );
    }
}

function render()
{
    setTimeout(function() {
        window.requestAnimFrame( render );
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        //  proj = perspective(fovy, aspect, near, far)
        var proj = perspective( 50.0, 1.0, 0.2, 100.0 );
        gl.uniformMatrix4fv(proLoc, false, flatten(proj));

        var mvStack = [];
        
        var mv = lookAt( vec3(0.0, 0.0, zDist), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0) );
        mv = mult( mv, rotate( parseFloat(spinX), [1, 0, 0] ) );
        mv = mult( mv, rotate( parseFloat(spinY), [0, 1, 0] ) );

        

        var position;
        var realSize;
        var currentAsteroid = asteroidList.start;
        while (currentAsteroid !== null) {
            mvStack.push(mv);

            position = currentAsteroid.data.getPosition();
            realSize = refSize*currentAsteroid.data.size;

            mv = mult( mv, translate(position[0], position[1], position[2]));
            mv = mult( mv, scalem(realSize, realSize, realSize));

            gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
            gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

            mv = mvStack.pop();

            console.log("position");
            console.log(position);
        
            currentAsteroid.data.changePosition();
            currentAsteroid.data.wrapIfOutOfBounds();

            currentAsteroid = currentAsteroid.next; 
        }

        
        

    }, 100)
}