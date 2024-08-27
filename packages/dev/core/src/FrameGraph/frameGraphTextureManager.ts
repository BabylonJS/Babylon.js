import type { Scene } from "../scene";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { RenderTargetWrapper } from "../Engines/renderTargetWrapper";
import type { RenderTargetCreationOptions, TextureSize } from "../Materials/Textures/textureCreationOptions";
import { getDimensionsFromTextureSize } from "../Materials/Textures/textureCreationOptions";
import { Texture } from "../Materials/Textures/texture";
import type { Nullable } from "core/types";

export const backbufferColorTextureHandle: TextureHandle = 0;

export const backbufferDepthStencilTextureHandle: TextureHandle = 1;

export type TextureHandle = number;

export type FrameGraphTextureCreationOptions = {
    /** Size of the render target texture. If sizeIsPercentage is true, these are percentages relative to the screen size */
    size: TextureSize;
    /** Options used to create the render target texture */
    options: RenderTargetCreationOptions;
    /** If true, indicates that "size" is percentages relative to the screen size */
    sizeIsPercentage: boolean;
};

type TextureEntry = {
    texture: Nullable<RenderTargetWrapper>;
    name: string;
    creationOptions: FrameGraphTextureCreationOptions;
    namespace: FrameGraphTextureNamespace;
    debug?: Texture;
};

enum FrameGraphTextureNamespace {
    Task,
    Graph,
    External,
}

/** @internal */
export class FrameGraphTextureManager {
    private static _Counter = 2; // 0 and 1 are reserved for backbuffer textures

    /** @internal */
    public _textures: Map<TextureHandle, TextureEntry> = new Map();

    /**
     * @internal
     */
    constructor(
        private _engine: AbstractEngine,
        private _debugTextures = false,
        private _scene?: Scene
    ) {
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

    public getTextureCreationOptions(handle: TextureHandle): FrameGraphTextureCreationOptions {
        return this._textures.get(handle)!.creationOptions;
    }

    public getTextureFromHandle(handle: TextureHandle): Nullable<RenderTargetWrapper> {
        return this._textures.get(handle)!.texture;
    }

    public importTexture(name: string, texture: RenderTargetWrapper, handle?: TextureHandle): TextureHandle {
        const internalTexture = texture.texture;

        if (!internalTexture) {
            throw new Error("Texture must have an internal texture to be imported");
        }

        if (handle !== undefined) {
            this._freeEntry(handle);
        }

        return this._createHandleForTexture(
            name,
            texture,
            {
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
                sizeIsPercentage: false,
            },
            FrameGraphTextureNamespace.External,
            handle
        );
    }

    public createRenderTargetTexture(name: string, taskNamespace: boolean, creationOptions: FrameGraphTextureCreationOptions): TextureHandle {
        return this._createHandleForTexture(name, null, creationOptions, taskNamespace ? FrameGraphTextureNamespace.Task : FrameGraphTextureNamespace.Graph);
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

    public dispose(): void {
        this.releaseTextures();
    }

    public allocateTextures() {
        this._textures.forEach((entry) => {
            if (!entry.texture && entry.namespace !== FrameGraphTextureNamespace.External) {
                const creationOptions = entry.creationOptions;

                entry.texture = this._engine.createRenderTargetTexture(
                    creationOptions.sizeIsPercentage ? this.getAbsoluteDimensions(creationOptions.size) : creationOptions.size,
                    creationOptions.options
                );
            }

            if (entry.texture) {
                entry.debug?.dispose();
                entry.debug = this._createDebugTexture(entry.name, entry.texture);
            }
        });
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

        if (releaseAll) {
            this._textures.clear();
        }
    }

    private _createDebugTexture(name: string, texture: RenderTargetWrapper): Texture | undefined {
        if (!this._debugTextures || !this._scene) {
            return;
        }

        const textureDebug = new Texture(null, this._scene);

        textureDebug.name = name;
        textureDebug._texture = texture.texture!;
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
        handle?: TextureHandle
    ): TextureHandle {
        handle = handle ?? FrameGraphTextureManager._Counter++;

        this._textures.set(handle, {
            texture,
            name,
            creationOptions: {
                size: getDimensionsFromTextureSize(creationOptions.size),
                options: { ...creationOptions.options, label: name },
                sizeIsPercentage: creationOptions.sizeIsPercentage,
            },
            namespace,
        });

        return handle;
    }
}
