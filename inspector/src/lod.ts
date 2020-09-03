import { Effect } from "babylonjs/Materials/effect";

let name = 'lodPixelShader';
let shader = `
#ifdef GL_ES
precision highp float;
#endif

varying vec2 vUV;
uniform sampler2D textureSampler;
uniform float lod;
uniform vec2 texSize;
void main(void)
{
    gl_FragColor = textureLod(textureSampler,vUV,lod);
}`;

Effect.ShadersStore[name] = shader;
/** @hidden */
export var lodPixelShader = { name, shader };
