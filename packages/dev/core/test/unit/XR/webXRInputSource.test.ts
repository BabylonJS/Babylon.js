/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { WebXRInputSource } from "core/XR/webXRInputSource";
import { Quaternion } from "core/Maths/math.vector";
import { WebXRGenericTriggerMotionController } from "core/XR/motionController/webXRGenericMotionController";
import { WebXRMotionControllerManager } from "core/XR/motionController/webXRMotionControllerManager";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";

/**
 * Creates a mock XRInputSource for testing.
 */
function createMockInputSource(overrides: Partial<XRInputSource> = {}): XRInputSource {
    return {
        handedness: "right",
        targetRayMode: "tracked-pointer",
        targetRaySpace: {} as XRSpace,
        gripSpace: {} as XRSpace,
        profiles: ["generic-trigger"],
        gamepad: null,
        ...overrides,
    } as XRInputSource;
}

function createMockGamepad(): Gamepad {
    return {
        axes: [],
        buttons: [{ value: 0, touched: false, pressed: false }],
        connected: true,
        id: "test-gamepad",
        index: 0,
        mapping: "xr-standard",
        timestamp: 0,
        vibrationActuator: null,
    };
}

describe("WebXRInputSource", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        scene.dispose();
        engine.dispose();
    });

    async function createTrackedInputSource(skipRendering: boolean | undefined, doNotLoadControllerMesh = false) {
        const gamepad = createMockGamepad();
        const motionController = new WebXRGenericTriggerMotionController(scene, gamepad, "right");
        const loadModel = vi.spyOn(motionController, "loadModel").mockResolvedValue(true);
        vi.spyOn(WebXRMotionControllerManager, "GetMotionControllerWithXRInput").mockResolvedValue(motionController);

        const source = new WebXRInputSource(
            scene,
            createMockInputSource({
                gamepad,
                skipRendering,
            }),
            { doNotLoadControllerMesh }
        );
        const motionControllerInitialized = vi.fn();
        source.onMotionControllerInitObservable.add(motionControllerInitialized);
        await vi.waitFor(() => expect(source.motionController).toBe(motionController));

        return { source, motionController, loadModel, motionControllerInitialized };
    }

    describe("construction", () => {
        it("creates with a unique id", () => {
            const source1 = new WebXRInputSource(scene, createMockInputSource(), { doNotLoadControllerMesh: true });
            const source2 = new WebXRInputSource(scene, createMockInputSource({ handedness: "left" }), { doNotLoadControllerMesh: true });

            expect(source1.uniqueId).toBeDefined();
            expect(source2.uniqueId).toBeDefined();
            expect(source1.uniqueId).not.toBe(source2.uniqueId);

            source1.dispose();
            source2.dispose();
        });

        it("creates a pointer mesh", () => {
            const source = new WebXRInputSource(scene, createMockInputSource(), { doNotLoadControllerMesh: true });

            expect(source.pointer).toBeDefined();
            expect(source.pointer.rotationQuaternion).toBeInstanceOf(Quaternion);

            source.dispose();
        });

        it("creates a grip mesh when gripSpace is available", () => {
            const inputSource = createMockInputSource({ gripSpace: {} as XRSpace });
            const source = new WebXRInputSource(scene, inputSource, { doNotLoadControllerMesh: true });

            expect(source.grip).toBeDefined();
            expect(source.grip!.rotationQuaternion).toBeInstanceOf(Quaternion);

            source.dispose();
        });

        it("does not create grip mesh when gripSpace is undefined", () => {
            const inputSource = createMockInputSource({ gripSpace: undefined });
            const source = new WebXRInputSource(scene, inputSource, { doNotLoadControllerMesh: true });

            expect(source.grip).toBeUndefined();

            source.dispose();
        });

        it("stores the input source reference", () => {
            const inputSource = createMockInputSource();
            const source = new WebXRInputSource(scene, inputSource, { doNotLoadControllerMesh: true });

            expect(source.inputSource).toBe(inputSource);

            source.dispose();
        });

        it("unique id includes handedness and target ray mode", () => {
            const inputSource = createMockInputSource({ handedness: "left", targetRayMode: "tracked-pointer" });
            const source = new WebXRInputSource(scene, inputSource, { doNotLoadControllerMesh: true });

            expect(source.uniqueId).toContain("tracked-pointer");
            expect(source.uniqueId).toContain("left");

            source.dispose();
        });
    });

    describe("observables", () => {
        it("has onDisposeObservable", () => {
            const source = new WebXRInputSource(scene, createMockInputSource(), { doNotLoadControllerMesh: true });
            expect(source.onDisposeObservable).toBeDefined();
            source.dispose();
        });

        it("has onMeshLoadedObservable", () => {
            const source = new WebXRInputSource(scene, createMockInputSource(), { doNotLoadControllerMesh: true });
            expect(source.onMeshLoadedObservable).toBeDefined();
            source.dispose();
        });

        it("has onMotionControllerInitObservable", () => {
            const source = new WebXRInputSource(scene, createMockInputSource(), { doNotLoadControllerMesh: true });
            expect(source.onMotionControllerInitObservable).toBeDefined();
            source.dispose();
        });
    });

    describe("skipRendering", () => {
        it("keeps the motion controller lifecycle active without loading its default model", async () => {
            const { source, motionController, loadModel, motionControllerInitialized } = await createTrackedInputSource(true);
            const disposeCallback = vi.fn();
            const disposeMotionController = vi.spyOn(motionController, "dispose");
            source.onDisposeObservable.add(disposeCallback);

            expect(source.pointer).toBeDefined();
            expect(source.grip).toBeDefined();
            expect(source.motionController).toBe(motionController);
            expect(motionControllerInitialized).toHaveBeenCalledOnce();
            expect(motionControllerInitialized.mock.calls[0][0]).toBe(motionController);
            expect(loadModel).not.toHaveBeenCalled();
            expect(motionController.rootMesh).toBeFalsy();

            source.dispose();

            expect(disposeMotionController).toHaveBeenCalledOnce();
            expect(disposeCallback).toHaveBeenCalledOnce();
            expect(disposeCallback.mock.calls[0][0]).toBe(source);
        });

        it.each([undefined, false])("loads the default model when skipRendering is %s", async (skipRendering) => {
            const { source, loadModel } = await createTrackedInputSource(skipRendering);

            expect(loadModel).toHaveBeenCalledOnce();

            source.dispose();
        });

        it("preserves explicit controller mesh suppression", async () => {
            const { source, loadModel } = await createTrackedInputSource(false, true);

            expect(loadModel).not.toHaveBeenCalled();

            source.dispose();
        });

        it.each(["gaze", "screen"] as const)("does not change %s input source handling", async (targetRayMode) => {
            const getMotionController = vi.spyOn(WebXRMotionControllerManager, "GetMotionControllerWithXRInput");
            const source = new WebXRInputSource(
                scene,
                createMockInputSource({
                    gamepad: createMockGamepad(),
                    skipRendering: true,
                    targetRayMode,
                })
            );
            await Promise.resolve();

            expect(source.pointer).toBeDefined();
            expect(source.motionController).toBeUndefined();
            expect(getMotionController).not.toHaveBeenCalled();

            source.dispose();
        });
    });

    describe("dispose", () => {
        it("notifies onDisposeObservable", () => {
            const source = new WebXRInputSource(scene, createMockInputSource(), { doNotLoadControllerMesh: true });
            const callback = vi.fn();
            source.onDisposeObservable.add(callback);

            source.dispose();

            expect(callback).toHaveBeenCalledTimes(1);
        });

        it("clears observables after dispose", () => {
            const source = new WebXRInputSource(scene, createMockInputSource(), { doNotLoadControllerMesh: true });
            source.onMotionControllerInitObservable.add(vi.fn());
            source.onMeshLoadedObservable.add(vi.fn());

            source.dispose();

            expect(source.onMotionControllerInitObservable.hasObservers()).toBe(false);
            expect(source.onMeshLoadedObservable.hasObservers()).toBe(false);
            expect(source.onDisposeObservable.hasObservers()).toBe(false);
        });

        it("disposes pointer mesh", () => {
            const source = new WebXRInputSource(scene, createMockInputSource(), { doNotLoadControllerMesh: true });
            const pointer = source.pointer;
            const disposeSpy = vi.spyOn(pointer, "dispose");

            source.dispose();

            expect(disposeSpy).toHaveBeenCalled();
        });

        it("disposes grip mesh when present", () => {
            const source = new WebXRInputSource(scene, createMockInputSource({ gripSpace: {} as XRSpace }), { doNotLoadControllerMesh: true });
            const grip = source.grip!;
            const disposeSpy = vi.spyOn(grip, "dispose");

            source.dispose();

            expect(disposeSpy).toHaveBeenCalled();
        });
    });

    describe("getWorldPointerRayToRef", () => {
        it("sets ray length to 1000", () => {
            const source = new WebXRInputSource(scene, createMockInputSource(), { doNotLoadControllerMesh: true });

            // Position the pointer
            source.pointer.position.set(1, 2, 3);
            source.pointer.computeWorldMatrix(true);

            const ray = {
                origin: { x: 0, y: 0, z: 0, copyFrom: vi.fn() },
                direction: { x: 0, y: 0, z: 0, normalize: vi.fn() },
                length: 0,
            } as any;

            source.getWorldPointerRayToRef(ray);

            expect(ray.length).toBe(1000);
            expect(ray.origin.copyFrom).toHaveBeenCalled();
            expect(ray.direction.normalize).toHaveBeenCalled();

            source.dispose();
        });
    });
});
