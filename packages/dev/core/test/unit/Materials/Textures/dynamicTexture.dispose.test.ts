import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { DynamicTexture } from "core/Materials/Textures/dynamicTexture";
import { type ICanvas } from "core/Engines/ICanvas";
import { Scene } from "core/scene";

describe("DynamicTexture.dispose", () => {
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

    const createFakeCanvas = (supportsDeferredDispose?: boolean) => {
        return {
            width: 0,
            height: 0,
            getContext: () => ({}),
            remove: vi.fn(),
            dispose: vi.fn(),
            supportsDeferredDispose,
        } as unknown as ICanvas & { remove: ReturnType<typeof vi.fn>; dispose: ReturnType<typeof vi.fn> };
    };

    it("disposes an owned native canvas that defers its GPU resource release", () => {
        const canvas = createFakeCanvas(true);
        vi.spyOn(engine, "createCanvas").mockReturnValue(canvas);

        const texture = new DynamicTexture("owned", 16, scene);
        texture.dispose();

        expect(canvas.remove).toHaveBeenCalledTimes(1);
        expect(canvas.dispose).toHaveBeenCalledTimes(1);
    });

    it("does not dispose an owned native canvas that would release its GPU resources immediately", () => {
        const canvas = createFakeCanvas();
        vi.spyOn(engine, "createCanvas").mockReturnValue(canvas);

        const texture = new DynamicTexture("owned", 16, scene);
        texture.dispose();

        expect(canvas.remove).toHaveBeenCalledTimes(1);
        expect(canvas.dispose).not.toHaveBeenCalled();
    });

    it("leaves a caller-provided canvas alone", () => {
        const canvas = createFakeCanvas(true);

        const texture = new DynamicTexture("external", canvas, { scene });
        texture.dispose();

        expect(canvas.remove).not.toHaveBeenCalled();
        expect(canvas.dispose).not.toHaveBeenCalled();
    });
});
