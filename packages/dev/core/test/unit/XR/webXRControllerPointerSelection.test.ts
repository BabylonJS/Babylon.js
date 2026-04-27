/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { WebXRControllerPointerSelection, WebXRSessionManager, type IWebXRControllerPointerSelectionOptions } from "core/XR";

// jsdom does not provide PointerEvent; polyfill it for simulatePointerUp
if (typeof PointerEvent === "undefined") {
    (globalThis as any).PointerEvent = class PointerEvent extends MouseEvent {
        readonly pointerId: number;
        readonly pointerType: string;
        constructor(type: string, params: PointerEventInit = {}) {
            super(type, params);
            this.pointerId = params.pointerId ?? 0;
            this.pointerType = params.pointerType ?? "";
        }
    };
}

/**
 * Creates a minimal mock WebXRInput with an empty controllers array.
 */
function createMockXRInput() {
    return {
        controllers: [],
        xrCamera: {},
        onControllerAddedObservable: { add: vi.fn(), removeCallback: vi.fn() },
        onControllerRemovedObservable: { add: vi.fn(), removeCallback: vi.fn() },
    } as any;
}

/**
 * Creates a minimal mock controller data entry for use with _controllers map directly.
 */
function createMockController(uniqueId: string, handedness: XRHandedness) {
    return {
        uniqueId,
        inputSource: { handedness, targetRayMode: "tracked-pointer" as XRTargetRayMode },
        pointer: { position: { x: 0, y: 0, z: 0 } },
        grip: null,
    } as any;
}

describe("WebXRControllerPointerSelection", () => {
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

    function createFeature(overrides?: Partial<IWebXRControllerPointerSelectionOptions>): WebXRControllerPointerSelection {
        const options: IWebXRControllerPointerSelectionOptions = {
            xrInput: createMockXRInput(),
            disablePointerUpOnTouchOut: false,
            forceGazeMode: false,
            disableScenePointerVectorUpdate: true,
            ...overrides,
        };
        return new WebXRControllerPointerSelection(sessionManager, options);
    }

    /**
     * Injects mock controllers directly into the feature's internal _controllers map
     * and sets the _attachedController. This avoids needing a full XR session.
     */
    function injectControllers(feature: WebXRControllerPointerSelection, controllers: Array<{ uniqueId: string; handedness: XRHandedness }>, attachedId: string) {
        const controllersMap = (feature as any)._controllers;
        for (const c of controllers) {
            controllersMap[c.uniqueId] = {
                xrController: createMockController(c.uniqueId, c.handedness),
                laserPointer: { isVisible: false, material: { alpha: 0 }, dispose: vi.fn() },
                selectionMesh: { isVisible: false, material: {}, dispose: vi.fn() },
                meshUnderPointer: null,
                pick: null,
                tmpRay: {},
                disabledByNearInteraction: false,
                id: 200 + controllers.indexOf(c),
                pointerDownTriggered: false,
                finalPointerUpTriggered: false,
            };
        }
        (feature as any)._attachedController = attachedId;
    }

    describe("setAttachedController", () => {
        it("switches active controller by handedness", () => {
            const feature = createFeature();
            injectControllers(
                feature,
                [
                    { uniqueId: "ctrl-left", handedness: "left" },
                    { uniqueId: "ctrl-right", handedness: "right" },
                ],
                "ctrl-left"
            );

            expect(feature.attachedControllerId).toBe("ctrl-left");

            const result = feature.setAttachedController("right");

            expect(result).toBe(true);
            expect(feature.attachedControllerId).toBe("ctrl-right");
        });

        it("switches active controller by unique id", () => {
            const feature = createFeature();
            injectControllers(
                feature,
                [
                    { uniqueId: "ctrl-left", handedness: "left" },
                    { uniqueId: "ctrl-right", handedness: "right" },
                ],
                "ctrl-left"
            );

            const result = feature.setAttachedController("ctrl-right");

            expect(result).toBe(true);
            expect(feature.attachedControllerId).toBe("ctrl-right");
        });

        it("returns false when the target controller is already attached", () => {
            const feature = createFeature();
            injectControllers(feature, [{ uniqueId: "ctrl-left", handedness: "left" }], "ctrl-left");

            const result = feature.setAttachedController("left");

            expect(result).toBe(false);
            expect(feature.attachedControllerId).toBe("ctrl-left");
        });

        it("returns false when no controller matches the handedness", () => {
            const feature = createFeature();
            injectControllers(feature, [{ uniqueId: "ctrl-left", handedness: "left" }], "ctrl-left");

            const result = feature.setAttachedController("right");

            expect(result).toBe(false);
            expect(feature.attachedControllerId).toBe("ctrl-left");
        });

        it("returns false when no controller matches the unique id", () => {
            const feature = createFeature();
            injectControllers(feature, [{ uniqueId: "ctrl-left", handedness: "left" }], "ctrl-left");

            const result = feature.setAttachedController("nonexistent-id");

            expect(result).toBe(false);
        });

        it("is a no-op when enablePointerSelectionOnAllControllers is true", () => {
            const feature = createFeature({ enablePointerSelectionOnAllControllers: true });
            injectControllers(
                feature,
                [
                    { uniqueId: "ctrl-left", handedness: "left" },
                    { uniqueId: "ctrl-right", handedness: "right" },
                ],
                "ctrl-left"
            );

            const result = feature.setAttachedController("right");

            expect(result).toBe(false);
            expect(feature.attachedControllerId).toBe("ctrl-left");
        });

        it("updates preferredHandedness when switching by handedness", () => {
            const feature = createFeature({ preferredHandedness: "left" });
            injectControllers(
                feature,
                [
                    { uniqueId: "ctrl-left", handedness: "left" },
                    { uniqueId: "ctrl-right", handedness: "right" },
                ],
                "ctrl-left"
            );

            feature.setAttachedController("right");

            expect((feature as any)._options.preferredHandedness).toBe("right");
        });

        it("updates preferredHandedness when switching by unique id", () => {
            const feature = createFeature({ preferredHandedness: "left" });
            injectControllers(
                feature,
                [
                    { uniqueId: "ctrl-left", handedness: "left" },
                    { uniqueId: "ctrl-right", handedness: "right" },
                ],
                "ctrl-left"
            );

            feature.setAttachedController("ctrl-right");

            expect((feature as any)._options.preferredHandedness).toBe("right");
        });

        it("simulates pointer up on previous controller if pointer was down", () => {
            const feature = createFeature();
            injectControllers(
                feature,
                [
                    { uniqueId: "ctrl-left", handedness: "left" },
                    { uniqueId: "ctrl-right", handedness: "right" },
                ],
                "ctrl-left"
            );

            // Simulate that the left controller has a pointer down in progress
            const leftData = (feature as any)._controllers["ctrl-left"];
            leftData.pointerDownTriggered = true;
            leftData.finalPointerUpTriggered = false;

            const simulatePointerUpSpy = vi.spyOn(scene, "simulatePointerUp");
            const isPointerCapturedSpy = vi.spyOn(scene, "isPointerCaptured").mockReturnValue(true);

            feature.setAttachedController("right");

            expect(simulatePointerUpSpy).toHaveBeenCalledTimes(1);
            expect(leftData.pointerDownTriggered).toBe(false);
            expect(leftData.finalPointerUpTriggered).toBe(true);

            simulatePointerUpSpy.mockRestore();
            isPointerCapturedSpy.mockRestore();
        });

        it("does not simulate pointer up if no pointer was down on previous controller", () => {
            const feature = createFeature();
            injectControllers(
                feature,
                [
                    { uniqueId: "ctrl-left", handedness: "left" },
                    { uniqueId: "ctrl-right", handedness: "right" },
                ],
                "ctrl-left"
            );

            const simulatePointerUpSpy = vi.spyOn(scene, "simulatePointerUp");

            feature.setAttachedController("right");

            expect(simulatePointerUpSpy).not.toHaveBeenCalled();

            simulatePointerUpSpy.mockRestore();
        });
    });

    describe("attachedControllerId", () => {
        it("returns empty string when no controller is attached", () => {
            const feature = createFeature();
            // No controllers injected, _attachedController is undefined by default
            // but the getter returns empty string per the public contract
            expect(feature.attachedControllerId).toBe("");
        });

        it("returns the unique id of the attached controller", () => {
            const feature = createFeature();
            injectControllers(feature, [{ uniqueId: "ctrl-left", handedness: "left" }], "ctrl-left");

            expect(feature.attachedControllerId).toBe("ctrl-left");
        });
    });
});
