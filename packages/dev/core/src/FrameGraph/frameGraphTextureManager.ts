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
    // eslint-disable-next-line import/no-internal-modules
} from "core/index";
import { getDimensionsFromTextureSize, textureSizeIsObject } from "../Materials/Textures/textureCreationOptions";
import { Texture } from "../Materials/Textures/texture";
import { backbufferColorTextureHandle, backbufferDepthStencilTextureHandle } from "./frameGraphTypes";
import { Constants } from "../Engines/constants";
import { InternalTextureSource, GetTypeForDepthTexture, IsDepthTexture, HasStencilAspect } from "../Materials/Textures/internalTexture";
import { FrameGraphRenderTarget } from "./frameGraphRenderTarget";

type HistoryTexture = {
    textures: Array<Nullable<InternalTexture>>;
    handles: Array<FrameGraphTextureHandle>;
    index: number; // current index in textures array
    references: Array<{ renderTargetWrapper: RenderTargetWrapper; textureIndex: number }>; // render target wrappers that reference this history texture
};

type TextureEntry = {
    texture: Nullable<InternalTexture>;
    name: string;
    creationOptions: FrameGraphTextureCreationOptions; // in TextureEntry, creationOptions.size is always an object
    namespace: FrameGraphTextureNamespace;
    textureIndex?: number; // Index of the texture in the types, formats, etc array of FrameGraphTextureOptions (default: 0)
    debug?: Texture;
    refHandle?: FrameGraphTextureHandle; // Handle of the texture this one is referencing - used for dangling handles
};

enum FrameGraphTextureNamespace {
    Task,
    Graph,
    External,
}

/**
 * Manages the textures used by a frame graph
 * @experimental
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
     * @returns True if the handle is a history texture, otherwise false
     */
    public isHistoryTexture(handle: FrameGraphTextureHandle): boolean {
        const entry = this._textures.get(handle);
        if (!entry) {
            return false;
        }

        handle = entry.refHandle ?? handle;

        return this._historyTextures.has(handle);
    }

    /**
     * Gets the creation options of a texture
     * @param handle Handle of the texture
     * @returns The creation options of the texture
     */
    public getTextureCreationOptions(handle: FrameGraphTextureHandle): FrameGraphTextureCreationOptions {
        const entry = this._textures.get(handle)!;
        const creationOptions = entry.creationOptions;

        return {
            size: textureSizeIsObject(creationOptions.size) ? { ...creationOptions.size } : creationOptions.size,
            sizeIsPercentage: creationOptions.sizeIsPercentage,
            options: this._cloneTextureOptions(creationOptions.options, entry.textureIndex),
            isHistoryTexture: creationOptions.isHistoryTexture,
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
     * Note that if the texture is a history texture, the read texture for the current frame will be returned.
     * @param handle The handle of the texture
     * @returns The texture or null if not found
     */
    public getTextureFromHandle(handle: FrameGraphTextureHandle): Nullable<InternalTexture> {
        const historyEntry = this._historyTextures.get(handle);
        if (historyEntry) {
            return historyEntry.textures[historyEntry.index ^ 1]; // gets the read texture
        }
        return this._textures.get(handle)!.texture;
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
                options: this._cloneTextureOptions(creationOptions.options),
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
     * @returns The created render target wrapper
     */
    public createRenderTarget(
        name: string,
        renderTargets?: FrameGraphTextureHandle | FrameGraphTextureHandle[],
        renderTargetDepth?: FrameGraphTextureHandle
    ): FrameGraphRenderTarget {
        const renderTarget = new FrameGraphRenderTarget(name, this, renderTargets, renderTargetDepth);

        const rtw = renderTarget.renderTargetWrapper;

        if (rtw !== undefined && renderTargets) {
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

        this._textures.set(danglingHandle, {
            texture: textureEntry.texture,
            refHandle: handle,
            name: textureEntry.name,
            creationOptions: {
                size: { ...(textureEntry.creationOptions.size as { width: number; height: number; depth?: number; layers?: number }) },
                options: this._cloneTextureOptions(textureEntry.creationOptions.options),
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
    public getAbsoluteDimensions(
        size: TextureSize,
        screenWidth = this.engine.getRenderWidth(true),
        screenHeight = this.engine.getRenderHeight(true)
    ): { width: number; height: number } {
        const { width, height } = getDimensionsFromTextureSize(size);

        return {
            width: Math.floor((width * screenWidth) / 100),
            height: Math.floor((height * screenHeight) / 100),
        };
    }

    /** @internal */
    public _dispose(): void {
        this._releaseTextures();
    }

    /** @internal */
    public _allocateTextures() {
        this._textures.forEach((entry) => {
            if (!entry.texture) {
                if (entry.refHandle !== undefined) {
                    // entry is a dangling handle which has been resolved to point to refHandle
                    // We simply update the texture to point to the refHandle texture
                    const refEntry = this._textures.get(entry.refHandle)!;

                    entry.texture = refEntry.texture;

                    if (refEntry.refHandle === backbufferColorTextureHandle) {
                        entry.refHandle = backbufferColorTextureHandle;
                    }
                    if (refEntry.refHandle === backbufferDepthStencilTextureHandle) {
                        entry.refHandle = backbufferDepthStencilTextureHandle;
                    }
                } else if (entry.namespace !== FrameGraphTextureNamespace.External) {
                    const creationOptions = entry.creationOptions;
                    const size = creationOptions.sizeIsPercentage ? this.getAbsoluteDimensions(creationOptions.size) : creationOptions.size;
                    const textureIndex = entry.textureIndex || 0;

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
                    };

                    const isDepthTexture = IsDepthTexture(internalTextureCreationOptions.format!);
                    const hasStencil = HasStencilAspect(internalTextureCreationOptions.format!);
                    const source =
                        isDepthTexture && hasStencil
                            ? InternalTextureSource.DepthStencil
                            : isDepthTexture || hasStencil
                              ? InternalTextureSource.Depth
                              : InternalTextureSource.RenderTarget;

                    const internalTexture = this.engine._createInternalTexture(size, internalTextureCreationOptions, false, source);

                    if (isDepthTexture) {
                        internalTexture.type = GetTypeForDepthTexture(internalTexture.format);
                    }

                    entry.texture = internalTexture;
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
            if (releaseAll || entry.namespace !== FrameGraphTextureNamespace.External) {
                entry.debug?.dispose();
                entry.debug = undefined;
            }

            if (entry.namespace === FrameGraphTextureNamespace.External) {
                return;
            }

            entry.texture?.dispose();
            entry.texture = null;

            if (releaseAll || entry.namespace === FrameGraphTextureNamespace.Task) {
                this._textures.delete(handle);
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

        this._textures.set(backbufferColorTextureHandle, {
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
        });

        this._textures.set(backbufferDepthStencilTextureHandle, {
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
        });
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

        const label = creationOptions.options.labels?.[textureIndex] ?? "";

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

    private _cloneTextureOptions(options: FrameGraphTextureOptions, textureIndex?: number): FrameGraphTextureOptions {
        return textureIndex !== undefined
            ? {
                  createMipMaps: options.createMipMaps,
                  samples: options.samples,
                  types: options.types ? [options.types[textureIndex]] : undefined,
                  formats: options.formats ? [options.formats[textureIndex]] : undefined,
                  useSRGBBuffers: options.useSRGBBuffers ? [options.useSRGBBuffers[textureIndex]] : undefined,
                  creationFlags: options.creationFlags ? [options.creationFlags[textureIndex]] : undefined,
                  labels: options.labels ? [options.labels[textureIndex]] : undefined,
              }
            : {
                  createMipMaps: options.createMipMaps,
                  samples: options.samples,
                  types: options.types ? [...options.types] : undefined,
                  formats: options.formats ? [...options.formats] : undefined,
                  useSRGBBuffers: options.useSRGBBuffers ? [...options.useSRGBBuffers] : undefined,
                  creationFlags: options.creationFlags ? [...options.creationFlags] : undefined,
                  labels: options.labels ? [...options.labels] : undefined,
              };
    }
}
