import { describe, expect, it } from "vitest";
import { Camera } from "core/Cameras/camera.pure";
import { NullEngine } from "core/Engines/nullEngine";
import { DirectionalLight } from "core/Lights/directionalLight.pure";
import { PointLight } from "core/Lights/pointLight.pure";
import { Scene } from "core/scene";
import { type IResolvedCamera, type IResolvedLight } from "loaders/USD/resolution/resolvedStage";
import { CreateCameraFromResolved, CreateLightFromResolved } from "loaders/USD/adapter/lightCameraAdapter";

describe("USD light and camera adapter", () => {
    it("maps resolved distant and sphere lights to Babylon lights", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);

        const distantLight: IResolvedLight = {
            kind: "distant",
            color: [0.25, 0.5, 0.75],
            intensity: 3,
            exposure: 2,
        };
        const sphereLight: IResolvedLight = {
            kind: "sphere",
            color: [1, 0.5, 0.25],
            intensity: 4,
            exposure: -1,
            radius: 0.75,
        };

        const babylonDistantLight = CreateLightFromResolved(distantLight, "Sun", scene);
        const babylonSphereLight = CreateLightFromResolved(sphereLight, "Bulb", scene);

        expect(babylonDistantLight).toBeInstanceOf(DirectionalLight);
        expect(babylonDistantLight!.intensity).toBe(12);
        expect(babylonDistantLight!.diffuse.r).toBe(0.25);
        expect(babylonDistantLight!.diffuse.g).toBe(0.5);
        expect(babylonDistantLight!.diffuse.b).toBe(0.75);

        expect(babylonSphereLight).toBeInstanceOf(PointLight);
        expect(babylonSphereLight!.intensity).toBe(2);
        expect(babylonSphereLight!.diffuse.r).toBe(1);
        expect(babylonSphereLight!.diffuse.g).toBe(0.5);
        expect(babylonSphereLight!.diffuse.b).toBe(0.25);
        expect(babylonSphereLight!.radius).toBe(0.75);

        scene.dispose();
        engine.dispose();
    });

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
