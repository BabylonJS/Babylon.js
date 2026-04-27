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

    describe("Per-frame uniform gating", () => {
        // The 5 subsurface-scattering uniforms are only read by the shader inside
        // `#ifdef SUBSURFACE_SLAB`, so the per-frame UBO update loop in
        // `bindForSubMesh` skips them when SSS is inactive. The skip is wired by
        // the `requiredDefine` field on the cached `_uniformsArray` entries; this
        // test asserts the wiring is in place. The actual per-frame skip is then
        // a plain inline check in `bindForSubMesh`:
        //   `if (uniform.requiredDefine !== undefined && !defines[uniform.requiredDefine]) continue;`
        // Driving that loop end-to-end from a unit test would require a real GPU
        // pipeline context, so we cover its runtime behavior via the playground
        // perf benchmark documented in the PR instead.
        it("tags SSS uniforms with requiredDefine = 'SUBSURFACE_SLAB' and leaves other uniforms ungated", () => {
            const material = new OpenPBRMaterial("mat", scene);
            const uniformsArray: { name: string; requiredDefine?: string }[] = (material as any)._uniformsArray;

            expect(uniformsArray.length).toBeGreaterThan(0);

            const sssUniformNames = ["vSubsurfaceWeight", "vSubsurfaceColor", "vSubsurfaceRadius", "vSubsurfaceRadiusScale", "vSubsurfaceScatterAnisotropy"];
            for (const name of sssUniformNames) {
                const uniform = uniformsArray.find((u) => u.name === name);
                expect(uniform, `expected uniform ${name} to be present`).toBeDefined();
                expect(uniform!.requiredDefine, `expected ${name} to be gated by SUBSURFACE_SLAB`).toBe("SUBSURFACE_SLAB");
            }

            // A representative non-SSS uniform must not be gated, otherwise we'd silently
            // stop pushing base-layer values to the UBO.
            const baseWeight = uniformsArray.find((u) => u.name === "vBaseWeight");
            expect(baseWeight, "expected vBaseWeight to be present").toBeDefined();
            expect(baseWeight!.requiredDefine).toBeUndefined();
        });

        it("caches firstLinkedKey on each Uniform so the per-frame loop avoids Object.keys allocation", () => {
            const material = new OpenPBRMaterial("mat", scene);
            const uniformsArray: { name: string; firstLinkedKey: string; linkedProperties: Record<string, unknown> }[] = (material as any)._uniformsArray;

            expect(uniformsArray.length).toBeGreaterThan(0);
            for (const uniform of uniformsArray) {
                expect(uniform.firstLinkedKey, `expected ${uniform.name} to have a cached firstLinkedKey`).not.toBe("");
                expect(uniform.linkedProperties[uniform.firstLinkedKey], `cached firstLinkedKey on ${uniform.name} must point to a real linked property`).toBeDefined();
            }
        });
    });
});
