import type { Scene } from "../scene";
import type { Nullable } from "../types";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { RenderTargetWrapper } from "../Engines/renderTargetWrapper";
import { Constants } from "../Engines/constants";
import type { RenderTargetCreationOptions, TextureSize } from "../Materials/Textures/textureCreationOptions";
import { Texture } from "core/Materials/Textures/texture";
import { BlackAndWhitePostProcess } from "core/PostProcesses/blackAndWhitePostProcess";
import { PassPostProcess } from "core/PostProcesses/passPostProcess";
import type { FrameGraphTaskTexture, IFrameGraphInputData, IFrameGraphTask } from "./Tasks/IFrameGraphTask";
import type { IFrameGraphPostProcessInputData } from "core/PostProcesses/postProcess";
import type { PostProcess } from "core/PostProcesses/postProcess";
import type { Observer } from "core/Misc";
import type { IFrameGraphPass } from "./PassBuilders/IFrameGraphPass";
import { FrameGraphPassBuilder } from "./PassBuilders/passBuilder";
import { FrameGraphRenderPassBuilder } from "./PassBuilders/renderPassBuilder";
//import type { IFrameGraphCopyToBackbufferInputData } from "./Tasks/copyToBackbufferColorTask";
//import { FrameGraphCopyToBackbufferColorTask } from "./Tasks/copyToBackbufferColorTask";
//import type { IFrameGraphCreateRenderTextureInputData } from "./Tasks/createRenderTextureTask";
//import { FrameGraphCreateRenderTextureTask } from "./Tasks/createRenderTextureTask";
import type { IFrameGraphBloomEffectInputData } from "core/PostProcesses/bloomEffect";
import { BloomEffect } from "core/PostProcesses/bloomEffect";
import { FrameGraphRenderContext } from "./frameGraphRenderContext";
import { FrameGraphContext } from "./frameGraphContext";
import type { TextureHandle } from "./textureHandle";
import { backbufferColorTextureHandle } from "./textureHandle";

export type FrameGraphTextureCreationOptions = {
    /** Size of the render target texture. If sizeIsPercentage is true, these are percentages relative to the screen size */
    size: TextureSize;
    /** Options used to create the render target texture */
    options: RenderTargetCreationOptions;
    /** If true, indicates that "size" is percentages relative to the screen size */
    sizeIsPercentage: boolean;
};

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
    //const copyTask = new FrameGraphCopyToBackbufferColorTask("copytobackbuffer");
    //const createRTTask = new FrameGraphCreateRenderTextureTask("createRT", creationOptions);
    const bloomTask = new BloomEffect(engine, 0.5, 0.5, 128, Constants.TEXTURETYPE_HALF_FLOAT, false);

    bloomTask.threshold = 0.1;

    let obs: Observer<Scene> | null = null;
    let obs2: Observer<PostProcess> | null = null;

    const frameGraph = new FrameGraph(engine, true, scene);

    frameGraph.importTexture("pp0", pp0.inputTexture);

    //frameGraph.addTask<IFrameGraphCreateRenderTextureInputData>(createRTTask, { outputTextureName: "output" });

    bnwTask.onBeforeTaskAddedToFrameGraphObservable.add((context) => {
        context.createRenderTargetTexture("destination", creationOptions);
    });

    frameGraph.addTask<IFrameGraphPostProcessInputData>(bnwTask, {
        sourceTexturePath: ["external", "pp0"],
        destinationTexturePath: ["bnw", "destination"],
        outputTextureName: "output",
    });

    frameGraph.addTask<IFrameGraphBloomEffectInputData>(bloomTask, {
        sourceTexturePath: ["bnw", "output"],
        destinationTexturePath: [null, "backbufferColor"],
        outputTextureName: "output",
    });

    // frameGraph.addTask<IFrameGraphBloomEffectInputData>(bloomTask, {
    //     sourceTexturePath: ["external", "pp0"],
    //     destinationTexturePath: [null, "backbufferColor"],
    //     outputTextureName: "output",
    // });

    //frameGraph.addTask<IFrameGraphCopyToBackbufferInputData>(copyTask, { sourceTexturePath: ["bnw", "output"] });

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
    private _engine: AbstractEngine;

    private _passContext: FrameGraphContext;
    private _renderContext: FrameGraphRenderContext;

    /** @internal */
    public _textures: ({ texture: Nullable<RenderTargetWrapper>; isExternal: boolean } | undefined)[] = [];
    private _textureDescriptions: { size: { width: number; height: number }; options: RenderTargetCreationOptions }[] = [];
    private _texturesIndex = 0;
    private _texturesDebug: Array<Texture> = [];
    private _textureMap: Map<string, TextureHandle> = new Map();

    private _tasks: { task: IFrameGraphTask; inputData?: IFrameGraphInputData }[] = [];
    private _mapNameToTask: Map<string, IFrameGraphTask> = new Map();
    private _currentProcessedTask: IFrameGraphTask | null = null;
    private _passes: { task: IFrameGraphTask; passes: IFrameGraphPass[] }[] = [];

    /**
     * Constructs the frame graph
     * @param engine defines the hosting engine
     * @param _debugTextures defines a boolean indicating that textures created by the frame graph should be visible in the inspector
     * @param _scene defines the scene in which debugging textures are to be created
     */
    constructor(
        engine: AbstractEngine,
        private _debugTextures = false,
        private _scene?: Scene
    ) {
        this._engine = engine;
        this._textures[backbufferColorTextureHandle] = { texture: null, isExternal: true };
        this._textureMap.set("backbufferColor", backbufferColorTextureHandle);
        // todo: fill this._textureDescriptions[0] with backbuffer color description
        this._passContext = new FrameGraphContext();
        this._renderContext = new FrameGraphRenderContext(engine, this);
    }

    public addTask<T>(task: IFrameGraphTask, inputData?: T extends IFrameGraphInputData ? T : never) {
        if (this._currentProcessedTask !== null) {
            throw new Error(`Can't add the task "${task.name}" while another task is currently building (task: ${this._currentProcessedTask.name}).`);
        }

        for (const taskBlock of this._tasks) {
            if (taskBlock.task.name === task.name) {
                throw new Error(`Task with name "${taskBlock.task.name}" already exists.`);
            }
        }

        this._tasks.push({ task, inputData });
        this._mapNameToTask.set(task.name, task);
    }

    public addPass(name: string) {
        const pass = new FrameGraphPassBuilder(name, this._passContext);
        this._passes[this._passes.length - 1].passes.push(pass);
        return pass;
    }

    public addRenderPass(name: string) {
        const pass = new FrameGraphRenderPassBuilder(name, this._renderContext);
        this._passes[this._passes.length - 1].passes.push(pass);
        return pass;
    }

    public build() {
        this._passes.length = 0;
        this._releaseTextures();
        for (const { task, inputData } of this._tasks) {
            this._passes.push({ task, passes: [] });

            this._currentProcessedTask = task;

            task.onBeforeTaskAddedToFrameGraphObservable?.notifyObservers(this);
            task.addToFrameGraph(this, inputData);
            task.onAfterTaskAddedToFrameGraphObservable?.notifyObservers(this);

            this._currentProcessedTask = null;
        }

        // Check passes
        for (const passBlock of this._passes) {
            for (const pass of passBlock.passes) {
                if (!pass._isValid()) {
                    throw new Error(`Pass "${pass.name}" is not valid.`);
                }
            }
        }
    }

    public execute() {
        this._renderContext.bindRenderTarget();
        for (const blockPass of this._passes) {
            if (!blockPass.task.executeCondition || blockPass.task.executeCondition()) {
                for (const pass of blockPass.passes) {
                    pass._execute();
                }
            }
        }
    }

    public importTexture(name: string, texture: RenderTargetWrapper) {
        const handle = this._createHandleForTexture(texture, true);

        this._textureMap.set("external." + name, handle);

        const internalTexture = texture.texture;
        if (internalTexture) {
            this._textureDescriptions[handle] = {
                size: { width: texture.width, height: texture.height },
                options: {
                    generateMipMaps: internalTexture.generateMipMaps,
                    type: internalTexture.type,
                    samplingMode: internalTexture.samplingMode,
                    format: internalTexture.format,
                    samples: internalTexture.samples,
                    useSRGBBuffer: false,
                    label: internalTexture.label,
                    generateDepthBuffer: texture._generateDepthBuffer,
                    generateStencilBuffer: texture._generateStencilBuffer,
                    noColorAttachment: !texture.textures,
                },
            };
        }

        return handle;
    }

    public getTextureDescriptionFromHandle(handle: TextureHandle) {
        return this._textureDescriptions[handle];
    }

    public getTextureDescriptionFromTask(texturePath: FrameGraphTaskTexture) {
        const path = texturePath[0] ? texturePath[0] + "." + texturePath[1] : texturePath[1];
        const textureHandle = this._textureMap.get(path);
        if (textureHandle === undefined) {
            throw new Error(`Can't retrieve the texture "${texturePath[1]}" from task "${texturePath[0]}".`);
        }
        return this._textureDescriptions[textureHandle];
    }

    public registerTextureHandleForTask(task: IFrameGraphTask, textureName: string, textureHandle: TextureHandle) {
        this._textureMap.set(task.name + "." + textureName, textureHandle);
    }

    public getTextureHandleFromTask(texturePath: FrameGraphTaskTexture): TextureHandle {
        const path = texturePath[0] ? texturePath[0] + "." + texturePath[1] : texturePath[1];
        const textureHandle = this._textureMap.get(path);
        if (textureHandle === undefined) {
            throw new Error(`Can't retrieve the texture "${texturePath[1]}" from task "${texturePath[0]}".`);
        }
        return textureHandle;
    }

    public createRenderTargetTexture(name: string, creationOptions: FrameGraphTextureCreationOptions): TextureHandle {
        if (!this._currentProcessedTask) {
            throw new Error("A render target texture must be created during a Task.addToFrameGraph execution.");
        }

        let width: number;
        let height: number;

        if ((creationOptions.size as { width: number }).width !== undefined) {
            width = (creationOptions.size as { width: number }).width;
            height = (creationOptions.size as { height: number }).height;
        } else {
            width = height = creationOptions.size as number;
        }

        const size = creationOptions.sizeIsPercentage
            ? {
                  width: (this._engine.getRenderWidth() * width) / 100,
                  height: (this._engine.getRenderHeight() * height) / 100,
              }
            : { width, height };

        const options = { ...creationOptions.options };

        const rtt = this._engine.createRenderTargetTexture(size, options);

        if (this._debugTextures && this._scene) {
            const texture = new Texture(null, this._scene);

            texture.name = name;
            texture._texture = rtt.texture!;
            texture._texture.incrementReferences();

            this._texturesDebug.push(texture);
        }

        const handle = this._createHandleForTexture(rtt, false);

        this._textureDescriptions[handle] = { size, options: creationOptions.options };
        this.registerTextureHandleForTask(this._currentProcessedTask, name, handle);

        return handle;
    }

    public dispose() {
        this._releaseTextures();
    }

    private _createHandleForTexture(texture: RenderTargetWrapper, isExternal = false) {
        while (this._textures[this._texturesIndex] !== undefined) {
            this._texturesIndex++;
        }

        this._textures[this._texturesIndex++] = { texture, isExternal };

        return this._texturesIndex - 1;
    }

    private _releaseTextures() {
        for (const texture of this._texturesDebug) {
            texture.dispose();
        }
        this._texturesDebug.length = 0;

        let index = -1;
        for (let i = 0; i < this._textures.length; i++) {
            const wrapper = this._textures[i];
            if (wrapper === undefined) {
                continue;
            }
            if (!wrapper.isExternal) {
                wrapper.texture?.dispose();
                this._textures[i] = undefined;
            } else {
                index = i;
            }
        }
        this._textures.length = index + 1;
        this._textureDescriptions.length = index + 1;
        this._texturesIndex = 0;
    }
}
