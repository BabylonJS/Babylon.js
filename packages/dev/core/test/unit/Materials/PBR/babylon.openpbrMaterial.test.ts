import { describe, it, expect, vi, beforeEach } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { type Engine } from "core/Engines/engine";
import { Mesh } from "core/Meshes/mesh";
import { SubMesh } from "core/Meshes/subMesh";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { ThinTexture } from "core/Materials/Textures/thinTexture";
import { Scene } from "core/scene";

describe("OpenPBRMaterial", () => {
    let engine: Engine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
    });

    describe("SSS texture readiness blocking", () => {
        it("isReadyForSubMesh returns false when sssIrradianceTexture is assigned but not ready", () => {
            const material = new OpenPBRMaterial("mat", scene);
            material.subsurfaceWeight = 0.5;

            const mesh = new Mesh("testMesh", scene);
            mesh.subMeshes = [];
            mesh.material = material;
            // createBoundingBox=false avoids computing bounding info on a geometry-less mesh
            new SubMesh(0, 0, 0, 0, 0, mesh, undefined, false);

            const notReadyTexture = new ThinTexture(null);
            vi.spyOn(notReadyTexture, "isReady").mockReturnValue(false);
            const readyTexture = new ThinTexture(null);
            vi.spyOn(readyTexture, "isReady").mockReturnValue(true);

            // Assign textures before the first isReadyForSubMesh call so the
            // freshly-created MaterialDefines see them with _areTexturesDirty=true.
            material.sssIrradianceTexture = notReadyTexture;
            material.sssDepthTexture = readyTexture;

            expect(material.isReadyForSubMesh(mesh, mesh.subMeshes[0])).toBe(false);
        });

        it("isReadyForSubMesh returns false when sssDepthTexture is assigned but not ready", () => {
            const material = new OpenPBRMaterial("mat", scene);
            material.subsurfaceWeight = 0.5;

            const mesh = new Mesh("testMesh", scene);
            mesh.subMeshes = [];
            mesh.material = material;
            new SubMesh(0, 0, 0, 0, 0, mesh, undefined, false);

            const readyTexture = new ThinTexture(null);
            vi.spyOn(readyTexture, "isReady").mockReturnValue(true);
            const notReadyTexture = new ThinTexture(null);
            vi.spyOn(notReadyTexture, "isReady").mockReturnValue(false);

            material.sssIrradianceTexture = readyTexture;
            material.sssDepthTexture = notReadyTexture;

            expect(material.isReadyForSubMesh(mesh, mesh.subMeshes[0])).toBe(false);
        });

        it("scene.isReady() returns false while sssIrradianceTexture is not ready", () => {
            const material = new OpenPBRMaterial("mat", scene);
            material.subsurfaceWeight = 0.5;

            const mesh = new Mesh("testMesh", scene);
            mesh.subMeshes = [];
            mesh.material = material;
            new SubMesh(0, 0, 0, 0, 0, mesh, undefined, false);

            const notReadyTexture = new ThinTexture(null);
            vi.spyOn(notReadyTexture, "isReady").mockReturnValue(false);
            const readyTexture = new ThinTexture(null);
            vi.spyOn(readyTexture, "isReady").mockReturnValue(true);

            material.sssIrradianceTexture = notReadyTexture;
            material.sssDepthTexture = readyTexture;

            expect(scene.isReady()).toBe(false);
        });

        it("scene.isReady() returns false while sssDepthTexture is not ready", () => {
            const material = new OpenPBRMaterial("mat", scene);
            material.subsurfaceWeight = 0.5;

            const mesh = new Mesh("testMesh", scene);
            mesh.subMeshes = [];
            mesh.material = material;
            new SubMesh(0, 0, 0, 0, 0, mesh, undefined, false);

            const readyTexture = new ThinTexture(null);
            vi.spyOn(readyTexture, "isReady").mockReturnValue(true);
            const notReadyTexture = new ThinTexture(null);
            vi.spyOn(notReadyTexture, "isReady").mockReturnValue(false);

            material.sssIrradianceTexture = readyTexture;
            material.sssDepthTexture = notReadyTexture;

            expect(scene.isReady()).toBe(false);
        });

        it("scene.onReadyObservable does not fire while SSS textures are not ready", () => {
            const material = new OpenPBRMaterial("mat", scene);
            material.subsurfaceWeight = 0.5;

            const mesh = new Mesh("testMesh", scene);
            mesh.subMeshes = [];
            mesh.material = material;
            new SubMesh(0, 0, 0, 0, 0, mesh, undefined, false);

            const notReadyTexture = new ThinTexture(null);
            vi.spyOn(notReadyTexture, "isReady").mockReturnValue(false);

            material.sssIrradianceTexture = notReadyTexture;
            material.sssDepthTexture = notReadyTexture;

            const readyCallback = vi.fn();
            scene.onReadyObservable.add(readyCallback);

            // scene.isReady() is false so _checkIsReady would not notify the observable
            expect(scene.isReady()).toBe(false);
            expect(readyCallback).not.toHaveBeenCalled();
        });
    });
});
