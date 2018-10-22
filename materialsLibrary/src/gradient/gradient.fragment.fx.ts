import { Effect } from "babylonjs";

let name = 'gradientPixelShader';
let shader = `precision highp float;

uniform vec3 vEyePosition;
uniform vec4 vDiffuseColor;

uniform vec4 topColor;
uniform vec4 bottomColor;
uniform float offset;
uniform float scale;
uniform float smoothness;

varying vec3 vPositionW;
varying vec3 vPosition;
#ifdef NORMAL
varying vec3 vNormalW;
#endif
#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif

#include<helperFunctions>

#include<__decl__lightFragment>[0]
#include<__decl__lightFragment>[1]
#include<__decl__lightFragment>[2]
#include<__decl__lightFragment>[3]
#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>

#ifdef DIFFUSE
varying vec2 vDiffuseUV;
uniform sampler2D diffuseSampler;
uniform vec2 vDiffuseInfos;
#endif
#include<clipPlaneFragmentDeclaration>

#include<fogFragmentDeclaration>
void main(void) {
#include<clipPlaneFragment>
vec3 viewDirectionW=normalize(vEyePosition-vPositionW);
float h=vPosition.y*scale+offset;
float mysmoothness=clamp(smoothness,0.01,max(smoothness,10.));
vec4 baseColor=mix(bottomColor,topColor,max(pow(max(h,0.0),mysmoothness),0.0));

vec3 diffuseColor=baseColor.rgb;

float alpha=baseColor.a;
#ifdef ALPHATEST
if (baseColor.a<0.4)
discard;
#endif
#include<depthPrePass>
#ifdef VERTEXCOLOR
baseColor.rgb*=vColor.rgb;
#endif

#ifdef NORMAL
vec3 normalW=normalize(vNormalW);
#else
vec3 normalW=vec3(1.0,1.0,1.0);
#endif

vec3 diffuseBase=vec3(0.,0.,0.);
lightingInfo info;
float shadow=1.;
float glossiness=0.;
#include<lightFragment>[0]
#include<lightFragment>[1]
#include<lightFragment>[2]
#include<lightFragment>[3]
#ifdef VERTEXALPHA
alpha*=vColor.a;
#endif
vec3 finalDiffuse=clamp(diffuseBase*diffuseColor,0.0,1.0)*baseColor.rgb;

vec4 color=vec4(finalDiffuse,alpha);
#include<fogFragment>
gl_FragColor=color;
}
`;

Effect.ShadersStore[name] = shader;

export { shader, name };
