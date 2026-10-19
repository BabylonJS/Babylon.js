import { FreeCamera } from "core/Cameras/freeCamera";
import { Camera } from "core/Cameras/camera";
import { BoundingInfo } from "core/Culling/boundingInfo";
import { NullEngine } from "core/Engines/nullEngine";
import { Frustum } from "core/Maths/math.frustum";
import { Matrix, Vector3 } from "core/Maths/math.vector";
import { TransformNode } from "core/Meshes/transformNode";
import { Scene } from "core/scene";
import { GaussianSplattingStream, type ISOGLODMetadata } from "loaders/SPLAT/gaussianSplattingStream";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const METADATA: ISOGLODMetadata = {
    lodLevels: 1,
    filenames: ["base/meta.json"],
    tree: { bound: { min: [-1, -1, -1], max: [1, 1, 1] }, lods: { "0": { file: 0, offset: 0, count: 10 } } },
};

describe("GaussianSplattingStream local-space frustum culling", () => {
    let engine: NullEngine;
    let scene: Scene;
    let camera: FreeCamera;
    let startupSpy: ReturnType<typeof vi.spyOn>;
    let stream: any;
    let node: any;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        camera = new FreeCamera("camera", Vector3.Zero(), scene);
        camera.minZ = 0.1;
        camera.maxZ = 100;
        camera.setTarget(new Vector3(0, 0, 1));
        scene.activeCamera = camera;
        startupSpy = vi.spyOn(GaussianSplattingStream.prototype as any, "_streamAllAsync").mockResolvedValue(undefined);
        stream = new GaussianSplattingStream("stream", METADATA, "", scene);
        startupSpy.mockRestore();
        node = stream._leafNodes[0];
    });

    afterEach(() => {
        vi.restoreAllMocks();
        scene.dispose();
        engine.dispose();
    });

    it("builds one local frustum per camera without updating any leaf BoundingInfo", () => {
        const second = new FreeCamera("second", new Vector3(20, 0, 10), scene);
        second.setTarget(new Vector3(20, 0, 11));
        scene.activeCameras = [camera, second];
        stream.position.set(0, 0, 10);
        stream.scaling.set(-2, 3, 0.5);
        stream.rotation.set(0.2, 0.4, -0.3);
        stream.computeWorldMatrix(true);
        const updateSpy = vi.spyOn(node.cullBounds, "update");
        const planesSpy = vi.spyOn(Frustum, "GetPlanesToRef");

        stream._updateNodeFrustum();

        expect(node.inFrustum).toBe(true);
        expect(updateSpy).not.toHaveBeenCalled();
        expect(planesSpy).toHaveBeenCalledTimes(2);
    });

    it.each([
        ["translation", new Vector3(0, 0, 8), new Vector3(1, 1, 1), new Vector3(0, 0, 0)],
        ["rotation and non-uniform scale", new Vector3(1, 0, 10), new Vector3(4, 0.5, 2), new Vector3(0.2, 0.8, -0.1)],
        ["mirrored scale", new Vector3(-1, 0, 10), new Vector3(-2, 3, -0.5), new Vector3(0.1, -0.4, 0.2)],
        ["zero scale", new Vector3(0, 0, 10), new Vector3(0, 2, 1), new Vector3(0.3, 0.2, 0.1)],
    ])("conservatively handles %s without mutating local bounds", (_name, position, scaling, rotation) => {
        stream.position.copyFrom(position);
        stream.scaling.copyFrom(scaling);
        stream.rotation.copyFrom(rotation);
        const beforeMin = node.cullBounds.boundingBox.minimumWorld.clone();
        const beforeMax = node.cullBounds.boundingBox.maximumWorld.clone();

        stream._updateNodeFrustum();

        expect(node.inFrustum).toBe(true);
        expect(node.cullBounds.boundingBox.minimumWorld.equals(beforeMin)).toBe(true);
        expect(node.cullBounds.boundingBox.maximumWorld.equals(beforeMax)).toBe(true);
    });

    it("uses the hosted proxy transform and preserves camera-union visibility", () => {
        const proxy = new TransformNode("proxy", scene);
        proxy.position.set(-20, 0, 10);
        proxy.scaling.set(-1, 2, 0.5);
        stream._host = { proxy };
        const second = new FreeCamera("second", Vector3.Zero(), scene);
        second.setTarget(new Vector3(-20, 0, 10));

        scene.activeCameras = [camera];
        stream._updateNodeFrustum();
        expect(node.inFrustum).toBe(false);

        scene.activeCameras = [camera, second];
        stream._updateNodeFrustum();
        expect(node.inFrustum).toBe(true);
    });

    it("matches a transformed-corner reference for a parented transform near the frustum boundary", () => {
        const parent = new TransformNode("parent", scene);
        parent.position.set(0.5, -0.25, 8);
        parent.rotation.set(0.1, 0.35, 0);
        parent.scaling.set(2, 0.75, -1);
        stream.parent = parent;
        stream.position.set(1.5, 0, 0);
        stream.computeWorldMatrix(true);

        const worldBounds = new BoundingInfo(Vector3.FromArray(METADATA.tree.bound.min), Vector3.FromArray(METADATA.tree.bound.max));
        worldBounds.update(stream.getWorldMatrix());
        const worldPlanes = Frustum.GetPlanes(camera.getTransformationMatrix());
        const referenceVisible = worldBounds.isInFrustum(worldPlanes);

        stream._updateNodeFrustum();

        expect(referenceVisible).toBe(true);
        expect(node.inFrustum).toBe(true);
    });

    it("marks all nodes visible for a degenerate projection instead of rejecting them through NaN planes", () => {
        vi.spyOn(camera, "getProjectionMatrix").mockReturnValue(Matrix.Zero());

        stream._updateNodeFrustum();

        expect(node.inFrustum).toBe(true);
    });

    it.each([Camera.PERSPECTIVE_CAMERA, Camera.ORTHOGRAPHIC_CAMERA])("rejects off-screen and far-clipped nodes with projection mode %s", (mode) => {
        camera.mode = mode;
        camera.orthoLeft = -4;
        camera.orthoRight = 4;
        camera.orthoTop = 4;
        camera.orthoBottom = -4;
        stream.scaling.set(-2, 0.5, 1);
        stream.rotation.set(0.1, 0.2, 0.3);

        for (const [position, visible] of [
            [new Vector3(0, 0, 10), true],
            [new Vector3(100, 0, 10), false],
            [new Vector3(0, 0, -10), false],
            [new Vector3(0, 0, 110), false],
        ] as const) {
            stream.position.copyFrom(position);
            stream.computeWorldMatrix(true);
            stream._updateNodeFrustum();
            expect(node.inFrustum).toBe(visible);
        }
    });
});
