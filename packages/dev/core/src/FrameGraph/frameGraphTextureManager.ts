import type { Nullable } from "../types";
import type { Scene } from "../scene";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { RenderTargetWrapper } from "../Engines/renderTargetWrapper";
import type { RenderTargetCreationOptions, TextureSize } from "../Materials/Textures/textureCreationOptions";
import { Texture } from "core/Materials/Textures/texture";
import type { FrameGraphTaskTexture, IFrameGraphTask } from "./Tasks/IFrameGraphTask";

export type TextureHandle = number;

export const backbufferColorTextureHandle: TextureHandle = 0;
export const backbufferColorName = "backbufferColor";
export const backbufferDepthStencilTextureHandle: TextureHandle = 1;
export const backbufferDepthStencilName = "backbufferDepthStencil";

export const textureNamespaceGraphPrefix = "graph";
export const textureNamespaceExternalPrefix = "external";

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
    /** @internal */
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
    private _textureMap: Map<string, TextureHandle> = new Map();

    private static _IsTextureHandle(textureId: FrameGraphTaskTexture | TextureHandle): textureId is TextureHandle {
        return !Array.isArray(textureId);
    }

    private static _IsFrameGraphTextureCreationOptions(
        creationOptions: FrameGraphTextureCreationOptions | FrameGraphTextureDescription
    ): creationOptions is FrameGraphTextureCreationOptions {
        return (creationOptions as FrameGraphTextureCreationOptions).sizeIsPercentage !== undefined;
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

        this._textures[backbufferColorTextureHandle] = { texture: null, namespace: FrameGraphTextureNamespace.External, systemType: FrameGraphTextureSystemType.BackbufferColor };
        // todo: fill this._textureDescriptions[backbufferColorTextureHandle] with backbuffer color description
        this._registerTextureHandle(this.getFullyQualifiedTextureName(backbufferColorName, FrameGraphTextureNamespace.External), backbufferColorTextureHandle);

        this._textures[backbufferDepthStencilTextureHandle] = {
            texture: null,
            namespace: FrameGraphTextureNamespace.External,
            systemType: FrameGraphTextureSystemType.BackbufferDepthStencil,
        };
        this._registerTextureHandle(this.getFullyQualifiedTextureName(backbufferDepthStencilName, FrameGraphTextureNamespace.External), backbufferDepthStencilTextureHandle);
        // todo: fill this._textureDescriptions[backbufferDepthStencilTextureHandle] with backbuffer depth/stencil description
    }

    public importTexture(name: string, texture: RenderTargetWrapper): TextureHandle {
        const fullQualifiedName = this.getFullyQualifiedTextureName(name, FrameGraphTextureNamespace.External);
        const handle = this._createHandleForTexture(fullQualifiedName, texture, FrameGraphTextureNamespace.External);

        this._registerTextureHandle(fullQualifiedName, handle);

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

    public getFullyQualifiedTextureName(textureName: string, namespace = FrameGraphTextureNamespace.Task, task: Nullable<IFrameGraphTask> = null): string {
        if (task) {
            return task.name + "." + textureName;
        }

        if (namespace === FrameGraphTextureNamespace.Graph) {
            return textureNamespaceGraphPrefix + "." + textureName;
        } else if (namespace === FrameGraphTextureNamespace.External) {
            return textureNamespaceExternalPrefix + "." + textureName;
        } else {
            throw new Error(`Invalid texture namespace (Task) for texture "${textureName}": parameter task must not be null!`);
        }
    }

    public getTextureDescription(textureId: FrameGraphTaskTexture | TextureHandle): FrameGraphTextureDescription {
        if (FrameGraphTextureManager._IsTextureHandle(textureId)) {
            return this._textureDescriptions[textureId];
        }

        const textureHandle = this._textureMap.get(textureId[0] + "." + textureId[1]);

        if (textureHandle === undefined) {
            throw new Error(`Texture "${textureId[1]}" does not exist in task/namespace "${textureId[0]}".`);
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

    public createRenderTargetTexture(
        fullyQualifiedTextureName: string,
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

        const options = { ...creationOptions.options };

        const rtt = this._engine.createRenderTargetTexture(size, options);
        const handle = this._createHandleForTexture(fullyQualifiedTextureName, rtt, namespace);

        this._textureDescriptions[handle] = { size, options: creationOptions.options };

        this._registerTextureHandle(fullyQualifiedTextureName, handle);

        return handle;
    }

    public reset(): void {
        this._releaseTextures();
    }

    public dispose(): void {
        this._releaseTextures(true);
        this._textureMap.clear();
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

    /** @internal */
    public _registerTextureHandleForTask(task: IFrameGraphTask, textureName: string, textureHandle: TextureHandle): void {
        this._textureMap.set(this.getFullyQualifiedTextureName(textureName, FrameGraphTextureNamespace.Task, task), textureHandle);
    }

    private _registerTextureHandle(fullyQualifiedTextureName: string, textureHandle: TextureHandle): void {
        this._textureMap.set(fullyQualifiedTextureName, textureHandle);
    }

    private _createHandleForTexture(textureName: string, texture: RenderTargetWrapper, namespace: FrameGraphTextureNamespace): TextureHandle {
        let handle: number | undefined;

        if (namespace !== FrameGraphTextureNamespace.Task) {
            handle = this._textureMap.get(textureName);
        }

        if (handle === undefined) {
            while (this._textures[this._texturesIndex] !== undefined) {
                this._texturesIndex++;
            }
            handle = this._texturesIndex++;
        }

        let textureDebug: Texture | undefined;

        if (this._debugTextures && this._scene) {
            this._textures[handle]?.debug?.dispose(); // Handles the Graph / External namespace case, as we'll reuse the existing handle if it exists.

            textureDebug = new Texture(null, this._scene);
            textureDebug.name = textureName;
            textureDebug._texture = texture.texture!;
            textureDebug._texture.incrementReferences();
        }

        this._textures[handle] = { texture, debug: textureDebug, namespace };

        return handle;
    }

    private _releaseTextures(disposeAll = false): void {
        let index = -1;
        for (let i = 0; i < this._textures.length; i++) {
            const wrapper = this._textures[i];
            if (wrapper === undefined) {
                continue;
            }
            if (
                wrapper.namespace === FrameGraphTextureNamespace.Task ||
                wrapper.namespace === FrameGraphTextureNamespace.Proxy ||
                (disposeAll && wrapper.namespace === FrameGraphTextureNamespace.Graph)
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

        this._textures.length = disposeAll ? 0 : index;
        this._textureDescriptions.length = disposeAll ? 0 : index;
        this._texturesIndex = 0;
    }
}
