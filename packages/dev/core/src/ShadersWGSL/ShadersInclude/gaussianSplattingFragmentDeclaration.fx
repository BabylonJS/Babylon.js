fn gaussianColor(inColor: vec4f, inPosition: vec2f) -> vec4f
{
    var A : f32 = -dot(inPosition, inPosition);
    if (A > -4.0)
    {
        var B: f32 = exp(A) * inColor.a;

    #include<logDepthFragment>

        var color: vec3f = inColor.rgb;

    #ifdef FOG
        #include<fogFragment>
    #endif

        return vec4f(color, B);
    } else {
        return vec4f(0.0);
    }
}
