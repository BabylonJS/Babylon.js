/**
 * The implementation is an application of the formula found in http://www.klayge.org/material/3_12/GI/rsm.pdf
 * For better results, it also adds a random (noise) rotation to the RSM samples (the noise artifacts are easier to remove than the banding artifacts).
*/
precision highp float;

varying vec2 vUV;

uniform mat4 rsmLightMatrix;
uniform vec4 rsmInfo;
uniform vec4 rsmInfo2;

uniform sampler2D textureSampler;
uniform sampler2D normalSampler;

uniform sampler2D rsmPositionW;
uniform sampler2D rsmNormalW;
uniform sampler2D rsmFlux;
uniform sampler2D rsmSamples;

#ifdef TRANSFORM_NORMAL
    uniform mat4 invView;
#endif

float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

float noise(vec3 p){
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
}

vec3 computeIndirect(vec3 p, vec3 n) {
    vec3 indirectDiffuse = vec3(0.);

    int numSamples = int(rsmInfo.x);
    float radius = rsmInfo.y;
    float intensity = rsmInfo.z;
    float edgeArtifactCorrection = rsmInfo.w;

    vec4 texRSM = rsmLightMatrix * vec4(p, 1.);
    texRSM.xy /= texRSM.w;
    texRSM.xy = texRSM.xy * 0.5 + 0.5;

    float angle = noise(p * rsmInfo2.x);
    float c = cos(angle);
    float s = sin(angle);

    for (int i = 0; i < numSamples; i++) {
        vec3 rsmSample = texelFetch(rsmSamples, ivec2(i, 0), 0).xyz;
        float weightSquare = rsmSample.z;

        if (rsmInfo2.y == 1.0) rsmSample.xy = vec2(rsmSample.x * c + rsmSample.y * s, -rsmSample.x * s + rsmSample.y * c);

        vec2 uv = texRSM.xy + rsmSample.xy * radius;

        if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) continue;

        vec3 vplPositionW = textureLod(rsmPositionW, uv, 0.).xyz;
        vec3 vplNormalW = textureLod(rsmNormalW, uv, 0.).xyz * 2.0 - 1.0;
        vec3 vplFlux = textureLod(rsmFlux, uv, 0.).rgb;

        vplPositionW -= vplNormalW * edgeArtifactCorrection; // avoid artifacts at edges

        float dist2 = dot(vplPositionW - p, vplPositionW - p);

        indirectDiffuse += vplFlux * weightSquare * max(0., dot(n, vplPositionW - p)) * max(0., dot(vplNormalW, p - vplPositionW)) / (dist2 * dist2);
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
