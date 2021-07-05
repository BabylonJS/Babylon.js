import { Effect } from "babylonjs/Materials/effect";

let name = 'lodPixelShader';
let shader = `
#extension GL_EXT_shader_texture_lod : enable

precision highp float;

varying vec2 vUV;
uniform sampler2D textureSampler;
uniform float lod;
uniform vec2 texSize;
#ifndef HAS_ORIGIN_BOTTOM_LEFT
    vec2 _forceFlipY(vec2 uv) {
        return vec2(uv.x, 1.0 - uv.y);
    }
#else
    vec2 _forceFlipY(vec2 uv) {
        return uv;
    }
#endif
void main(void)
{
    gl_FragColor = texture2DLodEXT(textureSampler,_forceFlipY(vUV),lod);
}`;

Effect.ShadersStore[name] = shader;
/** @hidden */
export var lodPixelShader = { name, shader };
