precision highp float;

#include<helperFunctions>

// Attributes
attribute vec3 position;

uniform mat4 projection, modelView;
uniform vec2 viewport;

// Uniforms
#include<instancesDeclaration>

// Output
varying vec3 vPositionW;
varying vec4 vColor;

#define CUSTOM_VERTEX_DEFINITIONS

void main(void) {

#define CUSTOM_VERTEX_MAIN_BEGIN

    vec3 center = world0.xyz;
    vec4 color = world1;
    vec3 covA = world2.xyz;
    vec3 covB = world3.xyz;

    vec4 camspace = modelView * vec4(center, 1);
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
    vec2 focal = vec2(1132., 1132.);
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

    if(lambda2 < 0.0) return;
    vec2 diagonalVector = normalize(vec2(cov2d[0][1], lambda1 - cov2d[0][0]));
    vec2 majorAxis = min(sqrt(2.0 * lambda1), 1024.0) * diagonalVector;
    vec2 minorAxis = min(sqrt(2.0 * lambda2), 1024.0) * vec2(diagonalVector.y, -diagonalVector.x);

    vColor = color;
    vPositionW = position;
    vec2 vCenter = vec2(pos2d);
    gl_Position = vec4(
        vCenter 
        + (position.x * majorAxis * 1. / viewport 
        + position.y * minorAxis * 1. / viewport) * pos2d.w, pos2d.zw);

#define CUSTOM_VERTEX_MAIN_END
}
