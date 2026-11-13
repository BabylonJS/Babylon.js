import { describe, expect, it, vi } from "vitest";
import "core/Engines/Extensions/engine.multiRender";
import { NullEngine } from "core/Engines/nullEngine";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Vector3 } from "core/Maths/math.vector";
import { RenderTargetWrapper } from "core/Engines/renderTargetWrapper";
import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";
import "core/Rendering/depthPeelingSceneComponent";
import "core/Rendering/prePassRendererSceneComponent";
import { Scene } from "core/scene";
import { ThinDepthPeelingRenderer } from "core/Rendering/thinDepthPeelingRenderer.pure";

describe("DepthPeelingRenderer", () => {
    it("shares the prepass depth before the prepass is cleared, including after a resize", async () => {
        const engine = new NullEngine();
        let renderWidth = 256;
        let renderHeight = 256;
        vi.spyOn(engine, "getRenderWidth").mockImplementation((useScreen) => (useScreen ? renderWidth : (engine._currentRenderTarget?.width ?? renderWidth)));
        vi.spyOn(engine, "getRenderHeight").mockImplementation((useScreen) => (useScreen ? renderHeight : (engine._currentRenderTarget?.height ?? renderHeight)));
        vi.spyOn(engine, "buildTextureLayout").mockImplementation((textureStatus) => textureStatus.map((enabled, index) => (enabled ? index + 1 : 0)));
        engine.getCaps().drawBuffersExtension = true;
        vi.spyOn(engine, "createMultipleRenderTarget").mockImplementation((size: any, options: any) => {
            const width = size.width ?? size;
            const height = size.height ?? size;
            const rtWrapper = new RenderTargetWrapper(true, false, { width, height }, engine);
            const textures: InternalTexture[] = [];
            for (let i = 0; i < (options?.textureCount ?? 1); i++) {
                const texture = new InternalTexture(engine, InternalTextureSource.MultiRenderTarget);
                texture.width = texture.baseWidth = width;
                texture.height = texture.baseHeight = height;
                texture.isReady = true;
                textures.push(texture);
            }
            rtWrapper.setTextures(textures);
            return rtWrapper;
        });
        const events: string[] = [];
        let scene: Scene | undefined;
        vi.spyOn(engine, "bindFramebuffer").mockImplementation((rtWrapper) => {
            engine._currentRenderTarget = rtWrapper;
            if (rtWrapper === scene?.prePassRenderer?.defaultRT.renderTarget) {
                events.push(`bind:${rtWrapper.width}`);
            }
        });
        vi.spyOn(engine, "unBindFramebuffer").mockImplementation(() => {
            engine._currentRenderTarget = null;
        });
        vi.spyOn(engine, "bindAttachments").mockImplementation(() => {});
        vi.spyOn(engine, "_createInternalTexture").mockImplementation((size: any) => {
            const texture = new InternalTexture(engine, InternalTextureSource.Unknown);
            texture.width = texture.baseWidth = size.width;
            texture.height = texture.baseHeight = size.height;
            return texture;
        });
        scene = new Scene(engine);
        new FreeCamera("camera", new Vector3(0, 0, -10), scene);
        const createEffects = vi.spyOn(ThinDepthPeelingRenderer.prototype as any, "_createEffects").mockImplementation(function (this: any) {
            this._blendBackEffectWrapper = { dispose: vi.fn() };
            this._finalEffectWrapper = { dispose: vi.fn() };
            this._effectRenderer = { dispose: vi.fn() };
        });
        scene.useOrderIndependentTransparency = true;
        expect(scene.depthPeelingRenderer).toBeTruthy();
        await Promise.resolve();

        let rejectGeneratedDepth = true;
        let rejectResize = false;
        const shareDepth = vi.spyOn(RenderTargetWrapper.prototype, "shareDepth").mockImplementation(function (this: RenderTargetWrapper) {
            if (rejectGeneratedDepth) {
                throw new Error("cannot share an auto-generated depth/stencil buffer");
            }
            if (rejectResize) {
                throw new Error("sample mismatch");
            }
            events.push(`share:${this.width}`);
        });
        vi.spyOn(engine, "clear").mockImplementation(() => {
            const prePassRT = scene.prePassRenderer?.defaultRT.renderTarget;
            if (prePassRT && engine._currentRenderTarget === prePassRT) {
                events.push(`clear:${prePassRT.width}`);
            }
        });

        try {
            expect(() => scene.render()).toThrow("cannot share an auto-generated depth/stencil buffer");
            expect((scene.prePassRenderer as any)._isDirty).toBe(true);

            rejectGeneratedDepth = false;
            scene.render();
            expect((scene.prePassRenderer as any)._isDirty).toBe(false);
            expect(events.indexOf("share:256")).toBeGreaterThanOrEqual(0);
            expect(events.indexOf("share:256")).toBeLessThan(events.indexOf("clear:256"));

            const getTextureSize = vi.spyOn(scene.depthPeelingRenderer as any, "_getTextureSize");
            expect((scene.depthPeelingRenderer as any)._updateTextures()).toBe(true);
            expect(getTextureSize).not.toHaveBeenCalled();
            getTextureSize.mockRestore();

            events.length = 0;
            renderWidth = renderHeight = 128;
            scene.render();
            expect(events.indexOf("share:128")).toBeGreaterThanOrEqual(0);
            expect(events.indexOf("share:128")).toBeLessThan(events.indexOf("clear:128"));

            events.length = 0;
            rejectResize = true;
            renderWidth = renderHeight = 64;
            expect(() => scene.prePassRenderer!.defaultRT._checkSize()).toThrow("sample mismatch");
            expect((scene.prePassRenderer as any)._isDirty).toBe(false);

            rejectResize = false;
            (scene.prePassRenderer as any)._bindFrameBuffer();
            expect(events.indexOf("share:64")).toBeGreaterThanOrEqual(0);
            expect(events.indexOf("share:64")).toBeLessThan(events.indexOf("bind:64"));
        } finally {
            createEffects.mockRestore();
            shareDepth.mockRestore();
            scene.dispose();
            engine.dispose();
        }
    });
});
