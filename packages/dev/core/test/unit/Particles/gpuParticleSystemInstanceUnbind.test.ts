import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import { Scene } from "core/scene";
import { Matrix, Vector3 } from "core/Maths/math.vector";
import { FreeCamera } from "core/Cameras/freeCamera";

// Side-effect import to register the WebGL2ParticleSystem class
import "core/Particles/webgl2ParticleSystem";

describe("GPUParticleSystem resets instance attributes after drawing", () => {
    let engine: NullEngine;
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
        // _render() reads the active camera's position for billboard particles
        scene.activeCamera = new FreeCamera("camera", Vector3.Zero(), scene);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    function renderOnce(ps: GPUParticleSystem): void {
        const effect = {
            defines: "",
            _multiTarget: false,
            setMatrix: vi.fn(),
            setTexture: vi.fn(),
            setVector2: vi.fn(),
            setVector3: vi.fn(),
            setFloat: vi.fn(),
            setFloat3: vi.fn(),
            setFloat4: vi.fn(),
            setDirectColor4: vi.fn(),
            setColor3: vi.fn(),
            setColor4: vi.fn(),
        };
        vi.spyOn(ps as any, "_getWrapper").mockReturnValue({ effect });
        vi.spyOn(engine, "enableEffect").mockImplementation(() => {});
        vi.spyOn((ps as any)._platform, "bindDrawBuffers").mockImplementation(() => {});
        (ps as any)._render(0, Matrix.Identity());
    }

    it("unbinds instance attributes without forceWireframe", () => {
        // bindDrawBuffers() falls back to engine.bindBuffers() on the default VAO whenever the render effect
        // differs from the one the render VAO was recorded with. The per-instance divisors set there must be
        // reset, otherwise the next non-instanced draw (e.g. the post-process quad) inherits them.
        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);
        const unbind = vi.spyOn(engine, "unbindInstanceAttributes");

        expect(scene.forceWireframe).toBe(false);
        renderOnce(ps);

        expect(unbind).toHaveBeenCalled();

        ps.dispose();
    });
});
