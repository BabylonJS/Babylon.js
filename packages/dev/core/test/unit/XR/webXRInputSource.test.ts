/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { WebXRInputSource } from "core/XR/webXRInputSource";
import { Quaternion } from "core/Maths/math.vector";
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
        scene.dispose();
        engine.dispose();
    });

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
