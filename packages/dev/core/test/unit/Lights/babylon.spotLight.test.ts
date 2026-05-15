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

    describe("light texture readiness", () => {
        // When a light owns texture resources that are not yet ready (e.g. a SpotLight's
        // projectionTexture or iesProfileTexture), material readiness must reflect that
        // so scene.isReady() returns false and scene.executeWhenReady() waits for those
        // textures before firing. Otherwise, callers that render on executeWhenReady —
        // such as visual-test harnesses — can produce frames before the texture-dependent
        // effect is applied.
        //
        // Each test sets up a lit mesh with a StandardMaterial, pins a light-texture
        // readiness signal to "not ready", and then polls scene.isReady(). Polling with
        // a microtask yield lets the NullEngine's async shader compile settle before the
        // assertion, so the test guards against a material flipping to ready prematurely.
        async function pollSceneIsReady(scene: Scene): Promise<boolean> {
            for (let i = 0; i < 20; i++) {
                if (scene.isReady()) {
                    return true;
                }
                await new Promise((resolve) => setTimeout(resolve, 0));
            }
            return false;
        }

        function createLitBoxScene(): SpotLight {
            const mesh = CreateBox("mesh", {}, scene);
            mesh.material = new StandardMaterial("mat", scene);
            return new SpotLight("spot", new Vector3(0, 5, 0), new Vector3(0, -1, 0), Math.PI / 4, 2, scene);
        }

        it("scene.isReady() must not return true while a light reports its textures are not ready", async () => {
            const light = createLitBoxScene();

            // Plumbing-level contract: material readiness must consult the Light's
            // areLightTexturesReady() contract regardless of which texture(s) caused
            // it to report not-ready. This ensures future light types that add their
            // own textures (and override areLightTexturesReady) are gated automatically.
            (light as any).areLightTexturesReady = () => false;

            expect(await pollSceneIsReady(scene)).toBe(false);
        });

        it("scene.isReady() must not return true while a SpotLight's projectionTexture is not ready", async () => {
            const light = createLitBoxScene();

            const tex = new Texture(null, scene);
            vi.spyOn(tex, "isReady").mockReturnValue(false);
            light.projectionTexture = tex;

            expect(await pollSceneIsReady(scene)).toBe(false);
        });

        it("scene.isReady() must not return true while a SpotLight's iesProfileTexture is not ready", async () => {
            const light = createLitBoxScene();

            const tex = new Texture(null, scene);
            vi.spyOn(tex, "isReady").mockReturnValue(false);
            light.iesProfileTexture = tex;

            expect(await pollSceneIsReady(scene)).toBe(false);
        });
    });
});

