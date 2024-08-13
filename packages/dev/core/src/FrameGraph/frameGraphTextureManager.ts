import type { Nullable } from "../types";
import type { Scene } from "../scene";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { RenderTargetWrapper } from "../Engines/renderTargetWrapper";
import type { RenderTargetCreationOptions, TextureSize } from "../Materials/Textures/textureCreationOptions";
import { Texture } from "core/Materials/Textures/texture";
import type { FrameGraphTaskOutputTexture, IFrameGraphTask } from "./Tasks/IFrameGraphTask";

export type TextureHandle = number;

export const backbufferColorTextureHandle: TextureHandle = 0;
export const backbufferDepthStencilTextureHandle: TextureHandle = 1;

export type FrameGraphTextureCreationOptions = {
    /** Size of the render target texture. If sizeIsPercentage is true, these are percentages relative to the screen size */
    size: TextureSize;
    /** Options used to create the render target texture */
    options: RenderTargetCreationOptions;
    /** If true, indicates that "size" is percentages relative to the screen size */
    sizeIsPercentage: boolean;
};

export type FrameGraphTextureDescription = {
    size: { width: number; height: number };
    options: RenderTargetCreationOptions;
};
/** @internal */
export enum FrameGraphTextureNamespace {
    Task,
    Graph,
    External,
    Proxy,
}

/** @internal */
export enum FrameGraphTextureSystemType {
    BackbufferColor,
    BackbufferDepthStencil,
}

export class FrameGraphTextureManager {
    /** @internal */
    public _textures: ({ texture: Nullable<RenderTargetWrapper>; debug?: Texture; namespace: FrameGraphTextureNamespace; systemType?: FrameGraphTextureSystemType } | undefined)[] =
        [];
    /** @internal */
    public _textureDescriptions: FrameGraphTextureDescription[] = [];
    private _texturesIndex = 0;

    private static _IsTextureHandle(textureId: FrameGraphTaskOutputTexture | TextureHandle): textureId is TextureHandle {
        return typeof textureId !== "string";
    }

    private static _IsFrameGraphTextureCreationOptions(
        creationOptions: FrameGraphTextureCreationOptions | FrameGraphTextureDescription
    ): creationOptions is FrameGraphTextureCreationOptions {
        return (creationOptions as FrameGraphTextureCreationOptions).sizeIsPercentage !== undefined;
    }

    /**
     * @internal
     */
    constructor(
        private _engine: AbstractEngine,
        private _mapNameToTask: Map<string, IFrameGraphTask>,
        private _debugTextures = false,
        private _scene?: Scene
    ) {
        this._engine = _engine;

        this._textures[backbufferColorTextureHandle] = { texture: null, namespace: FrameGraphTextureNamespace.External, systemType: FrameGraphTextureSystemType.BackbufferColor };
        // todo: fill this._textureDescriptions[backbufferColorTextureHandle] with backbuffer color description

        this._textures[backbufferDepthStencilTextureHandle] = {
            texture: null,
            namespace: FrameGraphTextureNamespace.External,
            systemType: FrameGraphTextureSystemType.BackbufferDepthStencil,
        };
        // todo: fill this._textureDescriptions[backbufferDepthStencilTextureHandle] with backbuffer depth/stencil description
    }

    public importTexture(name: string, texture: RenderTargetWrapper, handle?: TextureHandle): TextureHandle {
        handle = this._createHandleForTexture(name, texture, FrameGraphTextureNamespace.External, handle);

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

    public getTextureDescription(textureId: FrameGraphTaskOutputTexture | TextureHandle): FrameGraphTextureDescription {
        if (FrameGraphTextureManager._IsTextureHandle(textureId)) {
            return this._textureDescriptions[textureId];
        }

        const textureHandle = this._mapNameToTask.get(textureId)?._frameGraphInternals!.outputTexture;

        if (textureHandle === undefined) {
            throw new Error(`Task "${textureId}" does not have an output texture.`);
        }

        return this._textureDescriptions[textureHandle];
    }

    public getTextureHandle(textureId: FrameGraphTaskOutputTexture | TextureHandle): TextureHandle {
        if (FrameGraphTextureManager._IsTextureHandle(textureId)) {
            return textureId;
        }

        const textureHandle = this._mapNameToTask.get(textureId)?._frameGraphInternals!.outputTexture;

        if (textureHandle === undefined) {
            throw new Error(`Task "${textureId}" does not have an output texture.`);
        }

        return textureHandle;
    }

    public createRenderTargetTexture(
        name: string,
        namespace: FrameGraphTextureNamespace,
        creationOptions: FrameGraphTextureCreationOptions | FrameGraphTextureDescription
    ): TextureHandle {
        let width: number;
        let height: number;

        if ((creationOptions.size as { width: number }).width !== undefined) {
            width = (creationOptions.size as { width: number }).width;
            height = (creationOptions.size as { height: number }).height;
        } else {
            width = height = creationOptions.size as number;
        }

        const size = FrameGraphTextureManager._IsFrameGraphTextureCreationOptions(creationOptions)
            ? creationOptions.sizeIsPercentage
                ? {
                      width: (this._engine.getRenderWidth() * width) / 100,
                      height: (this._engine.getRenderHeight() * height) / 100,
                  }
                : { width, height }
            : { width, height };

        const rtt = this._engine.createRenderTargetTexture(size, creationOptions.options);
        const handle = this._createHandleForTexture(name, rtt, namespace);

        this._textureDescriptions[handle] = { size, options: creationOptions.options };

        return handle;
    }

    public releaseTextures(disposeGraphTextures = false): void {
        let index = -1;
        for (let i = 0; i < this._textures.length; i++) {
            const wrapper = this._textures[i];
            if (wrapper === undefined) {
                continue;
            }

            if (
                wrapper.namespace === FrameGraphTextureNamespace.Task ||
                wrapper.namespace === FrameGraphTextureNamespace.Proxy ||
                (disposeGraphTextures && wrapper.namespace === FrameGraphTextureNamespace.Graph)
            ) {
                if (wrapper.namespace !== FrameGraphTextureNamespace.Proxy) {
                    wrapper.texture?.dispose();
                    wrapper.debug?.dispose();
                }
                this._textures[i] = undefined;
            } else {
                index = i;
            }
        }

        index++;

        this._textures.length = index;
        this._textureDescriptions.length = index;
        this._texturesIndex = 0;
    }

    public dispose(): void {
        this.releaseTextures(true);
        this._textures.length = 0;
        this._textureDescriptions.length = 0;
    }

    /** @internal */
    public _createProxyHandle(): TextureHandle {
        while (this._textures[this._texturesIndex] !== undefined) {
            this._texturesIndex++;
        }

        const handle = this._texturesIndex++;

        this._textures[handle] = { texture: null, namespace: FrameGraphTextureNamespace.Proxy };

        return handle;
    }

    private _createHandleForTexture(name: string, texture: RenderTargetWrapper, namespace: FrameGraphTextureNamespace, handle?: TextureHandle): TextureHandle {
        if (handle === undefined) {
            while (this._textures[this._texturesIndex] !== undefined) {
                this._texturesIndex++;
            }
            handle = this._texturesIndex++;
        }

        let textureDebug: Texture | undefined;

        if (this._debugTextures && this._scene) {
            this._textures[handle]?.debug?.dispose(); // Handles the External namespace case, as an existing handle can be reused in this case.
            textureDebug = new Texture(null, this._scene);
            textureDebug.name = name;
            textureDebug._texture = texture.texture!;
            textureDebug._texture.incrementReferences();
        }

        this._textures[handle] = { texture, debug: textureDebug, namespace };

        return handle;
    }
}
