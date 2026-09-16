import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "core/Engines/Extensions/engine.multiRender";
import "core/Meshes/instancedMesh";
import "core/Meshes/thinInstanceMesh";
import "core/Shaders/default.fragment";
import "core/Shaders/default.vertex";
import { objectIdFunctions } from "core/Shaders/ShadersInclude/objectIdFunctions";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Constants } from "core/Engines/constants";
import { NullEngine } from "core/Engines/nullEngine";
import { FrameGraph } from "core/FrameGraph/frameGraph";
import { FrameGraphGeometryRendererTask } from "core/FrameGraph/Tasks/Rendering/geometryRendererTask";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { _GetGeometryRenderingMeshBlendTag, _GetGeometryRenderingObjectId, MaterialHelperGeometryRendering } from "core/Materials/materialHelper.geometryrendering";
import { Matrix, Vector3 } from "core/Maths/math.vector";
import { Mesh } from "core/Meshes/mesh";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { Scene } from "core/scene";

describe("FrameGraphGeometryRendererTask object IDs", () => {
    let engine: NullEngine;
    let scene: Scene;
    let camera: FreeCamera;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        engine.getCaps().drawBuffersExtension = true;
        engine.getCaps().maxDrawBuffers = 8;
        vi.spyOn(engine, "buildTextureLayout").mockImplementation((textureStatus) => textureStatus.map((enabled, index) => (enabled ? index + 1 : 0)));
        scene = new Scene(engine);
        camera = new FreeCamera("camera", new Vector3(0, 0, -5), scene);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    const createTask = () => {
        const frameGraph = new FrameGraph(scene);
        const task = new FrameGraphGeometryRendererTask("geometry", frameGraph, scene);

        task.camera = camera;
        task.objectList = {
            meshes: [],
            particleSystems: [],
            spriteManagers: [],
        };
        frameGraph.addTask(task);

        return { frameGraph, task };
    };

    it.each([
        { value: -1, maxObjectId: 0xffffff },
        { value: 1.5, maxObjectId: 0xffffff },
        { value: Number.NaN, maxObjectId: 0xffffff },
        { value: 0x1000000, maxObjectId: 0xffffff },
        { value: 0x100, maxObjectId: 0xff },
    ])("rejects invalid provider result $value for maximum $maxObjectId", ({ value, maxObjectId }) => {
        const mesh = new Mesh("mesh", scene);

        expect(() => _GetGeometryRenderingObjectId(mesh, () => value, maxObjectId)).toThrow(
            `Object IDs must be integers between 0 and 0x${maxObjectId.toString(16).toUpperCase()}`
        );
    });

    it.each([
        { value: 0, maxObjectId: 0xff },
        { value: 0xff, maxObjectId: 0xff },
        { value: 0x800001, maxObjectId: 0xffffff },
        { value: 0x800002, maxObjectId: 0xffffff },
        { value: 0xffffff, maxObjectId: 0xffffff },
    ])("accepts provider result $value for maximum $maxObjectId", ({ value, maxObjectId }) => {
        const mesh = new Mesh("mesh", scene);

        expect(_GetGeometryRenderingObjectId(mesh, () => value, maxObjectId)).toBe(value);
    });

    it("does not round validated 24-bit IDs in the shader encoder", () => {
        expect(objectIdFunctions.shader).not.toContain("objectId+0.5");
    });

    it("rejects multisampled object ID textures", async () => {
        const { frameGraph, task } = createTask();

        task.samples = 2;
        task.textureDescriptions = [
            {
                type: Constants.PREPASS_OBJECT_ID_TEXTURE_TYPE,
                textureType: Constants.TEXTURETYPE_UNSIGNED_BYTE,
                textureFormat: Constants.TEXTUREFORMAT_RGBA,
            },
        ];

        await expect(frameGraph.buildAsync(false)).rejects.toThrow("object ID textures currently require samples to be 1");
    });

    it("rejects object ID layouts that exceed the color attachment limit", async () => {
        engine.getCaps().maxDrawBuffers = 1;
        const { frameGraph, task } = createTask();

        task.textureDescriptions = [
            {
                type: Constants.PREPASS_DEPTH_TEXTURE_TYPE,
                textureType: Constants.TEXTURETYPE_FLOAT,
                textureFormat: Constants.TEXTUREFORMAT_RED,
            },
            {
                type: Constants.PREPASS_OBJECT_ID_TEXTURE_TYPE,
                textureType: Constants.TEXTURETYPE_UNSIGNED_BYTE,
                textureFormat: Constants.TEXTUREFORMAT_RGBA,
            },
        ];

        await expect(frameGraph.buildAsync(false)).rejects.toThrow("2 color attachments were requested, but this engine supports at most 1");
    });

    it("updates the object ID provider after the frame graph is built", async () => {
        const mesh = new Mesh("mesh", scene);
        const initialProvider = vi.fn(() => 1);
        const updatedProvider = vi.fn(() => 2);
        const { frameGraph, task } = createTask();

        task.objectList.meshes = [mesh];
        task.objectIdProvider = initialProvider;
        task.textureDescriptions = [
            {
                type: Constants.PREPASS_OBJECT_ID_TEXTURE_TYPE,
                textureType: Constants.TEXTURETYPE_UNSIGNED_BYTE,
                textureFormat: Constants.TEXTUREFORMAT_RGBA,
            },
        ];
        vi.spyOn(frameGraph.textureManager, "_allocateTextures").mockImplementation(() => {});
        vi.spyOn(task, "_initializePasses").mockImplementation(() => {});

        await frameGraph.buildAsync(false);

        const configuration = MaterialHelperGeometryRendering.GetConfiguration(task.objectRenderer.renderPassId);
        expect(_GetGeometryRenderingObjectId(mesh, configuration.objectIdProvider, 0xffffff)).toBe(1);

        task.objectIdProvider = updatedProvider;

        expect(_GetGeometryRenderingObjectId(mesh, configuration.objectIdProvider, 0xffffff)).toBe(2);
        expect(initialProvider).toHaveBeenCalledExactlyOnceWith(mesh);
        expect(updatedProvider).toHaveBeenCalledExactlyOnceWith(mesh);
    });

    it.each(["instances", "thin instances"] as const)("uses the source mesh ID for %s", async (instanceType) => {
        engine.getCaps().instancedArrays = true;

        const source = MeshBuilder.CreateBox("source", { size: 1 }, scene);
        const instance = instanceType === "instances" ? source.createInstance("instance") : null;
        if (instance) {
            instance.position.x = 2;
        } else {
            source.thinInstanceAdd(Matrix.Translation(-2, 0, 0), true);
        }
        source.material = new StandardMaterial("material", scene);

        const objectIdProvider = vi.fn(() => 42);
        const { task } = createTask();
        const renderPassId = task.objectRenderer.renderPassId;
        const configuration = MaterialHelperGeometryRendering.CreateConfiguration(renderPassId);

        try {
            task.objectList.meshes = [source];
            task.objectIdProvider = objectIdProvider;
            task.objectRenderer.renderList = task.objectList.meshes;
            // Force a complete readiness check so the instanced material variant is compiled before rendering.
            task.objectRenderer.refreshRate = 0;
            configuration.defines["PREPASS_OBJECT_ID_INDEX"] = 0;
            configuration.objectIdProvider = task.objectIdProvider;
            await vi.waitFor(() => expect(task.objectRenderer.isReadyForRendering(256, 256)).toBe(true));
            task.objectRenderer.initRender(256, 256);
            try {
                task.objectRenderer.render();
            } finally {
                task.objectRenderer.finishRender();
            }

            expect(instance ? source.hasInstances : source.hasThinInstances).toBe(true);
            expect(objectIdProvider).toHaveBeenCalledExactlyOnceWith(source);
        } finally {
            MaterialHelperGeometryRendering.DeleteConfiguration(renderPassId);
        }
    });
});

describe("FrameGraphGeometryRendererTask mesh-blending tags", () => {
    let engine: NullEngine;
    let scene: Scene;
    let camera: FreeCamera;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        engine.getCaps().drawBuffersExtension = true;
        engine.getCaps().maxDrawBuffers = 8;
        vi.spyOn(engine, "buildTextureLayout").mockImplementation((textureStatus) => textureStatus.map((enabled, index) => (enabled ? index + 1 : 0)));
        scene = new Scene(engine);
        camera = new FreeCamera("camera", new Vector3(0, 0, -5), scene);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    const createTask = () => {
        const frameGraph = new FrameGraph(scene);
        const task = new FrameGraphGeometryRendererTask("geometry", frameGraph, scene);

        task.camera = camera;
        task.objectList = {
            meshes: [],
            particleSystems: [],
            spriteManagers: [],
        };
        task.renderTransparentMeshes = false;
        frameGraph.addTask(task);

        return { frameGraph, task };
    };

    const meshBlendTagDescription = {
        type: Constants.PREPASS_MESH_BLEND_TAG_TEXTURE_TYPE,
        textureType: Constants.TEXTURETYPE_UNSIGNED_BYTE,
        textureFormat: Constants.TEXTUREFORMAT_RED_INTEGER,
    };

    it.each([-1, 1.5, Number.NaN, 64, 128, 192, 256])("rejects invalid provider result %s", (value) => {
        const mesh = new Mesh("mesh", scene);

        expect(() => _GetGeometryRenderingMeshBlendTag(mesh, () => value)).toThrow("Tags must be 0 or contain a group ID between 1 and 63");
    });

    it.each([0, 1, 63, 65, 255])("accepts provider result %s", (value) => {
        const mesh = new Mesh("mesh", scene);

        expect(_GetGeometryRenderingMeshBlendTag(mesh, () => value)).toBe(value);
    });

    it("requires WebGL2 or WebGPU", () => {
        const { task } = createTask();
        task.textureDescriptions = [meshBlendTagDescription];

        expect(() => (task as any)._checkParameters()).toThrow("mesh-blending tag textures require WebGL2 or WebGPU");
    });

    it("rejects Native even though it reports a WebGL2-compatible version", () => {
        engine._webGLVersion = 2;
        (engine as any)._shaderPlatformName = "NATIVE";
        const { task } = createTask();
        task.textureDescriptions = [meshBlendTagDescription];

        expect(() => (task as any)._checkParameters()).toThrow("mesh-blending tag textures require WebGL2 or WebGPU");
    });

    it("requires per-target blend parameters for transparent mesh-blending tags on WebGL2", () => {
        engine._webGLVersion = 2;
        const { task } = createTask();
        task.renderTransparentMeshes = true;
        task.textureDescriptions = [meshBlendTagDescription];

        expect(() => (task as any)._checkParameters()).toThrow("transparent mesh-blending tags require per-target blend parameters");

        task.renderTransparentMeshes = false;
        expect(() => (task as any)._checkParameters()).not.toThrow();
    });

    it("requires the fixed R8UI format and single sampling", () => {
        engine._webGLVersion = 2;

        {
            const { task } = createTask();
            task.textureDescriptions = [{ ...meshBlendTagDescription, textureFormat: Constants.TEXTUREFORMAT_RED }];
            expect(() => (task as any)._checkParameters()).toThrow("TEXTURETYPE_UNSIGNED_BYTE with TEXTUREFORMAT_RED_INTEGER");
        }

        {
            const { task } = createTask();
            task.samples = 2;
            task.textureDescriptions = [meshBlendTagDescription];
            expect(() => (task as any)._checkParameters()).toThrow("mesh-blending tag textures require samples to be 1");
        }

        {
            const { task } = createTask();
            task.textureDescriptions = [
                meshBlendTagDescription,
                {
                    type: Constants.PREPASS_DEPTH_TEXTURE_TYPE,
                    textureType: Constants.TEXTURETYPE_FLOAT,
                    textureFormat: Constants.TEXTUREFORMAT_RED,
                },
            ];
            expect(() => (task as any)._checkParameters()).not.toThrow();
        }

        {
            const { frameGraph, task } = createTask();
            task.textureDescriptions = [meshBlendTagDescription];
            task.targetTexture = frameGraph.textureManager.createRenderTargetTexture("color", {
                size: { width: 100, height: 100 },
                sizeIsPercentage: true,
                options: {
                    createMipMaps: false,
                    types: [Constants.TEXTURETYPE_UNSIGNED_BYTE],
                    formats: [Constants.TEXTUREFORMAT_RGBA],
                    samples: 1,
                },
            });
            expect(() => (task as any)._checkParameters()).not.toThrow();
        }
    });

    it("creates the requested R8UI output and forwards the provider", () => {
        engine._webGLVersion = 2;
        const { frameGraph, task } = createTask();
        const provider = vi.fn(() => 65);
        task.meshBlendTagProvider = provider;
        task.textureDescriptions = [meshBlendTagDescription];

        (task as any)._checkParameters();
        const handles = (task as any)._getTargetHandles();
        (task as any)._registerForRenderPassId(task.objectRenderer.renderPassId);

        try {
            const creationOptions = frameGraph.textureManager.getTextureCreationOptions(handles[0]);
            const configuration = MaterialHelperGeometryRendering.GetConfiguration(task.objectRenderer.renderPassId);
            expect(creationOptions.options.types).toEqual([Constants.TEXTURETYPE_UNSIGNED_BYTE]);
            expect(creationOptions.options.formats).toEqual([Constants.TEXTUREFORMAT_RED_INTEGER]);
            expect(creationOptions.options.samples).toBe(1);
            expect(configuration.meshBlendTagProvider).toBe(provider);
        } finally {
            MaterialHelperGeometryRendering.DeleteConfiguration(task.objectRenderer.renderPassId);
        }
    });

    it("allows transparent rendering when requested by the caller", () => {
        engine._webGLVersion = 2;
        engine.getCaps().blendParametersPerTarget = true;
        const { task } = createTask();
        task.renderTransparentMeshes = true;
        task.textureDescriptions = [meshBlendTagDescription];

        expect(() => (task as any)._checkParameters()).not.toThrow();
    });

    it.each(["instances", "thin instances"] as const)("uses the source mesh tag provider for %s", async (instanceType) => {
        engine.getCaps().instancedArrays = true;

        const source = MeshBuilder.CreateBox("source", { size: 1 }, scene);
        const instance = instanceType === "instances" ? source.createInstance("instance") : null;
        if (instance) {
            instance.position.x = 2;
        } else {
            source.thinInstanceAdd(Matrix.Translation(-2, 0, 0), true);
        }
        source.material = new StandardMaterial("material", scene);

        const meshBlendTagProvider = vi.fn(() => 65);
        const { task } = createTask();
        const renderPassId = task.objectRenderer.renderPassId;
        const configuration = MaterialHelperGeometryRendering.CreateConfiguration(renderPassId);

        try {
            task.objectList.meshes = [source];
            task.meshBlendTagProvider = meshBlendTagProvider;
            task.objectRenderer.renderList = task.objectList.meshes;
            task.objectRenderer.refreshRate = 0;
            configuration.defines["PREPASS_MESH_BLEND_TAG_INDEX"] = 0;
            configuration.meshBlendTagProvider = task.meshBlendTagProvider;
            await vi.waitFor(() => expect(task.objectRenderer.isReadyForRendering(256, 256)).toBe(true));
            task.objectRenderer.initRender(256, 256);
            try {
                task.objectRenderer.render();
            } finally {
                task.objectRenderer.finishRender();
            }

            expect(instance ? source.hasInstances : source.hasThinInstances).toBe(true);
            expect(meshBlendTagProvider).toHaveBeenCalledExactlyOnceWith(source);
        } finally {
            MaterialHelperGeometryRendering.DeleteConfiguration(renderPassId);
        }
    });
});
