import { Effect } from "babylonjs/Materials/effect";

let name = 'lodCubePixelShader';
let shader = `
precision highp float;

varying vec2 vUV;
uniform samplerCube textureSampler;
uniform float lod;
#ifndef HAS_ORIGIN_BOTTOM_LEFT
    vec3 _forceNegateY(vec3 uv) {
        return vec3(uv.x, -uv.y, uv.z);
    }
#else
    vec3 _forceNegateY(vec3 uv) {
        return uv;
    }
#endif
void main(void)
{
    vec2 uv=vUV*2.0-1.0;
    #ifdef POSITIVEX
    gl_FragColor=textureCubeLodEXT(textureSampler,_forceNegateY(vec3(1.001,uv.y,uv.x)),lod);
    #endif
    #ifdef NEGATIVEX
    gl_FragColor=textureCubeLodEXT(textureSampler,_forceNegateY(vec3(-1.001,uv.y,uv.x)),lod);
    #endif
    #ifdef POSITIVEY
    gl_FragColor=textureCubeLodEXT(textureSampler,_forceNegateY(vec3(uv.y,1.001,uv.x)),lod);
    #endif
    #ifdef NEGATIVEY
    gl_FragColor=textureCubeLodEXT(textureSampler,_forceNegateY(vec3(uv.y,-1.001,uv.x)),lod);
    #endif
    #ifdef POSITIVEZ
    gl_FragColor=textureCubeLodEXT(textureSampler,_forceNegateY(vec3(uv,1.001)),lod);
    #endif
    #ifdef NEGATIVEZ
    gl_FragColor=textureCubeLodEXT(textureSampler,_forceNegateY(vec3(uv,-1.001)),lod);
    #endif
}`;

Effect.ShadersStore[name] = shader;
/** @hidden */
export var lodCubePixelShader = { name, shader };
