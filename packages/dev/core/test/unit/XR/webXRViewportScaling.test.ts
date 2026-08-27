/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines/nullEngine";
import { Matrix } from "core/Maths/math.vector";
import { Viewport } from "core/Maths/math.viewport";
import { Scene } from "core/scene";
import { WebXRCamera } from "core/XR/webXRCamera";
import { WebXRSessionManager } from "core/XR/webXRSessionManager";
import { WebXRWebGLLayerWrapper } from "core/XR/webXRWebGLLayer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface IMockXRViewOptions {
    eye?: "none" | "left" | "right";
    recommendation?: number | null;
    requestViewportScale?: (scale: number | null) => void;
    unsupported?: boolean;
}

function createView(options: IMockXRViewOptions = {}): XRView {
    const view = {
        eye: options.eye ?? "none",
        projectionMatrix: Float32Array.from(Matrix.Identity().asArray()),
        transform: {
            position: { x: 0, y: 0, z: 0, w: 1 },
            orientation: { x: 0, y: 0, z: 0, w: 1 },
        },
        recommendedViewportScale: options.recommendation ?? null,
        requestViewportScale: options.requestViewportScale ?? vi.fn(),
    };

    if (options.unsupported) {
        delete (view as Partial<typeof view>).recommendedViewportScale;
        delete (view as Partial<typeof view>).requestViewportScale;
    }

    return view as unknown as XRView;
}

function createPose(views: XRView[]): XRViewerPose {
    return {
        emulatedPosition: false,
        transform: {
            position: { x: 0, y: 0, z: 0, w: 1 },
            orientation: { x: 0, y: 0, z: 0, w: 1 },
        },
        views,
    } as unknown as XRViewerPose;
}

describe("WebXR viewport scaling", () => {
    let engine: NullEngine;
    let scene: Scene;
    let sessionManager: WebXRSessionManager;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
        sessionManager = new WebXRSessionManager(scene);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    function setCurrentPose(pose: XRViewerPose): void {
        sessionManager.session = { updateRenderState: vi.fn(), end: vi.fn().mockResolvedValue(undefined) } as unknown as XRSession;
        sessionManager.referenceSpace = {} as XRReferenceSpace;
        sessionManager.currentFrame = {
            getViewerPose: vi.fn(() => pose),
        } as unknown as XRFrame;
        sessionManager.inXRSession = true;
        sessionManager.inXRFrameLoop = true;
    }

    it("detects API support and preserves numeric and null recommendations", () => {
        setCurrentPose(createPose([createView({ recommendation: 0.7 }), createView({ eye: "right", recommendation: null }), createView({ unsupported: true })]));

        expect(sessionManager.isViewportScaleSupported(0)).toBe(true);
        expect(sessionManager.getRecommendedViewportScale(0)).toBe(0.7);
        expect(sessionManager.isViewportScaleSupported(1)).toBe(true);
        expect(sessionManager.getRecommendedViewportScale(1)).toBeNull();
        expect(sessionManager.isViewportScaleSupported(2)).toBe(false);
        expect(sessionManager.getRecommendedViewportScale(2)).toBeUndefined();
    });

    it("delegates requests independently to every current view", () => {
        const leftRequest = vi.fn();
        const rightRequest = vi.fn();
        setCurrentPose(
            createPose([
                createView({ eye: "left", requestViewportScale: leftRequest }),
                createView({ eye: "right", requestViewportScale: rightRequest }),
                createView({ eye: "none", requestViewportScale: vi.fn() }),
            ])
        );

        expect(sessionManager.requestViewportScale(0, 0.75)).toBeUndefined();
        expect(sessionManager.requestViewportScale(1, 0.5)).toBeUndefined();

        expect(leftRequest).toHaveBeenCalledExactlyOnceWith(0.75);
        expect(rightRequest).toHaveBeenCalledExactlyOnceWith(0.5);
    });

    it("preserves native ignored-value, clamping, and reset semantics", () => {
        let appliedScale = 0.5;
        const nativeRequest = vi.fn((scale: number | null) => {
            if (scale !== null && scale > 0) {
                appliedScale = Math.min(scale, 1);
            }
        });
        setCurrentPose(createPose([createView({ requestViewportScale: nativeRequest })]));

        sessionManager.requestViewportScale(0, -1);
        expect(appliedScale).toBe(0.5);
        sessionManager.requestViewportScale(0, null);
        expect(appliedScale).toBe(0.5);
        sessionManager.requestViewportScale(0, 2);
        expect(appliedScale).toBe(1);
        sessionManager.requestViewportScale(0, 0.5);
        sessionManager.requestViewportScale(0, 1);
        expect(appliedScale).toBe(1);

        expect(nativeRequest.mock.calls).toEqual([[-1], [null], [2], [0.5], [1]]);
    });

    it("propagates native exceptions", () => {
        const nativeError = new TypeError("Native viewport scale conversion failed.");
        setCurrentPose(
            createPose([
                createView({
                    requestViewportScale: () => {
                        throw nativeError;
                    },
                }),
            ])
        );

        expect(() => sessionManager.requestViewportScale(0, Number.NaN)).toThrow(nativeError);
    });

    it("fails clearly for an unsupported view", () => {
        setCurrentPose(createPose([createView({ unsupported: true })]));

        expect(() => sessionManager.requestViewportScale(0, 0.5)).toThrow("Dynamic viewport scaling is not supported for XR view 0.");
    });

    it("rejects calls outside a current XR frame and invalid view indices", () => {
        expect(() => sessionManager.isViewportScaleSupported(0)).toThrow("Dynamic viewport scaling requires an active XR session.");

        setCurrentPose(createPose([createView()]));
        sessionManager.inXRFrameLoop = false;
        expect(() => sessionManager.getRecommendedViewportScale(0)).toThrow("Dynamic viewport scaling must be used during an active XR frame.");

        sessionManager.inXRFrameLoop = true;
        expect(() => sessionManager.requestViewportScale(-1, 0.5)).toThrow("The XR view index must be a non-negative integer.");
        expect(() => sessionManager.requestViewportScale(1, 0.5)).toThrow("XR view 1 is not available in the current viewer pose.");

        sessionManager.currentFrame = {
            getViewerPose: vi.fn(() => null),
        } as unknown as XRFrame;
        expect(() => sessionManager.requestViewportScale(0, 0.5)).toThrow("XR view 0 is not available in the current viewer pose.");
    });

    it("rejects calls before the XR reference space is initialized", () => {
        const getViewerPose = vi.fn();
        sessionManager.session = { end: vi.fn().mockResolvedValue(undefined) } as unknown as XRSession;
        sessionManager.currentFrame = { getViewerPose } as unknown as XRFrame;
        sessionManager.inXRSession = true;
        sessionManager.inXRFrameLoop = true;

        expect(() => sessionManager.isViewportScaleSupported(0)).toThrow("Dynamic viewport scaling requires an initialized XR reference space.");
        expect(getViewerPose).not.toHaveBeenCalled();
    });

    it("refreshes every rig viewport from the native dimensions on each frame", () => {
        const camera = new WebXRCamera("xr", scene, sessionManager);
        const views = [createView({ eye: "left" }), createView({ eye: "right" })];
        const pose = createPose(views);
        setCurrentPose(pose);

        const nativeViewports = [
            { x: 0, y: 0, width: 0.5, height: 1 },
            { x: 0.5, y: 0, width: 0.5, height: 1 },
        ];
        vi.spyOn(sessionManager, "getRenderTargetTextureForView").mockReturnValue(null);
        vi.spyOn(sessionManager, "trySetViewportForView").mockImplementation((viewport, view) => {
            const nativeViewport = nativeViewports[view.eye === "right" ? 1 : 0];
            viewport.x = nativeViewport.x;
            viewport.y = nativeViewport.y;
            viewport.width = nativeViewport.width;
            viewport.height = nativeViewport.height;
            return true;
        });

        sessionManager.onXRFrameObservable.notifyObservers(sessionManager.currentFrame!);
        expect(camera.rigCameras[0].viewport.width).toBe(0.5);
        expect(camera.rigCameras[1].viewport.width).toBe(0.5);

        nativeViewports[0] = { x: 0, y: 0, width: 0.3, height: 0.6 };
        nativeViewports[1] = { x: 0.5, y: 0, width: 0.25, height: 0.5 };
        sessionManager.onXRFrameObservable.notifyObservers(sessionManager.currentFrame!);

        expect(camera.rigCameras[0].viewport).toEqual(new Viewport(0, 0, 0.3, 0.6));
        expect(camera.rigCameras[1].viewport).toEqual(new Viewport(0.5, 0, 0.25, 0.5));
    });

    it("keeps the full render target size while consuming the scaled native WebGL viewport", () => {
        const getViewport = vi.fn(() => ({ x: 50, y: 25, width: 400, height: 200 }));
        const layer = {
            framebufferWidth: 1000,
            framebufferHeight: 500,
            framebuffer: null,
            getViewport,
        } as unknown as XRWebGLLayer;
        const wrapper = new WebXRWebGLLayerWrapper(layer);
        const provider = wrapper.createRenderTargetTextureProvider(sessionManager);
        const view = createView({ eye: "left" });

        const renderTarget = provider.getRenderTargetTextureForView(view);
        const viewport = new Viewport(0, 0, 1, 1);
        expect(provider.trySetViewportForView(viewport, view)).toBe(true);

        expect(renderTarget?.getRenderWidth()).toBe(1000);
        expect(renderTarget?.getRenderHeight()).toBe(500);
        expect(viewport).toEqual(new Viewport(0.05, 0.05, 0.4, 0.4));
    });
});
