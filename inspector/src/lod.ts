import { Effect } from "babylonjs/Materials/effect";

let name = 'lodPixelShader';
let shader = `
#extension GL_EXT_shader_texture_lod : enable

precision highp float;

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
