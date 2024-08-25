import type { RenderTargetCreationOptions, TextureSize } from "core/Materials/Textures/textureCreationOptions";
import type { RenderTargetWrapper } from "./renderTargetWrapper";
import type { Nullable } from "../types";
import type { AbstractEngine } from "./abstractEngine";

export type TextureHandle = number;

export type THMTextureCreationOptions = {
    /** Size of the render target texture. If sizeIsPercentage is true, these are percentages relative to the screen size */
    size: TextureSize;
    /** Options used to create the render target texture */
    options: RenderTargetCreationOptions;
    /** If true, indicates that "size" is percentages relative to the screen size */
    sizeIsPercentage: boolean;
};

/**
 * @internal
 */
export type TextureHandleEntry = {
    texture: Nullable<RenderTargetWrapper>;
    name: string;
    creationOptions: THMTextureCreationOptions;
    isExternal?: boolean;
};

/**
 * @internal
 */
export class TextureHandleManager {
    private static _Counter = 0;

    public readonly backbufferColorTextureHandle: TextureHandle;

    public readonly backbufferDepthStencilTextureHandle: TextureHandle;

    public _textures: Map<TextureHandle, TextureHandleEntry> = new Map();

    /** @internal */
    public _initialize(engine: AbstractEngine): void {
        const size = { width: engine.getRenderWidth(true), height: engine.getRenderHeight(true) };

        (this.backbufferColorTextureHandle as number) = this._createHandleForTexture("backbuffer color", null, {
            size,
            options: {},
            sizeIsPercentage: false,
        });

        (this.backbufferDepthStencilTextureHandle as number) = this._createHandleForTexture("backbuffer depth/stencil", null, {
            size,
            options: {},
            sizeIsPercentage: false,
        });
    }

    public getTextureCreationOptions(handle: TextureHandle): THMTextureCreationOptions {
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

        handle = this._createHandleForTexture(
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
            true,
            handle
        );

        return handle;
    }

    public createRenderTargetTexture(name: string, creationOptions: THMTextureCreationOptions): TextureHandle {
        return this._createHandleForTexture(name, null, creationOptions);
    }

    public releaseTexture(handle: TextureHandle): void {
        const entry = this._textures.get(handle);
        if (!entry) {
            return;
        }

        if (!entry.isExternal) {
            entry.texture?.dispose();
        }

        this._textures.delete(handle);
    }

    public dispose(): void {
        this._textures.forEach((entry) => {
            if (!entry.isExternal) {
                entry.texture?.dispose();
            }
        });

        this._textures.clear();
    }

    private _createHandleForTexture(
        name: string,
        texture: Nullable<RenderTargetWrapper>,
        creationOptions: THMTextureCreationOptions,
        isExternal?: boolean,
        handle?: TextureHandle
    ): TextureHandle {
        handle = handle ?? TextureHandleManager._Counter++;

        this._textures.set(handle, { texture, name, creationOptions, isExternal });

        return handle;
    }
}
