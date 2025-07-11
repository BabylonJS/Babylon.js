import { Constants } from "core/Engines/constants";
import type { Effect } from "core/Materials/effect";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import type { Matrix } from "core/Maths/math.vector";
import type { Mesh } from "core/Meshes/mesh";
import type { SubMesh } from "core/Meshes/subMesh";
import type { Nullable } from "core/types";

import type { ClusteredLight } from "./clusteredLight";

async function InitializeLightProxy(): Promise<void> {
    await Promise.all([import("../../Shaders/lightProxy.vertex"), import("../../Shaders/lightProxy.fragment")]);
}

export class LightProxyMaterial extends ShaderMaterial {
    private readonly _clusteredLight: ClusteredLight;

    constructor(name: string, clusteredLight: ClusteredLight) {
        super(name, clusteredLight._scene, "lightProxy", {
            attributes: ["position"],
            uniforms: ["world"],
            uniformBuffers: ["Scene", "Mesh", "Light0"],
            defines: ["LIGHT0", "CLUSTLIGHT0", `CLUSTLIGHT_MAX ${clusteredLight.maxLights}`],
            extraInitializationsAsync: InitializeLightProxy,
        });

        this._clusteredLight = clusteredLight;
        this.alphaMode = Constants.ALPHA_ADD;
    }

    public override bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
        if (subMesh.effect) {
            this._clusteredLight._bindLight(0, this.getScene(), subMesh.effect, false, false);
        }
        super.bindForSubMesh(world, mesh, subMesh);
    }
}
