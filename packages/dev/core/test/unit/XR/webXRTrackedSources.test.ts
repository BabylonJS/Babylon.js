/*
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines/nullEngine";
import { Logger } from "core/Misc/logger";
import { Scene } from "core/scene";
import { WebXRTrackedSources, RegisterWebXRTrackedSources } from "core/XR/features/WebXRTrackedSources.pure";
import { WebXRFeatureName, WebXRFeaturesManager } from "core/XR/webXRFeaturesManager";
import { WebXRSessionManager } from "core/XR/webXRSessionManager";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

class MockXRInputSource implements XRInputSource {
    public readonly targetRayMode = "tracked-pointer";
    public readonly targetRaySpace!: XRSpace;

    constructor(
        public readonly handedness: XRInputSource["handedness"],
        public readonly profiles: string[]
    ) {}
}

class MockTrackedSourcesSession extends EventTarget {
    public readonly enabledFeatures = ["tracked-sources"];
    public readonly inputSources: XRInputSource[] = [];
    public readonly trackedSources: XRInputSource[] = [];
}

class MockUnsupportedSession extends EventTarget {
    public readonly enabledFeatures = ["tracked-sources"];
    public readonly inputSources: XRInputSource[] = [];
}

describe("WebXRTrackedSources", () => {
    let engine: NullEngine;
    let scene: Scene;
    let sessionManager: WebXRSessionManager;
    let session: MockTrackedSourcesSession;
    let feature: WebXRTrackedSources;

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
        Reflect.set(sessionManager, "_xrNavigator", { xr: { native: false } });
        session = new MockTrackedSourcesSession();
        Reflect.set(sessionManager, "session", session);
        feature = new WebXRTrackedSources(sessionManager);
    });

    afterEach(() => {
        if (!feature.isDisposed) {
            feature.dispose();
        }
        scene.dispose();
        engine.dispose();
    });

    it("requests the tracked-sources native feature through the features manager", async () => {
        RegisterWebXRTrackedSources();
        const featuresManager = new WebXRFeaturesManager(sessionManager);
        const enabledFeature = featuresManager.enableFeature(WebXRFeatureName.TRACKED_SOURCES, 1, undefined, false);

        const sessionInit = await featuresManager._extendXRSessionInitObject({});

        expect(enabledFeature).toBeInstanceOf(WebXRTrackedSources);
        expect(enabledFeature.xrNativeFeatureName).toBe("tracked-sources");
        expect(sessionInit.requiredFeatures).toEqual(["tracked-sources"]);
        featuresManager.dispose();
    });

    it("publishes the initial tracked sources in native order while preserving identity", () => {
        const left = new MockXRInputSource("left", ["tracked-left"]);
        const right = new MockXRInputSource("right", ["tracked-right"]);
        session.trackedSources.push(left, right);
        const added: XRInputSource[] = [];
        feature.onTrackedSourceAddedObservable.add((source) => added.push(source));

        expect(feature.attach()).toBe(true);

        expect(feature.trackedSources).toEqual([left, right]);
        expect(added).toEqual([left, right]);
        expect(feature.trackedSources).not.toBe(feature.trackedSources);
    });

    it("reports deterministic removals and additions from trackedsourceschange", () => {
        const first = new MockXRInputSource("left", ["first"]);
        const second = new MockXRInputSource("right", ["second"]);
        const third = new MockXRInputSource("none", ["third"]);
        session.trackedSources.push(first, second);
        feature.attach();
        const added: XRInputSource[] = [];
        const removed: XRInputSource[] = [];
        feature.onTrackedSourceAddedObservable.add((source) => added.push(source));
        feature.onTrackedSourceRemovedObservable.add((source) => removed.push(source));

        session.trackedSources.splice(0, 2, second, third);
        session.dispatchEvent(new Event("trackedsourceschange"));

        expect(feature.trackedSources).toEqual([second, third]);
        expect(removed).toEqual([first]);
        expect(added).toEqual([third]);
    });

    it("does not poll or notify when events and XR frames leave the tracked source set unchanged", () => {
        session.trackedSources.push(new MockXRInputSource("left", ["tracked"]));
        feature.attach();
        const added = vi.fn();
        const removed = vi.fn();
        feature.onTrackedSourceAddedObservable.add(added);
        feature.onTrackedSourceRemovedObservable.add(removed);

        session.dispatchEvent(new Event("trackedsourceschange"));
        Reflect.set(sessionManager, "currentFrame", {});
        sessionManager.onXRFrameObservable.notifyObservers(sessionManager.currentFrame!);

        expect(added).not.toHaveBeenCalled();
        expect(removed).not.toHaveBeenCalled();
    });

    it("cleans up native listeners and state on detach", () => {
        const initial = new MockXRInputSource("left", ["initial"]);
        const later = new MockXRInputSource("right", ["later"]);
        session.trackedSources.push(initial);
        feature.attach();
        const added = vi.fn();
        const removed: XRInputSource[] = [];
        feature.onTrackedSourceAddedObservable.add(added);
        feature.onTrackedSourceRemovedObservable.add((source) => removed.push(source));

        expect(feature.detach()).toBe(true);
        session.trackedSources.push(later);
        session.dispatchEvent(new Event("trackedsourceschange"));

        expect(feature.trackedSources).toEqual([]);
        expect(removed).toEqual([initial]);
        expect(added).not.toHaveBeenCalled();
    });

    it("reattaches to a new session without retaining sources or listeners from the old session", () => {
        const oldSource = new MockXRInputSource("left", ["old"]);
        const newSource = new MockXRInputSource("right", ["new"]);
        session.trackedSources.push(oldSource);
        feature.attach();
        feature.detach();

        const newSession = new MockTrackedSourcesSession();
        newSession.trackedSources.push(newSource);
        Reflect.set(sessionManager, "session", newSession);
        expect(feature.attach()).toBe(true);

        session.trackedSources.push(new MockXRInputSource("none", ["stale"]));
        session.dispatchEvent(new Event("trackedsourceschange"));
        expect(feature.trackedSources).toEqual([newSource]);
    });

    it("clears observables and native listeners on dispose", () => {
        session.trackedSources.push(new MockXRInputSource("left", ["initial"]));
        feature.attach();
        const added = vi.fn();
        feature.onTrackedSourceAddedObservable.add(added);

        feature.dispose();
        session.trackedSources.push(new MockXRInputSource("right", ["later"]));
        session.dispatchEvent(new Event("trackedsourceschange"));

        expect(feature.trackedSources).toEqual([]);
        expect(feature.onTrackedSourceAddedObservable.hasObservers()).toBe(false);
        expect(feature.onTrackedSourceRemovedObservable.hasObservers()).toBe(false);
        expect(added).not.toHaveBeenCalled();
    });

    it("rejects attachment when XRSession.trackedSources is unavailable", () => {
        Reflect.set(sessionManager, "session", new MockUnsupportedSession());
        const warning = "XRSession.trackedSources is not supported by this XR runtime.";
        const warnSpy = vi.spyOn(Logger, "Warn").mockImplementation(() => {});

        expect(feature.attach()).toBe(false);

        expect(feature.attached).toBe(false);
        expect(feature.disableAutoAttach).toBe(true);
        expect(warnSpy).toHaveBeenCalledExactlyOnceWith(warning);
        warnSpy.mockRestore();
    });

    it("does not attach when the session did not grant the tracked-sources feature", () => {
        const trackedSource = new MockXRInputSource("left", ["tracked"]);
        session.enabledFeatures.length = 0;
        session.trackedSources.push(trackedSource);

        expect(feature.attach()).toBe(false);
        session.dispatchEvent(new Event("trackedsourceschange"));

        expect(feature.attached).toBe(false);
        expect(feature.disableAutoAttach).toBe(false);
        expect(feature.trackedSources).toEqual([]);
    });

    it("does not add tracked sources to the active input source collection", () => {
        const activeSource = new MockXRInputSource("left", ["active"]);
        const trackedSource = new MockXRInputSource("right", ["tracked"]);
        session.inputSources.push(activeSource);
        session.trackedSources.push(trackedSource);

        feature.attach();
        session.dispatchEvent(new Event("trackedsourceschange"));

        expect(session.inputSources).toEqual([activeSource]);
        expect(session.inputSources).not.toContain(trackedSource);
        expect(feature.trackedSources).toEqual([trackedSource]);
    });
});
