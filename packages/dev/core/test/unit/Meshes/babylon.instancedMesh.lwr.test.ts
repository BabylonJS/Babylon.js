import type { Engine } from "core/Engines";
import { NullEngine } from "core/Engines/nullEngine";
import { PerformanceConfigurator } from "core/Engines/performanceConfigurator";
import { Vector3 } from "core/Maths/math.vector";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { Scene } from "core/scene";
import { FreeCamera } from "core/Cameras/freeCamera";

describe("InstancedMesh with LargeWorldRendering", () => {
    let engine: Engine;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });

        // NullEngine doesn't support useLargeWorldRendering in its constructor options,
        // so we manually configure the two things it would set:
        // 1. Float64 matrix precision (normally set by AbstractEngine constructor)
        PerformanceConfigurator.SetMatrixPrecision(true);
        // 2. Scene floating origin mode (normally triggered by engine.getCreationOptions().useLargeWorldRendering)
        //    — handled by passing { useFloatingOrigin: true } to each Scene constructor below
    });

    afterEach(() => {
        engine.dispose();
    });

    /**
     * Helper: sets up a scene with LWR, creates a mesh + instance at the given positions,
     * triggers _updateInstancedBuffers, and returns the Float32 instance data.
     * @param cameraPos Position of the camera
     * @param meshPos Position of the master mesh
     * @param instancePos Position of the instance mesh
     * @returns Float32Array containing the instance data as it would be sent to the shader, for both master and instance.
     */
    function setupAndGetInstanceData(cameraPos: Vector3, meshPos: Vector3, instancePos: Vector3): Float32Array {
        const scene = new Scene(engine, { useFloatingOrigin: true });
        const camera = new FreeCamera("camera", cameraPos, scene);
        scene.activeCamera = camera;
        camera.getViewMatrix(true);

        const mesh = MeshBuilder.CreateBox("box", { size: 1 }, scene);
        mesh.position.copyFrom(meshPos);

        const instance = mesh.createInstance("inst");
        instance.position.copyFrom(instancePos);

        // Compute world matrices (Float64 internally)
        mesh.computeWorldMatrix(true);
        instance.computeWorldMatrix(true);

        // Register the instance for the current render ID so it appears in the batch
        const renderId = scene.getRenderId();
        mesh._registerInstanceForRenderId(instance, renderId);

        // Get the batch with visible instances
        const batch = mesh._getInstancesRenderList(0);
        batch.renderSelf[0] = true;

        // Pre-allocate instance data buffer (mimics what _renderWithInstances does)
        const storage = batch.parent;
        const matricesCount = 2; // master + 1 instance
        const bufferSize = matricesCount * 16 * 4;
        while (storage.instancesBufferSize < bufferSize) {
            storage.instancesBufferSize *= 2;
        }
        storage.instancesData = new Float32Array(storage.instancesBufferSize / 4);

        // Call _updateInstancedBuffers directly (no effect/fillMode so it won't try to draw)
        mesh._updateInstancedBuffers(mesh.subMeshes[0], batch, storage.instancesBufferSize, engine);

        // Copy out the data before disposing the scene
        const result = new Float32Array(storage.instancesData);
        scene.dispose();

        return result;
    }

    it("should apply floating origin offset with correct precision", () => {
        const data = setupAndGetInstanceData(
            new Vector3(1000000, 2000000, 3000000), // camera
            new Vector3(1000000.5, 2000000.5, 3000000.5), // mesh
            new Vector3(1000001.25, 2000001.25, 3000001.25) // instance
        );

        // Master mesh: position - camera = (0.5, 0.5, 0.5)
        expect(data[12]).toBeCloseTo(0.5, 4);
        expect(data[13]).toBeCloseTo(0.5, 4);
        expect(data[14]).toBeCloseTo(0.5, 4);

        // Instance: position - camera = (1.25, 1.25, 1.25)
        expect(data[28]).toBeCloseTo(1.25, 4);
        expect(data[29]).toBeCloseTo(1.25, 4);
        expect(data[30]).toBeCloseTo(1.25, 4);
    });

    it("should not lose sub-unit precision at very large coordinates", () => {
        // At 10,000,000 Float32 has ~1.0 unit of precision, so 0.1 differences would be lost
        // if the subtraction happened after Float32 truncation.
        const data = setupAndGetInstanceData(
            new Vector3(10000000, 0, 0), // camera
            new Vector3(10000000.1, 0, 0), // mesh: offset 0.1 from camera
            new Vector3(10000000.2, 0, 0) // instance: offset 0.2 from camera
        );

        // Master mesh x: 10000000.1 - 10000000 = 0.1
        expect(data[12]).toBeCloseTo(0.1, 2);

        // Instance x: 10000000.2 - 10000000 = 0.2
        expect(data[28]).toBeCloseTo(0.2, 2);
    });

    it("should handle instances with non-identity rotation at large coordinates", () => {
        const scene = new Scene(engine, { useFloatingOrigin: true });
        const camera = new FreeCamera("camera", new Vector3(5000000, 5000000, 5000000), scene);
        scene.activeCamera = camera;
        camera.getViewMatrix(true);

        const mesh = MeshBuilder.CreateBox("box", { size: 1 }, scene);
        mesh.position.set(5000000, 5000000, 5000000);
        mesh.rotation.set(0, Math.PI / 4, 0);

        const instance = mesh.createInstance("inst");
        instance.position.set(5000010, 5000010, 5000010);
        instance.rotation.set(0, Math.PI / 2, 0);

        mesh.computeWorldMatrix(true);
        instance.computeWorldMatrix(true);

        const renderId = scene.getRenderId();
        mesh._registerInstanceForRenderId(instance, renderId);
        const batch = mesh._getInstancesRenderList(0);
        batch.renderSelf[0] = true;

        const storage = batch.parent;
        storage.instancesBufferSize = 2 * 16 * 4;
        storage.instancesData = new Float32Array(storage.instancesBufferSize / 4);

        mesh._updateInstancedBuffers(mesh.subMeshes[0], batch, storage.instancesBufferSize, engine);

        const data = storage.instancesData;

        // Translation components should be small (position - camera)
        // Master: (0, 0, 0), Instance: (10, 10, 10)
        expect(data[12]).toBeCloseTo(0, 2);
        expect(data[13]).toBeCloseTo(0, 2);
        expect(data[14]).toBeCloseTo(0, 2);

        expect(data[28]).toBeCloseTo(10, 2);
        expect(data[29]).toBeCloseTo(10, 2);
        expect(data[30]).toBeCloseTo(10, 2);

        scene.dispose();
    });
});
