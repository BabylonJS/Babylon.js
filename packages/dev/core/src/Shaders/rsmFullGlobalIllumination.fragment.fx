/**
 * The implementation is a direct application of the formula found in http://www.klayge.org/material/3_12/GI/rsm.pdf
*/
precision highp float;

varying vec2 vUV;

uniform mat4 rsmLightMatrix;
uniform vec4 rsmInfo;

uniform sampler2D textureSampler;
uniform sampler2D normalSampler;

uniform sampler2D rsmPositionW;
uniform sampler2D rsmNormalW;
uniform sampler2D rsmFlux;

#ifdef TRANSFORM_NORMAL
    uniform mat4 invView;
#endif

vec3 computeIndirect(vec3 p, vec3 n) {
    vec3 indirectDiffuse = vec3(0.);

    float intensity = rsmInfo.z;
    float edgeArtifactCorrection = rsmInfo.w;

    vec4 texRSM = rsmLightMatrix * vec4(p, 1.);
    texRSM.xy /= texRSM.w;
    texRSM.xy = texRSM.xy * 0.5 + 0.5;

    int width = int(rsmInfo.x);
    int height = int(rsmInfo.y);

    for (int j = 0; j < height; j++) {
        for (int i = 0; i < width; i++) {
            ivec2 uv = ivec2(i, j);

            vec3 vplPositionW = texelFetch(rsmPositionW, uv, 0).xyz;
            vec3 vplNormalW = texelFetch(rsmNormalW, uv, 0).xyz * 2.0 - 1.0;
            vec3 vplFlux = texelFetch(rsmFlux, uv, 0).rgb;

            vplPositionW -= vplNormalW * edgeArtifactCorrection; // avoid artifacts at edges

            float dist2 = dot(vplPositionW - p, vplPositionW - p);

            indirectDiffuse += vplFlux * max(0., dot(n, vplPositionW - p)) * max(0., dot(vplNormalW, p - vplPositionW)) / (dist2 * dist2);
        }
    }

    return clamp(indirectDiffuse * intensity, 0.0, 1.0);
}

void main(void) 
{
    vec3 positionW = texture2D(textureSampler, vUV).xyz;
    vec3 normalW = texture2D(normalSampler, vUV).xyz;
    #ifdef DECODE_NORMAL
        normalW = normalW * 2.0 - 1.0;
    #endif
    #ifdef TRANSFORM_NORMAL
        normalW = (invView * vec4(normalW, 0.)).xyz;
    #endif

    gl_FragColor.rgb = computeIndirect(positionW, normalW);
    gl_FragColor.a = 1.0;
}
