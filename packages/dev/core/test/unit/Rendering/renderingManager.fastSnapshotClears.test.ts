import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Constants } from "core/Engines/constants";
import { NullEngine } from "core/Engines/nullEngine";
import "core/Materials/standardMaterial";
import { Vector3 } from "core/Maths/math.vector";
import { type Mesh } from "core/Meshes/mesh";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { ObjectRenderer } from "core/Rendering/objectRenderer";
import { Scene } from "core/scene";

interface IGroupClear {
    renderPassId: number;
    depth: boolean;
    stencil: boolean;
}

describe("RenderingManager clears in fast snapshot rendering", () => {
    let engine: NullEngine;
    let scene: Scene;
    let camera: FreeCamera;
    let clears: IGroupClear[];
    const snapshot = { enabled: false, mode: Constants.SNAPSHOTRENDERING_STANDARD };

    /**
     * Stands for WebGPUEngine: while a snapshot is recorded the mode reads as the standard one, then as the mode asked for.
     * @param mode undefined for no snapshot rendering
     */
    function setSnapshot(mode?: number): void {
        snapshot.enabled = mode !== undefined;
        snapshot.mode = mode ?? Constants.SNAPSHOTRENDERING_STANDARD;
    }

    function createBox(name: string, renderingGroupId: number, layerMask = 0x0fffffff): Mesh {
        const box = MeshBuilder.CreateBox(name, { size: 1 }, scene);
        box.renderingGroupId = renderingGroupId;
        box.layerMask = layerMask;
        return box;
    }

    function renderFrame(): IGroupClear[] {
        clears = [];
        engine.beginFrame();
        scene.render();
        engine.endFrame();
        return clears;
    }

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        camera = new FreeCamera("camera", new Vector3(0, 0, -10), scene);
        camera.setTarget(Vector3.Zero());
        setSnapshot();
        Object.defineProperty(engine, "snapshotRendering", { get: () => snapshot.enabled, configurable: true });
        Object.defineProperty(engine, "snapshotRenderingMode", { get: () => snapshot.mode, configurable: true });
        clears = [];
        // NullEngine has no uniform buffers, which the scene finalizes whenever a snapshot is enabled
        vi.spyOn(scene, "finalizeSceneUbo").mockImplementation(() => scene.getSceneUniformBuffer());
        // the clears between rendering groups are the ones without a color
        vi.spyOn(engine, "clear").mockImplementation((color, backBuffer, depth, stencil) => {
            if (color === null && !backBuffer) {
                clears.push({ renderPassId: engine.currentRenderPassId, depth, stencil: !!stencil });
            }
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        scene.dispose();
        engine.dispose();
    });

    it("clears before each rendered group after the first in an ordinary frame", () => {
        createBox("a", 0);
        createBox("b", 1);
        createBox("c", 2);

        expect(renderFrame()).toEqual([
            { renderPassId: camera.renderPassId, depth: true, stencil: true },
            { renderPassId: camera.renderPassId, depth: true, stencil: true },
        ]);
    });

    it("issues the clears of the recorded frame again in every fast snapshot frame", () => {
        createBox("a", 0);
        createBox("b", 1);
        createBox("c", 2);

        setSnapshot(Constants.SNAPSHOTRENDERING_STANDARD);
        const recorded = renderFrame();
        expect(recorded.length).toBe(2);

        setSnapshot(Constants.SNAPSHOTRENDERING_FAST);
        expect(renderFrame()).toEqual(recorded);
        expect(scene.getActiveMeshes().length).toBe(0);
        expect(renderFrame()).toEqual(recorded);
    });

    it("issues no clear in a fast snapshot frame when the recorded frame had none", () => {
        createBox("a", 0);
        createBox("b", 0);

        setSnapshot(Constants.SNAPSHOTRENDERING_STANDARD);
        expect(renderFrame()).toEqual([]);

        setSnapshot(Constants.SNAPSHOTRENDERING_FAST);
        expect(renderFrame()).toEqual([]);
    });

    it("clears only for the groups that were rendered", () => {
        createBox("a", 0);
        createBox("c", 2);

        setSnapshot(Constants.SNAPSHOTRENDERING_STANDARD);
        const recorded = renderFrame();
        expect(recorded.length).toBe(1);

        setSnapshot(Constants.SNAPSHOTRENDERING_FAST);
        expect(renderFrame()).toEqual(recorded);
    });

    it("keeps the depth and stencil selection of each clear and skips groups that do not clear", () => {
        createBox("a", 0);
        createBox("b", 1);
        createBox("c", 2);
        createBox("d", 3);
        scene.setRenderingAutoClearDepthStencil(1, true, false, true);
        scene.setRenderingAutoClearDepthStencil(2, false);
        scene.setRenderingAutoClearDepthStencil(3, true, true, false);

        setSnapshot(Constants.SNAPSHOTRENDERING_STANDARD);
        const recorded = renderFrame();
        expect(recorded).toEqual([
            { renderPassId: camera.renderPassId, depth: false, stencil: true },
            { renderPassId: camera.renderPassId, depth: true, stencil: false },
        ]);

        setSnapshot(Constants.SNAPSHOTRENDERING_FAST);
        expect(renderFrame()).toEqual(recorded);
    });

    it("issues a clear that selects neither depth nor stencil again", () => {
        createBox("a", 0);
        createBox("b", 1);
        scene.setRenderingAutoClearDepthStencil(1, true, false, false);

        setSnapshot(Constants.SNAPSHOTRENDERING_STANDARD);
        const recorded = renderFrame();
        expect(recorded).toEqual([{ renderPassId: camera.renderPassId, depth: false, stencil: false }]);

        setSnapshot(Constants.SNAPSHOTRENDERING_FAST);
        expect(renderFrame()).toEqual(recorded);
    });

    it.each([
        ["first", 0x1],
        ["second", 0x2],
    ])("records the clears of each camera separately when only the %s camera renders a second group", (_name, layerMask) => {
        const second = new FreeCamera("second", new Vector3(0, 0, -10), scene);
        second.setTarget(Vector3.Zero());
        camera.layerMask = 0x1;
        second.layerMask = 0x2;
        scene.activeCameras = [camera, second];
        createBox("both", 0, 0x3);
        createBox("one", 1, layerMask);
        expect(camera.renderPassId).not.toBe(second.renderPassId);

        setSnapshot(Constants.SNAPSHOTRENDERING_STANDARD);
        const recorded = renderFrame();
        // the clear of the second group, and the clear the scene issues itself between two cameras
        expect(recorded.length).toBe(2);
        const groupClear = layerMask === 0x1 ? recorded[0] : recorded[1];
        expect(groupClear.renderPassId).toBe(layerMask === 0x1 ? camera.renderPassId : second.renderPassId);

        setSnapshot(Constants.SNAPSHOTRENDERING_FAST);
        expect(renderFrame()).toEqual(recorded);
    });

    it("follows a new recording", () => {
        createBox("a", 0);
        const moved = createBox("b", 1);

        setSnapshot(Constants.SNAPSHOTRENDERING_STANDARD);
        expect(renderFrame().length).toBe(1);
        setSnapshot(Constants.SNAPSHOTRENDERING_FAST);
        expect(renderFrame().length).toBe(1);

        // the application changes the scene and resets the snapshot: the engine records again
        moved.renderingGroupId = 0;
        setSnapshot(Constants.SNAPSHOTRENDERING_STANDARD);
        expect(renderFrame()).toEqual([]);
        setSnapshot(Constants.SNAPSHOTRENDERING_FAST);
        expect(renderFrame()).toEqual([]);
    });

    it("does not issue recorded clears again outside fast snapshot rendering", () => {
        createBox("a", 0);
        const hidden = createBox("b", 1);

        expect(renderFrame().length).toBe(1);

        hidden.setEnabled(false);
        expect(renderFrame()).toEqual([]);
        setSnapshot(Constants.SNAPSHOTRENDERING_STANDARD);
        expect(renderFrame()).toEqual([]);
    });

    it("issues the clears of an object renderer again before its fast path observers run", () => {
        const renderer = new ObjectRenderer("renderer", scene);
        renderer.renderList = [createBox("a", 0), createBox("b", 1)];
        scene.activeCamera = camera;

        setSnapshot(Constants.SNAPSHOTRENDERING_STANDARD);
        clears = [];
        renderer.render();
        const recorded = clears;
        expect(recorded).toEqual([{ renderPassId: renderer.renderPassId, depth: true, stencil: true }]);

        setSnapshot(Constants.SNAPSHOTRENDERING_FAST);
        clears = [];
        let clearsWhenNotified = -1;
        renderer.onFastPathRenderObservable.add(() => {
            clearsWhenNotified = clears.length;
        });
        renderer.render();
        expect(clears).toEqual(recorded);
        expect(clearsWhenNotified).toBe(1);

        renderer.dispose();
    });
});
