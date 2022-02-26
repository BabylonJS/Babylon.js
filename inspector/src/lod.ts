import { Effect } from "babylonjs/Materials/effect";

let name = 'lodPixelShader';
let shader = `
#extension GL_EXT_shader_texture_lod : enable

precision highp float;

const float GammaEncodePowerApprox = 1.0 / 2.2;

varying vec2 vUV;
uniform sampler2D textureSampler;
uniform float lod;
uniform vec2 texSize;
uniform bool gamma;
void main(void)
{
    gl_FragColor = textureLod(textureSampler,vUV,lod);
    if (!gamma) {
        gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(GammaEncodePowerApprox));
    }
}`;

Effect.ShadersStore[name] = shader;
/** @hidden */
export var lodPixelShader = { name, shader };
