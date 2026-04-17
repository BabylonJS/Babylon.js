import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type Engine } from "core/Engines/engine";
import { NullEngine } from "core/Engines/nullEngine";
import { SpotLight } from "core/Lights/spotLight";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { Texture } from "core/Materials/Textures/texture";
import { Vector3 } from "core/Maths/math.vector";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { Scene } from "core/scene";

// Pre-load shader modules that StandardMaterial dynamically imports during
// effect creation. Without these, the fire-and-forget import() may still be
// resolving when the test environment tears down, causing EnvironmentTeardownError.
import "core/Shaders/default.fragment";
import "core/Shaders/default.vertex";

describe("SpotLight", () => {
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

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    describe("projectionTexture readiness", () => {
        // Regression test for https://github.com/BabylonJS/Babylon.js/pull/18255 — a
        // material lit by a SpotLight whose projectionTexture is not ready must cause
        // scene.isReady() (and therefore scene.executeWhenReady) to wait.
        it("scene.isReady() must not return true while a spot light's projection texture is not ready", async () => {
            const mesh = CreateBox("mesh", {}, scene);
            mesh.material = new StandardMaterial("mat", scene);
            const light = new SpotLight("spot", new Vector3(0, 5, 0), new Vector3(0, -1, 0), Math.PI / 4, 2, scene);

            const tex = new Texture(null, scene);
            vi.spyOn(tex, "isReady").mockReturnValue(false);
            light.projectionTexture = tex;

            // Poll scene.isReady(), yielding between polls so that async shader compiles
            // in NullEngine can settle. Without the fix, the material compiles without a
            // projection define and scene.isReady() flips to true despite the projection
            // texture reporting not-ready. With the fix, scene.isReady() stays false.
            let becameReady = false;
            for (let i = 0; i < 20; i++) {
                if (scene.isReady()) {
                    becameReady = true;
                    break;
                }
                await new Promise((resolve) => setTimeout(resolve, 0));
            }
            expect(becameReady).toBe(false);
        });
    });
});
