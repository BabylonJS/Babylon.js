import { Effect } from "core/Materials/effect";

const name = "lodCubePixelShader";
const shader = `
precision highp float;

const float GammaEncodePowerApprox = 1.0 / 2.2;

varying vec2 vUV;
uniform samplerCube textureSampler;
uniform float lod;
uniform bool gamma;
void main(void)
{
    vec2 uv=vUV*2.0-1.0;
    #ifdef POSITIVEX
    gl_FragColor=textureCube(textureSampler,vec3(1.001,uv.y,uv.x),lod);
    #endif
    #ifdef NEGATIVEX
    gl_FragColor=textureCube(textureSampler,vec3(-1.001,uv.y,uv.x),lod);
    #endif
    #ifdef POSITIVEY
    gl_FragColor=textureCube(textureSampler,vec3(uv.y,1.001,uv.x),lod);
    #endif
    #ifdef NEGATIVEY
    gl_FragColor=textureCube(textureSampler,vec3(uv.y,-1.001,uv.x),lod);
    #endif
    #ifdef POSITIVEZ
    gl_FragColor=textureCube(textureSampler,vec3(uv,1.001),lod);
    #endif
    #ifdef NEGATIVEZ
    gl_FragColor=textureCube(textureSampler,vec3(uv,-1.001),lod);
    #endif
    if (!gamma) {
        gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(GammaEncodePowerApprox));
    }
}`;

Effect.ShadersStore[name] = shader;
/** @internal */
// eslint-disable-next-line no-var
export var lodCubePixelShader = { name, shader };
