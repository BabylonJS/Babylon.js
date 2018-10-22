import { Effect } from "babylonjs";

let name = 'skyVertexShader';
let shader = `precision highp float;

attribute vec3 position;
#ifdef VERTEXCOLOR
attribute vec4 color;
#endif

uniform mat4 world;
uniform mat4 view;
uniform mat4 viewProjection;
#ifdef POINTSIZE
uniform float pointSize;
#endif

varying vec3 vPositionW;
#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
void main(void) {
gl_Position=viewProjection*world*vec4(position,1.0);
vec4 worldPos=world*vec4(position,1.0);
vPositionW=vec3(worldPos);

#include<clipPlaneVertex>

#include<fogVertex>

#ifdef VERTEXCOLOR
vColor=color;
#endif

#ifdef POINTSIZE
gl_PointSize=pointSize;
#endif
}
`;

Effect.ShadersStore[name] = shader;

export { shader, name };
