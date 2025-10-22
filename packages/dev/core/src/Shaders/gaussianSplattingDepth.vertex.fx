#include<__decl__gaussianSplattingVertex>
attribute float splatIndex;

uniform vec2 invViewport;
uniform vec2 dataTextureSize;
uniform vec2 focal;
uniform float kernelSize;

uniform sampler2D covariancesATexture;
uniform sampler2D covariancesBTexture;
uniform sampler2D centersTexture;

varying vec2 vPosition;
#include<gaussianSplatting>

void main(void) {
    Splat splat = readSplat(splatIndex);
    vec3 covA = splat.covA.xyz;
    vec3 covB = vec3(splat.covA.w, splat.covB.xy);
    vec4 worldPosGS = world * vec4(splat.center.xyz, 1.0);
    vPosition = position.xy;
    gl_Position = gaussianSplatting(position.xy, worldPosGS.xyz, vec2(1.,1.), covA, covB, world, view, projection);
}