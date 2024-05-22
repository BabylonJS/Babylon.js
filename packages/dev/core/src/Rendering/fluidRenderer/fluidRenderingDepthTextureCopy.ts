import { Constants } from "core/Engines/constants";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { RenderTargetWrapper } from "core/Engines/renderTargetWrapper";
import type { InternalTexture } from "core/Materials/Textures/internalTexture";
import { CopyTextureToTexture } from "core/Misc/copyTextureToTexture";

/** @internal */
export class FluidRenderingDepthTextureCopy {
    private _engine: AbstractEngine;
    private _depthRTWrapper: RenderTargetWrapper;
    private _copyTextureToTexture: CopyTextureToTexture;

    public get depthRTWrapper() {
        return this._depthRTWrapper;
    }

    constructor(engine: AbstractEngine, width: number, height: number, samples = 1) {
        this._engine = engine;
        this._copyTextureToTexture = new CopyTextureToTexture(engine, true);

        this._depthRTWrapper = this._engine.createRenderTargetTexture(
            { width, height },
            {
                generateMipMaps: false,
                type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
                format: Constants.TEXTUREFORMAT_R,
                samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                generateDepthBuffer: true,
                generateStencilBuffer: false,
                samples,
                noColorAttachment: true,
                label: "FluidRenderingDepthTextureCopyRTT",
            }
        );
        const depthTexture = this._depthRTWrapper.createDepthStencilTexture(0, false, false, 1, undefined, "FluidRenderingDepthTextureCopyRTTDepthStencil");
        depthTexture.label = `FluidDepthTextureCopy${width}x${height}x${samples}`;
    }

    public copy(source: InternalTexture): boolean {
        return this._copyTextureToTexture.copy(source, this._depthRTWrapper);
    }

    public dispose() {
        this._depthRTWrapper.dispose();
        this._copyTextureToTexture.dispose();
    }
}
