import type { Scene } from "../scene";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { RenderTargetWrapper } from "../Engines/renderTargetWrapper";
import type { IFrameGraphTask, FrameGraphTextureCreationOptions, FrameGraphTextureHandle, FrameGraphTextureDescription, FrameGraphTextureId } from "./frameGraphTypes";
import { FrameGraphPass } from "./Passes/pass";
import { FrameGraphRenderPass } from "./Passes/renderPass";
import { FrameGraphRenderContext } from "./frameGraphRenderContext";
import { FrameGraphContext } from "./frameGraphContext";
import { FrameGraphTextureManager } from "./frameGraphTextureManager";
import { FrameGraphTaskInternals } from "./Tasks/taskInternals";
import { Observable } from "core/Misc/observable";
import { getDimensionsFromTextureSize, textureSizeIsObject } from "../Materials/Textures/textureCreationOptions";
import type { Nullable } from "../types";

/**
 * Class used to implement the frame graph
 */
export class FrameGraph {
    private _engine: AbstractEngine;
    private _textureManager: FrameGraphTextureManager;
    private _passContext: FrameGraphContext;
    private _renderContext: FrameGraphRenderContext;

    private _tasks: IFrameGraphTask[] = [];
    private _currentProcessedTask: IFrameGraphTask | null = null;

    private static _IsTextureHandle(textureId: FrameGraphTextureId): textureId is FrameGraphTextureHandle {
        return typeof textureId === "number";
    }

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

    public getTaskByName<T extends IFrameGraphTask>(name: string): T | undefined {
        return this._tasks.find((t) => t.name === name) as T;
    }

    public addTask(task: IFrameGraphTask): void {
        if (this._currentProcessedTask !== null) {
            throw new Error(`Can't add the task "${task.name}" while another task is currently building (task: ${this._currentProcessedTask.name}).`);
        }

        task._fgInternals?.dispose();
        task._fgInternals = new FrameGraphTaskInternals(task);

        this._tasks.push(task);
    }

    public addPass(name: string, whenTaskDisabled = false): FrameGraphPass<FrameGraphContext> {
        if (!this._currentProcessedTask) {
            throw new Error("A pass must be created during a Task.recordFrameGraph execution.");
        }

        const pass = new FrameGraphPass(name, this._currentProcessedTask, this._passContext);

        this._currentProcessedTask._fgInternals!.addPass(pass, whenTaskDisabled);

        return pass;
    }

    public addRenderPass(name: string, whenTaskDisabled = false): FrameGraphRenderPass {
        if (!this._currentProcessedTask) {
            throw new Error("A pass must be created during a Task.recordFrameGraph execution.");
        }

        const pass = new FrameGraphRenderPass(name, this._currentProcessedTask, this._renderContext, this._engine);

        this._currentProcessedTask._fgInternals!.addPass(pass, whenTaskDisabled);

        return pass;
    }

    public build(): void {
        this._textureManager.releaseTextures(false);

        for (const task of this._tasks) {
            const internals = task._fgInternals!;

            internals.reset();

            this._currentProcessedTask = task;

            task.recordFrameGraph(this);

            internals.postBuildTask();

            this._currentProcessedTask = null;
        }

        this._textureManager.allocateTextures();

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
            const passes = task._fgInternals!.getPasses();

            for (const pass of passes) {
                pass._execute();
            }
        }
    }

    public importTexture(name: string, texture: RenderTargetWrapper, handle?: FrameGraphTextureHandle): FrameGraphTextureHandle {
        return this._textureManager.importTexture(name, texture, handle);
    }

    public getTextureCreationOptions(textureId: FrameGraphTextureId, cloneOptions = false): FrameGraphTextureCreationOptions {
        let textureHandle: FrameGraphTextureHandle;

        if (!FrameGraph._IsTextureHandle(textureId)) {
            textureHandle = textureId[0]._fgInternals!.mapNameToTextureHandle[textureId[1]];

            if (textureHandle === undefined) {
                throw new Error(`Task "${textureId[0].name}" does not have a "${textureId[1]}" texture.`);
            }
        } else {
            textureHandle = textureId;
        }

        const creationOptions = this._textureManager.getTextureCreationOptions(textureHandle);

        return cloneOptions
            ? {
                  size: getDimensionsFromTextureSize(creationOptions.size),
                  options: { ...creationOptions.options },
                  sizeIsPercentage: creationOptions.sizeIsPercentage,
              }
            : creationOptions;
    }

    public getTextureDescription(textureId: FrameGraphTextureId): FrameGraphTextureDescription {
        const creationOptions = this.getTextureCreationOptions(textureId);

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

    public getTextureHandle(textureId: FrameGraphTextureId): FrameGraphTextureHandle {
        if (FrameGraph._IsTextureHandle(textureId)) {
            return textureId;
        }

        const textureHandle = textureId[0]._fgInternals!.mapNameToTextureHandle[textureId[1]];

        if (textureHandle === undefined) {
            throw new Error(`Task "${textureId[0].name}" does not have a "${textureId[1]}" texture.`);
        }

        return textureHandle;
    }

    public getTextureHandleOrCreateTexture(textureId?: FrameGraphTextureId, newTextureName?: string, creationOptions?: FrameGraphTextureCreationOptions): FrameGraphTextureHandle {
        if (textureId === undefined) {
            if (newTextureName === undefined || creationOptions === undefined) {
                throw new Error("Either textureId or newTextureName and creationOptions must be provided.");
            }
            return this.createRenderTargetTexture(newTextureName, creationOptions);
        }
        return this.getTextureHandle(textureId);
    }

    public getTextureFromHandle(handle: FrameGraphTextureHandle): Nullable<RenderTargetWrapper> {
        return this._textureManager.getTextureFromHandle(handle);
    }

    public createRenderTargetTexture(name: string, creationOptions: FrameGraphTextureCreationOptions): FrameGraphTextureHandle {
        return this._textureManager.createRenderTargetTexture(name, !!this._currentProcessedTask, creationOptions);
    }

    public clear(): void {
        for (const task of this._tasks) {
            task._fgInternals?.dispose();
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
