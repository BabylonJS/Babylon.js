import type { Scene } from "../scene";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { RenderTargetWrapper } from "../Engines/renderTargetWrapper";
import { Constants } from "../Engines/constants";
import { BlackAndWhitePostProcess } from "core/PostProcesses/blackAndWhitePostProcess";
import { PassPostProcess } from "core/PostProcesses/passPostProcess";
import type { FrameGraphTaskTexture, IFrameGraphInputData, IFrameGraphTask } from "./Tasks/IFrameGraphTask";
import type { IFrameGraphPostProcessInputData } from "core/PostProcesses/postProcess";
import { FrameGraphPassBuilder } from "./Passes/passBuilder";
import { FrameGraphRenderPassBuilder } from "./Passes/renderPassBuilder";
import type { IFrameGraphCopyToBackbufferColorInputData } from "./Tasks/copyToBackbufferColorTask";
import { FrameGraphCopyToBackbufferColorTask } from "./Tasks/copyToBackbufferColorTask";
import type { IFrameGraphCreateRenderTextureInputData } from "./Tasks/createRenderTextureTask";
import { FrameGraphCreateRenderTextureTask } from "./Tasks/createRenderTextureTask";
import type { IFrameGraphBloomEffectInputData } from "core/PostProcesses/bloomEffect";
import { BloomEffect } from "core/PostProcesses/bloomEffect";
import { FrameGraphRenderContext } from "./frameGraphRenderContext";
import { FrameGraphContext } from "./frameGraphContext";
import type { TextureHandle, FrameGraphTextureCreationOptions, FrameGraphTextureDescription } from "./frameGraphTextureManager";
import { backbufferColorTextureHandle, FrameGraphTextureManager, FrameGraphTextureNamespace, textureNamespaceExternalPrefix } from "./frameGraphTextureManager";
import type { IFrameGraphPass } from "./Passes/IFrameGraphPass";
import type { IFrameGraphCopyToTextureInputData } from "./Tasks/copyToTextureTask";
import { FrameGraphCopyToTextureTask } from "./Tasks/copyToTextureTask";

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
    const createRTTask = new FrameGraphCreateRenderTextureTask("createRT", creationOptions);
    const bloomTask = new BloomEffect(engine, 0.5, 0.5, 128, Constants.TEXTURETYPE_HALF_FLOAT, false);

    bloomTask.name = "bloom";
    bloomTask.threshold = 0.1;

    const frameGraph = new FrameGraph(engine, true, scene);

    const pp0Handle = frameGraph.importTexture("pp0", pp0.inputTexture);

    const testNumber: number = 2;
    switch (testNumber) {
        case 0: {
            const destinationTexture = frameGraph.createRenderTargetTexture("destination", creationOptions);

            frameGraph.addTask<IFrameGraphCopyToTextureInputData>(copyTask, {
                sourceTexture: pp0Handle,
                outputTexture: destinationTexture,
            });

            copyTask.disabledFromGraph = true;

            frameGraph.addTask<IFrameGraphPostProcessInputData>(bnwTask, {
                sourceTexture: ["copy", "output"],
                outputTexture: destinationTexture,
            });

            frameGraph.addTask<IFrameGraphBloomEffectInputData>(bloomTask, {
                sourceTexture: ["bnw", "output"],
                outputTexture: backbufferColorTextureHandle,
            });
            break;
        }
        case 1: {
            bloomTask.onBeforeTaskRecordFrameGraphObservable.add((context) => {
                context.createRenderTargetTexture("destination", creationOptions);
            });

            frameGraph.addTask<IFrameGraphBloomEffectInputData>(bloomTask, {
                sourceTexture: [textureNamespaceExternalPrefix, "pp0"],
                outputTexture: ["bloom", "destination"],
            });

            frameGraph.addTask<IFrameGraphCreateRenderTextureInputData>(createRTTask, { textureName: "output" });

            frameGraph.addTask<IFrameGraphPostProcessInputData>(bnwTask, {
                sourceTexture: ["bloom", "output"],
                outputTexture: ["createRT", "output"],
            });

            frameGraph.addTask<IFrameGraphCopyToBackbufferColorInputData>(copyToBackbufferTask, { sourceTexture: ["bnw", "output"] });
            break;
        }
        case 2: {
            frameGraph.addTask<IFrameGraphBloomEffectInputData>(bloomTask, {
                sourceTexture: [textureNamespaceExternalPrefix, "pp0"],
            });

            frameGraph.addTask<IFrameGraphPostProcessInputData>(bnwTask, {
                sourceTexture: ["bloom", "output"],
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
        frameGraph.importTexture("pp0", pp0.inputTexture);
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

    private static _IsRenderPassBuilder(pass: IFrameGraphPass): pass is FrameGraphRenderPassBuilder {
        return (pass as FrameGraphRenderPassBuilder).setRenderTarget !== undefined;
    }

    /**
     * Constructs the frame graph
     * @param engine defines the hosting engine
     * @param debugTextures defines a boolean indicating that textures created by the frame graph should be visible in the inspector
     * @param scene defines the scene in which debugging textures are to be created
     */
    constructor(engine: AbstractEngine, debugTextures = false, scene?: Scene) {
        this._textureManager = new FrameGraphTextureManager(engine, debugTextures, scene);
        this._passContext = new FrameGraphContext();
        this._renderContext = new FrameGraphRenderContext(engine, this._textureManager);
    }

    public addTask<T>(task: IFrameGraphTask, inputData?: T extends IFrameGraphInputData ? T : never): void {
        if (this._currentProcessedTask !== null) {
            throw new Error(`Can't add the task "${task.name}" while another task is currently building (task: ${this._currentProcessedTask.name}).`);
        }

        for (const t of this._tasks) {
            if (t.name === task.name) {
                throw new Error(`Task with name "${task.name}" already exists.`);
            }
        }

        task._frameGraphInternals = {
            passes: [],
            passesDisabled: [],
            inputData,
            wasDisabled: task.disabledFromGraph,
        };

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
        this._textureManager.reset();

        for (const task of this._tasks) {
            const internals = task._frameGraphInternals!;

            internals.passes.length = 0;
            internals.passesDisabled.length = 0;

            this._currentProcessedTask = task;

            task.onBeforeTaskRecordFrameGraphObservable?.notifyObservers(this);
            task.recordFrameGraph(this, internals.inputData);
            task.onAfterTaskRecordFrameGraphObservable?.notifyObservers(this);

            for (const pass of internals.passes!) {
                const errMsg = pass._isValid();
                if (errMsg) {
                    throw new Error(`Pass "${pass.name}" is not valid. ${errMsg}`);
                }
                if (FrameGraph._IsRenderPassBuilder(pass)) {
                    internals.outputTextureWhenEnabled = pass.renderTarget;
                }
            }

            for (const pass of internals.passesDisabled!) {
                const errMsg = pass._isValid();
                if (errMsg) {
                    throw new Error(`Pass "${pass.name}" is not valid. ${errMsg}`);
                }
                if (FrameGraph._IsRenderPassBuilder(pass)) {
                    internals.outputTextureWhenDisabled = pass.renderTarget;
                }
            }

            if (internals.outputTextureWhenEnabled !== undefined || internals.outputTextureWhenDisabled !== undefined) {
                internals.outputTextureWhenEnabled = internals.outputTextureWhenEnabled ?? internals.outputTextureWhenDisabled;
                internals.outputTextureWhenDisabled = internals.outputTextureWhenDisabled ?? internals.outputTextureWhenEnabled;
                internals.outputTexture = this._textureManager._createProxyHandle();
                this._textureManager._registerTextureHandleForTask(task, "output", internals.outputTexture);
                this._setTextureOutputForTask(task, true);
            }

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
            this._setTextureOutputForTask(task);

            const internals = task._frameGraphInternals!;
            const passes = task.disabledFromGraph ? internals.passesDisabled : internals.passes;

            for (const pass of passes) {
                pass._execute();
            }
        }
    }

    public importTexture(name: string, texture: RenderTargetWrapper): TextureHandle {
        return this._textureManager.importTexture(name, texture);
    }

    public getTextureDescription(textureId: FrameGraphTaskTexture | TextureHandle): FrameGraphTextureDescription {
        return this._textureManager.getTextureDescription(textureId);
    }

    public getTextureHandle(textureId: FrameGraphTaskTexture | TextureHandle): TextureHandle {
        return this._textureManager.getTextureHandle(textureId);
    }

    public getTextureHandleOrCreateTexture(
        textureId?: FrameGraphTaskTexture | TextureHandle,
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
        const namespace = this._currentProcessedTask ? FrameGraphTextureNamespace.Task : FrameGraphTextureNamespace.Graph;

        const fullyQualifiedTextureName = this._textureManager.getFullyQualifiedTextureName(name, namespace, this._currentProcessedTask);

        return this._textureManager.createRenderTargetTexture(fullyQualifiedTextureName, namespace, creationOptions);
    }

    public dispose(): void {
        this._textureManager.dispose();
        this._tasks.length = 0;
        this._mapNameToTask.clear();
    }

    private _setTextureOutputForTask(task: IFrameGraphTask, force = false): void {
        const internals = task._frameGraphInternals!;

        if (!force && task.disabledFromGraph === internals.wasDisabled) {
            return;
        }

        internals.wasDisabled = task.disabledFromGraph;

        if (internals.outputTexture !== undefined) {
            if (task.disabledFromGraph) {
                this._textureManager._textures[internals.outputTexture]!.texture = this._textureManager._textures[internals.outputTextureWhenDisabled!]!.texture;
                this._textureManager._textures[internals.outputTexture]!.systemType = this._textureManager._textures[internals.outputTextureWhenDisabled!]!.systemType;
                this._textureManager._textureDescriptions[internals.outputTexture] = this._textureManager._textureDescriptions[internals.outputTextureWhenDisabled!];
            } else {
                this._textureManager._textures[internals.outputTexture]!.texture = this._textureManager._textures[internals.outputTextureWhenEnabled!]!.texture;
                this._textureManager._textures[internals.outputTexture]!.systemType = this._textureManager._textures[internals.outputTextureWhenEnabled!]!.systemType;
                this._textureManager._textureDescriptions[internals.outputTexture] = this._textureManager._textureDescriptions[internals.outputTextureWhenEnabled!];
            }
        }
    }
}
