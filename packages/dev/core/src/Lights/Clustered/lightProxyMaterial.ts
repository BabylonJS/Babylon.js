import { Constants } from "core/Engines/constants";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import type { Matrix } from "core/Maths/math.vector";
import type { Mesh } from "core/Meshes/mesh";
import type { SubMesh } from "core/Meshes/subMesh";

import type { ClusteredLight } from "./clusteredLight";

export class LightProxyMaterial extends ShaderMaterial {
    private readonly _clusteredLight: ClusteredLight;

    constructor(name: string, clusteredLight: ClusteredLight) {
        const shader = { vertex: "lightProxy", fragment: "lightProxy" };
        const webgpu = clusteredLight.getEngine().isWebGPU;
        super(name, clusteredLight._scene, shader, {
            attributes: ["position"],
            uniforms: ["halfTileRes"],
            uniformBuffers: ["Scene", "Light0"],
            storageBuffers: ["tileMaskBuffer0"],
            defines: ["LIGHT0", "CLUSTLIGHT0", "CLUSTLIGHT_WRITE", `CLUSTLIGHT_MAX ${clusteredLight.maxLights}`],
            shaderLanguage: webgpu ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
            extraInitializationsAsync: async () => {
                if (webgpu) {
                    await Promise.all([import("../../ShadersWGSL/lightProxy.vertex"), import("../../ShadersWGSL/lightProxy.fragment")]);
                } else {
                    await Promise.all([import("../../Shaders/lightProxy.vertex"), import("../../Shaders/lightProxy.fragment")]);
                }
            },
        });

        this._clusteredLight = clusteredLight;
        // Additive blending is for merging masks on WebGL
        this.transparencyMode = ShaderMaterial.MATERIAL_ALPHABLEND;
        this.alphaMode = Constants.ALPHA_ADD;
    }

    public override bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
        if (subMesh.effect) {
            this._clusteredLight._bindLight(0, this.getScene(), subMesh.effect, false, false);

            subMesh.effect.setFloat2("halfTileRes", this._clusteredLight.horizontalTiles / 2, this._clusteredLight.verticalTiles / 2);
        }
        super.bindForSubMesh(world, mesh, subMesh);
    }
}
