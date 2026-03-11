import type {
    Scene,
    AbstractEngine,
    TextureSize,
    Nullable,
    FrameGraphTextureCreationOptions,
    FrameGraphTextureHandle,
    InternalTextureCreationOptions,
    InternalTexture,
    FrameGraphTextureOptions,
    FrameGraphTextureDescription,
    RenderTargetWrapper,
    FrameGraphTask,
    IFrameGraphPass,
} from "core/index";
import { getDimensionsFromTextureSize, textureSizeIsObject } from "../Materials/Textures/textureCreationOptions";
import { Texture } from "../Materials/Textures/texture";
import { backbufferColorTextureHandle, backbufferDepthStencilTextureHandle } from "./frameGraphTypes";
import { Constants } from "../Engines/constants";
import { InternalTextureSource } from "../Materials/Textures/internalTexture";
import { FrameGraphRenderTarget } from "./frameGraphRenderTarget";
import { FrameGraphRenderPass } from "./Passes/renderPass";
import { Logger } from "../Misc/logger";
import { GetTypeForDepthTexture, IsDepthTexture, HasStencilAspect } from "core/Materials/Textures/textureHelper.functions";

type HistoryTexture = {
    textures: Array<Nullable<InternalTexture>>;
    handles: Array<FrameGraphTextureHandle>;
    index: number; // current index in textures array - in the current frame, textures[index] is the write texture, textures[index^1] is the read texture - index is flipped at the end of each frame
    references: Array<{ renderTargetWrapper: RenderTargetWrapper; textureIndex: number }>; // render target wrappers that reference this history texture
};

type TextureLifespan = {
    firstTask: number;
    lastTask: number;
};

type TextureEntry = {
    texture: Nullable<InternalTexture>;
    name: string;
    creationOptions: FrameGraphTextureCreationOptions; // in TextureEntry, creationOptions.size is always an object
    namespace: FrameGraphTextureNamespace;
    textureIndex?: number; // Index of the texture in the types, formats, etc array of FrameGraphTextureOptions (default: 0)
    debug?: Texture;
    refHandle?: FrameGraphTextureHandle; // Handle of the texture this one is referencing - used for dangling handles
    textureDescriptionHash?: string; // a hash of the texture creation options
    lifespan?: TextureLifespan;
    aliasHandle?: FrameGraphTextureHandle; // Handle of the texture this one is aliasing - can be set after execution of texture allocation optimization
    historyTexture?: boolean; // True if the texture is part of a history texture
};

enum FrameGraphTextureNamespace {
    Task,
    Graph,
    External,
}

/**
 * Manages the textures used by a frame graph
 */
export class FrameGraphTextureManager {
    private static _Counter = 2; // 0 and 1 are reserved for backbuffer textures

    /** @internal */
    public readonly _textures: Map<FrameGraphTextureHandle, TextureEntry> = new Map();

    /** @internal */
    public readonly _historyTextures: Map<FrameGraphTextureHandle, HistoryTexture> = new Map();

    /** @internal */
    public _isRecordingTask = false;

    /**
     * Gets or sets a boolean indicating if debug logs should be shown when applying texture allocation optimization (default: false)
     */
    public showDebugLogsForTextureAllcationOptimization = false;

    private _backBufferTextureEntry: Nullable<TextureEntry> = null;
    private _backBufferDepthStencilTextureEntry: Nullable<TextureEntry> = null;
    private _backBufferTextureOverriden = false;

    /**
     * Constructs a new instance of the texture manager
     * @param engine The engine to use
     * @param _debugTextures If true, debug textures will be created so that they are visible in the inspector
     * @param _scene The scene the manager belongs to
     */
    constructor(
        public readonly engine: AbstractEngine,
        private readonly _debugTextures = false,
        private readonly _scene: Scene
    ) {
        this._addSystemTextures();
    }

    /**
     * Checks if a handle is a backbuffer handle (color or depth/stencil)
     * @param handle The handle to check
     * @returns True if the handle is a backbuffer handle
     */
    public isBackbuffer(handle: FrameGraphTextureHandle): boolean {
        if (this._backBufferTextureOverriden) {
            return false;
        }

        return this._isBackbuffer(handle);
    }

    /** @internal */
    public _isBackbuffer(handle: FrameGraphTextureHandle): boolean {
        if (handle === backbufferColorTextureHandle || handle === backbufferDepthStencilTextureHandle) {
            return true;
        }

        const textureEntry = this._textures.get(handle);
        if (!textureEntry) {
            return false;
        }

        return textureEntry.refHandle === backbufferColorTextureHandle || textureEntry.refHandle === backbufferDepthStencilTextureHandle;
    }

    /**
     * Checks if a handle is a backbuffer color handle
     * @param handle The handle to check
     * @returns True if the handle is a backbuffer color handle
     */
    public isBackbufferColor(handle: FrameGraphTextureHandle): boolean {
        if (this._backBufferTextureOverriden) {
            return false;
        }

        if (handle === backbufferColorTextureHandle) {
            return true;
        }

        const textureEntry = this._textures.get(handle);
        if (!textureEntry) {
            return false;
        }

        return textureEntry.refHandle === backbufferColorTextureHandle;
    }

    /**
     * Checks if a handle is a backbuffer depth/stencil handle
     * @param handle The handle to check
     * @returns True if the handle is a backbuffer depth/stencil handle
     */
    public isBackbufferDepthStencil(handle: FrameGraphTextureHandle): boolean {
        if (this._backBufferTextureOverriden) {
            return false;
        }

        if (handle === backbufferDepthStencilTextureHandle) {
            return true;
        }

        const textureEntry = this._textures.get(handle);
        if (!textureEntry) {
            return false;
        }

        return textureEntry.refHandle === backbufferDepthStencilTextureHandle;
    }

    /**
     * Checks if a handle is a history texture (or points to a history texture, for a dangling handle)
     * @param handle The handle to check
     * @param checkAllTextures If false (default), the function will check if the handle is the main handle of a history texture (the first handle of the history texture).
     *   If true, the function will also check if the handle is one of the other handles of a history texture.
     * @returns True if the handle is a history texture, otherwise false
     */
    public isHistoryTexture(handle: FrameGraphTextureHandle, checkAllTextures = false): boolean {
        const entry = this._textures.get(handle);
        if (!entry) {
            return false;
        }

        handle = entry.refHandle ?? handle;

        if (!checkAllTextures) {
            return this._historyTextures.has(handle);
        }

        return this._textures.get(handle)?.historyTexture === true;
    }

    /**
     * Gets the creation options of a texture
     * @param handle Handle of the texture
     * @param preserveHistoryTextureFlag If true, the isHistoryTexture flag in the returned creation options will be the same as when the texture was created (default: false)
     * @returns The creation options of the texture
     */
    public getTextureCreationOptions(handle: FrameGraphTextureHandle, preserveHistoryTextureFlag = false): FrameGraphTextureCreationOptions {
        handle = this._textures.get(handle)?.refHandle ?? handle;

        const entry = this._textures.get(handle)!;
        const creationOptions = entry.creationOptions;

        return {
            size: textureSizeIsObject(creationOptions.size) ? { ...creationOptions.size } : creationOptions.size,
            sizeIsPercentage: creationOptions.sizeIsPercentage,
            options: FrameGraphTextureManager.CloneTextureOptions(creationOptions.options, entry.textureIndex),
            isHistoryTexture: preserveHistoryTextureFlag ? creationOptions.isHistoryTexture : false,
        };
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
                ? creationOptions.size
                : { width: creationOptions.size, height: creationOptions.size }
            : this.getAbsoluteDimensions(creationOptions.size);

        return {
            size,
            options: creationOptions.options,
        };
    }

    /**
     * Gets a texture handle or creates a new texture if the handle is not provided.
     * If handle is not provided, newTextureName and creationOptions must be provided.
     * @param handle If provided, will simply return the handle
     * @param newTextureName Name of the new texture to create
     * @param creationOptions Options to use when creating the new texture
     * @returns The handle to the texture.
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
     * Gets a texture from a handle.
     * Note that if the texture is a history texture, the read texture for the current frame will be returned, except if historyGetWriteTexture is true.
     * @param handle The handle of the texture
     * @param historyGetWriteTexture If true and the texture is a history texture, the write texture for the current frame will be returned (default: false)
     * @returns The texture or null if not found
     */
    public getTextureFromHandle(handle: FrameGraphTextureHandle, historyGetWriteTexture?: boolean): Nullable<InternalTexture> {
        const entry = this._textures.get(handle);
        const refHandle = entry?.refHandle;
        const finalEntry = refHandle !== undefined ? this._textures.get(refHandle) : entry;
        const finalHandle = refHandle !== undefined ? refHandle : handle;

        const historyEntry = this._historyTextures.get(finalHandle);
        if (historyEntry) {
            return historyEntry.textures[historyGetWriteTexture ? historyEntry.index : historyEntry.index ^ 1];
        }
        return finalEntry!.texture;
    }

    /**
     * Imports a texture into the texture manager
     * @param name Name of the texture
     * @param texture Texture to import
     * @param handle Existing handle to use for the texture. If not provided (default), a new handle will be created.
     * @returns The handle to the texture
     */
    public importTexture(name: string, texture: InternalTexture, handle?: FrameGraphTextureHandle): FrameGraphTextureHandle {
        if (handle !== undefined) {
            this._freeEntry(handle);
        }

        const creationOptions: FrameGraphTextureCreationOptions = {
            size: { width: texture.width, height: texture.height },
            sizeIsPercentage: false,
            isHistoryTexture: false,
            options: {
                createMipMaps: texture.generateMipMaps,
                samples: texture.samples,
                types: [texture.type],
                formats: [texture.format],
                useSRGBBuffers: [texture._useSRGBBuffer],
                creationFlags: [texture._creationFlags],
                labels: texture.label ? [texture.label] : ["imported"],
            },
        };

        return this._createHandleForTexture(name, texture, creationOptions, FrameGraphTextureNamespace.External, handle);
    }

    /**
     * Creates a new render target texture
     * If multiple textures are described in FrameGraphTextureCreationOptions, the handle of the first texture is returned, handle+1 is the handle of the second texture, etc.
     * @param name Name of the texture
     * @param creationOptions Options to use when creating the texture
     * @param handle Existing handle to use for the texture. If not provided (default), a new handle will be created.
     * @returns The handle to the texture
     */
    public createRenderTargetTexture(name: string, creationOptions: FrameGraphTextureCreationOptions, handle?: FrameGraphTextureHandle): FrameGraphTextureHandle {
        return this._createHandleForTexture(
            name,
            null,
            {
                size: textureSizeIsObject(creationOptions.size) ? { ...creationOptions.size } : creationOptions.size,
                sizeIsPercentage: creationOptions.sizeIsPercentage,
                isHistoryTexture: creationOptions.isHistoryTexture,
                options: FrameGraphTextureManager.CloneTextureOptions(creationOptions.options, undefined, true),
            },
            this._isRecordingTask ? FrameGraphTextureNamespace.Task : FrameGraphTextureNamespace.Graph,
            handle
        );
    }

    /**
     * Creates a (frame graph) render target wrapper
     * Note that renderTargets or renderTargetDepth can be undefined, but not both at the same time!
     * @param name Name of the render target wrapper
     * @param renderTargets Render target handles (textures) to use
     * @param renderTargetDepth Render target depth handle (texture) to use
     * @param depthReadOnly If true, the depth buffer will be read-only
     * @param stencilReadOnly If true, the stencil buffer will be read-only
     * @returns The created render target wrapper
     */
    public createRenderTarget(
        name: string,
        renderTargets?: FrameGraphTextureHandle | FrameGraphTextureHandle[],
        renderTargetDepth?: FrameGraphTextureHandle,
        depthReadOnly?: boolean,
        stencilReadOnly?: boolean
    ): FrameGraphRenderTarget {
        const renderTarget = new FrameGraphRenderTarget(name, this, renderTargets, renderTargetDepth);

        const rtw = renderTarget.renderTargetWrapper;

        if (rtw !== undefined) {
            rtw.depthReadOnly = !!depthReadOnly;
            rtw.stencilReadOnly = !!stencilReadOnly;

            if (renderTargets) {
                const handles = Array.isArray(renderTargets) ? renderTargets : [renderTargets];

                for (let i = 0; i < handles.length; i++) {
                    let handle = handles[i];
                    handle = this._textures.get(handle)?.refHandle ?? handle;

                    const historyEntry = this._historyTextures.get(handle);
                    if (historyEntry) {
                        historyEntry.references.push({ renderTargetWrapper: rtw, textureIndex: i });

                        rtw.setTexture(historyEntry.textures[historyEntry.index]!, i, false);
                    }
                }
            }
        }

        return renderTarget;
    }

    /**
     * Creates a handle which is not associated with any texture.
     * Call resolveDanglingHandle to associate the handle with a valid texture handle.
     * @returns The dangling handle
     */
    public createDanglingHandle() {
        return FrameGraphTextureManager._Counter++;
    }

    /**
     * Associates a texture with a dangling handle
     * @param danglingHandle The dangling handle
     * @param handle The handle to associate with the dangling handle (if not provided, a new texture handle will be created, using the newTextureName and creationOptions parameters)
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
            this.createRenderTargetTexture(newTextureName, creationOptions, danglingHandle);
            return;
        }

        const textureEntry = this._textures.get(handle);

        if (textureEntry === undefined) {
            throw new Error(`resolveDanglingHandle: Handle ${handle} does not exist!`);
        }

        handle = textureEntry.refHandle ?? handle; // gets the refHandle if handle is a (resolved) dangling handle itself

        this._textures.set(danglingHandle, {
            texture: textureEntry.texture,
            refHandle: handle,
            name: textureEntry.name,
            creationOptions: {
                size: { ...(textureEntry.creationOptions.size as { width: number; height: number; depth?: number; layers?: number }) },
                options: FrameGraphTextureManager.CloneTextureOptions(textureEntry.creationOptions.options),
                sizeIsPercentage: textureEntry.creationOptions.sizeIsPercentage,
                isHistoryTexture: false,
            },
            namespace: textureEntry.namespace,
            textureIndex: textureEntry.textureIndex,
        });
    }

    /**
     * Gets the absolute dimensions of a texture.
     * @param size The size of the texture. Width and height must be expressed as a percentage of the screen size (100=100%)!
     * @param screenWidth The width of the screen (default: the width of the rendering canvas)
     * @param screenHeight The height of the screen (default: the height of the rendering canvas)
     * @returns The absolute dimensions of the texture
     */
    public getAbsoluteDimensions(size: TextureSize, screenWidth?: number, screenHeight?: number): { width: number; height: number } {
        if (this._backBufferTextureOverriden) {
            const backbufferColorTextureSize = this._textures.get(backbufferColorTextureHandle)!.creationOptions.size as { width: number; height: number };

            screenWidth ??= backbufferColorTextureSize.width;
            screenHeight ??= backbufferColorTextureSize.height;
        } else {
            screenWidth ??= this.engine.getRenderWidth(true);
            screenHeight ??= this.engine.getRenderHeight(true);
        }

        const { width, height } = getDimensionsFromTextureSize(size);

        return {
            width: Math.floor((width * screenWidth) / 100),
            height: Math.floor((height * screenHeight) / 100),
        };
    }

    /**
     * Gets the absolute dimensions of a texture from its handle or creation options.
     * @param handleOrCreationOptions The handle or creation options of the texture
     * @returns The absolute dimensions of the texture
     */
    public getTextureAbsoluteDimensions(handleOrCreationOptions: FrameGraphTextureHandle | FrameGraphTextureCreationOptions): { width: number; height: number } {
        if (typeof handleOrCreationOptions === "number") {
            handleOrCreationOptions = this.getTextureCreationOptions(handleOrCreationOptions);
        }

        return !handleOrCreationOptions.sizeIsPercentage
            ? textureSizeIsObject(handleOrCreationOptions.size)
                ? handleOrCreationOptions.size
                : { width: handleOrCreationOptions.size, height: handleOrCreationOptions.size }
            : this.getAbsoluteDimensions(handleOrCreationOptions.size);
    }

    /**
     * Calculates the total byte size of all textures used by the frame graph texture manager (including external textures)
     * @param optimizedSize True if the calculation should not factor in aliased textures
     * @param outputWidth The output width of the frame graph. Will be used to calculate the size of percentage-based textures
     * @param outputHeight The output height of the frame graph. Will be used to calculate the size of percentage-based textures
     * @returns The total size of all textures
     */
    public computeTotalTextureSize(optimizedSize: boolean, outputWidth: number, outputHeight: number) {
        let totalSize = 0;

        this._textures.forEach((entry, handle) => {
            if (
                (!this._backBufferTextureOverriden && (handle === backbufferColorTextureHandle || handle === backbufferDepthStencilTextureHandle)) ||
                entry.refHandle !== undefined
            ) {
                return;
            }
            if (optimizedSize && entry.aliasHandle !== undefined) {
                return;
            }

            const options = entry.creationOptions;
            const textureIndex = entry.textureIndex || 0;
            const dimensions = options.sizeIsPercentage ? this.getAbsoluteDimensions(options.size, outputWidth, outputHeight) : getDimensionsFromTextureSize(options.size);

            const blockInfo = FrameGraphTextureManager._GetTextureBlockInformation(
                options.options.types?.[textureIndex] ?? Constants.TEXTURETYPE_UNSIGNED_BYTE,
                options.options.formats![textureIndex]
            );

            const textureByteSize = Math.ceil(dimensions.width / blockInfo.width) * Math.ceil(dimensions.height / blockInfo.height) * blockInfo.length;

            let byteSize = textureByteSize;

            if (options.options.createMipMaps) {
                byteSize = Math.floor((byteSize * 4) / 3);
            }

            if ((options.options.samples || 1) > 1) {
                // We need an additional texture in the case of MSAA
                byteSize += textureByteSize;
            }

            totalSize += byteSize;
        });

        return totalSize;
    }

    /**
     * True if the back buffer texture has been overriden by a call to setBackBufferTexture
     */
    public get backBufferTextureOverriden() {
        return this._backBufferTextureOverriden;
    }

    /**
     * Overrides the default back buffer color/depth-stencil textures used by the frame graph.
     * Note that if both textureCreationOptions and depthStencilTextureCreationOptions are provided,
     * the engine will use them to create the back buffer color and depth/stencil textures respectively.
     * In that case, width and height are ignored.
     * @param width The width of the back buffer color/depth-stencil texture (if 0, the engine's current back buffer color/depth-stencil texture width will be used)
     * @param height The height of the back buffer color/depth-stencil texture (if 0, the engine's current back buffer color/depth-stencil texture height will be used)
     * @param textureCreationOptions The color texture creation options (optional)
     * @param depthStencilTextureCreationOptions The depth/stencil texture creation options (optional)
     */
    public setBackBufferTextures(
        width: number,
        height: number,
        textureCreationOptions?: FrameGraphTextureCreationOptions,
        depthStencilTextureCreationOptions?: FrameGraphTextureCreationOptions
    ) {
        if ((width === 0 || height === 0) && (!textureCreationOptions || !depthStencilTextureCreationOptions)) {
            if (this._backBufferTextureOverriden) {
                let entry = this._textures.get(backbufferColorTextureHandle)!;

                entry.texture?.dispose();
                entry.texture = null;
                entry.debug?.dispose();
                entry.debug = undefined;

                entry = this._textures.get(backbufferDepthStencilTextureHandle)!;
                entry.texture?.dispose();
                entry.texture = null;
                entry.debug?.dispose();
                entry.debug = undefined;
            }

            this._backBufferTextureEntry = null;
            this._backBufferDepthStencilTextureEntry = null;
            this._backBufferTextureOverriden = false;

            this._addSystemTextures();
            return;
        }

        this._backBufferTextureOverriden = true;

        const size = { width, height };

        this._backBufferTextureEntry = {
            name: "backbuffer color",
            texture: null,
            creationOptions: textureCreationOptions ?? {
                size,
                options: {
                    createMipMaps: false,
                    samples: this.engine.getCreationOptions().antialias ? 4 : 1,
                    types: [Constants.TEXTURETYPE_UNSIGNED_BYTE],
                    formats: [Constants.TEXTUREFORMAT_RGBA],
                    useSRGBBuffers: [false],
                    creationFlags: [0],
                    labels: ["backbuffer color"],
                },
                sizeIsPercentage: false,
            },
            namespace: FrameGraphTextureNamespace.Graph,
            lifespan: {
                firstTask: Number.MAX_VALUE,
                lastTask: 0,
            },
        };
        this._backBufferTextureEntry.textureDescriptionHash = this._createTextureDescriptionHash(this._backBufferTextureEntry.creationOptions);

        this._backBufferDepthStencilTextureEntry = {
            name: "backbuffer depth/stencil",
            texture: null,
            creationOptions: depthStencilTextureCreationOptions ?? {
                size,
                options: {
                    createMipMaps: false,
                    samples: this.engine.getCreationOptions().antialias ? 4 : 1,
                    types: [Constants.TEXTURETYPE_UNSIGNED_BYTE],
                    formats: [this.engine.isStencilEnable ? Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 : Constants.TEXTUREFORMAT_DEPTH32_FLOAT],
                    useSRGBBuffers: [false],
                    creationFlags: [0],
                    labels: ["backbuffer depth/stencil"],
                },
                sizeIsPercentage: false,
            },
            namespace: FrameGraphTextureNamespace.Graph,
            lifespan: {
                firstTask: Number.MAX_VALUE,
                lastTask: 0,
            },
        };
        this._backBufferDepthStencilTextureEntry.textureDescriptionHash = this._createTextureDescriptionHash(this._backBufferDepthStencilTextureEntry.creationOptions);

        this._addSystemTextures();
    }

    /**
     * Resets the back buffer color/depth-stencil textures to the default (the engine's current back buffer textures)
     * It has no effect if setBackBufferTextures has not been called before.
     */
    public resetBackBufferTextures() {
        this.setBackBufferTextures(0, 0);
    }

    /**
     * Returns true if the texture manager has at least one history texture
     */
    public get hasHistoryTextures() {
        return this._historyTextures.size > 0;
    }

    /** @internal */
    public _dispose(): void {
        this._releaseTextures();
    }

    /** @internal */
    public _allocateTextures(tasks?: FrameGraphTask[]): void {
        if (tasks) {
            this._optimizeTextureAllocation(tasks);
        }

        this._textures.forEach((entry) => {
            if (!entry.texture) {
                if (entry.refHandle !== undefined) {
                    // entry is a dangling handle which has been resolved to point to refHandle
                    // We simply update the texture to point to the refHandle texture
                    const refEntry = this._textures.get(entry.refHandle)!;

                    entry.texture = refEntry.texture;
                    entry.texture?.incrementReferences();

                    if (refEntry.refHandle === backbufferColorTextureHandle) {
                        entry.refHandle = backbufferColorTextureHandle;
                    }
                    if (refEntry.refHandle === backbufferDepthStencilTextureHandle) {
                        entry.refHandle = backbufferDepthStencilTextureHandle;
                    }
                } else if (entry.namespace !== FrameGraphTextureNamespace.External) {
                    if (entry.aliasHandle !== undefined) {
                        const aliasEntry = this._textures.get(entry.aliasHandle)!;

                        entry.texture = aliasEntry.texture!;
                        entry.texture.incrementReferences();
                    } else {
                        const creationOptions = entry.creationOptions;
                        const size = getDimensionsFromTextureSize(creationOptions.sizeIsPercentage ? this.getAbsoluteDimensions(creationOptions.size) : creationOptions.size);
                        const textureIndex = entry.textureIndex || 0;
                        const targetType = creationOptions.options.targetTypes?.[textureIndex] ?? Constants.TEXTURE_2D;
                        const is3D = targetType === Constants.TEXTURE_3D;
                        const isArray = targetType === Constants.TEXTURE_2D_ARRAY || targetType === Constants.TEXTURE_CUBE_MAP_ARRAY;
                        const layerCount = creationOptions.options.layerCounts?.[textureIndex] ?? 0;

                        const internalTextureCreationOptions: InternalTextureCreationOptions = {
                            createMipMaps: creationOptions.options.createMipMaps,
                            samples: creationOptions.options.samples,
                            type: creationOptions.options.types?.[textureIndex],
                            format: creationOptions.options.formats?.[textureIndex],
                            useSRGBBuffer: creationOptions.options.useSRGBBuffers?.[textureIndex],
                            creationFlags: creationOptions.options.creationFlags?.[textureIndex],
                            label: creationOptions.options.labels?.[textureIndex] ?? `${entry.name}${textureIndex > 0 ? "#" + textureIndex : ""}`,
                            samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                            createMSAATexture: creationOptions.options.samples! > 1,
                            isCube: targetType === Constants.TEXTURE_CUBE_MAP || targetType === Constants.TEXTURE_CUBE_MAP_ARRAY,
                        };

                        const isDepthTexture = IsDepthTexture(internalTextureCreationOptions.format!);
                        const hasStencil = HasStencilAspect(internalTextureCreationOptions.format!);
                        const source =
                            isDepthTexture && hasStencil
                                ? InternalTextureSource.DepthStencil
                                : isDepthTexture || hasStencil
                                  ? InternalTextureSource.Depth
                                  : InternalTextureSource.RenderTarget;

                        const internalTexture = this.engine._createInternalTexture(
                            { width: size.width, height: size.height, depth: is3D ? layerCount : undefined, layers: isArray ? layerCount : undefined },
                            internalTextureCreationOptions,
                            false,
                            source
                        );

                        if (isDepthTexture) {
                            internalTexture.type = GetTypeForDepthTexture(internalTexture.format);
                        }

                        entry.texture = internalTexture;
                    }
                }
            }

            if (entry.texture && entry.refHandle === undefined) {
                entry.debug?.dispose();
                entry.debug = this._createDebugTexture(entry.name, entry.texture);
            }
        });

        this._historyTextures.forEach((entry) => {
            for (let i = 0; i < entry.handles.length; i++) {
                entry.textures[i] = this._textures.get(entry.handles[i])!.texture;
            }
        });
    }

    /** @internal */
    public _releaseTextures(releaseAll = true): void {
        this._textures.forEach((entry, handle) => {
            if (entry.lifespan) {
                entry.lifespan.firstTask = Number.MAX_VALUE;
                entry.lifespan.lastTask = 0;
            }

            entry.aliasHandle = undefined;

            if (releaseAll || entry.namespace !== FrameGraphTextureNamespace.External) {
                entry.debug?.dispose();
                entry.debug = undefined;
            }

            if (entry.namespace === FrameGraphTextureNamespace.External) {
                return;
            }

            // We dispose of "Graph" and "Task" textures:
            // - "Graph" textures will be recreated by _allocateTextures because the entry still exists in this._textures, but entry.texture is null
            // - "Task" textures will be re-added to this._textures when the task is recorded (by a call to FrameGraph.build): that's why we delete the entry from this._textures below
            entry.texture?.dispose();
            entry.texture = null;

            if (releaseAll || entry.namespace === FrameGraphTextureNamespace.Task) {
                this._textures.delete(handle);
                this._historyTextures.delete(handle);
            }
        });

        this._historyTextures.forEach((entry) => {
            for (let i = 0; i < entry.handles.length; i++) {
                entry.textures[i] = null;
            }
        });

        if (releaseAll) {
            this._textures.clear();
            this._historyTextures.clear();
            this._addSystemTextures();
        }
    }

    /** @internal */
    public _updateHistoryTextures(): void {
        this._historyTextures.forEach((entry) => {
            entry.index = entry.index ^ 1;
            const currentTexture = entry.textures[entry.index];
            if (currentTexture) {
                for (const { renderTargetWrapper, textureIndex } of entry.references) {
                    renderTargetWrapper.setTexture(currentTexture, textureIndex, false);
                }
            }
        });
    }

    private _addSystemTextures() {
        const size = { width: this.engine.getRenderWidth(true), height: this.engine.getRenderHeight(true) };

        this._textures.set(
            backbufferColorTextureHandle,
            this._backBufferTextureEntry ?? {
                name: "backbuffer color",
                texture: null,
                creationOptions: {
                    size,
                    options: {
                        createMipMaps: false,
                        samples: this.engine.getCreationOptions().antialias ? 4 : 1,
                        types: [Constants.TEXTURETYPE_UNSIGNED_BYTE], // todo? get from engine
                        formats: [Constants.TEXTUREFORMAT_RGBA], // todo? get from engine
                        useSRGBBuffers: [false],
                        creationFlags: [0],
                        labels: ["backbuffer color"],
                    },
                    sizeIsPercentage: false,
                },
                namespace: FrameGraphTextureNamespace.External,
            }
        );

        this._textures.set(
            backbufferDepthStencilTextureHandle,
            this._backBufferDepthStencilTextureEntry ?? {
                name: "backbuffer depth/stencil",
                texture: null,
                creationOptions: {
                    size,
                    options: {
                        createMipMaps: false,
                        samples: this.engine.getCreationOptions().antialias ? 4 : 1,
                        types: [Constants.TEXTURETYPE_UNSIGNED_BYTE], // todo? get from engine
                        formats: [Constants.TEXTUREFORMAT_DEPTH24], // todo? get from engine
                        useSRGBBuffers: [false],
                        creationFlags: [0],
                        labels: ["backbuffer depth/stencil"],
                    },
                    sizeIsPercentage: false,
                },
                namespace: FrameGraphTextureNamespace.External,
            }
        );
    }

    private _createDebugTexture(name: string, texture: InternalTexture): Texture | undefined {
        if (!this._debugTextures) {
            return;
        }

        const textureDebug = new Texture(null, this._scene);

        textureDebug.name = name;
        textureDebug._texture = texture;
        textureDebug._texture.incrementReferences();

        return textureDebug;
    }

    private _freeEntry(handle: number): void {
        const entry = this._textures.get(handle);

        if (entry) {
            entry.debug?.dispose();
            this._textures.delete(handle);
        }
    }

    private _createHandleForTexture(
        name: string,
        texture: Nullable<InternalTexture>,
        creationOptions: FrameGraphTextureCreationOptions,
        namespace: FrameGraphTextureNamespace,
        handle?: FrameGraphTextureHandle,
        textureIndex?: number
    ): FrameGraphTextureHandle {
        handle = handle ?? FrameGraphTextureManager._Counter++;
        textureIndex = textureIndex || 0;

        const textureName = creationOptions.isHistoryTexture ? `${name} ping` : name;

        let label = creationOptions.options.labels?.[textureIndex] ?? "";
        if (label === textureName) {
            label = "";
        }

        const textureEntry: TextureEntry = {
            texture,
            name: `${textureName}${label ? " " + label : ""}`,
            creationOptions: {
                size: textureSizeIsObject(creationOptions.size) ? creationOptions.size : { width: creationOptions.size, height: creationOptions.size },
                options: creationOptions.options,
                sizeIsPercentage: creationOptions.sizeIsPercentage,
                isHistoryTexture: creationOptions.isHistoryTexture,
            },
            namespace,
            textureIndex,
            textureDescriptionHash: this._createTextureDescriptionHash(creationOptions),
            lifespan: {
                firstTask: Number.MAX_VALUE,
                lastTask: 0,
            },
            historyTexture: creationOptions.isHistoryTexture,
        };

        this._textures.set(handle, textureEntry);

        if (namespace === FrameGraphTextureNamespace.External) {
            return handle;
        }

        if (creationOptions.isHistoryTexture) {
            const pongCreationOptions: FrameGraphTextureCreationOptions = {
                size: { ...(textureEntry.creationOptions.size as { width: number; height: number }) },
                options: { ...textureEntry.creationOptions.options },
                sizeIsPercentage: textureEntry.creationOptions.sizeIsPercentage,
                isHistoryTexture: false,
            };

            const pongTexture = this._createHandleForTexture(`${name} pong`, null, pongCreationOptions, namespace);

            this._textures.get(pongTexture)!.historyTexture = true;
            this._historyTextures.set(handle, { textures: [null, null], handles: [handle, pongTexture], index: 0, references: [] });

            return handle;
        }

        if (creationOptions.options.types && creationOptions.options.types.length > 1 && textureIndex === 0) {
            const textureCount = creationOptions.options.types.length;
            const creationOptionsForTexture: FrameGraphTextureCreationOptions = {
                size: textureSizeIsObject(creationOptions.size) ? creationOptions.size : { width: creationOptions.size, height: creationOptions.size },
                options: creationOptions.options,
                sizeIsPercentage: creationOptions.sizeIsPercentage,
            };

            for (let i = 1; i < textureCount; i++) {
                this._createHandleForTexture(textureName, null, creationOptionsForTexture, namespace, handle + i, i);
            }

            FrameGraphTextureManager._Counter += textureCount - 1;
        }

        return handle;
    }

    private _createTextureDescriptionHash(options: FrameGraphTextureCreationOptions): string {
        const hash: string[] = [];

        hash.push(textureSizeIsObject(options.size) ? `${options.size.width}_${options.size.height}` : `${options.size}`);
        hash.push(options.sizeIsPercentage ? "%" : "A");
        hash.push(options.options.createMipMaps ? "M" : "N");
        hash.push(options.options.samples ? `${options.options.samples}` : "S1");
        hash.push(options.options.targetTypes ? options.options.targetTypes.join("_") : `${Constants.TEXTURE_2D}`);
        hash.push(options.options.types ? options.options.types.join("_") : `${Constants.TEXTURETYPE_UNSIGNED_BYTE}`);
        hash.push(options.options.formats ? options.options.formats.join("_") : `${Constants.TEXTUREFORMAT_RGBA}`);
        hash.push(options.options.layerCounts ? options.options.layerCounts.join("_") : `0`);
        hash.push(options.options.useSRGBBuffers ? options.options.useSRGBBuffers.join("_") : "false");
        hash.push(options.options.creationFlags ? options.options.creationFlags.join("_") : "0");

        return hash.join("_");
    }

    private _optimizeTextureAllocation(tasks: FrameGraphTask[]): void {
        this._computeTextureLifespan(tasks);

        if (this.showDebugLogsForTextureAllcationOptimization) {
            Logger.Log(`================== Optimization of texture allocation ==================`);
        }

        const cache: Map<string, Array<[FrameGraphTextureHandle, Array<TextureLifespan>]>> = new Map();

        const iterator = this._textures.keys();
        for (let key = iterator.next(); key.done !== true; key = iterator.next()) {
            const textureHandle = key.value;
            const textureEntry = this._textures.get(textureHandle)!;
            if (textureEntry.refHandle !== undefined || textureEntry.namespace === FrameGraphTextureNamespace.External || this.isHistoryTexture(textureHandle, true)) {
                continue;
            }

            const textureHash = textureEntry.textureDescriptionHash!;
            const textureLifespan = textureEntry.lifespan!;

            const cacheEntries = cache.get(textureHash);
            if (cacheEntries) {
                let cacheEntryFound = false;
                for (const cacheEntry of cacheEntries) {
                    const [sourceHandle, lifespanArray] = cacheEntry;

                    let overlapped = false;
                    for (const lifespan of lifespanArray) {
                        if (lifespan.firstTask <= textureLifespan.lastTask && lifespan.lastTask >= textureLifespan.firstTask) {
                            overlapped = true;
                            break;
                        }
                    }

                    if (!overlapped) {
                        // No overlap between texture lifespan and all lifespans in the array, this texture can reuse the same entry cache
                        if (this.showDebugLogsForTextureAllcationOptimization) {
                            Logger.Log(`Texture ${textureHandle} (${textureEntry.name}) reuses cache entry ${sourceHandle}`);
                        }

                        lifespanArray.push(textureLifespan);
                        textureEntry.aliasHandle = sourceHandle;
                        cacheEntryFound = true;
                        break;
                    }
                }
                if (!cacheEntryFound) {
                    cacheEntries.push([textureHandle, [textureLifespan]]);
                }
            } else {
                cache.set(textureHash, [[textureHandle, [textureLifespan]]]);
            }
        }
    }

    // Loop through all task/pass dependencies and compute the lifespan of each texture (that is, the first task/pass that uses it and the last task/pass that uses it)
    private _computeTextureLifespan(tasks: FrameGraphTask[]): void {
        if (this.showDebugLogsForTextureAllcationOptimization) {
            Logger.Log(`================== Dump of texture dependencies for all tasks/passes ==================`);
        }

        for (let t = 0; t < tasks.length; ++t) {
            const task = tasks[t];

            if (task.passes.length > 0) {
                this._computeTextureLifespanForPasses(task, t, task.passes);
            }

            if (task.passesDisabled.length > 0) {
                this._computeTextureLifespanForPasses(task, t, task.passesDisabled);
            }

            if (task.dependencies) {
                if (this.showDebugLogsForTextureAllcationOptimization) {
                    Logger.Log(`task#${t} (${task.name}), global dependencies`);
                }

                this._updateLifespan(t * 100 + 99, task.dependencies);
            }
        }

        if (this.showDebugLogsForTextureAllcationOptimization) {
            Logger.Log(`================== Texture lifespans ==================`);
            const iterator = this._textures.keys();
            for (let key = iterator.next(); key.done !== true; key = iterator.next()) {
                const textureHandle = key.value;
                const textureEntry = this._textures.get(textureHandle)!;
                if (textureEntry.refHandle !== undefined || textureEntry.namespace === FrameGraphTextureNamespace.External || this._historyTextures.has(textureHandle)) {
                    continue;
                }
                Logger.Log(`${textureHandle} (${textureEntry.name}): ${textureEntry.lifespan!.firstTask} - ${textureEntry.lifespan!.lastTask}`);
            }
        }
    }

    private _computeTextureLifespanForPasses(task: FrameGraphTask, taskIndex: number, passes: IFrameGraphPass[]): void {
        for (let p = 0; p < passes.length; ++p) {
            const dependencies = new Set<FrameGraphTextureHandle>();
            const pass = passes[p];

            if (!FrameGraphRenderPass.IsRenderPass(pass)) {
                continue;
            }

            pass.collectDependencies(dependencies);

            if (this.showDebugLogsForTextureAllcationOptimization) {
                Logger.Log(`task#${taskIndex} (${task.name}), pass#${p} (${pass.name})`);
            }

            this._updateLifespan(taskIndex * 100 + p, dependencies);
        }
    }

    private _updateLifespan(passOrderNum: number, dependencies: Set<FrameGraphTextureHandle>) {
        const iterator = dependencies.keys();
        for (let key = iterator.next(); key.done !== true; key = iterator.next()) {
            const textureHandle = key.value;
            if (this.isBackbuffer(textureHandle)) {
                continue;
            }
            let textureEntry = this._textures.get(textureHandle);
            if (!textureEntry) {
                throw new Error(
                    `FrameGraph._computeTextureLifespan: Texture handle "${textureHandle}" not found in the texture manager. Make sure you didn't forget to add a task in the frame graph.`
                );
            }
            let handle = textureHandle;
            while (textureEntry.refHandle !== undefined) {
                handle = textureEntry.refHandle;
                textureEntry = this._textures.get(handle);
                if (!textureEntry) {
                    throw new Error(
                        `FrameGraph._computeTextureLifespan: Texture handle "${handle}" not found in the texture manager (source handle="${textureHandle}"). Make sure you didn't forget to add a task in the frame graph.`
                    );
                }
            }
            if (textureEntry.namespace === FrameGraphTextureNamespace.External || this._historyTextures.has(handle)) {
                continue;
            }

            if (this.showDebugLogsForTextureAllcationOptimization) {
                Logger.Log(`    ${handle} (${textureEntry.name})`);
            }

            textureEntry.lifespan!.firstTask = Math.min(textureEntry.lifespan!.firstTask, passOrderNum);
            textureEntry.lifespan!.lastTask = Math.max(textureEntry.lifespan!.lastTask, passOrderNum);
        }
    }

    /**
     * Clones a texture options
     * @param options The options to clone
     * @param textureIndex The index of the texture in the types, formats, etc array of FrameGraphTextureOptions. If not provided, all options are cloned.
     * @param preserveLabels True if the labels should be preserved (default: false)
     * @returns The cloned options
     */
    public static CloneTextureOptions(options: FrameGraphTextureOptions, textureIndex?: number, preserveLabels?: boolean): FrameGraphTextureOptions {
        return textureIndex !== undefined
            ? {
                  createMipMaps: options.createMipMaps,
                  samples: options.samples,
                  targetTypes: options.targetTypes ? [options.targetTypes[textureIndex]] : undefined,
                  types: options.types ? [options.types[textureIndex]] : undefined,
                  formats: options.formats ? [options.formats[textureIndex]] : undefined,
                  layerCounts: options.layerCounts ? [options.layerCounts[textureIndex]] : undefined,
                  useSRGBBuffers: options.useSRGBBuffers ? [options.useSRGBBuffers[textureIndex]] : undefined,
                  creationFlags: options.creationFlags ? [options.creationFlags[textureIndex]] : undefined,
                  labels: options.labels ? [options.labels[textureIndex]] : undefined,
              }
            : {
                  createMipMaps: options.createMipMaps,
                  samples: options.samples,
                  targetTypes: options.targetTypes ? [...options.targetTypes] : undefined,
                  types: options.types ? [...options.types] : undefined,
                  formats: options.formats ? [...options.formats] : undefined,
                  layerCounts: options.layerCounts ? [...options.layerCounts] : undefined,
                  useSRGBBuffers: options.useSRGBBuffers ? [...options.useSRGBBuffers] : undefined,
                  creationFlags: options.creationFlags ? [...options.creationFlags] : undefined,
                  labels: options.labels && preserveLabels ? [...options.labels] : undefined,
              };
    }

    /**
     * Gets the texture block information.
     * @param type Type of the texture.
     * @param format Format of the texture.
     * @returns The texture block information. You can calculate the byte size of the texture by doing: Math.ceil(width / blockInfo.width) * Math.ceil(height / blockInfo.height) * blockInfo.length
     */
    private static _GetTextureBlockInformation(type: number, format: number): { width: number; height: number; length: number } {
        switch (format) {
            case Constants.TEXTUREFORMAT_DEPTH16:
                return { width: 1, height: 1, length: 2 };
            case Constants.TEXTUREFORMAT_DEPTH24:
                return { width: 1, height: 1, length: 3 };
            case Constants.TEXTUREFORMAT_DEPTH24_STENCIL8:
                return { width: 1, height: 1, length: 4 };
            case Constants.TEXTUREFORMAT_DEPTH32_FLOAT:
                return { width: 1, height: 1, length: 4 };
            case Constants.TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8:
                return { width: 1, height: 1, length: 5 };
            case Constants.TEXTUREFORMAT_STENCIL8:
                return { width: 1, height: 1, length: 1 };

            case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_BPTC_UNORM:
                return { width: 4, height: 4, length: 16 };
            case Constants.TEXTUREFORMAT_COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT:
                return { width: 4, height: 4, length: 16 };
            case Constants.TEXTUREFORMAT_COMPRESSED_RGB_BPTC_SIGNED_FLOAT:
                return { width: 4, height: 4, length: 16 };
            case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT5:
                return { width: 4, height: 4, length: 16 };
            case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT3:
                return { width: 4, height: 4, length: 16 };
            case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT1:
            case Constants.TEXTUREFORMAT_COMPRESSED_RGB_S3TC_DXT1:
                return { width: 4, height: 4, length: 8 };
            case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_4x4:
                return { width: 4, height: 4, length: 16 };
            case Constants.TEXTUREFORMAT_COMPRESSED_RGB_ETC1_WEBGL:
            case Constants.TEXTUREFORMAT_COMPRESSED_RGB8_ETC2:
                return { width: 4, height: 4, length: 8 };
            case Constants.TEXTUREFORMAT_COMPRESSED_RGBA8_ETC2_EAC:
                return { width: 4, height: 4, length: 16 };
        }

        switch (type) {
            case Constants.TEXTURETYPE_BYTE:
            case Constants.TEXTURETYPE_UNSIGNED_BYTE:
                switch (format) {
                    case Constants.TEXTUREFORMAT_R:
                    case Constants.TEXTUREFORMAT_R_INTEGER:
                    case Constants.TEXTUREFORMAT_ALPHA:
                    case Constants.TEXTUREFORMAT_LUMINANCE:
                        return { width: 1, height: 1, length: 1 };
                    case Constants.TEXTUREFORMAT_RG:
                    case Constants.TEXTUREFORMAT_RG_INTEGER:
                    case Constants.TEXTUREFORMAT_LUMINANCE_ALPHA:
                        return { width: 1, height: 1, length: 2 };
                    case Constants.TEXTUREFORMAT_RGB:
                    case Constants.TEXTUREFORMAT_RGB_INTEGER:
                        return { width: 1, height: 1, length: 3 };
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return { width: 1, height: 1, length: 4 };
                    default:
                        return { width: 1, height: 1, length: 4 };
                }
            case Constants.TEXTURETYPE_SHORT:
            case Constants.TEXTURETYPE_UNSIGNED_SHORT:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED_INTEGER:
                        return { width: 1, height: 1, length: 2 };
                    case Constants.TEXTUREFORMAT_RG_INTEGER:
                        return { width: 1, height: 1, length: 4 };
                    case Constants.TEXTUREFORMAT_RGB_INTEGER:
                        return { width: 1, height: 1, length: 6 };
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return { width: 1, height: 1, length: 8 };
                    default:
                        return { width: 1, height: 1, length: 8 };
                }
            case Constants.TEXTURETYPE_INT:
            case Constants.TEXTURETYPE_UNSIGNED_INTEGER: // Refers to UNSIGNED_INT
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED_INTEGER:
                        return { width: 1, height: 1, length: 4 };
                    case Constants.TEXTUREFORMAT_RG_INTEGER:
                        return { width: 1, height: 1, length: 8 };
                    case Constants.TEXTUREFORMAT_RGB_INTEGER:
                        return { width: 1, height: 1, length: 12 };
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return { width: 1, height: 1, length: 16 };
                    default:
                        return { width: 1, height: 1, length: 16 };
                }
            case Constants.TEXTURETYPE_FLOAT:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED:
                        return { width: 1, height: 1, length: 4 };
                    case Constants.TEXTUREFORMAT_RG:
                        return { width: 1, height: 1, length: 8 };
                    case Constants.TEXTUREFORMAT_RGB:
                        return { width: 1, height: 1, length: 12 };
                    case Constants.TEXTUREFORMAT_RGBA:
                        return { width: 1, height: 1, length: 16 };
                    default:
                        return { width: 1, height: 1, length: 16 };
                }
            case Constants.TEXTURETYPE_HALF_FLOAT:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED:
                        return { width: 1, height: 1, length: 2 };
                    case Constants.TEXTUREFORMAT_RG:
                        return { width: 1, height: 1, length: 4 };
                    case Constants.TEXTUREFORMAT_RGB:
                        return { width: 1, height: 1, length: 6 };
                    case Constants.TEXTUREFORMAT_RGBA:
                        return { width: 1, height: 1, length: 8 };
                    default:
                        return { width: 1, height: 1, length: 8 };
                }
            case Constants.TEXTURETYPE_UNSIGNED_SHORT_5_6_5:
                return { width: 1, height: 1, length: 2 };
            case Constants.TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RGBA:
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return { width: 1, height: 1, length: 4 };
                    default:
                        return { width: 1, height: 1, length: 4 };
                }
            case Constants.TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RGBA:
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return { width: 1, height: 1, length: 4 };
                    default:
                        return { width: 1, height: 1, length: 4 };
                }
            case Constants.TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4:
                return { width: 1, height: 1, length: 2 };
            case Constants.TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1:
                return { width: 1, height: 1, length: 2 };
            case Constants.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RGBA:
                        return { width: 1, height: 1, length: 4 };
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return { width: 1, height: 1, length: 4 };
                    default:
                        return { width: 1, height: 1, length: 4 };
                }
        }

        return { width: 1, height: 1, length: 4 };
    }
}
