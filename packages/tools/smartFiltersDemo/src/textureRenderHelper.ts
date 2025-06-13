import { ThinRenderTargetTexture } from "@babylonjs/core/Materials/Textures/thinRenderTargetTexture.js";
import { ConnectionPointType, InputBlock, RenderTargetGenerator, SmartFilter } from "@babylonjs/smart-filters";
import type { SmartFilterRenderer } from "./smartFilterRenderer";
import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine";

/**
 * Helper class which makes it easy to render a texture to a Canvas, using a trivial Smart Filter graph.
 * This is used to test having Smart Filters render to a texture instead of a Canvas. The texture
 * another Smart Filter renders to can be rendered to the Canvas for display using this helper.
 */
export class TextureRenderHelper {
    private _started = false;
    private readonly _smartFilter: SmartFilter;
    private readonly _renderer: SmartFilterRenderer;
    private readonly _engine: ThinEngine;

    /**
     * The texture to be drawn to the Canvas. This can be used as the target output texture of
     * another Smart Filter graph to test the output of that graph.
     */
    public readonly renderTargetTexture: ThinRenderTargetTexture;

    public constructor(engine: ThinEngine, renderer: SmartFilterRenderer) {
        // Create target texture
        // We are only rendering full screen post process without depth or stencil information
        const setup = {
            generateDepthBuffer: false,
            generateStencilBuffer: false,
            generateMipMaps: false,
            samplingMode: 2, // Babylon Constants.TEXTURE_LINEAR_LINEAR,
        };
        const width = engine.getRenderWidth(true);
        const height = engine.getRenderHeight(true);
        this.renderTargetTexture = new ThinRenderTargetTexture(engine, { width, height }, setup);
        // Babylon Constants.TEXTURE_CLAMP_ADDRESSMODE; NPOT Friendly
        this.renderTargetTexture.wrapU = 0;
        this.renderTargetTexture.wrapV = 0;

        // Create Smart Filter to render the texture to the canvas
        this._smartFilter = new SmartFilter("TextureRenderHelper");
        const inputBlock = new InputBlock(
            this._smartFilter,
            "inputTexture",
            ConnectionPointType.Texture,
            this.renderTargetTexture
        );
        inputBlock.output.connectTo(this._smartFilter.output);

        // Save params for later
        this._engine = engine;
        this._renderer = renderer;
    }

    public async startAsync(): Promise<void> {
        if (this._started) {
            return;
        }
        this._started = true;

        const rtg = new RenderTargetGenerator(false);
        const runtime = await this._smartFilter.createRuntimeAsync(this._engine, rtg);

        this._renderer.afterRenderObservable.add(() => {
            runtime.render();
        });
    }
}
