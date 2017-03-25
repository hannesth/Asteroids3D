
function rpyView( eye, r, p, y )
{
    /*
    if ( !Array.isArray(eye) || eye.length != 3) {
        throw "rpyView(): first parameter [eye] must be an a vec3";
    }

    if ( isNan(r) || r < -90 || r > 90) {
        throw "rpyView(): second parameter [r] must be a number between -90 and 90";
    }
    
    if ( isNan(p) || p < -90 || p > 90) {
        throw "rpyView(): third parameter [p] must be a number between -90 and 90";
    }

    if ( isNan(y) || y < 0 || y > 360) {
        throw "rpyView(): fourth parameter [y] must be a number between 0 and 360";
    }
    */


    var temp = rotateX(p);
    temp *= rotateY(y);
    temp *= rotateZ(r);
    temp *=translate(-eye);

    return temp;
}