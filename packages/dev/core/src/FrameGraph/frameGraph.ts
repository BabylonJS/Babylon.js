import type { Scene } from "../scene";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { RenderTargetWrapper } from "../Engines/renderTargetWrapper";
import type { FrameGraphTextureCreationOptions, FrameGraphTextureHandle, FrameGraphTextureDescription } from "./frameGraphTypes";
import { FrameGraphPass } from "./Passes/pass";
import { FrameGraphRenderPass } from "./Passes/renderPass";
import { FrameGraphCullPass } from "./Passes/cullPass";
import { FrameGraphRenderContext } from "./frameGraphRenderContext";
import { FrameGraphContext } from "./frameGraphContext";
import { FrameGraphTextureManager } from "./frameGraphTextureManager";
import { Observable } from "core/Misc/observable";
import { getDimensionsFromTextureSize, textureSizeIsObject } from "../Materials/Textures/textureCreationOptions";
import type { Nullable } from "../types";
import type { FrameGraphTask } from "./frameGraphTask";

enum FrameGraphPassType {
    Render = 0,
    Cull = 1,
    Compute = 2,
}

/**
 * Class used to implement the frame graph
 */
export class FrameGraph {
    private _engine: AbstractEngine;
    private _textureManager: FrameGraphTextureManager;
    /** @internal */
    public _passContext: FrameGraphContext;
    /** @internal */
    public _renderContext: FrameGraphRenderContext;

    private _tasks: FrameGraphTask[] = [];
    private _currentProcessedTask: FrameGraphTask | null = null;

    /**
     * Observable raised when the node render graph is built
     */
    public onBuildObservable = new Observable<FrameGraph>();

    /**
     * Constructs the frame graph
     * @param engine defines the hosting engine
     * @param debugTextures defines a boolean indicating that textures created by the frame graph should be visible in the inspector
     * @param scene defines the scene in which debugging textures are to be created
     */
    constructor(engine: AbstractEngine, debugTextures = false, scene?: Scene) {
        this._engine = engine;
        this._textureManager = new FrameGraphTextureManager(this._engine, debugTextures, scene);
        this._passContext = new FrameGraphContext();
        this._renderContext = new FrameGraphRenderContext(this._engine, this._textureManager);
    }

    public getTaskByName<T extends FrameGraphTask>(name: string): T | undefined {
        return this._tasks.find((t) => t.name === name) as T;
    }

    public addTask(task: FrameGraphTask): void {
        if (this._currentProcessedTask !== null) {
            throw new Error(`addTask: Can't add the task "${task.name}" while another task is currently building (task: ${this._currentProcessedTask.name}).`);
        }

        this._tasks.push(task);
    }

    public addRenderPass(name: string, whenTaskDisabled = false): FrameGraphRenderPass {
        return this._addPass(name, FrameGraphPassType.Render, whenTaskDisabled) as FrameGraphRenderPass;
    }

    public addCullPass(name: string, whenTaskDisabled = false): FrameGraphCullPass {
        return this._addPass(name, FrameGraphPassType.Cull, whenTaskDisabled) as FrameGraphCullPass;
    }

    private _addPass(name: string, passType: FrameGraphPassType, whenTaskDisabled = false): FrameGraphPass<FrameGraphContext> | FrameGraphRenderPass {
        if (!this._currentProcessedTask) {
            throw new Error("A pass must be created during a Task.recordFrameGraph execution.");
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

    public build(): void {
        this._textureManager.releaseTextures(false);

        for (const task of this._tasks) {
            task._reset();

            this._currentProcessedTask = task;

            task.record();

            this._currentProcessedTask = null;
        }

        this._textureManager.allocateTextures();

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
                let ready = true;
                for (const task of this._tasks) {
                    ready &&= task.isReady();
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
            const passes = task._getPasses();

            for (const pass of passes) {
                pass._execute();
            }
        }
    }

    public importTexture(name: string, texture: RenderTargetWrapper, handle?: FrameGraphTextureHandle): FrameGraphTextureHandle {
        return this._textureManager.importTexture(name, texture, handle);
    }

    public getTextureCreationOptions(handle: FrameGraphTextureHandle, cloneOptions = false): FrameGraphTextureCreationOptions {
        const creationOptions = this._textureManager.getTextureCreationOptions(handle);

        return cloneOptions
            ? {
                  size: getDimensionsFromTextureSize(creationOptions.size),
                  options: { ...creationOptions.options },
                  sizeIsPercentage: creationOptions.sizeIsPercentage,
              }
            : creationOptions;
    }

    public getTextureDescription(handle: FrameGraphTextureHandle): FrameGraphTextureDescription {
        const creationOptions = this.getTextureCreationOptions(handle);

        const size = !creationOptions.sizeIsPercentage
            ? textureSizeIsObject(creationOptions.size)
                ? { width: creationOptions.size.width, height: creationOptions.size.height }
                : { width: creationOptions.size, height: creationOptions.size }
            : this._textureManager.getAbsoluteDimensions(creationOptions.size);

        return {
            size,
            options: { ...creationOptions.options },
        };
    }

    public getTextureHandleOrCreateTexture(handle?: FrameGraphTextureHandle, newTextureName?: string, creationOptions?: FrameGraphTextureCreationOptions): FrameGraphTextureHandle {
        if (handle === undefined) {
            if (newTextureName === undefined || creationOptions === undefined) {
                throw new Error("getTextureHandleOrCreateTexture: Either handle or newTextureName and creationOptions must be provided.");
            }
            return this.createRenderTargetTexture(newTextureName, creationOptions);
        }
        return handle;
    }

    public getTexture(handle: FrameGraphTextureHandle): Nullable<RenderTargetWrapper> {
        return this._textureManager.getTextureFromHandle(handle);
    }

    public createRenderTargetTexture(name: string, creationOptions: FrameGraphTextureCreationOptions, multiTargetMode = false): FrameGraphTextureHandle {
        return this._textureManager.createRenderTargetTexture(name, !!this._currentProcessedTask, creationOptions, multiTargetMode);
    }

    public createDanglingHandle(): FrameGraphTextureHandle {
        return this._textureManager.createDanglingHandle();
    }

    public resolveDanglingHandle(
        danglingHandle: FrameGraphTextureHandle,
        handle?: FrameGraphTextureHandle,
        newTextureName?: string,
        creationOptions?: FrameGraphTextureCreationOptions
    ) {
        if (handle === undefined) {
            if (this._textureManager._textures.has(danglingHandle)) {
                throw new Error(`resolveDanglingHandle: Handle ${handle} is not dangling!`);
            }
            if (newTextureName === undefined || creationOptions === undefined) {
                throw new Error("resolveDanglingHandle: Either handle or newTextureName and creationOptions must be provided.");
            }
            this._textureManager.createRenderTargetTexture(newTextureName, !!this._currentProcessedTask, creationOptions, false, danglingHandle);
            return;
        }

        this._textureManager.resolveDanglingHandle(danglingHandle, handle);
    }

    public clear(): void {
        for (const task of this._tasks) {
            task._reset();
        }

        this._tasks.length = 0;
        this._textureManager.releaseTextures();
        this._currentProcessedTask = null;
    }

    public dispose(): void {
        this.clear();
        this._textureManager.dispose();
        this._renderContext._dispose();
    }
}
