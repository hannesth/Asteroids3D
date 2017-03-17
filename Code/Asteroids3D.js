/////////////////////////////////////////////////////////////////
//    Verkefni 2 í Tölvugrafík
//    Game of Life in 3D
/////////////////////////////////////////////////////////////////


//
// Global Variables
//

var canvas;
var gl;

var numVertices  = 36;

var points = [];
var colors = [];

var height = 0.0;

var movement = false;     // Do we rotate?
var spinX = -45;
var spinY = -45;
var origX;
var origY;

var ctm;

// Size of view Box
var lengthViewBox = 1.7;

var near = -lengthViewBox;
var far = lengthViewBox;
var left = -lengthViewBox;
var right = lengthViewBox;
var ytop = lengthViewBox;
var bottom = -lengthViewBox;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;


var consoleCount = 0;

var timeToRender = 50;








//
// init function:
//


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
    
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

    
    



    // Event listener for keys up and down (zooming in and out)

    //Event listener for keyboard
    window.addEventListener("keydown", function(e){
        switch( e.keyCode ) {
            case 38: //efri ör
                if(lengthViewBox > 0.5) {
                    lengthViewBox *= 0.9;
                }
                break;
            case 40: //neðri ör
                lengthViewBox *= 1.1;
                break;
            default:
                lengthViewBox *= 1.0;

        }
    });




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
            spinX = ( spinX + (e.offsetY - origY) ) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    } );
    
    render();
}












//
// Several helper functions:
//



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

    var vertexColors = [
        [ 0.0, 0.0, 0.0, 1.0 ],  // black
        [ 1.0, 0.0, 0.0, 1.0 ],  // red
        [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
        [ 0.0, 1.0, 0.0, 1.0 ],  // green
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 0.5, 0.0, 0.5, 1.0 ],  // purple
        [ 1.0, 1.0, 1.0, 1.0 ]   // white
        [ 0.0, 0.0, 0.0, 1.0 ],  // black   
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices
    
    //vertex color assigned by the index of the vertex
    
    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        colors.push(vertexColors[indices[0]]);
        
    }
}
















//
// render function:
//

function render()
{
    setTimeout(function() {
        window.requestAnimFrame(render);
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        

        //  Projection Matrix   
        near = -lengthViewBox;
        far = lengthViewBox;
        left = -lengthViewBox;
        right = lengthViewBox;
        ytop = lengthViewBox;
        bottom = -lengthViewBox; 
        projectionMatrix = ortho(left, right, bottom, ytop, near, far);
        gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );

        


        // View rotations
        ctm = mat4();
        ctm = mult( ctm, rotateX(spinX) );
        ctm = mult( ctm, rotateY(spinY) ) ;

        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(ctm));
        gl.drawArrays( gl.TRIANGLES, 0, numVertices ); 


    }, timeToRender)
}

