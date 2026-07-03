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
import { afterEach, beforeEach, describe, expect, it } from "vitest";

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
    });
});
