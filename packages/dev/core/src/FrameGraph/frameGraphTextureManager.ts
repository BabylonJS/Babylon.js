import type { Scene } from "../scene";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { RenderTargetWrapper } from "../Engines/renderTargetWrapper";
import type { RenderTargetCreationOptions, TextureSize } from "../Materials/Textures/textureCreationOptions";
import { textureSizeIsObject } from "../Materials/Textures/textureCreationOptions";
import { Texture } from "../Materials/Textures/texture";
import type { TextureHandle, TextureHandleManager } from "../Engines/textureHandleManager";

export type FrameGraphTextureCreationOptions = {
    /** Size of the render target texture. If sizeIsPercentage is true, these are percentages relative to the screen size */
    size: TextureSize;
    /** Options used to create the render target texture */
    options: RenderTargetCreationOptions;
    /** If true, indicates that "size" is percentages relative to the screen size */
    sizeIsPercentage: boolean;
};

enum FrameGraphTextureNamespace {
    Task,
    Graph,
    External,
}

/** @internal */
export class FrameGraphTextureManager {
    private _textures: Map<TextureHandle, { debug?: Texture; namespace: FrameGraphTextureNamespace }> = new Map();

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

        this._freeEntry(handle);

        this._textures.set(handle, { namespace: FrameGraphTextureNamespace.External });

        return handle;
    }

    public createRenderTargetTexture(name: string, taskNamespace: boolean, creationOptions: FrameGraphTextureCreationOptions): TextureHandle {
        const handle = this._textureHandleManager.createRenderTargetTexture(name, creationOptions);

        this._textures.set(handle, { namespace: taskNamespace ? FrameGraphTextureNamespace.Task : FrameGraphTextureNamespace.Graph });

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
        this.releaseTextures();
    }

    public allocateTextures() {
        this._textures.forEach((entry, handle) => {
            const textureSlot = this._textureHandleManager._textures.get(handle);

            if (!textureSlot) {
                return;
            }

            // external textures will already have a texture defined
            if (!textureSlot.texture) {
                const creationOptions = textureSlot.creationOptions;

                textureSlot.texture = this._engine.createRenderTargetTexture(
                    creationOptions.sizeIsPercentage ? this.getAbsoluteDimensions(creationOptions.size) : creationOptions.size,
                    creationOptions.options
                );
            }

            entry.debug?.dispose();
            entry.debug = this._createDebugTexture(textureSlot.name, textureSlot.texture!);
        });
    }

    public releaseTextures(releaseAll = true): void {
        this._textures.forEach((entry, handle) => {
            const textureSlot = this._textureHandleManager._textures.get(handle);

            if (!textureSlot) {
                return;
            }

            if (releaseAll || entry.namespace !== FrameGraphTextureNamespace.External) {
                entry.debug?.dispose();
                entry.debug = undefined;
            }

            if (entry.namespace === FrameGraphTextureNamespace.External) {
                return;
            }

            textureSlot.texture?.dispose();
            textureSlot.texture = null;

            if (releaseAll || entry.namespace === FrameGraphTextureNamespace.Task) {
                this._textureHandleManager.releaseTexture(handle);
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
}
