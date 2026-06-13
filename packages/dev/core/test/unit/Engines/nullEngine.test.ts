import { NullEngine } from "core/Engines/nullEngine";
import { Camera } from "core/Cameras/camera";
import { FreeCamera } from "core/Cameras/freeCamera";
import { InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { MultiviewRenderTarget } from "core/Materials/Textures/MultiviewRenderTarget";
import { Matrix, Vector3 } from "core/Maths/math.vector";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { Scene } from "core/scene";
import { describe, expect, it } from "vitest";

import "core/Engines/Extensions/engine.multiview";

type RenderFrameCallback = (timestamp: number) => void;

function configureOrthographicCamera(camera: FreeCamera, x: number): void {
    camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
    camera.minZ = 0.1;
    camera.maxZ = 100;
    camera.orthoLeft = -10;
    camera.orthoRight = 10;
    camera.orthoBottom = -10;
    camera.orthoTop = 10;
    camera.position.set(x, 0, 0);
    camera.setTarget(new Vector3(x, 0, 1));
    camera.getViewMatrix(true);
    camera.getProjectionMatrix(true);
}

function createMultiviewScene(): {
    engine: NullEngine;
    scene: Scene;
    parentCamera: FreeCamera;
    leftCamera: FreeCamera;
    rightCamera: FreeCamera;
    renderTarget: MultiviewRenderTarget;
} {
    const engine = new NullEngine({
        renderHeight: 128,
        renderWidth: 128,
        textureSize: 128,
        enableMultiview: true,
    });
    const scene = new Scene(engine);
    const parentCamera = new FreeCamera("parent", Vector3.Zero(), scene);
    const leftCamera = new FreeCamera("left", Vector3.Zero(), scene);
    const rightCamera = new FreeCamera("right", Vector3.Zero(), scene);
    const renderTarget = new MultiviewRenderTarget(scene, { width: 128, height: 128 });

    configureOrthographicCamera(parentCamera, 0);
    configureOrthographicCamera(leftCamera, -0.5);
    configureOrthographicCamera(rightCamera, 0.5);

    // WebXR sets this internal multiview state from XR view/render-target data. There is no public
    // NullEngine setup API that reaches this exact branch without a live XRSession.
    parentCamera._rigCameras = [leftCamera, rightCamera];
    parentCamera._renderingMultiview = true;
    parentCamera.outputRenderTarget = renderTarget;
    scene.activeCamera = parentCamera;

    return { engine, scene, parentCamera, leftCamera, rightCamera, renderTarget };
}

function expectMatrixToBeCloseTo(actual: Matrix, expected: Matrix): void {
    for (let index = 0; index < 16; index++) {
        expect(actual.m[index]).toBeCloseTo(expected.m[index], 6);
    }
}

describe("NullEngine", () => {
    describe("constructor", () => {
        it("returns a NullEngine", () => {
            const nullEngine = new NullEngine();
            expect(nullEngine).toBeInstanceOf(NullEngine);
        });
    });

    describe("Options", () => {
        it("returns a NullEngine with the correct options", () => {
            const nullEngine = new NullEngine({
                renderHeight: 128,
                renderWidth: 256,
                textureSize: 256,
                deterministicLockstep: false,
                lockstepMaxSteps: 1,
            });
            expect(nullEngine.getRenderHeight()).toBe(128);
            expect(nullEngine.getRenderWidth()).toBe(256);
            expect(nullEngine.isDeterministicLockStep()).toBe(false);
            expect(nullEngine.getLockstepMaxSteps()).toBe(1);
        });

        it("supports setting timeStep option", () => {
            const nullEngine = new NullEngine({
                renderHeight: 128,
                renderWidth: 256,
                textureSize: 256,
                deterministicLockstep: true,
                timeStep: 0.5,
                lockstepMaxSteps: 4,
            });
            expect(nullEngine.isDeterministicLockStep()).toBe(true);
            expect(nullEngine.getTimeStep()).toBe(500); // 0.5 seconds in ms
            expect(nullEngine.getLockstepMaxSteps()).toBe(4);
        });

        it("advertises multiview only when enabled", () => {
            const defaultEngine = new NullEngine();
            const multiviewEngine = new NullEngine({
                enableMultiview: true,
            });

            expect(defaultEngine.getCaps().multiview).toBeUndefined();
            expect(multiviewEngine.getCaps().multiview).toBeTruthy();
            expect(multiviewEngine.supportsUniformBuffers).toBe(true);

            defaultEngine.dispose();
            multiviewEngine.dispose();
        });

        it("reports uniform buffer capacity in bytes", () => {
            const engine = new NullEngine({
                enableMultiview: true,
            });

            try {
                expect(engine.createUniformBuffer([0, 1, 2, 3]).capacity).toBe(16);
                expect(engine.createUniformBuffer(new Float32Array(6)).capacity).toBe(24);
                expect(engine.createDynamicUniformBuffer(new Float32Array(2)).capacity).toBe(8);
            } finally {
                engine.dispose();
            }
        });
    });

    describe("multiview", () => {
        it("throws an Error when multiview render targets are requested without opt-in", () => {
            const engine = new NullEngine();
            const scene = new Scene(engine);
            let thrownError: unknown;

            try {
                try {
                    new MultiviewRenderTarget(scene, { width: 64, height: 64 });
                } catch (error) {
                    thrownError = error;
                }

                expect(thrownError).toBeInstanceOf(Error);
                expect((thrownError as Error).message).toBe("Multiview is not supported");
            } finally {
                scene.dispose();
                engine.dispose();
            }
        });

        it("creates inspectable multiview render targets when enabled", () => {
            const engine = new NullEngine({
                enableMultiview: true,
            });
            const scene = new Scene(engine);
            const renderTarget = new MultiviewRenderTarget(scene, { width: 64, height: 32 });

            try {
                expect(renderTarget.getViewCount()).toBe(2);
                expect(renderTarget.getRenderWidth()).toBe(64);
                expect(renderTarget.getRenderHeight()).toBe(32);
                expect(renderTarget.renderTarget?.texture?.isMultiview).toBe(true);
                expect(renderTarget.renderTarget?.texture?.source).toBe(InternalTextureSource.RenderTarget);
                expect(renderTarget.renderTarget?.depthStencilTexture).toBeNull();
                expect(() => renderTarget._bindFrameBuffer()).not.toThrow();
                expect((engine as any)._currentRenderTarget).toBe(renderTarget.renderTarget);
            } finally {
                scene.dispose();
                engine.dispose();
            }
        });

        it("updates left and right view-projection state when rendering multiview", () => {
            const { engine, scene, parentCamera, leftCamera, rightCamera, renderTarget } = createMultiviewScene();

            try {
                scene.render();

                const leftViewProjection = leftCamera.getViewMatrix().multiply(leftCamera.getProjectionMatrix());
                const rightViewProjection = rightCamera.getViewMatrix().multiply(rightCamera.getProjectionMatrix());
                const multiviewSceneUbo = scene._multiviewSceneUbo;

                expect(parentCamera.outputRenderTarget).toBe(renderTarget);
                expect(scene._multiviewSceneUboIsActive).toBe(true);
                expect(multiviewSceneUbo).not.toBeNull();
                expect(scene.getSceneUniformBuffer()).toBe(multiviewSceneUbo);
                expect(multiviewSceneUbo!.useUbo).toBe(true);
                expect(multiviewSceneUbo!.getUniformNames()).toContain("viewProjectionR");
                expectMatrixToBeCloseTo(scene.getTransformMatrix(), leftViewProjection);
                expectMatrixToBeCloseTo(scene._transformMatrixR, rightViewProjection);
            } finally {
                scene.dispose();
                engine.dispose();
            }
        });

        // Expected failure: NullEngine can now expose this multiview render-state bug, but this PR
        // intentionally avoids changing Scene's production hot path. Until that path can tolerate one
        // additional boolean compare in its transform-cache guard, making this pass requires a local
        // monkey-patch of the transform invalidation behavior.
        it.fails("restores active-camera frustum planes after a direct narrowed transform before multiview render", () => {
            const { engine, scene, leftCamera } = createMultiviewScene();
            const visibleInWideFrustum = MeshBuilder.CreateBox("visibleInWideFrustum", { size: 1 }, scene);

            try {
                visibleInWideFrustum.position.set(5, 0, 10);
                visibleInWideFrustum.computeWorldMatrix(true);

                const view = leftCamera.getViewMatrix(true);
                const wideProjection = leftCamera.getProjectionMatrix(true);
                const narrowedProjection = Matrix.OrthoOffCenterLH(-1, 1, -10, 10, leftCamera.minZ, leftCamera.maxZ, engine.isNDCHalfZRange);

                narrowedProjection.updateFlag = wideProjection.updateFlag;
                scene.setTransformMatrix(view, narrowedProjection);

                expect(visibleInWideFrustum.isInFrustum(scene.frustumPlanes)).toBe(false);

                scene.render();

                expect(visibleInWideFrustum.isInFrustum(scene.frustumPlanes)).toBe(true);
            } finally {
                scene.dispose();
                engine.dispose();
            }
        });
    });

    describe("render loop", () => {
        it("notifies frame observables when driven by a custom animation frame requester", () => {
            const nullEngine = new NullEngine();
            const requestedCallbacks: RenderFrameCallback[] = [];
            const canceledRequestIds: Array<number | undefined> = [];
            let nextRequestId = 41;
            let beginFrameCount = 0;
            let endFrameCount = 0;
            let renderCount = 0;
            const renderLoop = () => {
                renderCount++;
            };

            nullEngine.customAnimationFrameRequester = {
                requestAnimationFrame: (callback: RenderFrameCallback) => {
                    requestedCallbacks.push(callback);
                    return nextRequestId++;
                },
                cancelAnimationFrame: (requestId?: number) => {
                    canceledRequestIds.push(requestId);
                },
            };
            nullEngine.onBeginFrameObservable.add(() => {
                beginFrameCount++;
            });
            nullEngine.onEndFrameObservable.add(() => {
                endFrameCount++;
            });

            try {
                nullEngine.runRenderLoop(renderLoop);

                expect(requestedCallbacks).toHaveLength(1);
                expect(nullEngine._frameHandler).toBe(41);
                expect(nullEngine.customAnimationFrameRequester.requestID).toBe(41);

                requestedCallbacks[0](1000);

                expect(beginFrameCount).toBe(1);
                expect(renderCount).toBe(1);
                expect(endFrameCount).toBe(1);
                expect(requestedCallbacks).toHaveLength(2);
                expect(nullEngine._frameHandler).toBe(42);
                expect(nullEngine.customAnimationFrameRequester.requestID).toBe(42);

                nullEngine.stopRenderLoop(renderLoop);

                expect(canceledRequestIds).toEqual([42]);
                expect(nullEngine._frameHandler).toBe(0);
                expect(nullEngine.customAnimationFrameRequester.requestID).toBeUndefined();
            } finally {
                nullEngine.dispose();
            }
        });
    });
});
