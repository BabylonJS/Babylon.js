import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { ProceduralTexture } from "core/Materials/Textures/Procedurals/proceduralTexture";
import { Scene } from "core/scene";

describe("ProceduralTexture resize", () => {
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

    it("invalidates the cached readback so getContent() reads the new size", async () => {
        const texture = new ProceduralTexture("noise", 2, scene);
        const readPixelsSpy = vi.spyOn(texture, "readPixels").mockReturnValue(Promise.resolve(new Uint8Array(2 * 2 * 4)));

        // First readback is cached.
        await texture.getContent();
        expect(readPixelsSpy).toHaveBeenCalledTimes(1);

        texture.resize({ width: 4, height: 4 }, false);

        // The cached buffer belongs to the previous size: a fresh readback must be scheduled right away.
        texture.getContent();
        expect(readPixelsSpy).toHaveBeenCalledTimes(2);
    });

    it("discards a refresh queued before the resize instead of reusing the old-sized buffer", async () => {
        const texture = new ProceduralTexture("noise", 2, scene);
        const readPixelsSpy = vi.spyOn(texture, "readPixels").mockImplementation((_faceIndex?: number, _level?: number, buffer?: ArrayBufferView | null) => {
            if (buffer) {
                // The engine reuses a supplied buffer as-is instead of reallocating it.
                return Promise.resolve(buffer);
            }
            const size = texture.getSize();
            return Promise.resolve(new Uint8Array(size.width * size.height * 4));
        });

        const content = await texture.getContent();
        expect(content!.byteLength).toBe(2 * 2 * 4);
        expect(readPixelsSpy).toHaveBeenCalledTimes(1);

        // A frame is rendered: the cached readback is stale, so getContent() queues a refresh instead of starting it.
        (texture as unknown as { _frameId: number })._frameId++;
        texture.getContent();
        expect(readPixelsSpy).toHaveBeenCalledTimes(1);

        // Resize before that queued refresh runs.
        texture.resize({ width: 4, height: 4 }, false);

        // The queued refresh must not read the resized target into the old-sized buffer.
        await Promise.resolve();
        expect(readPixelsSpy).toHaveBeenCalledTimes(1);

        // The next call starts a fresh readback for the new size (no stale buffer passed in).
        const resized = await texture.getContent();
        expect(resized!.byteLength).toBe(4 * 4 * 4);
        expect(readPixelsSpy).toHaveBeenLastCalledWith(0, 0);
    });

    it("does not schedule a second readback when a refresh is already queued for the current frame", async () => {
        const texture = new ProceduralTexture("noise", 2, scene);
        // Each readback returns a fresh promise, as both engines do.
        const readPixelsSpy = vi.spyOn(texture, "readPixels").mockImplementation(() => Promise.resolve(new Uint8Array(2 * 2 * 4)));

        await texture.getContent();
        expect(readPixelsSpy).toHaveBeenCalledTimes(1);

        // A frame is rendered, so both calls below queue a refresh on the same promise.
        (texture as unknown as { _frameId: number })._frameId++;
        texture.getContent();
        texture.getContent();
        await Promise.resolve();

        // Only one refresh runs: the second callback sees the replaced cache and bails.
        expect(readPixelsSpy).toHaveBeenCalledTimes(2);
    });
});
