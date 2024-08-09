import type { Scene } from "../scene";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { RenderTargetWrapper } from "../Engines/renderTargetWrapper";
import { Constants } from "../Engines/constants";
import { BlackAndWhitePostProcess } from "core/PostProcesses/blackAndWhitePostProcess";
import { PassPostProcess } from "core/PostProcesses/passPostProcess";
import type { FrameGraphTaskTexture, IFrameGraphInputData, IFrameGraphTask } from "./Tasks/IFrameGraphTask";
import type { IFrameGraphPostProcessInputData, PostProcess } from "core/PostProcesses/postProcess";
import type { Observer } from "core/Misc";
import { FrameGraphPassBuilder } from "./Passes/passBuilder";
import { FrameGraphRenderPassBuilder } from "./Passes/renderPassBuilder";
import type { IFrameGraphCopyToBackbufferInputData } from "./Tasks/copyToBackbufferColorTask";
import { FrameGraphCopyToBackbufferColorTask } from "./Tasks/copyToBackbufferColorTask";
import type { IFrameGraphCreateRenderTextureInputData } from "./Tasks/createRenderTextureTask";
import { FrameGraphCreateRenderTextureTask } from "./Tasks/createRenderTextureTask";
import type { IFrameGraphBloomEffectInputData } from "core/PostProcesses/bloomEffect";
import { BloomEffect } from "core/PostProcesses/bloomEffect";
import { FrameGraphRenderContext } from "./frameGraphRenderContext";
import { FrameGraphContext } from "./frameGraphContext";
import type { TextureHandle, FrameGraphTextureCreationOptions, FrameGraphTextureDescription } from "./frameGraphTextureManager";
import { backbufferColorTextureHandle, FrameGraphTextureManager, FrameGraphTextureNamespace, textureNamespaceExternalPrefix } from "./frameGraphTextureManager";

export function testRenderGraph(engine: AbstractEngine, scene: Scene) {
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

    const bnwTask = new BlackAndWhitePostProcess("bnw", 1, null, undefined, engine);
    const copyTask = new FrameGraphCopyToBackbufferColorTask("copytobackbuffer");
    const createRTTask = new FrameGraphCreateRenderTextureTask("createRT", creationOptions);
    const bloomTask = new BloomEffect(engine, 0.5, 0.5, 128, Constants.TEXTURETYPE_HALF_FLOAT, false);
    bloomTask.name = "bloom";

    bloomTask.threshold = 0.1;

    let obs: Observer<Scene> | null = null;
    let obs2: Observer<PostProcess> | null = null;

    const frameGraph = new FrameGraph(engine, true, scene);

    const pp0Handle = frameGraph.importTexture("pp0", pp0.inputTexture);

    const bnwFirst = false;
    if (bnwFirst) {
        const destinationTexture = frameGraph.createRenderTargetTexture("destination", creationOptions);

        frameGraph.addTask<IFrameGraphPostProcessInputData>(bnwTask, {
            sourceTexture: pp0Handle,
            outputTexture: destinationTexture,
        });

        frameGraph.addTask<IFrameGraphBloomEffectInputData>(bloomTask, {
            sourceTexture: destinationTexture,
            outputTexture: backbufferColorTextureHandle,
        });
    } else {
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

        frameGraph.addTask<IFrameGraphCopyToBackbufferInputData>(copyTask, { sourceTexture: ["createRT", "output"] });
    }

    frameGraph.build();

    (window as any).fg = frameGraph;

    scene.onAfterRenderObservable.remove(obs);
    obs = scene.onAfterRenderObservable.add(() => {
        frameGraph.execute();
    });

    pp0.onSizeChangedObservable.remove(obs2);
    obs2 = pp0.onSizeChangedObservable.add(() => {
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

    private _tasks: { task: IFrameGraphTask; inputData?: IFrameGraphInputData }[] = [];
    private _mapNameToTask: Map<string, IFrameGraphTask> = new Map();
    private _currentProcessedTask: IFrameGraphTask | null = null;

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

        for (const taskBlock of this._tasks) {
            if (taskBlock.task.name === task.name) {
                throw new Error(`Task with name "${taskBlock.task.name}" already exists.`);
            }
        }

        task._passes = task._passes || [];

        this._tasks.push({ task, inputData });
        this._mapNameToTask.set(task.name, task);
    }

    public addPass(name: string): FrameGraphPassBuilder<FrameGraphContext> {
        if (!this._currentProcessedTask) {
            throw new Error("A pass must be created during a Task.addToFrameGraph execution.");
        }

        const pass = new FrameGraphPassBuilder(name, this._textureManager, this._currentProcessedTask, this._passContext);

        this._currentProcessedTask._passes!.push(pass);

        return pass;
    }

    public addRenderPass(name: string): FrameGraphRenderPassBuilder {
        if (!this._currentProcessedTask) {
            throw new Error("A pass must be created during a Task.addToFrameGraph execution.");
        }

        const pass = new FrameGraphRenderPassBuilder(name, this._textureManager, this._currentProcessedTask, this._renderContext);

        this._currentProcessedTask._passes!.push(pass);

        return pass;
    }

    public build(): void {
        this._textureManager.reset();
        for (const { task, inputData } of this._tasks) {
            task._passes!.length = 0;

            this._currentProcessedTask = task;

            task.onBeforeTaskRecordFrameGraphObservable?.notifyObservers(this);
            task.recordFrameGraph(this, inputData);
            task.onAfterTaskRecordFrameGraphObservable?.notifyObservers(this);

            for (const pass of task._passes!) {
                const errMsg = pass._isValid();
                if (errMsg) {
                    throw new Error(`Pass "${pass.name}" is not valid. ${errMsg}`);
                }
            }

            this._currentProcessedTask = null;
        }
    }

    public execute(): void {
        this._renderContext._bindRenderTarget();
        for (const taskBlock of this._tasks) {
            for (const pass of taskBlock.task._passes!) {
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

    public createRenderTargetTexture(name: string, creationOptions: FrameGraphTextureCreationOptions): TextureHandle {
        const namespace = this._currentProcessedTask ? FrameGraphTextureNamespace.Task : FrameGraphTextureNamespace.Graph;

        const fullyQualifiedTextureName = this._textureManager.getFullyQualifiedTextureName(name, namespace, this._currentProcessedTask);

        return this._textureManager.createRenderTargetTexture(fullyQualifiedTextureName, namespace, creationOptions);
    }

    public dispose(): void {
        this._textureManager.dispose();
        this._tasks.length = 0;
        this._mapNameToTask.clear();
    }
}
