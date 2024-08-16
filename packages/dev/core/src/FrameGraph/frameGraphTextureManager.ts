import type { Nullable } from "../types";
import type { Scene } from "../scene";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { RenderTargetWrapper } from "../Engines/renderTargetWrapper";
import type { RenderTargetCreationOptions, TextureSize } from "../Materials/Textures/textureCreationOptions";
import { Texture } from "core/Materials/Textures/texture";
import type { FrameGraphTaskTexture, IFrameGraphTask } from "./Tasks/IFrameGraphTask";

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
    public _textures: (
        | { texture: Nullable<RenderTargetWrapper>; name: string; debug?: Texture; namespace: FrameGraphTextureNamespace; systemType?: FrameGraphTextureSystemType }
        | undefined
    )[] = [];
    /** @internal */
    public _textureCreationOptions: (FrameGraphTextureCreationOptions | undefined)[] = [];
    private _texturesIndex = 0;

    private static _IsTextureHandle(textureId: FrameGraphTaskTexture | TextureHandle): textureId is TextureHandle {
        return typeof textureId !== "string";
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
        this._setSystemTextures();
    }

    public importTexture(name: string, texture: RenderTargetWrapper, handle?: TextureHandle): TextureHandle {
        handle = this._createHandleForTexture(name, texture, FrameGraphTextureNamespace.External, handle);

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

    public getTextureCreationOptions(textureId: FrameGraphTaskTexture | TextureHandle): FrameGraphTextureCreationOptions {
        if (FrameGraphTextureManager._IsTextureHandle(textureId)) {
            return this._textureCreationOptions[textureId]!;
        }

        const textureHandle = this._mapNameToTask.get(textureId)?._fgInternals!.outputTexture;

        if (textureHandle === undefined) {
            throw new Error(`Task "${textureId}" does not have an output texture.`);
        }

        return this._textureCreationOptions[textureHandle]!;
    }

    public getTextureHandle(textureId: FrameGraphTaskTexture | TextureHandle): TextureHandle {
        if (FrameGraphTextureManager._IsTextureHandle(textureId)) {
            return textureId;
        }

        const textureHandle = this._mapNameToTask.get(textureId)?._fgInternals!.outputTexture;

        if (textureHandle === undefined) {
            throw new Error(`Task "${textureId}" does not have an output texture.`);
        }

        return textureHandle;
    }

    public createRenderTargetTexture(name: string, namespace: FrameGraphTextureNamespace, creationOptions: FrameGraphTextureCreationOptions): TextureHandle {
        const handle = this._createHandleForTexture(name, null, namespace);

        this._textureCreationOptions[handle] = { ...creationOptions };

        return handle;
    }

    public convertTextureCreationOptionsToDescription(creationOptions: FrameGraphTextureCreationOptions): FrameGraphTextureDescription {
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

        return {
            size,
            options: { ...creationOptions.options },
        };
    }

    public dispose(): void {
        this._releaseTextures();
    }

    /** @internal */
    public _allocateTextures() {
        for (let i = 0; i < this._textures.length; i++) {
            const wrapper = this._textures[i];
            if (wrapper === undefined || wrapper.namespace === FrameGraphTextureNamespace.Proxy || wrapper.systemType !== undefined) {
                continue;
            }

            if ((wrapper.namespace === FrameGraphTextureNamespace.Task || wrapper.namespace === FrameGraphTextureNamespace.Graph) && !wrapper.texture) {
                const creationOptions = this._textureCreationOptions[i]!;
                const description = this.convertTextureCreationOptionsToDescription(creationOptions);

                wrapper.texture = this._engine.createRenderTargetTexture(description.size, description.options);
            }

            if (this._debugTextures && this._scene) {
                wrapper.debug?.dispose();

                const textureDebug = new Texture(null, this._scene);

                textureDebug.name = wrapper.name;
                textureDebug._texture = wrapper.texture!.texture!;
                textureDebug._texture.incrementReferences();

                wrapper.debug = textureDebug;
            }
        }
    }

    /** @internal */
    public _releaseTextures(releaseAll = true): void {
        let index = -1;
        for (let i = 0; i < this._textures.length; i++) {
            const wrapper = this._textures[i];
            if (wrapper === undefined) {
                continue;
            }

            if (releaseAll || wrapper.namespace !== FrameGraphTextureNamespace.External) {
                wrapper.debug?.dispose();
                wrapper.debug = undefined;
            }

            if (wrapper.namespace === FrameGraphTextureNamespace.External) {
                index = i;
                continue;
            }

            if (wrapper.namespace !== FrameGraphTextureNamespace.Proxy) {
                wrapper.texture?.dispose();
            }

            if (!releaseAll && wrapper.namespace === FrameGraphTextureNamespace.Graph) {
                wrapper.texture = null;
                index = i;
            } else {
                this._textures[i] = undefined;
                this._textureCreationOptions[i] = undefined;
            }
        }

        index++;

        this._textures.length = releaseAll ? 0 : index;
        this._textureCreationOptions.length = releaseAll ? 0 : index;
        this._texturesIndex = 0;

        if (releaseAll) {
            this._setSystemTextures();
        }
    }

    /** @internal */
    public _createProxyHandle(name: string): TextureHandle {
        while (this._textures[this._texturesIndex] !== undefined) {
            this._texturesIndex++;
        }

        const handle = this._texturesIndex++;

        this._textures[handle] = { texture: null, name, namespace: FrameGraphTextureNamespace.Proxy };

        return handle;
    }

    private _setSystemTextures(): void {
        this._textures[backbufferColorTextureHandle] = {
            texture: null,
            name: "backbuffer color",
            namespace: FrameGraphTextureNamespace.External,
            systemType: FrameGraphTextureSystemType.BackbufferColor,
        };
        // todo: fill this._textureCreationOptions[backbufferColorTextureHandle] with backbuffer color description

        this._textures[backbufferDepthStencilTextureHandle] = {
            texture: null,
            name: "backbuffer depth/stencil",
            namespace: FrameGraphTextureNamespace.External,
            systemType: FrameGraphTextureSystemType.BackbufferDepthStencil,
        };
        // todo: fill this._textureCreationOptions[backbufferDepthStencilTextureHandle] with backbuffer depth/stencil description
    }

    private _createHandleForTexture(name: string, texture: Nullable<RenderTargetWrapper>, namespace: FrameGraphTextureNamespace, handle?: TextureHandle): TextureHandle {
        if (handle === undefined) {
            while (this._textures[this._texturesIndex] !== undefined) {
                this._texturesIndex++;
            }
            handle = this._texturesIndex++;
        }

        this._textures[handle]?.debug?.dispose();
        this._textures[handle] = { texture, name, namespace };

        return handle;
    }
}
