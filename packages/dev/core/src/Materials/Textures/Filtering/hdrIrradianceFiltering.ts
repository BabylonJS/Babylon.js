import { Vector3 } from "../../../Maths/math";
import { ILog2 } from "../../../Maths/math.scalar.functions";
import { BaseTexture } from "../baseTexture";
import type { AbstractEngine } from "../../../Engines/abstractEngine";
import type { Effect } from "../../../Materials/effect";
import { Constants } from "../../../Engines/constants";
import { EffectWrapper, EffectRenderer } from "../../../Materials/effectRenderer";
import type { Nullable } from "../../../types";
import type { RenderTargetWrapper } from "../../../Engines/renderTargetWrapper";

import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { IblCdfGenerator } from "../../../Rendering/iblCdfGenerator";

/**
 * Options for texture filtering
 */
interface IHDRIrradianceFilteringOptions {
    /**
     * Scales pixel intensity for the input HDR map.
     */
    hdrScale?: number;

    /**
     * Quality of the filter. Should be `Constants.TEXTURE_FILTERING_QUALITY_OFFLINE` for prefiltering
     */
    quality?: number;

    /**
     * Use the Cumulative Distribution Function (CDF) for filtering
     */
    useCdf?: boolean;
}

/**
 * Filters HDR maps to get correct renderings of PBR reflections
 */
export class HDRIrradianceFiltering {
    private _engine: AbstractEngine;
    private _effectRenderer: EffectRenderer;
    private _effectWrapper: EffectWrapper;
    private _cdfGenerator: IblCdfGenerator;

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
     * Use the Cumulative Distribution Function (CDF) for filtering
     */
    public useCdf: boolean = false;

    /**
     * Instantiates HDR filter for irradiance map
     *
     * @param engine Thin engine
     * @param options Options
     */
    constructor(engine: AbstractEngine, options: IHDRIrradianceFilteringOptions = {}) {
        // pass
        this._engine = engine;
        this.hdrScale = options.hdrScale || this.hdrScale;
        this.quality = options.quality || this.quality;
        this.useCdf = options.useCdf || this.useCdf;
    }

    private _createRenderTarget(size: number): RenderTargetWrapper {
        let textureType = Constants.TEXTURETYPE_UNSIGNED_BYTE;
        if (this._engine.getCaps().textureHalfFloatRender) {
            textureType = Constants.TEXTURETYPE_HALF_FLOAT;
        } else if (this._engine.getCaps().textureFloatRender) {
            textureType = Constants.TEXTURETYPE_FLOAT;
        }

        const rtWrapper = this._engine.createRenderTargetCubeTexture(size, {
            format: Constants.TEXTUREFORMAT_RGBA,
            type: textureType,
            createMipMaps: false,
            generateMipMaps: false,
            generateDepthBuffer: false,
            generateStencilBuffer: false,
            samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
            label: "HDR_Irradiance_Filtering_Target",
        });
        this._engine.updateTextureWrappingMode(rtWrapper.texture!, Constants.TEXTURE_CLAMP_ADDRESSMODE, Constants.TEXTURE_CLAMP_ADDRESSMODE, Constants.TEXTURE_CLAMP_ADDRESSMODE);

        return rtWrapper;
    }

    private _prefilterInternal(texture: BaseTexture): BaseTexture {
        const width = texture.getSize().width;
        const mipmapsCount = ILog2(width);

        const effect = this._effectWrapper.effect;
        // Choose a power of 2 size for the irradiance map.
        // It can be much smaller than the original texture.
        const irradianceSize = Math.max(32, 1 << ILog2(width >> 3));
        const outputTexture = this._createRenderTarget(irradianceSize);
        this._effectRenderer.saveStates();
        this._effectRenderer.setViewport();

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
        if (this._cdfGenerator) {
            effect.setTexture("icdfTexture", this._cdfGenerator.getIcdfTexture());
        }

        for (let face = 0; face < 6; face++) {
            effect.setVector3("up", directions[face][0]);
            effect.setVector3("right", directions[face][1]);
            effect.setVector3("front", directions[face][2]);

            this._engine.bindFramebuffer(outputTexture, face, undefined, undefined, true);
            this._effectRenderer.applyEffectWrapper(this._effectWrapper);

            this._effectRenderer.draw();
        }

        // Cleanup
        this._effectRenderer.restoreStates();
        this._engine.restoreDefaultFramebuffer();
        effect.setTexture("inputTexture", null);
        effect.setTexture("icdfTexture", null);
        const irradianceTexture = new BaseTexture(texture.getScene(), outputTexture.texture!);
        irradianceTexture.name = texture.name + "_irradiance";
        irradianceTexture.displayName = texture.name + "_irradiance";
        irradianceTexture.gammaSpace = false;
        return irradianceTexture;
    }

    private _createEffect(texture: BaseTexture, onCompiled?: Nullable<(effect: Effect) => void>): EffectWrapper {
        const defines = [];
        if (texture.gammaSpace) {
            defines.push("#define GAMMA_INPUT");
        }

        defines.push("#define NUM_SAMPLES " + this.quality + "u"); // unsigned int

        const isWebGPU = this._engine.isWebGPU;
        const samplers = ["inputTexture"];
        if (this._cdfGenerator) {
            samplers.push("icdfTexture");
            defines.push("#define IBL_CDF_FILTERING");
        }
        const effectWrapper = new EffectWrapper({
            engine: this._engine,
            name: "HDRIrradianceFiltering",
            vertexShader: "hdrIrradianceFiltering",
            fragmentShader: "hdrIrradianceFiltering",
            samplerNames: samplers,
            uniformNames: ["vSampleDirections", "vWeights", "up", "right", "front", "vFilteringInfo", "hdrScale"],
            useShaderStore: true,
            defines,
            onCompiled: onCompiled,
            shaderLanguage: isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
            extraInitializationsAsync: async () => {
                if (isWebGPU) {
                    await Promise.all([import("../../../ShadersWGSL/hdrIrradianceFiltering.vertex"), import("../../../ShadersWGSL/hdrIrradianceFiltering.fragment")]);
                } else {
                    await Promise.all([import("../../../Shaders/hdrIrradianceFiltering.vertex"), import("../../../Shaders/hdrIrradianceFiltering.fragment")]);
                }
            },
        });

        return effectWrapper;
    }

    /**
     * Get a value indicating if the filter is ready to be used
     * @param texture Texture to filter
     * @returns true if the filter is ready
     */
    public isReady(texture: BaseTexture) {
        return texture.isReady() && this._effectWrapper.effect.isReady();
    }

    /**
     * Prefilters a cube texture to contain IBL irradiance.
     * Prefiltering will be invoked at the end of next rendering pass.
     * This has to be done once the map is loaded, and has not been prefiltered by a third party software.
     * See http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf for more information
     * @param texture Texture to filter
     * @returns Promise called when prefiltering is done
     */
    public async prefilter(texture: BaseTexture): Promise<BaseTexture> {
        if (!this._engine._features.allowTexturePrefiltering) {
            throw new Error("HDR prefiltering is not available in WebGL 1., you can use real time filtering instead.");
        }

        if (this.useCdf) {
            this._cdfGenerator = new IblCdfGenerator(this._engine);
            this._cdfGenerator.iblSource = texture;

            await this._cdfGenerator.renderWhenReady();
        }

        this._effectRenderer = new EffectRenderer(this._engine);
        this._effectWrapper = this._createEffect(texture);
        await this._effectWrapper.effect.whenCompiledAsync();

        const irradianceTexture = this._prefilterInternal(texture);
        this._effectRenderer.dispose();
        this._effectWrapper.dispose();
        this._cdfGenerator?.dispose();

        return irradianceTexture;
    }
}
