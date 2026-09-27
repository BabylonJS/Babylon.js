import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { type ProceduralTexture } from "core/Materials/Textures/Procedurals/proceduralTexture";
import { ParticleSystem } from "core/Particles/particleSystem";
import { Scene } from "core/scene";

// Preload the particle shaders so the async import triggered by the ParticleSystem constructor
// resolves from cache and does not race the test environment teardown.
import "core/Shaders/particles.vertex";
import "core/Shaders/particles.fragment";

type DeferredTexture = {
    calls: number;
    dispose: () => void;
    getContent: () => Promise<Uint8Array>;
    getSize: () => { width: number; height: number };
    resolve: () => void;
};

const createDeferredTexture = (width: number, height: number): DeferredTexture => {
    let resolvePromise: (data: Uint8Array) => void;
    const promise = new Promise<Uint8Array>((resolve) => (resolvePromise = resolve));
    const texture: DeferredTexture = {
        calls: 0,
        dispose: () => {},
        getContent: () => {
            texture.calls++;
            return promise;
        },
        getSize: () => ({ width, height }),
        resolve: () => resolvePromise(new Uint8Array(width * height * 4)),
    };

    return texture;
};

const flushMicrotasks = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe("ThinParticleSystem noise texture readback", () => {
    let engine: NullEngine;
    let scene: Scene;
    let particleSystem: ParticleSystem;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
        particleSystem = new ParticleSystem("noiseReadback", 10, scene);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("publishes the buffer and its dimensions together and invalidates them when the texture is replaced", async () => {
        const textureA = createDeferredTexture(2, 2);
        const textureB = createDeferredTexture(4, 4);

        particleSystem.noiseTexture = textureA as unknown as ProceduralTexture;
        particleSystem.updateFunction([]);

        expect(textureA.calls).toBe(1);
        expect(particleSystem._noiseTextureData).toBeNull();
        expect(particleSystem._noiseTextureSize).toBeNull();

        textureA.resolve();
        await flushMicrotasks();

        expect(particleSystem._noiseTextureData?.length).toBe(2 * 2 * 4);
        expect(particleSystem._noiseTextureSize).toEqual({ width: 2, height: 2 });

        particleSystem.noiseTexture = textureB as unknown as ProceduralTexture;

        expect(particleSystem._noiseTextureData).toBeNull();
        expect(particleSystem._noiseTextureSize).toBeNull();

        particleSystem.updateFunction([]);
        textureB.resolve();
        await flushMicrotasks();

        expect(particleSystem._noiseTextureData?.length).toBe(4 * 4 * 4);
        expect(particleSystem._noiseTextureSize).toEqual({ width: 4, height: 4 });
    });

    it("starts the replacement texture readback immediately and discards the stale buffer", async () => {
        const textureA = createDeferredTexture(2, 2);
        const textureB = createDeferredTexture(4, 4);

        particleSystem.noiseTexture = textureA as unknown as ProceduralTexture;
        particleSystem.updateFunction([]);

        expect(textureA.calls).toBe(1);

        particleSystem.noiseTexture = textureB as unknown as ProceduralTexture;
        particleSystem.updateFunction([]);

        // The replacement must not wait for the pending readback of the previous texture.
        expect(textureB.calls).toBe(1);

        textureA.resolve();
        await flushMicrotasks();

        // The stale smaller buffer is never paired with the new dimensions: the noise step keeps
        // skipping until data for the current texture arrives.
        expect(particleSystem._noiseTextureData).toBeNull();
        expect(particleSystem._noiseTextureSize).toBeNull();

        textureB.resolve();
        await flushMicrotasks();

        expect(particleSystem._noiseTextureData?.length).toBe(4 * 4 * 4);
        expect(particleSystem._noiseTextureSize).toEqual({ width: 4, height: 4 });
    });
});
