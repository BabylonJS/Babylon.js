uniform sampler2D textureSampler;
varying vec2 vUV;

uniform sampler2D circleOfConfusionSampler;
uniform sampler2D blurStep0;

#if BLUR_LEVEL > 0
uniform sampler2D blurStep1;
#endif
#if BLUR_LEVEL > 1
uniform sampler2D blurStep2;
#endif

void main(void)
{
    float coc = texture2D(circleOfConfusionSampler, vUV).r;
#if BLUR_LEVEL == 0
    vec4 original = texture2D(textureSampler, vUV);
    vec4 blurred0 = texture2D(blurStep0, vUV);
    gl_FragColor = mix(original, blurred0, coc);
#endif
#if BLUR_LEVEL == 1
    if(coc < 0.5){
        vec4 original = texture2D(textureSampler, vUV);
        vec4 blurred1 = texture2D(blurStep1, vUV);
        gl_FragColor = mix(original, blurred1, coc/0.5);
    }else{
        vec4 blurred0 = texture2D(blurStep0, vUV);   
        vec4 blurred1 = texture2D(blurStep1, vUV);
        gl_FragColor = mix(blurred1, blurred0, (coc-0.5)/0.5);
    }
#endif
#if BLUR_LEVEL == 2
    if(coc < 0.33){
        vec4 original = texture2D(textureSampler, vUV);
        vec4 blurred2 = texture2D(blurStep2, vUV);
        gl_FragColor = mix(original, blurred2, coc/0.33);
    }else if(coc < 0.66){
        vec4 blurred1 = texture2D(blurStep1, vUV);
        vec4 blurred2 = texture2D(blurStep2, vUV);
        gl_FragColor = mix(blurred2, blurred1, (coc-0.33)/0.33);
    }else{
        vec4 blurred0 = texture2D(blurStep0, vUV);
        vec4 blurred1 = texture2D(blurStep1, vUV);
        gl_FragColor = mix(blurred1, blurred0, (coc-0.66)/0.34);
    }
#endif
}
