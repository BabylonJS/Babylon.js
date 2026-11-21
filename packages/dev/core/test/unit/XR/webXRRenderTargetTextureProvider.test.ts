/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines";
import { type RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { type Viewport } from "core/Maths/math.viewport";
import { Scene } from "core/scene";
import { type Nullable } from "core/types";
import { type WebXRLayerWrapper } from "core/XR/webXRLayerWrapper";
import { WebXRLayerRenderTargetTextureProvider } from "core/XR/webXRRenderTargetTextureProvider";
import { WebXRWebGLLayerRenderTargetTextureProvider, type WebXRWebGLLayerWrapper } from "core/XR/webXRWebGLLayer";
import { WebXRWebGLRenderTargetTextureProvider } from "core/XR/webXRWebGLRenderTargetTextureProvider";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Minimal concrete provider that exposes the protected API-agnostic hook for testing.
class TestRenderTargetTextureProvider extends WebXRLayerRenderTargetTextureProvider {
    public trySetViewportForView(_viewport: Viewport, _view: XRView): boolean {
        return false;
    }
    public getRenderTargetTextureForEye(_eye: XREye): Nullable<RenderTargetTexture> {
        return null;
    }
    public getRenderTargetTextureForView(_view: XRView): Nullable<RenderTargetTexture> {
        return null;
    }
    public createInternal(multiview: boolean): RenderTargetTexture {
        return this._createRenderTargetTextureInternal(1, 1, null, null, multiview);
    }
}

describe("WebXRLayerRenderTargetTextureProvider", () => {
    let engine: NullEngine;
    let scene: Scene;
    let provider: TestRenderTargetTextureProvider;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
        provider = new TestRenderTargetTextureProvider(scene, {} as WebXRLayerWrapper);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    describe("_createRenderTargetTextureInternal", () => {
        it("throws for multiview render targets", () => {
            // The multiview array path is not wired on the API-agnostic hook; it is owned by the WebGL provider.
            expect(() => provider.createInternal(true)).toThrow(/Multiview render targets are not yet supported/);
        });

        it("does not attach a clear observer (the per-eye clear is WebGPU-only)", () => {
            // The right-eye clear observer is attached only by the WebGPU provider. Render targets built via
            // the shared API-agnostic hook (used by the WebGL path) must not get it, so WebGL2 stays unchanged.
            const rtt = provider.createInternal(false);
            expect(rtt.onClearObservable.hasObservers()).toBe(false);
        });
    });
});

/**
 * A WebGL provider whose render target shell carries the GPU objects a real WebGL engine allocates for it
 * (NullEngine allocates none): a framebuffer and, for multiview, a color and a depth/stencil texture array.
 */
class TestWebGLRenderTargetTextureProvider extends WebXRWebGLRenderTargetTextureProvider {
    public readonly shellFramebuffer = { name: "shell framebuffer" } as WebGLFramebuffer;
    public readonly shellColorTextureArray = { name: "shell color array" } as WebGLTexture;
    public readonly shellDepthStencilTextureArray = { name: "shell depth/stencil array" } as WebGLTexture;

    public trySetViewportForView(_viewport: Viewport, _view: XRView): boolean {
        return false;
    }
    public getRenderTargetTextureForEye(_eye: XREye): Nullable<RenderTargetTexture> {
        return null;
    }
    public getRenderTargetTextureForView(_view: XRView): Nullable<RenderTargetTexture> {
        return null;
    }
    protected override _createRenderTargetTextureShell(width: number, height: number, multiview: boolean): RenderTargetTexture {
        // NullEngine cannot create a multiview render target, so a plain shell stands in for it.
        const shell = super._createRenderTargetTextureShell(width, height, false);
        const wrapper = shell.renderTarget as any;
        wrapper._framebuffer = this.shellFramebuffer;
        if (multiview) {
            wrapper._colorTextureArray = this.shellColorTextureArray;
            wrapper._depthStencilTextureArray = this.shellDepthStencilTextureArray;
        }
        return shell;
    }
    public create(framebuffer: Nullable<WebGLFramebuffer>, colorTexture?: WebGLTexture, depthStencilTexture?: WebGLTexture, multiview?: boolean): RenderTargetTexture {
        return this._createRenderTargetTexture(4, 4, framebuffer, colorTexture, depthStencilTexture, multiview);
    }
}

describe("WebXRWebGLRenderTargetTextureProvider", () => {
    let engine: NullEngine;
    let scene: Scene;
    let gl: { deleteFramebuffer: ReturnType<typeof vi.fn>; deleteTexture: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        gl = { deleteFramebuffer: vi.fn(), deleteTexture: vi.fn() };
        (engine as any)._gl = gl;
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    describe("GPU objects the render target shell allocated", () => {
        let provider: TestWebGLRenderTargetTextureProvider;
        const xrFramebuffer = { name: "XR framebuffer" } as WebGLFramebuffer;
        const xrColorTexture = { name: "XR color array" } as WebGLTexture;
        const xrDepthStencilTexture = { name: "XR depth/stencil array" } as WebGLTexture;

        beforeEach(() => {
            provider = new TestWebGLRenderTargetTextureProvider(scene, {} as WebXRLayerWrapper);
        });

        it("deletes the shell's framebuffer when the XR layer's framebuffer replaces it", () => {
            const wrapper = provider.create(xrFramebuffer).renderTarget as any;

            expect(wrapper._framebuffer).toBe(xrFramebuffer);
            expect(gl.deleteFramebuffer.mock.calls).toEqual([[provider.shellFramebuffer]]);
        });

        it("deletes the shell's framebuffer when the XR layer renders into the default framebuffer", () => {
            const wrapper = provider.create(null).renderTarget as any;

            expect(wrapper._framebuffer).toBeNull();
            expect(gl.deleteFramebuffer.mock.calls).toEqual([[provider.shellFramebuffer]]);
        });

        it("deletes the shell's multiview texture arrays when the XR layer's replace them, and keeps its framebuffer", () => {
            const wrapper = provider.create(null, xrColorTexture, xrDepthStencilTexture, true).renderTarget as any;

            expect(wrapper._framebuffer).toBe(provider.shellFramebuffer);
            expect(wrapper._colorTextureArray).toBe(xrColorTexture);
            expect(wrapper._depthStencilTextureArray).toBe(xrDepthStencilTexture);
            expect(gl.deleteFramebuffer).not.toHaveBeenCalled();
            expect(gl.deleteTexture.mock.calls).toEqual([[provider.shellColorTextureArray], [provider.shellDepthStencilTextureArray]]);
        });

        it("keeps the shell's depth/stencil array when the XR layer provides none", () => {
            const wrapper = provider.create(null, xrColorTexture, undefined, true).renderTarget as any;

            expect(wrapper._depthStencilTextureArray).toBe(provider.shellDepthStencilTextureArray);
            expect(gl.deleteTexture.mock.calls).toEqual([[provider.shellColorTextureArray]]);
        });
    });

    describe("WebXRWebGLLayerRenderTargetTextureProvider.dispose", () => {
        it("removes its render target from the scene without deleting the XRWebGLLayer's framebuffer", () => {
            const xrFramebuffer = { name: "XRWebGLLayer framebuffer" } as WebGLFramebuffer;
            const layer = { framebufferWidth: 4, framebufferHeight: 4, framebuffer: xrFramebuffer } as XRWebGLLayer;
            const provider = new WebXRWebGLLayerRenderTargetTextureProvider(scene, { layer } as WebXRWebGLLayerWrapper);
            const texturesBefore = scene.textures.length;

            const renderTargetTexture = provider.getRenderTargetTextureForEye("left")!;
            const wrapper = renderTargetTexture.renderTarget as any;
            expect(scene.textures).toContain(renderTargetTexture);
            expect(wrapper._framebuffer).toBe(xrFramebuffer);

            // A WebGL render target wrapper deletes whatever framebuffer it still holds when it is disposed.
            let framebufferWhenDisposed: unknown = "never disposed";
            const disposeWrapper = wrapper.dispose.bind(wrapper);
            wrapper.dispose = (...args: unknown[]) => {
                framebufferWhenDisposed = wrapper._framebuffer;
                disposeWrapper(...args);
            };

            provider.dispose();

            expect(framebufferWhenDisposed).toBeNull();
            expect(scene.textures).not.toContain(renderTargetTexture);
            expect(scene.textures.length).toBe(texturesBefore);
            expect(gl.deleteFramebuffer).not.toHaveBeenCalledWith(xrFramebuffer);
        });
    });
});
