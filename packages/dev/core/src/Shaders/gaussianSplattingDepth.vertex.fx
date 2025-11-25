#include<__decl__gaussianSplattingVertex>

uniform vec2 invViewport;
uniform vec2 dataTextureSize;
uniform vec2 focal;
uniform float kernelSize;

uniform sampler2D covariancesATexture;
uniform sampler2D covariancesBTexture;
uniform sampler2D centersTexture;
uniform sampler2D colorsTexture;
varying vec2 vPosition;
varying vec4 vColor;

#include<gaussianSplatting>

void main(void) {
    float splatIndex = getSplatIndex(int(position.z + 0.5));
    Splat splat = readSplat(splatIndex);
    vec3 covA = splat.covA.xyz;
    vec3 covB = vec3(splat.covA.w, splat.covB.xy);
    vec4 worldPosGS = world * vec4(splat.center.xyz, 1.0);
    vPosition = position.xy;
    vColor = splat.color;
    gl_Position = gaussianSplatting(position.xy, worldPosGS.xyz, vec2(1.,1.), covA, covB, world, view, projection);
}