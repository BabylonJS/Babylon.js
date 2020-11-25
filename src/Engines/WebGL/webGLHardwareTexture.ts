import { HardwareTextureWrapper } from '../../Materials/Textures/hardwareTextureWrapper';
import { Nullable } from '../../types';

/** @hidden */
export class WebGLHardwareTexture implements HardwareTextureWrapper {

    private _webGLTexture: WebGLTexture;
    private _context: WebGLRenderingContext;

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

    public setUsage(textureSource: number, generateMipMaps: boolean, isCube: boolean, width: number, height: number): void {
    }

    public set(hardwareTexture: WebGLTexture) {
        this._webGLTexture = hardwareTexture;
    }

    public reset() {
        this._webGLTexture = null as any;
    }

    public release() {
        if (this._webGLTexture) {
            this._context.deleteTexture(this._webGLTexture);
        }
        this.reset();
    }
}
