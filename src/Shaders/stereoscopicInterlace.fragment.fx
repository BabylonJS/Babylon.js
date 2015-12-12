precision highp float;

const vec3 TWO = vec3(2.0, 2.0, 2.0);

varying vec2 vUV;
uniform sampler2D camASampler;
uniform sampler2D textureSampler;
uniform vec2 stepSize;

void main(void)
{
    bool useCamB;
    vec2 texCoord1;
    vec2 texCoord2;
    
    vec3 frag1;
    vec3 frag2;
    
#ifdef IS_STEREOSCOPIC_HORIZ
	    useCamB = vUV.x > 0.5;
	    texCoord1 = vec2(useCamB ? (vUV.x - 0.5) * 2.0 : vUV.x * 2.0, vUV.y);
	    texCoord2 = vec2(texCoord1.x + stepSize.x, vUV.y);
#else
	    useCamB = vUV.y > 0.5;
	    texCoord1 = vec2(vUV.x, useCamB ? (vUV.y - 0.5) * 2.0 : vUV.y * 2.0);
	    texCoord2 = vec2(vUV.x, texCoord1.y + stepSize.y);
#endif
    
    // cannot assign a sampler to a variable, so must duplicate texture accesses
    if (useCamB){
        frag1 = texture2D(textureSampler, texCoord1).rgb;
        frag2 = texture2D(textureSampler, texCoord2).rgb;
    }else{
        frag1 = texture2D(camASampler   , texCoord1).rgb;
        frag2 = texture2D(camASampler   , texCoord2).rgb;
    }
    
    gl_FragColor = vec4((frag1 + frag2) / TWO, 1.0);
}