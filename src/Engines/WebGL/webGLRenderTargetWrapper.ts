import { Nullable } from "../../types";
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
