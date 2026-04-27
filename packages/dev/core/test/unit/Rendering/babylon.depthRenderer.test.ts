import { NullEngine } from "core/Engines/nullEngine";
import { type Engine } from "core/Engines/engine";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { Vector3 } from "core/Maths/math.vector";
import { Scene } from "core/scene";
import { vi } from "vitest";

import "core/Rendering/depthRendererSceneComponent";

// Pre-load shader modules used by the DepthRenderer.
import "core/Shaders/depth.fragment";
import "core/Shaders/depth.vertex";

describe("DepthRenderer", () => {
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
        new ArcRotateCamera("camera", 0, 0, 10, Vector3.Zero(), scene);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("customIsReadyFunction should skip submeshes with disableDepthWrite", () => {
        const depthRenderer = scene.enableDepthRenderer();
        const depthMap = depthRenderer.getDepthMap();

        // Create a mesh whose material disables depth write
        const mesh = MeshBuilder.CreateBox("box", { size: 1 }, scene);
        const material = new StandardMaterial("mat", scene);
        material.disableDepthWrite = true;
        mesh.material = material;

        // The customIsReadyFunction should return true because the mesh
        // should be skipped (it won't be rendered by the depth renderer).
        // Before the fix, this would return false and block scene readiness.
        const result = depthMap.customIsReadyFunction!(mesh, 1, true);
        expect(result).toBe(true);
    });

    it("customIsReadyFunction should skip submeshes on infiniteDistance meshes", () => {
        const depthRenderer = scene.enableDepthRenderer();
        const depthMap = depthRenderer.getDepthMap();

        const mesh = MeshBuilder.CreateBox("skybox", { size: 1 }, scene);
        mesh.material = new StandardMaterial("mat", scene);
        mesh.infiniteDistance = true;

        // infiniteDistance meshes are skipped during depth rendering,
        // so the readiness check should skip them too.
        const result = depthMap.customIsReadyFunction!(mesh, 1, true);
        expect(result).toBe(true);
    });

    it("isReady should not corrupt the draw wrapper of a non-depth render pass (forum bug 63230)", async () => {
        const depthRenderer = scene.enableDepthRenderer();
        const depthMap = depthRenderer.getDepthMap();
        const depthPassId = depthMap.renderPassId;

        const mesh = MeshBuilder.CreateBox("box", { size: 1 }, scene);
        mesh.material = new StandardMaterial("mat", scene);
        const subMesh = mesh.subMeshes[0];

        // Simulate isReady being called from outside the depth render pass (e.g. from
        // EffectLayer / scene readiness checks). engine.currentRenderPassId is the
        // main render pass id, which is not one of the depth map's render pass ids.
        engine.currentRenderPassId = 0; // RENDERPASS_MAIN
        expect(depthMap.renderPassIds.includes(0)).toBe(false);

        // The depth shader is loaded asynchronously by the constructor. Poll until isReady
        // actually proceeds past the early _shadersLoaded guard.
        await vi.waitFor(() => {
            depthRenderer.isReady(subMesh, false);
            expect(subMesh._getDrawWrapper(depthPassId, false)).toBeDefined();
        });

        // The depth effect must be stamped onto the depth pass's draw wrapper,
        // not onto the current (main) pass's draw wrapper. Otherwise frozen materials
        // sharing the main-pass draw wrapper render with the depth effect (black).
        const mainPassWrapper = subMesh._getDrawWrapper(0, false);
        const depthPassWrapper = subMesh._getDrawWrapper(depthPassId, false)!;

        // The depth pass wrapper must own the depth effect.
        expect(depthPassWrapper.effect).not.toBeNull();
        // The main pass wrapper must not have been polluted with the depth effect.
        // Either it doesn't exist (no draw wrapper at the main pass), or it doesn't
        // carry the depth effect.
        const mainPassEffect = mainPassWrapper?.effect ?? null;
        expect(mainPassEffect).not.toBe(depthPassWrapper.effect);
    });
});
