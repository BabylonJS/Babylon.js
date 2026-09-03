import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "core/Engines/Extensions/engine.multiRender";
import "core/Meshes/instancedMesh";
import "core/Meshes/thinInstanceMesh";
import "core/Shaders/default.fragment";
import "core/Shaders/default.vertex";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Constants } from "core/Engines/constants";
import { NullEngine } from "core/Engines/nullEngine";
import { FrameGraph } from "core/FrameGraph/frameGraph";
import { FrameGraphGeometryRendererTask } from "core/FrameGraph/Tasks/Rendering/geometryRendererTask";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { _GetGeometryRenderingObjectId, MaterialHelperGeometryRendering } from "core/Materials/materialHelper.geometryrendering";
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
        { value: 0xffffff, maxObjectId: 0xffffff },
    ])("accepts provider result $value for maximum $maxObjectId", ({ value, maxObjectId }) => {
        const mesh = new Mesh("mesh", scene);

        expect(_GetGeometryRenderingObjectId(mesh, () => value, maxObjectId)).toBe(value);
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
