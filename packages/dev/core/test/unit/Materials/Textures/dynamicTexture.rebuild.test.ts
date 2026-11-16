import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { DynamicTexture } from "core/Materials/Textures/dynamicTexture";
import { type ICanvas } from "core/Engines/ICanvas";
import { Scene } from "core/scene";

describe("DynamicTexture._rebuild", () => {
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
        vi.spyOn(engine, "createCanvas").mockReturnValue({ width: 0, height: 0, getContext: () => ({}), remove: vi.fn() } as unknown as ICanvas);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    // NullEngine.updateDynamicTexture is a no-op, so record what the last upload would have stored on the internal texture.
    const recordUploads = () => {
        return vi.spyOn(engine, "updateDynamicTexture").mockImplementation((texture, source, invertY, premulAlpha = false) => {
            if (texture) {
                texture._dynamicTextureSource = source;
                texture._premulAlpha = premulAlpha;
                texture.invertY = invertY || false;
            }
        });
    };

    it("keeps the invertY and premulAlpha of the last update", () => {
        const upload = recordUploads();
        const texture = new DynamicTexture("tex", 16, scene);
        texture.update(false, true);
        upload.mockClear();

        texture._rebuild();

        expect(upload).toHaveBeenCalledTimes(1);
        expect(upload.mock.calls[0][2]).toBe(false);
        expect(upload.mock.calls[0][3]).toBe(true);
    });

    it("keeps invertY = true when the last update used it", () => {
        const upload = recordUploads();
        const texture = new DynamicTexture("tex", 16, scene);
        texture.update(true, false);
        upload.mockClear();

        texture._rebuild();

        expect(upload).toHaveBeenCalledTimes(1);
        expect(upload.mock.calls[0][2]).toBe(true);
        expect(upload.mock.calls[0][3]).toBe(false);
    });

    it("calls update() with no arguments when the texture was never updated", () => {
        recordUploads();
        const texture = new DynamicTexture("tex", 16, scene);
        const update = vi.spyOn(texture, "update");

        texture._rebuild();

        expect(update).toHaveBeenCalledTimes(1);
        expect(update.mock.calls[0]).toEqual([]);
    });
});
