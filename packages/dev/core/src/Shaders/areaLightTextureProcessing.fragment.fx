uniform vec2 texelSize; // The size of a single texel (1 / texture resolution)

uniform sampler2D textureSampler;

varying vec2 vUV;

vec4 BlurGaussian10(vec2 uv) {
    vec4 color = vec4(0.0, 0.0, 0.0, 0.0);
    float weights[5] = float[](
    0.001953125000,
	0.01757812500,
	0.07031250000,
	0.1640625000,
	0.2460937500);

    for (int i = 0; i < 5; i++) {
        color += texture2D(textureSampler, uv + vec2(0.0, texelSize.y * float(i))) * weights[i];
        color += texture2D(textureSampler, uv - vec2(0.0, texelSize.y * float(i))) * weights[i];
    }
    return color;
}

vec4 BlurGaussian20(vec2 uv) {
    vec4 color = vec4(0.0, 0.0, 0.0, 0.0);
    float weights[10] = float[](
        0.000001907348633,
	    0.00003623962402,
	    0.0003261566162,
	    0.001848220825,
	    0.007392883301,
	    0.02217864990,
	    0.05175018311,
	    0.09610748291,
	    0.1441612244,
	    0.1761970520);

    for (int i = 0; i < 10; i++) {
        color += texture2D(textureSampler, uv + vec2(0.0, texelSize.y * float(i))) * weights[i];
        color += texture2D(textureSampler, uv - vec2(0.0, texelSize.y * float(i))) * weights[i];
    }
    return color;
}

void main(void) 
{
    vec4 color = vec4(0.5, 0.5, 0.5, 0.5);

    if((vUV.x > 0.125 && vUV.x < 0.875) && (vUV.y > 0.125 && vUV.y < 0.875)){
        float x = (vUV.x - 0.125) / (0.875 - 0.125);
        float y = (vUV.y - 0.125) / (0.875 - 0.125);
        color = BlurGaussian10(vec2(x, y));
    }
    else{
        color = BlurGaussian20(vUV);
    }

    gl_FragColor = color;
}
