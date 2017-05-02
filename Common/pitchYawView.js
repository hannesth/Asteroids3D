
function pitchYawView( eye, p, y, xBodyAxis, yBodyAxis )
{
    var minusEye = [-eye[0], -eye[1], -eye[2]];

    var temp = translate(minusEye);
    temp = mult(temp, rotateX(p));
    temp = mult(temp, rotateY(y));
    
     
    return temp;
}