import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { WebGPUBufferManager } from "core/Engines/WebGPU/webgpuBufferManager";
import { WebGPUDrawContext } from "core/Engines/WebGPU/webgpuDrawContext";
import { WebGPUPipelineContext } from "core/Engines/WebGPU/webgpuPipelineContext";
import { WebGPUShaderProcessingContext } from "core/Engines/WebGPU/webgpuShaderProcessingContext";
import { WebGPUDataBuffer } from "core/Meshes/WebGPU/webgpuDataBuffer";
import { Scene } from "core/scene";
import { Matrix } from "core/Maths/math.vector";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { type Mesh } from "core/Meshes/mesh";
import { VertexBuffer } from "core/Buffers/buffer";
import { type DrawWrapper } from "core/Materials/drawWrapper";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { MultiMaterial } from "core/Materials/multiMaterial";
import { ShadowDepthWrapper } from "core/Materials/shadowDepthWrapper";
import { ShadowGenerator } from "core/Lights/Shadows/shadowGenerator";
import "core/Buffers/buffer.align";
import "core/Meshes/thinInstanceMesh";

describe("Geometry WebGPU draw cache invalidation", () => {
    let engine: NullEngine;
    let scene: Scene;
    let mesh: Mesh;

    function cacheDraw(wrapper: DrawWrapper) {
        const context = wrapper.drawContext;
        if (!(context instanceof WebGPUDrawContext)) {
            throw new Error("Expected a WebGPU draw context");
        }
        wrapper.defines = "#define INSTANCES\n#define THIN_INSTANCES";
        wrapper._wasPreviouslyReady = true;
        context.fastBundle = {} as GPURenderBundle;
        context.setBuffer("Scene", new WebGPUDataBuffer());
        context.useInstancing = true;
        vi.spyOn(wrapper, "dispose");
        vi.spyOn(context, "reset");
        vi.spyOn(context, "dispose");
        return { wrapper, context, bundle: context.fastBundle, buffers: context.buffers, indirectBuffer: context.indirectDrawBuffer };
    }

    function cacheDraws(target: Mesh) {
        return [0, 7].map((passId) => cacheDraw(target.subMeshes[0]._getDrawWrapper(passId, true)!));
    }

    function expectInvalidated(draws: ReturnType<typeof cacheDraws>) {
        for (const { wrapper, context, buffers, indirectBuffer } of draws) {
            expect(context.fastBundle).toBeUndefined();
            expect(wrapper.dispose).not.toHaveBeenCalled();
            expect(context.reset).not.toHaveBeenCalled();
            expect(context.dispose).not.toHaveBeenCalled();
            expect(wrapper.drawContext).toBe(context);
            expect(wrapper._wasPreviouslyReady).toBe(true);
            expect(context.buffers).toBe(buffers);
            expect(context.indirectDrawBuffer).toBe(indirectBuffer);
        }
    }

    function expectPreserved(draws: ReturnType<typeof cacheDraws>) {
        for (const { wrapper, context, bundle } of draws) {
            expect(context.fastBundle).toBe(bundle);
            expect(wrapper.dispose).not.toHaveBeenCalled();
            expect(context.reset).not.toHaveBeenCalled();
            expect(context.dispose).not.toHaveBeenCalled();
        }
    }

    async function prepareMaterial(storeEffectOnSubMeshes = true, withShadowDepthWrapper = false) {
        const material = new ShaderMaterial(
            "shader",
            scene,
            {
                vertexSource: "attribute vec3 position; void main() { gl_Position = vec4(position, 1.0); }",
                fragmentSource: "void main() { gl_FragColor = vec4(1.0); }",
            },
            { attributes: ["position"], uniforms: [] },
            storeEffectOnSubMeshes
        );
        if (withShadowDepthWrapper) {
            material.shadowDepthWrapper = new ShadowDepthWrapper(material, scene, { doNotInjectCode: true });
        }
        mesh.material = material;
        await vi.waitFor(() => expect(material.isReadyForSubMesh(mesh, mesh.subMeshes[0], true)).toBe(true));
        return material;
    }

    async function cacheShadowDraws(material: ShaderMaterial, target = mesh) {
        const depthWrapper = material.shadowDepthWrapper!;
        const subMesh = target.subMeshes[0];
        const draws: ReturnType<typeof cacheDraws> = [];
        for (let generatorIndex = 0; generatorIndex < 2; ++generatorIndex) {
            const generator = vi.mockObject(ShadowGenerator.prototype);
            await vi.waitFor(() => expect(depthWrapper.isReadyForSubMesh(subMesh, [], generator, true, 2)).toBe(true));
            const main = depthWrapper.getEffect(subMesh, generator, 2)!;
            const pass = depthWrapper.getEffect(subMesh, generator, 7)!;
            expect(main).not.toBe(pass);
            expect(main.effect).toBe(pass.effect);
            draws.push(cacheDraw(main), cacheDraw(pass));
        }
        return draws;
    }

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        mesh = CreateBox("box", {}, scene);
        mesh.thinInstanceSetBuffer("matrix", new Float32Array(Matrix.Identity().asArray()), 16, false);
        mesh.thinInstanceSetBuffer("tint", new Float32Array([1, 0, 0, 1]), 4, false);
        const bufferManager = vi.mockObject(WebGPUBufferManager.prototype);
        bufferManager.createRawBuffer.mockImplementation(() => ({}) as GPUBuffer);
        vi.spyOn(engine, "createDrawContext").mockImplementation(() => new WebGPUDrawContext(bufferManager, new WebGPUDataBuffer()));
        vi.spyOn(engine, "isWebGPU", "get").mockReturnValue(true);
        vi.spyOn(engine, "compatibilityMode", "get").mockReturnValue(false);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
        vi.restoreAllMocks();
    });

    it.each(["matrix", "previousMatrix", "tint"])("invalidates every render pass of shared geometry when replacing %s", (kind) => {
        if (kind === "previousMatrix") {
            mesh.thinInstanceSetBuffer(kind, new Float32Array(Matrix.Identity().asArray()), 16);
        }
        const clone = mesh.clone("clone")!;
        expect(clone.geometry).toBe(mesh.geometry);
        const draws = [...cacheDraws(mesh), ...cacheDraws(clone)];
        const data = kind === "tint" ? new Float32Array([0, 1, 0, 1]) : new Float32Array(Matrix.Translation(0, 0, 3).asArray());

        mesh.thinInstanceSetBuffer(kind, data, kind === "tint" ? 4 : 16);

        expectInvalidated(draws);
        expect(mesh.subMeshes[0]._getDrawWrapper(0)).toBe(draws[0].wrapper);
        expect(clone.subMeshes[0]._getDrawWrapper(7)).toBe(draws[3].wrapper);
    });

    it("invalidates cached draws when adding a vertex buffer", () => {
        const draws = cacheDraws(mesh);

        mesh.setVerticesBuffer(new VertexBuffer(engine, new Float32Array([1]), "custom", false, false, 1, true));

        expectInvalidated(draws);
    });

    it("invalidates a draw-wrapper override without replacing it", () => {
        const [override] = cacheDraws(CreateBox("override-owner", {}, scene));
        const subMesh = mesh.subMeshes[0];
        subMesh._setMainDrawWrapperOverride(override.wrapper);

        mesh.thinInstanceSetBuffer("tint", new Float32Array([0, 1, 0, 1]), 4);

        expectInvalidated([override]);
        expect(subMesh._drawWrapperOverride).toBe(override.wrapper);
    });

    it("invalidates cached draws when removing a thin-instance attribute", () => {
        const draws = cacheDraws(mesh);

        mesh.thinInstanceSetBuffer("tint", null);

        expectInvalidated(draws);
        expect(mesh.isVerticesDataPresent("tint")).toBe(false);
    });

    it.each(["replace", "remove"])("invalidates a material-owned wrapper on buffer %s without creating submesh wrappers", (operation) => {
        const material = new ShaderMaterial("material-owned", scene, "shader", {}, false);
        mesh.material = material;
        mesh.subMeshes[0].resetDrawCache();
        const draw = cacheDraw(material._getDrawWrapper());
        expect(mesh.subMeshes[0]._drawWrappers).toHaveLength(0);

        mesh.thinInstanceSetBuffer("tint", operation === "remove" ? null : new Float32Array([0, 1, 0, 1]), 4);

        expectInvalidated([draw]);
        expect(mesh.subMeshes[0]._drawWrappers).toHaveLength(0);
    });

    it.each([0, 7])("invalidates default and overridden material-owned wrappers regardless of the current render pass (%s)", (passId) => {
        const defaultMaterial = new ShaderMaterial("default", scene, "shader", {}, false);
        const passMaterial = new ShaderMaterial("pass", scene, "shader", {}, false);
        const multiMaterial = new MultiMaterial("multi", scene);
        multiMaterial.subMaterials.push(passMaterial);
        mesh.material = defaultMaterial;
        mesh.setMaterialForRenderPass(7, multiMaterial);
        mesh.subMeshes[0].resetDrawCache();
        engine.currentRenderPassId = passId;
        const draws = [cacheDraw(defaultMaterial._getDrawWrapper()), cacheDraw(passMaterial._getDrawWrapper())];

        mesh.thinInstanceSetBuffer("tint", new Float32Array([0, 1, 0, 1]), 4);

        expectInvalidated(draws);
        expect(mesh.subMeshes[0]._drawWrappers).toHaveLength(0);
    });

    it("invalidates a material-owned scene default without requiring an explicit mesh material", () => {
        const material = new ShaderMaterial("scene-default", scene, "shader", {}, false);
        scene.defaultMaterial = material;
        vi.spyOn(scene, "_hasDefaultMaterial", "get").mockReturnValue(true);
        mesh.material = null;
        const draw = cacheDraw(material._getDrawWrapper());

        mesh.thinInstanceSetBuffer("tint", new Float32Array([0, 1, 0, 1]), 4);

        expectInvalidated([draw]);
    });

    it.each([true, false])("invalidates all shadow-depth wrappers on matrix replacement (storeEffectOnSubMeshes=%s)", async (storeEffectOnSubMeshes) => {
        const material = await prepareMaterial(storeEffectOnSubMeshes, true);
        const depthWrapper = material.shadowDepthWrapper!;
        const shadowDraws = await cacheShadowDraws(material);
        const mainDraw = cacheDraw(storeEffectOnSubMeshes ? mesh.subMeshes[0]._drawWrapper : material._getDrawWrapper());
        const effects = shadowDraws.map(({ wrapper }) => wrapper.effect);

        mesh.thinInstanceSetBuffer("matrix", new Float32Array(Matrix.Translation(1, 0, 0).asArray()), 16);

        expectInvalidated([...shadowDraws, mainDraw]);
        expect(shadowDraws.map(({ wrapper }) => wrapper.effect)).toEqual(effects);
        expect(material.shadowDepthWrapper).toBe(depthWrapper);
    });

    it("preserves shadow-depth bundles for in-place thin-instance updates", async () => {
        const material = await prepareMaterial(true, true);
        const shadowDraws = await cacheShadowDraws(material);

        mesh.thinInstanceBufferUpdated("matrix");
        mesh.thinInstanceBufferUpdated("tint");

        expectPreserved(shadowDraws);
    });

    it("preserves other submeshes' shadow-depth bundles", async () => {
        const material = await prepareMaterial(true, true);
        const other = CreateBox("unrelated", {}, scene);
        other.thinInstanceSetBuffer("matrix", new Float32Array(Matrix.Identity().asArray()), 16);
        other.material = material;
        await vi.waitFor(() => expect(material.isReadyForSubMesh(other, other.subMeshes[0], true)).toBe(true));
        const changedDraws = await cacheShadowDraws(material);
        const unrelatedDraws = await cacheShadowDraws(material, other);

        mesh.thinInstanceSetBuffer("matrix", new Float32Array(Matrix.Identity().asArray()), 16);

        expectInvalidated(changedDraws);
        expectPreserved(unrelatedDraws);
    });

    it("does not create shadow-depth wrappers when none have been cached", () => {
        const material = new ShaderMaterial("shadow", scene, "shader");
        material.shadowDepthWrapper = new ShadowDepthWrapper(material, scene);
        mesh.material = material;
        const generator = vi.mockObject(ShadowGenerator.prototype);

        mesh.thinInstanceSetBuffer("matrix", new Float32Array(Matrix.Identity().asArray()), 16);

        expect(material.shadowDepthWrapper.getEffect(mesh.subMeshes[0], generator, 2)).toBeNull();
    });

    it("invalidates an inactive render-pass material's shadow-depth wrappers", async () => {
        const material = await prepareMaterial(false, true);
        const shadowDraws = await cacheShadowDraws(material);
        mesh.material = new ShaderMaterial("main", scene, "shader");
        const multiMaterial = new MultiMaterial("shadow-pass", scene);
        multiMaterial.subMaterials.push(material);
        mesh.setMaterialForRenderPass(7, multiMaterial);
        engine.currentRenderPassId = 0;

        mesh.thinInstanceSetBuffer("matrix", new Float32Array(Matrix.Identity().asArray()), 16);

        expectInvalidated(shadowDraws);
    });

    it.each(["updateVerticesData", "updateVerticesDataDirectly"] as const)("invalidates draws when %s recreates an aligned buffer", (method) => {
        engine._features.forceVertexBufferStrideAndOffsetMultiple4Bytes = true;
        const vertexBuffer = new VertexBuffer(engine, new Float32Array(7), "unaligned", {
            size: 2,
            stride: 9,
            offset: 1,
            useBytes: true,
            updatable: true,
        });
        mesh.setVerticesBuffer(vertexBuffer);
        const originalBuffer = vertexBuffer.effectiveBuffer;
        expect(vertexBuffer._alignedBuffer).toBeDefined();
        const material = new ShaderMaterial("material-owned", scene, "shader", {}, false);
        mesh.material = material;
        const draws = [...cacheDraws(mesh), cacheDraw(material._getDrawWrapper())];
        const geometry = mesh.geometry!;
        const data = new Float32Array([0, 1, 0, 0, 1, 0, 0]);

        if (method === "updateVerticesData") {
            geometry.updateVerticesData("unaligned", data);
        } else {
            geometry.updateVerticesDataDirectly("unaligned", data, 0);
        }

        expect(vertexBuffer.effectiveBuffer).not.toBe(originalBuffer);
        expectInvalidated(draws);
    });

    it("preserves submesh- and material-owned bundles when alignment leaves the GPU binding unchanged", () => {
        engine._features.forceVertexBufferStrideAndOffsetMultiple4Bytes = true;
        const material = new ShaderMaterial("material-owned", scene, "shader", {}, false);
        mesh.material = material;
        mesh.setVerticesData("aligned", new Float32Array([1, 2, 3, 4]), true, 4);
        const vertexBuffer = mesh.getVertexBuffer("aligned")!;
        expect(vertexBuffer._alignedBuffer).toBeUndefined();
        const buffer = vertexBuffer.effectiveBuffer;
        const draws = [...cacheDraws(mesh), cacheDraw(material._getDrawWrapper())];

        mesh.updateVerticesData("aligned", new Float32Array([4, 3, 2, 1]));
        mesh.geometry!.updateVerticesDataDirectly("aligned", new Float32Array([1, 2, 3, 4]), 0);

        expect(vertexBuffer.effectiveBuffer).toBe(buffer);
        expectPreserved(draws);
    });

    it("preserves cached draws when removing an absent attribute", () => {
        const draws = cacheDraws(mesh);

        mesh.removeVerticesData("absent");

        expectPreserved(draws);
    });

    it("preserves cached draws for in-place vertex and thin-instance buffer updates", () => {
        mesh.setVerticesData("custom", [1], true, 1);
        mesh.thinInstanceSetBuffer("previousMatrix", new Float32Array(Matrix.Identity().asArray()), 16, false);
        const draws = cacheDraws(mesh);

        mesh.thinInstanceBufferUpdated("matrix");
        mesh.thinInstanceBufferUpdated("previousMatrix");
        mesh.thinInstanceBufferUpdated("tint");
        mesh.updateVerticesData("custom", [2]);
        mesh.geometry!.updateVerticesDataDirectly("custom", new Float32Array([3]), 0);

        expectPreserved(draws);
        expect(mesh.subMeshes[0]._getDrawWrapper(0)).toBe(draws[0].wrapper);
        expect(mesh.subMeshes[0]._getDrawWrapper(7)).toBe(draws[1].wrapper);
    });

    it.each(["matrix", "tint"])("invalidates cached draws when automatically recreating a static %s buffer", (kind) => {
        const data = kind === "tint" ? new Float32Array([1, 0, 0, 1]) : new Float32Array(Matrix.Identity().asArray());
        mesh.thinInstanceSetBuffer(kind, data, kind === "tint" ? 4 : 16);
        mesh.thinInstanceAllowAutomaticStaticBufferRecreation = true;
        const draws = cacheDraws(mesh);

        mesh.thinInstanceBufferUpdated(kind);

        expectInvalidated(draws);
    });

    it("invalidates cached draws when the thin-instance matrix buffer grows", () => {
        engine.getCaps().instancedArrays = true;
        const draws = cacheDraws(mesh);

        mesh.thinInstanceAdd(Matrix.Identity());

        expectInvalidated(draws);
        expect(mesh.thinInstanceCount).toBe(2);
    });

    it("invalidates cached draws even when temporarily using WebGPU compatibility mode", () => {
        const draws = cacheDraws(mesh);
        vi.spyOn(engine, "compatibilityMode", "get").mockReturnValue(true);

        mesh.thinInstanceSetBuffer("tint", new Float32Array([0, 1, 0, 1]), 4);

        expectInvalidated(draws);
    });

    it("preserves the active context when the first culling draw creates previous matrices", async () => {
        const material = await prepareMaterial();
        material.backFaceCulling = false;
        material.separateCullingPass = true;
        scene.needsPreviousWorldMatrices = true;
        expect(mesh._thinInstanceDataStorage.previousMatrixBuffer).toBeNull();
        const context = mesh.subMeshes[0]._drawWrapper.drawContext;
        if (!(context instanceof WebGPUDrawContext)) {
            throw new Error("Expected a WebGPU draw context");
        }
        engine._currentDrawContext = context;
        const sceneBuffer = new WebGPUDataBuffer();
        const draw = vi.spyOn(mesh, "_draw").mockImplementation(() => {
            context.setBuffer("Scene", sceneBuffer);
            return mesh;
        });

        expect(() => mesh.render(mesh.subMeshes[0], false)).not.toThrow();

        expect(draw).toHaveBeenCalledTimes(2);
        expect(context.buffers.Scene).toBe(sceneBuffer);
        expect(mesh._thinInstanceDataStorage.previousMatrixBuffer).not.toBeNull();
        expect(mesh.subMeshes[0]._drawWrapper.drawContext).toBe(context);
    });

    it.each([false, true])("keeps frozen meshes rendering in every cached pass (compatibilityMode=%s)", async (compatibilityMode) => {
        vi.spyOn(engine, "compatibilityMode", "get").mockReturnValue(compatibilityMode);
        const material = await prepareMaterial();
        const subMesh = mesh.subMeshes[0];
        engine.currentRenderPassId = 7;
        await vi.waitFor(() => expect(material.isReadyForSubMesh(mesh, subMesh, true)).toBe(true));
        engine.currentRenderPassId = 0;
        mesh._freeze();
        const draw = vi.spyOn(engine, "drawElementsType");
        for (const passId of [0, 7]) {
            engine.currentRenderPassId = passId;
            mesh.render(subMesh, false);
        }
        expect(draw).toHaveBeenCalledTimes(2);

        mesh.thinInstanceSetBuffer("tint", new Float32Array([0, 1, 0, 1]), 4);
        for (const passId of [0, 7]) {
            engine.currentRenderPassId = passId;
            mesh.render(subMesh, false);
        }

        expect(draw).toHaveBeenCalledTimes(4);
    });

    it("refreshes vertex-pulling storage bindings without losing uniform buffer bindings", () => {
        const [{ context }] = cacheDraws(mesh);
        const pipelineContext = vi.mockObject(WebGPUPipelineContext.prototype);
        pipelineContext.shaderProcessingContext = new WebGPUShaderProcessingContext(ShaderLanguage.WGSL, false);
        pipelineContext.shaderProcessingContext.bufferNames = ["tint"];
        const buffers = mesh.geometry!.getVertexBuffers()!;
        const sceneBuffer = context.buffers.Scene;
        context.setVertexPulling(true, pipelineContext, buffers, null, null);
        const previousBuffer = context.buffers.tint;

        mesh.thinInstanceSetBuffer("tint", new Float32Array([0, 1, 0, 1]), 4);
        context.setVertexPulling(true, pipelineContext, buffers, null, null);

        expect(context.buffers.Scene).toBe(sceneBuffer);
        expect(context.buffers.tint).toBe(buffers.tint.effectiveBuffer);
        expect(context.buffers.tint).not.toBe(previousBuffer);
    });

    it("does not invalidate WebGL draws", () => {
        vi.spyOn(engine, "isWebGPU", "get").mockReturnValue(false);
        const draws = cacheDraws(mesh);

        mesh.thinInstanceSetBuffer("tint", new Float32Array([0, 1, 0, 1]), 4);
        mesh.thinInstanceSetBuffer("tint", null);

        expectPreserved(draws);
    });
});
