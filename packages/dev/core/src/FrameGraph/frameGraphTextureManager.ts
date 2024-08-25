import type { Scene } from "../scene";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { RenderTargetWrapper } from "../Engines/renderTargetWrapper";
import type { RenderTargetCreationOptions, TextureSize } from "../Materials/Textures/textureCreationOptions";
import { textureSizeIsObject } from "../Materials/Textures/textureCreationOptions";
import { Texture } from "../Materials/Textures/texture";
import type { TextureHandle, TextureHandleManager } from "../Engines/textureHandlerManager";

export type FrameGraphTextureCreationOptions = {
    /** Size of the render target texture. If sizeIsPercentage is true, these are percentages relative to the screen size */
    size: TextureSize;
    /** Options used to create the render target texture */
    options: RenderTargetCreationOptions;
    /** If true, indicates that "size" is percentages relative to the screen size */
    sizeIsPercentage: boolean;
};

/** @internal */
export enum FrameGraphTextureNamespace {
    Task,
    Graph,
    External,
}

/** @internal */
export class FrameGraphTextureManager {
    private _textures: ({ debug?: Texture; namespace: FrameGraphTextureNamespace } | undefined)[] = [];

    private _textureHandleManager: TextureHandleManager;

    /**
     * @internal
     */
    constructor(
        private _engine: AbstractEngine,
        private _debugTextures = false,
        private _scene?: Scene
    ) {
        this._textureHandleManager = this._engine._textureHandleManager;
    }

    public importTexture(name: string, texture: RenderTargetWrapper, handle?: TextureHandle): TextureHandle {
        handle = this._textureHandleManager.importTexture(name, texture, handle);

        this._freeTextureEntry(handle);
        this._textures[handle] = { debug: this._createDebugTexture(name, texture), namespace: FrameGraphTextureNamespace.External };

        return handle;
    }

    public createRenderTargetTexture(name: string, namespace: FrameGraphTextureNamespace, creationOptions: FrameGraphTextureCreationOptions): TextureHandle {
        const handle = this._textureHandleManager.createRenderTargetTexture(name, creationOptions);

        this._textures[handle] = { namespace };

        return handle;
    }

    public getAbsoluteDimensions(
        size: TextureSize,
        screenWidth = this._engine.getRenderWidth(true),
        screenHeight = this._engine.getRenderHeight(true)
    ): { width: number; height: number } {
        let width: number;
        let height: number;

        if (textureSizeIsObject(size)) {
            width = size.width;
            height = size.height;
        } else {
            width = height = size;
        }

        return {
            width: Math.floor((width * screenWidth) / 100),
            height: Math.floor((height * screenHeight) / 100),
        };
    }

    public dispose(): void {
        this._releaseTextures();
    }

    /** @internal */
    public _allocateTextures() {
        for (let i = 0; i < this._textures.length; i++) {
            const wrapper = this._textures[i];
            const textureSlot = this._textureHandleManager._textures[i];

            if (wrapper === undefined || textureSlot === undefined || textureSlot.proxyHandle !== undefined) {
                continue;
            }

            // external textures will already have a texture defined
            if (!textureSlot.texture) {
                const creationOptions = this._textureHandleManager._textureCreationOptions[i]!;

                textureSlot.texture = this._engine.createRenderTargetTexture(
                    creationOptions.sizeIsPercentage ? this.getAbsoluteDimensions(creationOptions.size) : creationOptions.size,
                    creationOptions.options
                );
            }

            wrapper.debug?.dispose();

            this._createDebugTexture(textureSlot.name, textureSlot.texture!);
        }
    }

    /** @internal */
    public _releaseTextures(releaseAll = true): void {
        for (let handle = 0; handle < this._textures.length; handle++) {
            const wrapper = this._textures[handle];
            const textureSlot = this._textureHandleManager._textures[handle];

            if (wrapper === undefined || textureSlot === undefined) {
                continue;
            }

            if (releaseAll || wrapper.namespace !== FrameGraphTextureNamespace.External) {
                wrapper.debug?.dispose();
                wrapper.debug = undefined;
            }

            if (wrapper.namespace === FrameGraphTextureNamespace.External) {
                continue;
            }

            if (textureSlot.proxyHandle === undefined) {
                textureSlot.texture?.dispose();
                textureSlot.texture = null;
            }

            if (releaseAll || wrapper.namespace !== FrameGraphTextureNamespace.Graph) {
                this._textureHandleManager.releaseTexture(handle);
                this._textures[handle] = undefined;
            }
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

    private _freeTextureEntry(handle: number): void {
        this._textures[handle]?.debug?.dispose();
        this._textures[handle] = undefined;
    }
}
