uniform sampler2D textureSampler;
uniform sampler2D normalSampler;
uniform sampler2D positionSampler;
uniform sampler2D roughnessSampler; 

uniform mat4 view;
uniform mat4 projection;

uniform float threshold;
uniform float strength;
uniform float reflectionSpecularFalloffExponent;

// Varyings
varying vec2 vUV;

// Constants
const float step = 0.1;
const float minRayStep = 0.1;
const int maxSteps = 32;
const int numBinarySearchSteps = 5;

vec3 fresnelSchlick(float cosTheta, vec3 F0)
{
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

vec3 BinarySearch(vec3 dir, vec3 hitCoord)
{
    vec4 projectedCoord;
    float depth;

    for(int i = 0; i < numBinarySearchSteps; i++)
    {
        projectedCoord = projection * vec4(hitCoord, 1.0);
        projectedCoord.xy /= projectedCoord.w;
		projectedCoord.xy = 0.5 * projectedCoord.xy + vec2(0.5);
 
        depth = (view * texture2D(textureSampler, projectedCoord.xy)).z;

        float dDepth = hitCoord.z - depth;

        dir *= 0.5;
        if(dDepth < 0.0)
            hitCoord += dir;
        else
            hitCoord -= dir;    
    }

    projectedCoord = projection * vec4(hitCoord, 1.0);
    projectedCoord.xy /= projectedCoord.w;
	projectedCoord.xy = 0.5 * projectedCoord.xy + vec2(0.5);
 
    return vec3(projectedCoord.xy, depth);
}

vec4 RayMarch(vec3 dir, vec3 hitCoord)
{
    vec4 projectedCoord;
    float depth;

    for(int i = 0; i < maxSteps; i++)
    {
        hitCoord += dir;
 
        projectedCoord = projection * vec4(hitCoord, 1.0);
        projectedCoord.xy /= projectedCoord.w;
	    projectedCoord.xy = 0.5 * projectedCoord.xy + vec2(0.5);
 
        depth = (view * texture2D(positionSampler, projectedCoord.xy)).z;
 
        float dDepth = hitCoord.z - depth;

        if((dir.z - dDepth) < threshold)
        {
            if(dDepth > 0.0)
            {
                return vec4(BinarySearch(dir, hitCoord), 1.0);
            }
        }
    }
    
    return vec4(projectedCoord.xy, depth, 0.0);
}

void main()
{
    #ifdef SSR_SUPPORTED
    vec3 albedo = texture2D(textureSampler, vUV).rgb;
    vec3 normal = (texture2D(normalSampler, vUV)).xyz;
    vec3 position = (view * texture2D(positionSampler, vUV)).xyz;
    vec3 spec = texture2D(roughnessSampler, vUV).rgb * strength;

    vec3 F0 = vec3(0.04);
    F0      = mix(F0, albedo, spec);
    vec3 Fresnel = fresnelSchlick(max(dot(normalize(normal), normalize(position)), 0.0), F0);

    vec3 reflected = normalize(reflect(normalize(position), normalize(normal)));

    vec4 coords = RayMarch(reflected * max(minRayStep, -position.z), position);

    vec2 dCoords = smoothstep(0.2, 0.6, abs(vec2(0.5, 0.5) - coords.xy));
    float screenEdgefactor = clamp(1.0 - (dCoords.x + dCoords.y), 0.0, 1.0);
    float ReflectionMultiplier = pow(spec.r, reflectionSpecularFalloffExponent) * screenEdgefactor * reflected.z;

    vec3 SSR = texture2D(textureSampler, coords.xy).rgb * clamp(ReflectionMultiplier, 0.0, 0.9) * Fresnel;  

    gl_FragColor = vec4(/*albedo + */SSR * spec, 1.0);
    #else
    gl_FragColor = texture2D(textureSampler, vUV);
    #endif
}
