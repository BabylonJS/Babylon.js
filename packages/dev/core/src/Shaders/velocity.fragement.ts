// Do not edit.
import { ShaderStore } from "../Engines/shaderStore";

const name = "velocityVertexShader";
const shader = `precision highp float;#define CUSTOM_FRAGMENT_BEGIN
varying vec4 clipPos;varying vec4 previousClipPos;#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {#define CUSTOM_FRAGMENT_MAIN_BEGIN
highp vec4 motionVector=( clipPos/clipPos.w-previousClipPos/previousClipPos.w );gl_FragColor=motionVector;#define CUSTOM_FRAGMENT_MAIN_END
}`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const velocityVertexShader = { name, shader };
