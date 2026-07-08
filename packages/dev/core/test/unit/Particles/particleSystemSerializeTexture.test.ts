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

describe("ParticleSystem serialize/parse (texture settings)", () => {
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

    it("preserves particle texture settings across a serialize(false) / Parse round-trip", () => {
        const system = new ParticleSystem("source", 100, scene);
        system.emitter = new Vector3(0, 0, 0);
        system.preventAutoStart = true;

        const texture = new Texture("https://example.com/flare.png", scene, false, true, Texture.NEAREST_SAMPLINGMODE);
        texture.level = 2;
        texture.uScale = 3;
        texture.vScale = 4;
        texture.uOffset = 0.25;
        texture.vOffset = 0.5;
        texture.coordinatesIndex = 1;
        texture.wrapU = Texture.CLAMP_ADDRESSMODE;
        texture.hasAlpha = true;
        system.particleTexture = texture;

        // Serialize without embedding the texture: it is referenced by name only.
        const serialized = system.serialize(false);
        expect(serialized.textureName).toBe("https://example.com/flare.png");
        expect(serialized.texture).toBeUndefined();

        const parsed = ParticleSystem.Parse(serialized, scene, "", true /* doNotStart */);
        const parsedTexture = parsed.particleTexture as Texture;

        expect(parsedTexture).toBeTruthy();
        // Settings must survive the round-trip (previously reset to defaults on reload).
        expect(parsedTexture.level).toBe(2);
        expect(parsedTexture.uScale).toBe(3);
        expect(parsedTexture.vScale).toBe(4);
        expect(parsedTexture.uOffset).toBe(0.25);
        expect(parsedTexture.vOffset).toBe(0.5);
        expect(parsedTexture.coordinatesIndex).toBe(1);
        expect(parsedTexture.wrapU).toBe(Texture.CLAMP_ADDRESSMODE);
        expect(parsedTexture.hasAlpha).toBe(true);
        expect(parsedTexture.samplingMode).toBe(Texture.NEAREST_SAMPLINGMODE);

        system.dispose();
        parsed.dispose();
    });
});
