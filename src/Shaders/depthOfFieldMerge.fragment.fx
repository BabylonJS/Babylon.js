// samplers
uniform sampler2D textureSampler;
uniform sampler2D originalSampler;
uniform sampler2D circleOfConfusionSampler;

#if BLUR_LEVEL > 0
uniform sampler2D blurStep1;
#endif
#if BLUR_LEVEL > 1
uniform sampler2D blurStep2;
#endif
// varyings
varying vec2 vUV;

void main(void)
{
    float coc = texture2D(circleOfConfusionSampler, vUV).r;
    vec4 original = texture2D(originalSampler, vUV);
#if BLUR_LEVEL == 0
    vec4 blurred1 = texture2D(textureSampler, vUV);
    gl_FragColor = mix(original, blurred1, coc);
#endif
#if BLUR_LEVEL == 1
    vec4 blurred1 = texture2D(blurStep1, vUV);
    vec4 blurred2 = texture2D(textureSampler, vUV);    
    if(coc < 0.5){
        gl_FragColor = mix(original, blurred1, coc/0.5);
    }else{
        gl_FragColor = mix(blurred1, blurred2, (coc-0.5)/0.5);
    }
#endif
#if BLUR_LEVEL == 2
    vec4 blurred1 = texture2D(blurStep1, vUV);
    vec4 blurred2 = texture2D(blurStep2, vUV);
    vec4 blurred3 = texture2D(textureSampler, vUV);
    if(coc < 0.33){
        gl_FragColor = mix(original, blurred1, coc/0.33);
    }else if(coc < 0.66){
        gl_FragColor = mix(blurred1, blurred2, (coc-0.33)/0.33);
    }else{
        gl_FragColor = mix(blurred2, blurred3, (coc-0.66)/0.34);
    }
#endif
}
