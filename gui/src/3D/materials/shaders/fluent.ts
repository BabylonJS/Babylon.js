import { Effect } from "babylonjs";

const fShader = require("./fluent.fragment.fx");
const vShader = require("./fluent.vertex.fx");

export function registerShader() {
    // register shaders
    Effect.ShadersStore["fluentVertexShader"] = vShader;
    Effect.ShadersStore["fluentPixelShader"] = fShader;
}

export { fShader, vShader };