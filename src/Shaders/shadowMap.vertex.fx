// Attribute
attribute vec3 position;

#ifdef NORMAL
    attribute vec3 normal;
#endif

#include<bonesDeclaration>

#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]

// Uniforms
#include<instancesDeclaration>
#include<helperFunctions>

uniform mat4 viewProjection;

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

#include<shadowMapVertexDeclaration>

#include<clipPlaneVertexDeclaration>

void main(void)
{
vec3 positionUpdated = position;
#ifdef UV1
    vec2 uvUpdated = uv;
#endif  
#ifdef NORMAL	
	vec3 normalUpdated = normal;
#endif

#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]

#include<instancesVertex>
#include<bonesVertex>

vec4 worldPos = finalWorld * vec4(positionUpdated, 1.0);

#ifdef NORMAL
    mat3 normWorldSM = mat3(finalWorld);

    #ifdef NONUNIFORMSCALING
        normWorldSM = transposeMat3(inverseMat3(normWorldSM));
    #endif

    vec3 vNormalW = normalize(normWorldSM * normalUpdated);
#endif

#include<shadowMapVertexNormalBias>

// Projection.
gl_Position = viewProjection * worldPos;

#include<shadowMapVertexMetric>

#ifdef ALPHATEST
    #ifdef UV1
        vUV = vec2(diffuseMatrix * vec4(uvUpdated, 1.0, 0.0));
    #endif
    #ifdef UV2
        vUV = vec2(diffuseMatrix * vec4(uv2, 1.0, 0.0));
    #endif
#endif

#include<clipPlaneVertex>

}