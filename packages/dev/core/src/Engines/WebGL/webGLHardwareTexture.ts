import type { HardwareTextureWrapper } from "../../Materials/Textures/hardwareTextureWrapper";
import type { Nullable } from "../../types";

/** @internal */
export class WebGLHardwareTexture implements HardwareTextureWrapper {
    private _webGLTexture: WebGLTexture;
    private _context: WebGLRenderingContext;

    // There can be multiple buffers for a single WebGL texture because different layers of a 2DArrayTexture / 3DTexture
    // or different faces of a cube texture can be bound to different render targets at the same time.
    private _MSAARenderBuffer: Nullable<WebGLRenderbuffer[]> = null;

    public get underlyingResource(): Nullable<WebGLTexture> {
        return this._webGLTexture;
    }

    constructor(existingTexture: Nullable<WebGLTexture> = null, context: WebGLRenderingContext) {
        this._context = context as WebGLRenderingContext;
        if (!existingTexture) {
            existingTexture = context.createTexture();
            if (!existingTexture) {
                throw new Error("Unable to create webGL texture");
            }
        }
        this.set(existingTexture);
    }

    public setUsage(): void {}

    public set(hardwareTexture: WebGLTexture) {
        this._webGLTexture = hardwareTexture;
    }

    public reset() {
        this._webGLTexture = null as any;
        this._MSAARenderBuffer = null;
    }

    public addMSAARenderBuffer(buffer: WebGLRenderbuffer) {
        if (!this._MSAARenderBuffer) {
            this._MSAARenderBuffer = [];
        }
        this._MSAARenderBuffer.push(buffer);
    }

    public releaseMSAARenderBuffers() {
        if (this._MSAARenderBuffer) {
            for (const buffer of this._MSAARenderBuffer) {
                this._context.deleteRenderbuffer(buffer);
            }
            this._MSAARenderBuffer = null;
        }
    }

    public release() {
        this.releaseMSAARenderBuffers();

        if (this._webGLTexture) {
            this._context.deleteTexture(this._webGLTexture);
        }
        this.reset();
    }
}
