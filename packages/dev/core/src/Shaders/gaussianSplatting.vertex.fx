#include<__decl__gaussianSplattingVertex>

#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif

#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<logDepthDeclaration>

// Attributes
attribute vec2 position;
attribute float splatIndex;

// Uniforms
uniform vec2 viewport;
uniform vec2 dataTextureSize;
uniform vec2 focal;

uniform sampler2D covariancesATexture;
uniform sampler2D covariancesBTexture;
uniform sampler2D centersTexture;
uniform sampler2D colorsTexture;

// Output
varying vec4 vColor;
varying vec2 vPosition;

#if !defined(WEBGL2) && !defined(WEBGPU) && !defined(NATIVE)
mat3 transpose(mat3 matrix) {
    return mat3(matrix[0][0], matrix[1][0], matrix[2][0],
        matrix[0][1], matrix[1][1], matrix[2][1],
        matrix[0][2], matrix[1][2], matrix[2][2]);
}
#endif

vec2 getDataUV(float index, vec2 textureSize) {
    float y = floor(index / textureSize.x);
    float x = index - y * textureSize.x;
    return vec2((x + 0.5) / textureSize.x, (y + 0.5) / textureSize.y);
}

void main () {
    vec2 splatUV = getDataUV(splatIndex, dataTextureSize);
    vec3 center = texture2D(centersTexture, splatUV).xyz;
    vec4 color = texture2D(colorsTexture, splatUV);
    vec3 covA = texture2D(covariancesATexture, splatUV).xyz;
    vec3 covB = texture2D(covariancesBTexture, splatUV).xyz;

    vec4 worldPos = world * vec4(center, 1.0);

    mat4 modelView = view * world;
    vec4 camspace = view * worldPos;
    vec4 pos2d = projection * camspace;

    float bounds = 1.2 * pos2d.w;
    if (pos2d.z < -pos2d.w || pos2d.x < -bounds || pos2d.x > bounds
        || pos2d.y < -bounds || pos2d.y > bounds) {
        gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
        return;
    }

    mat3 Vrk = mat3(
        covA.x, covA.y, covA.z, 
        covA.y, covB.x, covB.y,
        covA.z, covB.y, covB.z
    );

    mat3 J = mat3(
        focal.x / camspace.z, 0., -(focal.x * camspace.x) / (camspace.z * camspace.z), 
        0., focal.y / camspace.z, -(focal.y * camspace.y) / (camspace.z * camspace.z), 
        0., 0., 0.
    );

    mat3 invy = mat3(1,0,0, 0,-1,0,0,0,1);

    mat3 T = invy * transpose(mat3(modelView)) * J;
    mat3 cov2d = transpose(T) * Vrk * T;

    float mid = (cov2d[0][0] + cov2d[1][1]) / 2.0;
    float radius = length(vec2((cov2d[0][0] - cov2d[1][1]) / 2.0, cov2d[0][1]));
    float lambda1 = mid + radius, lambda2 = mid - radius;

    if (lambda2 < 0.0) return;

    vec2 diagonalVector = normalize(vec2(cov2d[0][1], lambda1 - cov2d[0][0]));
    vec2 majorAxis = min(sqrt(2.0 * lambda1), 1024.0) * diagonalVector;
    vec2 minorAxis = min(sqrt(2.0 * lambda2), 1024.0) * vec2(diagonalVector.y, -diagonalVector.x);

    vColor = color;
    vPosition = position;
    vec2 vCenter = vec2(pos2d);
    gl_Position = vec4(
        vCenter 
        + (position.x * majorAxis * 1. / viewport 
        + position.y * minorAxis * 1. / viewport) * pos2d.w, pos2d.zw);

#include<clipPlaneVertex>
#include<fogVertex>
#include<logDepthVertex>
}
