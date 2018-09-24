import { Effect } from "babylonjs";

import { shader as fShader } from './fluent.fragment';
import { shader as vShader } from './fluent.fragment';

export function registerShader() {
    // register shaders
    Effect.ShadersStore["fluentVertexShader"] = vShader;
    Effect.ShadersStore["fluentPixelShader"] = fShader;
}

export { fShader, vShader };