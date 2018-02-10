
function pitchYawView( eye, p, y)
{
    var minusEye = [-eye[0], -eye[1], -eye[2]];

    var temp = rotateX(p);
    temp = mult(temp, rotateY(y));
    temp = mult(temp,translate(minusEye));


    return temp;
}
