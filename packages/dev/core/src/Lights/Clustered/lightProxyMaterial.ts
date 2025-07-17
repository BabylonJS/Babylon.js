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
        const engine = clusteredLight.getEngine();
        const shader = { vertex: "lightProxy", fragment: "lightProxy" };
        // The angle between two vertical segments on the sphere
        const segmentAngle = Math.PI / (clusteredLight.proxySegments + 2);

        super(name, clusteredLight._scene, shader, {
            attributes: ["position"],
            uniforms: ["world"],
            uniformBuffers: ["Scene", "Mesh", "Light0"],
            storageBuffers: ["tileMaskBuffer0"],
            defines: ["LIGHT0", "CLUSTLIGHT0", "CLUSTLIGHT_WRITE", `CLUSTLIGHT_MAX ${clusteredLight.maxLights}`, `SEGMENT_ANGLE ${segmentAngle}`],
            shaderLanguage: engine.isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
            extraInitializationsAsync: async () => {
                if (engine.isWebGPU) {
                    await Promise.all([import("../../ShadersWGSL/lightProxy.vertex"), import("../../ShadersWGSL/lightProxy.fragment")]);
                } else {
                    await Promise.all([import("../../Shaders/lightProxy.vertex"), import("../../Shaders/lightProxy.fragment")]);
                }
            },
        });

        this._clusteredLight = clusteredLight;
        this.cullBackFaces = false;
        this.transparencyMode = ShaderMaterial.MATERIAL_ALPHABLEND;
        this.alphaMode = Constants.ALPHA_ADD;

        // this.fillMode = Constants.MATERIAL_WireFrameFillMode;
    }

    public override bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
        if (subMesh.effect) {
            this._clusteredLight._bindLight(0, this.getScene(), subMesh.effect, false, false);
        }
        super.bindForSubMesh(world, mesh, subMesh);
    }
}
