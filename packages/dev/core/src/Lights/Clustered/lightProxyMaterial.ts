import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import type { Matrix } from "core/Maths/math.vector";
import type { Mesh } from "core/Meshes/mesh";
import type { SubMesh } from "core/Meshes/subMesh";

import type { ClusteredLight } from "./clusteredLight";

async function InitializeLightProxy(): Promise<void> {
    await Promise.all([import("../../ShadersWGSL/lightProxy.vertex"), import("../../ShadersWGSL/lightProxy.fragment")]);
}

export class LightProxyMaterial extends ShaderMaterial {
    private readonly _clusteredLight: ClusteredLight;

    constructor(name: string, clusteredLight: ClusteredLight) {
        const shader = { vertex: "lightProxy", fragment: "lightProxy" };
        super(name, clusteredLight._scene, shader, {
            attributes: ["position"],
            uniformBuffers: ["Scene", "Mesh", "Light0"],
            storageBuffers: ["tileMaskBuffer0"],
            defines: ["LIGHT0", "CLUSTLIGHT0", `CLUSTLIGHT_WRITE`],
            shaderLanguage: ShaderLanguage.WGSL,
            extraInitializationsAsync: InitializeLightProxy,
        });

        this._clusteredLight = clusteredLight;
        this.backFaceCulling = false;
        this.disableDepthWrite = true;
    }

    public override bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
        if (subMesh.effect) {
            this._clusteredLight._bindLight(0, this.getScene(), subMesh.effect, false, false);
        }
        super.bindForSubMesh(world, mesh, subMesh);
    }
}
