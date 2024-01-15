import type { InternalTexture } from "../../Materials/Textures/internalTexture";
import type { TextureSize } from "../../Materials/Textures/textureCreationOptions";
import type { Nullable } from "../../types";
import { Constants } from "../constants";
import type { Engine } from "../engine";
import { RenderTargetWrapper } from "../renderTargetWrapper";
import type { ThinEngine } from "../thinEngine";

/** @internal */
export class WebGLRenderTargetWrapper extends RenderTargetWrapper {
    private _context: WebGLRenderingContext;

    /**
     * @internal
     */
    public _framebuffer: Nullable<WebGLFramebuffer> = null;
    /**
     * @internal
     */
    public _depthStencilBuffer: Nullable<WebGLRenderbuffer> = null;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    /**
     * @internal
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public _MSAAFramebuffer: Nullable<WebGLFramebuffer> = null;

    // Multiview
    /**
     * @internal
     */
    public _colorTextureArray: Nullable<WebGLTexture> = null;
    /**
     * @internal
     */
    public _depthStencilTextureArray: Nullable<WebGLTexture> = null;
    /**
     * @internal
     */
    public _disposeOnlyFramebuffers = false;
    /**
     * @internal
     */
    public _currentLOD = 0;

    constructor(isMulti: boolean, isCube: boolean, size: TextureSize, engine: ThinEngine, context: WebGLRenderingContext) {
        super(isMulti, isCube, size, engine);

        this._context = context;
    }

    protected _cloneRenderTargetWrapper(): Nullable<RenderTargetWrapper> {
        let rtw: Nullable<RenderTargetWrapper> = null;

        if (this._colorTextureArray && this._depthStencilTextureArray) {
            rtw = (this._engine as Engine).createMultiviewRenderTargetTexture(this.width, this.height);
            rtw.texture!.isReady = true;
        } else {
            rtw = super._cloneRenderTargetWrapper();
        }

        return rtw;
    }

    protected _swapRenderTargetWrapper(target: WebGLRenderTargetWrapper): void {
        super._swapRenderTargetWrapper(target);

        target._framebuffer = this._framebuffer;
        target._depthStencilBuffer = this._depthStencilBuffer;
        target._MSAAFramebuffer = this._MSAAFramebuffer;
        target._colorTextureArray = this._colorTextureArray;
        target._depthStencilTextureArray = this._depthStencilTextureArray;

        this._framebuffer = this._depthStencilBuffer = this._MSAAFramebuffer = this._colorTextureArray = this._depthStencilTextureArray = null;
    }

    /**
     * Creates the depth/stencil texture
     * @param comparisonFunction Comparison function to use for the texture
     * @param bilinearFiltering true if bilinear filtering should be used when sampling the texture
     * @param generateStencil true if the stencil aspect should also be created
     * @param samples sample count to use when creating the texture
     * @param format format of the depth texture
     * @param label defines the label to use for the texture (for debugging purpose only)
     * @returns the depth/stencil created texture
     */
    public createDepthStencilTexture(
        comparisonFunction: number = 0,
        bilinearFiltering: boolean = true,
        generateStencil: boolean = false,
        samples: number = 1,
        format: number = Constants.TEXTUREFORMAT_DEPTH32_FLOAT,
        label?: string
    ): InternalTexture {
        if (this._depthStencilBuffer) {
            // Dispose previous depth/stencil render buffers and clear the corresponding attachment.
            // Next time this framebuffer is bound, the new depth/stencil texture will be attached.
            const currentFrameBuffer = this._engine._currentFramebuffer;
            const gl = this._context;

            this._engine._bindUnboundFramebuffer(this._framebuffer);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, null);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, null);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, gl.RENDERBUFFER, null);
            this._engine._bindUnboundFramebuffer(currentFrameBuffer);
            gl.deleteRenderbuffer(this._depthStencilBuffer);

            this._depthStencilBuffer = null;
        }

        return super.createDepthStencilTexture(comparisonFunction, bilinearFiltering, generateStencil, samples, format, label);
    }

    /**
     * Shares the depth buffer of this render target with another render target.
     * @internal
     * @param renderTarget Destination renderTarget
     */
    public _shareDepth(renderTarget: WebGLRenderTargetWrapper): void {
        super._shareDepth(renderTarget);

        const gl = this._context;
        const depthbuffer = this._depthStencilBuffer;
        const framebuffer = renderTarget._MSAAFramebuffer || renderTarget._framebuffer;

        if (renderTarget._depthStencilBuffer && renderTarget._depthStencilBuffer !== depthbuffer) {
            gl.deleteRenderbuffer(renderTarget._depthStencilBuffer);
        }
        renderTarget._depthStencilBuffer = depthbuffer;
        const attachment = renderTarget._generateStencilBuffer ? gl.DEPTH_STENCIL_ATTACHMENT : gl.DEPTH_ATTACHMENT;
        this._engine._bindUnboundFramebuffer(framebuffer);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attachment, gl.RENDERBUFFER, depthbuffer);
        this._engine._bindUnboundFramebuffer(null);
    }

    /**
     * Binds a texture to this render target on a specific attachment
     * @param texture The texture to bind to the framebuffer
     * @param attachmentIndex Index of the attachment
     * @param faceIndexOrLayer The face or layer of the texture to render to in case of cube texture or array texture
     * @param lodLevel defines the lod level to bind to the frame buffer
     */
    private _bindTextureRenderTarget(texture: InternalTexture, attachmentIndex: number = 0, faceIndexOrLayer?: number, lodLevel: number = 0) {
        if (!texture._hardwareTexture) {
            return;
        }

        const framebuffer = this._framebuffer;

        const currentFB = this._engine._currentFramebuffer;
        this._engine._bindUnboundFramebuffer(framebuffer);

        if (this._engine.webGLVersion > 1) {
            const gl = this._context as WebGL2RenderingContext;

            const attachment = (<any>gl)["COLOR_ATTACHMENT" + attachmentIndex];
            if (texture.is2DArray || texture.is3D) {
                faceIndexOrLayer = faceIndexOrLayer ?? this.layerIndices?.[attachmentIndex] ?? 0;
                gl.framebufferTextureLayer(gl.FRAMEBUFFER, attachment, texture._hardwareTexture.underlyingResource, lodLevel, faceIndexOrLayer);
            } else if (texture.isCube) {
                // if face index is not specified, try to query it from faceIndices
                // default is face 0
                faceIndexOrLayer = faceIndexOrLayer ?? this.faceIndices?.[attachmentIndex] ?? 0;
                gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndexOrLayer, texture._hardwareTexture.underlyingResource, lodLevel);
            } else {
                gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, texture._hardwareTexture.underlyingResource, lodLevel);
            }
        } else {
            // Default behavior (WebGL)
            const gl = this._context;

            const attachment = (<any>gl)["COLOR_ATTACHMENT" + attachmentIndex + "_WEBGL"];
            const target = faceIndexOrLayer !== undefined ? gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndexOrLayer : gl.TEXTURE_2D;

            gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, target, texture._hardwareTexture.underlyingResource, lodLevel);
        }

        this._engine._bindUnboundFramebuffer(currentFB);
    }

    /**
     * Set a texture in the textures array
     * @param texture the texture to set
     * @param index the index in the textures array to set
     * @param disposePrevious If this function should dispose the previous texture
     */
    public setTexture(texture: InternalTexture, index: number = 0, disposePrevious: boolean = true) {
        super.setTexture(texture, index, disposePrevious);
        this._bindTextureRenderTarget(texture, index);
    }

    /**
     * Sets the layer and face indices of every render target texture
     * @param layers The layer of the texture to be set (make negative to not modify)
     * @param faces The face of the texture to be set (make negative to not modify)
     */
    public setLayerAndFaceIndices(layers: number[], faces: number[]) {
        super.setLayerAndFaceIndices(layers, faces);

        if (!this.textures || !this.layerIndices || !this.faceIndices) {
            return;
        }

        // the length of this._attachments is the right one as it does not count the depth texture, in case we generated it
        const textureCount = this._attachments?.length ?? this.textures.length;
        for (let index = 0; index < textureCount; index++) {
            const texture = this.textures[index];
            if (!texture) {
                // The target type was probably -1 at creation time and setTexture has not been called yet for this index
                continue;
            }
            if (texture.is2DArray || texture.is3D) {
                this._bindTextureRenderTarget(texture, index, this.layerIndices[index]);
            } else if (texture.isCube) {
                this._bindTextureRenderTarget(texture, index, this.faceIndices[index]);
            } else {
                this._bindTextureRenderTarget(texture, index);
            }
        }
    }

    /**
     * Set the face and layer indices of a texture in the textures array
     * @param index The index of the texture in the textures array to modify
     * @param layer The layer of the texture to be set
     * @param face The face of the texture to be set
     */
    public setLayerAndFaceIndex(index: number = 0, layer?: number, face?: number): void {
        super.setLayerAndFaceIndex(index, layer, face);

        if (!this.textures || !this.layerIndices || !this.faceIndices) {
            return;
        }

        const texture = this.textures[index];
        if (texture.is2DArray || texture.is3D) {
            this._bindTextureRenderTarget(this.textures[index], index, this.layerIndices[index]);
        } else if (texture.isCube) {
            this._bindTextureRenderTarget(this.textures[index], index, this.faceIndices[index]);
        }
    }

    public dispose(disposeOnlyFramebuffers = this._disposeOnlyFramebuffers): void {
        const gl = this._context;

        if (!disposeOnlyFramebuffers) {
            if (this._colorTextureArray) {
                this._context.deleteTexture(this._colorTextureArray);
                this._colorTextureArray = null;
            }
            if (this._depthStencilTextureArray) {
                this._context.deleteTexture(this._depthStencilTextureArray);
                this._depthStencilTextureArray = null;
            }
        }

        if (this._framebuffer) {
            gl.deleteFramebuffer(this._framebuffer);
            this._framebuffer = null;
        }

        if (this._depthStencilBuffer) {
            gl.deleteRenderbuffer(this._depthStencilBuffer);
            this._depthStencilBuffer = null;
        }

        if (this._MSAAFramebuffer) {
            gl.deleteFramebuffer(this._MSAAFramebuffer);
            this._MSAAFramebuffer = null;
        }

        super.dispose(disposeOnlyFramebuffers);
    }
}
