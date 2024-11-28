/* eslint-disable import/no-internal-modules */
import type { Scene, AbstractEngine, FrameGraphTask } from "core/index";
import { FrameGraphPass } from "./Passes/pass";
import { FrameGraphRenderPass } from "./Passes/renderPass";
import { FrameGraphCullPass } from "./Passes/cullPass";
import { FrameGraphRenderContext } from "./frameGraphRenderContext";
import { FrameGraphContext } from "./frameGraphContext";
import { FrameGraphTextureManager } from "./frameGraphTextureManager";
import { Observable } from "core/Misc/observable";

enum FrameGraphPassType {
    Render = 0,
    Cull = 1,
    Compute = 2,
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
    private readonly _tasks: FrameGraphTask[] = [];
    private readonly _passContext: FrameGraphContext;
    private readonly _renderContext: FrameGraphRenderContext;
    private _currentProcessedTask: FrameGraphTask | null = null;

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
     * Constructs the frame graph
     * @param engine defines the hosting engine
     * @param debugTextures defines a boolean indicating that textures created by the frame graph should be visible in the inspector
     * @param scene defines the scene the frame graph is associated with
     */
    constructor(engine: AbstractEngine, debugTextures = false, scene: Scene) {
        this._engine = engine;
        this.textureManager = new FrameGraphTextureManager(this._engine, debugTextures, scene);
        this._passContext = new FrameGraphContext();
        this._renderContext = new FrameGraphRenderContext(this._engine, this.textureManager, scene);
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

        for (const task of this._tasks) {
            task._reset();

            this._currentProcessedTask = task;
            this.textureManager._isRecordingTask = true;

            task.record();

            this.textureManager._isRecordingTask = false;
            this._currentProcessedTask = null;
        }

        this.textureManager._allocateTextures();

        for (const task of this._tasks) {
            task._checkTask();
        }

        this.onBuildObservable.notifyObservers(this);
    }

    /**
     * Returns a promise that resolves when the frame graph is ready to be executed
     * This method must be called after the graph has been built (FrameGraph.build called)!
     * @param timeout Timeout in ms between retries (default is 16)
     * @returns The promise that resolves when the graph is ready
     */
    public whenReadyAsync(timeout = 16): Promise<void> {
        return new Promise((resolve) => {
            const checkReady = () => {
                let ready = this._renderContext._isReady();
                for (const task of this._tasks) {
                    ready = task.isReady() && ready;
                }
                if (ready) {
                    resolve();
                } else {
                    setTimeout(checkReady, timeout);
                }
            };

            checkReady();
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
        this.clear();
        this.textureManager._dispose();
        this._renderContext._dispose();
    }
}
