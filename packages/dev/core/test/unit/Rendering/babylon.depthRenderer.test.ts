import { NullEngine } from "core/Engines/nullEngine";
import { type Engine } from "core/Engines/engine";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { Vector3 } from "core/Maths/math.vector";
import { Scene } from "core/scene";

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
});
