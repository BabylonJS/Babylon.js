import { Vector3 } from "../../../Maths/math";
import { Scalar } from "../../../Maths/math.scalar";
import { InternalTexture } from "../internalTexture";
import { BaseTexture } from "../baseTexture";
import { ThinEngine } from "../../../Engines/thinEngine";
import { Effect } from "../../../Materials/effect";
import { Constants } from "../../../Engines/constants";
import { EffectWrapper, EffectRenderer } from "../../../Materials/effectRenderer";
import { Nullable } from '../../../types';

import "../../../Shaders/hdrFiltering.vertex";
import "../../../Shaders/hdrFiltering.fragment";
import { Logger } from '../../../Misc/logger';

/**
 * Options for texture filtering
 */
interface IHDRFilteringOptions {
    /**
     * Scales pixel intensity for the input HDR map.
     */
    hdrScale?: number;

    /**
     * Quality of the filter. Should be `Constants.TEXTURE_FILTERING_QUALITY_OFFLINE` for prefiltering
     */
    quality?: number;
}

/**
 * Filters HDR maps to get correct renderings of PBR reflections
 */
export class HDRFiltering {

    private _engine: ThinEngine;
    private _effectRenderer: EffectRenderer;
    private _effectWrapper: EffectWrapper;

    private _lodGenerationOffset: number = 0;
    private _lodGenerationScale: number = 0.8;

    /**
     * Quality switch for prefiltering. Should be set to `Constants.TEXTURE_FILTERING_QUALITY_OFFLINE` unless
     * you care about baking speed.
     */
    public quality: number = Constants.TEXTURE_FILTERING_QUALITY_OFFLINE;

    /**
     * Scales pixel intensity for the input HDR map.
     */
    public hdrScale: number = 1;

    /**
     * Instantiates HDR filter for reflection maps
     *
     * @param engine Thin engine
     * @param options Options
     */
    constructor(engine: ThinEngine, options: IHDRFilteringOptions = {}) {
        // pass
        this._engine = engine;
        this.hdrScale = options.hdrScale || this.hdrScale;
        this.quality = options.hdrScale || this.quality;
    }

    private _createRenderTarget(size: number): InternalTexture {
        let textureType = Constants.TEXTURETYPE_UNSIGNED_BYTE;
        if (this._engine.getCaps().textureHalfFloatRender) {
            textureType = Constants.TEXTURETYPE_HALF_FLOAT;
        }
        else if (this._engine.getCaps().textureFloatRender) {
            textureType = Constants.TEXTURETYPE_FLOAT;
        }

        const texture = this._engine.createRenderTargetCubeTexture(size, {
            format: Constants.TEXTUREFORMAT_RGBA,
            type: textureType,
            generateMipMaps: false,
            generateDepthBuffer: false,
            generateStencilBuffer: false,
            samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE
        });
        this._engine.updateTextureWrappingMode(texture,
            Constants.TEXTURE_CLAMP_ADDRESSMODE,
            Constants.TEXTURE_CLAMP_ADDRESSMODE,
            Constants.TEXTURE_CLAMP_ADDRESSMODE);

        this._engine.updateTextureSamplingMode(Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, texture, true);

        return texture;
    }

    private _prefilterInternal(texture: BaseTexture): BaseTexture {
        const width = texture.getSize().width;
        const mipmapsCount = Math.round(Scalar.Log2(width)) + 1;

        const effect = this._effectWrapper.effect;
        const outputTexture = this._createRenderTarget(width);
        this._effectRenderer.setViewport();

        const intTexture = texture.getInternalTexture();
        if (intTexture) {
            // Just in case generate fresh clean mips.
            this._engine.updateTextureSamplingMode(Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, intTexture, true);
        }

        this._effectRenderer.applyEffectWrapper(this._effectWrapper);

        const directions = [
            [new Vector3(0, 0, -1), new Vector3(0, -1, 0), new Vector3(1, 0, 0)], // PositiveX
            [new Vector3(0, 0, 1), new Vector3(0, -1, 0), new Vector3(-1, 0, 0)], // NegativeX
            [new Vector3(1, 0, 0), new Vector3(0, 0, 1), new Vector3(0, 1, 0)], // PositiveY
            [new Vector3(1, 0, 0), new Vector3(0, 0, -1), new Vector3(0, -1, 0)], // NegativeY
            [new Vector3(1, 0, 0), new Vector3(0, -1, 0), new Vector3(0, 0, 1)], // PositiveZ
            [new Vector3(-1, 0, 0), new Vector3(0, -1, 0), new Vector3(0, 0, -1)], // NegativeZ
        ];

        effect.setFloat("hdrScale", this.hdrScale);
        effect.setFloat2("vFilteringInfo", texture.getSize().width, mipmapsCount);
        effect.setTexture("inputTexture", texture);

        for (let face = 0; face < 6; face++) {
            effect.setVector3("up", directions[face][0]);
            effect.setVector3("right", directions[face][1]);
            effect.setVector3("front", directions[face][2]);

            for (let lod = 0; lod < mipmapsCount; lod++) {

                this._engine.bindFramebuffer(outputTexture, face, undefined, undefined, true, lod);
                this._effectRenderer.applyEffectWrapper(this._effectWrapper);

                let alpha = Math.pow(2, (lod - this._lodGenerationOffset) / this._lodGenerationScale) / width;
                if (lod === 0) {
                    alpha = 0;
                }

                effect.setFloat("alphaG", alpha);

                this._effectRenderer.draw();
            }
        }

        // Cleanup
        this._effectRenderer.restoreStates();
        this._engine.restoreDefaultFramebuffer();
        this._engine._releaseFramebufferObjects(outputTexture);
        this._engine._releaseTexture(texture._texture!);

        // Internal Swap
        outputTexture._swapAndDie(texture._texture!);
        return texture;
    }

    private _createEffect(texture: BaseTexture, onCompiled?: Nullable<(effect: Effect) => void>): EffectWrapper {
        const defines = [];
        if (texture.gammaSpace) {
            defines.push("#define GAMMA_INPUT");
        }

        defines.push("#define NUM_SAMPLES " + this.quality + "u"); // unsigned int

        const effectWrapper = new EffectWrapper({
            engine: this._engine,
            name: "hdrFiltering",
            vertexShader: "hdrFiltering",
            fragmentShader: "hdrFiltering",
            samplerNames: ["inputTexture"],
            uniformNames: ["vSampleDirections", "vWeights", "up", "right", "front", "vFilteringInfo", "hdrScale", "alphaG"],
            useShaderStore: true,
            defines,
            onCompiled: onCompiled
        });

        return effectWrapper;
    }

    /**
     * Get a value indicating if the filter is ready to be used
     * @param texture Texture to filter
     * @returns true if the filter is ready
     */
    public isReady(texture: BaseTexture) {
        return (texture.isReady() && this._effectWrapper.effect.isReady());
    }

    /**
      * Prefilters a cube texture to have mipmap levels representing roughness values.
      * Prefiltering will be invoked at the end of next rendering pass.
      * This has to be done once the map is loaded, and has not been prefiltered by a third party software.
      * See http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf for more information
      * @param texture Texture to filter
      * @param onFinished Callback when filtering is done
      * @return Promise called when prefiltering is done
      */
    public prefilter(texture: BaseTexture, onFinished: Nullable<() => void> = null) {
        if (this._engine.webGLVersion === 1) {
            Logger.Warn("HDR prefiltering is not available in WebGL 1., you can use real time filtering instead.");
            return;
        }

        return new Promise((resolve) => {
            this._effectRenderer = new EffectRenderer(this._engine);
            this._effectWrapper = this._createEffect(texture);
            this._effectWrapper.effect.executeWhenCompiled(() => {
                this._prefilterInternal(texture);
                this._effectRenderer.dispose();
                this._effectWrapper.dispose();
                resolve();
                if (onFinished) {
                    onFinished();
                }
            });
        });
    }
}