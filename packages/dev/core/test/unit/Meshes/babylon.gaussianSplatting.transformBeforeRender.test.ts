import { FreeCamera } from "core/Cameras/freeCamera";
import { NullEngine } from "core/Engines/nullEngine";
import "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { Matrix, Vector3 } from "core/Maths/math.vector";
import { Mesh } from "core/Meshes/mesh";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("GaussianSplatting transform before first render", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        (engine.getCaps() as { maxVertexUniformVectors: number }).maxVertexUniformVectors = 256;
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("remains ready when its transform changes after the first depth sort completes", () => {
        const camera = new FreeCamera("camera", new Vector3(0, 0, -10), scene);
        scene.activeCamera = camera;

        const mesh = new GaussianSplattingMesh("gs", null, scene);
        const cameraMesh = new Mesh("cameraMesh", scene);
        Reflect.set(mesh, "_readyToDisplay", true);
        const cameraViewInfos = Reflect.get(mesh, "_cameraViewInfos") as Map<number, object>;
        cameraViewInfos.set(camera.uniqueId, {
            camera,
            cameraDirection: Vector3.Zero(),
            sortWorldMatrix: Matrix.Identity(),
            sortCameraForward: Vector3.Zero(),
            sortCameraPosition: Vector3.Zero(),
            sortRequestId: 1,
            sortAppliedId: 1,
            mesh: cameraMesh,
            frameIdLastUpdate: scene.getFrameId(),
            splatIndexBufferSet: true,
        });
        const postToWorker = vi.spyOn(mesh, "_postToWorker").mockImplementation(() => {});

        mesh.position.y = 1;

        expect(mesh.isReady()).toBe(true);
        expect(postToWorker).toHaveBeenCalledWith(true);
    });
});
