import { type Nullable } from "../../types";
import { type InternalTexture } from "../../Materials/Textures/internalTexture";
import { type TextureSize } from "../../Materials/Textures/textureCreationOptions";
import { RenderTargetWrapper } from "../renderTargetWrapper";
import { type NativeFramebuffer } from "./nativeInterfaces";
import { type ThinNativeEngine } from "../thinNativeEngine";

export class NativeRenderTargetWrapper extends RenderTargetWrapper {
    public override readonly _engine: ThinNativeEngine;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    private __framebuffer: Nullable<NativeFramebuffer> = null;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private __framebufferDepthStencil: Nullable<NativeFramebuffer> = null;
    // Per-face framebuffers for cube render targets (index = cube face 0..5).
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private __framebuffers: Nullable<NativeFramebuffer[]> = null;

    public get _framebuffer(): Nullable<NativeFramebuffer> {
        return this.__framebuffer;
    }

    public set _framebuffer(framebuffer: Nullable<NativeFramebuffer>) {
        if (this.__framebuffer) {
            this._engine._releaseFramebufferObjects(this.__framebuffer);
        }
        this.__framebuffer = framebuffer;
    }

    public get _framebuffers(): Nullable<NativeFramebuffer[]> {
        return this.__framebuffers;
    }

    public set _framebuffers(framebuffers: Nullable<NativeFramebuffer[]>) {
        if (this.__framebuffers) {
            for (const framebuffer of this.__framebuffers) {
                this._engine._releaseFramebufferObjects(framebuffer);
            }
        }
        this.__framebuffers = framebuffers;
        // Keep _framebuffer pointing at face 0 so single-target code paths still work.
        this.__framebuffer = framebuffers ? framebuffers[0] : null;
    }

    public get _framebufferDepthStencil(): Nullable<NativeFramebuffer> {
        return this.__framebufferDepthStencil;
    }

    public set _framebufferDepthStencil(framebufferDepthStencil: Nullable<NativeFramebuffer>) {
        if (this.__framebufferDepthStencil) {
            this._engine._releaseFramebufferObjects(this.__framebufferDepthStencil);
        }
        this.__framebufferDepthStencil = framebufferDepthStencil;
    }

    constructor(isMulti: boolean, isCube: boolean, size: TextureSize, engine: ThinNativeEngine) {
        super(isMulti, isCube, size, engine);
        this._engine = engine;
    }

    public override setTexture(texture: InternalTexture, index: number = 0, disposePrevious: boolean = true): void {
        const previous = this.textures?.[index];
        super.setTexture(texture, index, disposePrevious);

        // bgfx binds a fixed attachment set when a framebuffer is created and cannot re-point an individual
        // attachment the way GL's framebufferTexture2D can. When a multi render target attachment is swapped
        // after creation (e.g. the OIT depth-peeling renderer replaces every attachment via
        // MultiRenderTarget.setInternalTexture), recreate the whole framebuffer from the new attachment set.
        if (this.isMulti && this.textures?.[index] !== previous) {
            this._engine._createMultiRenderTargetFramebuffer(this);
        }
    }

    public override dispose(disposeOnlyFramebuffers = false): void {
        if (this.__framebuffers) {
            // Releases all six per-face framebuffers (face 0 is aliased by __framebuffer, so
            // clear that alias here without releasing it again).
            this._framebuffers = null;
        } else {
            this._framebuffer = null;
        }
        this._framebufferDepthStencil = null;

        super.dispose(disposeOnlyFramebuffers);
    }
}
