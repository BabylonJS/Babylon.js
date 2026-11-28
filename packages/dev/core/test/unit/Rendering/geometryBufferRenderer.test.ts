import { describe, expect, it, vi } from "vitest";
import { BakedVertexAnimationManager } from "core/BakedVertexAnimation/bakedVertexAnimationManager";
import { Bone } from "core/Bones/bone";
import { Skeleton } from "core/Bones/skeleton";
import { VertexBuffer } from "core/Buffers/buffer";
import "core/Engines/Extensions/engine.multiRender";
import { NullEngine } from "core/Engines/nullEngine";
import { Constants } from "core/Engines/constants";
import { type _IProcessingOptions } from "core/Engines/Processors/shaderProcessingOptions";
import { Initialize, Process } from "core/Engines/Processors/shaderProcessor";
import { RenderTargetWrapper } from "core/Engines/renderTargetWrapper";
import { ShaderStore } from "core/Engines/shaderStore";
import { WebGPUShaderProcessingContext } from "core/Engines/WebGPU/webgpuShaderProcessingContext";
import { WebGPUShaderProcessorWGSL } from "core/Engines/WebGPU/webgpuShaderProcessorsWGSL";
import { Effect } from "core/Materials/effect";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { BaseTexture } from "core/Materials/Textures/baseTexture";
import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { Matrix } from "core/Maths/math.vector";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { type SubMesh } from "core/Meshes/subMesh";
import { SmartArray } from "core/Misc/smartArray";
import { GeometryBufferRenderer } from "core/Rendering/geometryBufferRenderer";
import { Scene } from "core/scene";
import "core/Shaders/geometry.fragment";
import "core/Shaders/geometry.vertex";
import { geometryVertexShaderWGSL } from "core/ShadersWGSL/geometry.vertex";

describe("GeometryBufferRenderer baked vertex animation", () => {
    it("selects the VAT shader variant and uses per-instance settings only for instanced draws", async () => {
        const engine = new NullEngine();
        engine.getCaps().maxDrawBuffers = 8;
        engine.getCaps().drawBuffersExtension = true;
        vi.spyOn(engine, "buildTextureLayout").mockImplementation((textureStatus) => textureStatus.map((enabled, index) => (enabled ? index + 1 : 0)));
        vi.spyOn(engine, "createMultipleRenderTarget").mockImplementation((size, options) => {
            const target = new RenderTargetWrapper(true, false, size, engine);
            target.setTextures(
                Array.from({ length: options.textureCount + (options.generateDepthTexture ? 1 : 0) }, () => new InternalTexture(engine, InternalTextureSource.MultiRenderTarget))
            );
            return target;
        });
        const scene = new Scene(engine);
        const renderer = new GeometryBufferRenderer(scene);

        try {
            scene.setTransformMatrix(Matrix.Identity(), Matrix.Identity());
            renderer.enableVelocity = true;
            const mesh = CreateBox("VAT mesh", {}, scene);
            mesh.material = new StandardMaterial("VAT material", scene);
            mesh.skeleton = new Skeleton("VAT skeleton", "vat", scene);
            new Bone("root", mesh.skeleton);
            mesh.numBoneInfluencers = 1;
            const indices = new Float32Array(mesh.getTotalVertices() * 4);
            const weights = new Float32Array(indices.length);
            for (let i = 0; i < weights.length; i += 4) {
                weights[i] = 1;
            }
            mesh.setVerticesData(VertexBuffer.MatricesIndicesKind, indices);
            mesh.setVerticesData(VertexBuffer.MatricesWeightsKind, weights);
            const subMesh = mesh.subMeshes[0];
            const manager = new BakedVertexAnimationManager(scene);
            mesh.bakedVertexAnimationManager = manager;
            const texture = new BaseTexture(scene);
            vi.spyOn(texture, "getSize").mockReturnValue({ width: 4, height: 8 });
            manager.texture = texture;
            manager.setAnimationParameters(0, 7, 2, 30);

            const createEffect = vi.spyOn(engine, "createEffect");
            await vi.waitFor(() => expect(renderer.isReady(subMesh, false)).toBe(true));
            const vatEffect = expect.objectContaining({
                defines: expect.stringContaining("#define BAKED_VERTEX_ANIMATION_TEXTURE"),
                uniformsNames: expect.arrayContaining(["bakedVertexAnimationTime", "bakedVertexAnimationSettings", "bakedVertexAnimationTextureSizeInverted"]),
                samplers: expect.arrayContaining(["bakedVertexAnimationTexture"]),
            });
            expect(createEffect).toHaveBeenLastCalledWith("geometry", vatEffect, engine);
            expect(subMesh.effect!.defines).not.toContain("BONES_VELOCITY_ENABLED");
            expect(subMesh.effect!.getAttributesNames()).not.toContain("bakedVertexAnimationSettingsInstanced");

            expect(renderer.isReady(subMesh, true)).toBe(true);
            expect(createEffect).toHaveBeenLastCalledWith("geometry", vatEffect, engine);
            expect(subMesh.effect!.getAttributesNames()).toContain("bakedVertexAnimationSettingsInstanced");

            const bind = vi.spyOn(manager, "bind");
            const setTime = vi.spyOn(Effect.prototype, "setFloat");
            const setSize = vi.spyOn(Effect.prototype, "setFloat2");
            const setTexture = vi.spyOn(Effect.prototype, "setTexture").mockImplementation(() => {});
            const setSettings = vi.spyOn(Effect.prototype, "setVector4");
            const draw = vi.spyOn(mesh, "_processRendering").mockImplementation(() => {});
            const thinInstances = vi.spyOn(mesh, "hasThinInstances", "get").mockReturnValue(false);
            engine.getCaps().instancedArrays = true;
            const opaque = new SmartArray<SubMesh>(1);
            const empty = new SmartArray<SubMesh>(0);
            opaque.push(subMesh);
            const render = () => renderer.getGBuffer().customRenderFunction(opaque, empty, empty, empty);

            manager.time = 0.25;
            render();
            expect(bind).toHaveBeenLastCalledWith(subMesh.effect, false);
            expect(setTime).toHaveBeenCalledWith("bakedVertexAnimationTime", 0.25);
            expect(setSize).toHaveBeenCalledWith("bakedVertexAnimationTextureSizeInverted", 0.25, 0.125);
            expect(setTexture).toHaveBeenCalledWith("bakedVertexAnimationTexture", texture);
            expect(setSettings).toHaveBeenCalledWith("bakedVertexAnimationSettings", manager.animationParameters);

            thinInstances.mockReturnValue(true);
            manager.time = 0.5;
            setTexture.mockClear();
            setSettings.mockClear();
            render();
            expect(bind).toHaveBeenLastCalledWith(subMesh.effect, true);
            expect(setTime).toHaveBeenCalledWith("bakedVertexAnimationTime", 0.5);
            expect(setTexture).toHaveBeenCalledWith("bakedVertexAnimationTexture", texture);
            expect(setSettings).not.toHaveBeenCalledWith("bakedVertexAnimationSettings", expect.anything());

            manager.isEnabled = false;
            thinInstances.mockReturnValue(false);
            render();
            expect(draw).toHaveBeenCalledTimes(3);
            expect(bind).toHaveBeenCalledTimes(2);
            expect(renderer.isReady(subMesh, false)).toBe(true);
            expect(subMesh.effect!.defines).not.toContain("BAKED_VERTEX_ANIMATION_TEXTURE");
            expect(subMesh.effect!.defines).toContain("BONES_VELOCITY_ENABLED");
        } finally {
            vi.restoreAllMocks();
            renderer.dispose();
            scene.dispose();
            engine.dispose();
        }
    });

    it.each(["VELOCITY", "VELOCITY_LINEAR"])("writes both WebGPU vertex outputs with VAT and %s", (velocity) => {
        const options: _IProcessingOptions = {
            defines: [`#define ${velocity}`, "#define BAKED_VERTEX_ANIMATION_TEXTURE", "#define NUM_BONE_INFLUENCERS 1"],
            indexParameters: { maxSimultaneousMorphTargets: 0 },
            isFragment: false,
            shouldUseHighPrecisionShader: true,
            processor: new WebGPUShaderProcessorWGSL(),
            supportsUniformBuffers: true,
            shadersRepository: "",
            includesShadersStore: ShaderStore.IncludesShadersStoreWGSL,
            version: "100",
            platformName: "WEBGPU",
            processingContext: new WebGPUShaderProcessingContext(ShaderLanguage.WGSL),
            isNDCHalfZRange: true,
            useReverseDepthBuffer: false,
        };
        let code = "";
        Initialize(options);
        Process(geometryVertexShaderWGSL.shader, options, (processedCode) => (code = processedCode));
        expect(code).toMatch(/vertexOutputs\.vCurrentPosition\s*=\s*scene\.viewProjection/);
        expect(code).toMatch(/vertexOutputs\.vPreviousPosition\s*=\s*uniforms\.previousViewProjection/);
    });
});

describe("GeometryBufferRenderer object IDs", () => {
    it("rejects object IDs when linked to the PrePassRenderer", async () => {
        const engine = new NullEngine();
        vi.spyOn(engine, "buildTextureLayout").mockImplementation((textureStatus) => textureStatus.map((enabled, index) => (enabled ? index + 1 : 0)));
        const scene = new Scene(engine);
        const renderer = new GeometryBufferRenderer(scene);
        await Promise.resolve();

        try {
            renderer._linkPrePassRenderer(null!);

            expect(() => {
                renderer.enableObjectId = true;
            }).toThrow("GeometryBufferRenderer: object ID textures are not supported when linked to the PrePassRenderer");
            expect(renderer.enableObjectId).toBe(false);
        } finally {
            renderer.dispose();
            scene.dispose();
            engine.dispose();
        }
    });

    it("rejects PrePass linking after object IDs are enabled", async () => {
        const engine = new NullEngine();
        vi.spyOn(engine, "buildTextureLayout").mockImplementation((textureStatus) => textureStatus.map((enabled, index) => (enabled ? index + 1 : 0)));
        const scene = new Scene(engine);
        const renderer = new GeometryBufferRenderer(scene);
        await Promise.resolve();

        try {
            vi.spyOn(renderer as any, "_createRenderTargets").mockImplementation(() => {});
            renderer.enableObjectId = true;

            expect(() => renderer._linkPrePassRenderer(null!)).toThrow("object ID and mesh-blending tag textures are not supported");
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
});

describe("GeometryBufferRenderer sizing", () => {
    it("uses integer physical dimensions for ratio-based targets", async () => {
        const engine = new NullEngine();
        let renderWidth = 1001;
        let renderHeight = 601;
        vi.spyOn(engine, "getRenderWidth").mockImplementation(() => renderWidth);
        vi.spyOn(engine, "getRenderHeight").mockImplementation(() => renderHeight);
        vi.spyOn(engine, "buildTextureLayout").mockImplementation((textureStatus) => textureStatus.map((enabled, index) => (enabled ? index + 1 : 0)));
        const scene = new Scene(engine);
        const renderer = new GeometryBufferRenderer(scene, 0.5);
        await Promise.resolve();

        try {
            expect((renderer as any)._getRenderTargetDimensions()).toEqual({ width: 500, height: 300 });

            renderWidth = 1003;
            renderHeight = 603;

            expect((renderer as any)._getRenderTargetDimensions()).toEqual({ width: 501, height: 301 });

            const explicitRenderer = new GeometryBufferRenderer(scene, { width: 100.75, height: 50.25 });
            try {
                expect((explicitRenderer as any)._getRenderTargetDimensions()).toEqual({ width: 100, height: 50 });
            } finally {
                explicitRenderer.dispose();
            }
        } finally {
            renderer.dispose();
            scene.dispose();
            engine.dispose();
        }
    });
});

describe("GeometryBufferRenderer mesh-blending tags", () => {
    it("configures a final, nearest-sampled R8UI attachment on WebGL2", async () => {
        const engine = new NullEngine();
        vi.spyOn(engine, "buildTextureLayout").mockImplementation((textureStatus) => textureStatus.map((enabled, index) => (enabled ? index + 1 : 0)));
        const scene = new Scene(engine);
        const renderer = new GeometryBufferRenderer(scene);
        await Promise.resolve();

        try {
            engine._webGLVersion = 2;
            engine.getCaps().drawBuffersExtension = true;
            engine.getCaps().maxDrawBuffers = 8;
            engine.getCaps().blendParametersPerTarget = true;
            vi.spyOn(renderer as any, "_createRenderTargets").mockImplementation(() => {});
            renderer.enableMeshBlendingTag = true;

            const [count, names, formats] = (renderer as any)._assignRenderTargetIndices();
            const index = renderer.getTextureIndex(GeometryBufferRenderer.MESH_BLEND_TAG_TEXTURE_TYPE);
            expect(index).toBe(count - 1);
            expect(names[index]).toBe("gBuffer_MeshBlendTag");
            expect(formats[index]).toEqual({
                textureType: Constants.TEXTURETYPE_UNSIGNED_BYTE,
                textureFormat: Constants.TEXTUREFORMAT_RED_INTEGER,
                samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            });
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });

    it("rejects unsupported backends, multisampling, and PrePass linking", async () => {
        const engine = new NullEngine();
        vi.spyOn(engine, "buildTextureLayout").mockImplementation((textureStatus) => textureStatus.map((enabled, index) => (enabled ? index + 1 : 0)));
        const scene = new Scene(engine);
        const renderer = new GeometryBufferRenderer(scene);
        await Promise.resolve();

        try {
            engine.getCaps().drawBuffersExtension = true;
            engine.getCaps().maxDrawBuffers = 8;
            expect(() => {
                renderer.enableMeshBlendingTag = true;
            }).toThrow("mesh-blending tag textures require WebGL2 or WebGPU");

            engine._webGLVersion = 2;
            engine.getCaps().blendParametersPerTarget = true;
            renderer.samples = 2;
            expect(() => {
                renderer.enableMeshBlendingTag = true;
            }).toThrow("mesh-blending tag textures require samples to be 1");

            renderer.samples = 1;
            renderer._linkPrePassRenderer(null!);
            expect(() => {
                renderer.enableMeshBlendingTag = true;
            }).toThrow("mesh-blending tag textures are not supported when linked to the PrePassRenderer");
        } finally {
            renderer.dispose();
            scene.dispose();
            engine.dispose();
        }
    });

    it("rejects Native when the runtime does not support mesh blending", async () => {
        const engine = new NullEngine();
        engine._webGLVersion = 2;
        (engine as any)._shaderPlatformName = "NATIVE";
        const scene = new Scene(engine);
        const renderer = new GeometryBufferRenderer(scene);
        await Promise.resolve();

        try {
            expect(() => {
                renderer.enableMeshBlendingTag = true;
            }).toThrow("mesh-blending tag textures require WebGL2 or WebGPU");
        } finally {
            renderer.dispose();
            scene.dispose();
            engine.dispose();
        }
    });

    it("allows transparent mesh-blending tags on Native without per-target blend parameters", async () => {
        const engine = new NullEngine();
        (engine as any)._shaderPlatformName = "NATIVE";
        engine._features.supportMeshBlending = true;
        const scene = new Scene(engine);
        const renderer = new GeometryBufferRenderer(scene);
        await Promise.resolve();

        try {
            vi.spyOn(renderer as any, "_createRenderTargets").mockImplementation(() => {});
            expect(() => {
                renderer.enableMeshBlendingTag = true;
                renderer.renderTransparentMeshes = true;
            }).not.toThrow();
        } finally {
            renderer.dispose();
            scene.dispose();
            engine.dispose();
        }
    });

    it("requires per-target blend parameters for transparent mesh-blending tags on WebGL2", async () => {
        const engine = new NullEngine();
        engine._webGLVersion = 2;
        const scene = new Scene(engine);
        const renderer = new GeometryBufferRenderer(scene);
        await Promise.resolve();

        try {
            expect(() => {
                renderer.enableMeshBlendingTag = true;
            }).toThrow("transparent mesh-blending tags require per-target blend parameters");

            renderer.renderTransparentMeshes = false;
            vi.spyOn(renderer as any, "_createRenderTargets").mockImplementation(() => {});
            expect(() => {
                renderer.enableMeshBlendingTag = true;
            }).not.toThrow();
            expect(() => {
                renderer.renderTransparentMeshes = true;
            }).toThrow("transparent mesh-blending tags require per-target blend parameters");
        } finally {
            renderer.dispose();
            scene.dispose();
            engine.dispose();
        }
    });

    it("rejects PrePass linking after the tag attachment is enabled", async () => {
        const engine = new NullEngine();
        vi.spyOn(engine, "buildTextureLayout").mockImplementation((textureStatus) => textureStatus.map((enabled, index) => (enabled ? index + 1 : 0)));
        const scene = new Scene(engine);
        const renderer = new GeometryBufferRenderer(scene);
        await Promise.resolve();

        try {
            engine._webGLVersion = 2;
            engine.getCaps().blendParametersPerTarget = true;
            vi.spyOn(renderer as any, "_createRenderTargets").mockImplementation(() => {});
            renderer.enableMeshBlendingTag = true;

            expect(() => renderer._linkPrePassRenderer(null!)).toThrow("mesh-blending tag textures are not supported when linked to the PrePassRenderer");
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });

    it("rebuilds only its own targets when the tag output is disabled", async () => {
        const engine = new NullEngine();
        vi.spyOn(engine, "buildTextureLayout").mockImplementation((textureStatus) => textureStatus.map((enabled, index) => (enabled ? index + 1 : 0)));
        const scene = new Scene(engine);
        const renderer = new GeometryBufferRenderer(scene);
        await Promise.resolve();

        try {
            engine._webGLVersion = 2;
            engine.getCaps().blendParametersPerTarget = true;
            const createRenderTargetsSpy = vi.spyOn(renderer as any, "_createRenderTargets").mockImplementation(() => {});
            renderer.enableMeshBlendingTag = true;
            renderer.enableMeshBlendingTag = true;
            renderer.enableMeshBlendingTag = false;
            renderer.enableMeshBlendingTag = false;

            expect(createRenderTargetsSpy).toHaveBeenCalledTimes(2);
            expect(renderer.enableMeshBlendingTag).toBe(false);
            expect(renderer.getTextureIndex(GeometryBufferRenderer.MESH_BLEND_TAG_TEXTURE_TYPE)).toBe(-1);
        } finally {
            renderer.dispose();
            scene.dispose();
            engine.dispose();
        }
    });
});
