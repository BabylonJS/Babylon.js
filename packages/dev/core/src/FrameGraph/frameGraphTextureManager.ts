/* eslint-disable import/no-internal-modules */
import type {
    Scene,
    AbstractEngine,
    RenderTargetWrapper,
    RenderTargetCreationOptions,
    TextureSize,
    Nullable,
    FrameGraphTextureCreationOptions,
    FrameGraphTextureHandle,
} from "core/index";
import { getDimensionsFromTextureSize } from "../Materials/Textures/textureCreationOptions";
import { Texture } from "../Materials/Textures/texture";
import { backbufferColorTextureHandle, backbufferDepthStencilTextureHandle } from "./frameGraphTypes";
import { Constants } from "../Engines/constants";

type HistoryTexture = {
    textures: Array<Nullable<RenderTargetWrapper>>;
    handles: Array<FrameGraphTextureHandle>;
    index: number;
    refHandles: Array<FrameGraphTextureHandle>; // (dangling) handles that reference this history texture
};

type TextureEntry = {
    texture: Nullable<RenderTargetWrapper>;
    name: string;
    creationOptions: FrameGraphTextureCreationOptions;
    namespace: FrameGraphTextureNamespace;
    debug?: Texture;
    parentHandle?: FrameGraphTextureHandle; // Parent handle if the texture comes from a multi-target texture
    parentTextureIndex?: number; // Index of the texture in the parent if the texture comes from a multi-target texture
    refHandle?: FrameGraphTextureHandle; // Handle of the texture this one is referencing - used for dangling handles
};

enum FrameGraphTextureNamespace {
    Task,
    Graph,
    External,
}

/**
 * @experimental
 * @internal
 */
export class FrameGraphTextureManager {
    private static _Counter = 2; // 0 and 1 are reserved for backbuffer textures

    public _textures: Map<FrameGraphTextureHandle, TextureEntry> = new Map();
    public _historyTextures: Map<FrameGraphTextureHandle, HistoryTexture> = new Map();

    constructor(
        private _engine: AbstractEngine,
        private _debugTextures = false,
        private _scene?: Scene
    ) {
        this._addSystemTextures();
    }

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

    public getTextureCreationOptions(handle: FrameGraphTextureHandle): FrameGraphTextureCreationOptions {
        return this._textures.get(handle)!.creationOptions;
    }

    public getTextureFromHandle(handle: FrameGraphTextureHandle): Nullable<RenderTargetWrapper> {
        const historyEntry = this._historyTextures.get(handle);
        if (historyEntry) {
            return historyEntry.textures[historyEntry.index ^ 1]; // get the read texture
        }
        return this._textures.get(handle)!.texture;
    }

    public importTexture(name: string, texture: RenderTargetWrapper, handle?: FrameGraphTextureHandle): FrameGraphTextureHandle {
        const internalTexture = texture.texture;

        if (!internalTexture) {
            throw new Error("importTexture: Texture must have an internal texture to be imported");
        }

        if (handle !== undefined) {
            this._freeEntry(handle);
        }

        const creationOptions: FrameGraphTextureCreationOptions = {
            size: { width: texture.width, height: texture.height },
            options: {
                generateMipMaps: internalTexture.generateMipMaps,
                generateDepthBuffer: texture._generateDepthBuffer,
                generateStencilBuffer: texture._generateStencilBuffer,
                samples: internalTexture.samples,
                label: internalTexture.label,
                types: [internalTexture.type],
                samplingModes: [internalTexture.samplingMode],
                formats: [internalTexture.format],
                targetTypes: [
                    internalTexture.isCube
                        ? Constants.TEXTURE_CUBE_MAP
                        : internalTexture.is3D
                          ? Constants.TEXTURE_3D
                          : internalTexture.is2DArray
                            ? Constants.TEXTURE_2D_ARRAY
                            : Constants.TEXTURE_2D,
                ],
                useSRGBBuffers: [internalTexture._useSRGBBuffer],
                labels: internalTexture.label ? [internalTexture.label] : undefined,
            },
            sizeIsPercentage: false,
        };

        return this._createHandleForTexture(name, texture, creationOptions, FrameGraphTextureNamespace.External, false, handle);
    }

    public createRenderTargetTexture(
        name: string,
        taskNamespace: boolean,
        creationOptions: FrameGraphTextureCreationOptions,
        multiTargetMode = false,
        handle?: FrameGraphTextureHandle
    ): FrameGraphTextureHandle {
        return this._createHandleForTexture(
            name,
            null,
            creationOptions,
            taskNamespace ? FrameGraphTextureNamespace.Task : FrameGraphTextureNamespace.Graph,
            multiTargetMode,
            handle
        );
    }

    public getAbsoluteDimensions(
        size: TextureSize,
        screenWidth = this._engine.getRenderWidth(true),
        screenHeight = this._engine.getRenderHeight(true)
    ): { width: number; height: number } {
        const { width, height } = getDimensionsFromTextureSize(size);

        return {
            width: Math.floor((width * screenWidth) / 100),
            height: Math.floor((height * screenHeight) / 100),
        };
    }

    public updateHistoryTextures(): void {
        this._historyTextures.forEach((entry) => {
            entry.index = entry.index ^ 1;
            for (const refHandle of entry.refHandles) {
                const textureEntry = this._textures.get(refHandle)!;
                textureEntry.texture = entry.textures[entry.index];
            }
        });
    }

    public dispose(): void {
        this.releaseTextures();
    }

    public allocateTextures() {
        this._textures.forEach((entry) => {
            if (!entry.texture) {
                if (entry.refHandle !== undefined) {
                    const refEntry = this._textures.get(entry.refHandle)!;

                    entry.texture = refEntry.texture;
                    entry.texture?.texture?.incrementReferences();

                    if (refEntry.refHandle === backbufferColorTextureHandle) {
                        entry.refHandle = backbufferColorTextureHandle;
                    }
                    if (refEntry.refHandle === backbufferDepthStencilTextureHandle) {
                        entry.refHandle = backbufferDepthStencilTextureHandle;
                    }
                } else if (entry.namespace !== FrameGraphTextureNamespace.External) {
                    if (entry.parentHandle !== undefined) {
                        const creationOptions = entry.creationOptions;
                        const size = creationOptions.sizeIsPercentage ? this.getAbsoluteDimensions(creationOptions.size) : creationOptions.size;

                        const parentEntry = this._textures.get(entry.parentHandle)!;
                        const parentInternalTexture = parentEntry.texture!.textures![entry.parentTextureIndex!];

                        const creationOptionsForTexture: RenderTargetCreationOptions = {
                            createMipMaps: creationOptions.options.createMipMaps,
                            generateMipMaps: creationOptions.options.generateMipMaps,
                            generateDepthBuffer: creationOptions.options.generateDepthBuffer,
                            generateStencilBuffer: creationOptions.options.generateStencilBuffer,
                            samples: creationOptions.options.samples,
                            type: creationOptions.options.types![0],
                            format: creationOptions.options.formats![0],
                            useSRGBBuffer: creationOptions.options.useSRGBBuffers![0],
                            colorAttachment: parentInternalTexture,
                            label: creationOptions.options.label,
                        };

                        entry.texture = this._engine.createRenderTargetTexture(size, creationOptionsForTexture);
                        parentInternalTexture.incrementReferences();
                    } else {
                        const creationOptions = entry.creationOptions;
                        const size = creationOptions.sizeIsPercentage ? this.getAbsoluteDimensions(creationOptions.size) : creationOptions.size;

                        entry.texture = this._engine.createMultipleRenderTarget(size, creationOptions.options, false);
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

    public createDanglingHandle() {
        return FrameGraphTextureManager._Counter++;
    }

    public resolveDanglingHandle(danglingHandle: FrameGraphTextureHandle, handle: FrameGraphTextureHandle) {
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
                options: { ...textureEntry.creationOptions.options, label: textureEntry.name },
                sizeIsPercentage: textureEntry.creationOptions.sizeIsPercentage,
                isHistoryTexture: false,
            },
            namespace: textureEntry.namespace,
            parentHandle: textureEntry.parentHandle,
            parentTextureIndex: textureEntry.parentTextureIndex,
        });

        const historyEntry = this._historyTextures.get(handle);
        if (historyEntry) {
            historyEntry.refHandles.push(danglingHandle);
        }
    }

    public releaseTextures(releaseAll = true): void {
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

    private _addSystemTextures() {
        const size = { width: this._engine.getRenderWidth(true), height: this._engine.getRenderHeight(true) };

        this._textures.set(backbufferColorTextureHandle, {
            name: "backbuffer color",
            texture: null,
            creationOptions: {
                size,
                options: {},
                sizeIsPercentage: false,
            },
            namespace: FrameGraphTextureNamespace.External,
        });

        this._textures.set(backbufferDepthStencilTextureHandle, {
            name: "backbuffer depth/stencil",
            texture: null,
            creationOptions: {
                size,
                options: {},
                sizeIsPercentage: false,
            },
            namespace: FrameGraphTextureNamespace.External,
        });
    }

    private _createDebugTexture(name: string, texture: RenderTargetWrapper): Texture | undefined {
        if (!this._debugTextures || !this._scene) {
            return;
        }

        const textureDebug = new Texture(null, this._scene);

        textureDebug.name = name;
        textureDebug._texture = texture.texture || texture._depthStencilTexture!;
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
        texture: Nullable<RenderTargetWrapper>,
        creationOptions: FrameGraphTextureCreationOptions,
        namespace: FrameGraphTextureNamespace,
        multiTargetMode = false,
        handle?: FrameGraphTextureHandle,
        parentHandle?: FrameGraphTextureHandle,
        parentTextureIndex?: number
    ): FrameGraphTextureHandle {
        handle = handle ?? FrameGraphTextureManager._Counter++;

        const textureName = creationOptions.isHistoryTexture ? `${name} - ping` : name;

        const textureEntry: TextureEntry = {
            texture,
            name: textureName,
            creationOptions: {
                size: getDimensionsFromTextureSize(creationOptions.size),
                options: { ...creationOptions.options, label: textureName },
                sizeIsPercentage: creationOptions.sizeIsPercentage,
                isHistoryTexture: creationOptions.isHistoryTexture,
            },
            namespace,
            parentHandle,
            parentTextureIndex,
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

            const pongTexture = this._createHandleForTexture(`${name} - pong`, null, pongCreationOptions, namespace, false);

            this._historyTextures.set(handle, { textures: [null, null], handles: [handle, pongTexture], index: 0, refHandles: [] });

            return handle;
        }

        if (multiTargetMode) {
            const textureCount = creationOptions.options.textureCount ?? 1;
            for (let i = 0; i < textureCount; i++) {
                const label = creationOptions.options.labels?.[i] ?? `${i}`;
                const textureName = `${name} - ${label}`;
                const creationOptionsForTexture: FrameGraphTextureCreationOptions = {
                    size: getDimensionsFromTextureSize(creationOptions.size),
                    options: {
                        ...creationOptions.options,
                        formats: [creationOptions.options.formats![i]],
                        types: [creationOptions.options.types![i]],
                        textureCount: 1,
                    },
                    sizeIsPercentage: creationOptions.sizeIsPercentage,
                };
                this._createHandleForTexture(textureName, null, creationOptionsForTexture, namespace, false, handle + i + 1, handle, i);
            }

            FrameGraphTextureManager._Counter += textureCount;
        }

        return handle;
    }
}
