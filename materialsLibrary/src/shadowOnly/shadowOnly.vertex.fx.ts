import { Effect } from "babylonjs";

let name = 'shadowOnlyVertexShader';
let shader = `precision highp float;

attribute vec3 position;
#ifdef NORMAL
attribute vec3 normal;
#endif
#include<bonesDeclaration>

#include<instancesDeclaration>
uniform mat4 view;
uniform mat4 viewProjection;
#ifdef POINTSIZE
uniform float pointSize;
#endif

varying vec3 vPositionW;
#ifdef NORMAL
varying vec3 vNormalW;
#endif
#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<__decl__lightFragment>[0..maxSimultaneousLights]
void main(void) {
#include<instancesVertex>
#include<bonesVertex>
gl_Position=viewProjection*finalWorld*vec4(position,1.0);
vec4 worldPos=finalWorld*vec4(position,1.0);
vPositionW=vec3(worldPos);
#ifdef NORMAL
vNormalW=normalize(vec3(finalWorld*vec4(normal,0.0)));
#endif

#include<clipPlaneVertex>

#include<fogVertex>
#include<shadowsVertex>[0..maxSimultaneousLights]

#ifdef POINTSIZE
gl_PointSize=pointSize;
#endif
}
`;

Effect.ShadersStore[name] = shader;

export { shader, name };
