import { Constants } from "core/Engines/constants";
import type { Scene } from "core/scene";
import { ShaderMaterial } from "core/Materials/shaderMaterial";

import type { ClusteredLight } from "./clusteredLight";

export class LightMaskMaterial extends ShaderMaterial {
    constructor(name: string, light: ClusteredLight, index: number, scene: Scene) {
        super(name, scene, "lightMask", {
            attributes: ["position"],
            uniforms: ["index", "world", "viewProjection"],
            uniformBuffers: ["Scene", "Mesh", "Light0"],
            defines: ["LIGHT0", "CLUSTLIGHT0", `CLUSTLIGHT_MAX ${light.maxLights}`],
            extraInitializationsAsync: async () => {
                await Promise.all([import("../../Shaders/lightMask.vertex"), import("../../Shaders/lightMask.fragment")]);
            },
        });

        this.setUniformBuffer("Light0", light._uniformBuffer);
        this.setUInt("index", index);
        this.alphaMode = Constants.ALPHA_ADD;
    }
}
