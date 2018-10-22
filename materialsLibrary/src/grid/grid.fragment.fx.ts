import { Effect } from "babylonjs";

let name = 'gridPixelShader';
let shader = `#extension GL_OES_standard_derivatives : enable
#define SQRT2 1.41421356
#define PI 3.14159
precision highp float;
uniform vec3 mainColor;
uniform vec3 lineColor;
uniform vec4 gridControl;
uniform vec3 gridOffset;

#ifdef TRANSPARENT
varying vec4 vCameraSpacePosition;
#endif
varying vec3 vPosition;
varying vec3 vNormal;
#include<fogFragmentDeclaration>
float getVisibility(float position) {

float majorGridFrequency=gridControl.y;
if (floor(position+0.5) == floor(position/majorGridFrequency+0.5)*majorGridFrequency)
{
return 1.0;
} 
return gridControl.z;
}
float getAnisotropicAttenuation(float differentialLength) {
const float maxNumberOfLines=10.0;
return clamp(1.0/(differentialLength+1.0)-1.0/maxNumberOfLines,0.0,1.0);
}
float isPointOnLine(float position,float differentialLength) {
float fractionPartOfPosition=position-floor(position+0.5); 
fractionPartOfPosition/=differentialLength; 
fractionPartOfPosition=clamp(fractionPartOfPosition,-1.,1.);
float result=0.5+0.5*cos(fractionPartOfPosition*PI); 
return result; 
}
float contributionOnAxis(float position) {
float differentialLength=length(vec2(dFdx(position),dFdy(position)));
differentialLength*=SQRT2; 

float result=isPointOnLine(position,differentialLength);

float visibility=getVisibility(position);
result*=visibility;

float anisotropicAttenuation=getAnisotropicAttenuation(differentialLength);
result*=anisotropicAttenuation;
return result;
}
float normalImpactOnAxis(float x) {
float normalImpact=clamp(1.0-3.0*abs(x*x*x),0.0,1.0);
return normalImpact;
}
void main(void) {

float gridRatio=gridControl.x;
vec3 gridPos=(vPosition+gridOffset)/gridRatio;

float x=contributionOnAxis(gridPos.x);
float y=contributionOnAxis(gridPos.y);
float z=contributionOnAxis(gridPos.z);

vec3 normal=normalize(vNormal);
x*=normalImpactOnAxis(normal.x);
y*=normalImpactOnAxis(normal.y);
z*=normalImpactOnAxis(normal.z);

float grid=clamp(x+y+z,0.,1.);

vec3 color=mix(mainColor,lineColor,grid);
#ifdef FOG
#include<fogFragment>
#endif
#ifdef TRANSPARENT
float distanceToFragment=length(vCameraSpacePosition.xyz);
float cameraPassThrough=clamp(distanceToFragment-0.25,0.0,1.0);
float opacity=clamp(grid,0.08,cameraPassThrough*gridControl.w*grid);
gl_FragColor=vec4(color.rgb,opacity);
#ifdef PREMULTIPLYALPHA
gl_FragColor.rgb*=opacity;
#endif
#else

gl_FragColor=vec4(color.rgb,1.0);
#endif
}`;

Effect.ShadersStore[name] = shader;

export { shader, name };
