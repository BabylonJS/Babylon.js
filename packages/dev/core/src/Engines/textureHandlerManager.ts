import type { RenderTargetCreationOptions, TextureSize } from "core/Materials/Textures/textureCreationOptions";
import type { RenderTargetWrapper } from "./renderTargetWrapper";
import type { Nullable } from "../types";

export type TextureHandle = number;

export const backbufferColorTextureHandle: TextureHandle = 0;
export const backbufferDepthStencilTextureHandle: TextureHandle = 1;

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
export class TextureHandleManager {
    public _textures: ({ texture: Nullable<RenderTargetWrapper>; name: string; proxyHandle?: TextureHandle } | undefined)[] = [];

    public _textureCreationOptions: (THMTextureCreationOptions | undefined)[] = [];

    constructor() {
        this._setSystemTextures();
    }

    public isBackbufferColor(handle: TextureHandle): boolean {
        return this._resolveProxy(handle) === backbufferColorTextureHandle;
    }

    public isBackbufferDepthStencil(handle: TextureHandle): boolean {
        return this._resolveProxy(handle) === backbufferDepthStencilTextureHandle;
    }

    public getTextureCreationOptions(handle: TextureHandle): THMTextureCreationOptions {
        return this._textureCreationOptions[this._resolveProxy(handle)]!;
    }

    public getTextureFromHandle(handle: TextureHandle): Nullable<RenderTargetWrapper> {
        return this._textures[this._resolveProxy(handle)]!.texture;
    }

    public importTexture(name: string, texture: RenderTargetWrapper, handle?: TextureHandle): TextureHandle {
        handle = this._createHandleForTexture(name, texture, handle);

        const internalTexture = texture.texture;
        if (internalTexture) {
            this._textureCreationOptions[handle] = {
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
            };
        }

        return handle;
    }

    public createRenderTargetTexture(name: string, creationOptions: THMTextureCreationOptions): TextureHandle {
        const handle = this._createHandleForTexture(name, null);

        this._textureCreationOptions[handle] = { ...creationOptions };

        return handle;
    }

    public createHandleAsProxy(name: string, targetHandle: TextureHandle): TextureHandle {
        this._textures.push({ texture: null, name, proxyHandle: targetHandle });

        return this._textures.length - 1;
    }

    public setTargetHandleForProxy(proxyHandle: TextureHandle, targetHandle: TextureHandle): void {
        this._textures[proxyHandle]!.proxyHandle = targetHandle;
    }

    public releaseTexture(handle: TextureHandle): void {
        const wrapper = this._textures[handle];
        if (wrapper === undefined) {
            return;
        }

        if (wrapper.proxyHandle === undefined) {
            wrapper.texture?.dispose();
        }

        this._textures[handle] = undefined;
        this._textureCreationOptions[handle] = undefined;
    }

    public dispose(): void {
        this._releaseTextures();
    }

    private _createHandleForTexture(name: string, texture: Nullable<RenderTargetWrapper>, handle?: TextureHandle): TextureHandle {
        if (handle === undefined) {
            handle = this._textures.length;
        }

        this._textures[handle] = { texture, name };

        return handle;
    }

    /** @internal */
    public _resolveProxy(handle: TextureHandle): TextureHandle {
        while (this._textures[handle]!.proxyHandle !== undefined) {
            handle = this._textures[handle]!.proxyHandle!;
        }
        return handle;
    }

    private _releaseTextures(): void {
        for (let i = 0; i < this._textures.length; i++) {
            const wrapper = this._textures[i];
            if (wrapper === undefined) {
                continue;
            }

            if (wrapper.proxyHandle === undefined) {
                wrapper.texture?.dispose();
            }
        }

        this._textures.length = 0;
        this._textureCreationOptions.length = 0;
    }

    private _setSystemTextures(): void {
        this._textures[backbufferColorTextureHandle] = {
            texture: null,
            name: "backbuffer color",
        };
        // todo?: fill this._textureCreationOptions[backbufferColorTextureHandle] with backbuffer color description

        this._textures[backbufferDepthStencilTextureHandle] = {
            texture: null,
            name: "backbuffer depth/stencil",
        };
        // todo?: fill this._textureCreationOptions[backbufferDepthStencilTextureHandle] with backbuffer depth/stencil description
    }
}
