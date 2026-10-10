fn gaussianColor(inColor: vec4f, inPosition: vec2f) -> vec4f
{
    var A : f32 = -dot(inPosition, inPosition);
    if (A > -4.0)
    {
        var B: f32 = exp(A) * inColor.a;

    #include<logDepthFragment>

        var color: vec4f = vec4f(inColor.rgb, B);

    #ifdef FOG
        #include<fogFragment>
    #endif

        return color;
    } else {
        return vec4f(0.0);
    }
}
