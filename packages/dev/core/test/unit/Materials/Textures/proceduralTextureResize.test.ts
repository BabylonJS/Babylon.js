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
});
