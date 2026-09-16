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

    it("tracks mesh evaluation during scene rendering", () => {
        const camera = new FreeCamera("camera", new Vector3(0, 0, -10), scene);
        scene.activeCamera = camera;
        const mesh = new Mesh("mesh", scene);
        scene.onBeforeRenderObservable.add(() => {
            expect(scene._isInRenderingMeshEvaluation()).toBe(false);
        });
        const isReady = vi.spyOn(mesh, "isReady").mockImplementation(() => {
            expect(scene._isInRenderingMeshEvaluation()).toBe(true);
            return false;
        });

        expect(scene._isInRenderingMeshEvaluation()).toBe(false);
        scene.render();

        expect(isReady).toHaveBeenCalled();
        expect(scene._isInRenderingMeshEvaluation()).toBe(false);
    });

    it("tracks mesh evaluation during frame graph rendering", () => {
        const mesh = new Mesh("mesh", scene);
        const isReady = vi.spyOn(mesh, "isReady").mockImplementation(() => {
            expect(scene._isInRenderingMeshEvaluation()).toBe(true);
            return false;
        });
        const renderWithFrameGraph = Reflect.get(scene, "_renderWithFrameGraph") as (updateCameras: boolean, ignoreAnimations: boolean) => void;

        renderWithFrameGraph.call(scene, false, false);

        expect(isReady).toHaveBeenCalled();
        expect(scene._isInRenderingMeshEvaluation()).toBe(false);
    });

    it("tracks mesh evaluation during custom rendering", () => {
        const customRenderFunction = vi.fn(() => {
            expect(scene._isInRenderingMeshEvaluation()).toBe(true);
        });
        scene.customRenderFunction = customRenderFunction;

        scene.render();

        expect(customRenderFunction).toHaveBeenCalled();
        expect(scene._isInRenderingMeshEvaluation()).toBe(false);
    });

    it.each([
        { title: "waits for a transform refresh outside rendering mesh evaluation", renderingMeshEvaluationDepth: 0, expectedReady: false },
        { title: "remains ready when its transform changes during rendering mesh evaluation", renderingMeshEvaluationDepth: 1, expectedReady: true },
    ])("$title", ({ renderingMeshEvaluationDepth, expectedReady }) => {
        const camera = new FreeCamera("camera", new Vector3(0, 0, -10), scene);
        scene.activeCamera = camera;

        const mesh = new GaussianSplattingMesh("gs", null, scene);
        const cameraMesh = new Mesh("cameraMesh", scene);
        Reflect.set(mesh, "_readyToDisplay", true);
        Reflect.set(scene, "_renderingMeshEvaluationDepth", renderingMeshEvaluationDepth);
        const cameraViewInfos = Reflect.get(mesh, "_cameraViewInfos") as Map<number, object>;
        const cameraViewInfo = {
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
        };
        cameraViewInfos.set(camera.uniqueId, cameraViewInfo);
        const postToWorker = vi.spyOn(mesh, "_postToWorker").mockImplementation(() => {});

        mesh.position.y = 1;

        expect(mesh.isReady()).toBe(expectedReady);
        expect(postToWorker).toHaveBeenCalledWith(true);

        cameraViewInfo.sortRequestId = 2;

        expect(mesh.isReady()).toBe(expectedReady);
    });

    it("waits for every active camera to complete its initial sort", () => {
        const camera = new FreeCamera("camera", new Vector3(0, 0, -10), scene);
        const camera2 = new FreeCamera("camera2", new Vector3(0, 0, 10), scene);
        scene.activeCameras = [camera, camera2];
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        const cameraViewInfos = Reflect.get(mesh, "_cameraViewInfos") as Map<number, object>;
        const createCameraViewInfo = (viewCamera: FreeCamera, sortRequestId: number, sortAppliedId: number) => ({
            camera: viewCamera,
            cameraDirection: Vector3.Zero(),
            sortWorldMatrix: Matrix.Identity(),
            sortCameraForward: Vector3.Zero(),
            sortCameraPosition: Vector3.Zero(),
            sortRequestId,
            sortAppliedId,
            mesh: new Mesh(`${viewCamera.name}Mesh`, scene),
            frameIdLastUpdate: scene.getFrameId(),
            splatIndexBufferSet: true,
        });
        cameraViewInfos.set(camera.uniqueId, createCameraViewInfo(camera, 1, 1));
        cameraViewInfos.set(camera2.uniqueId, createCameraViewInfo(camera2, 0, 0));
        Reflect.set(mesh, "_readyToDisplay", true);
        const depthMix = new BigInt64Array(16);
        Reflect.set(mesh, "_depthMix", depthMix);
        const postMessage = vi.fn();
        Reflect.set(mesh, "_worker", { postMessage, terminate: vi.fn() });

        expect(mesh.isReady()).toBe(false);
        expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({ cameraId: camera2.uniqueId }), [depthMix.buffer]);
    });

    it("waits for transform refreshes in multi-camera scenes", () => {
        const camera = new FreeCamera("camera", new Vector3(0, 0, -10), scene);
        const camera2 = new FreeCamera("camera2", new Vector3(0, 0, 10), scene);
        scene.activeCameras = [camera, camera2];
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        const cameraViewInfos = Reflect.get(mesh, "_cameraViewInfos") as Map<number, object>;
        for (const activeCamera of scene.activeCameras) {
            cameraViewInfos.set(activeCamera.uniqueId, {
                camera: activeCamera,
                cameraDirection: Vector3.Zero(),
                sortWorldMatrix: Matrix.Identity(),
                sortCameraForward: Vector3.Zero(),
                sortCameraPosition: Vector3.Zero(),
                sortRequestId: activeCamera.uniqueId,
                sortAppliedId: activeCamera.uniqueId,
                mesh: new Mesh(`${activeCamera.name}Mesh`, scene),
                frameIdLastUpdate: scene.getFrameId(),
                splatIndexBufferSet: true,
            });
        }
        Reflect.set(mesh, "_readyToDisplay", true);
        const postToWorker = vi.spyOn(mesh, "_postToWorker").mockImplementation(() => {});

        mesh.position.y = 1;

        expect(mesh.isReady()).toBe(false);
        expect(postToWorker).toHaveBeenCalledWith(true);
    });
});
