import { Camera } from "core/Cameras/camera";
import { FreeCamera } from "core/Cameras/freeCamera";
import { NullEngine } from "core/Engines/nullEngine";
import { Vector3 } from "core/Maths/math.vector";
import { type Effect } from "core/Materials/effect";
import { GaussianSplattingMaterial } from "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { type GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { type Mesh } from "core/Meshes/mesh";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("GaussianSplattingMaterial", () => {
    let engine: NullEngine;
    let scene: Scene;
    let material: GaussianSplattingMaterial;
    let effect: Effect;
    let setFloat2: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        engine = new NullEngine({
            renderWidth: 1000,
            renderHeight: 500,
            textureSize: 1024,
        });
        scene = new Scene(engine);
        material = new GaussianSplattingMaterial("material", scene);
        material.setSourceMesh({ covariancesATexture: null } as unknown as GaussianSplattingMesh);

        setFloat2 = vi.fn();
        effect = {
            setFloat2,
            setFloat: vi.fn(),
            setFloat3: vi.fn(),
        } as unknown as Effect;
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("derives each focal axis from the projection matrix in horizontal fixed-FOV mode", () => {
        const camera = new FreeCamera("camera", Vector3.Zero(), scene);
        camera.fov = 0.8;
        camera.fovMode = Camera.FOVMODE_HORIZONTAL_FIXED;
        scene.activeCamera = camera;

        GaussianSplattingMaterial.BindEffect({ material } as unknown as Mesh, effect, scene);

        const projection = camera.getProjectionMatrix();
        const expectedFocal = engine.getRenderWidth() / 2 / Math.tan(camera.fov / 2);
        expect(setFloat2).toHaveBeenCalledWith("focal", expect.closeTo(expectedFocal, 10), expect.closeTo(expectedFocal, 10));
        expect(projection.m[0]).not.toBe(projection.m[5]);
    });

    it("binds default viewport and focal values without an active camera", () => {
        GaussianSplattingMaterial.BindEffect({ material } as unknown as Mesh, effect, scene);

        expect(setFloat2).toHaveBeenCalledWith("invViewport", 1 / engine.getRenderWidth(), 1 / engine.getRenderHeight());
        expect(setFloat2).toHaveBeenCalledWith("focal", 1000, 1000);
    });

    it("derives focal axes from an orthographic projection", () => {
        const camera = new FreeCamera("camera", Vector3.Zero(), scene);
        camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
        camera.orthoLeft = -4;
        camera.orthoRight = 4;
        camera.orthoBottom = -2;
        camera.orthoTop = 2;
        scene.activeCamera = camera;

        GaussianSplattingMaterial.BindEffect({ material } as unknown as Mesh, effect, scene);

        expect(setFloat2).toHaveBeenCalledWith("focal", 125, 125);
    });

    it("uses the camera currently rendered by a multi-camera scene", () => {
        const leftCamera = new FreeCamera("left", Vector3.Zero(), scene);
        leftCamera.fov = 0.8;
        leftCamera.fovMode = Camera.FOVMODE_HORIZONTAL_FIXED;
        leftCamera.viewport.width = 0.4;

        const rightCamera = new FreeCamera("right", Vector3.Zero(), scene);
        rightCamera.fov = 1.2;
        rightCamera.fovMode = Camera.FOVMODE_HORIZONTAL_FIXED;
        rightCamera.viewport.x = 0.4;
        rightCamera.viewport.width = 0.6;
        scene.activeCameras = [leftCamera, rightCamera];

        for (const camera of scene.activeCameras!) {
            scene.activeCamera = camera;
            GaussianSplattingMaterial.BindEffect({ material } as unknown as Mesh, effect, scene);
        }

        const leftFocal = (engine.getRenderWidth() * leftCamera.viewport.width) / 2 / Math.tan(leftCamera.fov / 2);
        const rightFocal = (engine.getRenderWidth() * rightCamera.viewport.width) / 2 / Math.tan(rightCamera.fov / 2);
        expect(setFloat2).toHaveBeenCalledWith("focal", expect.closeTo(leftFocal, 10), expect.closeTo(leftFocal, 10));
        expect(setFloat2).toHaveBeenCalledWith("focal", expect.closeTo(rightFocal, 10), expect.closeTo(rightFocal, 10));
    });
});
