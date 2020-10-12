// Screen Space Reflection Post-Process based on the tutorial
// http://imanolfotia.com/blog/update/2017/03/11/ScreenSpaceReflections.html

uniform sampler2D textureSampler;
uniform sampler2D normalSampler;
uniform sampler2D positionSampler;
uniform sampler2D reflectivitySampler;

uniform mat4 view;
uniform mat4 projection;

uniform float step;
uniform float strength;
uniform float threshold;
uniform float roughnessFactor;
uniform float reflectionSpecularFalloffExponent;

// Varyings
varying vec2 vUV;

// Structs
struct ReflectionInfo {
    vec3 color;
    vec4 coords;
};

/**
 * According to specular, see https://en.wikipedia.org/wiki/Schlick%27s_approximation
 */
vec3 fresnelSchlick(float cosTheta, vec3 F0)
{
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

/**
 * Once the pixel's coordinates has been found, let's adjust (smooth) a little bit
 * by sampling multiple reflection pixels.
 */
ReflectionInfo smoothReflectionInfo(vec3 dir, vec3 hitCoord)
{
    ReflectionInfo info;
    info.color = vec3(0.0);

    vec4 projectedCoord;
    float sampledDepth;

    for(int i = 0; i < SMOOTH_STEPS; i++)
    {
        projectedCoord = projection * vec4(hitCoord, 1.0);
        projectedCoord.xy /= projectedCoord.w;
		projectedCoord.xy = 0.5 * projectedCoord.xy + vec2(0.5);
 
        sampledDepth = (view * texture2D(positionSampler, projectedCoord.xy)).z;

        float depth = sampledDepth - hitCoord.z;

        dir *= 0.5;
        if(depth > 0.0)
            hitCoord -= dir;
        else
            hitCoord += dir;

        info.color += texture2D(textureSampler, projectedCoord.xy).rgb;
    }

    projectedCoord = projection * vec4(hitCoord, 1.0);
    projectedCoord.xy /= projectedCoord.w;
	projectedCoord.xy = 0.5 * projectedCoord.xy + vec2(0.5);
 
    // Merge colors
    info.coords = vec4(projectedCoord.xy, sampledDepth, 1.0);
    info.color += texture2D(textureSampler, projectedCoord.xy).rgb;
    info.color /= float(SMOOTH_STEPS + 1);
    return info;
}

/**
 * Tests the given world position (hitCoord) according to the given reflection vector (dir)
 * until it finds a collision (means that depth is enough close to say "it's the pixel to sample!").
 */
ReflectionInfo getReflectionInfo(vec3 dir, vec3 hitCoord)
{
    ReflectionInfo info;
    vec4 projectedCoord;
    float sampledDepth;

    dir *= step;

    for(int i = 0; i < REFLECTION_SAMPLES; i++)
    {
        hitCoord += dir;

        projectedCoord = projection * vec4(hitCoord, 1.0);
        projectedCoord.xy /= projectedCoord.w;
	    projectedCoord.xy = 0.5 * projectedCoord.xy + vec2(0.5);
 
        sampledDepth = (view * texture2D(positionSampler, projectedCoord.xy)).z;
 
        float depth = sampledDepth - hitCoord.z;

        if(((depth - dir.z) < threshold) && depth <= 0.0)
        {
            #ifdef ENABLE_SMOOTH_REFLECTIONS
                return smoothReflectionInfo(dir, hitCoord);
            #else
                info.color = texture2D(textureSampler, projectedCoord.xy).rgb;
                info.coords = vec4(projectedCoord.xy, sampledDepth, 0.0);
                return info;
            #endif
        }
    }
    
    info.color = texture2D(textureSampler, projectedCoord.xy).rgb;
    info.coords = vec4(projectedCoord.xy, sampledDepth, 0.0);
    return info;
}

vec3 hash(vec3 a)
{
    a = fract(a * 0.8);
    a += dot(a, a.yxz + 19.19);
    return fract((a.xxy + a.yxx) * a.zyx);
}

void main()
{
    #ifdef SSR_SUPPORTED
        // Intensity
        vec4 albedoFull = texture2D(textureSampler, vUV);
        vec3 albedo = albedoFull.rgb;
        float spec = texture2D(reflectivitySampler, vUV).r;
        if (spec == 0.0) {
            gl_FragColor = albedoFull;
            return;
        }
        
        // Get coordinates of the pixel to pick according to the pixel's position and normal.
        #ifdef PREPASS_LAYOUT
        vec3 normal = (texture2D(normalSampler, vUV)).gba;
        #else
        vec3 normal = (texture2D(normalSampler, vUV)).xyz;
        #endif
        vec3 position = (view * texture2D(positionSampler, vUV)).xyz;
        vec3 reflected = normalize(reflect(normalize(position), normalize(normal)));

        float roughness = 1.0 - texture2D(reflectivitySampler, vUV).a;
        vec3 jitt = mix(vec3(0.0), hash(position), roughness) * roughnessFactor;
        
        ReflectionInfo info = getReflectionInfo(jitt + reflected, position);
        // ReflectionInfo info = getReflectionInfo(reflected, position); // For debug: no roughness

        vec2 dCoords = smoothstep(0.2, 0.6, abs(vec2(0.5, 0.5) - info.coords.xy));
        float screenEdgefactor = clamp(1.0 - (dCoords.x + dCoords.y), 0.0, 1.0);

        // Fresnel
        vec3 F0 = vec3(0.04);
        F0      = mix(F0, albedo, spec);
        vec3 fresnel = fresnelSchlick(max(dot(normalize(normal), normalize(position)), 0.0), F0);

        // Apply
        float reflectionMultiplier = clamp(pow(spec * strength, reflectionSpecularFalloffExponent) * screenEdgefactor * reflected.z, 0.0, 0.9);
        float albedoMultiplier = 1.0 - reflectionMultiplier;
        vec3 SSR = info.color * fresnel;

        gl_FragColor = vec4((albedo * albedoMultiplier) + (SSR * reflectionMultiplier), albedoFull.a);
    #else
        gl_FragColor = texture2D(textureSampler, vUV);
    #endif
}
