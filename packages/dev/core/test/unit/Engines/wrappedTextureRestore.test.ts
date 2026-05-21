import { describe, it, expect } from "vitest";

import { NullEngine } from "core/Engines";
import { Constants } from "core/Engines/constants";
import { RenderTargetWrapper } from "core/Engines/renderTargetWrapper";
import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";

function makeEngine(): NullEngine {
    const engine = new NullEngine();
    // wrapWebGLTexture only touches _gl when no existing handle is provided.
    // We always pass a fake handle, so a stub satisfying the type is enough.
    (engine as any)._gl = {} as WebGLRenderingContext;
    return engine;
}

function attachAsRenderTarget(engine: NullEngine, wrapped: ReturnType<NullEngine["wrapWebGLTexture"]>, isMulti: boolean = false): RenderTargetWrapper {
    const rtw = new RenderTargetWrapper(isMulti, false, { width: wrapped.baseWidth, height: wrapped.baseHeight }, engine);
    rtw.setTextures(wrapped);
    rtw._generateDepthBuffer = false;
    rtw._generateStencilBuffer = false;
    engine._renderTargetWrapperCache.push(rtw);
    return rtw;
}

describe("Externally-wrapped texture context-loss restore", () => {
    describe("InternalTextureSource.External marker", () => {
        it("is the source set by wrapWebGLTexture", () => {
            const engine = makeEngine();
            const wrapped = engine.wrapWebGLTexture({} as WebGLTexture, false, Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, 64, 64);
            expect(wrapped.source).toBe(InternalTextureSource.External);
        });

        it("is distinct from Unknown -- a non-wrap-produced Unknown texture is rejected by updateWrappedWebGLTexture", () => {
            const engine = makeEngine();
            // Mimic an XR / multiview internal texture: source = Unknown but not produced by wrapWebGLTexture.
            // Before the External marker, this would have been silently accepted as if it were a wrapped texture.
            const fauxUnknown = new InternalTexture(engine, InternalTextureSource.Unknown, true);
            expect(fauxUnknown.source).toBe(InternalTextureSource.Unknown);
            expect(() => engine.updateWrappedWebGLTexture(fauxUnknown, {} as WebGLTexture)).toThrow(/was not produced by wrapWebGLTexture/);
        });
    });

    describe("_rebuildRenderTargetWrappers", () => {
        it("does not clobber the wrapped texture's underlying handle", () => {
            const engine = makeEngine();
            const handle = {} as WebGLTexture;
            const wrapped = engine.wrapWebGLTexture(handle, false, Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, 256, 256);

            expect(wrapped.source).toBe(InternalTextureSource.External);
            expect(wrapped.type).toBe(-1);
            expect(wrapped.format).toBe(-1);

            const originalHardware = wrapped._hardwareTexture;
            expect(originalHardware).not.toBeNull();
            expect(originalHardware!.underlyingResource).toBe(handle);

            attachAsRenderTarget(engine, wrapped);

            // _rebuildRenderTargetWrappers is what fires from the context-restored path. Pre-fix: clone path runs
            // createRenderTargetTexture with format=-1 and _swapAndDie replaces the wrapped hardware texture (silent
            // on WebGL, throws on Native). Post-fix: the wrapped RTW is skipped.
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
            const originalHardware = regularTexture._hardwareTexture;

            (engine as any)._rebuildRenderTargetWrappers();

            // For non-wrapped RTWs, _rebuild creates a clone RTW then _swapAndDie moves the clone's hardware texture
            // onto the original InternalTexture. Identity-equal would mean the rebuild was skipped, which is what
            // the wrapped-RTW path does -- so different identity here proves the regular path was exercised.
            expect(regularTexture._hardwareTexture).not.toBe(originalHardware);
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
            expect(wrapped.source).toBe(InternalTextureSource.External);
            expect(wrapped.baseWidth).toBe(256);
            expect(wrapped.baseHeight).toBe(256);
        });

        it("throws when the target InternalTexture was not produced by wrapWebGLTexture", () => {
            const engine = makeEngine();
            const rt = engine.createRenderTargetTexture({ width: 64, height: 64 }, { generateDepthBuffer: false, generateStencilBuffer: false });
            const rtTexture = rt.texture!;
            expect(rtTexture.source).not.toBe(InternalTextureSource.External);
            expect(() => engine.updateWrappedWebGLTexture(rtTexture, {} as WebGLTexture)).toThrow(/was not produced by wrapWebGLTexture/);
        });

        it("throws when the wrapped texture is part of a multi render-target", () => {
            const engine = makeEngine();
            const wrapped = engine.wrapWebGLTexture({} as WebGLTexture, false, Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, 64, 64);
            attachAsRenderTarget(engine, wrapped, /*isMulti*/ true);
            expect(() => engine.updateWrappedWebGLTexture(wrapped, {} as WebGLTexture)).toThrow(/multi render-target/);
        });

        it("throws when the wrapped texture is at index > 0 of a multi render-target", () => {
            // rtWrapper.texture only returns _textures[0]. A naive .texture-only check would miss the multi-RT case
            // where the wrapped attachment is at index 1+, then mutate state thinking the RTW is unrelated.
            const engine = makeEngine();
            const other = new InternalTexture(engine, InternalTextureSource.RenderTarget);
            const wrapped = engine.wrapWebGLTexture({} as WebGLTexture, false, Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, 64, 64);
            const rtw = new RenderTargetWrapper(true, false, { width: 64, height: 64 }, engine);
            rtw.setTextures([other, wrapped]);
            engine._renderTargetWrapperCache.push(rtw);

            expect(() => engine.updateWrappedWebGLTexture(wrapped, {} as WebGLTexture)).toThrow(/multi render-target/);
        });

        it("rejects multisampled wrappers", () => {
            const engine = makeEngine();
            const wrapped = engine.wrapWebGLTexture({} as WebGLTexture, false, Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, 64, 64);
            const rtw = attachAsRenderTarget(engine, wrapped);
            (rtw as any)._samples = 4;

            expect(() => engine.updateWrappedWebGLTexture(wrapped, {} as WebGLTexture)).toThrow(/multisampled/);
        });

        it("does not mutate the wrapped texture when the multi-RT precondition trips", () => {
            const engine = makeEngine();
            const wrapped = engine.wrapWebGLTexture({} as WebGLTexture, false, Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, 64, 64);
            const originalHardware = wrapped._hardwareTexture;
            attachAsRenderTarget(engine, wrapped, /*isMulti*/ true);

            expect(() => engine.updateWrappedWebGLTexture(wrapped, {} as WebGLTexture)).toThrow();
            // Pre-validation runs before any mutation, so identity is preserved even on throw.
            expect(wrapped._hardwareTexture).toBe(originalHardware);
        });

        it("clears the wrapped texture's cached sampler params so the next bind re-applies them", () => {
            const engine = makeEngine();
            const wrapped = engine.wrapWebGLTexture({} as WebGLTexture, false, Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, 64, 64);
            // Pre-populate the per-InternalTexture sampler cache that _setTexture would normally fill in.
            wrapped._cachedCoordinatesMode = 5;
            wrapped._cachedWrapU = 1;
            wrapped._cachedWrapV = 2;
            wrapped._cachedWrapR = 3;
            wrapped._cachedAnisotropicFilteringLevel = 4;

            engine.updateWrappedWebGLTexture(wrapped, {} as WebGLTexture);

            expect(wrapped._cachedCoordinatesMode).toBeNull();
            expect(wrapped._cachedWrapU).toBeNull();
            expect(wrapped._cachedWrapV).toBeNull();
            expect(wrapped._cachedWrapR).toBeNull();
            expect(wrapped._cachedAnisotropicFilteringLevel).toBeNull();
        });

        it("clears every _boundTexturesCache slot pointing at the wrapped texture, leaving other slots intact", () => {
            const engine = makeEngine();
            const wrapped = engine.wrapWebGLTexture({} as WebGLTexture, false, Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, 64, 64);
            const other = new InternalTexture(engine, InternalTextureSource.Raw, true);

            const cache = (engine as any)._boundTexturesCache as { [key: string]: any };
            cache[0] = wrapped;
            cache[1] = other;
            cache[3] = wrapped;

            engine.updateWrappedWebGLTexture(wrapped, {} as WebGLTexture);

            // Without clearing these slots, the identity short-circuit in _setTexture (cache[ch] === internalTexture)
            // would skip the rebind, and the engine would still issue draws against the stale binding.
            expect(cache[0]).toBeNull();
            expect(cache[3]).toBeNull();
            expect(cache[1]).toBe(other);
        });

        it("throws when the wrapper has a depth/stencil texture", () => {
            const engine = makeEngine();
            const wrapped = engine.wrapWebGLTexture({} as WebGLTexture, false, Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, 64, 64);
            const rtw = attachAsRenderTarget(engine, wrapped);
            // Stand in for an RTW that called createDepthStencilTexture(); we only need _depthStencilTexture non-null
            // for the pre-validation guard, not a real depth texture.
            rtw._depthStencilTexture = new InternalTexture(engine, InternalTextureSource.DepthStencil, true);
            expect(() => engine.updateWrappedWebGLTexture(wrapped, {} as WebGLTexture)).toThrow(/depth\/stencil texture/);
        });

        it("does not mutate the wrapped texture when the depth/stencil-texture precondition trips", () => {
            const engine = makeEngine();
            const wrapped = engine.wrapWebGLTexture({} as WebGLTexture, false, Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, 64, 64);
            const originalHardware = wrapped._hardwareTexture;
            const rtw = attachAsRenderTarget(engine, wrapped);
            rtw._depthStencilTexture = new InternalTexture(engine, InternalTextureSource.DepthStencil, true);

            expect(() => engine.updateWrappedWebGLTexture(wrapped, {} as WebGLTexture)).toThrow();
            expect(wrapped._hardwareTexture).toBe(originalHardware);
        });

        it("passes the RTW size (not internalTexture.baseWidth/baseHeight) to _setupFramebufferDepthAttachments", () => {
            // WebGL wrapped textures are opaque -- baseWidth/baseHeight default to 0 when the caller doesn't pass them.
            // The RTW itself carries the real render-target size; the depth/stencil renderbuffer must be sized off the
            // RTW, not off the texture metadata, or we'd recreate a 0x0 renderbuffer that doesn't match the wrapper.
            const gl: any = {
                FRAMEBUFFER: 0,
                COLOR_ATTACHMENT0: 0,
                TEXTURE_2D: 0,
                createFramebuffer: () => ({}),
                deleteFramebuffer: () => {},
                deleteRenderbuffer: () => {},
                framebufferTexture2D: () => {},
                bindFramebuffer: () => {},
            };
            const engine = makeEngine();
            (engine as any)._gl = gl;

            // 0x0 wrapped texture; the wrapper itself is 128x256.
            const wrapped = engine.wrapWebGLTexture({} as WebGLTexture, false, Constants.TEXTURE_TRILINEAR_SAMPLINGMODE);
            expect(wrapped.baseWidth).toBe(0);
            expect(wrapped.baseHeight).toBe(0);

            const rtw = new RenderTargetWrapper(false, false, { width: 128, height: 256 }, engine);
            rtw.setTextures(wrapped);
            rtw._generateDepthBuffer = true;
            rtw._generateStencilBuffer = false;
            engine._renderTargetWrapperCache.push(rtw);

            const calls: Array<{ generateStencil: boolean; generateDepth: boolean; width: number; height: number }> = [];
            const original = (engine as any)._setupFramebufferDepthAttachments;
            (engine as any)._setupFramebufferDepthAttachments = function (generateStencil: boolean, generateDepth: boolean, width: number, height: number) {
                calls.push({ generateStencil, generateDepth, width, height });
                return {};
            };

            try {
                engine.updateWrappedWebGLTexture(wrapped, {} as WebGLTexture);
            } finally {
                (engine as any)._setupFramebufferDepthAttachments = original;
            }

            expect(calls.length).toBe(1);
            expect(calls[0].width).toBe(128);
            expect(calls[0].height).toBe(256);
        });
    });
});
