import { Nullable } from "../../types";
import { Engine } from "../engine";
import { RenderTargetTextureSize } from "../Extensions/engine.renderTarget";
import { RenderTargetWrapper } from "../renderTargetWrapper";
import { ThinEngine } from "../thinEngine";

/** @hidden */
export class WebGLRenderTargetWrapper extends RenderTargetWrapper {

    private _context: WebGLRenderingContext;

    public _framebuffer: Nullable<WebGLFramebuffer> = null;
    public _depthStencilBuffer: Nullable<WebGLRenderbuffer> = null;
    public _MSAAFramebuffer: Nullable<WebGLFramebuffer> = null;
    // Multiview
    public _colorTextureArray: Nullable<WebGLTexture> = null;
    public _depthStencilTextureArray: Nullable<WebGLTexture> = null;

    constructor(isMulti: boolean, isCube: boolean, size: RenderTargetTextureSize, engine: ThinEngine, context: WebGLRenderingContext) {
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

    public dispose(disposeOnlyFramebuffers = false): void {
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
