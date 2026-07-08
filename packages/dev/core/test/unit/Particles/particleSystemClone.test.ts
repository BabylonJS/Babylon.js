import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Vector3 } from "core/Maths/math.vector";
import { ParticleSystem } from "core/Particles/particleSystem";
import { Texture } from "core/Materials/Textures/texture";
import { Scene } from "core/scene";

// Preload the particle shaders so the async import triggered by the ParticleSystem constructor
// resolves from cache and does not race the test environment teardown.
import "core/Shaders/particles.vertex";
import "core/Shaders/particles.fragment";

describe("ParticleSystem.clone", () => {
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
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("preserves the source particle texture and its settings when cloneTexture is false", () => {
        const system = new ParticleSystem("source", 100, scene);
        system.emitter = new Vector3(0, 0, 0);
        // Avoid auto-starting the clone so the test does not trigger async shader compilation.
        system.preventAutoStart = true;

        // A texture whose display name differs from its actual source, with non-default settings.
        // Reloading the texture by name (the old clone behavior) would load a different image and
        // reset these settings to their defaults.
        const texture = new Texture("https://example.com/actual-source.png", scene);
        texture.name = "https://example.com/display-name.png";
        texture.level = 2;
        texture.coordinatesIndex = 1;
        system.particleTexture = texture;

        const clone = system.clone("clone", undefined);

        expect(clone.particleTexture).toBeTruthy();
        // The clone must be an independent copy, not the same instance.
        expect(clone.particleTexture).not.toBe(texture);
        // Texture settings must survive the clone (previously reset by the name-based reload).
        expect(clone.particleTexture!.level).toBe(2);
        expect((clone.particleTexture as Texture).coordinatesIndex).toBe(1);

        // Disposing the source (as in the forum repro) must not break the clone's texture.
        system.dispose();
        expect(clone.particleTexture).toBeTruthy();
        expect(clone.particleTexture!.level).toBe(2);

        clone.dispose();
    });
});
