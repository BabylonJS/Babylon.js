import { Effect } from "babylonjs/Materials/effect";

let name = 'lodPixelShader';
let shader = `
varying vec2 vUV;
uniform sampler2D textureSampler;
uniform float lod;
void main(void)
{
gl_FragColor=textureLod(textureSampler,vUV,lod);
}`;

Effect.ShadersStore[name] = shader;
/** @hidden */
export var lodPixelShader = { name, shader };
