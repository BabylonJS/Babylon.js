// Attribute
attribute vec3 position;

#ifdef NORMAL
    attribute vec3 normal;
    uniform vec3 lightData;
#endif

#include<bonesDeclaration>

#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]

// Uniforms
#include<instancesDeclaration>
#include<helperFunctions>

uniform mat4 viewProjection;
uniform vec3 biasAndScale;
uniform vec2 depthValues;

varying float vDepthMetric;

#ifdef ALPHATEST
varying vec2 vUV;
uniform mat4 diffuseMatrix;
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#endif

void main(void)
{
vec3 positionUpdated = position;
#ifdef UV1
    vec2 uvUpdated = uv;
#endif  

#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]

#include<instancesVertex>
#include<bonesVertex>

vec4 worldPos = finalWorld * vec4(positionUpdated, 1.0);

// Normal inset Bias.
#ifdef NORMAL
    mat3 normalWorld = mat3(finalWorld);

    #ifdef NONUNIFORMSCALING
        normalWorld = transposeMat3(inverseMat3(normalWorld));
    #endif

    vec3 worldNor = normalize(normalWorld * normal);

    #ifdef DIRECTIONINLIGHTDATA
        vec3 worldLightDir = normalize(-lightData.xyz);
    #else
        vec3 directionToLight = lightData.xyz - worldPos.xyz;
        vec3 worldLightDir = normalize(directionToLight);
    #endif

    float ndl = dot(worldNor, worldLightDir);
    float sinNL = sqrt(1.0 - ndl * ndl);
    float normalBias = biasAndScale.y * sinNL;

    worldPos.xyz -= worldNor * normalBias;
#endif

// Projection.
gl_Position = viewProjection * worldPos;

#ifdef DEPTHTEXTURE
    // Depth texture Linear bias.
    gl_Position.z += biasAndScale.x * gl_Position.w;
#endif

    // Color Texture Linear bias.
    vDepthMetric = ((gl_Position.z + depthValues.x) / (depthValues.y)) + biasAndScale.x;

#ifdef ALPHATEST
    #ifdef UV1
        vUV = vec2(diffuseMatrix * vec4(uvUpdated, 1.0, 0.0));
    #endif
    #ifdef UV2
        vUV = vec2(diffuseMatrix * vec4(uv2, 1.0, 0.0));
    #endif
#endif
}