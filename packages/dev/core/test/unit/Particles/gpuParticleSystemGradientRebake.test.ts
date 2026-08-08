import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import { Scene } from "core/scene";
import { Color4 } from "core/Maths/math.color";

// Side-effect import to register the WebGL2ParticleSystem class
import "core/Particles/webgl2ParticleSystem";

describe("GPUParticleSystem gradient edits re-bake the lookup texture in place", () => {
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

    function createSystem(): GPUParticleSystem {
        return new GPUParticleSystem("test", { capacity: 100 }, scene);
    }

    describe("factor gradients (size shown, all factor families share the path)", () => {
        it("re-bakes the existing texture in place on a value edit instead of releasing the buffers", () => {
            const ps = createSystem();

            ps.addSizeGradient(0, 1);
            ps.addSizeGradient(1, 3);

            // Force the lazy texture creation that normally happens on the first update
            ps._recreateUpdateEffect();
            const texture = (ps as any)._sizeGradientsTexture;
            expect(texture).toBeTruthy();

            const releaseBuffers = vi.spyOn(ps as any, "_releaseBuffers");
            const update = vi.spyOn(texture, "update");

            // A slider-style value edit: remove the stop and re-add it at the same position with a new value
            ps.removeSizeGradient(1);
            ps.addSizeGradient(1, 5);

            expect(releaseBuffers).not.toHaveBeenCalled();
            expect(update).toHaveBeenCalledTimes(2);
            expect((ps as any)._sizeGradientsTexture).toBe(texture);

            ps.dispose();
        });

        it("bakes the same pixels the initial texture creation would produce", () => {
            const ps = createSystem();

            ps.addSizeGradient(0, 1);
            ps.addSizeGradient(1, 1);

            ps._recreateUpdateEffect();
            const texture = (ps as any)._sizeGradientsTexture;
            const update = vi.spyOn(texture, "update");

            ps.removeSizeGradient(1);
            ps.addSizeGradient(1, 5);

            const data = update.mock.calls[update.mock.calls.length - 1][0] as Float32Array;
            const width = (ps as any)._rawTextureWidth;
            expect(data.length).toBe(width * 2);
            // Interleaved RG texels: factor1 at even indices. Ratio 0 -> 1, ratio 0.5 -> lerp(1, 5, 0.5) = 3
            expect(data[0]).toBeCloseTo(1);
            expect(data[width]).toBeCloseTo(3); // texel x = width / 2
            expect(data[(width - 1) * 2]).toBeCloseTo(1 + ((5 - 1) * (width - 1)) / width);

            ps.dispose();
        });

        it("re-bakes in place when a stop is removed but the family stays active", () => {
            const ps = createSystem();

            ps.addSizeGradient(0, 1);
            ps.addSizeGradient(0.5, 2);
            ps.addSizeGradient(1, 3);

            ps._recreateUpdateEffect();
            const texture = (ps as any)._sizeGradientsTexture;

            const releaseBuffers = vi.spyOn(ps as any, "_releaseBuffers");

            ps.removeSizeGradient(0.5);

            expect(releaseBuffers).not.toHaveBeenCalled();
            expect((ps as any)._sizeGradientsTexture).toBe(texture);

            ps.dispose();
        });

        it("still releases the buffers when the family appears (no texture to re-bake)", () => {
            const ps = createSystem();

            const releaseBuffers = vi.spyOn(ps as any, "_releaseBuffers");

            ps.addSizeGradient(0, 1);

            expect(releaseBuffers).toHaveBeenCalled();

            ps.dispose();
        });

        it("still releases the buffers and disposes the texture when the family is emptied", () => {
            const ps = createSystem();

            ps.addSizeGradient(0, 1);
            ps.addSizeGradient(1, 3);

            ps._recreateUpdateEffect();
            const texture = (ps as any)._sizeGradientsTexture;
            const disposeTexture = vi.spyOn(texture, "dispose");

            ps.removeSizeGradient(0);
            expect((ps as any)._sizeGradientsTexture).toBe(texture); // one stop left: still re-baked in place

            const releaseBuffers = vi.spyOn(ps as any, "_releaseBuffers");
            ps.removeSizeGradient(1);

            expect(releaseBuffers).toHaveBeenCalled();
            expect(disposeTexture).toHaveBeenCalled();
            expect((ps as any)._sizeGradientsTexture).toBeNull();

            ps.dispose();
        });
    });

    describe("color gradients", () => {
        it("re-bakes the existing texture in place on a value edit instead of releasing the buffers", () => {
            const ps = createSystem();

            ps.addColorGradient(0, new Color4(1, 0, 0, 1));
            ps.addColorGradient(1, new Color4(1, 0, 0, 1));

            ps._recreateUpdateEffect();
            const texture = (ps as any)._colorGradientsTexture;
            expect(texture).toBeTruthy();

            const releaseBuffers = vi.spyOn(ps as any, "_releaseBuffers");
            const update = vi.spyOn(texture, "update");

            ps.removeColorGradient(1);
            ps.addColorGradient(1, new Color4(0, 1, 0, 1));

            expect(releaseBuffers).not.toHaveBeenCalled();
            expect(update).toHaveBeenCalledTimes(2);
            expect((ps as any)._colorGradientsTexture).toBe(texture);

            const data = update.mock.calls[update.mock.calls.length - 1][0] as Uint8Array;
            const width = (ps as any)._rawTextureWidth;
            expect(data.length).toBe(width * 4); // single row: no stop uses color2
            // Ratio 0 -> pure red
            expect(data[0]).toBe(255);
            expect(data[1]).toBe(0);
            // Last texel -> almost pure green
            expect(data[(width - 1) * 4]).toBeLessThan(8);
            expect(data[(width - 1) * 4 + 1]).toBeGreaterThan(247);

            ps.dispose();
        });

        it("re-bakes both rows in place when every layout stays two-row (color2 present)", () => {
            const ps = createSystem();

            ps.addColorGradient(0, new Color4(1, 0, 0, 1), new Color4(0, 0, 1, 1));
            ps.addColorGradient(1, new Color4(1, 0, 0, 1), new Color4(0, 0, 1, 1));

            ps._recreateUpdateEffect();
            const texture = (ps as any)._colorGradientsTexture;
            expect(texture.getSize().height).toBe(2);

            const releaseBuffers = vi.spyOn(ps as any, "_releaseBuffers");
            const update = vi.spyOn(texture, "update");

            ps.addColorGradient(0.5, new Color4(0, 1, 0, 1), new Color4(1, 1, 0, 1));

            expect(releaseBuffers).not.toHaveBeenCalled();
            expect((ps as any)._colorGradientsTexture).toBe(texture);

            const data = update.mock.calls[0][0] as Uint8Array;
            const width = (ps as any)._rawTextureWidth;
            expect(data.length).toBe(width * 4 * 2);
            // Row 0 midpoint -> color1 of the new stop (pure green)
            expect(data[(width / 2) * 4 + 1]).toBe(255);
            // Row 1 midpoint -> color2 of the new stop (yellow)
            expect(data[width * 4 + (width / 2) * 4]).toBe(255);
            expect(data[width * 4 + (width / 2) * 4 + 1]).toBe(255);

            ps.dispose();
        });

        it("still releases the buffers when a color2 stop flips the texture to the two-row layout", () => {
            const ps = createSystem();

            ps.addColorGradient(0, new Color4(1, 0, 0, 1));
            ps.addColorGradient(1, new Color4(0, 1, 0, 1));

            ps._recreateUpdateEffect();
            const texture = (ps as any)._colorGradientsTexture;
            expect(texture.getSize().height).toBe(1);

            const releaseBuffers = vi.spyOn(ps as any, "_releaseBuffers");
            const disposeTexture = vi.spyOn(texture, "dispose");

            ps.addColorGradient(0.5, new Color4(0, 0, 1, 1), new Color4(1, 1, 1, 1));

            expect(releaseBuffers).toHaveBeenCalled();
            expect(disposeTexture).toHaveBeenCalled();
            expect((ps as any)._colorGradientsTexture).toBeNull();

            // The lazily recreated texture picks up the two-row layout
            ps._recreateUpdateEffect();
            expect((ps as any)._colorGradientsTexture.getSize().height).toBe(2);

            ps.dispose();
        });

        it("still releases the buffers when removing the only color2 stop flips the layout back to one row", () => {
            const ps = createSystem();

            ps.addColorGradient(0, new Color4(1, 0, 0, 1));
            ps.addColorGradient(0.5, new Color4(0, 0, 1, 1), new Color4(1, 1, 1, 1));
            ps.addColorGradient(1, new Color4(0, 1, 0, 1));

            ps._recreateUpdateEffect();
            const texture = (ps as any)._colorGradientsTexture;
            expect(texture.getSize().height).toBe(2);

            const releaseBuffers = vi.spyOn(ps as any, "_releaseBuffers");

            ps.removeColorGradient(0.5);

            expect(releaseBuffers).toHaveBeenCalled();
            expect((ps as any)._colorGradientsTexture).toBeNull();

            ps._recreateUpdateEffect();
            expect((ps as any)._colorGradientsTexture.getSize().height).toBe(1);

            ps.dispose();
        });

        it("still releases the buffers when the color family is emptied", () => {
            const ps = createSystem();

            ps.addColorGradient(0, new Color4(1, 0, 0, 1));
            ps.addColorGradient(1, new Color4(0, 1, 0, 1));

            ps._recreateUpdateEffect();
            const texture = (ps as any)._colorGradientsTexture;
            const disposeTexture = vi.spyOn(texture, "dispose");

            ps.removeColorGradient(0);
            expect((ps as any)._colorGradientsTexture).toBe(texture); // one stop left: still re-baked in place

            const releaseBuffers = vi.spyOn(ps as any, "_releaseBuffers");
            ps.removeColorGradient(1);

            expect(releaseBuffers).toHaveBeenCalled();
            expect(disposeTexture).toHaveBeenCalled();
            expect((ps as any)._colorGradientsTexture).toBeNull();

            ps.dispose();
        });
    });
});
