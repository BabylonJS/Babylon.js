import type { Nullable } from "../../types";
import type { InternalTexture } from "../../Materials/Textures/internalTexture";

import type { ThinEngine } from "../../Engines/thinEngine";
import type { IRenderTargetTexture, RenderTargetWrapper } from "../../Engines/renderTargetWrapper";
import { ThinTexture } from "./thinTexture";
import type { TextureSize, RenderTargetCreationOptions } from "./textureCreationOptions";

/**
 * This is a tiny helper class to wrap a RenderTargetWrapper in a texture
 * usable as the input of an effect.
 */
export class ThinRenderTargetTexture extends ThinTexture implements IRenderTargetTexture {
    private readonly _renderTargetOptions: RenderTargetCreationOptions;

    private _renderTarget: Nullable<RenderTargetWrapper> = null;
    private _size: TextureSize;

    /**
     * Gets the render target wrapper associated with this render target
     */
    public get renderTarget(): Nullable<RenderTargetWrapper> {
        return this._renderTarget;
    }

    /**
     * Instantiates a new ThinRenderTargetTexture.
     * Tiny helper class to wrap a RenderTargetWrapper in a texture.
     * This can be used as an internal texture wrapper in ThinEngine to benefit from the cache and to hold on the associated RTT
     * @param engine Define the internalTexture to wrap
     * @param size Define the size of the RTT to create
     * @param options Define rendertarget options
     */
    constructor(engine: ThinEngine, size: TextureSize, options: RenderTargetCreationOptions) {
        super(null);
        this._engine = engine;
        this._renderTargetOptions = options;
        this.resize(size);
    }

    /**
     * Resize the texture to a new desired size.
     * Be careful as it will recreate all the data in the new texture.
     * @param size Define the new size. It can be:
     *   - a number for squared texture,
     *   - an object containing { width: number, height: number }
     */
    public resize(size: TextureSize): void {
        this._renderTarget?.dispose();
        this._renderTarget = null;
        this._texture = null;
        this._size = size;

        if (this._engine) {
            this._renderTarget = this._engine.createRenderTargetTexture(this._size, this._renderTargetOptions);
        }
        this._texture = this.renderTarget!.texture;
    }

    /**
     * Get the underlying lower level texture from Babylon.
     * @returns the internal texture
     */
    public getInternalTexture(): Nullable<InternalTexture> {
        return this._texture;
    }

    /**
     * Get the class name of the texture.
     * @returns "ThinRenderTargetTexture"
     */
    public getClassName(): string {
        return "ThinRenderTargetTexture";
    }

    /**
     * Dispose the texture and release its associated resources.
     * @param disposeOnlyFramebuffers if set to true it will dispose only the frame buffers (default: false)
     */
    public dispose(disposeOnlyFramebuffers = false): void {
        this._renderTarget?.dispose(true);
        this._renderTarget = null;

        if (!disposeOnlyFramebuffers) {
            super.dispose();
        }
    }
}
