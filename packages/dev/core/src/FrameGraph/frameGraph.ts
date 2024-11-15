/* eslint-disable import/no-internal-modules */
import type {
    Scene,
    AbstractEngine,
    RenderTargetWrapper,
    FrameGraphTextureCreationOptions,
    FrameGraphTextureHandle,
    FrameGraphTextureDescription,
    Nullable,
    FrameGraphTask,
} from "core/index";
import { FrameGraphPass } from "./Passes/pass";
import { FrameGraphRenderPass } from "./Passes/renderPass";
import { FrameGraphCullPass } from "./Passes/cullPass";
import { FrameGraphRenderContext } from "./frameGraphRenderContext";
import { FrameGraphContext } from "./frameGraphContext";
import { FrameGraphTextureManager } from "./frameGraphTextureManager";
import { Observable } from "core/Misc/observable";
import { getDimensionsFromTextureSize, textureSizeIsObject } from "../Materials/Textures/textureCreationOptions";

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
    /** @internal */
    public readonly _passContext: FrameGraphContext;
    /** @internal */
    public readonly _renderContext: FrameGraphRenderContext;

    private readonly _engine: AbstractEngine;
    private readonly _textureManager: FrameGraphTextureManager;
    private _tasks: FrameGraphTask[] = [];
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
     * @param scene defines the scene in which debugging textures are to be created
     */
    constructor(engine: AbstractEngine, debugTextures = false, scene?: Scene) {
        this._engine = engine;
        this._textureManager = new FrameGraphTextureManager(this._engine, debugTextures, scene);
        this._passContext = new FrameGraphContext();
        this._renderContext = new FrameGraphRenderContext(this._engine, this._textureManager);
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

    /**
     * Executes the frame graph.
     */
    public execute(): void {
        this._renderContext.bindRenderTarget();

        this._textureManager.updateHistoryTextures();

        for (const task of this._tasks) {
            const passes = task._getPasses();

            for (const pass of passes) {
                pass._execute();
            }
        }
    }

    /**
     * Imports a texture into the frame graph
     * @param name Name of the texture
     * @param texture Texture to import
     * @param handle Existing handle to use for the texture. If not provided (default), a new handle will be created.
     * @returns The handle to the texture
     */
    public importTexture(name: string, texture: RenderTargetWrapper, handle?: FrameGraphTextureHandle): FrameGraphTextureHandle {
        return this._textureManager.importTexture(name, texture, handle);
    }

    /**
     * Gets the creation options of a texture
     * @param handle Handle of the texture
     * @param cloneOptions If true, the options will be cloned before being returned (default is false)
     * @returns The creation options of the texture
     */
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

    /**
     * Gets the description of a texture
     * @param handle Handle of the texture
     * @returns The description of the texture
     */
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

    /**
     * Gets a texture handle or creates a new texture if the handle is not provided.
     * @param handle If provided, will simply return the handle
     * @param newTextureName Name of the new texture to create
     * @param creationOptions Options to use when creating the new texture
     * @returns The handle to the texture. If handle is not provided, newTextureName and creationOptions must be provided.
     */
    public getTextureHandleOrCreateTexture(handle?: FrameGraphTextureHandle, newTextureName?: string, creationOptions?: FrameGraphTextureCreationOptions): FrameGraphTextureHandle {
        if (handle === undefined) {
            if (newTextureName === undefined || creationOptions === undefined) {
                throw new Error("getTextureHandleOrCreateTexture: Either handle or newTextureName and creationOptions must be provided.");
            }
            return this.createRenderTargetTexture(newTextureName, creationOptions);
        }
        return handle;
    }

    /**
     * Gets a texture from a handle
     * @param handle The handle of the texture
     * @returns The texture or null if not found
     */
    public getTexture(handle: FrameGraphTextureHandle): Nullable<RenderTargetWrapper> {
        return this._textureManager.getTextureFromHandle(handle);
    }

    /**
     * Creates a new render target texture
     * @param name Name of the texture
     * @param creationOptions Options to use when creating the texture
     * @param multiTargetMode If true, the texture will be created in multi target mode (default is false). In this mode, a handle is created for each target separately, in addition to the handle created for the main render target texture itself.
     * @returns The handle to the texture
     */
    public createRenderTargetTexture(name: string, creationOptions: FrameGraphTextureCreationOptions, multiTargetMode = false): FrameGraphTextureHandle {
        return this._textureManager.createRenderTargetTexture(name, !!this._currentProcessedTask, creationOptions, multiTargetMode);
    }

    /**
     * Creates a handle which is not associated with any texture.
     * Call resolveDanglingHandle to associate the handle with a valid texture handle.
     * @returns The dangling handle
     */
    public createDanglingHandle(): FrameGraphTextureHandle {
        return this._textureManager.createDanglingHandle();
    }

    /**
     * Associates a texture with a dangling handle
     * @param danglingHandle The dangling handle
     * @param handle The handle to associate with the dangling handle (if not provided, a new texture handle will be created)
     * @param newTextureName The name of the new texture to create (if handle is not provided)
     * @param creationOptions The options to use when creating the new texture (if handle is not provided)
     */
    public resolveDanglingHandle(
        danglingHandle: FrameGraphTextureHandle,
        handle?: FrameGraphTextureHandle,
        newTextureName?: string,
        creationOptions?: FrameGraphTextureCreationOptions
    ) {
        if (handle === undefined) {
            if (newTextureName === undefined || creationOptions === undefined) {
                throw new Error("resolveDanglingHandle: Either handle or newTextureName and creationOptions must be provided.");
            }
            this._textureManager.createRenderTargetTexture(newTextureName, !!this._currentProcessedTask, creationOptions, false, danglingHandle);
            return;
        }

        this._textureManager.resolveDanglingHandle(danglingHandle, handle);
    }

    /**
     * Checks if a handle is a history texture (or points to a history texture, for a dangling handle)
     * @param handle The handle to check
     * @returns True if the handle is a history texture, otherwise false
     */
    public isHistoryTexture(handle: FrameGraphTextureHandle): boolean {
        const entry = this._textureManager._textures.get(handle);
        if (!entry) {
            return false;
        }

        handle = entry.refHandle ?? handle;

        return this._textureManager._historyTextures.has(handle);
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
        this._textureManager.releaseTextures();
        this._currentProcessedTask = null;
    }

    /**
     * Disposes the frame graph
     */
    public dispose(): void {
        this.clear();
        this._textureManager.dispose();
        this._renderContext._dispose();
    }
}
