import { Constants } from "core/Engines/constants";
import { NullEngine } from "core/Engines/nullEngine";
import { FrameGraph } from "core/FrameGraph/frameGraph";
import { NodeRenderGraphMeshBlendingPostProcessBlock } from "core/FrameGraph/Node/Blocks/PostProcesses/meshBlendingPostProcessBlock.pure";
import { NodeRenderGraphGeometryRendererBlock } from "core/FrameGraph/Node/Blocks/Rendering/geometryRendererBlock.pure";
import { NodeRenderGraphBuildState } from "core/FrameGraph/Node/nodeRenderGraphBuildState";
import { FrameGraphMeshBlendingTask } from "core/FrameGraph/Tasks/PostProcesses/meshBlendingTask";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Vector3 } from "core/Maths/math.vector";
import { MeshBlendDebugMode, MeshBlendDepthType, MeshBlendQuality } from "core/PostProcesses/thinMeshBlendingPostProcess";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("FrameGraphMeshBlendingTask", () => {
    let engine: NullEngine;
    let scene: Scene;
    let frameGraph: FrameGraph;

    beforeEach(() => {
        engine = new NullEngine({ renderWidth: 64, renderHeight: 64 });
        engine._webGLVersion = 2;
        scene = new Scene(engine);
        frameGraph = new FrameGraph(scene);
    });

    afterEach(() => {
        frameGraph.dispose();
        scene.dispose();
        engine.dispose();
    });

    const createTexture = (name: string, width: number, height: number, format: number, createMipMaps = false, type = Constants.TEXTURETYPE_UNSIGNED_BYTE, samples = 1) => {
        return frameGraph.textureManager.createRenderTargetTexture(name, {
            size: { width, height },
            sizeIsPercentage: false,
            options: {
                createMipMaps,
                types: [type],
                formats: [format],
                samples,
                useSRGBBuffers: [false],
                creationFlags: [0],
            },
        });
    };

    const recordTask = (task: FrameGraphMeshBlendingTask) => {
        (frameGraph as any)._currentProcessedTask = task;
        try {
            task.record();
        } finally {
            (frameGraph as any)._currentProcessedTask = undefined;
        }
    };

    const createDefaultTexture = (name: string, width = 64, height = 64) => {
        return frameGraph.textureManager.createRenderTargetTexture(name, {
            size: { width, height },
            sizeIsPercentage: false,
            options: {
                createMipMaps: false,
                samples: 1,
            },
        });
    };

    const configureRequiredInputs = (task: FrameGraphMeshBlendingTask, depthType = MeshBlendDepthType.View) => {
        task.sourceTexture = createTexture("sceneColor", 64, 64, Constants.TEXTUREFORMAT_RGBA);
        task.meshBlendTagTexture = createTexture("meshBlendTag", 64, 64, Constants.TEXTUREFORMAT_RED_INTEGER);
        task.depthTexture = createTexture(
            "depth",
            64,
            64,
            Constants.TEXTUREFORMAT_RED,
            false,
            depthType === MeshBlendDepthType.View ? Constants.TEXTURETYPE_FLOAT : Constants.TEXTURETYPE_UNSIGNED_BYTE
        );
        task.baseColorTexture = createTexture("baseColor", 64, 64, Constants.TEXTUREFORMAT_RGBA);
        task.worldNormalTexture = createTexture("worldNormal", 64, 64, Constants.TEXTUREFORMAT_RGBA);
        task.depthType = depthType;
        task.camera = new FreeCamera("camera", Vector3.Zero(), scene);
    };

    it.each([MeshBlendDepthType.View, MeshBlendDepthType.Screen])("records with matching SceneColor, tag, base color, and %s depth inputs", (depthType) => {
        const task = new FrameGraphMeshBlendingTask("meshBlend", frameGraph);
        configureRequiredInputs(task, depthType);

        expect(task.sourceSamplingMode).toBe(Constants.TEXTURE_NEAREST_SAMPLINGMODE);
        expect(() => recordTask(task)).not.toThrow();
    });

    it("records without albedo and compiles out shadow estimation", () => {
        const task = new FrameGraphMeshBlendingTask("meshBlend", frameGraph);
        configureRequiredInputs(task);
        task.baseColorTexture = undefined;

        expect(() => recordTask(task)).not.toThrow();
        expect(task.postProcess.options.defines).not.toContain("MESH_BLEND_SHADOW_ESTIMATION");
    });

    it("accepts default unsigned-byte RGBA options for color inputs", () => {
        const task = new FrameGraphMeshBlendingTask("meshBlend", frameGraph);
        configureRequiredInputs(task, MeshBlendDepthType.Screen);
        task.sourceTexture = createDefaultTexture("sceneColor");
        task.targetTexture = createDefaultTexture("target");
        task.baseColorTexture = createDefaultTexture("baseColor");
        task.worldNormalTexture = createDefaultTexture("worldNormal");
        task.noiseTexture = createDefaultTexture("noise", 16, 16);

        expect(() => recordTask(task)).not.toThrow();
    });

    it("rejects a non-color SceneColor input", () => {
        const task = new FrameGraphMeshBlendingTask("meshBlend", frameGraph);
        configureRequiredInputs(task);
        task.sourceTexture = createTexture("invalidSceneColor", 64, 64, Constants.TEXTUREFORMAT_RED_INTEGER);

        expect(() => recordTask(task)).toThrow("sourceTexture must use a non-integer RGB or RGBA color format");
    });

    it("selects the requested compile-time shader variant through the frame-graph task", () => {
        const task = new FrameGraphMeshBlendingTask("meshBlend", frameGraph);

        task.quality = MeshBlendQuality.High;

        expect(task.postProcess.options.defines).toContain("#define MESH_BLEND_QUALITY_HIGH");
        expect(task.postProcess.options.defines).toContain("#define MESH_BLEND_FOUR_NEIGHBOR_FALLBACK");
        expect(task.postProcess.options.defines).toContain("#define MESH_BLEND_TINY_OBJECT_SAFEGUARD");
        expect(task.postProcess.options.defines).toContain("#define MESH_BLEND_MULTI_TARGET_SECONDARY_BLEND");
    });

    it("enforces nearest SceneColor sampling", () => {
        const task = new FrameGraphMeshBlendingTask("meshBlend", frameGraph);
        configureRequiredInputs(task);
        task.sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

        recordTask(task);

        expect(task.sourceSamplingMode).toBe(Constants.TEXTURE_NEAREST_SAMPLINGMODE);
    });

    it("exposes the same configuration contract as the classic wrapper", () => {
        const task = new FrameGraphMeshBlendingTask("meshBlend", frameGraph);
        const radiusClasses = [
            { worldRadius: 0.02, minimumProjectedRadius: 1 },
            { worldRadius: 0.04, minimumProjectedRadius: 2 },
            { worldRadius: 0.08, minimumProjectedRadius: 3 },
            { worldRadius: 0.16, minimumProjectedRadius: 4 },
        ] as const;

        task.configure({
            quality: MeshBlendQuality.Cinematic,
            debugMode: MeshBlendDebugMode.StageWork,
            radiusClasses,
            slopeFactor: 1.25,
            depthType: MeshBlendDepthType.Screen,
            worldNormalTextureIsUnsigned: false,
            noiseFactor: 0.2,
            noiseFade: 0.7,
            noiseOffset: -0.15,
            noiseTileSize: 6,
        });

        expect(task.quality).toBe(MeshBlendQuality.Cinematic);
        expect(task.debugMode).toBe(MeshBlendDebugMode.StageWork);
        expect(task.radiusClasses).toEqual(radiusClasses);
        expect(task.slopeFactor).toBe(1.25);
        expect(task.depthType).toBe(MeshBlendDepthType.Screen);
        expect(task.worldNormalTextureIsUnsigned).toBe(false);
        expect(task.noiseFactor).toBe(0.2);
        expect(task.noiseFade).toBe(0.7);
        expect(task.noiseOffset).toBe(-0.15);
        expect(task.noiseTileSize).toBe(6);
        expect(task.postProcess.options.defines).toContain("#define MESH_BLEND_QUALITY_CINEMATIC");
        expect(task.postProcess.options.defines).toContain("#define MESH_BLEND_DEBUG_STAGE_WORK");
        expect(task.postProcess.options.defines).toContain("#define MESH_BLEND_DEPTH_SCREEN");
    });

    it.each([
        { name: "wrongSize", width: 32, height: 64, format: Constants.TEXTUREFORMAT_RED_INTEGER, createMipMaps: false, message: "matching dimensions" },
        { name: "mipmapped", width: 64, height: 64, format: Constants.TEXTUREFORMAT_RED_INTEGER, createMipMaps: true, message: "must not use mipmaps" },
        { name: "wrongFormat", width: 64, height: 64, format: Constants.TEXTUREFORMAT_RED, createMipMaps: false, message: "TEXTUREFORMAT_RED_INTEGER" },
    ])("rejects incompatible packed-tag texture $name", ({ name, width, height, format, createMipMaps, message }) => {
        const task = new FrameGraphMeshBlendingTask("meshBlend", frameGraph);
        configureRequiredInputs(task);
        task.meshBlendTagTexture = createTexture(name, width, height, format, createMipMaps);

        expect(() => recordTask(task)).toThrow(message);
    });

    it.each([
        {
            name: "wrongSize",
            width: 32,
            height: 64,
            format: Constants.TEXTUREFORMAT_RGBA,
            createMipMaps: false,
            type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            samples: 1,
            message: "matching dimensions",
        },
        {
            name: "mipmapped",
            width: 64,
            height: 64,
            format: Constants.TEXTUREFORMAT_RGBA,
            createMipMaps: true,
            type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            samples: 1,
            message: "must not use mipmaps",
        },
        {
            name: "integer",
            width: 64,
            height: 64,
            format: Constants.TEXTUREFORMAT_RGBA_INTEGER,
            createMipMaps: false,
            type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            samples: 1,
            message: "non-integer RGB or RGBA",
        },
        {
            name: "multisampled",
            width: 64,
            height: 64,
            format: Constants.TEXTUREFORMAT_RGBA,
            createMipMaps: false,
            type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            samples: 4,
            message: "matching sample counts",
        },
    ])("rejects incompatible base-color texture $name", ({ name, width, height, format, createMipMaps, type, samples, message }) => {
        const task = new FrameGraphMeshBlendingTask("meshBlend", frameGraph);
        configureRequiredInputs(task);
        task.baseColorTexture = createTexture(name, width, height, format, createMipMaps, type, samples);

        expect(() => recordTask(task)).toThrow(message);
    });

    it("rejects SceneColor with a sample count that differs from the geometry inputs", () => {
        const task = new FrameGraphMeshBlendingTask("meshBlend", frameGraph);
        configureRequiredInputs(task);
        task.sourceTexture = createTexture("multisampledSceneColor", 64, 64, Constants.TEXTUREFORMAT_RGBA, false, Constants.TEXTURETYPE_UNSIGNED_BYTE, 4);

        expect(() => recordTask(task)).toThrow("matching sample counts");
    });

    it.each([
        {
            name: "wrongSize",
            width: 32,
            height: 64,
            format: Constants.TEXTUREFORMAT_RGBA,
            type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            samples: 1,
            message: "targetTexture and sourceTexture must have matching dimensions",
        },
        {
            name: "integer",
            width: 64,
            height: 64,
            format: Constants.TEXTUREFORMAT_RGBA_INTEGER,
            type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            samples: 1,
            message: "targetTexture must use a non-integer RGB or RGBA",
        },
        {
            name: "multisampled",
            width: 64,
            height: 64,
            format: Constants.TEXTUREFORMAT_RGBA,
            type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            samples: 4,
            message: "targetTexture and sourceTexture must have matching sample counts",
        },
    ])("rejects incompatible target texture $name", ({ name, width, height, format, type, samples, message }) => {
        const task = new FrameGraphMeshBlendingTask("meshBlend", frameGraph);
        configureRequiredInputs(task);
        task.targetTexture = createTexture(name, width, height, format, false, type, samples);

        expect(() => recordTask(task)).toThrow(message);
    });

    it.each([
        {
            name: "wrongSize",
            width: 32,
            height: 64,
            format: Constants.TEXTUREFORMAT_RGBA,
            type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            samples: 1,
            message: "matching dimensions",
        },
        {
            name: "integer",
            width: 64,
            height: 64,
            format: Constants.TEXTUREFORMAT_RGBA_INTEGER,
            type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            samples: 1,
            message: "non-integer RGB or RGBA",
        },
        {
            name: "multisampled",
            width: 64,
            height: 64,
            format: Constants.TEXTUREFORMAT_RGBA,
            type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            samples: 4,
            message: "matching sample counts",
        },
    ])("rejects incompatible world-normal texture $name", ({ name, width, height, format, type, samples, message }) => {
        const task = new FrameGraphMeshBlendingTask("meshBlend", frameGraph);
        configureRequiredInputs(task);
        task.worldNormalTexture = createTexture(name, width, height, format, false, type, samples);

        expect(() => recordTask(task)).toThrow(message);
    });

    it("accepts an independently sized single-sampled artistic-noise texture", () => {
        const task = new FrameGraphMeshBlendingTask("meshBlend", frameGraph);
        configureRequiredInputs(task);
        task.noiseTexture = createTexture("artisticNoise", 16, 32, Constants.TEXTUREFORMAT_RED);

        expect(() => recordTask(task)).not.toThrow();
        expect(task.postProcess._hasExternalNoiseTexture).toBe(true);
        expect(task.postProcess.worldNormalTextureIsUnsigned).toBe(true);
    });

    it("reuses effect-owned noise resources across frame-graph recordings and disposes them with the task", () => {
        const task = new FrameGraphMeshBlendingTask("meshBlend", frameGraph);
        configureRequiredInputs(task);
        const stableNoiseTexture = (task.postProcess as any)._stableBlueNoiseTexture;
        const neutralNoiseTexture = (task.postProcess as any)._neutralArtisticNoiseTexture;
        const stableNoiseDisposeSpy = vi.spyOn(stableNoiseTexture, "dispose");
        const neutralNoiseDisposeSpy = vi.spyOn(neutralNoiseTexture, "dispose");

        recordTask(task);
        task._reset();
        recordTask(task);

        expect((task.postProcess as any)._stableBlueNoiseTexture).toBe(stableNoiseTexture);
        expect((task.postProcess as any)._neutralArtisticNoiseTexture).toBe(neutralNoiseTexture);
        expect(stableNoiseDisposeSpy).not.toHaveBeenCalled();
        expect(neutralNoiseDisposeSpy).not.toHaveBeenCalled();

        task.dispose();
        expect(stableNoiseDisposeSpy).toHaveBeenCalledOnce();
        expect(neutralNoiseDisposeSpy).toHaveBeenCalledOnce();
    });

    it("rejects a multisampled artistic-noise texture", () => {
        const task = new FrameGraphMeshBlendingTask("meshBlend", frameGraph);
        configureRequiredInputs(task);
        task.noiseTexture = createTexture("artisticNoise", 16, 16, Constants.TEXTUREFORMAT_RED, false, Constants.TEXTURETYPE_UNSIGNED_BYTE, 4);

        expect(() => recordTask(task)).toThrow("noiseTexture must be single-sampled");
    });

    it("rejects a non-2D artistic-noise texture", () => {
        const task = new FrameGraphMeshBlendingTask("meshBlend", frameGraph);
        configureRequiredInputs(task);
        task.noiseTexture = frameGraph.textureManager.createRenderTargetTexture("artisticNoiseArray", {
            size: { width: 16, height: 16 },
            sizeIsPercentage: false,
            options: {
                createMipMaps: false,
                targetTypes: [Constants.TEXTURE_2D_ARRAY],
                layerCounts: [2],
                types: [Constants.TEXTURETYPE_UNSIGNED_BYTE],
                formats: [Constants.TEXTUREFORMAT_RED],
                samples: 1,
            },
        });

        expect(() => recordTask(task)).toThrow("noiseTexture must be a 2D texture");
    });

    it.each([
        {
            name: "wrongSize",
            width: 32,
            height: 64,
            format: Constants.TEXTUREFORMAT_RED,
            createMipMaps: false,
            type: Constants.TEXTURETYPE_FLOAT,
            samples: 1,
            message: "matching dimensions",
        },
        {
            name: "mipmapped",
            width: 64,
            height: 64,
            format: Constants.TEXTUREFORMAT_RED,
            createMipMaps: true,
            type: Constants.TEXTURETYPE_FLOAT,
            samples: 1,
            message: "must not use mipmaps",
        },
        {
            name: "multisampled",
            width: 64,
            height: 64,
            format: Constants.TEXTUREFORMAT_RED,
            createMipMaps: false,
            type: Constants.TEXTURETYPE_FLOAT,
            samples: 4,
            message: "single-sampled",
        },
        {
            name: "integer",
            width: 64,
            height: 64,
            format: Constants.TEXTUREFORMAT_RED_INTEGER,
            createMipMaps: false,
            type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            samples: 1,
            message: "incompatible type or format",
        },
    ])("rejects incompatible view-depth texture $name", ({ name, width, height, format, createMipMaps, type, samples, message }) => {
        const task = new FrameGraphMeshBlendingTask("meshBlend", frameGraph);
        configureRequiredInputs(task);
        task.depthTexture = createTexture(name, width, height, format, createMipMaps, type, samples);

        expect(() => recordTask(task)).toThrow(message);
    });

    it("requires an explicit camera and valid depth contract", () => {
        const missingCamera = new FrameGraphMeshBlendingTask("missingCamera", frameGraph);
        configureRequiredInputs(missingCamera);
        missingCamera.camera = undefined as any;
        expect(() => recordTask(missingCamera)).toThrow("camera are required");

        const invalidDepthType = new FrameGraphMeshBlendingTask("invalidDepthType", frameGraph);
        configureRequiredInputs(invalidDepthType);
        expect(() => {
            invalidDepthType.depthType = 10 as MeshBlendDepthType;
        }).toThrow("depthType");
    });

    it("round-trips quality, debug, radius, and artistic-noise settings through the NRGE block", () => {
        const source = new NodeRenderGraphMeshBlendingPostProcessBlock("source", frameGraph, scene);
        const restored = new NodeRenderGraphMeshBlendingPostProcessBlock("restored", frameGraph, scene);

        try {
            source.quality = MeshBlendQuality.Cinematic;
            source.debugMode = MeshBlendDebugMode.RejectionReason;
            source.smallWorldRadius = 0.11;
            source.smallMinimumProjectedRadius = 2;
            source.mediumWorldRadius = 0.22;
            source.mediumMinimumProjectedRadius = 4;
            source.largeWorldRadius = 0.33;
            source.largeMinimumProjectedRadius = 6;
            source.extraLargeWorldRadius = 0.44;
            source.extraLargeMinimumProjectedRadius = 8;
            source.slopeFactor = 3;
            source.noiseFactor = 0.25;
            source.noiseFade = 0.75;
            source.noiseOffset = 1.5;
            source.noiseTileSize = 12;

            const serialized = source.serialize();
            restored._deserialize(serialized);

            expect(serialized.quality).toBe(MeshBlendQuality.Cinematic);
            expect(serialized.debugMode).toBe(MeshBlendDebugMode.RejectionReason);
            expect(serialized.inputs.map((input: { name: string }) => input.name)).toContain("geomAlbedo");
            expect(serialized.inputs.map((input: { name: string }) => input.name)).toContain("geomWorldNormal");
            expect(serialized.inputs.map((input: { name: string }) => input.name)).toContain("noiseTexture");
            expect(serialized.radiusClasses).toEqual([
                { worldRadius: 0.11, minimumProjectedRadius: 2 },
                { worldRadius: 0.22, minimumProjectedRadius: 4 },
                { worldRadius: 0.33, minimumProjectedRadius: 6 },
                { worldRadius: 0.44, minimumProjectedRadius: 8 },
            ]);
            expect(restored.quality).toBe(MeshBlendQuality.Cinematic);
            expect(restored.debugMode).toBe(MeshBlendDebugMode.RejectionReason);
            expect(restored.task.postProcess.radiusClasses).toEqual(serialized.radiusClasses);
            expect(restored.slopeFactor).toBe(3);
            expect(restored.noiseFactor).toBe(0.25);
            expect(restored.noiseFade).toBe(0.75);
            expect(restored.noiseOffset).toBe(1.5);
            expect(restored.noiseTileSize).toBe(12);
            expect(source.geomAlbedo.name).toBe("geomAlbedo");
        } finally {
            source.dispose();
            restored.dispose();
        }
    });

    it("serializes the documented NRGE defaults", () => {
        const block = new NodeRenderGraphMeshBlendingPostProcessBlock("meshBlend", frameGraph, scene);

        try {
            const serialized = block.serialize();

            expect(block.geomAlbedo.isOptional).toBe(true);
            expect(serialized.quality).toBe(MeshBlendQuality.Medium);
            expect(serialized.debugMode).toBe(MeshBlendDebugMode.Off);
            expect(serialized.radiusClasses).toEqual([
                { worldRadius: 0.06, minimumProjectedRadius: 1.5 },
                { worldRadius: 0.1, minimumProjectedRadius: 3 },
                { worldRadius: 0.2, minimumProjectedRadius: 3 },
                { worldRadius: 0.3, minimumProjectedRadius: 5 },
            ]);
            expect(serialized.slopeFactor).toBe(2);
            expect(serialized.noiseFactor).toBe(0.5);
            expect(serialized.noiseFade).toBe(0.5);
            expect(serialized.noiseOffset).toBe(0);
            expect(serialized.noiseTileSize).toBe(10);
        } finally {
            block.dispose();
        }
    });

    it("preserves the configured transparent rendering state while the tag output is connected", () => {
        vi.spyOn(engine, "buildTextureLayout").mockImplementation((textureStatus) => textureStatus.map((enabled, index) => (enabled ? index + 1 : 0)));
        const geometry = new NodeRenderGraphGeometryRendererBlock("geometry", frameGraph, scene);
        const meshBlend = new NodeRenderGraphMeshBlendingPostProcessBlock("meshBlend", frameGraph, scene);
        const buildState = new NodeRenderGraphBuildState();

        try {
            geometry.renderTransparentMeshes = true;
            geometry.geomMeshBlendTag.connectTo(meshBlend.geomMeshBlendTag);
            (geometry as any)._buildBlock(buildState);

            expect(geometry.renderTransparentMeshes).toBe(true);
            expect(geometry.task.renderTransparentMeshes).toBe(true);

            geometry.geomMeshBlendTag.disconnectFrom(meshBlend.geomMeshBlendTag);
            (geometry as any)._buildBlock(buildState);

            expect(geometry.renderTransparentMeshes).toBe(true);
            expect(geometry.task.renderTransparentMeshes).toBe(true);
        } finally {
            geometry.dispose();
            meshBlend.dispose();
        }
    });
});
