import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { BaseTexture } from "core/Materials/Textures/baseTexture";
import { HDRIrradianceFiltering } from "core/Materials/Textures/Filtering/hdrIrradianceFiltering";
import { type InternalTexture } from "core/Materials/Textures/internalTexture";
import { Scene } from "core/scene";

describe("HDRIrradianceFiltering render target handoff", () => {
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

        // NullEngine creates the cube texture but never attaches it to the wrapper, and has no GL context for wrapping modes.
        const createRenderTargetCubeTexture = engine.createRenderTargetCubeTexture.bind(engine);
        vi.spyOn(engine, "createRenderTargetCubeTexture").mockImplementation((size, options) => {
            const rtWrapper = createRenderTargetCubeTexture(size, options);
            const cache = engine.getLoadedTexturesCache();
            rtWrapper.setTextures(cache[cache.length - 1]);
            return rtWrapper;
        });
        vi.spyOn(engine, "updateTextureWrappingMode").mockImplementation(() => {});
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    function prefilter(): BaseTexture {
        const filtering = new HDRIrradianceFiltering(engine);
        const effect = { setFloat: vi.fn(), setFloat2: vi.fn(), setTexture: vi.fn(), setVector3: vi.fn() };
        const internals = filtering as unknown as {
            _effectWrapper: unknown;
            _effectRenderer: unknown;
            _prefilterInternal(texture: BaseTexture): BaseTexture;
        };
        internals._effectWrapper = { effect };
        internals._effectRenderer = { saveStates: vi.fn(), setViewport: vi.fn(), applyEffectWrapper: vi.fn(), draw: vi.fn(), restoreStates: vi.fn() };

        const source = new BaseTexture(scene);
        vi.spyOn(source, "getSize").mockReturnValue({ width: 256, height: 256 });
        return internals._prefilterInternal(source);
    }

    it("releases the framebuffers but keeps the returned internal texture alive", () => {
        const rtWrapperCount = engine._renderTargetWrapperCache.length;
        const releaseTextureSpy = vi.spyOn(engine, "_releaseTexture");

        const irradiance = prefilter();
        const internalTexture = irradiance.getInternalTexture()!;

        expect(engine._renderTargetWrapperCache.length).toBe(rtWrapperCount);
        expect(releaseTextureSpy).not.toHaveBeenCalled();
        expect(internalTexture.isReady).toBe(true);
    });

    it("recreates the storage on rebuild without replacing the internal texture or leaking wrappers", () => {
        const irradiance = prefilter();
        const internalTexture = irradiance.getInternalTexture()!;
        const rtWrapperCount = engine._renderTargetWrapperCache.length;
        const textureCount = engine.getLoadedTexturesCache().length;
        const releaseTextureSpy = vi.spyOn(engine, "_releaseTexture");

        for (let i = 0; i < 2; i++) {
            internalTexture._rebuild();

            expect(irradiance.getInternalTexture()).toBe(internalTexture);
            expect(internalTexture.isReady).toBe(true);
            expect(engine._renderTargetWrapperCache.length).toBe(rtWrapperCount);
            expect(engine.getLoadedTexturesCache().length).toBe(textureCount);
        }
        expect(releaseTextureSpy).not.toHaveBeenCalledWith(internalTexture);
    });

    it("releases the surviving internal texture when the returned texture is disposed", () => {
        const irradiance = prefilter();
        const internalTexture: InternalTexture = irradiance.getInternalTexture()!;
        internalTexture._rebuild();
        const releaseTextureSpy = vi.spyOn(engine, "_releaseTexture");

        irradiance.dispose();

        expect(releaseTextureSpy).toHaveBeenCalledWith(internalTexture);
    });
});
