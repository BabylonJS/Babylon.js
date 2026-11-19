import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Constants } from "core/Engines/constants";
import { NullEngine } from "core/Engines/nullEngine";
import { ThinWebGPUEngine } from "core/Engines/thinWebGPUEngine";
import { WebGPUBundleList } from "core/Engines/WebGPU/webgpuBundleList";
import { WebGPUSnapshotRendering } from "core/Engines/WebGPU/webgpuSnapshotRendering";
import { WebGPUEngine } from "core/Engines/webgpuEngine.pure";
import "core/Materials/standardMaterial";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { Vector3 } from "core/Maths/math.vector";
import { type Mesh } from "core/Meshes/mesh";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { Scene } from "core/scene";

interface IPass {
    /** "main" or the name of the render target */
    target: string;
    /** what the render pass clears when it starts: any of "color", "depth" and "stencil" */
    clears: string;
    /** what the render pass encodes, in order: the name of the mesh of each draw, "clear" for a clear drawn in it, "scissor" */
    commands: string[];
}

/**
 * The frames are rendered by the scene with the code of WebGPUEngine that issues, records and issues again the clears, and its
 * snapshot, on render passes that keep what they clear and encode. A fast snapshot frame shows the recorded frame when it goes
 * through the same render passes.
 */
describe("Rendering group clears in fast snapshot rendering", () => {
    let engine: any;
    let scene: Scene;
    let camera: FreeCamera;
    let snapshot: WebGPUSnapshotRendering;
    let passes: IPass[];

    function startRenderPass(target: string, setClearStates: boolean, color: unknown, depth?: boolean, stencil?: boolean): void {
        engine._endCurrentRenderPass();
        const pass: IPass = {
            target,
            clears: [setClearStates && color ? "color" : "", setClearStates && depth ? "depth" : "", setClearStates && stencil ? "stencil" : ""].filter(Boolean).join(" "),
            commands: [],
        };
        passes.push(pass);
        engine._currentRenderPass = {
            executeBundles: (bundles: string[]) => pass.commands.push(...bundles),
            setScissorRect: () => pass.commands.push("scissor"),
            setStencilReference: () => {},
            end: () => {},
        };
    }

    // as WebGPUEngine: a draw is encoded in the bundle list of its render pass while a snapshot is recorded, and not at all once
    // the snapshot is played
    function draw(mesh: string): void {
        if (!snapshot.play) {
            engine._getCurrentRenderPass();
            engine._bundleList.addBundle(mesh);
        }
    }

    function createEngine(compatibilityMode: boolean): void {
        engine = new NullEngine();
        const prototype = WebGPUEngine.prototype as any;
        const bundleList = new WebGPUBundleList({} as GPUDevice);
        snapshot = new WebGPUSnapshotRendering(engine, Constants.SNAPSHOTRENDERING_FAST, bundleList);
        Object.defineProperty(engine, "snapshotRendering", { get: () => snapshot.enabled, set: (value: boolean) => (snapshot.enabled = value) });
        Object.defineProperty(engine, "snapshotRenderingMode", { get: () => snapshot.mode, set: (value: number) => (snapshot.mode = value) });
        Object.defineProperty(engine, "compatibilityMode", { get: () => compatibilityMode });
        Object.assign(engine, {
            _snapshotRendering: snapshot,
            _bundleList: bundleList,
            _currentRenderPass: null,
            _scissorCached: { x: 0, y: 0, z: 0, w: 0 },

            // the code under test
            clear: prototype.clear,
            _beginRenderingGroups: prototype._beginRenderingGroups,
            _endRenderingGroups: prototype._endRenderingGroups,
            _issueRenderingGroupClearsAgain: prototype._issueRenderingGroupClearsAgain,
            _scissorIsActive: prototype._scissorIsActive,
            _applyScissor: prototype._applyScissor,
            enableScissor: prototype.enableScissor,
            disableScissor: () => engine.enableScissor(0, 0, 0, 0),
            _endCurrentRenderPass: ThinWebGPUEngine.prototype._endCurrentRenderPass,

            // the render passes
            _startMainRenderPass: (setClearStates: boolean, color?: unknown, depth?: boolean, stencil?: boolean) => startRenderPass("main", setClearStates, color, depth, stencil),
            _startRenderTargetRenderPass: (target: { label?: string }, setClearStates: boolean, color: unknown, depth: boolean, stencil: boolean) =>
                startRenderPass(target.label!, setClearStates, color, depth, stencil),
            _getCurrentRenderPass: () => {
                if (!engine._currentRenderPass) {
                    if (engine._currentRenderTarget) {
                        engine._startRenderTargetRenderPass(engine._currentRenderTarget, false, null, false, false);
                    } else {
                        engine._startMainRenderPass(false);
                    }
                }
                return engine._currentRenderPass;
            },
            bindFramebuffer: (target: unknown) => {
                if (engine._currentRenderTarget) {
                    engine.unBindFramebuffer(engine._currentRenderTarget);
                } else {
                    engine._endCurrentRenderPass();
                }
                engine._currentRenderTarget = target;
                // as WebGPUEngine does while a snapshot is recorded or played
                engine._startRenderTargetRenderPass(target, false, null, false, false);
            },
            unBindFramebuffer: (_target: unknown, _disableGenerateMipMaps?: boolean, onBeforeUnbind?: () => void) => {
                onBeforeUnbind?.();
                engine._endCurrentRenderPass();
                engine._currentRenderTarget = null;
            },
            restoreDefaultFramebuffer: () => {
                if (engine._currentRenderTarget) {
                    engine.unBindFramebuffer(engine._currentRenderTarget);
                } else if (!engine._currentRenderPass) {
                    engine._startMainRenderPass(false);
                } else {
                    engine._endCurrentRenderPass();
                }
            },
            // a clear drawn in the render pass: in the bundle list, or encoded at once in the compatibility mode
            _clearFullQuad: () => {
                if (compatibilityMode) {
                    engine._getCurrentRenderPass().executeBundles(["clear"]);
                } else {
                    engine._bundleList.addBundle("clear");
                }
            },

            _flushRenderPassCommands: () => {},
            _debugPopBeforeEndOfEncoder: () => {},
            _debugPendingPop: () => {},
            _currentPassIsMainPass: () => !engine._currentRenderTarget,
            _timestampQuery: { endPass: () => {} },
            _timestampIndex: 0,
            _reportDrawCall: () => {},
        });
    }

    function createBox(name: string, renderingGroupId: number, layerMask = 0x0fffffff): Mesh {
        const box = MeshBuilder.CreateBox(name, { size: 1 }, scene);
        box.renderingGroupId = renderingGroupId;
        box.layerMask = layerMask;
        // the draw of the mesh, without its material: NullEngine compiles no shader
        vi.spyOn(box, "render").mockImplementation(() => {
            draw(name);
            return box;
        });
        return box;
    }

    function createRenderTarget(name: string, meshes: Mesh[]): RenderTargetTexture {
        const target = new RenderTargetTexture(name, 16, scene);
        target.renderTarget!.label = name;
        target.renderList = meshes;
        // the clears between the groups of a render target are its own
        for (let group = 1; group <= 3; group++) {
            target.setRenderingAutoClearDepthStencil(group, true);
        }
        return target;
    }

    function renderFrame(): IPass[] {
        passes = [];
        engine.beginFrame();
        scene.render();
        engine._endCurrentRenderPass();
        snapshot.endFrame();
        engine.endFrame();
        return passes;
    }

    /**
     * Records a frame, then renders fast snapshot frames: they go through the render passes of the recorded frame.
     * @returns the render passes of the recorded frame
     */
    function recordAndPlay(): IPass[] {
        engine.snapshotRenderingMode = Constants.SNAPSHOTRENDERING_FAST;
        engine.snapshotRendering = true;
        const recorded = renderFrame();
        expect(snapshot.play).toBe(true);
        expect(renderFrame()).toEqual(recorded);
        expect(scene.getActiveMeshes().length).toBe(0);
        expect(renderFrame()).toEqual(recorded);
        return recorded;
    }

    function setup(compatibilityMode = false): void {
        createEngine(compatibilityMode);
        scene = new Scene(engine);
        camera = new FreeCamera("camera", new Vector3(0, 0, -10), scene);
        camera.setTarget(Vector3.Zero());
        // NullEngine has no uniform buffers, which the scene finalizes whenever a snapshot is enabled
        vi.spyOn(scene, "finalizeSceneUbo").mockImplementation(() => scene.getSceneUniformBuffer());
        // the tests are about these clears: they do not rely on the default setup of the groups
        for (let group = 1; group <= 3; group++) {
            scene.setRenderingAutoClearDepthStencil(group, true, true, true);
        }
    }

    beforeEach(() => setup());

    afterEach(() => {
        vi.restoreAllMocks();
        scene.dispose();
        engine.dispose();
    });

    it("goes through a render pass for each rendering group that clears", () => {
        createBox("a", 0);
        createBox("b", 1);
        createBox("c", 2);

        expect(recordAndPlay()).toEqual([
            { target: "main", clears: "color depth stencil", commands: ["a"] },
            { target: "main", clears: "depth stencil", commands: ["b"] },
            { target: "main", clears: "depth stencil", commands: ["c"] },
        ]);
    });

    it("stays in one render pass when no rendering group clears", () => {
        createBox("a", 0);
        createBox("b", 0);
        const c = createBox("c", 2);
        scene.setRenderingAutoClearDepthStencil(2, false);

        expect(recordAndPlay()).toEqual([{ target: "main", clears: "color depth stencil", commands: ["a", "b", "c"] }]);

        // without snapshot rendering, the frame is the same
        engine.snapshotRendering = false;
        c.renderingGroupId = 2;
        expect(renderFrame().length).toBe(1);
    });

    it("keeps the depth and stencil selection of each clear", () => {
        createBox("a", 0);
        createBox("b", 1);
        createBox("c", 2);
        createBox("d", 3);
        scene.setRenderingAutoClearDepthStencil(1, true, false, true);
        scene.setRenderingAutoClearDepthStencil(2, true, true, false);
        scene.setRenderingAutoClearDepthStencil(3, true, false, false);

        expect(recordAndPlay().map((pass) => pass.clears)).toEqual(["color depth stencil", "stencil", "depth", ""]);
    });

    it("issues the clears of each camera for that camera", () => {
        const second = new FreeCamera("second", new Vector3(0, 0, -10), scene);
        second.setTarget(Vector3.Zero());
        camera.layerMask = 0x1;
        second.layerMask = 0x2;
        scene.activeCameras = [camera, second];
        createBox("both", 0, 0x3);
        createBox("second only", 1, 0x2);

        const recorded = recordAndPlay();
        // only the second camera renders a second group
        expect(recorded.filter((pass) => pass.commands.includes("both")).length).toBe(2);
        expect(recorded[recorded.length - 1]).toEqual({ target: "main", clears: "depth stencil", commands: ["second only"] });
    });

    it("issues the clears of a render target after its initial clear", () => {
        scene.customRenderTargets.push(createRenderTarget("target", [createBox("a", 0), createBox("b", 1)]));

        const recorded = recordAndPlay();
        expect(recorded.filter((pass) => pass.target === "target" && pass.commands.length)).toEqual([
            { target: "target", clears: "color depth stencil", commands: ["a"] },
            { target: "target", clears: "depth stencil", commands: ["b"] },
        ]);
    });

    it("issues the clears of each rendering of a render target that two cameras share", () => {
        const second = new FreeCamera("second", new Vector3(0, 0, -10), scene);
        second.setTarget(Vector3.Zero());
        camera.layerMask = 0x1;
        second.layerMask = 0x2;
        scene.activeCameras = [camera, second];
        const target = createRenderTarget("target", [createBox("both", 0, 0x3), createBox("second only", 1, 0x2)]);
        target.forceLayerMaskCheck = true;
        camera.customRenderTargets.push(target);
        second.customRenderTargets.push(target);

        const recorded = recordAndPlay().filter((pass) => pass.target === "target" && pass.commands.length);
        // the first rendering has one group, the second has two: the same render pass id for both
        expect(recorded).toEqual([
            { target: "target", clears: "color depth stencil", commands: ["both"] },
            { target: "target", clears: "color depth stencil", commands: ["both"] },
            { target: "target", clears: "depth stencil", commands: ["second only"] },
        ]);
    });

    it.each([
        ["in the bundle list", false],
        ["in the render pass, in the compatibility mode", true],
    ])("does not start a render pass for a clear with a scissor, drawn %s", (_name, compatibilityMode) => {
        scene.dispose();
        engine.dispose();
        setup(compatibilityMode);
        // the observers of a rendering group do not run in a fast snapshot frame
        scene.onBeforeRenderingGroupObservable.add((info) => info.renderingGroupId === 1 && engine.enableScissor(1, 2, 3, 4));
        scene.onAfterRenderingGroupObservable.add((info) => info.renderingGroupId === 1 && engine.disableScissor());
        scene.customRenderTargets.push(createRenderTarget("first", [createBox("a", 0), createBox("b", 1)]));
        scene.customRenderTargets.push(createRenderTarget("second", [createBox("c", 0)]));
        createBox("d", 0);

        const recorded = recordAndPlay().filter((pass) => pass.commands.length);
        expect(recorded.length).toBe(3);
        expect(recorded[0].target).toBe("first");
        expect(recorded[0].commands.slice().sort()).toEqual(["a", "b", "clear", "scissor"]);
        expect(recorded[1]).toEqual({ target: "second", clears: "color depth stencil", commands: ["c"] });
        expect(recorded[2].commands).toContain("d");
    });

    it("keeps the render pass that the draws opened when the scene does not clear", () => {
        scene.autoClear = false;
        scene.autoClearDepthAndStencil = false;
        createBox("a", 0);
        createBox("b", 1);

        expect(recordAndPlay()).toEqual([
            { target: "main", clears: "", commands: ["a"] },
            { target: "main", clears: "depth stencil", commands: ["b"] },
        ]);
    });

    it("follows a new recording", () => {
        createBox("a", 0);
        const moved = createBox("b", 1);
        expect(recordAndPlay().length).toBe(2);

        // the application changes the scene and resets the snapshot: the engine records again
        moved.renderingGroupId = 0;
        snapshot.reset();
        const recorded = renderFrame();
        expect(recorded).toEqual([{ target: "main", clears: "color depth stencil", commands: ["a", "b"] }]);
        expect(renderFrame()).toEqual(recorded);
    });

    it("does not issue recorded clears again in the standard snapshot mode, which renders the groups", () => {
        createBox("a", 0);
        createBox("b", 1);
        engine.snapshotRenderingMode = Constants.SNAPSHOTRENDERING_STANDARD;
        engine.snapshotRendering = true;

        const recorded = renderFrame();
        expect(recorded.length).toBe(2);
        expect(renderFrame()).toEqual(recorded);
        expect(scene.getActiveMeshes().length).toBe(2);
    });
});
