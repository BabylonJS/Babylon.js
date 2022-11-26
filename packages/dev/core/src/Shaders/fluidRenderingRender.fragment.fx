// Index of refraction for water
#define IOR 1.333

// Ratios of air and water IOR for refraction
// Air to water
#define ETA 1.0/IOR

// Fresnel at 0°
#define F0 0.02

uniform sampler2D textureSampler;
uniform sampler2D depthSampler;
#ifdef FLUIDRENDERING_DIFFUSETEXTURE
    uniform sampler2D diffuseSampler;
#else
    uniform vec3 diffuseColor;
#endif
#ifdef FLUIDRENDERING_FIXED_THICKNESS
    uniform float thickness;
    uniform sampler2D bgDepthSampler;
#else
    uniform float minimumThickness;
    uniform sampler2D thicknessSampler;
#endif
#ifdef FLUIDRENDERING_ENVIRONMENT
    uniform samplerCube reflectionSampler;
#endif
#if defined(FLUIDRENDERING_DEBUG) && defined(FLUIDRENDERING_DEBUG_TEXTURE)
    uniform sampler2D debugSampler;
#endif

uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 invProjectionMatrix;
uniform vec2 texelSize;
uniform vec3 dirLight;
uniform float cameraFar;
uniform float density;
uniform float refractionStrength;
uniform float fresnelClamp;
uniform float specularPower;

varying vec2 vUV;

vec3 computeViewPosFromUVDepth(vec2 texCoord, float depth) {
    vec4 ndc;
    
    ndc.xy = texCoord * 2.0 - 1.0;
    ndc.z = projectionMatrix[2].z + projectionMatrix[3].z / depth;
    ndc.w = 1.0;

    vec4 eyePos = invProjectionMatrix * ndc;
    eyePos.xyz /= eyePos.w;

    return eyePos.xyz;
}

vec3 getViewPosFromTexCoord(vec2 texCoord) {
    float depth = texture2D(depthSampler, texCoord).x;
    return computeViewPosFromUVDepth(texCoord, depth);
}

void main(void) {
    vec2 texCoord = vUV;

#if defined(FLUIDRENDERING_DEBUG) && defined(FLUIDRENDERING_DEBUG_TEXTURE)
    vec4 color = texture2D(debugSampler, texCoord);
    #ifdef FLUIDRENDERING_DEBUG_DEPTH
        glFragColor = vec4(color.rgb / vec3(2.0), 1.);
        if (color.r > 0.999 && color.g > 0.999) {
            glFragColor = texture2D(textureSampler, texCoord);
        }
    #else
        glFragColor = vec4(color.rgb, 1.);
        if (color.r < 0.001 && color.g < 0.001 && color.b < 0.001) {
            glFragColor = texture2D(textureSampler, texCoord);
        }
    #endif
    return;
#endif

    vec2 depthVel = texture2D(depthSampler, texCoord).rg;
    float depth = depthVel.r;
#ifndef FLUIDRENDERING_FIXED_THICKNESS
    float thickness = texture2D(thicknessSampler, texCoord).x;
#else
    float bgDepth = texture2D(bgDepthSampler, texCoord).x;
    float depthNonLinear = projectionMatrix[2].z + projectionMatrix[3].z / depth;
    depthNonLinear = depthNonLinear * 0.5 + 0.5;
#endif

    vec3 backColor = texture2D(textureSampler, texCoord).rgb;

#ifndef FLUIDRENDERING_FIXED_THICKNESS
    if (depth >= cameraFar || depth <= 0. || thickness <= minimumThickness) {
#else
    if (depth >= cameraFar || depth <= 0. || bgDepth <= depthNonLinear) {
#endif
        glFragColor = vec4(backColor, 1.);
        return;
    }

    // calculate view-space position from depth
    vec3 viewPos = computeViewPosFromUVDepth(texCoord, depth);

    // calculate normal
    vec3 ddx = getViewPosFromTexCoord(texCoord + vec2(texelSize.x, 0.)) - viewPos;
    vec3 ddy = getViewPosFromTexCoord(texCoord + vec2(0., texelSize.y)) - viewPos;

    vec3 ddx2 = viewPos - getViewPosFromTexCoord(texCoord + vec2(-texelSize.x, 0.));
    if (abs(ddx.z) > abs(ddx2.z)) {
        ddx = ddx2;
    }

    vec3 ddy2 = viewPos - getViewPosFromTexCoord(texCoord + vec2(0., -texelSize.y));
    if (abs(ddy.z) > abs(ddy2.z)) {
        ddy = ddy2;
    }

    vec3 normal = normalize(cross(ddy, ddx));
#ifndef WEBGPU
    if(isnan(normal.x) || isnan(normal.y) || isnan(normal.z) || isinf(normal.x) || isinf(normal.y) || isinf(normal.z)) {
        normal = vec3(0., 0., -1.);
    }
#endif

#if defined(FLUIDRENDERING_DEBUG) && defined(FLUIDRENDERING_DEBUG_SHOWNORMAL)
    glFragColor = vec4(normal * 0.5 + 0.5, 1.0);
    return;
#endif

    // shading
    vec3 rayDir = normalize(viewPos); // direction from camera position to view position

#ifdef FLUIDRENDERING_DIFFUSETEXTURE
    vec3 diffuseColor = texture2D(diffuseSampler, texCoord).rgb;
#endif

    vec3  lightDir = normalize(vec3(viewMatrix * vec4(-dirLight, 0.)));
    vec3  H        = normalize(lightDir - rayDir);
    float specular = pow(max(0.0, dot(H, normal)), specularPower);

#ifdef FLUIDRENDERING_DEBUG_DIFFUSERENDERING
    float diffuse  = max(0.0, dot(lightDir, normal)) * 1.0;

    glFragColor = vec4(vec3(0.1) /*ambient*/ + vec3(0.42, 0.50, 1.00) * diffuse + vec3(0, 0, 0.2) + specular, 1.);
    return;
#endif

    // Refraction color
    vec3 refractionDir = refract(rayDir, normal, ETA);

    vec3 transmitted = (texture2D(textureSampler, vec2(texCoord + refractionDir.xy * thickness * refractionStrength)).rgb);
    vec3 transmittance = exp(-density * thickness * (1.0 - diffuseColor)); // Beer law
   
    vec3 refractionColor = transmitted * transmittance;

#ifdef FLUIDRENDERING_ENVIRONMENT
    // Reflection of the environment.
    vec3 reflectionDir = reflect(rayDir, normal);
    vec3 reflectionColor = (textureCube(reflectionSampler, reflectionDir).rgb);

    // Combine refraction and reflection    
    float fresnel = clamp(F0 + (1.0 - F0) * pow(1.0 - dot(normal, -rayDir), 5.0), 0., fresnelClamp);
    
    vec3 finalColor = mix(refractionColor, reflectionColor, fresnel) + specular;
#else
    vec3 finalColor = refractionColor + specular;
#endif

#ifdef FLUIDRENDERING_VELOCITY
    float velocity = depthVel.g;
    finalColor = mix(finalColor, vec3(1.0), smoothstep(0.3, 1.0, velocity / 6.0));
#endif

    glFragColor = vec4(finalColor, 1.);
}
