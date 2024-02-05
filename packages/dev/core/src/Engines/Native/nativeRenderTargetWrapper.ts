import type { Nullable } from "../../types";
import type { TextureSize } from "../../Materials/Textures/textureCreationOptions";
import { RenderTargetWrapper } from "../renderTargetWrapper";
import type { NativeEngine } from "../nativeEngine";
import type { NativeFramebuffer } from "./nativeInterfaces";

export class NativeRenderTargetWrapper extends RenderTargetWrapper {
    public override readonly _engine: NativeEngine;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    private __framebuffer: Nullable<NativeFramebuffer> = null;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private __framebufferDepthStencil: Nullable<NativeFramebuffer> = null;

    public get _framebuffer(): Nullable<NativeFramebuffer> {
        return this.__framebuffer;
    }

    public set _framebuffer(framebuffer: Nullable<NativeFramebuffer>) {
        if (this.__framebuffer) {
            this._engine._releaseFramebufferObjects(this.__framebuffer);
        }
        this.__framebuffer = framebuffer;
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

    constructor(isMulti: boolean, isCube: boolean, size: TextureSize, engine: NativeEngine) {
        super(isMulti, isCube, size, engine);
        this._engine = engine;
    }

    public dispose(disposeOnlyFramebuffers = false): void {
        this._framebuffer = null;
        this._framebufferDepthStencil = null;

        super.dispose(disposeOnlyFramebuffers);
    }
}
