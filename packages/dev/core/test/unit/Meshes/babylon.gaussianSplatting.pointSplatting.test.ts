import { NullEngine } from "core/Engines/nullEngine";
import { ShaderStore } from "core/Engines/shaderStore";
import { WebGPUEngine } from "core/Engines/webgpuEngine";
import { GaussianSplattingDebugMaterialPlugin } from "core/Materials/GaussianSplatting/gaussianSplattingDebugMaterialPlugin";
import "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { GaussianSplattingMaterial } from "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { GaussianPointSplattingBlitMaterial } from "core/Materials/GaussianSplatting/gaussianPointSplattingBlitMaterial.pure";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { GaussianSplattingCompoundMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingCompoundMesh";
import { GaussianPointSplattingRenderer } from "core/Meshes/GaussianSplatting/gaussianPointSplattingRenderer";
import { Matrix } from "core/Maths/math.vector";
import { Scene } from "core/scene";
import { describe, expect, it, vi } from "vitest";

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

    it("keeps the jitter visit stride coprime to every supported upscale cycle", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const mesh = new GaussianSplattingMesh("splat", null, scene);

        for (let n = 1; n <= 8; n++) {
            const total = n * n;
            const stride = mesh["_pointCoprimeStride"](total);
            expect(new Set(Array.from({ length: total }, (_, i) => (i * stride) % total)).size).toBe(total);
        }

        scene.dispose();
        engine.dispose();
    });

    it("packs the expected SH coefficients for degrees 1 through 4", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        const textures = Array.from({ length: 5 }, (_, t) => Uint8Array.from({ length: 32 }, (_, i) => t * 32 + i));

        expect(mesh["_pointPackSh"](undefined, 0, 2)).toBeNull();
        for (const [degree, scalars] of [
            [1, 9],
            [2, 24],
            [3, 45],
            [4, 72],
        ]) {
            const packed = mesh["_pointPackSh"](textures, degree, 2)!;
            const bytes = new Uint8Array(packed.buffer);
            const stride = Math.ceil(scalars / 4) * 4;
            expect(bytes.length).toBe(stride * 2);
            for (let i = 0; i < 2; i++) {
                for (let k = 0; k < scalars; k++) {
                    expect(bytes[i * stride + k]).toBe(textures[Math.floor(k / 16)][i * 16 + (k % 16)]);
                }
            }
        }

        scene.dispose();
        engine.dispose();
    });

    it("keeps the decoded part count separate from the number of parts owning splats", () => {
        const engine = new NullEngine();
        (engine.getCaps() as { maxVertexUniformVectors: number }).maxVertexUniformVectors = 256;
        (engine.getCaps() as { maxTextureSize: number }).maxTextureSize = 16;
        const scene = new Scene(engine);
        const mesh = new GaussianSplattingCompoundMesh("splat", null, scene);
        const data = new ArrayBuffer(32);
        const source = new GaussianSplattingMesh("source", null, scene);
        source.disableDepthSort = true;
        source.updateData(data);
        mesh.disableDepthSort = true;
        const second = new GaussianSplattingMesh("source2", null, scene);
        second.disableDepthSort = true;
        second.updateData(data);
        mesh.addParts([source, second]);
        mesh["_splatsData"] = data;
        mesh["_pointDecodedSplatsData"] = data;
        mesh["_pointSplatCount"] = 1;
        mesh["_pointPartCount"] = 1;
        mesh["_pointDecodedPartCount"] = 2;

        expect(mesh.partCount).toBe(2);
        expect(() => mesh["_pointSyncData"]()).not.toThrow();

        scene.dispose();
        engine.dispose();
    });

    it("clamps the view-space depth span to the camera interval, including when inside a part", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        mesh["_pointPartLocalMin"] = new Float32Array([-1, -1, -1]);
        mesh["_pointPartLocalMax"] = new Float32Array([1, 1, 1]);
        mesh["_pointPartScratch"].set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 2, 1]);

        const view = Matrix.Identity().m;
        expect(mesh["_pointViewZSpan"](view, 0.5, 10)).toEqual([1, 3]);
        mesh["_pointPartScratch"][14] = 0;
        expect(mesh["_pointViewZSpan"](view, 0.5, 10)).toEqual([0.5, 1]);
        scene.useRightHandedSystem = true;
        mesh["_pointPartScratch"][14] = -2;
        expect(mesh["_pointViewZSpan"](view, 0.5, 10)).toEqual([1, 3]);

        scene.dispose();
        engine.dispose();
    });

    it("decodes local means, opacity and a degenerate covariance without a GPU", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        const renderer = Object.create(GaussianPointSplattingRenderer.prototype) as GaussianPointSplattingRenderer;
        const upload = vi.spyOn(renderer, "updateSplats").mockImplementation(() => {});
        mesh["_pointRenderer"] = renderer;
        const splat = new ArrayBuffer(32);
        const floats = new Float32Array(splat);
        const bytes = new Uint8Array(splat);
        floats.set([1, 2, 3, 0, 0, 0]);
        bytes.set([10, 20, 30, 255, 255, 128, 128, 128], 24);

        mesh["_pointDecode"](splat);
        const [means, cov, colors, sh, degree, count] = upload.mock.calls[0];
        expect(Array.from(means)).toEqual([1, 2, 3, 0]);
        expect(cov[3]).toBe(0x3f800000);
        expect(colors[0] >>> 0).toBe(0xff1e140a);
        expect(sh).toBeNull();
        expect(degree).toBe(0);
        expect(count).toBe(1);

        mesh["_pointRenderer"] = null;
        scene.dispose();
        engine.dispose();
    });

    it("filters point opacity by active source ranges and refreshes the upload when ranges change", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        mesh.disableDepthSort = true;
        const data = new ArrayBuffer(3 * 32);
        const bytes = new Uint8Array(data);
        for (let i = 0; i < 3; i++) {
            bytes[i * 32 + 27] = 255;
            bytes.fill(128, i * 32 + 28, i * 32 + 32);
        }
        mesh.updateData(data);
        const renderer = Object.create(GaussianPointSplattingRenderer.prototype) as GaussianPointSplattingRenderer;
        const upload = vi.spyOn(renderer, "updateSplats").mockImplementation(() => {});
        vi.spyOn(renderer, "resetAccumulation").mockImplementation(() => {});
        mesh["_pointRenderer"] = renderer;

        mesh.setSplatIndexRanges([{ offset: 1, count: 1 }]);
        mesh["_pointSyncData"]();
        expect(Array.from(upload.mock.lastCall![2], (color) => color >>> 24)).toEqual([0, 255, 0]);
        mesh.setSplatIndexRanges([{ offset: 2, count: 1 }]);
        mesh["_pointSyncData"]();
        expect(Array.from(upload.mock.lastCall![2], (color) => color >>> 24)).toEqual([0, 0, 255]);
        mesh.setSplatIndexRanges([
            { offset: 2, count: 1 },
            { offset: 0, count: 1 },
        ]);
        mesh["_pointSyncData"]();
        expect(Array.from(upload.mock.lastCall![2], (color) => color >>> 24)).toEqual([255, 0, 255]);
        mesh.setSplatIndexRanges([]);
        mesh["_pointSyncData"]();
        expect(Array.from(upload.mock.lastCall![2], (color) => color >>> 24)).toEqual([0, 0, 0]);
        mesh.setSplatIndexRanges(null);
        mesh["_pointSyncData"]();
        expect(Array.from(upload.mock.lastCall![2], (color) => color >>> 24)).toEqual([255, 255, 255]);

        mesh["_pointRenderer"] = null;
        scene.dispose();
        engine.dispose();
    });

    it("applies compound part range overrides to non-streamed point data", () => {
        const engine = new NullEngine();
        (engine.getCaps() as { maxVertexUniformVectors: number }).maxVertexUniformVectors = 256;
        (engine.getCaps() as { maxTextureSize: number }).maxTextureSize = 16;
        const scene = new Scene(engine);
        const mesh = new GaussianSplattingCompoundMesh("splat", null, scene);
        mesh.disableDepthSort = true;
        const sources = ["first", "second"].map((name) => {
            const source = new GaussianSplattingMesh(name, null, scene);
            source.disableDepthSort = true;
            const data = new ArrayBuffer(32);
            new Uint8Array(data)[27] = 255;
            source.updateData(data);
            return source;
        });
        mesh.addParts(sources);
        const renderer = Object.create(GaussianPointSplattingRenderer.prototype) as GaussianPointSplattingRenderer;
        const upload = vi.spyOn(renderer, "updateSplats").mockImplementation(() => {});
        vi.spyOn(renderer, "resetAccumulation").mockImplementation(() => {});
        mesh["_pointRenderer"] = renderer;

        mesh.setPartSplatRanges(1, []);
        mesh["_pointSyncData"]();
        expect(Array.from(upload.mock.lastCall![2], (color) => color >>> 24)).toEqual([255, 0]);
        mesh.setPartSplatRanges(1, null);
        mesh["_pointSyncData"]();
        expect(Array.from(upload.mock.lastCall![2], (color) => color >>> 24)).toEqual([255, 255]);

        mesh["_pointRenderer"] = null;
        scene.dispose();
        engine.dispose();
    });

    it("releases shared compute only after both modes are disabled", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        const renderer = Object.create(GaussianPointSplattingRenderer.prototype) as GaussianPointSplattingRenderer;
        const dispose = vi.spyOn(renderer, "dispose").mockImplementation(() => {});
        mesh["_pointRenderer"] = renderer;
        mesh["_pointMode"] = true;
        mesh["_pointDepthMode"] = true;
        mesh["_pointComputeObserver"] = scene.onBeforeRenderObservable.add(() => {});
        mesh["_pointMode"] = false;
        mesh["_pointReleaseComputeIfIdle"]();
        expect(dispose).not.toHaveBeenCalled();
        mesh["_pointDepthMode"] = false;
        mesh["_pointReleaseComputeIfIdle"]();
        expect(dispose).toHaveBeenCalledOnce();
        expect(mesh["_pointRenderer"]).toBeNull();
        expect(mesh["_pointComputeObserver"]).toBeNull();

        scene.dispose();
        engine.dispose();
    });

    it("does not force depth writes in the alpha-blended point color pass", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const blit = new GaussianPointSplattingBlitMaterial("point", scene);
        expect(blit.needAlphaBlending()).toBe(true);
        expect(blit.forceDepthWrite).toBe(false);
        scene.dispose();
        engine.dispose();
    });

    it("limits the auto upsample factor to eight when the point budget is exceeded", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        const renderer = Object.create(GaussianPointSplattingRenderer.prototype) as GaussianPointSplattingRenderer;
        vi.spyOn(renderer, "readPointCountAsync").mockResolvedValue(1_000_000_000);
        mesh["_pointRenderer"] = renderer;
        mesh["_pointMode"] = true;

        await mesh["_pointConvergeAutoScaleAsync"](2);
        expect(mesh["_pointAutoN"]).toBe(8);
        expect(mesh["_pointBudgetReadPending"]).toBe(false);

        mesh["_pointRenderer"] = null;
        scene.dispose();
        engine.dispose();
    });

    it("ignores stale budget readbacks after disable and renderer replacement", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        const oldRenderer = Object.create(GaussianPointSplattingRenderer.prototype) as GaussianPointSplattingRenderer;
        let finishOld!: (value: number) => void;
        vi.spyOn(oldRenderer, "readPointCountAsync").mockImplementation(() => new Promise<number>((resolve) => (finishOld = resolve)));
        vi.spyOn(oldRenderer, "dispose").mockImplementation(() => {});
        mesh["_pointRenderer"] = oldRenderer;
        mesh["_pointMode"] = true;
        mesh["_pointUpdateAutoScale"](2);
        mesh["_pointMode"] = false;
        mesh["_pointReleaseComputeIfIdle"]();

        const newRenderer = Object.create(GaussianPointSplattingRenderer.prototype) as GaussianPointSplattingRenderer;
        let finishNew!: (value: number) => void;
        vi.spyOn(newRenderer, "readPointCountAsync").mockImplementation(() => new Promise<number>((resolve) => (finishNew = resolve)));
        mesh["_pointRenderer"] = newRenderer;
        mesh["_pointMode"] = true;
        mesh["_pointUpdateAutoScale"](2);
        finishOld(1_000_000_000);
        await Promise.resolve();
        expect(mesh["_pointAutoN"]).toBe(2);
        expect(mesh["_pointBudgetReadPending"]).toBe(true);
        finishNew(1_000_000_000);
        await Promise.resolve();
        expect(mesh["_pointAutoN"]).toBe(8);
        expect(mesh["_pointBudgetReadPending"]).toBe(false);

        mesh["_pointRenderer"] = null;
        scene.dispose();
        engine.dispose();
    });
});
