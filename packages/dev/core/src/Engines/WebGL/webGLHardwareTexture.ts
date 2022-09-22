import type { HardwareTextureWrapper } from "../../Materials/Textures/hardwareTextureWrapper";
import type { Nullable } from "../../types";

/** @internal */
export class WebGLHardwareTexture implements HardwareTextureWrapper {
    private _webGLTexture: WebGLTexture;
    private _context: WebGLRenderingContext;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public _MSAARenderBuffer: Nullable<WebGLRenderbuffer> = null;

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

    public release() {
        if (this._MSAARenderBuffer) {
            this._context.deleteRenderbuffer(this._MSAARenderBuffer);
            this._MSAARenderBuffer = null;
        }

        if (this._webGLTexture) {
            this._context.deleteTexture(this._webGLTexture);
        }
        this.reset();
    }
}
