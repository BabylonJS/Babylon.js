/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { WebXRSessionManager } from "core/XR/webXRSessionManager";
import { WebXRFeaturesManager, WebXRFeatureName, type IWebXRFeature, type WebXRFeatureConstructor } from "core/XR/webXRFeaturesManager";
import { Observable } from "core/Misc/observable";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";

let featureCounter = 0;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let savedAvailableFeatures: Record<string, any>;

/**
 * Returns a unique feature name for each call to avoid static registry pollution between tests.
 */
function uniqueFeatureName(): string {
    return `test-feature-${++featureCounter}` as any;
}

/**
 * A minimal mock feature for testing the features manager without depending on real XR features.
 */
function createMockFeature(overrides: Partial<IWebXRFeature> = {}): IWebXRFeature {
    const feature: IWebXRFeature = {
        attached: false,
        disableAutoAttach: false,
        isDisposed: false,
        onFeatureAttachObservable: new Observable<IWebXRFeature>(),
        onFeatureDetachObservable: new Observable<IWebXRFeature>(),
        attach: vi.fn(() => {
            feature.attached = true;
            return true;
        }),
        detach: vi.fn(() => {
            feature.attached = false;
            return true;
        }),
        isCompatible: vi.fn(() => true),
        dispose: vi.fn(() => {
            feature.isDisposed = true;
        }),
        ...overrides,
    };
    return feature;
}

/**
 * Creates a feature constructor compatible with FeaturesManager.AddWebXRFeature
 */
function createMockFeatureConstructor(feature: IWebXRFeature): WebXRFeatureConstructor {
    return (_xrSessionManager: WebXRSessionManager, _options?: any) => {
        return () => feature;
    };
}

describe("WebXRFeaturesManager – extended", () => {
    let engine: NullEngine;
    let scene: Scene;
    let sessionManager: WebXRSessionManager;
    let featuresManager: WebXRFeaturesManager;

    beforeEach(() => {
        savedAvailableFeatures = { ...(WebXRFeaturesManager as any)._AvailableFeatures };
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
        sessionManager = new WebXRSessionManager(scene);
        featuresManager = new WebXRFeaturesManager(sessionManager);
    });

    afterEach(() => {
        featuresManager.dispose();
        scene.dispose();
        engine.dispose();
        (WebXRFeaturesManager as any)._AvailableFeatures = savedAvailableFeatures;
    });

    describe("static feature registration", () => {
        it("AddWebXRFeature registers a feature that can be retrieved", () => {
            const name = uniqueFeatureName() as any;
            const mockFeature = createMockFeature();
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(mockFeature), 1, true);

            const available = WebXRFeaturesManager.GetAvailableFeatures();
            expect(available).toContain(name);
        });

        it("GetLatestVersionOfFeature returns the highest version", () => {
            const name = uniqueFeatureName() as any;
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(createMockFeature()), 1, true);
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(createMockFeature()), 2, false);

            expect(WebXRFeaturesManager.GetLatestVersionOfFeature(name)).toBe(2);
        });

        it("GetStableVersionOfFeature returns the stable version", () => {
            const name = uniqueFeatureName() as any;
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(createMockFeature()), 1, true);
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(createMockFeature()), 2, false);

            expect(WebXRFeaturesManager.GetStableVersionOfFeature(name)).toBe(1);
        });

        it("GetLatestVersionOfFeature returns -1 for unknown features", () => {
            expect(WebXRFeaturesManager.GetLatestVersionOfFeature("nonexistent-feature-unique")).toBe(-1);
        });

        it("GetStableVersionOfFeature returns -1 for unknown features", () => {
            expect(WebXRFeaturesManager.GetStableVersionOfFeature("nonexistent-feature-unique")).toBe(-1);
        });

        it("GetAvailableVersions returns registered versions", () => {
            const name = uniqueFeatureName() as any;
            const mockFeature = createMockFeature();
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(mockFeature), 1, true);
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(mockFeature), 2, false);

            const versions = WebXRFeaturesManager.GetAvailableVersions(name);
            expect(versions).toContain("1");
            expect(versions).toContain("2");
        });

        it("ConstructFeature throws for unknown feature version", () => {
            const name = uniqueFeatureName() as any;
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(createMockFeature()), 1, true);

            // Version 99 doesn't exist
            expect(() => WebXRFeaturesManager.ConstructFeature(name, 99, sessionManager)).toThrow("feature not found");
        });

        it("ConstructFeature returns a factory function", () => {
            const name = uniqueFeatureName() as any;
            const mockFeature = createMockFeature();
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(mockFeature), 1, true);

            const factory = WebXRFeaturesManager.ConstructFeature(name, 1, sessionManager);
            expect(typeof factory).toBe("function");

            const constructed = factory();
            expect(constructed).toBe(mockFeature);
        });
    });

    describe("enableFeature", () => {
        it("enables a registered feature and adds it to enabled list", () => {
            const name = uniqueFeatureName() as any;
            const mockFeature = createMockFeature();
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(mockFeature), 1, true);

            const result = featuresManager.enableFeature(name, 1);

            expect(result).toBeDefined();
            expect(featuresManager.getEnabledFeatures()).toContain(name);
        });

        it("throws for an unregistered feature", () => {
            expect(() => featuresManager.enableFeature("nonexistent-feature-xyz" as any)).toThrow();
        });

        it("throws for an invalid version string", () => {
            const name = uniqueFeatureName() as any;
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(createMockFeature()), 1, true);

            expect(() => featuresManager.enableFeature(name, "")).toThrow();
        });

        it("uses latest version when 'latest' is specified", () => {
            const name = uniqueFeatureName() as any;
            const mockFeature1 = createMockFeature();
            const mockFeature2 = createMockFeature();
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(mockFeature1), 1, true);
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(mockFeature2), 2, false);

            const result = featuresManager.enableFeature(name, "latest");
            expect(result).toBe(mockFeature2);
        });

        it("uses stable version when 'stable' is specified", () => {
            const name = uniqueFeatureName() as any;
            const mockFeature1 = createMockFeature();
            const mockFeature2 = createMockFeature();
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(mockFeature1), 1, true);
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(mockFeature2), 2, false);

            const result = featuresManager.enableFeature(name, "stable");
            expect(result).toBe(mockFeature1);
        });

        it("re-enabling a feature disposes the old one and creates a new one", () => {
            const name = uniqueFeatureName() as any;
            const mockFeature1 = createMockFeature();
            const mockFeature2 = createMockFeature();

            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(mockFeature1), 1, true);
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(mockFeature2), 2, false);

            featuresManager.enableFeature(name, 1);
            expect(featuresManager.getEnabledFeatures()).toContain(name);

            // Re-enable with version 2
            featuresManager.enableFeature(name, 2);

            // Old one should have been disposed
            expect(mockFeature1.dispose).toHaveBeenCalled();
            // New one is now enabled
            expect(featuresManager.getEnabledFeature(name)).toBe(mockFeature2);
        });

        it("throws when enabling incompatible required feature", () => {
            const name = uniqueFeatureName() as any;
            const mockFeature = createMockFeature({ isCompatible: vi.fn(() => false) });
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(mockFeature), 1, true);

            expect(() => featuresManager.enableFeature(name, 1, undefined, true, true)).toThrow("required feature not compatible");
        });

        it("returns feature without throwing when incompatible optional feature", () => {
            const name = uniqueFeatureName() as any;
            const mockFeature = createMockFeature({ isCompatible: vi.fn(() => false) });
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(mockFeature), 1, true);

            const result = featuresManager.enableFeature(name, 1, undefined, true, false);
            expect(result).toBeDefined();
            // It should NOT be in the enabled features list since it's incompatible
            expect(featuresManager.getEnabledFeatures()).not.toContain(name);
        });

        it("sets disableAutoAttach when attachIfPossible is false", () => {
            const name = uniqueFeatureName() as any;
            const mockFeature = createMockFeature();
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(mockFeature), 1, true);

            const result = featuresManager.enableFeature(name, 1, undefined, false);

            expect(result.disableAutoAttach).toBe(true);
        });

        it("throws when dependent features are missing", () => {
            const name = uniqueFeatureName() as any;
            const mockFeature = createMockFeature({ dependsOn: ["some-other-feature"] });
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(mockFeature), 1, true);

            expect(() => featuresManager.enableFeature(name, 1)).toThrow("Dependant features missing");
        });
    });

    describe("disableFeature", () => {
        it("disables an enabled feature and disposes it", () => {
            const name = uniqueFeatureName() as any;
            const mockFeature = createMockFeature();
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(mockFeature), 1, true);

            featuresManager.enableFeature(name, 1);
            expect(featuresManager.getEnabledFeatures()).toContain(name);

            const result = featuresManager.disableFeature(name);
            expect(result).toBe(true);
            expect(featuresManager.getEnabledFeatures()).not.toContain(name);
        });

        it("returns false when feature is not enabled", () => {
            const result = featuresManager.disableFeature("never-enabled" as any);
            expect(result).toBe(false);
        });

        it("accepts feature class with Name property", () => {
            const name = uniqueFeatureName() as any;
            const mockFeature = createMockFeature();
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(mockFeature), 1, true);
            featuresManager.enableFeature(name, 1);

            const result = featuresManager.disableFeature({ Name: name });
            expect(result).toBe(true);
        });
    });

    describe("getEnabledFeature", () => {
        it("returns the feature implementation", () => {
            const name = uniqueFeatureName() as any;
            const mockFeature = createMockFeature();
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(mockFeature), 1, true);
            featuresManager.enableFeature(name, 1);

            const retrieved = featuresManager.getEnabledFeature(name);
            expect(retrieved).toBeDefined();
            expect(retrieved).toBe(mockFeature);
        });

        it("returns undefined for non-enabled features", () => {
            expect(featuresManager.getEnabledFeature("not-enabled" as any)).toBeUndefined();
        });
    });

    describe("attachFeature / detachFeature", () => {
        it("attachFeature calls attach on the feature implementation", () => {
            const name = uniqueFeatureName() as any;
            const mockFeature = createMockFeature();
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(mockFeature), 1, true);
            const enabled = featuresManager.enableFeature(name, 1);

            // Reset the spy call count since enableFeature might have already called attach
            (enabled.attach as ReturnType<typeof vi.fn>).mockClear();

            featuresManager.attachFeature(name);

            expect(enabled.attach).toHaveBeenCalled();
        });

        it("detachFeature calls detach on the feature when attached", () => {
            const name = uniqueFeatureName() as any;
            const mockFeature = createMockFeature();
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(mockFeature), 1, true);
            const enabled = featuresManager.enableFeature(name, 1);

            // Manually mark as attached so detachFeature will proceed
            (enabled as any).attached = true;

            featuresManager.detachFeature(name);

            expect(enabled.detach).toHaveBeenCalled();
        });

        it("attachFeature does nothing for non-enabled feature", () => {
            // Should not throw
            featuresManager.attachFeature("nonexistent-feature");
        });

        it("detachFeature does nothing for non-enabled feature", () => {
            // Should not throw
            featuresManager.detachFeature("nonexistent-feature");
        });
    });

    describe("dispose", () => {
        it("disables all enabled features", () => {
            const nameA = uniqueFeatureName() as any;
            const nameB = uniqueFeatureName() as any;
            const mockFeature1 = createMockFeature();
            const mockFeature2 = createMockFeature();
            WebXRFeaturesManager.AddWebXRFeature(nameA, createMockFeatureConstructor(mockFeature1), 1, true);
            WebXRFeaturesManager.AddWebXRFeature(nameB, createMockFeatureConstructor(mockFeature2), 1, true);

            featuresManager.enableFeature(nameA, 1);
            featuresManager.enableFeature(nameB, 1);

            featuresManager.dispose();

            expect(featuresManager.getEnabledFeatures()).toEqual([]);
        });
    });

    describe("_extendXRSessionInitObject", () => {
        it("adds native feature names to requiredFeatures when required", async () => {
            const name = uniqueFeatureName() as any;
            const mockFeature = createMockFeature({ xrNativeFeatureName: "hit-test" });
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(mockFeature), 1, true);
            featuresManager.enableFeature(name, 1, undefined, false, true);

            const init: XRSessionInit = {};
            const result = await featuresManager._extendXRSessionInitObject(init);

            expect(result.requiredFeatures).toContain("hit-test");
        });

        it("adds native feature names to optionalFeatures when not required", async () => {
            const name = uniqueFeatureName() as any;
            const mockFeature = createMockFeature({ xrNativeFeatureName: "hand-tracking" });
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(mockFeature), 1, true);
            featuresManager.enableFeature(name, 1, undefined, false, false);

            const init: XRSessionInit = {};
            const result = await featuresManager._extendXRSessionInitObject(init);

            expect(result.optionalFeatures).toContain("hand-tracking");
        });

        it("does not duplicate native feature names", async () => {
            const name = uniqueFeatureName() as any;
            const mockFeature = createMockFeature({ xrNativeFeatureName: "anchors" });
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(mockFeature), 1, true);
            featuresManager.enableFeature(name, 1, undefined, false, true);

            const init: XRSessionInit = { requiredFeatures: ["anchors"] };
            const result = await featuresManager._extendXRSessionInitObject(init);

            const count = result.requiredFeatures!.filter((f) => f === "anchors").length;
            expect(count).toBe(1);
        });

        it("calls getXRSessionInitExtension when available", async () => {
            const name = uniqueFeatureName() as any;
            const mockFeature = createMockFeature({
                getXRSessionInitExtension: vi.fn(async () => ({ optionalFeatures: ["extra-feature"] })),
            });
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(mockFeature), 1, true);
            featuresManager.enableFeature(name, 1, undefined, false, false);

            const init: XRSessionInit = {};
            const result = await featuresManager._extendXRSessionInitObject(init);

            expect(result.optionalFeatures).toContain("extra-feature");
        });

        it("returns unchanged init when no features have native names", async () => {
            const name = uniqueFeatureName() as any;
            const mockFeature = createMockFeature();
            WebXRFeaturesManager.AddWebXRFeature(name, createMockFeatureConstructor(mockFeature), 1, true);
            featuresManager.enableFeature(name, 1, undefined, false);

            const init: XRSessionInit = {};
            const result = await featuresManager._extendXRSessionInitObject(init);

            expect(result.requiredFeatures).toBeUndefined();
            expect(result.optionalFeatures).toBeUndefined();
        });
    });

    describe("WebXRFeatureName constants", () => {
        it("has expected feature name constants", () => {
            expect(WebXRFeatureName.ANCHOR_SYSTEM).toBe("xr-anchor-system");
            expect(WebXRFeatureName.BACKGROUND_REMOVER).toBe("xr-background-remover");
            expect(WebXRFeatureName.HIT_TEST).toBe("xr-hit-test");
            expect(WebXRFeatureName.MESH_DETECTION).toBe("xr-mesh-detection");
            expect(WebXRFeatureName.PLANE_DETECTION).toBe("xr-plane-detection");
            expect(WebXRFeatureName.POINTER_SELECTION).toBe("xr-controller-pointer-selection");
            expect(WebXRFeatureName.TELEPORTATION).toBe("xr-controller-teleportation");
            expect(WebXRFeatureName.HAND_TRACKING).toBe("xr-hand-tracking");
            expect(WebXRFeatureName.EYE_TRACKING).toBe("xr-eye-tracking");
            expect(WebXRFeatureName.NEAR_INTERACTION).toBe("xr-near-interaction");
            expect(WebXRFeatureName.DOM_OVERLAY).toBe("xr-dom-overlay");
            expect(WebXRFeatureName.LAYERS).toBe("xr-layers");
            expect(WebXRFeatureName.DEPTH_SENSING).toBe("xr-depth-sensing");
            expect(WebXRFeatureName.MOVEMENT).toBe("xr-controller-movement");
            expect(WebXRFeatureName.LIGHT_ESTIMATION).toBe("xr-light-estimation");
            expect(WebXRFeatureName.IMAGE_TRACKING).toBe("xr-image-tracking");
            expect(WebXRFeatureName.FEATURE_POINTS).toBe("xr-feature-points");
            expect(WebXRFeatureName.PHYSICS_CONTROLLERS).toBe("xr-physics-controller");
            expect(WebXRFeatureName.SPACE_WARP).toBe("xr-space-warp");
            expect(WebXRFeatureName.RAW_CAMERA_ACCESS).toBe("xr-raw-camera-access");
            expect(WebXRFeatureName.WALKING_LOCOMOTION).toBe("xr-walking-locomotion");
        });
    });
});
