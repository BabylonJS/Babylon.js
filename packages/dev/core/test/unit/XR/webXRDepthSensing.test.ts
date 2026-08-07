/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines/nullEngine";
import { type Camera } from "core/Cameras/camera";
import { type MaterialPluginBase } from "core/Materials/materialPluginBase";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { type UniformBuffer } from "core/Materials/uniformBuffer";
import { Matrix } from "core/Maths/math.vector";
import { Logger } from "core/Misc/logger";
import { Scene } from "core/scene";
import { WebXRDepthSensing } from "core/XR/features/WebXRDepthSensing";
import { WebXRFeaturesManager } from "core/XR/webXRFeaturesManager";
import { WebXRSessionManager } from "core/XR/webXRSessionManager";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const WebGPUGPUDepthWarning =
    "WebXR Depth Sensing is unavailable with WebGPU XR when the session negotiates gpu-optimized depth because XRGPUBinding has no environment-depth equivalent; request cpu-optimized depth to use the feature.";

describe("WebXRDepthSensing", () => {
    let engine: NullEngine;
    let scene: Scene;
    let sessionManager: WebXRSessionManager;
    let feature: WebXRDepthSensing | undefined;
    let originalWebGLBinding: unknown;
    let originalGPUBinding: unknown;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 4,
            renderWidth: 4,
            textureSize: 4,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
        sessionManager = new WebXRSessionManager(scene);
        (sessionManager as any)._xrNavigator = { xr: { native: false } };
        originalWebGLBinding = (globalThis as any).XRWebGLBinding;
        originalGPUBinding = (globalThis as any).XRGPUBinding;
    });

    afterEach(() => {
        feature?.dispose();
        vi.restoreAllMocks();
        (globalThis as any).XRWebGLBinding = originalWebGLBinding;
        (globalThis as any).XRGPUBinding = originalGPUBinding;
        scene.dispose();
        engine.dispose();
    });

    function createDepthInformation(values: Float32Array, rawValueToMeters: number, matrix: Float32Array): XRCPUDepthInformation {
        return {
            data: values.buffer,
            getDepthInMeters: vi.fn(),
            height: 2,
            normDepthBufferFromNormView: { matrix } as unknown as XRRigidTransform,
            rawValueToMeters,
            width: 2,
        } as unknown as XRCPUDepthInformation;
    }

    function createRigCameras() {
        const outputRenderTarget = {
            getRenderHeight: () => 4,
            getRenderWidth: () => 8,
        };
        const leftViewMatrix = Matrix.Translation(-0.03, 0, 0);
        const rightViewMatrix = Matrix.Translation(0.03, 0, 0);
        const rigParent = { rigCameras: [] as Camera[] };
        const leftCamera = {
            getViewMatrix: () => leftViewMatrix,
            outputRenderTarget,
            rigParent,
            rigCameras: [],
            viewport: { height: 1, width: 0.5, x: 0, y: 0 },
        } as unknown as Camera;
        const rightCamera = {
            getViewMatrix: () => rightViewMatrix,
            outputRenderTarget,
            rigParent,
            rigCameras: [],
            viewport: { height: 1, width: 0.5, x: 0.5, y: 0 },
        } as unknown as Camera;
        rigParent.rigCameras.push(leftCamera, rightCamera);
        return { leftCamera, leftViewMatrix, outputRenderTarget, rightCamera, rightViewMatrix, rigParent };
    }

    function createUniformBufferRecorder() {
        const matrices = new Map<string, number[]>();
        const textures = new Map<string, unknown>();
        const floats = new Map<string, number>();
        const uniformBuffer = {
            setTexture: vi.fn((name: string, texture: unknown) => textures.set(name, texture)),
            updateFloat: vi.fn((name: string, value: number) => floats.set(name, value)),
            updateFloat2: vi.fn(),
            updateFloat4: vi.fn(),
            updateMatrix: vi.fn((name: string, matrix: { asArray: () => number[] }) => matrices.set(name, Array.from(matrix.asArray()))),
        } as unknown as UniformBuffer;
        return { floats, matrices, textures, uniformBuffer };
    }

    it("updates CPU depth buffers, metadata, and the depth texture on WebGPU without a graphics binding", () => {
        const xrWebGLBinding = vi.fn();
        const xrGPUBinding = vi.fn();
        (globalThis as any).XRWebGLBinding = xrWebGLBinding;
        (globalThis as any).XRGPUBinding = xrGPUBinding;
        (engine as any)._isWebGPU = true;
        (engine as any)._device = {};
        (sessionManager as any).session = {
            depthDataFormat: "unsigned-short",
            depthUsage: "cpu-optimized",
            enabledFeatures: ["depth-sensing"],
        } as XRSession;
        sessionManager.referenceSpace = {} as XRReferenceSpace;

        const matrix = Float32Array.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
        const normDepthBufferFromNormView = { matrix } as unknown as XRRigidTransform;
        const depthValues = new Uint16Array([100, 200, 300, 400]);
        const getDepthInMeters = vi.fn(function (this: XRCPUDepthInformation, x: number, y: number) {
            return this.rawValueToMeters * depthValues[y * 2 + x];
        });
        const depthInformation = {
            data: depthValues.buffer,
            getDepthInMeters,
            height: 2,
            normDepthBufferFromNormView,
            rawValueToMeters: 0.001,
            width: 2,
        } as unknown as XRCPUDepthInformation;
        const view = {} as XRView;
        const updateRawTextureSpy = vi.spyOn(engine, "updateRawTexture");
        const markMaterialsDirtySpy = vi.spyOn(scene, "markAllMaterialsAsDirty");
        let depthReader: ((x: number, y: number) => number) | undefined;

        feature = new WebXRDepthSensing(sessionManager, {
            dataFormatPreference: ["ushort"],
            usagePreference: ["cpu"],
        });
        feature.onGetDepthInMetersAvailable.add((reader) => {
            depthReader = reader;
        });
        const { leftCamera } = createRigCameras();

        expect(feature.attach()).toBe(true);
        sessionManager.onXRFrameObservable.notifyObservers({
            getDepthInformation: vi.fn(() => depthInformation),
            getViewerPose: vi.fn(() => ({ views: [view] })),
        } as unknown as XRFrame);
        scene.onBeforeCameraRenderObservable.notifyObservers(leftCamera);

        expect(xrWebGLBinding).not.toHaveBeenCalled();
        expect(xrGPUBinding).not.toHaveBeenCalled();
        expect(feature.width).toBe(2);
        expect(feature.height).toBe(2);
        expect(feature.rawValueToMeters).toBe(0.001);
        expect(feature.normDepthBufferFromNormView).toBe(normDepthBufferFromNormView);
        expect(feature.latestDepthBuffer).toEqual(depthValues);
        expect(feature.latestDepthImageTexture?.getSize()).toEqual({ width: 2, height: 2 });
        expect(updateRawTextureSpy).toHaveBeenCalledTimes(1);
        expect(updateRawTextureSpy.mock.calls[0][1]).toEqual(Float32Array.from(depthValues));
        expect(markMaterialsDirtySpy).toHaveBeenCalledTimes(1);
        expect(depthReader?.(1, 1)).toBeCloseTo(0.4);
        expect(getDepthInMeters).toHaveBeenCalledExactlyOnceWith(1, 1);
    });

    it("binds distinct CPU depth buffers and transforms for each WebGPU XR view", () => {
        (engine as any)._isWebGPU = true;
        (engine as any)._device = {};
        (sessionManager as any).session = {
            depthDataFormat: "float32",
            depthUsage: "cpu-optimized",
            enabledFeatures: ["depth-sensing"],
        } as XRSession;
        sessionManager.referenceSpace = {} as XRReferenceSpace;
        const leftView = {} as XRView;
        const rightView = {} as XRView;
        const leftMatrix = Float32Array.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0.125, 0, 0, 1]);
        const rightMatrix = Float32Array.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0.625, 0, 0, 1]);
        const leftDepth = createDepthInformation(Float32Array.from([1, 1, 1, 1]), 1, leftMatrix);
        const rightDepth = createDepthInformation(Float32Array.from([3, 3, 3, 3]), 2, rightMatrix);
        const { leftCamera, outputRenderTarget, rightCamera, rightViewMatrix, rigParent } = createRigCameras();

        feature = new WebXRDepthSensing(sessionManager, {
            dataFormatPreference: ["float"],
            usagePreference: ["cpu"],
        });
        const material = new StandardMaterial("stereo-depth", scene);
        const plugin = material.pluginManager?.getPlugin("DepthSensing") as MaterialPluginBase;
        expect(feature.attach()).toBe(true);
        sessionManager.onXRFrameObservable.notifyObservers({
            getDepthInformation: vi.fn((view) => (view === leftView ? leftDepth : rightDepth)),
            getViewerPose: vi.fn(() => ({ views: [leftView, rightView] })),
        } as unknown as XRFrame);

        const leftBinding = createUniformBufferRecorder();
        scene.onBeforeCameraRenderObservable.notifyObservers(leftCamera);
        plugin.bindForSubMesh(leftBinding.uniformBuffer);
        const leftTexture = leftBinding.textures.get("ds_depthSampler");
        expect(leftTexture).toBeTruthy();
        expect(leftBinding.floats.get("ds_rawValueToMeters")).toBe(1);
        expect(leftBinding.matrices.get("ds_uvTransform")).toEqual(Array.from(leftMatrix));

        const rightBinding = createUniformBufferRecorder();
        scene.onBeforeCameraRenderObservable.notifyObservers(rightCamera);
        plugin.bindForSubMesh(rightBinding.uniformBuffer);
        const rightTexture = rightBinding.textures.get("ds_depthSampler");
        expect(rightTexture).toBeTruthy();
        expect(rightTexture).not.toBe(leftTexture);
        expect(rightBinding.floats.get("ds_rawValueToMeters")).toBe(2);
        expect(rightBinding.matrices.get("ds_uvTransform")).toEqual(Array.from(rightMatrix));

        const multiviewCamera = {
            _renderingMultiview: true,
            outputRenderTarget,
            rigCameras: rigParent.rigCameras,
        } as unknown as Camera;
        const multiviewBinding = createUniformBufferRecorder();
        scene.onBeforeCameraRenderObservable.notifyObservers(multiviewCamera);
        plugin.bindForSubMesh(multiviewBinding.uniformBuffer);
        expect(multiviewBinding.textures.get("ds_depthSampler")).toBe(leftTexture);
        expect(multiviewBinding.textures.get("ds_depthSamplerRight")).toBe(rightTexture);
        expect(multiviewBinding.floats.get("ds_rawValueToMetersRight")).toBe(2);
        expect(multiviewBinding.floats.get("ds_depthAvailableLeft")).toBe(1);
        expect(multiviewBinding.floats.get("ds_depthAvailableRight")).toBe(1);
        expect(multiviewBinding.floats.get("ds_viewDepthSign")).toBe(1);
        expect(multiviewBinding.matrices.get("ds_uvTransformRight")).toEqual(Array.from(rightMatrix));
        expect(multiviewBinding.matrices.get("ds_viewRight")).toEqual(Array.from(rightViewMatrix.asArray()));

        scene.useRightHandedSystem = true;
        const rightHandedBinding = createUniformBufferRecorder();
        plugin.bindForSubMesh(rightHandedBinding.uniformBuffer);
        expect(rightHandedBinding.floats.get("ds_viewDepthSign")).toBe(-1);
        scene.useRightHandedSystem = false;

        const markMaterialsDirtySpy = vi.spyOn(scene, "markAllMaterialsAsDirty");
        sessionManager.onXRFrameObservable.notifyObservers({
            getDepthInformation: vi.fn((view) => (view === leftView ? leftDepth : null)),
            getViewerPose: vi.fn(() => ({ views: [leftView, rightView] })),
        } as unknown as XRFrame);
        const partialMultiviewBinding = createUniformBufferRecorder();
        scene.onBeforeCameraRenderObservable.notifyObservers(multiviewCamera);
        plugin.bindForSubMesh(partialMultiviewBinding.uniformBuffer);
        const partialMultiviewDefines = {} as Record<string, boolean>;
        plugin.prepareDefines(partialMultiviewDefines);
        expect(partialMultiviewDefines.DEPTH_SENSING).toBe(true);
        expect(partialMultiviewBinding.textures.get("ds_depthSamplerRight")).toBe(leftTexture);
        expect(partialMultiviewBinding.floats.get("ds_depthAvailableLeft")).toBe(1);
        expect(partialMultiviewBinding.floats.get("ds_depthAvailableRight")).toBe(0);

        scene.onBeforeCameraRenderObservable.notifyObservers(rightCamera);
        const unavailableDefines = {} as Record<string, boolean>;
        plugin.prepareDefines(unavailableDefines);
        expect(unavailableDefines.DEPTH_SENSING).toBe(false);

        markMaterialsDirtySpy.mockClear();
        sessionManager.onXRFrameObservable.notifyObservers({
            getDepthInformation: vi.fn((view) => (view === rightView ? rightDepth : null)),
            getViewerPose: vi.fn(() => ({ views: [leftView, rightView] })),
        } as unknown as XRFrame);
        const rightOnlyMultiviewBinding = createUniformBufferRecorder();
        scene.onBeforeCameraRenderObservable.notifyObservers(multiviewCamera);
        plugin.bindForSubMesh(rightOnlyMultiviewBinding.uniformBuffer);
        expect(rightOnlyMultiviewBinding.textures.get("ds_depthSampler")).toBe(rightTexture);
        expect(rightOnlyMultiviewBinding.textures.get("ds_depthSamplerRight")).toBe(rightTexture);
        expect(rightOnlyMultiviewBinding.floats.get("ds_depthAvailableLeft")).toBe(0);
        expect(rightOnlyMultiviewBinding.floats.get("ds_depthAvailableRight")).toBe(1);
        expect(markMaterialsDirtySpy).toHaveBeenCalledTimes(1);

        markMaterialsDirtySpy.mockClear();
        sessionManager.onXRFrameObservable.notifyObservers({
            getDepthInformation: vi.fn((view) => (view === leftView ? leftDepth : rightDepth)),
            getViewerPose: vi.fn(() => ({ views: [leftView, rightView] })),
        } as unknown as XRFrame);
        scene.onBeforeCameraRenderObservable.notifyObservers(rightCamera);
        const restoredDefines = {} as Record<string, boolean>;
        plugin.prepareDefines(restoredDefines);
        expect(restoredDefines.DEPTH_SENSING).toBe(true);
        expect(markMaterialsDirtySpy).not.toHaveBeenCalled();

        material.dispose();
    });

    it("disables once for WebGPU GPU depth and can attach a later CPU-depth session", () => {
        const xrWebGLBinding = vi.fn();
        const xrGPUBinding = vi.fn();
        (globalThis as any).XRWebGLBinding = xrWebGLBinding;
        (globalThis as any).XRGPUBinding = xrGPUBinding;
        (engine as any)._isWebGPU = true;
        (engine as any)._device = {};
        (engine as any).wrapWebGLTexture = vi.fn();
        (sessionManager as any).session = {
            depthDataFormat: "float32",
            depthUsage: "gpu-optimized",
            enabledFeatures: ["depth-sensing"],
        } as XRSession;
        const featuresManager = new WebXRFeaturesManager(sessionManager);
        const warnSpy = vi.spyOn(Logger, "Warn").mockImplementation(() => {});

        feature = featuresManager.enableFeature(WebXRDepthSensing.Name, 1, {
            dataFormatPreference: ["float"],
            usagePreference: ["gpu", "cpu"],
        });

        expect(feature.attached).toBe(false);
        expect(feature.disableAutoAttach).toBe(true);
        expect(warnSpy).toHaveBeenCalledExactlyOnceWith(WebGPUGPUDepthWarning);
        expect(xrWebGLBinding).not.toHaveBeenCalled();
        expect(xrGPUBinding).not.toHaveBeenCalled();
        expect((engine as any).wrapWebGLTexture).not.toHaveBeenCalled();
        expect(sessionManager.onXRFrameObservable.hasObservers()).toBe(false);
        expect(scene.onBeforeCameraRenderObservable.hasObservers()).toBe(false);
        expect(feature.latestDepthBuffer).toBeNull();
        expect(feature.latestDepthImageTexture).toBeNull();

        sessionManager.onXRSessionInit.notifyObservers(sessionManager.session);
        sessionManager.onXRFrameObservable.notifyObservers({
            getDepthInformation: vi.fn(),
            getViewerPose: vi.fn(),
        } as unknown as XRFrame);
        expect(warnSpy).toHaveBeenCalledTimes(1);

        sessionManager.onXRSessionEnded.notifyObservers(null);
        expect(feature.disableAutoAttach).toBe(false);
        (sessionManager as any).session = {
            depthDataFormat: "float32",
            depthUsage: "cpu-optimized",
            enabledFeatures: ["depth-sensing"],
        } as XRSession;
        sessionManager.referenceSpace = {} as XRReferenceSpace;
        sessionManager.onXRSessionInit.notifyObservers(sessionManager.session);
        expect(feature.attached).toBe(true);
        expect(warnSpy).toHaveBeenCalledTimes(1);

        featuresManager.dispose();
        feature = undefined;
    });

    it("preserves manager-controlled caller auto-attach policy after WebGPU GPU-depth fallback", () => {
        (engine as any)._isWebGPU = true;
        (engine as any)._device = {};
        (sessionManager as any).session = {
            depthDataFormat: "float32",
            depthUsage: "gpu-optimized",
            enabledFeatures: ["depth-sensing"],
        } as XRSession;
        vi.spyOn(Logger, "Warn").mockImplementation(() => {});
        const featuresManager = new WebXRFeaturesManager(sessionManager);

        feature = featuresManager.enableFeature(
            WebXRDepthSensing.Name,
            1,
            {
                dataFormatPreference: ["float"],
                usagePreference: ["gpu", "cpu"],
            },
            false
        );

        expect(feature.disableAutoAttach).toBe(true);
        featuresManager.attachFeature(WebXRDepthSensing.Name);
        expect(feature.attached).toBe(false);
        expect(feature.disableAutoAttach).toBe(true);
        sessionManager.onXRSessionEnded.notifyObservers(null);
        expect(feature.disableAutoAttach).toBe(true);

        featuresManager.dispose();
        feature = undefined;
    });

    it("invalidates cached CPU depth when the current XR frame has no viewer pose", () => {
        (engine as any)._isWebGPU = true;
        (engine as any)._device = {};
        (sessionManager as any).session = {
            depthDataFormat: "float32",
            depthUsage: "cpu-optimized",
            enabledFeatures: ["depth-sensing"],
        } as XRSession;
        sessionManager.referenceSpace = {} as XRReferenceSpace;
        const view = {} as XRView;
        const matrix = Float32Array.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
        const depthInformation = createDepthInformation(Float32Array.from([1, 1, 1, 1]), 1, matrix);
        const { leftCamera } = createRigCameras();
        const markMaterialsDirtySpy = vi.spyOn(scene, "markAllMaterialsAsDirty");

        feature = new WebXRDepthSensing(sessionManager, {
            dataFormatPreference: ["float"],
            usagePreference: ["cpu"],
        });
        const material = new StandardMaterial("pose-null-depth", scene);
        const plugin = material.pluginManager?.getPlugin("DepthSensing") as MaterialPluginBase;
        expect(feature.attach()).toBe(true);
        sessionManager.onXRFrameObservable.notifyObservers({
            getDepthInformation: vi.fn(() => depthInformation),
            getViewerPose: vi.fn(() => ({ views: [view] })),
        } as unknown as XRFrame);
        scene.onBeforeCameraRenderObservable.notifyObservers(leftCamera);
        const availableDefines = {} as Record<string, boolean>;
        plugin.prepareDefines(availableDefines);
        expect(availableDefines.DEPTH_SENSING).toBe(true);

        sessionManager.onXRFrameObservable.notifyObservers({
            getDepthInformation: vi.fn(),
            getViewerPose: vi.fn(() => null),
        } as unknown as XRFrame);
        const unavailableDefines = {} as Record<string, boolean>;
        plugin.prepareDefines(unavailableDefines);
        expect(unavailableDefines.DEPTH_SENSING).toBe(false);
        expect(feature.latestDepthImageTexture).not.toBeNull();
        expect(markMaterialsDirtySpy).toHaveBeenCalledTimes(2);

        material.dispose();
    });

    it("recreates and restores the CPU depth texture after detach and reattach", () => {
        (engine as any)._isWebGPU = true;
        (engine as any)._device = {};
        (sessionManager as any).session = {
            depthDataFormat: "float32",
            depthUsage: "cpu-optimized",
            enabledFeatures: ["depth-sensing"],
        } as XRSession;
        sessionManager.referenceSpace = {} as XRReferenceSpace;
        const view = {} as XRView;
        const matrix = Float32Array.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
        const depthInformation = createDepthInformation(Float32Array.from([1, 1, 1, 1]), 1, matrix);
        const { leftCamera } = createRigCameras();
        const frame = {
            getDepthInformation: vi.fn(() => depthInformation),
            getViewerPose: vi.fn(() => ({ views: [view] })),
        } as unknown as XRFrame;
        const markMaterialsDirtySpy = vi.spyOn(scene, "markAllMaterialsAsDirty");

        feature = new WebXRDepthSensing(sessionManager, {
            dataFormatPreference: ["float"],
            usagePreference: ["cpu"],
        });
        const material = new StandardMaterial("reattach-depth", scene);
        const plugin = material.pluginManager?.getPlugin("DepthSensing") as MaterialPluginBase;
        expect(feature.attach()).toBe(true);
        sessionManager.onXRFrameObservable.notifyObservers(frame);
        const firstTexture = feature.latestDepthImageTexture;
        scene.onBeforeCameraRenderObservable.notifyObservers(leftCamera);
        const firstDefines = {} as Record<string, boolean>;
        plugin.prepareDefines(firstDefines);
        expect(firstDefines.DEPTH_SENSING).toBe(true);

        expect(feature.detach()).toBe(true);
        expect(feature.latestDepthImageTexture).toBeNull();
        const detachedDefines = {} as Record<string, boolean>;
        plugin.prepareDefines(detachedDefines);
        expect(detachedDefines.DEPTH_SENSING).toBe(false);

        expect(feature.attach()).toBe(true);
        sessionManager.onXRFrameObservable.notifyObservers(frame);
        scene.onBeforeCameraRenderObservable.notifyObservers(leftCamera);
        const reattachedDefines = {} as Record<string, boolean>;
        plugin.prepareDefines(reattachedDefines);
        expect(reattachedDefines.DEPTH_SENSING).toBe(true);
        expect(feature.latestDepthImageTexture).not.toBe(firstTexture);
        expect(markMaterialsDirtySpy).toHaveBeenCalledTimes(2);

        material.dispose();
    });

    it("reuses the cached WebGL binding for WebGL GPU depth", () => {
        const nativeBinding = { getDepthInformation: vi.fn(() => null) };
        const xrWebGLBinding = vi.fn().mockImplementation(function () {
            return nativeBinding;
        });
        const glContext = {} as WebGLRenderingContext;
        (globalThis as any).XRWebGLBinding = xrWebGLBinding;
        (engine as any)._gl = glContext;
        (sessionManager as any).session = {
            depthDataFormat: "float32",
            depthUsage: "gpu-optimized",
            enabledFeatures: ["depth-sensing"],
        } as XRSession;

        feature = new WebXRDepthSensing(sessionManager, {
            dataFormatPreference: ["float"],
            usagePreference: ["gpu"],
        });

        expect(feature.attach()).toBe(true);
        expect(xrWebGLBinding).toHaveBeenCalledExactlyOnceWith(sessionManager.session, glContext);
        expect(sessionManager._getGraphicsBinding().binding).toBe(nativeBinding);
        expect(xrWebGLBinding).toHaveBeenCalledTimes(1);
    });

    it("releases WebGL GPU depth wrappers without deleting runtime-owned textures across reattach", () => {
        let runtimeTexture = {} as WebGLTexture;
        const matrix = Float32Array.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
        const getDepthInformation = vi.fn(
            () =>
                ({
                    height: 2,
                    normDepthBufferFromNormView: { matrix },
                    rawValueToMeters: 1,
                    texture: runtimeTexture,
                    textureType: "texture",
                    width: 2,
                }) as unknown as XRWebGLDepthInformation
        );
        const nativeBinding = { getDepthInformation };
        (globalThis as any).XRWebGLBinding = vi.fn().mockImplementation(function () {
            return nativeBinding;
        });
        const deleteTexture = vi.fn();
        (engine as any)._gl = { deleteTexture } as unknown as WebGLRenderingContext;
        vi.spyOn(engine, "_releaseTexture").mockImplementation((texture) => {
            texture._hardwareTexture?.release();
        });
        (sessionManager as any).session = {
            depthDataFormat: "float32",
            depthUsage: "gpu-optimized",
            enabledFeatures: ["depth-sensing"],
        } as XRSession;
        sessionManager.referenceSpace = {} as XRReferenceSpace;
        const view = {} as XRView;
        const frame = {
            getViewerPose: vi.fn(() => ({ views: [view] })),
        } as unknown as XRFrame;
        vi.spyOn(Logger, "Warn").mockImplementation(() => {});

        feature = new WebXRDepthSensing(sessionManager, {
            dataFormatPreference: ["float"],
            usagePreference: ["gpu"],
        });
        expect(feature.attach()).toBe(true);
        sessionManager.onXRFrameObservable.notifyObservers(frame);
        const firstWrapper = feature.latestDepthImageTexture;
        expect(firstWrapper).not.toBeNull();
        expect(deleteTexture.mock.calls.some(([texture]) => texture === runtimeTexture)).toBe(false);
        deleteTexture.mockClear();
        expect(feature.detach()).toBe(true);
        expect(deleteTexture.mock.calls.some(([texture]) => texture === runtimeTexture)).toBe(false);

        runtimeTexture = {} as WebGLTexture;
        expect(feature.attach()).toBe(true);
        sessionManager.onXRFrameObservable.notifyObservers(frame);
        expect(feature.latestDepthImageTexture).not.toBe(firstWrapper);
        expect(feature.detach()).toBe(true);
        expect(deleteTexture.mock.calls.some(([texture]) => texture === runtimeTexture)).toBe(false);
    });

    it("binds WebGL CPU depth without updating WGSL-only uniforms or the right-eye sampler", () => {
        const nativeBinding = { getDepthInformation: vi.fn(() => null) };
        (globalThis as any).XRWebGLBinding = vi.fn().mockImplementation(function () {
            return nativeBinding;
        });
        (engine as any)._gl = {} as WebGLRenderingContext;
        (sessionManager as any).session = {
            depthDataFormat: "float32",
            depthUsage: "cpu-optimized",
            enabledFeatures: ["depth-sensing"],
        } as XRSession;
        sessionManager.referenceSpace = {} as XRReferenceSpace;
        const view = {} as XRView;
        const matrix = Float32Array.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
        const depthInformation = createDepthInformation(Float32Array.from([1, 1, 1, 1]), 1, matrix);
        const { leftCamera } = createRigCameras();
        vi.spyOn(Logger, "Warn").mockImplementation(() => {});

        feature = new WebXRDepthSensing(sessionManager, {
            dataFormatPreference: ["float"],
            usagePreference: ["cpu"],
        });
        const material = new StandardMaterial("webgl-cpu-depth", scene);
        const plugin = material.pluginManager?.getPlugin("DepthSensing") as MaterialPluginBase;
        expect(feature.attach()).toBe(true);
        sessionManager.onXRFrameObservable.notifyObservers({
            getDepthInformation: vi.fn(() => depthInformation),
            getViewerPose: vi.fn(() => ({ views: [view] })),
        } as unknown as XRFrame);
        scene.onBeforeCameraRenderObservable.notifyObservers(leftCamera);

        const binding = createUniformBufferRecorder();
        plugin.bindForSubMesh(binding.uniformBuffer);
        expect(Array.from(binding.floats.keys())).toEqual(["ds_rawValueToMeters", "ds_viewIndex"]);
        expect(Array.from(binding.textures.keys())).toEqual(["ds_depthSampler"]);
        expect(Array.from(binding.matrices.keys())).toEqual(["ds_uvTransform"]);

        material.dispose();
    });

    it("preserves caller depth usage and format preference order", async () => {
        feature = new WebXRDepthSensing(sessionManager, {
            dataFormatPreference: ["float", "ushort", "luminance-alpha"],
            usagePreference: ["gpu", "cpu"],
        });

        await expect(feature.getXRSessionInitExtension()).resolves.toEqual({
            depthSensing: {
                dataFormatPreference: ["float32", "unsigned-short", "luminance-alpha"],
                usagePreference: ["gpu-optimized", "cpu-optimized"],
            },
        });
    });
});
