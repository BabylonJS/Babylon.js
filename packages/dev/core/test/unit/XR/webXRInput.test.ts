/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { WebXRSessionManager } from "core/XR/webXRSessionManager";
import { WebXRCamera } from "core/XR/webXRCamera";
import { WebXRInput } from "core/XR/webXRInput";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";

/**
 * Creates a minimal mock XRInputSource.
 */
function createMockInputSource(overrides: Partial<XRInputSource> = {}): XRInputSource {
    return {
        handedness: "right",
        targetRayMode: "tracked-pointer",
        targetRaySpace: {} as XRSpace,
        gripSpace: {} as XRSpace,
        profiles: ["generic-trigger"],
        gamepad: null as any,
        ...overrides,
    } as XRInputSource;
}

describe("WebXRInput", () => {
    let engine: NullEngine;
    let scene: Scene;
    let sessionManager: WebXRSessionManager;
    let xrCamera: WebXRCamera;
    let xrInput: WebXRInput;

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
        xrCamera = new WebXRCamera("testXRCamera", scene, sessionManager);
        xrInput = new WebXRInput(sessionManager, xrCamera, {
            doNotLoadControllerMeshes: true,
            disableOnlineControllerRepository: true,
        });
    });

    afterEach(() => {
        xrInput.dispose();
        scene.dispose();
        engine.dispose();
    });

    describe("construction", () => {
        it("starts with empty controllers array", () => {
            expect(xrInput.controllers).toEqual([]);
        });

        it("stores the session manager", () => {
            expect(xrInput.xrSessionManager).toBe(sessionManager);
        });

        it("stores the xr camera", () => {
            expect(xrInput.xrCamera).toBe(xrCamera);
        });

        it("has onControllerAddedObservable", () => {
            expect(xrInput.onControllerAddedObservable).toBeDefined();
        });

        it("has onControllerRemovedObservable", () => {
            expect(xrInput.onControllerRemovedObservable).toBeDefined();
        });
    });

    describe("controller management via session events", () => {
        it("adds a controller when inputsourceschange fires with added sources", () => {
            const addedCallback = vi.fn();
            xrInput.onControllerAddedObservable.add(addedCallback);

            const mockInputSource = createMockInputSource();

            // Simulate session init so the event listener is registered
            const mockSession = {
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            } as any;

            sessionManager.onXRSessionInit.notifyObservers(mockSession);

            // Get the inputsourceschange handler
            const addEventListenerCall = mockSession.addEventListener.mock.calls.find((call: any[]) => call[0] === "inputsourceschange");
            expect(addEventListenerCall).toBeDefined();
            const handler = addEventListenerCall[1];

            // Simulate adding a controller
            handler({ added: [mockInputSource], removed: [] });

            expect(xrInput.controllers.length).toBe(1);
            expect(addedCallback).toHaveBeenCalledTimes(1);
        });

        it("removes a controller when inputsourceschange fires with removed sources", () => {
            const removedCallback = vi.fn();
            xrInput.onControllerRemovedObservable.add(removedCallback);

            const mockInputSource = createMockInputSource();

            const mockSession = {
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            } as any;

            sessionManager.onXRSessionInit.notifyObservers(mockSession);

            const addEventListenerCall = mockSession.addEventListener.mock.calls.find((call: any[]) => call[0] === "inputsourceschange");
            const handler = addEventListenerCall[1];

            // Add then remove
            handler({ added: [mockInputSource], removed: [] });
            expect(xrInput.controllers.length).toBe(1);

            handler({ added: [], removed: [mockInputSource] });
            expect(xrInput.controllers.length).toBe(0);
            expect(removedCallback).toHaveBeenCalledTimes(1);
        });

        it("does not add duplicate input sources", () => {
            const mockInputSource = createMockInputSource();

            const mockSession = {
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            } as any;

            sessionManager.onXRSessionInit.notifyObservers(mockSession);
            const handler = mockSession.addEventListener.mock.calls.find((call: any[]) => call[0] === "inputsourceschange")[1];

            // Add same source twice
            handler({ added: [mockInputSource], removed: [] });
            handler({ added: [mockInputSource], removed: [] });

            expect(xrInput.controllers.length).toBe(1);
        });

        it("can handle multiple controllers simultaneously", () => {
            const leftSource = createMockInputSource({ handedness: "left" });
            const rightSource = createMockInputSource({ handedness: "right" });

            const mockSession = {
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            } as any;

            sessionManager.onXRSessionInit.notifyObservers(mockSession);
            const handler = mockSession.addEventListener.mock.calls.find((call: any[]) => call[0] === "inputsourceschange")[1];

            handler({ added: [leftSource, rightSource], removed: [] });

            expect(xrInput.controllers.length).toBe(2);
        });
    });

    describe("session lifecycle", () => {
        it("clears controllers when session ends", () => {
            const mockInputSource = createMockInputSource();
            const removedCallback = vi.fn();
            xrInput.onControllerRemovedObservable.add(removedCallback);

            const mockSession = {
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            } as any;

            sessionManager.onXRSessionInit.notifyObservers(mockSession);
            const handler = mockSession.addEventListener.mock.calls.find((call: any[]) => call[0] === "inputsourceschange")[1];

            handler({ added: [mockInputSource], removed: [] });
            expect(xrInput.controllers.length).toBe(1);

            // Simulate session end
            sessionManager.onXRSessionEnded.notifyObservers(null);

            expect(xrInput.controllers.length).toBe(0);
            expect(removedCallback).toHaveBeenCalledTimes(1);
        });
    });

    describe("dispose", () => {
        it("clears all controllers", () => {
            const mockInputSource = createMockInputSource();

            const mockSession = {
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            } as any;

            sessionManager.onXRSessionInit.notifyObservers(mockSession);
            const handler = mockSession.addEventListener.mock.calls.find((call: any[]) => call[0] === "inputsourceschange")[1];

            handler({ added: [mockInputSource], removed: [] });

            xrInput.dispose();

            expect(xrInput.onControllerAddedObservable.hasObservers()).toBe(false);
            expect(xrInput.onControllerRemovedObservable.hasObservers()).toBe(false);
        });

        it("clears observables", () => {
            xrInput.onControllerAddedObservable.add(vi.fn());
            xrInput.onControllerRemovedObservable.add(vi.fn());

            xrInput.dispose();

            expect(xrInput.onControllerAddedObservable.hasObservers()).toBe(false);
            expect(xrInput.onControllerRemovedObservable.hasObservers()).toBe(false);
        });
    });
});
