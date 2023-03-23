varying vec3 vColor;
void main()
{
     // Disc
     /*
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength = step(0.5, strength);
    strength = 1.0 - strength;*/

    // Diffuse point
    /*
        float strength = distance(gl_PointCoord, vec2(0.5));
        strength *= 2.0;
        strength = 1.0 - strength;
    */

    // Light point
    // 距离 0.5（中心点） 越远，alpha值就越小，也就是说不明亮
    float strength = distance(gl_PointCoord, vec2(0.5));
    // 
    strength = 1.0 - strength;
    // strength作10次方
    strength = pow(strength, 10.0);

    // Final color 
    // Linearly interpolate between two values. 两个值之间的中心差值
    vec3 color = mix(vec3(0.0), vColor, strength);

    gl_FragColor = vec4(color, 1.0);

    // we already have access to the UV in the fragment shader with gl_PointCoord
    // gl_FragColor = vec4(gl_PointCoord, 1.0, 1.0);   
    
}