import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Logger } from "core/Misc/logger";
import { ProceduralTexture } from "core/Materials/Textures/Procedurals/proceduralTexture";
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

type ResizableDeferredTexture = DeferredTexture & {
    resize: (width: number, height: number) => void;
};

// Mimics ProceduralTexture.getContent(): while a readback is cached it returns that promise and
// schedules the next readback (with the current size) behind it, so the resolved buffer can belong
// to an older size than getSize() reports.
const createResizableDeferredTexture = (width: number, height: number): ResizableDeferredTexture => {
    // Mimic ThinTexture.getSize(): a shared cached object mutated in place when the texture is resized.
    const cachedSize = { width, height };
    let contentData: Promise<Uint8Array> | null = null;
    let resolveReadback: (() => void) | null = null;

    const startReadback = () => {
        const captured = { width: cachedSize.width, height: cachedSize.height };
        let resolvePromise: (data: Uint8Array) => void;
        const promise = new Promise<Uint8Array>((resolve) => (resolvePromise = resolve));
        resolveReadback = () => resolvePromise(new Uint8Array(captured.width * captured.height * 4));
        return promise;
    };

    const texture: ResizableDeferredTexture = {
        calls: 0,
        dispose: () => {},
        resize: (newWidth: number, newHeight: number) => {
            cachedSize.width = newWidth;
            cachedSize.height = newHeight;
        },
        getContent: () => {
            texture.calls++;
            if (contentData) {
                contentData.then(() => {
                    contentData = startReadback();
                });
                return contentData;
            }
            contentData = startReadback();
            return contentData;
        },
        getSize: () => cachedSize,
        resolve: () => {
            const resolve = resolveReadback;
            resolveReadback = null;
            resolve?.();
        },
    };

    return texture;
};

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

    it("does not publish a stale buffer when the same texture is reassigned after a resize", async () => {
        const textureA = createResizableDeferredTexture(2, 2);
        const textureB = createDeferredTexture(4, 4);

        // A1 readback is pending at 2x2.
        particleSystem.noiseTexture = textureA as unknown as ProceduralTexture;
        particleSystem.updateFunction([]);

        // Switch to B (A1 is still pending).
        particleSystem.noiseTexture = textureB as unknown as ProceduralTexture;
        particleSystem.updateFunction([]);

        // Resize A and assign it again: getContent() returns A1's cached promise.
        textureA.resize(4, 4);
        particleSystem.noiseTexture = textureA as unknown as ProceduralTexture;
        particleSystem.updateFunction([]);

        textureA.resolve();
        await flushMicrotasks();

        // A1's 2x2 buffer must never be published with the captured 4x4 dimensions.
        const size = particleSystem._noiseTextureSize;
        const data = particleSystem._noiseTextureData;
        expect(data === null || (size !== null && data.length === size.width * size.height * 4), `published ${data?.length} bytes for ${size?.width}x${size?.height}`).toBe(true);

        // A retry must be able to publish the buffer matching the current size.
        particleSystem.updateFunction([]);
        textureA.resolve();
        await flushMicrotasks();

        expect(particleSystem._noiseTextureData?.length).toBe(4 * 4 * 4);
        expect(particleSystem._noiseTextureSize).toEqual({ width: 4, height: 4 });
    });

    it("keeps the published dimensions stable when the current texture is resized in place", async () => {
        const textureA = createResizableDeferredTexture(2, 2);
        particleSystem.noiseTexture = textureA as unknown as ProceduralTexture;

        particleSystem.updateFunction([]);
        textureA.resolve();
        await flushMicrotasks();

        expect(particleSystem._noiseTextureSize).toEqual({ width: 2, height: 2 });
        expect(particleSystem._noiseTextureData?.length).toBe(2 * 2 * 4);

        // Resize the texture while it stays assigned: getSize() mutates its shared cached object.
        textureA.resize(4, 4);
        particleSystem.updateFunction([]);

        // The pair published for the old buffer must not change until a matching buffer arrives.
        expect(particleSystem._noiseTextureSize).toEqual({ width: 2, height: 2 });
        expect(particleSystem._noiseTextureData?.length).toBe(2 * 2 * 4);

        await flushMicrotasks();

        // The stale cached promise resolves with the old buffer, which is discarded.
        expect(particleSystem._noiseTextureSize).toEqual({ width: 2, height: 2 });
        expect(particleSystem._noiseTextureData?.length).toBe(2 * 2 * 4);

        // A retry publishes the buffer matching the new size.
        particleSystem.updateFunction([]);
        textureA.resolve();
        await flushMicrotasks();

        expect(particleSystem._noiseTextureSize).toEqual({ width: 4, height: 4 });
        expect(particleSystem._noiseTextureData?.length).toBe(4 * 4 * 4);
    });

    it("advances to the resized texture after a refresh queued before the resize is discarded", async () => {
        const texture = new ProceduralTexture("noise", 2, scene);
        vi.spyOn(texture, "readPixels").mockImplementation((_faceIndex?: number, _level?: number, buffer?: ArrayBufferView | null) => {
            if (buffer) {
                // The engine reuses a supplied buffer as-is instead of reallocating it.
                return Promise.resolve(buffer);
            }
            const size = texture.getSize();
            return Promise.resolve(new Uint8Array(size.width * size.height * 4));
        });

        particleSystem.noiseTexture = texture;

        particleSystem.updateFunction([]);
        await flushMicrotasks();

        expect(particleSystem._noiseTextureSize).toEqual({ width: 2, height: 2 });
        expect(particleSystem._noiseTextureData?.length).toBe(2 * 2 * 4);

        // A frame is rendered, so this update queues a refresh on the cached readback.
        (texture as unknown as { _frameId: number })._frameId++;
        particleSystem.updateFunction([]);

        // Resize before that queued refresh runs.
        texture.resize({ width: 4, height: 4 }, false);
        await flushMicrotasks();

        // The next update must read the resized texture instead of being rejected by the length guard.
        particleSystem.updateFunction([]);
        await flushMicrotasks();

        expect(particleSystem._noiseTextureSize).toEqual({ width: 4, height: 4 });
        expect(particleSystem._noiseTextureData?.length).toBe(4 * 4 * 4);
    });

    it("does not let an older readback of the same texture clear the gate or publish stale pixels", async () => {
        const noiseA = new ProceduralTexture("noiseA", 2, scene);
        const noiseB = new ProceduralTexture("noiseB", 2, scene);
        // Deferred readbacks for A so completions can be ordered manually (as an async GPU readback can).
        const pendingA: Array<(data: Uint8Array) => void> = [];
        vi.spyOn(noiseA, "readPixels").mockImplementation(() => new Promise((resolve) => pendingA.push(resolve)));
        vi.spyOn(noiseB, "readPixels").mockImplementation(() => Promise.resolve(new Uint8Array(2 * 2 * 4)));
        const inFlight = () => (particleSystem as unknown as { _noiseTextureFetchInFlight: ProceduralTexture | null })._noiseTextureFetchInFlight;

        particleSystem.noiseTexture = noiseA;
        particleSystem.updateFunction([]); // A1 is pending.
        expect(pendingA.length).toBe(1);

        particleSystem.noiseTexture = noiseB;
        particleSystem.updateFunction([]); // B resolves and releases the gate.
        await flushMicrotasks();
        expect(particleSystem._noiseTextureData?.length).toBe(2 * 2 * 4);

        noiseA.resize({ width: 2, height: 2 }, false); // Same size: lengths cannot tell A1 and A2 apart.
        particleSystem.noiseTexture = noiseA;
        particleSystem.updateFunction([]); // A2 is issued while A1 is still pending.
        expect(pendingA.length).toBe(2);

        // A1 is outdated now: it must not release A2's gate nor publish stale pixels.
        pendingA[0]!(new Uint8Array(2 * 2 * 4));
        await flushMicrotasks();
        expect(particleSystem._noiseTextureData).toBeNull();
        expect(inFlight()).toBe(noiseA);

        // The gate is still held by A2: no additional readback is issued.
        particleSystem.updateFunction([]);
        expect(pendingA.length).toBe(2);

        // A2 completes and publishes the current pixels.
        pendingA[1]!(new Uint8Array(2 * 2 * 4));
        await flushMicrotasks();
        expect(particleSystem._noiseTextureData?.length).toBe(2 * 2 * 4);
        expect(inFlight()).toBeNull();
    });

    it("discards a pending readback when the texture is reassigned without an update in between", async () => {
        const noiseA = new ProceduralTexture("noiseA", 2, scene);
        const noiseB = createDeferredTexture(2, 2);
        const pendingA: Array<(data: Uint8Array) => void> = [];
        vi.spyOn(noiseA, "readPixels").mockImplementation(() => new Promise((resolve) => pendingA.push(resolve)));

        particleSystem.noiseTexture = noiseA;
        particleSystem.updateFunction([]); // A1 is pending.
        expect(pendingA.length).toBe(1);

        // B is assigned but no update runs while it is assigned.
        particleSystem.noiseTexture = noiseB as unknown as ProceduralTexture;
        noiseA.resize({ width: 2, height: 2 }, false);
        particleSystem.noiseTexture = noiseA;

        // A2 must be issued even though A1 (from the old render target) is still pending.
        particleSystem.updateFunction([]);
        expect(pendingA.length).toBe(2);

        // A1 belongs to the previous assignment and must be discarded.
        pendingA[0]!(new Uint8Array(2 * 2 * 4));
        await flushMicrotasks();
        expect(particleSystem._noiseTextureData).toBeNull();

        pendingA[1]!(new Uint8Array(2 * 2 * 4));
        await flushMicrotasks();
        expect(particleSystem._noiseTextureData?.length).toBe(2 * 2 * 4);
    });

    it("warns once while a failing noise readback keeps retrying", async () => {
        const texture = new ProceduralTexture("noise", 2, scene);
        const readPixelsSpy = vi.spyOn(texture, "readPixels").mockRejectedValue(new Error("readback failed"));
        const warnSpy = vi.spyOn(Logger, "Warn");

        particleSystem.noiseTexture = texture;
        particleSystem.updateFunction([]);
        await flushMicrotasks();
        particleSystem.updateFunction([]);
        await flushMicrotasks();

        // The readback is retried, but the failure is only reported once.
        expect(readPixelsSpy).toHaveBeenCalledTimes(2);
        expect(warnSpy).toHaveBeenCalledTimes(1);
        warnSpy.mockRestore();
    });

    it("retries a rejected procedural texture readback and publishes the successful buffer", async () => {
        const texture = new ProceduralTexture("noise", 2, scene);
        const pixels = new Uint8Array(2 * 2 * 4);
        const readPixelsSpy = vi.spyOn(texture, "readPixels").mockRejectedValueOnce(new Error("readback failed")).mockResolvedValue(pixels);

        particleSystem.noiseTexture = texture;
        particleSystem.updateFunction([]);
        await flushMicrotasks();
        expect(particleSystem._noiseTextureData).toBeNull();

        particleSystem.updateFunction([]);
        await flushMicrotasks();

        expect(readPixelsSpy).toHaveBeenCalledTimes(2);
        expect(particleSystem._noiseTextureData).toBe(pixels);
        expect(particleSystem._noiseTextureSize).toEqual({ width: 2, height: 2 });
    });
});
