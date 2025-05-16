/* eslint-disable import/no-internal-modules */
import type { Scene, AbstractEngine, FrameGraphTask, Nullable, NodeRenderGraph } from "core/index";
import { FrameGraphPass } from "./Passes/pass";
import { FrameGraphRenderPass } from "./Passes/renderPass";
import { FrameGraphCullPass } from "./Passes/cullPass";
import { FrameGraphRenderContext } from "./frameGraphRenderContext";
import { FrameGraphContext } from "./frameGraphContext";
import { FrameGraphTextureManager } from "./frameGraphTextureManager";
import { Observable } from "core/Misc/observable";
import { _RetryWithInterval } from "core/Misc/timingTools";
import { Logger } from "core/Misc/logger";

enum FrameGraphPassType {
    Normal = 0,
    Render = 1,
    Cull = 2,
}

/**
 * Class used to implement a frame graph
 * @experimental
 */
export class FrameGraph {
    /**
     * Gets the texture manager used by the frame graph
     */
    public readonly textureManager: FrameGraphTextureManager;

    private readonly _engine: AbstractEngine;
    private readonly _scene: Scene;
    private readonly _tasks: FrameGraphTask[] = [];
    private readonly _passContext: FrameGraphContext;
    private readonly _renderContext: FrameGraphRenderContext;
    private _currentProcessedTask: FrameGraphTask | null = null;
    private _whenReadyAsyncCancel: Nullable<() => void> = null;

    /**
     * Name of the frame graph
     */
    public name = "Frame Graph";

    /**
     * Gets or sets a boolean indicating that texture allocation should be optimized (that is, reuse existing textures when possible to limit GPU memory usage) (default: true)
     */
    public optimizeTextureAllocation = true;

    /**
     * Observable raised when the node render graph is built
     */
    public onBuildObservable = new Observable<FrameGraph>();

    /**
     * Gets the engine used by the frame graph
     */
    public get engine() {
        return this._engine;
    }

    /**
     * Gets the scene used by the frame graph
     */
    public get scene() {
        return this._scene;
    }

    /**
     * Gets the list of tasks in the frame graph
     */
    public get tasks() {
        return this._tasks;
    }

    /**
     * Gets the node render graph linked to the frame graph (if any)
     * @returns the linked node render graph or null if none
     */
    public getLinkedNodeRenderGraph(): Nullable<NodeRenderGraph> {
        return this._linkedNodeRenderGraph;
    }

    /**
     * Constructs the frame graph
     * @param scene defines the scene the frame graph is associated with
     * @param debugTextures defines a boolean indicating that textures created by the frame graph should be visible in the inspector (default is false)
     * @param _linkedNodeRenderGraph defines the linked node render graph (if any)
     */
    constructor(
        scene: Scene,
        debugTextures = false,
        private readonly _linkedNodeRenderGraph: Nullable<NodeRenderGraph> = null
    ) {
        this._scene = scene;
        this._engine = scene.getEngine();
        this.textureManager = new FrameGraphTextureManager(this._engine, debugTextures, scene);
        this._passContext = new FrameGraphContext();
        this._renderContext = new FrameGraphRenderContext(this._engine, this.textureManager, scene);

        this._scene.frameGraphs.push(this);
    }

    /**
     * Gets the class name of the frame graph
     * @returns the class name
     */
    public getClassName() {
        return "FrameGraph";
    }

    /**
     * Gets a task by name
     * @param name Name of the task to get
     * @returns The task or undefined if not found
     */
    public getTaskByName<T extends FrameGraphTask>(name: string): T | undefined {
        return this._tasks.find((t) => t.name === name) as T;
    }

    /**
     * Adds a task to the frame graph
     * @param task Task to add
     */
    public addTask(task: FrameGraphTask): void {
        if (this._currentProcessedTask !== null) {
            throw new Error(`FrameGraph.addTask: Can't add the task "${task.name}" while another task is currently building (task: ${this._currentProcessedTask.name}).`);
        }

        this._tasks.push(task);
    }

    /**
     * Adds a pass to a task. This method can only be called during a Task.record execution.
     * @param name The name of the pass
     * @param whenTaskDisabled If true, the pass will be added to the list of passes to execute when the task is disabled (default is false)
     * @returns The render pass created
     */
    public addPass(name: string, whenTaskDisabled = false): FrameGraphPass<FrameGraphContext> {
        return this._addPass(name, FrameGraphPassType.Normal, whenTaskDisabled) as FrameGraphPass<FrameGraphContext>;
    }

    /**
     * Adds a render pass to a task. This method can only be called during a Task.record execution.
     * @param name The name of the pass
     * @param whenTaskDisabled If true, the pass will be added to the list of passes to execute when the task is disabled (default is false)
     * @returns The render pass created
     */
    public addRenderPass(name: string, whenTaskDisabled = false): FrameGraphRenderPass {
        return this._addPass(name, FrameGraphPassType.Render, whenTaskDisabled) as FrameGraphRenderPass;
    }

    /**
     * Adds a cull pass to a task. This method can only be called during a Task.record execution.
     * @param name The name of the pass
     * @param whenTaskDisabled If true, the pass will be added to the list of passes to execute when the task is disabled (default is false)
     * @returns The cull pass created
     */
    public addCullPass(name: string, whenTaskDisabled = false): FrameGraphCullPass {
        return this._addPass(name, FrameGraphPassType.Cull, whenTaskDisabled) as FrameGraphCullPass;
    }

    private _addPass(name: string, passType: FrameGraphPassType, whenTaskDisabled = false): FrameGraphPass<FrameGraphContext> | FrameGraphRenderPass {
        if (!this._currentProcessedTask) {
            throw new Error("FrameGraph: A pass must be created during a Task.record execution only.");
        }

        let pass: FrameGraphPass<FrameGraphContext> | FrameGraphRenderPass;

        switch (passType) {
            case FrameGraphPassType.Render:
                pass = new FrameGraphRenderPass(name, this._currentProcessedTask, this._renderContext, this._engine);
                break;
            case FrameGraphPassType.Cull:
                pass = new FrameGraphCullPass(name, this._currentProcessedTask, this._passContext, this._engine);
                break;
            default:
                pass = new FrameGraphPass(name, this._currentProcessedTask, this._passContext);
                break;
        }

        this._currentProcessedTask._addPass(pass, whenTaskDisabled);

        return pass;
    }

    /**
     * Builds the frame graph.
     * This method should be called after all tasks have been added to the frame graph (FrameGraph.addTask) and before the graph is executed (FrameGraph.execute).
     */
    public build(): void {
        this.textureManager._releaseTextures(false);

        try {
            for (const task of this._tasks) {
                task._reset();

                this._currentProcessedTask = task;
                this.textureManager._isRecordingTask = true;

                task.record();

                this.textureManager._isRecordingTask = false;
                this._currentProcessedTask = null;
            }

            this.textureManager._allocateTextures(this.optimizeTextureAllocation ? this._tasks : undefined);

            for (const task of this._tasks) {
                task._checkTask();
            }

            for (const task of this._tasks) {
                task.onTexturesAllocatedObservable.notifyObservers(this._renderContext);
            }

            this.onBuildObservable.notifyObservers(this);
        } catch (e) {
            this._tasks.length = 0;
            this._currentProcessedTask = null;
            this.textureManager._isRecordingTask = false;
            throw e;
        }
    }

    /**
     * Returns a promise that resolves when the frame graph is ready to be executed
     * This method must be called after the graph has been built (FrameGraph.build called)!
     * @param timeStep Time step in ms between retries (default is 16)
     * @param maxTimeout Maximum time in ms to wait for the graph to be ready (default is 30000)
     * @returns The promise that resolves when the graph is ready
     */
    public async whenReadyAsync(timeStep = 16, maxTimeout = 30000): Promise<void> {
        let firstNotReadyTask: FrameGraphTask | null = null;
        return await new Promise((resolve) => {
            this._whenReadyAsyncCancel = _RetryWithInterval(
                () => {
                    let ready = this._renderContext._isReady();
                    for (const task of this._tasks) {
                        const taskIsReady = task.isReady();
                        if (!taskIsReady && !firstNotReadyTask) {
                            firstNotReadyTask = task;
                        }
                        ready &&= taskIsReady;
                    }
                    return ready;
                },
                () => {
                    this._whenReadyAsyncCancel = null;
                    resolve();
                },
                (err, isTimeout) => {
                    this._whenReadyAsyncCancel = null;
                    if (!isTimeout) {
                        Logger.Error("FrameGraph: An unexpected error occurred while waiting for the frame graph to be ready.");
                        if (err) {
                            Logger.Error(err);
                            if (err.stack) {
                                Logger.Error(err.stack);
                            }
                        }
                    } else {
                        Logger.Error(
                            `FrameGraph: Timeout while waiting for the frame graph to be ready.${firstNotReadyTask ? ` First task not ready: ${firstNotReadyTask.name}` : ""}`
                        );
                        if (err) {
                            Logger.Error(err);
                        }
                    }
                },
                timeStep,
                maxTimeout
            );
        });
    }

    /**
     * Executes the frame graph.
     */
    public execute(): void {
        this._renderContext.bindRenderTarget();

        this.textureManager._updateHistoryTextures();

        for (const task of this._tasks) {
            const passes = task._getPasses();

            for (const pass of passes) {
                pass._execute();
            }
        }
    }

    /**
     * Clears the frame graph (remove the tasks and release the textures).
     * The frame graph can be built again after this method is called.
     */
    public clear(): void {
        this._whenReadyAsyncCancel?.();
        this._whenReadyAsyncCancel = null;

        for (const task of this._tasks) {
            task._reset();
        }

        this._tasks.length = 0;
        this.textureManager._releaseTextures();
        this._currentProcessedTask = null;
    }

    /**
     * Disposes the frame graph
     */
    public dispose(): void {
        this._whenReadyAsyncCancel?.();
        this._whenReadyAsyncCancel = null;
        this.clear();
        this.textureManager._dispose();
        this._renderContext._dispose();

        const index = this._scene.frameGraphs.indexOf(this);
        if (index !== -1) {
            this._scene.frameGraphs.splice(index, 1);
        }
    }
}
