import { Camera } from "core/Cameras/camera";
import { FreeCamera } from "core/Cameras/freeCamera";
import { NullEngine } from "core/Engines/nullEngine";
import { Vector3 } from "core/Maths/math.vector";
import { type Effect } from "core/Materials/effect";
import { GaussianSplattingMaterial } from "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
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
        expect(setFloat2).toHaveBeenCalledWith("focal", expect.closeTo(expectedFocal, 4), expect.closeTo(expectedFocal, 4));
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
        expect(setFloat2).toHaveBeenCalledWith("focal", expect.closeTo(leftFocal, 4), expect.closeTo(leftFocal, 4));
        expect(setFloat2).toHaveBeenCalledWith("focal", expect.closeTo(rightFocal, 4), expect.closeTo(rightFocal, 4));
    });

    it("keeps focal axes square for a side-by-side rig camera", () => {
        const rigParent = new FreeCamera("rigParent", Vector3.Zero(), scene);
        const rigCamera = new FreeCamera("rigCamera", Vector3.Zero(), scene);
        const secondRigCamera = new FreeCamera("secondRigCamera", Vector3.Zero(), scene);
        rigCamera.fov = 0.8;
        rigCamera.fovMode = Camera.FOVMODE_HORIZONTAL_FIXED;
        rigCamera.viewport.width = 0.5;
        rigCamera.rigParent = rigParent;
        secondRigCamera.rigParent = rigParent;
        rigParent._rigCameras.push(rigCamera, secondRigCamera);
        scene.activeCamera = rigCamera;

        GaussianSplattingMaterial.BindEffect({ material } as unknown as Mesh, effect, scene);

        const eyeWidth = engine.getRenderWidth() * rigCamera.viewport.width;
        const expectedFocal = eyeWidth / 2 / Math.tan(rigCamera.fov / 2);
        expect(setFloat2).toHaveBeenCalledWith("invViewport", 1 / (eyeWidth / 2), 1 / engine.getRenderHeight());
        expect(setFloat2).toHaveBeenCalledWith("focal", expect.closeTo(expectedFocal, 4), expect.closeTo(expectedFocal, 4));
    });
});

describe("GaussianSplattingMaterial compensation", () => {
    let engine: NullEngine;
    let scene: Scene;
    let mesh: GaussianSplattingMesh;

    const createSplatData = (count: number) => {
        const data = new ArrayBuffer(count * 32);
        const floats = new Float32Array(data);
        const bytes = new Uint8Array(data);
        for (let i = 0; i < count; i++) {
            floats[i * 8 + 0] = i;
            floats[i * 8 + 3] = 0.5;
            floats[i * 8 + 4] = 0.5;
            floats[i * 8 + 5] = 0.5;
            bytes.fill(255, i * 32 + 24, i * 32 + 28);
            bytes.fill(128, i * 32 + 29, i * 32 + 32);
        }
        return data;
    };

    // Runs isReadyForSubMesh like a render would and reports whether the effect has COMPENSATION.
    const isCompensationCompiledAsync = async () => {
        const material = mesh.material!;
        const subMesh = mesh.subMeshes[0];
        scene.incrementRenderId();
        material.isReadyForSubMesh(mesh, subMesh);
        await subMesh.effect!.whenCompiledAsync();
        scene.incrementRenderId();
        expect(material.isReadyForSubMesh(mesh, subMesh)).toBe(true);
        return subMesh.effect!.defines.includes("#define COMPENSATION");
    };

    beforeEach(() => {
        engine = new NullEngine();
        (engine.getCaps() as { maxVertexUniformVectors: number }).maxVertexUniformVectors = 256;
        scene = new Scene(engine);
        scene.activeCamera = new FreeCamera("camera", new Vector3(0, 0, -10), scene);
        mesh = new GaussianSplattingMesh("gs", null, scene);
        // No sort worker in Node.
        mesh.disableDepthSort = true;
        mesh.updateData(createSplatData(4));
    });

    afterEach(() => {
        GaussianSplattingMaterial.Compensation = false;
        scene.dispose();
        engine.dispose();
    });

    it("recompiles when compensation is turned on and back off", async () => {
        const material = mesh.material as GaussianSplattingMaterial;
        expect(await isCompensationCompiledAsync()).toBe(false);

        material.compensation = true;
        expect(await isCompensationCompiledAsync()).toBe(true);

        material.compensation = false;
        expect(await isCompensationCompiledAsync()).toBe(false);
    });

    it("keeps the pending rebuild when the same value is assigned twice before rendering", async () => {
        const material = mesh.material as GaussianSplattingMaterial;
        expect(await isCompensationCompiledAsync()).toBe(false);

        material.compensation = true;
        material.compensation = true;
        expect(await isCompensationCompiledAsync()).toBe(true);

        material.compensation = false;
        material.compensation = false;
        expect(await isCompensationCompiledAsync()).toBe(false);
    });

    it("lets a material turn compensation off when the static default is on", async () => {
        GaussianSplattingMaterial.Compensation = true;
        mesh = new GaussianSplattingMesh("gsDefaultOn", null, scene);
        mesh.disableDepthSort = true;
        mesh.updateData(createSplatData(4));
        (mesh.material as GaussianSplattingMaterial).compensation = false;

        expect(await isCompensationCompiledAsync()).toBe(false);
    });
});
