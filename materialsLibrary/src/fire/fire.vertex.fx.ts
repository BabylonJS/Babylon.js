import { Effect } from "babylonjs";

let name = 'fireVertexShader';
let shader = `precision highp float;

attribute vec3 position;
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#ifdef VERTEXCOLOR
attribute vec4 color;
#endif
#include<bonesDeclaration>

#include<instancesDeclaration>
uniform mat4 view;
uniform mat4 viewProjection;
#ifdef DIFFUSE
varying vec2 vDiffuseUV;
#endif
#ifdef POINTSIZE
uniform float pointSize;
#endif

varying vec3 vPositionW;
#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>

uniform float time;
uniform float speed;
#ifdef DIFFUSE
varying vec2 vDistortionCoords1;
varying vec2 vDistortionCoords2;
varying vec2 vDistortionCoords3;
#endif
void main(void) {
#include<instancesVertex>
#include<bonesVertex>
gl_Position=viewProjection*finalWorld*vec4(position,1.0);
vec4 worldPos=finalWorld*vec4(position,1.0);
vPositionW=vec3(worldPos);

#ifdef DIFFUSE
vDiffuseUV=uv;
vDiffuseUV.y-=0.2;
#endif

#include<clipPlaneVertex>

#include<fogVertex>

#ifdef VERTEXCOLOR
vColor=color;
#endif

#ifdef POINTSIZE
gl_PointSize=pointSize;
#endif
#ifdef DIFFUSE

vec3 layerSpeed=vec3(-0.2,-0.52,-0.1)*speed;
vDistortionCoords1.x=uv.x;
vDistortionCoords1.y=uv.y+layerSpeed.x*time/1000.0;
vDistortionCoords2.x=uv.x;
vDistortionCoords2.y=uv.y+layerSpeed.y*time/1000.0;
vDistortionCoords3.x=uv.x;
vDistortionCoords3.y=uv.y+layerSpeed.z*time/1000.0;
#endif
}
`;

Effect.ShadersStore[name] = shader;

export { shader, name };
