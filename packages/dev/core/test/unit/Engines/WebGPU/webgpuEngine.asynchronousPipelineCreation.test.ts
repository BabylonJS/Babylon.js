import { afterEach, beforeEach, describe, it, expect, onTestFinished, vi } from "vitest";
import { FreeCamera } from "core/Cameras/freeCamera";
import { GPUPicker } from "core/Collisions/gpuPicker";
import { Constants } from "core/Engines/constants";
import { NullEngine } from "core/Engines/nullEngine";
import { WebGPUEngine } from "core/Engines/webgpuEngine.pure";
import { WebGPUBundleList } from "core/Engines/WebGPU/webgpuBundleList";
import { WebGPUDrawContext } from "core/Engines/WebGPU/webgpuDrawContext";
import {
    ApplyWebGPURenderPassDrawCommand,
    CreateWebGPURenderPassIndexedDrawCommand,
    CreateWebGPURenderPassNonIndexedDrawCommand,
    type IWebGPURenderPassDrawCommand,
} from "core/Engines/WebGPU/webgpuRenderPassCommandStream";
import { WebGPUSnapshotRendering } from "core/Engines/WebGPU/webgpuSnapshotRendering";
import { type FrameGraph } from "core/FrameGraph/frameGraph";
import { FrameGraphRenderContext } from "core/FrameGraph/frameGraphRenderContext";
import { FrameGraphTextureManager } from "core/FrameGraph/frameGraphTextureManager";
import { DrawWrapper } from "core/Materials/drawWrapper";
import { Effect } from "core/Materials/effect";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { Matrix, Vector3 } from "core/Maths/math.vector";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { MeshUVSpaceRenderer } from "core/Meshes/meshUVSpaceRenderer";
import { Observable } from "core/Misc/observable";
import { _IblShadowsVoxelRenderer } from "core/Rendering/IBLShadows/iblShadowsVoxelRenderer";
import { ObjectRenderer } from "core/Rendering/objectRenderer";
import { Scene } from "core/scene";
import { type Nullable } from "core/types";
import "core/Materials/standardMaterial";
import "core/Rendering/boundingBoxRenderer";
import "core/Shaders/default.fragment";
import "core/Shaders/default.vertex";

/**
 * Asynchronous pipeline creation, through the engine's own draw path: WebGPUEngine.drawElementsType (_draw, _omitDraw), beginFrame,
 * endFrame and the end of each render pass, with the engine's snapshot rendering and bundle list. Only the GPU is replaced: the passes
 * and bundle encoders record the pipelines they draw with, and the pipeline cache creates a pipeline asynchronously as the real one
 * does (one creation per configuration, cached once it completes), but completes it when the test says so.
 */

type WaitOwner = { _pipelinePendingFrameId: number; _pipelineDrawnFrameId: number };

// a render pass or a render bundle encoder: the labels of the pipelines it draws with, in order
class GpuRecorder {
    public draws: string[] = [];
    private _pipeline: { label: string } = { label: "" };

    public constructor(private _onEnd?: (draws: string[]) => void) {}

    public setPipeline(pipeline: { label: string }) {
        this._pipeline = pipeline;
    }
    public setIndexBuffer() {}
    public setVertexBuffer() {}
    public setBindGroup() {}
    public drawIndexed() {
        this.draws.push(this._pipeline.label);
    }
    public draw() {
        this.draws.push(this._pipeline.label);
    }
    public executeBundles(bundles: Array<{ draws: string[] }>) {
        for (const bundle of bundles) {
            this.draws.push(...bundle.draws);
        }
    }
    public finish() {
        return { draws: this.draws.slice() };
    }
    public end() {
        this._onEnd?.(this.draws);
    }
}

// the render pipeline cache, by pipeline configuration (here the effect): tryGetRenderPipeline starts one asynchronous creation per
// configuration and returns null until it completes, getRenderPipeline creates the pipeline synchronously
class PipelineCache {
    public lastPendingPipeline: Nullable<Promise<GPURenderPipeline>> = null;
    public vertexBuffers = [];
    public indexBuffer = null;
    public colorFormats = ["bgra8unorm"];
    // the configurations created synchronously, in a frame
    public synchronous: string[] = [];
    private _created = new Map<string, GPURenderPipeline>();
    private _pending = new Map<string, { promise: Promise<GPURenderPipeline>; resolve: (pipeline: GPURenderPipeline) => void }>();

    public tryGetRenderPipeline(_fillMode: number, effect: { key: string }): Nullable<GPURenderPipeline> {
        const created = this._created.get(effect.key);
        if (created) {
            return created;
        }
        let pending = this._pending.get(effect.key);
        if (!pending) {
            let resolve!: (pipeline: GPURenderPipeline) => void;
            const promise = new Promise<GPURenderPipeline>((ok) => (resolve = ok));
            pending = { promise, resolve };
            this._pending.set(effect.key, pending);
        }
        this.lastPendingPipeline = pending.promise;
        return null;
    }

    public getRenderPipeline(_fillMode: number, effect: { key: string }): GPURenderPipeline {
        let pipeline = this._created.get(effect.key);
        if (!pipeline) {
            pipeline = this._pipeline(effect.key);
            this.synchronous.push(effect.key);
        }
        return pipeline;
    }

    // pipelines created before the frames of the test (by preWarmPipeline, say)
    public prepare(...keys: string[]): void {
        for (const key of keys) {
            this._pipeline(key);
        }
    }

    // the asynchronous creation of a configuration completes: the pipeline is cached, then the creation's promise resolves
    public async completeAsync(key: string): Promise<void> {
        const pending = this._pending.get(key)!;
        this._pending.delete(key);
        pending.resolve(this._pipeline(key));
        await pending.promise;
    }

    // every asynchronous creation in progress completes
    public async completeAllAsync(): Promise<void> {
        for (const key of Array.from(this._pending.keys())) {
            await this.completeAsync(key);
        }
    }

    public endFrame(): void {}

    // the creations its engine waits for are not counted here (see the real cache's tests)
    public _forgetAwaitedPipelines(): void {}

    private _pipeline(key: string): GPURenderPipeline {
        const pipeline = { label: key } as unknown as GPURenderPipeline;
        this._created.set(key, pipeline);
        return pipeline;
    }
}

function CreateEngine(compatibilityMode: boolean) {
    // the passes the GPU ran, each with the pipelines of its draws
    const passes: string[][] = [];
    const device = { createRenderBundleEncoder: () => new GpuRecorder() } as unknown as GPUDevice;
    const engine = Object.create(WebGPUEngine.prototype);
    const bundleList = new WebGPUBundleList(device);
    const counters = () => ({ numEnableEffects: 0, numEnableDrawWrapper: 0, numBundleCreationNonCompatMode: 0, numBundleReuseNonCompatMode: 0 });
    Object.assign(engine, {
        // what the engine's constructor and field initializers set up (Object.create runs neither)
        compatibilityMode,
        asynchronousPipelineCreation: true,
        _drawsMayWait: true,
        _renderingOnce: 0,
        _pipelineWaitOwner: null,
        _frameId: 0,
        _device: device,
        _bundleList: bundleList,
        _snapshotRendering: new WebGPUSnapshotRendering(engine, Constants.SNAPSHOTRENDERING_STANDARD, bundleList),
        _snapshotPendingPipelines: new Set(),
        _snapshotRecordAgain: false,
        _snapshotHeldBack: false,
        _pendingPipelinesGeneration: 0,
        _lastPipelineWaitFrameId: -Infinity,
        _cacheRenderPipeline: new PipelineCache(),
        _cacheBindGroups: {
            getBindGroups: (_context: unknown, drawContext: WebGPUDrawContext, materialContext: { updateId: number }) => {
                drawContext.resetIsDirty(materialContext.updateId);
                return [];
            },
            endFrame: () => {},
        },
        _currentMaterialContext: { useVertexPulling: false, updateId: 1, isDirty: false, forceBindGroupCreation: false, hasFloatOrDepthTextures: false, textureState: 0 },
        _currentRenderTarget: null,
        _currentRenderPass: null,
        _currentIndexBuffer: { is32Bits: false, underlyingResource: {} },
        _currentVertexBuffers: {},
        _currentOverrideVertexBuffers: null,
        _counters: counters(),
        countersLastFrame: counters(),
        _scratchIndexedDrawCommand: CreateWebGPURenderPassIndexedDrawCommand(),
        _scratchNonIndexedDrawCommand: CreateWebGPURenderPassNonIndexedDrawCommand(),
        // the draws of the compatibility mode reach their pass in order
        _renderPassDrawBatcher: { submit: (command: IWebGPURenderPassDrawCommand) => ApplyWebGPURenderPassDrawCommand(command) },
        _timestampQuery: { endPass: () => {}, endFrame: () => {} },
        _timestampIndex: 0,
        _internalFrameCounter: 0,
        _textureHelper: { destroyDeferredTextures: () => {} },
        _bufferManager: { destroyDeferredBuffers: () => {} },
        onBeginFrameObservable: new Observable(),
        onEndFrameObservable: new Observable(),
        // the steps that only talk to the GPU: states, uniform bindings, viewports, debug markers, the submission
        _measureFps: () => {},
        applyStates: () => {},
        bindUniformBufferBase: () => {},
        _applyRenderPassChanges: () => {},
        _flushRenderPassCommands: () => {},
        _debugPopBeforeEndOfEncoder: () => {},
        _debugPendingPop: () => {},
        _currentPassIsMainPass: () => true,
        flushFramebuffer: () => {},
        // a render pass begins at its clear (or its first draw) and gives the GPU its draws when it ends
        _getCurrentRenderPass: () => (engine._currentRenderPass ??= new GpuRecorder((draws) => passes.push(draws))),
    });

    const effects = new Map<string, unknown>();
    const effect = (key: string) => {
        if (!effects.has(key)) {
            effects.set(key, { key, _pipelineContext: { uniformBuffer: null, shaderProcessingContext: { textureNames: [], bufferNames: [] } } });
        }
        return effects.get(key);
    };

    return {
        engine,
        cache: engine._cacheRenderPipeline as PipelineCache,
        // a draw as Mesh._processRendering submits it (the mesh's owner, and the draw context its material gives it), or any other draw
        draw: (owner: Nullable<WaitOwner>, drawContext: WebGPUDrawContext, key: string) => {
            engine._pipelineWaitOwner = owner;
            engine._currentDrawContext = drawContext;
            engine._currentEffect = effect(key);
            engine.drawElementsType(Constants.MATERIAL_TriangleFillMode, 0, 36);
            engine._pipelineWaitOwner = null;
        },
        // a frame: each function draws one render pass; returns what each pass drew on the GPU
        frame: (...renderPasses: Array<() => void>): string[][] => {
            const first = passes.length;
            engine.beginFrame();
            for (const renderPass of renderPasses) {
                engine._getCurrentRenderPass();
                renderPass();
                engine._endCurrentRenderPass();
            }
            engine.endFrame();
            return passes.slice(first);
        },
    };
}

// a draw context as the engine creates them
const NewDrawContext = () => new WebGPUDrawContext({} as any, {} as any);

describe("WebGPUEngine asynchronous pipeline creation, through the draw path", () => {
    // the draw contexts come from the scene's objects (the sub mesh of a mesh, a material, the draw wrapper of a post-process), which
    // create them as the engine creates them
    let nullEngine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        nullEngine = new NullEngine();
        vi.spyOn(nullEngine, "createDrawContext").mockImplementation(() => NewDrawContext());
        scene = new Scene(nullEngine);
    });

    afterEach(() => {
        scene.dispose();
        nullEngine.dispose();
    });

    // a mesh: the owner Mesh._processRendering gives its draws, and the draw context of its sub mesh in a pass
    const newMesh = (name: string) => {
        const mesh = MeshBuilder.CreateBox(name, {}, scene);
        return {
            mesh,
            owner: mesh._internalAbstractMeshDataInfo,
            context: (pass: number) => mesh.subMeshes[0]._getDrawWrapper(pass, true)!.drawContext as WebGPUDrawContext,
        };
    };
    // the draw context of a draw that is no mesh's: a post-process, say
    const otherContext = () => new DrawWrapper(nullEngine).drawContext as WebGPUDrawContext;

    it("omits a mesh in all its passes until its pipelines are created, then draws it in all of them in the same frame", async () => {
        const { cache, draw, frame } = CreateEngine(true);
        const box = newMesh("box");
        const shadowPass = nullEngine.createRenderPassId("shadow map");
        const post = otherContext();
        const passes = [
            () => draw(box.owner, box.context(shadowPass), "box/shadow"),
            () => {
                draw(box.owner, box.context(Constants.RENDERPASS_MAIN), "box/main");
                draw(null, post, "post");
            },
        ];

        expect(frame(...passes)).toEqual([[], ["post"]]);
        await cache.completeAsync("box/shadow");
        // the main pass still waits, and the shadow pass waits with it
        expect(frame(...passes)).toEqual([[], ["post"]]);
        await cache.completeAsync("box/main");
        // the frame after the last wait holds the mesh back too: a pass drawn before the wait would have shown it alone
        expect(frame(...passes)).toEqual([[], ["post"]]);
        expect(frame(...passes)).toEqual([["box/shadow"], ["box/main", "post"]]);
        // no pipeline of the mesh was created in a frame; the post-process's was
        expect(cache.synchronous).toEqual(["post"]);
    });

    it("holds back the cached bundle of a pass while another pass of its mesh waits (non-compatibility mode)", async () => {
        const { engine, cache, draw, frame } = CreateEngine(false);
        const box = newMesh("box");
        const shadow = box.context(nullEngine.createRenderPassId("shadow map"));
        const main = box.context(Constants.RENDERPASS_MAIN);
        let shadowEffect = "box/shadow";
        const passes = [() => draw(box.owner, shadow, shadowEffect), () => draw(box.owner, main, "box/main")];
        cache.prepare("box/shadow", "box/main");
        expect(frame(...passes)).toEqual([["box/shadow"], ["box/main"]]);
        expect(frame(...passes)).toEqual([["box/shadow"], ["box/main"]]);
        expect(engine.countersLastFrame.numBundleReuseNonCompatMode).toBe(2);

        // the shadow pass needs a new pipeline: a new effect resets its draw context, as enableEffect does
        shadowEffect = "box/shadow2";
        shadow.reset();
        // the main pass has its bundle, but does not draw it without the shadow pass
        expect(frame(...passes)).toEqual([[], []]);
        expect(engine.countersLastFrame.numBundleReuseNonCompatMode).toBe(0);
        await cache.completeAsync("box/shadow2");
        expect(frame(...passes)).toEqual([[], []]);
        expect(frame(...passes)).toEqual([["box/shadow2"], ["box/main"]]);
        // the main pass drew its cached bundle
        expect(engine.countersLastFrame.numBundleReuseNonCompatMode).toBe(1);
    });

    it("holds back the draw of each mesh that draws with its material's draw context, by its own owner", async () => {
        const { cache, draw, frame } = CreateEngine(true);
        // ShaderMaterial(..., false): its two meshes draw with its draw context; their shadow passes with their sub meshes'
        const material = new ShaderMaterial("shader", scene, { vertexSource: "", fragmentSource: "" }, {}, false)._getDrawWrapper().drawContext as WebGPUDrawContext;
        const first = newMesh("first");
        const second = newMesh("second");
        const shadowPass = nullEngine.createRenderPassId("shadow map");
        const passes = [
            () => {
                draw(first.owner, first.context(shadowPass), "first/shadow");
                draw(second.owner, second.context(shadowPass), "second/shadow");
            },
            () => {
                draw(first.owner, material, "material/main");
                draw(second.owner, material, "material/main");
            },
        ];
        cache.prepare("second/shadow", "material/main");

        // the first mesh waits in its shadow pass, so its main draw waits with it; the second mesh is drawn
        expect(frame(...passes)).toEqual([["second/shadow"], ["material/main"]]);
        await cache.completeAsync("first/shadow");
        expect(frame(...passes)).toEqual([["second/shadow"], ["material/main"]]);
        expect(frame(...passes)).toEqual([
            ["first/shadow", "second/shadow"],
            ["material/main", "material/main"],
        ]);
    });

    it("creates in the frame the pipelines of the draws that never wait: without an owner, or in a pass rendered once", () => {
        const { engine, cache, draw, frame } = CreateEngine(true);
        const box = newMesh("box");
        const post = otherContext();
        const oncePass = nullEngine.createRenderPassId("render target rendered once");

        // the mesh waits in a pass of the frame; a post-process draws; a render target rendered once draws the mesh
        const passes = [
            () => {
                draw(box.owner, box.context(Constants.RENDERPASS_MAIN), "box/main");
                draw(null, post, "post");
            },
            () => {
                engine._drawsMayWait = false;
                draw(box.owner, box.context(oncePass), "box/once");
                engine._drawsMayWait = true;
            },
        ];
        expect(frame(...passes)).toEqual([["post"], ["box/once"]]);
        expect(cache.synchronous).toEqual(["post", "box/once"]);
    });

    // a shadow map refreshed every 4 frames, drawn before the main pass: its object renderer decides whether it renders in a frame
    // (ObjectRenderer.shouldRender, on the engine of the test), and between two renders it keeps what it drew last. A frame returns what
    // the shadow map holds, what the main pass drew, and whether the shadow map rendered
    const shadowMapEveryFourFrames = ({ engine, draw, frame }: ReturnType<typeof CreateEngine>, box: ReturnType<typeof newMesh>) => {
        const renderer = new ObjectRenderer("shadow map", scene);
        renderer.refreshRate = 4;
        const internals = renderer as unknown as { _engine: unknown };
        const shouldRender = () => {
            const sceneEngine = internals._engine;
            internals._engine = engine;
            try {
                return renderer.shouldRender();
            } finally {
                internals._engine = sceneEngine;
            }
        };
        const shadow = box.context(renderer.renderPassId);
        const main = box.context(Constants.RENDERPASS_MAIN);
        let held: string[] = [];
        return () => {
            const renders = shouldRender();
            const passes = frame(...(renders ? [() => draw(box.owner, shadow, "box/shadow")] : []), () => draw(box.owner, main, "box/main"));
            if (renders) {
                held = passes[0];
            }
            return [held, passes[passes.length - 1], renders];
        };
    };

    it("renders a shadow map refreshed every 4 frames in every frame while its mesh waits there, so the main pass never shows the mesh without it", async () => {
        const harness = CreateEngine(true);
        const render = shadowMapEveryFourFrames(harness, newMesh("box"));
        harness.cache.prepare("box/main");

        expect(render()).toEqual([[], [], true]);
        expect(render()).toEqual([[], [], true]);
        await harness.cache.completeAsync("box/shadow");
        expect(render()).toEqual([[], [], true]);
        // the mesh is drawn in both passes in the same frame, then the shadow map goes back to its rate
        expect(render()).toEqual([["box/shadow"], ["box/main"], true]);
        expect(render()).toEqual([["box/shadow"], ["box/main"], true]);
        for (let i = 0; i < 3; i++) {
            expect(render()).toEqual([["box/shadow"], ["box/main"], false]);
        }
        expect(render()).toEqual([["box/shadow"], ["box/main"], true]);
    });

    it("renders a shadow map refreshed every 4 frames in every frame while its mesh waits in the main pass, so it does not keep the shadow of a held back mesh", async () => {
        const harness = CreateEngine(true);
        const render = shadowMapEveryFourFrames(harness, newMesh("box"));
        harness.cache.prepare("box/shadow");

        // the frame of the first wait: the shadow map rendered before it, so it shows the mesh alone (the documented limitation)
        expect(render()).toEqual([["box/shadow"], [], true]);
        // from the next frame on, the shadow map renders in every frame and holds the mesh back with the main pass
        expect(render()).toEqual([[], [], true]);
        await harness.cache.completeAsync("box/main");
        expect(render()).toEqual([[], [], true]);
        expect(render()).toEqual([["box/shadow"], ["box/main"], true]);
        expect(render()).toEqual([["box/shadow"], ["box/main"], true]);
        for (let i = 0; i < 3; i++) {
            expect(render()).toEqual([["box/shadow"], ["box/main"], false]);
        }
        expect(render()).toEqual([["box/shadow"], ["box/main"], true]);
    });

    // the scene's frame graph runs the given passes (only what the scene asks of a graph: the scene's frame sets the graph's scope as for
    // any graph), and the box's draws, from the scene's own code, reach the engine of the test with the owner Mesh._processRendering
    // gives them and whether their pass lets them wait, one pipeline configuration per target ("box/<name>"). The two engines act as one:
    // the scene reads the frame and the last wait of the test's engine. A frame returns what each target holds: what it drew the last
    // time it rendered
    const graphFrames = (
        harness: ReturnType<typeof CreateEngine>,
        box: ReturnType<typeof newMesh>,
        targets: Array<[name: string, target: ObjectRenderer | RenderTargetTexture]>,
        execute: (context: FrameGraphRenderContext) => void
    ) => {
        const engine = harness.engine;
        const names = new Map(targets.map(([name, target]) => [target.renderPassId, name]));
        vi.spyOn(nullEngine, "drawElementsType").mockImplementation(() => {
            const pass = nullEngine.currentRenderPassId;
            engine._drawsMayWait = nullEngine._drawsMayWait;
            harness.draw(nullEngine._pipelineWaitOwner, box.context(pass), `box/${names.get(pass)}`);
            nullEngine._lastPipelineWaitFrameId = engine._lastPipelineWaitFrameId;
        });
        const context = new FrameGraphRenderContext(nullEngine, new FrameGraphTextureManager(nullEngine, false, scene), scene);
        scene.frameGraph = { execute: () => execute(context), getTasksByClassName: () => [], findMainCamera: () => null } as unknown as FrameGraph;
        const held: string[][] = targets.map(() => []);
        const rendered = new Set<number>();
        for (let index = 0; index < targets.length; index++) {
            targets[index][1].onBeforeRenderObservable.add(() => rendered.add(index));
        }
        return () => {
            rendered.clear();
            const [draws] = harness.frame(() => {
                (nullEngine as unknown as { _frameId: number })._frameId = engine.frameId;
                scene.render();
            });
            for (const index of rendered) {
                held[index] = draws.filter((draw) => draw === `box/${targets[index][0]}`);
            }
            return held.slice();
        };
    };

    // the passes are ready to draw (their effects are compiled), as a scene waits for its passes
    const readyAsync = async (isReady: () => boolean) => {
        for (let i = 0; i < 50 && !isReady(); i++) {
            await new Promise((resolve) => setTimeout(resolve, 0));
        }
        expect(isReady()).toBe(true);
    };

    it("draws every mesh in the only render of a frame graph object renderer rendered once, and keeps it once the creations complete", async () => {
        const harness = CreateEngine(true);
        const box = newMesh("box");
        const camera = new FreeCamera("camera", new Vector3(0, 0, -5), scene);
        const renderer = (name: string, refreshRate: number) => {
            const objectRenderer = new ObjectRenderer(name, scene);
            objectRenderer.refreshRate = refreshRate;
            objectRenderer.renderList = [box.mesh];
            objectRenderer.activeCamera = camera;
            return objectRenderer;
        };
        // the graph renders an object renderer rendered once, one refreshed every 4 frames, then the main pass
        const once = renderer("once", ObjectRenderer.REFRESHRATE_RENDER_ONCE);
        const everyFour = renderer("every4", 4);
        const main = renderer("main", ObjectRenderer.REFRESHRATE_RENDER_ONEVERYFRAME);
        const frame = graphFrames(
            harness,
            box,
            [
                ["once", once],
                ["every4", everyFour],
                ["main", main],
            ],
            (context) => {
                for (const objectRenderer of [once, everyFour, main]) {
                    context.render(objectRenderer, 32, 32);
                }
            }
        );
        await readyAsync(() => once.isReadyForRendering(32, 32) && everyFour.isReadyForRendering(32, 32) && main.isReadyForRendering(32, 32));

        // the renderer rendered once draws the box, creating its pipeline in the frame; the box waits in the other passes
        expect(frame()).toEqual([["box/once"], [], []]);
        await harness.cache.completeAllAsync();
        // the renderer refreshed every 4 frames renders in every frame, and shows the box in the same frame as the main pass
        expect(frame()).toEqual([["box/once"], [], []]);
        expect(frame()).toEqual([["box/once"], ["box/every4"], ["box/main"]]);
        for (let i = 0; i < 6; i++) {
            expect(frame()).toEqual([["box/once"], ["box/every4"], ["box/main"]]);
        }
        expect(harness.cache.synchronous).toEqual(["box/once"]);
    });

    it("draws every mesh in a voxelization of IBL shadows advanced by the frame graph, which nothing renders again, and keeps the grid", async () => {
        const harness = CreateEngine(true);
        const box = newMesh("box");
        const main = new ObjectRenderer("main", scene);
        main.renderList = [box.mesh];
        main.activeCamera = new FreeCamera("camera", new Vector3(0, 0, -5), scene);
        // the voxel renderer, with its GPU resources replaced: the render targets of one slab (one axis), a grid, no mips
        const slab = new RenderTargetTexture("voxel slab", 8, scene);
        const voxels = Object.create(_IblShadowsVoxelRenderer.prototype) as _IblShadowsVoxelRenderer;
        Object.assign(voxels, {
            _scene: scene,
            _engine: nullEngine,
            _maxDrawBuffers: 4,
            _voxelResolution: 4,
            _triPlanarVoxelization: false,
            _voxelGridZaxis: new RenderTargetTexture("voxel grid", 8, scene),
            _voxelMrtsXaxis: [],
            _voxelMrtsYaxis: [],
            _voxelMrtsZaxis: [slab],
            _renderTargets: [],
            _mipArray: [],
            _gsVoxelMaterialCache: new Map(),
            _invWorldScaleMatrix: Matrix.Identity(),
            _voxelizationInProgress: false,
            _sortSettleWaitFrames: 0,
            _copyMipEffectWrapper: { effect: { isReady: () => true } },
            onVoxelizationCompleteObservable: new Observable(),
        });
        (voxels as unknown as { _createVoxelMaterials: () => void })._createVoxelMaterials();
        // the graph's voxelization task asks for one voxelization (its refresh is manual), then advances it in each frame
        voxels.updateVoxelGrid([box.mesh], false);
        const frame = graphFrames(
            harness,
            box,
            [
                ["voxel", slab],
                ["main", main],
            ],
            (context) => {
                if (voxels.isVoxelizationInProgress()) {
                    voxels.processVoxelization();
                }
                context.render(main, 32, 32);
            }
        );
        await readyAsync(() => slab.isReadyForRendering() && main.isReadyForRendering(32, 32));

        // the grid is voxelized with the box, creating its pipeline in the frame, while the box waits in the main pass
        expect(frame()).toEqual([["box/voxel"], []]);
        expect(voxels.isVoxelizationInProgress()).toBe(false);
        await harness.cache.completeAllAsync();
        expect(frame()).toEqual([["box/voxel"], []]);
        expect(frame()).toEqual([["box/voxel"], ["box/main"]]);
        expect(harness.cache.synchronous).toEqual(["box/voxel"]);
    });

    // the scene's frame, without a frame graph: the box's draws reach the engine of the test as in graphFrames, one pipeline
    // configuration per pass ("box/main" in the camera's pass, "box/<other>" in any other). onDraw learns whether each draw reached the
    // GPU. A frame returns the draws the GPU ran, in order
    const sceneFrames = (harness: ReturnType<typeof CreateEngine>, box: ReturnType<typeof newMesh>, other: string, onDraw?: (key: string, drawn: boolean) => void) => {
        const engine = harness.engine;
        const camera = scene.activeCamera!;
        vi.spyOn(nullEngine, "drawElementsType").mockImplementation(() => {
            const pass = nullEngine.currentRenderPassId;
            const key = `box/${pass === camera.renderPassId ? "main" : other}`;
            engine._drawsMayWait = nullEngine._drawsMayWait;
            const gpuDraws = engine._getCurrentRenderPass().draws.length;
            harness.draw(nullEngine._pipelineWaitOwner, box.context(pass), key);
            nullEngine._lastPipelineWaitFrameId = engine._lastPipelineWaitFrameId;
            onDraw?.(key, engine._getCurrentRenderPass().draws.length > gpuDraws);
        });
        return () => {
            const [draws] = harness.frame(() => {
                (nullEngine as unknown as { _frameId: number })._frameId = engine.frameId;
                scene.render();
            });
            return draws;
        };
    };

    // a GPU picker of the box, seen through the camera, which the box fills. The picking target is the GPU's: it is cleared when it renders
    // (at most once in a frame), and the draws of its pass that reach the GPU write the mesh id the picker gives them (the meshID uniform)
    // in every pixel. The frames run until the request completes
    const pickBox = (harness: ReturnType<typeof CreateEngine>, box: ReturnType<typeof newMesh>) => {
        const picker = new GPUPicker();
        picker.setPickingList([box.mesh]);
        let meshId = 0;
        let pixel = 0;
        const effectSetFloat = Effect.prototype.setFloat;
        const setFloat = vi.spyOn(Effect.prototype, "setFloat").mockImplementation(function (this: Effect, name: string, value: number) {
            if (name === "meshID") {
                meshId = value;
            }
            return effectSetFloat.call(this, name, value);
        });
        onTestFinished(() => setFloat.mockRestore());
        const frame = sceneFrames(harness, box, "picking", (key, drawn) => {
            if (key === "box/picking" && drawn) {
                pixel = meshId;
            }
        });
        // the scissor of a pick is GPU state
        vi.spyOn(nullEngine, "enableScissor").mockImplementation(() => {});
        vi.spyOn(nullEngine, "disableScissor").mockImplementation(() => {});
        vi.spyOn(nullEngine, "_readTexturePixels").mockImplementation(async (_texture, width, height, _face, _level, buffer) => {
            const pixels = buffer as Uint8Array;
            for (let i = 0; i < width * height; i++) {
                pixels.set([(pixel >> 16) & 255, (pixel >> 8) & 255, pixel & 255, 255], 4 * i);
            }
            return pixels;
        });
        return {
            frame: () => {
                pixel = 0;
                return frame();
            },
            requestAsync: async <T>(request: (picker: GPUPicker) => Promise<T>): Promise<T> => {
                let result: { value: T } | undefined;
                void request(picker).then((value) => (result = { value }));
                for (let i = 0; i < 50 && !result; i++) {
                    pixel = 0;
                    frame();
                    await new Promise((resolve) => setTimeout(resolve, 0));
                }
                expect(result).toBeDefined();
                return result!.value;
            },
        };
    };

    it("draws the mesh of a GPU picking in the render of the first pick, with its picking pipeline new, through the scene's render targets", async () => {
        const harness = CreateEngine(true);
        const box = newMesh("box");
        new FreeCamera("camera", new Vector3(0, 0, -0.8), scene);
        const picking = pickBox(harness, box);

        // the picking pipeline and the main one are new: the picker reads a render with the box, whose pipeline it created in the frame
        const picked = await picking.requestAsync(async (picker) => await picker.pickAsync(256, 128));
        expect(picked?.mesh).toBe(box.mesh);
        expect(harness.cache.synchronous).toEqual(["box/picking"]);
    });

    it("draws the meshes of a GPU multi-picking while they wait in the camera's pass, with their picking pipeline new, then created", async () => {
        const harness = CreateEngine(true);
        const box = newMesh("box");
        new FreeCamera("camera", new Vector3(0, 0, -0.8), scene);
        const picking = pickBox(harness, box);
        const points = [
            { x: 200, y: 100 },
            { x: 300, y: 150 },
        ];

        // the box already waits in the camera's pass, from the frames before the first request
        await readyAsync(() => scene.isReady());
        expect(picking.frame()).toEqual([]);
        const first = await picking.requestAsync(async (picker) => await picker.multiPickAsync(points));
        expect(first?.meshes).toEqual([box.mesh, box.mesh]);
        // the next request finds the picking pipeline created and the box still waiting in the camera's pass: it is not held back
        const second = await picking.requestAsync(async (picker) => await picker.multiPickAsync(points));
        expect(second?.meshes).toEqual([box.mesh, box.mesh]);
        expect(harness.cache.synchronous).toEqual(["box/picking"]);
    });

    it("draws every mesh in a render target rendered by a direct call from the camera's pass (a decal of MeshUVSpaceRenderer), which nothing renders again", async () => {
        const harness = CreateEngine(true);
        const box = newMesh("box");
        new FreeCamera("camera", new Vector3(0, 0, -5), scene);
        const decals = new MeshUVSpaceRenderer(box.mesh, scene, { width: 32, height: 32 });
        const decal = new RenderTargetTexture("decal", 8, scene);
        await readyAsync(() => decals.isReady() && scene.isReady());
        const frame = sceneFrames(harness, box, "decal");

        // the decal is stamped from an observer of the camera's pass (the target's refresh rate is 1, but only this call renders it)
        scene.onBeforeCameraRenderObservable.addOnce(() => decals.renderTexture(decal, Vector3.Zero(), new Vector3(0, 0, 1), new Vector3(1, 1, 1)));
        expect(frame()).toEqual(["box/decal"]);
        await harness.cache.completeAllAsync();
        expect(frame()).toEqual([]);
        expect(frame()).toEqual(["box/main"]);
        expect(harness.cache.synchronous).toEqual(["box/decal"]);
    });

    it("draws the bounding box of an occlusion query while its mesh waits, in a FAST snapshot's recording and in its replays", async () => {
        // the bounding box of an occlusion query draws with a draw wrapper of its mesh's sub mesh, for the query's own pass
        // (BoundingBoxRenderer.renderOcclusionBoundingBox): the renderer creates it, and then draws once its shader is ready
        const box = newMesh("box");
        const renderer = scene.getBoundingBoxRenderer();
        const drawn = vi.spyOn(nullEngine, "drawElementsType");
        for (let i = 0; i < 20 && drawn.mock.calls.length === 0; i++) {
            renderer.renderOcclusionBoundingBox(box.mesh);
            await new Promise((resolve) => setTimeout(resolve, 0));
        }
        expect(drawn).toHaveBeenCalled();
        const queryContext = box.context((renderer as any)._renderPassIdForOcclusionQuery);

        const { engine, cache, draw, frame } = CreateEngine(true);
        engine._snapshotRendering.mode = Constants.SNAPSHOTRENDERING_FAST;
        engine._snapshotRendering.enabled = true;
        // the frame the snapshot records: the query's bounding box, then its mesh, whose pipeline is created asynchronously
        const recorded = () => {
            draw(null, queryContext, "query/box");
            draw(box.owner, box.context(Constants.RENDERPASS_MAIN), "box/main");
        };

        // the query sees its bounding box though the mesh is omitted, in the recording and in the FAST replays (the scene draws nothing)
        expect(frame(recorded)).toEqual([["query/box"]]);
        expect(frame(() => {})).toEqual([["query/box"]]);
        await cache.completeAsync("box/main");
        // the mesh's pipeline is created: the snapshot is recorded again, with the mesh
        expect(frame(recorded)).toEqual([["query/box", "box/main"]]);
        expect(frame(() => {})).toEqual([["query/box", "box/main"]]);
        expect(cache.synchronous).toEqual(["query/box"]);
    });

    it("never keeps a recording that shows a mesh in some passes only, and records again once the pipelines it missed are created", async () => {
        const { engine, cache, draw, frame } = CreateEngine(true);
        engine._snapshotRendering.enabled = true;
        const box = newMesh("box");
        const depth = box.context(nullEngine.createRenderPassId("depth"));
        const main = box.context(Constants.RENDERPASS_MAIN);
        const passes = [() => draw(box.owner, depth, "box/depth"), () => draw(box.owner, main, "box/main")];
        cache.prepare("box/depth");

        // the depth pass draws the mesh before the main pass waits for its pipeline: that recording is not kept
        expect(frame(...passes)).toEqual([["box/depth"], []]);
        expect(engine._snapshotRendering.record).toBe(true);
        // recorded again, without the mesh in any pass: replayed while the pipeline is created
        expect(frame(...passes)).toEqual([[], []]);
        expect(engine._snapshotRendering.play).toBe(true);
        expect(frame(...passes)).toEqual([[], []]);
        await cache.completeAsync("box/main");
        expect(frame(...passes)).toEqual([["box/depth"], ["box/main"]]);
        expect(engine._snapshotRendering.play).toBe(true);
        expect(frame(...passes)).toEqual([["box/depth"], ["box/main"]]);
    });

    it("records again a recording that held back a mesh whose pipelines were all created", async () => {
        const { engine, cache, draw, frame } = CreateEngine(true);
        const box = newMesh("box");
        const passes = [() => draw(box.owner, box.context(Constants.RENDERPASS_MAIN), "box/main")];

        expect(frame(...passes)).toEqual([[]]);
        await cache.completeAsync("box/main");
        // the snapshot starts recording while the mesh is held back: no creation is left to ask for another recording
        engine._snapshotRendering.enabled = true;
        expect(frame(...passes)).toEqual([[]]);
        expect(engine._snapshotRendering.record).toBe(true);
        expect(frame(...passes)).toEqual([["box/main"]]);
        expect(engine._snapshotRendering.play).toBe(true);
        expect(frame(...passes)).toEqual([["box/main"]]);
    });

    it("ignores a creation that completes after the pending creations were forgotten (a lost device)", async () => {
        const { engine, cache, draw, frame } = CreateEngine(true);
        engine._snapshotRendering.enabled = true;
        const box = newMesh("box");
        const passes = [() => draw(box.owner, box.context(Constants.RENDERPASS_MAIN), "box/main")];

        expect(frame(...passes)).toEqual([[]]);
        expect(engine._snapshotRendering.play).toBe(true);
        engine._forgetPendingPipelines();
        await cache.completeAsync("box/main");
        // no new recording is asked for: the snapshot is replayed as recorded
        expect(frame(...passes)).toEqual([[]]);
        expect(engine._snapshotRendering.play).toBe(true);
    });
});
