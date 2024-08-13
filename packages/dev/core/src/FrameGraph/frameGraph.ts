import type { Scene } from "../scene";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { RenderTargetWrapper } from "../Engines/renderTargetWrapper";
import { Constants } from "../Engines/constants";
import { BlackAndWhitePostProcess } from "core/PostProcesses/blackAndWhitePostProcess";
import { PassPostProcess } from "core/PostProcesses/passPostProcess";
import type { FrameGraphTaskOutputTexture, IFrameGraphInputData, IFrameGraphTask } from "./Tasks/IFrameGraphTask";
import type { IFrameGraphPostProcessInputData } from "core/PostProcesses/postProcess";
import { FrameGraphPassBuilder } from "./Passes/passBuilder";
import { FrameGraphRenderPassBuilder } from "./Passes/renderPassBuilder";
import type { IFrameGraphCopyToBackbufferColorInputData } from "./Tasks/copyToBackbufferColorTask";
import { FrameGraphCopyToBackbufferColorTask } from "./Tasks/copyToBackbufferColorTask";
import type { IFrameGraphBloomEffectInputData } from "core/PostProcesses/bloomEffect";
import { BloomEffect } from "core/PostProcesses/bloomEffect";
import { FrameGraphRenderContext } from "./frameGraphRenderContext";
import { FrameGraphContext } from "./frameGraphContext";
import type { TextureHandle, FrameGraphTextureCreationOptions, FrameGraphTextureDescription } from "./frameGraphTextureManager";
import { backbufferColorTextureHandle, FrameGraphTextureManager, FrameGraphTextureNamespace } from "./frameGraphTextureManager";
import type { IFrameGraphCopyToTextureInputData } from "./Tasks/copyToTextureTask";
import { FrameGraphCopyToTextureTask } from "./Tasks/copyToTextureTask";
import { FrameGraphTaskInternals } from "./Tasks/taskInternals";

export async function testRenderGraph(engine: AbstractEngine, scene: Scene) {
    const pp0 = new PassPostProcess("pass", 1, scene.activeCamera, Constants.TEXTURE_BILINEAR_SAMPLINGMODE, undefined, undefined, Constants.TEXTURETYPE_HALF_FLOAT);
    pp0.samples = 4;
    pp0.resize(engine.getRenderWidth(), engine.getRenderHeight(), scene.activeCamera);

    const creationOptions = {
        size: { width: 100, height: 100 },
        options: {
            createMipMaps: false,
            generateMipMaps: false,
            type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            format: Constants.TEXTUREFORMAT_RGBA,
        },
        sizeIsPercentage: true,
    };

    const copyTask = new FrameGraphCopyToTextureTask("copy");
    const bnwTask = new BlackAndWhitePostProcess("bnw", 1, null, undefined, engine);
    const copyToBackbufferTask = new FrameGraphCopyToBackbufferColorTask("copytobackbuffer");
    const bloomTask = new BloomEffect(engine, 0.5, 0.5, 128, Constants.TEXTURETYPE_HALF_FLOAT, false);

    bloomTask.name = "bloom";
    bloomTask.threshold = 0.1;

    const frameGraph = new FrameGraph(engine, true, scene);

    const pp0Handle = frameGraph.importTexture("pp0", pp0.inputTexture);

    const testNumber: number = 1;
    switch (testNumber) {
        case 0: {
            const destinationTexture = frameGraph.createRenderTargetTexture("copytask_output", creationOptions);

            frameGraph.addTask<IFrameGraphCopyToTextureInputData>(copyTask, {
                sourceTexture: pp0Handle,
                outputTexture: destinationTexture,
            });

            copyTask.disabledFromGraph = true;

            frameGraph.addTask<IFrameGraphPostProcessInputData>(bnwTask, {
                sourceTexture: copyTask.name,
                outputTexture: destinationTexture,
            });

            frameGraph.addTask<IFrameGraphBloomEffectInputData>(bloomTask, {
                sourceTexture: bnwTask.name,
                outputTexture: backbufferColorTextureHandle,
            });
            break;
        }
        case 1: {
            const bloomOutputTexture = frameGraph.createRenderTargetTexture("bloom_output", creationOptions);

            frameGraph.addTask<IFrameGraphBloomEffectInputData>(bloomTask, {
                sourceTexture: pp0Handle,
                outputTexture: bloomOutputTexture,
            });

            const bnwOutputTexture = frameGraph.createRenderTargetTexture("bnw_output", creationOptions);

            frameGraph.addTask<IFrameGraphPostProcessInputData>(bnwTask, {
                sourceTexture: bloomTask.name,
                outputTexture: bnwOutputTexture,
            });

            frameGraph.addTask<IFrameGraphCopyToBackbufferColorInputData>(copyToBackbufferTask, { sourceTexture: bnwTask.name });
            break;
        }
        case 2: {
            frameGraph.addTask<IFrameGraphBloomEffectInputData>(bloomTask, {
                sourceTexture: pp0Handle,
            });

            frameGraph.addTask<IFrameGraphPostProcessInputData>(bnwTask, {
                sourceTexture: bloomTask.name,
                outputTexture: backbufferColorTextureHandle,
            });
            break;
        }
    }

    frameGraph.build();

    (window as any).fg = frameGraph;

    await frameGraph.whenReadyAsync();

    scene.onAfterRenderObservable.add(() => {
        frameGraph.execute();
    });

    pp0.onSizeChangedObservable.add(() => {
        frameGraph.importTexture("pp0", pp0.inputTexture, pp0Handle);
        frameGraph.build();
    });
}

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
        task._frameGraphInternals = new FrameGraphTaskInternals(this._textureManager, inputData);

        this._tasks.push(task);
        this._mapNameToTask.set(task.name, task);
    }

    public addPass(name: string, whenTaskDisabled = false): FrameGraphPassBuilder<FrameGraphContext> {
        if (!this._currentProcessedTask) {
            throw new Error("A pass must be created during a Task.addToFrameGraph execution.");
        }

        const pass = new FrameGraphPassBuilder(name, this._textureManager, this._currentProcessedTask, this._passContext);

        if (whenTaskDisabled) {
            this._currentProcessedTask._frameGraphInternals!.passesDisabled.push(pass);
        } else {
            this._currentProcessedTask._frameGraphInternals!.passes.push(pass);
        }

        return pass;
    }

    public addRenderPass(name: string, whenTaskDisabled = false): FrameGraphRenderPassBuilder {
        if (!this._currentProcessedTask) {
            throw new Error("A pass must be created during a Task.addToFrameGraph execution.");
        }

        const pass = new FrameGraphRenderPassBuilder(name, this._textureManager, this._currentProcessedTask, this._renderContext);

        if (whenTaskDisabled) {
            this._currentProcessedTask._frameGraphInternals!.passesDisabled.push(pass);
        } else {
            this._currentProcessedTask._frameGraphInternals!.passes.push(pass);
        }

        return pass;
    }

    public build(): void {
        this._textureManager.releaseTextures();

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

            internals.postBuildTask(task.disabledFromGraph);

            this._currentProcessedTask = null;
        }
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
                }
                return ready;
            };

            if (!checkReady()) {
                setTimeout(checkReady, timeout);
            }
        });
    }

    public execute(): void {
        this._renderContext._bindRenderTarget();

        for (const task of this._tasks) {
            const internals = task._frameGraphInternals!;

            internals.setTextureOutputForTask(task.disabledFromGraph);

            const passes = task.disabledFromGraph ? internals.passesDisabled : internals.passes;

            for (const pass of passes) {
                pass._execute();
            }
        }
    }

    public importTexture(name: string, texture: RenderTargetWrapper, handle?: TextureHandle): TextureHandle {
        return this._textureManager.importTexture(name, texture, handle);
    }

    public getTextureDescription(textureId: FrameGraphTaskOutputTexture | TextureHandle): FrameGraphTextureDescription {
        return this._textureManager.getTextureDescription(textureId);
    }

    public getTextureHandle(textureId: FrameGraphTaskOutputTexture | TextureHandle): TextureHandle {
        return this._textureManager.getTextureHandle(textureId);
    }

    public getTextureHandleOrCreateTexture(
        textureId?: FrameGraphTaskOutputTexture | TextureHandle,
        newTextureName?: string,
        creationOptions?: FrameGraphTextureCreationOptions | FrameGraphTextureDescription
    ): TextureHandle {
        if (textureId === undefined) {
            if (newTextureName === undefined || creationOptions === undefined) {
                throw new Error("Either textureId or newTextureName and creationOptions must be provided.");
            }
            return this.createRenderTargetTexture(newTextureName, creationOptions);
        }
        return this.getTextureHandle(textureId);
    }

    public createRenderTargetTexture(name: string, creationOptions: FrameGraphTextureCreationOptions | FrameGraphTextureDescription): TextureHandle {
        return this._textureManager.createRenderTargetTexture(
            name,
            this._currentProcessedTask ? FrameGraphTextureNamespace.Task : FrameGraphTextureNamespace.Graph,
            creationOptions
        );
    }

    public clear(): void {
        for (const task of this._tasks) {
            task._frameGraphInternals?.dispose();
        }

        this._tasks.length = 0;
        this._mapNameToTask.clear();
        this._textureManager.releaseTextures(true);
        this._currentProcessedTask = null;
    }

    public dispose(): void {
        this.clear();
        this._textureManager.dispose();
        this._renderContext._dispose();
    }
}
