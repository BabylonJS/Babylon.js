import { describe, expect, it } from "vitest";
import { Camera } from "core/Cameras/camera.pure";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { type IResolvedCamera } from "loaders/USD/resolution/resolvedStage";
import { CreateCameraFromResolved } from "loaders/USD/adapter/cameraAdapter";

describe("USD camera adapter", () => {
    it("maps a perspective UsdGeomCamera to vertical fixed field of view and clip planes", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const resolvedCamera: IResolvedCamera = {
            projection: "perspective",
            focalLength: 50,
            horizontalAperture: 20,
            verticalAperture: 25,
            clippingRange: [0.25, 500],
        };

        const camera = CreateCameraFromResolved(resolvedCamera, "Camera", scene);

        expect(camera.mode).toBe(Camera.PERSPECTIVE_CAMERA);
        expect(camera.fovMode).toBe(Camera.FOVMODE_VERTICAL_FIXED);
        expect(camera.fov).toBeCloseTo(2 * Math.atan(25 / (2 * 50)), 6);
        expect(camera.minZ).toBe(0.25);
        expect(camera.maxZ).toBe(500);

        scene.dispose();
        engine.dispose();
    });

    it("maps an orthographic UsdGeomCamera to orthographic camera bounds", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const resolvedCamera: IResolvedCamera = {
            projection: "orthographic",
            focalLength: 50,
            horizontalAperture: 20,
            verticalAperture: 10,
            clippingRange: [1, 100],
        };

        const camera = CreateCameraFromResolved(resolvedCamera, "OrthoCamera", scene);

        expect(camera.mode).toBe(Camera.ORTHOGRAPHIC_CAMERA);
        expect(camera.orthoLeft).toBe(-1);
        expect(camera.orthoRight).toBe(1);
        expect(camera.orthoBottom).toBe(-0.5);
        expect(camera.orthoTop).toBe(0.5);
        expect(camera.minZ).toBe(1);
        expect(camera.maxZ).toBe(100);

        scene.dispose();
        engine.dispose();
    });
});
