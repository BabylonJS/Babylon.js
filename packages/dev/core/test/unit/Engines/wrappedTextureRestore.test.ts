import { NullEngine } from "core/Engines";
import { Constants } from "core/Engines/constants";
import { RenderTargetWrapper } from "core/Engines/renderTargetWrapper";
import { InternalTextureSource } from "core/Materials/Textures/internalTexture";

function makeEngine(): NullEngine {
    const engine = new NullEngine();
    // wrapWebGLTexture only touches _gl when no existing handle is provided.
    // We always pass a fake handle, so a stub satisfying the type is enough.
    (engine as any)._gl = {} as WebGLRenderingContext;
    return engine;
}

function attachAsRenderTarget(engine: NullEngine, wrapped: ReturnType<NullEngine["wrapWebGLTexture"]>): RenderTargetWrapper {
    const rtw = new RenderTargetWrapper(false, false, { width: wrapped.baseWidth, height: wrapped.baseHeight }, engine);
    rtw.setTextures(wrapped);
    rtw._generateDepthBuffer = false;
    rtw._generateStencilBuffer = false;
    engine._renderTargetWrapperCache.push(rtw);
    return rtw;
}

describe("Externally-wrapped texture context-loss restore", () => {
    describe("_rebuildRenderTargetWrappers", () => {
        it("does not clobber the wrapped texture's underlying handle", () => {
            const engine = makeEngine();
            const handle = {} as WebGLTexture;
            const wrapped = engine.wrapWebGLTexture(handle, false, Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, 256, 256);

            // Sanity: wrapWebGLTexture leaves source = Unknown and format/type at the
            // InternalTexture ctor defaults of -1 because the wrap is opaque.
            expect(wrapped.source).toBe(InternalTextureSource.Unknown);
            expect(wrapped.type).toBe(-1);
            expect(wrapped.format).toBe(-1);

            const originalHardware = wrapped._hardwareTexture;
            expect(originalHardware).not.toBeNull();
            expect(originalHardware!.underlyingResource).toBe(handle);

            attachAsRenderTarget(engine, wrapped);

            // _rebuildRenderTargetWrappers is what fires from the context-restored
            // path. Pre-fix: clone path runs createRenderTargetTexture with format=-1
            // and _swapAndDie replaces the wrapped hardware texture (silent on WebGL,
            // throws on Native). Post-fix: the wrapped RTW is skipped.
            (engine as any)._rebuildRenderTargetWrappers();

            expect(wrapped._hardwareTexture).toBe(originalHardware);
            expect(wrapped._hardwareTexture!.underlyingResource).toBe(handle);
        });

        it("still rebuilds non-wrapped render target wrappers", () => {
            const engine = makeEngine();

            const wrapped = engine.wrapWebGLTexture({} as WebGLTexture, false, Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, 256, 256);
            attachAsRenderTarget(engine, wrapped);

            const regularRt = engine.createRenderTargetTexture({ width: 64, height: 64 }, { generateDepthBuffer: false, generateStencilBuffer: false });
            const regularTexture = regularRt.texture!;
            expect(regularTexture.source).toBe(InternalTextureSource.RenderTarget);

            (engine as any)._rebuildRenderTargetWrappers();

            // The cloned RTW path sets target.isReady = true after _swapAndDie.
            expect(regularTexture.isReady).toBe(true);
        });
    });

    describe("updateWrappedWebGLTexture", () => {
        it("replaces the underlying handle while preserving InternalTexture identity", () => {
            const engine = makeEngine();
            const originalHandle = {} as WebGLTexture;
            const wrapped = engine.wrapWebGLTexture(originalHandle, false, Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, 256, 256);
            const originalHardware = wrapped._hardwareTexture;
            wrapped.isReady = false;

            const newHandle = {} as WebGLTexture;
            engine.updateWrappedWebGLTexture(wrapped, newHandle);

            expect(wrapped._hardwareTexture).not.toBe(originalHardware);
            expect(wrapped._hardwareTexture!.underlyingResource).toBe(newHandle);
            expect(wrapped.isReady).toBe(true);
            expect(wrapped.source).toBe(InternalTextureSource.Unknown);
            expect(wrapped.baseWidth).toBe(256);
            expect(wrapped.baseHeight).toBe(256);
        });

        it("throws when the target InternalTexture was not produced by wrapWebGLTexture", () => {
            const engine = makeEngine();
            const rt = engine.createRenderTargetTexture({ width: 64, height: 64 }, { generateDepthBuffer: false, generateStencilBuffer: false });
            const rtTexture = rt.texture!;
            expect(rtTexture.source).not.toBe(InternalTextureSource.Unknown);
            expect(() => engine.updateWrappedWebGLTexture(rtTexture, {} as WebGLTexture)).toThrow(/was not produced by wrapWebGLTexture/);
        });
    });
});
