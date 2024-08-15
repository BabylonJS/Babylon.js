import type { Scene } from "../scene";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { RenderTargetWrapper } from "../Engines/renderTargetWrapper";
import type { FrameGraphTaskTexture, IFrameGraphInputData, IFrameGraphTask } from "./Tasks/IFrameGraphTask";
import { FrameGraphPass } from "./Passes/pass";
import { FrameGraphRenderPass } from "./Passes/renderPass";
import { FrameGraphRenderContext } from "./frameGraphRenderContext";
import { FrameGraphContext } from "./frameGraphContext";
import type { TextureHandle, FrameGraphTextureCreationOptions, FrameGraphTextureDescription } from "./frameGraphTextureManager";
import { FrameGraphTextureManager, FrameGraphTextureNamespace } from "./frameGraphTextureManager";
import { FrameGraphTaskInternals } from "./Tasks/taskInternals";

/**
 * Class used to implement the frame graph
 */
export class FrameGraph {
    private _textureManager: FrameGraphTextureManager;
    private _passContext: FrameGraphContext;
    private _renderContext: FrameGraphRenderContext;

    private _tasks: IFrameGraphTask[] = [];
    private _mapNameToTask: Map<string, IFrameGraphTask> = new Map();
    private _currentProcessedTask: IFrameGraphTask | null = null;

    /**
     * Constructs the frame graph
     * @param engine defines the hosting engine
     * @param debugTextures defines a boolean indicating that textures created by the frame graph should be visible in the inspector
     * @param scene defines the scene in which debugging textures are to be created
     */
    constructor(engine: AbstractEngine, debugTextures = false, scene?: Scene) {
        this._textureManager = new FrameGraphTextureManager(engine, this._mapNameToTask, debugTextures, scene);
        this._passContext = new FrameGraphContext();
        this._renderContext = new FrameGraphRenderContext(engine, this._textureManager);
    }

    public addTask<T>(task: IFrameGraphTask, inputData?: T extends IFrameGraphInputData ? T : never): void {
        if (this._currentProcessedTask !== null) {
            throw new Error(`Can't add the task "${task.name}" while another task is currently building (task: ${this._currentProcessedTask.name}).`);
        }

        task._frameGraphInternals?.dispose();
        task._frameGraphInternals = new FrameGraphTaskInternals(task, this._textureManager, inputData);
        task.initializeFrameGraph?.(this);

        this._tasks.push(task);
        this._mapNameToTask.set(task.name, task);
    }

    public addPass(name: string, whenTaskDisabled = false): FrameGraphPass<FrameGraphContext> {
        if (!this._currentProcessedTask) {
            throw new Error("A pass must be created during a Task.recordFrameGraph execution.");
        }

        const pass = new FrameGraphPass(name, this._textureManager, this._currentProcessedTask, this._passContext);

        if (whenTaskDisabled) {
            this._currentProcessedTask._frameGraphInternals!.passesDisabled.push(pass);
        } else {
            this._currentProcessedTask._frameGraphInternals!.passes.push(pass);
        }

        return pass;
    }

    public addRenderPass(name: string, whenTaskDisabled = false): FrameGraphRenderPass {
        if (!this._currentProcessedTask) {
            throw new Error("A pass must be created during a Task.recordFrameGraph execution.");
        }

        const pass = new FrameGraphRenderPass(name, this._textureManager, this._currentProcessedTask, this._renderContext);

        if (whenTaskDisabled) {
            this._currentProcessedTask._frameGraphInternals!.passesDisabled.push(pass);
        } else {
            this._currentProcessedTask._frameGraphInternals!.passes.push(pass);
        }

        return pass;
    }

    public build(): void {
        this._textureManager._releaseTextures(false);

        const taskNames = new Set<string>();
        for (const task of this._tasks) {
            if (taskNames.has(task.name)) {
                throw new Error(`Task with the name "${task.name}" already exists: task names must be unique in the graph.`);
            }

            taskNames.add(task.name);

            const internals = task._frameGraphInternals!;

            internals.reset();

            this._currentProcessedTask = task;

            task.recordFrameGraph(this, internals.inputData);

            internals.postBuildTask();

            this._currentProcessedTask = null;
        }

        this._textureManager._allocateTextures();
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
                let ready = true;
                for (const task of this._tasks) {
                    ready &&= task.isReadyFrameGraph();
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

    public execute(): void {
        this._renderContext._bindRenderTarget();

        for (const task of this._tasks) {
            const internals = task._frameGraphInternals!;

            internals.setTextureOutputForTask();

            const passes = task.disabledFrameGraph ? internals.passesDisabled : internals.passes;

            for (const pass of passes) {
                pass._execute();
            }
        }
    }

    public importTexture(name: string, texture: RenderTargetWrapper, handle?: TextureHandle): TextureHandle {
        return this._textureManager.importTexture(name, texture, handle);
    }

    public getTextureCreationOptions(textureId: FrameGraphTaskTexture | TextureHandle): FrameGraphTextureCreationOptions {
        return this._textureManager.getTextureCreationOptions(textureId);
    }

    public getTextureDescription(textureId: FrameGraphTaskTexture | TextureHandle): FrameGraphTextureDescription {
        return this._textureManager.convertTextureCreationOptionsToDescription(this.getTextureCreationOptions(textureId));
    }

    public getTextureHandle(textureId: FrameGraphTaskTexture | TextureHandle): TextureHandle {
        return this._textureManager.getTextureHandle(textureId);
    }

    public getTextureHandleOrCreateTexture(
        textureId?: FrameGraphTaskTexture | TextureHandle,
        newTextureName?: string,
        creationOptions?: FrameGraphTextureCreationOptions
    ): TextureHandle {
        if (textureId === undefined) {
            if (newTextureName === undefined || creationOptions === undefined) {
                throw new Error("Either textureId or newTextureName and creationOptions must be provided.");
            }
            return this.createRenderTargetTexture(newTextureName, creationOptions);
        }
        return this.getTextureHandle(textureId);
    }

    public createRenderTargetTexture(name: string, creationOptions: FrameGraphTextureCreationOptions): TextureHandle {
        return this._textureManager.createRenderTargetTexture(
            name,
            this._currentProcessedTask ? FrameGraphTextureNamespace.Task : FrameGraphTextureNamespace.Graph,
            creationOptions
        );
    }

    public clear(): void {
        for (const task of this._tasks) {
            task._frameGraphInternals?.dispose();
            task.disposeFrameGraph?.(this);
        }

        this._tasks.length = 0;
        this._mapNameToTask.clear();
        this._textureManager._releaseTextures();
        this._currentProcessedTask = null;
    }

    public dispose(): void {
        this.clear();
        this._textureManager.dispose();
        this._renderContext._dispose();
    }
}
