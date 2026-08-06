/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { WebXRLayers } from "core/XR/features/WebXRLayers";
import { WebXRSessionManager } from "core/XR/webXRSessionManager";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface ProjectionLayerBindingConstructor {
    prototype: {
        createProjectionLayer?: () => void;
    };
}

type TestGlobals = typeof globalThis & {
    XRGPUBinding?: ProjectionLayerBindingConstructor;
    XRWebGLBinding?: ProjectionLayerBindingConstructor;
};

describe("WebXRLayers", () => {
    let engine: NullEngine;
    let scene: Scene;
    let sessionManager: WebXRSessionManager;
    const testGlobals = globalThis as TestGlobals;
    let originalGPUBinding: ProjectionLayerBindingConstructor | undefined;
    let originalWebGLBinding: ProjectionLayerBindingConstructor | undefined;

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
        originalGPUBinding = testGlobals.XRGPUBinding;
        originalWebGLBinding = testGlobals.XRWebGLBinding;
    });

    afterEach(() => {
        if (originalGPUBinding) {
            testGlobals.XRGPUBinding = originalGPUBinding;
        } else {
            delete testGlobals.XRGPUBinding;
        }
        if (originalWebGLBinding) {
            testGlobals.XRWebGLBinding = originalWebGLBinding;
        } else {
            delete testGlobals.XRWebGLBinding;
        }
        vi.restoreAllMocks();
        scene.dispose();
        engine.dispose();
    });

    function setEnvironment(isNative: boolean, isWebGPU: boolean): void {
        vi.spyOn(sessionManager, "isNative", "get").mockReturnValue(isNative);
        vi.spyOn(engine, "isWebGPU", "get").mockReturnValue(isWebGPU);
    }

    function installGPUBinding(): void {
        const binding = vi.fn() as unknown as ProjectionLayerBindingConstructor;
        binding.prototype.createProjectionLayer = vi.fn();
        testGlobals.XRGPUBinding = binding;
    }

    function installWebGLBinding(): void {
        const binding = vi.fn() as unknown as ProjectionLayerBindingConstructor;
        binding.prototype.createProjectionLayer = vi.fn();
        testGlobals.XRWebGLBinding = binding;
    }

    describe("isCompatible", () => {
        it("accepts native WebGPU when XRGPUBinding exposes projection layers", () => {
            setEnvironment(true, true);
            installGPUBinding();

            expect(new WebXRLayers(sessionManager).isCompatible()).toBe(true);
        });

        it("rejects native WebGPU when XRGPUBinding is absent", () => {
            setEnvironment(true, true);
            delete testGlobals.XRGPUBinding;

            expect(new WebXRLayers(sessionManager).isCompatible()).toBe(false);
        });

        it("keeps native WebGL on the legacy render-target path", () => {
            setEnvironment(true, false);
            installWebGLBinding();

            expect(new WebXRLayers(sessionManager).isCompatible()).toBe(false);
        });

        it("accepts browser WebGPU when XRGPUBinding exposes projection layers", () => {
            setEnvironment(false, true);
            installGPUBinding();

            expect(new WebXRLayers(sessionManager).isCompatible()).toBe(true);
        });

        it("accepts browser WebGL when XRWebGLBinding exposes projection layers", () => {
            setEnvironment(false, false);
            installWebGLBinding();

            expect(new WebXRLayers(sessionManager).isCompatible()).toBe(true);
        });
    });
});
