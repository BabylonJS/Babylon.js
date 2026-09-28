import { NullEngine } from "core/Engines/nullEngine";
import { ShaderStore } from "core/Engines/shaderStore";
import { WebGPUEngine } from "core/Engines/webgpuEngine";
import { GaussianSplattingDebugMaterialPlugin } from "core/Materials/GaussianSplatting/gaussianSplattingDebugMaterialPlugin";
import "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { GaussianSplattingMaterial } from "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { Scene } from "core/scene";
import { describe, expect, it } from "vitest";

describe("GaussianSplattingMesh point-splatting settings", () => {
    it("registers the compute and blit shaders through the public mesh entry point", () => {
        expect(WebGPUEngine.prototype.createComputeContext).toBeTypeOf("function");
        for (const name of [
            "gpsPreprocessComputeShader",
            "gpsScanBlocksComputeShader",
            "gpsScanSumsComputeShader",
            "gpsScanAddComputeShader",
            "gpsPartitionComputeShader",
            "gpsSplatComputeShader",
            "gpsResolveComputeShader",
            "gpsHiZBuildComputeShader",
            "gaussianPointSplattingBlitVertexShader",
            "gaussianPointSplattingBlitPixelShader",
            "gaussianPointSplattingDepthBlitPixelShader",
        ]) {
            expect(ShaderStore.ShadersStoreWGSL[name]).toBeDefined();
        }
    });

    it("retains the point density configured before the compute renderer is enabled", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const mesh = new GaussianSplattingMesh("splat", null, scene);

        expect(mesh.pointSplattingScale).toBe(1);
        mesh.pointSplattingScale = 2;
        expect(mesh.pointSplattingScale).toBe(2);

        scene.dispose();
        engine.dispose();
    });

    it("reuses debug part data until settings or part count change", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const material = new GaussianSplattingMaterial("splat", scene);
        const debug = new GaussianSplattingDebugMaterialPlugin(material);

        const first = debug.getResolvedPartData(2, engine);
        expect(debug.getResolvedPartData(2, engine)).toBe(first);
        expect(debug.getResolvedPartData(1, engine)).not.toBe(first);

        debug.opacityScale = 0.5;
        const changed = debug.getResolvedPartData(2, engine);
        expect(changed).not.toBe(first);
        expect(changed.data).not.toEqual(first.data);

        scene.dispose();
        engine.dispose();
    });
});
