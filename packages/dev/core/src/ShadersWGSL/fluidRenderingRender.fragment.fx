#define DISABLE_UNIFORMITY_ANALYSIS

// Index of refraction for water
#define IOR 1.333

// Ratios of air and water IOR for refraction
// Air to water
#define ETA 1.0/IOR

// Fresnel at 0°
#define F0 0.02

var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;
var depthSamplerSampler: sampler;
var depthSampler: texture_2d<f32>;
#ifdef FLUIDRENDERING_DIFFUSETEXTURE
    var diffuseSamplerSampler: sampler;
    var diffuseSampler: texture_2d<f32>;
#else
    uniform diffuseColor: vec3f;
#endif
#ifdef FLUIDRENDERING_FIXED_THICKNESS
    uniform thickness: f32;
    var bgDepthSamplerSampler: sampler;
    var bgDepthSampler: texture_2d<f32>;
#else
    uniform minimumThickness: f32;
    var thicknessSamplerSampler: sampler;
    var thicknessSampler: texture_2d<f32>;
#endif
#ifdef FLUIDRENDERING_ENVIRONMENT
    var reflectionSamplerSampler: sampler;
    var reflectionSampler: texture_cube<f32>;
#endif
#if defined(FLUIDRENDERING_DEBUG) && defined(FLUIDRENDERING_DEBUG_TEXTURE)
    var debugSamplerSampler: sampler;
    var debugSampler: texture_2d<f32>;
#endif

uniform viewMatrix: mat4x4f;
uniform projectionMatrix: mat4x4f;
uniform invProjectionMatrix: mat4x4f;
uniform texelSize: vec2f;
uniform dirLight: vec3f;
uniform cameraFar: f32;
uniform density: f32;
uniform refractionStrength: f32;
uniform fresnelClamp: f32;
uniform specularPower: f32;

varying vUV: vec2f;

fn computeViewPosFromUVDepth(texCoord: vec2f, depth: f32) -> vec3f {
    var ndc: vec4f = vec4f(texCoord * 2.0 - 1.0, 0.0, 1.0);
#ifdef FLUIDRENDERING_RHS
    ndc.z = -projectionMatrix[2].z + projectionMatrix[3].z / depth;
#else
    ndc.z = projectionMatrix[2].z + projectionMatrix[3].z / depth;
#endif
    ndc.w = 1.0;

    var eyePos: vec4f = uniforms.invProjectionMatrix * ndc;
    
    return eyePos.xyz / eyePos.w;
}

fn getViewPosFromTexCoord(texCoord: vec2f) -> vec3f {
    var depth: f32 = textureSampleLevel(depthSampler, depthSamplerSampler, texCoord, 0.).x;
    return computeViewPosFromUVDepth(texCoord, depth);
}

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var texCoord: vec2f = input.vUV;

#if defined(FLUIDRENDERING_DEBUG) && defined(FLUIDRENDERING_DEBUG_TEXTURE)
    var color: vec4f = textureSample(debugSampler, texCoord);
    #ifdef FLUIDRENDERING_DEBUG_DEPTH
        fragmentOutputs.color = vec4f(color.rgb / vec3(2.0), 1.);
        if (color.r > 0.999 && color.g > 0.999) {
            fragmentOutputs.color = textureSample(textureSampler, textureSamplerSampler, texCoord);
        }
    #else
        fragmentOutputs.color = vec4f(color.rgb, 1.);
        if (color.r < 0.001 && color.g < 0.001 && color.b < 0.001) {
            fragmentOutputs.color = textureSample(textureSampler, textureSamplerSampler, texCoord);
        }
    #endif
    return fragmentOutputs;
#endif

    var depthVel: vec2f = textureSampleLevel(depthSampler, depthSamplerSampler, texCoord, 0.).rg;
    var depth: f32 = depthVel.r;
#ifndef FLUIDRENDERING_FIXED_THICKNESS
    var thickness: f32 = textureSample(thicknessSampler, thicknessSamplerSampler, texCoord).x;
#else
    var bgDepth: f32 = textureSample(bgDepthSampler, bgDepthSamplerSampler, texCoord).x;
    var depthNonLinear: f32 = projectionMatrix[2].z + projectionMatrix[3].z / depth;
    depthNonLinear = depthNonLinear * 0.5 + 0.5;
#endif

    var backColor: vec4f = textureSample(textureSampler, textureSamplerSampler, texCoord);

#ifndef FLUIDRENDERING_FIXED_THICKNESS
    if (depth >= cameraFar || depth <= 0. || thickness <= minimumThickness) {
#else
    if (depth >= cameraFar || depth <= 0. || bgDepth <= depthNonLinear) {
#endif
    #ifdef FLUIDRENDERING_COMPOSITE_MODE
        fragmentOutputs.color = vec4f(backColor.rgb * backColor.a, backColor.a);
    #else
        fragmentOutputs.color = backColor;
    #endif
        return fragmentOutputs;
    }

    // calculate view-space position from depth
    var viewPos: vec3f = computeViewPosFromUVDepth(texCoord, depth);

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
#ifdef FLUIDRENDERING_RHS
    normal = -normal;
#endif
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
    vec3 diffuseColor = textureLod(diffuseSampler, texCoord, 0.0).rgb;
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

    vec4 transmitted = textureLod(textureSampler, vec2(texCoord + refractionDir.xy * thickness * refractionStrength), 0.0);
#ifdef FLUIDRENDERING_COMPOSITE_MODE
    if (transmitted.a == 0.) transmitted.a = thickness;
#endif
    vec3 transmittance = exp(-density * thickness * (1.0 - diffuseColor)); // Beer law
   
    vec3 refractionColor = transmitted.rgb * transmittance;

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

    glFragColor = vec4(finalColor, transmitted.a);
}
