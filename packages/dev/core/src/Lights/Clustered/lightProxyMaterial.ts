import { Constants } from "core/Engines/constants";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import { Vector2, type Matrix } from "core/Maths/math.vector";
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
            uniforms: ["world", "angleBias", "positionBias"],
            uniformBuffers: ["Scene", "Mesh", "Light0"],
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
        // Cull front faces so it still shows when intersecting with the camera
        this.cullBackFaces = false;
        // Additive blending is for merging masks on WebGL
        this.transparencyMode = ShaderMaterial.MATERIAL_ALPHABLEND;
        this.alphaMode = Constants.ALPHA_ADD;

        this._updateUniforms();
    }

    /** @internal */
    public _updateUniforms(): void {
        // Bias the angle by one sphere segment so the spotlight is slightly too large instead of slightly too small
        const angleBias = -Math.PI / (this._clusteredLight.proxySegments + 2);
        this.setFloat("angleBias", angleBias);
        // Bias the NDC position by one tile so all tiles it overlaps with gets filled (in lieu of conservative rendering)
        // We also add a little extra offset just to counteract any inaccuracies
        const positionBias = new Vector2(2 / this._clusteredLight.horizontalTiles + 0.001, 2 / this._clusteredLight.verticalTiles + 0.001);
        this.setVector2("positionBias", positionBias);
    }

    public override bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
        if (subMesh.effect) {
            this._clusteredLight._bindLight(0, this.getScene(), subMesh.effect, false, false);
        }
        super.bindForSubMesh(world, mesh, subMesh);
    }
}
