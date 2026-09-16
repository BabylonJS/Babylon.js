/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines/nullEngine";
import { Matrix } from "core/Maths/math.vector";
import { Scene } from "core/scene";
import { type IWebXRAnchor, WebXRAnchorSystem } from "core/XR/features/WebXRAnchorSystem";
import { WebXRSessionManager } from "core/XR/webXRSessionManager";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function createNativeAnchor(requestPersistentHandle?: () => Promise<string>) {
    return {
        anchorSpace: {} as XRSpace,
        delete: vi.fn(),
        requestPersistentHandle,
    } as XRAnchor;
}

function createFrame(trackedAnchors: XRAnchor[]) {
    return {
        getPose: vi.fn(() => {
            return {
                transform: {
                    matrix: Float32Array.from(Matrix.Identity().asArray()),
                },
            } as XRPose;
        }),
        trackedAnchors: new Set(trackedAnchors),
    } as unknown as XRFrame;
}

describe("WebXRAnchorSystem", () => {
    let engine: NullEngine;
    let scene: Scene;
    let sessionManager: WebXRSessionManager;
    let feature: WebXRAnchorSystem;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        sessionManager = new WebXRSessionManager(scene);
        Object.defineProperty(sessionManager, "_xrNavigator", {
            configurable: true,
            value: { xr: { native: false } },
        });
        sessionManager.referenceSpace = {} as XRReferenceSpace;
    });

    afterEach(() => {
        feature?.dispose();
        scene.dispose();
        engine.dispose();
        vi.restoreAllMocks();
    });

    function initializeFeature(session: Partial<XRSession>) {
        sessionManager.session = {
            enabledFeatures: ["anchors"],
            ...session,
        } as XRSession;
        feature = new WebXRAnchorSystem(sessionManager);
        expect(feature.attach()).toBe(true);
    }

    async function trackAnchor(nativeAnchor: XRAnchor) {
        const added = vi.fn();
        feature.onAnchorAddedObservable.add(added);
        sessionManager.onXRFrameObservable.notifyObservers(createFrame([nativeAnchor]));
        expect(added).toHaveBeenCalledTimes(1);
        return added.mock.calls[0][0] as IWebXRAnchor;
    }

    it("detects and enumerates persistent anchor support on the current session", () => {
        const handles = ["first", "second"];
        initializeFeature({
            deletePersistentAnchor: vi.fn(),
            persistentAnchors: handles,
            restorePersistentAnchor: vi.fn(),
        });

        expect(feature.isPersistentAnchorSupported).toBe(true);
        expect(feature.persistentAnchors).toBe(handles);
    });

    it("requests and stores a persistent handle on a tracked anchor", async () => {
        initializeFeature({});
        const requestPersistentHandle = vi.fn(async () => "persistent-handle");
        const anchor = await trackAnchor(createNativeAnchor(requestPersistentHandle));

        await expect(feature.requestPersistentHandleAsync(anchor)).resolves.toBe("persistent-handle");
        expect(requestPersistentHandle).toHaveBeenCalledOnce();
        expect(anchor.persistentHandle).toBe("persistent-handle");
    });

    it("restores an anchor through the existing collection and observable lifecycle", async () => {
        const nativeAnchor = createNativeAnchor();
        const restorePersistentAnchor = vi.fn(async () => nativeAnchor);
        initializeFeature({
            persistentAnchors: ["restored-handle"],
            restorePersistentAnchor,
        });
        const added = vi.fn();
        feature.onAnchorAddedObservable.add(added);

        const restoredAnchorPromise = feature.restorePersistentAnchorAsync("restored-handle");
        await Promise.resolve();
        sessionManager.onXRFrameObservable.notifyObservers(createFrame([nativeAnchor]));
        const restoredAnchor = await restoredAnchorPromise;

        expect(restorePersistentAnchor).toHaveBeenCalledExactlyOnceWith("restored-handle");
        expect(restoredAnchor.persistentHandle).toBe("restored-handle");
        expect(feature.anchors).toEqual([restoredAnchor]);
        expect(added).toHaveBeenCalledExactlyOnceWith(restoredAnchor, expect.anything());
    });

    it("restores all persistent anchors", async () => {
        const firstAnchor = createNativeAnchor();
        const secondAnchor = createNativeAnchor();
        const anchorsByHandle = new Map([
            ["first", firstAnchor],
            ["second", secondAnchor],
        ]);
        const restorePersistentAnchor = vi.fn(async (handle: string) => anchorsByHandle.get(handle)!);
        initializeFeature({
            persistentAnchors: ["first", "second"],
            restorePersistentAnchor,
        });

        const restoredAnchorsPromise = feature.restorePersistentAnchorsAsync();
        await Promise.resolve();
        sessionManager.onXRFrameObservable.notifyObservers(createFrame([firstAnchor, secondAnchor]));
        const restoredAnchors = await restoredAnchorsPromise;

        expect(restorePersistentAnchor).toHaveBeenCalledTimes(2);
        expect(restoredAnchors.map((anchor) => anchor.persistentHandle)).toEqual(["first", "second"]);
        expect(feature.anchors).toEqual(restoredAnchors);
    });

    it("deletes persistent storage and removes a tracked anchor through the existing lifecycle", async () => {
        let calledSession: XRSession | undefined;
        const deletePersistentAnchor = vi.fn(async function (this: XRSession) {
            calledSession = this;
        });
        initializeFeature({ deletePersistentAnchor });
        const activeSession = sessionManager.session;
        const replacementSession = {} as XRSession;
        const anchor = await trackAnchor(createNativeAnchor(async () => "persistent-handle"));
        await feature.requestPersistentHandleAsync(anchor);
        const removed = vi.fn();
        feature.onAnchorRemovedObservable.add(removed);
        let sessionReadCount = 0;
        Object.defineProperty(sessionManager, "session", {
            configurable: true,
            get: () => (sessionReadCount++ === 0 ? activeSession : replacementSession),
        });

        await feature.deletePersistentAnchorAsync("persistent-handle");
        Object.defineProperty(sessionManager, "session", {
            configurable: true,
            value: activeSession,
            writable: true,
        });
        sessionManager.onXRFrameObservable.notifyObservers(createFrame([]));

        expect(deletePersistentAnchor).toHaveBeenCalledExactlyOnceWith("persistent-handle");
        expect(calledSession).toBe(activeSession);
        expect(feature.anchors).toHaveLength(0);
        expect(removed).toHaveBeenCalledExactlyOnceWith(anchor, expect.anything());
    });

    it("rejects a native restore that completes after the feature detaches", async () => {
        const nativeAnchor = createNativeAnchor();
        let resolveRestore!: (anchor: XRAnchor) => void;
        const nativeRestorePromise = new Promise<XRAnchor>((resolve) => {
            resolveRestore = resolve;
        });
        initializeFeature({
            restorePersistentAnchor: vi.fn(async () => await nativeRestorePromise),
        });

        const restoredAnchorPromise = feature.restorePersistentAnchorAsync("pending-handle");
        feature.detach();
        resolveRestore(nativeAnchor);

        await expect(restoredAnchorPromise).rejects.toThrow("Persistent anchor restoration was interrupted");
        expect(nativeAnchor.delete).toHaveBeenCalledOnce();
    });

    it("rejects a queued persistent restore when the feature is disposed", async () => {
        const nativeAnchor = createNativeAnchor();
        initializeFeature({
            restorePersistentAnchor: vi.fn(async () => nativeAnchor),
        });

        const restoredAnchorPromise = feature.restorePersistentAnchorAsync("pending-handle");
        await Promise.resolve();
        feature.dispose();

        await expect(restoredAnchorPromise).rejects.toThrow("Persistent anchor restoration was interrupted");
    });

    it("rejects a queued persistent restore when session initialization clears anchors", async () => {
        const nativeAnchor = createNativeAnchor();
        sessionManager.session = {
            enabledFeatures: ["anchors"],
            restorePersistentAnchor: vi.fn(async () => nativeAnchor),
        } as XRSession;
        feature = new WebXRAnchorSystem(sessionManager, { clearAnchorsOnSessionInit: true });
        expect(feature.attach()).toBe(true);

        const restoredAnchorPromise = feature.restorePersistentAnchorAsync("pending-handle");
        await Promise.resolve();
        sessionManager.onXRSessionInit.notifyObservers(sessionManager.session);

        await expect(restoredAnchorPromise).rejects.toThrow("Persistent anchor restoration was interrupted");
    });

    it("feature-detects each unsupported persistence operation", async () => {
        initializeFeature({});
        const anchor = await trackAnchor(createNativeAnchor());

        expect(feature.isPersistentAnchorSupported).toBe(false);
        expect(() => feature.persistentAnchors).toThrow("Persistent anchor enumeration is not supported");
        await expect(feature.requestPersistentHandleAsync(anchor)).rejects.toThrow("Requesting persistent anchor handles is not supported");
        await expect(feature.restorePersistentAnchorAsync("missing")).rejects.toThrow("Restoring persistent anchors is not supported");
        await expect(feature.deletePersistentAnchorAsync("missing")).rejects.toThrow("Deleting persistent anchors is not supported");
    });

    it("preserves ordinary non-persistent anchor behavior", async () => {
        initializeFeature({});
        const nativeAnchor = createNativeAnchor();
        const anchor = await trackAnchor(nativeAnchor);
        const removed = vi.fn();
        feature.onAnchorRemovedObservable.add(removed);

        expect(anchor.persistentHandle).toBeUndefined();
        anchor.remove();
        sessionManager.onXRFrameObservable.notifyObservers(createFrame([]));

        expect(nativeAnchor.delete).toHaveBeenCalledOnce();
        expect(feature.anchors).toHaveLength(0);
        expect(removed).toHaveBeenCalledExactlyOnceWith(anchor, expect.anything());
    });
});
