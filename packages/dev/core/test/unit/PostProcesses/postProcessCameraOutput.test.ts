import { type RenderTargetWrapper } from "core/Engines/renderTargetWrapper";
import { RegisterEngineMultiview } from "core/Engines/Extensions/engine.multiview.pure";
import { NullEngine } from "core/Engines/nullEngine";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Vector3 } from "core/Maths/math.vector";
import { type PostProcess } from "core/PostProcesses/postProcess";
import { PostProcessManager } from "core/PostProcesses/postProcessManager";
import { PrePassRenderer } from "core/Rendering/prePassRenderer.pure";
import { Scene } from "core/scene";
import { WebXRLayerRenderTargetTexture } from "core/XR/webXRLayerRenderTargetTexture";
import { describe, expect, it, vi } from "vitest";

describe("PostProcessManager camera output", () => {
    function setup() {
        const target = {} as RenderTargetWrapper;
        const engine = { bindFramebuffer: vi.fn(), restoreDefaultFramebuffer: vi.fn(), setDepthBuffer: vi.fn(), setDepthWrite: vi.fn(), setAlphaMode: vi.fn() };
        const eye = (layer: number): WebXRLayerRenderTargetTexture =>
            Object.assign(Object.create(WebXRLayerRenderTargetTexture.prototype), {
                layerIndex: layer,
                _renderTarget: target,
                ignoreCameraViewport: true,
                getScene: () => ({ getEngine: () => engine }),
            });
        const left = eye(0);
        const right = eye(1);
        const scene = {
            activeCamera: { outputRenderTarget: left },
            _bindFrameBuffer: (camera: { outputRenderTarget: RenderTargetTexture }) => camera.outputRenderTarget._bindFrameBuffer(),
            getEngine: () => engine,
            postProcessesEnabled: true,
        };
        const manager = new PostProcessManager(scene as unknown as Scene);
        Object.assign(scene, { postProcessManager: manager });
        const pp = { apply: () => null, isReady: () => false } as unknown as PostProcess;
        const render = (output?: RenderTargetWrapper, face?: number, fullscreen = false, layer?: number) => manager._finalizeFrame(false, output, face, [pp], fullscreen, layer);
        return { engine, scene, left, right, target, pp, render, manager };
    }

    it("keeps the selected eye even when both cameras share an output wrapper", () => {
        const { engine, scene, left, right, target, pp, render } = setup();
        for (const cameraOutput of [left, right, left]) {
            scene.activeCamera.outputRenderTarget = cameraOutput;
            render(target, undefined, cameraOutput === right);
            expect(pp._outputTexture).toBe(target);
        }
        expect(engine.bindFramebuffer.mock.calls.map((args) => [args[4], args[6]])).toEqual([
            [false, 0],
            [true, 1],
            [false, 0],
        ]);
    });

    it("keeps explicit cube faces, independent targets and canvas output independent of the current eye", () => {
        const { engine, scene, right, target, render } = setup();
        scene.activeCamera.outputRenderTarget = right;
        const other = {} as RenderTargetWrapper;
        render(target, 0);
        render(other, undefined, true);
        render();
        expect(engine.bindFramebuffer.mock.calls).toEqual([
            [target, 0, undefined, undefined, false, 0, undefined],
            [other, undefined, undefined, undefined, true, 0, undefined],
        ]);
        expect(engine.restoreDefaultFramebuffer).toHaveBeenCalledOnce();
    });

    it("binds the requested output slice rather than inheriting the camera slice", () => {
        const { engine, scene, right, target, render } = setup();
        scene.activeCamera.outputRenderTarget = right;
        for (const slice of [2, 0, 1]) {
            render(target, undefined, true, slice);
            expect(engine.bindFramebuffer).toHaveBeenLastCalledWith(target, undefined, undefined, undefined, true, 0, slice);
        }
    });

    it.each([false, true])("preserves all array slices during RTT.render (useCameraPostProcess=%s)", (useCameraPostProcess) => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        try {
            const camera = new FreeCamera("camera", Vector3.Zero(), scene);
            const target = new RenderTargetTexture("slices", { width: 8, height: 8, layers: 3 }, scene, false);
            target.getInternalTexture()!.is2DArray = true;
            target.renderList = [];
            const process = { activate: vi.fn(), apply: () => null, dispose: vi.fn(), isReusable: () => false, markTextureDirty: vi.fn() } as unknown as PostProcess;
            if (useCameraPostProcess) {
                camera.attachPostProcess(process);
            } else {
                target.addPostProcess(process);
            }
            const binds = vi.spyOn(engine, "bindFramebuffer");
            target.render(useCameraPostProcess);
            const calls = binds.mock.calls as unknown[][];
            expect(calls.filter(([wrapper]) => wrapper === target.renderTarget).map((args) => args[6])).toEqual([0, 1, 2]);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });

    it("presents converted multiview to each rig output and keeps a canvas spectator", () => {
        RegisterEngineMultiview();
        const { left, right, target } = setup();
        const spectator = {} as RenderTargetWrapper;
        const camera = {
            _resizeOrCreateMultiviewTexture: vi.fn(),
            _multiviewTexture: {},
            _rigCameras: [{ outputRenderTarget: left }, { outputRenderTarget: right }, {}],
            outputRenderTarget: spectator,
        };
        const final = vi.fn();
        const engine = { getRenderWidth: () => 16, getRenderHeight: () => 16, setViewport: vi.fn() };
        const scene = { getEngine: () => engine, _multiviewSceneUbo: {}, _renderForCamera: vi.fn(), postProcessManager: { _prepareFrame: vi.fn(), _finalizeFrame: final } };
        Scene.prototype._renderMultiviewToSingleView.call(scene as unknown as Scene, camera as unknown as FreeCamera);
        expect(final.mock.calls.map((args) => args[1])).toEqual([target, target, undefined]);
        expect(camera.outputRenderTarget).toBe(spectator);
    });

    it("composes the camera pre-pass into its eye unless a subsequent process owns the destination", () => {
        const { engine, scene, right, target, pp } = setup();
        scene.activeCamera.outputRenderTarget = right;
        const input = {} as RenderTargetWrapper;
        const chain = Object.assign({}, pp, { activate: vi.fn() });
        const prepass: PrePassRenderer = Object.assign(Object.create(PrePassRenderer.prototype), {
            _scene: scene,
            _engine: engine,
            _enabled: true,
            _currentTarget: { enabled: true, _beforeCompositionPostProcesses: [chain] },
            _postProcessesSourceForThisPass: [],
        });
        Object.assign(scene.activeCamera, { _postProcesses: [] });
        prepass._afterDraw();
        expect(engine.restoreDefaultFramebuffer).not.toHaveBeenCalled();
        expect(engine.bindFramebuffer).toHaveBeenCalledExactlyOnceWith(target, undefined, undefined, undefined, true, 0, 1);

        Object.assign(prepass, { _postProcessesSourceForThisPass: [{ inputTexture: input }] });
        prepass._afterDraw(0, 2);
        expect(engine.bindFramebuffer).toHaveBeenLastCalledWith(input, 0, undefined, undefined, false, 0);

        Object.assign(prepass, {
            _currentTarget: { enabled: true, _beforeCompositionPostProcesses: [chain], renderTargetTexture: right },
            _postProcessesSourceForThisPass: [{ inputTexture: target }],
        });
        vi.spyOn(right, "_prepareFrame").mockImplementation(() => {});
        prepass._afterDraw(0, 2);
        expect(engine.bindFramebuffer).toHaveBeenLastCalledWith(target, undefined, undefined, undefined, false, 0, 2);
    });

    it.each([
        [false, false],
        [false, true],
        [true, false],
        [true, true],
    ])("clears each eye before its terminal draw and overlay (ignoreCameraViewport=%s, camera chain=%s)", (fullscreen, cameraChain) => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const overlay = new Scene(engine);
        try {
            const camera = new FreeCamera("eye", Vector3.Zero(), scene);
            camera.viewport.width = 0.5;
            const binds = vi.spyOn(engine, "bindFramebuffer");
            const events: string[] = [];
            const chain = {
                activate: vi.fn(),
                isReady: () => true,
                apply: () => {
                    events.push("main");
                    return null;
                },
            };
            const prepass: PrePassRenderer = Object.assign(Object.create(PrePassRenderer.prototype), {
                _scene: scene,
                _engine: engine,
                _enabled: true,
                _currentTarget: { enabled: true, _beforeCompositionPostProcesses: [chain] },
                _postProcessesSourceForThisPass: [],
            });
            for (const layer of [0, 1]) {
                const eye = new WebXRLayerRenderTargetTexture("eye", { width: 8, height: 8, layers: 2 }, scene, false);
                eye.layerIndex = layer;
                eye.ignoreCameraViewport = fullscreen;
                camera.outputRenderTarget = eye;
                // The XR provider clears once per eye per frame, across main and utility scenes.
                let cleared = false;
                eye.onClearObservable.add(() => {
                    if (!cleared) {
                        events.push("clear");
                        cleared = true;
                    }
                });
                binds.mockClear();
                if (cameraChain) {
                    scene.postProcessManager._finalizeFrame(false, eye.renderTarget!, undefined, [chain as unknown as PostProcess], false, undefined, true);
                } else {
                    prepass._afterDraw();
                }
                expect(binds).toHaveBeenCalledExactlyOnceWith(eye.renderTarget, undefined, undefined, undefined, fullscreen, 0, layer);
                overlay._bindFrameBuffer(camera);
                events.push("overlay");
            }
            expect(events).toEqual(["clear", "main", "overlay", "clear", "main", "overlay"]);
        } finally {
            overlay.dispose();
            scene.dispose();
            engine.dispose();
        }
    });

    it.each([false, true])("defers the presentation clear until the terminal pass is ready (camera chain=%s)", (cameraChain) => {
        const { scene, left, target, manager } = setup();
        const bind = vi.spyOn(scene, "_bindFrameBuffer");
        const pass = { apply: () => null, isReady: vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true) } as unknown as PostProcess;
        for (let frame = 0; frame < 2; ++frame) {
            if (cameraChain) {
                manager._finalizeFrame(false, target, undefined, [pass], false, undefined, true);
            } else {
                manager._directRender([pass], target, left, true);
            }
        }
        expect(bind.mock.calls).toEqual([
            [scene.activeCamera, false],
            [scene.activeCamera, true],
        ]);
    });

    it.each([false, true])("falls back to canvas for missing or multiview targets (composition=%s)", (compose) => {
        const { engine, scene, right, target } = setup();
        const chain = { activate: vi.fn(), apply: () => null, isReady: () => false };
        const prepass: PrePassRenderer = Object.assign(Object.create(PrePassRenderer.prototype), {
            _scene: scene,
            _engine: engine,
            _enabled: true,
            _currentTarget: { enabled: true, _beforeCompositionPostProcesses: compose ? [chain] : [] },
            _postProcessesSourceForThisPass: [],
        });
        scene.activeCamera.outputRenderTarget = right;
        Object.assign(right, { _renderTarget: null });
        prepass._afterDraw();
        expect(engine.restoreDefaultFramebuffer).toHaveBeenCalledTimes(1);
        Object.assign(right, { _renderTarget: target });
        prepass._afterDraw();
        expect(engine.bindFramebuffer).toHaveBeenCalledExactlyOnceWith(target, undefined, undefined, undefined, true, 0, 1);
        Object.assign(scene.activeCamera, { _multiviewTexture: right });
        prepass._afterDraw();
        Object.assign(scene.activeCamera, { _multiviewTexture: null });
        vi.spyOn(right, "getViewCount").mockReturnValue(2);
        prepass._afterDraw();
        expect(engine.restoreDefaultFramebuffer).toHaveBeenCalledTimes(3);
        expect(engine.bindFramebuffer).toHaveBeenCalledTimes(1);
    });
});
