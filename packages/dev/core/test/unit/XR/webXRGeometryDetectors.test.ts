/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { WebXRMeshDetector, type IWebXRVertexData } from "core/XR/features/WebXRMeshDetector.pure";
import { WebXRPlaneDetector, type IWebXRPlane } from "core/XR/features/WebXRPlaneDetector.pure";
import { WebXRSessionManager } from "core/XR/webXRSessionManager";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

type NativeXRPlane = IWebXRPlane["xrPlane"];
type NativeXRMesh = IWebXRVertexData["xrMesh"];

function createPlane(semanticLabel?: string | null): NativeXRPlane {
    const plane: NativeXRPlane = {
        orientation: "horizontal",
        planeSpace: {} as XRSpace,
        polygon: [{ x: 0, y: 0, z: 0 } as DOMPointReadOnly],
        lastChangedTime: 0,
    };

    if (semanticLabel !== undefined) {
        plane.semanticLabel = semanticLabel;
    }

    return plane;
}

function createMesh(semanticLabel?: string | null): NativeXRMesh {
    const positions = new Float32Array([0, 0, 0]);
    const mesh: NativeXRMesh = {
        meshSpace: {} as XRSpace,
        vertices: positions,
        positions,
        indices: new Uint32Array([0]),
        lastChangedTime: 0,
    };

    if (semanticLabel !== undefined) {
        mesh.semanticLabel = semanticLabel;
    }

    return mesh;
}

function createFrame(options: { detectedPlanes?: Set<NativeXRPlane>; detectedMeshes?: Set<NativeXRMesh> }): XRFrame {
    return {
        ...options,
        getPose: () => null,
    } as unknown as XRFrame;
}

describe("WebXR geometry detector semantic labels", () => {
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
        Reflect.set(sessionManager, "_xrNavigator", { xr: { native: false } });
        sessionManager.session = {
            enabledFeatures: ["plane-detection", "mesh-detection"],
        } as unknown as XRSession;
        sessionManager.referenceSpace = {} as XRReferenceSpace;
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    describe("WebXRPlaneDetector", () => {
        it("copies semantic labels on add and timestamped updates without changing detector lifecycle behavior", () => {
            const detector = new WebXRPlaneDetector(sessionManager);
            const added: IWebXRPlane[] = [];
            const updated: IWebXRPlane[] = [];
            const removed: IWebXRPlane[] = [];
            detector.onPlaneAddedObservable.add((plane) => added.push(plane));
            detector.onPlaneUpdatedObservable.add((plane) => updated.push(plane));
            detector.onPlaneRemovedObservable.add((plane) => removed.push(plane));
            expect(detector.attach()).toBe(true);

            const xrPlane = createPlane("floor");
            const detectedPlanes = new Set([xrPlane]);
            sessionManager.onXRFrameObservable.notifyObservers(createFrame({ detectedPlanes }));

            expect(added).toHaveLength(1);
            expect(added[0].semanticLabel).toBe("floor");
            expect(added[0].xrPlane).toBe(xrPlane);

            xrPlane.semanticLabel = "wall";
            xrPlane.lastChangedTime = 10;
            sessionManager.currentTimestamp = 10;
            sessionManager.onXRFrameObservable.notifyObservers(createFrame({ detectedPlanes }));

            expect(updated).toEqual([added[0]]);
            expect(added[0].semanticLabel).toBe("wall");

            xrPlane.semanticLabel = "ceiling";
            xrPlane.lastChangedTime = 11;
            sessionManager.currentTimestamp = 12;
            sessionManager.onXRFrameObservable.notifyObservers(createFrame({ detectedPlanes }));

            expect(updated).toHaveLength(1);
            expect(added[0].semanticLabel).toBe("wall");

            detectedPlanes.delete(xrPlane);
            sessionManager.onXRFrameObservable.notifyObservers(createFrame({ detectedPlanes }));

            expect(removed).toEqual([added[0]]);
            detector.dispose();
        });

        it("preserves missing and null semantic labels", () => {
            const detector = new WebXRPlaneDetector(sessionManager);
            const added: IWebXRPlane[] = [];
            detector.onPlaneAddedObservable.add((plane) => added.push(plane));
            expect(detector.attach()).toBe(true);

            sessionManager.onXRFrameObservable.notifyObservers(
                createFrame({
                    detectedPlanes: new Set([createPlane(), createPlane(null)]),
                })
            );

            expect(added.map((plane) => plane.semanticLabel)).toEqual([undefined, null]);
            detector.dispose();
        });
    });

    describe("WebXRMeshDetector", () => {
        it("copies semantic labels on add and timestamped updates without changing detector lifecycle behavior", () => {
            const detector = new WebXRMeshDetector(sessionManager);
            const added: IWebXRVertexData[] = [];
            const updated: IWebXRVertexData[] = [];
            const removed: IWebXRVertexData[] = [];
            detector.onMeshAddedObservable.add((mesh) => added.push(mesh));
            detector.onMeshUpdatedObservable.add((mesh) => updated.push(mesh));
            detector.onMeshRemovedObservable.add((mesh) => removed.push(mesh));
            expect(detector.attach()).toBe(true);

            const xrMesh = createMesh("global mesh");
            const detectedMeshes = new Set([xrMesh]);
            sessionManager.onXRFrameObservable.notifyObservers(createFrame({ detectedMeshes }));

            expect(added).toHaveLength(1);
            expect(added[0].semanticLabel).toBe("global mesh");
            expect(added[0].xrMesh).toBe(xrMesh);

            xrMesh.semanticLabel = "couch";
            xrMesh.lastChangedTime = 20;
            sessionManager.currentTimestamp = 20;
            sessionManager.onXRFrameObservable.notifyObservers(createFrame({ detectedMeshes }));

            expect(updated).toEqual([added[0]]);
            expect(added[0].semanticLabel).toBe("couch");

            xrMesh.semanticLabel = "table";
            xrMesh.lastChangedTime = 21;
            sessionManager.currentTimestamp = 22;
            sessionManager.onXRFrameObservable.notifyObservers(createFrame({ detectedMeshes }));

            expect(updated).toHaveLength(1);
            expect(added[0].semanticLabel).toBe("couch");

            detectedMeshes.delete(xrMesh);
            sessionManager.onXRFrameObservable.notifyObservers(createFrame({ detectedMeshes }));

            expect(removed).toEqual([added[0]]);
            detector.dispose();
        });

        it("preserves missing and null semantic labels", () => {
            const detector = new WebXRMeshDetector(sessionManager);
            const added: IWebXRVertexData[] = [];
            detector.onMeshAddedObservable.add((mesh) => added.push(mesh));
            expect(detector.attach()).toBe(true);

            sessionManager.onXRFrameObservable.notifyObservers(
                createFrame({
                    detectedMeshes: new Set([createMesh(), createMesh(null)]),
                })
            );

            expect(added.map((mesh) => mesh.semanticLabel)).toEqual([undefined, null]);
            detector.dispose();
        });
    });
});
