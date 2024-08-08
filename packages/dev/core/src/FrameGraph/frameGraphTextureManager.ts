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

/** @internal */
export class FrameGraphTextureManager {
    /** @internal */
    public _textures: ({ texture: Nullable<RenderTargetWrapper>; isExternal: boolean } | undefined)[] = [];
    private _textureDescriptions: { size: { width: number; height: number }; options: RenderTargetCreationOptions }[] = [];
    private _texturesIndex = 0;
    private _texturesDebug: Array<Texture> = [];
    private _textureMap: Map<string, TextureHandle> = new Map();

    private static _IsTextureHandle(textureId: FrameGraphTaskTexture | TextureHandle): textureId is TextureHandle {
        return !Array.isArray(textureId);
    }

    /**
     * Constructs the frame graph
     * @param _engine defines the hosting engine
     * @param _debugTextures defines a boolean indicating that textures created by the frame graph should be visible in the inspector
     * @param _scene defines the scene in which debugging textures are to be created
     */
    constructor(
        private _engine: AbstractEngine,
        private _debugTextures = false,
        private _scene?: Scene
    ) {
        this._engine = _engine;
        this._textures[backbufferColorTextureHandle] = { texture: null, isExternal: true };
        this._textureMap.set("backbufferColor", backbufferColorTextureHandle);
        // todo: fill this._textureDescriptions[0] with backbuffer color description
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

    public getTextureDescription(textureId: FrameGraphTaskTexture | TextureHandle) {
        if (FrameGraphTextureManager._IsTextureHandle(textureId)) {
            return this._textureDescriptions[textureId];
        }

        const path = textureId[0] ? textureId[0] + "." + textureId[1] : textureId[1];

        const textureHandle = this._textureMap.get(path);
        if (textureHandle === undefined) {
            throw new Error(`Texture "${textureId[1]}" does not exist in task "${textureId[0]}".`);
        }

        return this._textureDescriptions[textureHandle];
    }

    public getTextureHandle(textureId: FrameGraphTaskTexture | TextureHandle): TextureHandle {
        if (FrameGraphTextureManager._IsTextureHandle(textureId)) {
            return textureId;
        }

        const path = textureId[0] ? textureId[0] + "." + textureId[1] : textureId[1];

        const textureHandle = this._textureMap.get(path);
        if (textureHandle === undefined) {
            throw new Error(`Texture "${textureId[1]}" does not exist in task "${textureId[0]}".`);
        }

        return textureHandle;
    }

    public registerTextureHandle(task: IFrameGraphTask, textureName: string, textureHandle: TextureHandle) {
        this._textureMap.set(task.name + "." + textureName, textureHandle);
    }

    public createRenderTargetTexture(name: string, creationOptions: FrameGraphTextureCreationOptions): TextureHandle {
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

        return handle;
    }

    public reset() {
        this._releaseTextures();
    }

    public dispose() {
        this._releaseTextures();
        this._textureMap.clear();
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
