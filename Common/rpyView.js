
function rpyView( eye, r, p, y )
{
    var minusEye = [-eye[0], -eye[1], -eye[2]];

    var temp = translate(minusEye);
    temp = mult(temp, rotateZ(r));
    temp = mult(temp, rotateY(y));
    temp = mult(temp, rotateX(p));
     
    return temp;
}