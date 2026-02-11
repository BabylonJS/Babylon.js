// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { Atmosphere } from "./atmosphere";
import type { AtmospherePhysicalProperties } from "./atmospherePhysicalProperties";
import { Clamp } from "core/Maths/math.scalar.functions";
import { Constants } from "core/Engines/constants";
import { EffectRenderer, EffectWrapper } from "core/Materials/effectRenderer";
import { FromHalfFloat } from "core/Misc/textureTools";
import type { IColor3Like, IColor4Like, IVector2Like, IVector3Like } from "core/Maths/math.like";
import type { Nullable } from "core/types";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { Sample2DRgbaToRef } from "./sampling";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { ShaderStore } from "core/Engines/shaderStore";
import { Vector3Dot } from "core/Maths/math.vector.functions";

const RaySamples = 128;
const LutWidthPx = 64;
const LutHeightPx = 16;
const HalfTexelSize = { x: 0.5 / LutWidthPx, y: 0.5 / LutHeightPx };
const UnitToUVScale = { x: (LutWidthPx - 1.0) / LutWidthPx, y: (LutHeightPx - 1.0) / LutHeightPx };
const UvTemp = { x: Number.NaN, y: Number.NaN };
const Color4Temp = { r: Number.NaN, g: Number.NaN, b: Number.NaN, a: Number.NaN } as IColor4Like;

const ComputeLutUVToRef = (properties: AtmospherePhysicalProperties, radius: number, cosAngleLightToZenith: number, result: IVector2Like): void => {
    const unitX = Clamp(0.5 + 0.5 * cosAngleLightToZenith);
    const unitY = Clamp((radius - properties.planetRadius) / properties.atmosphereThickness);
    result.x = unitX * UnitToUVScale.x + HalfTexelSize.x;
    result.y = unitY * UnitToUVScale.y + HalfTexelSize.y;
};

/**
 * The diffuse sky irradiance LUT is used to query the diffuse irradiance at a specified position.
 */
export class DiffuseSkyIrradianceLut {
    private readonly _atmosphere: Atmosphere;
    private _renderTarget: Nullable<RenderTargetTexture> = null;
    private _effectWrapper: Nullable<EffectWrapper> = null;
    private _effectRenderer: Nullable<EffectRenderer> = null;
    private _isDirty = true;
    private _isDisposed = false;
    private _lutData: Uint8Array | Uint16Array = new Uint16Array(0);

    /**
     * True if the LUT needs to be rendered.
     */
    public get isDirty() {
        return this._isDirty;
    }

    /**
     * True if the LUT has been disposed.
     */
    public get isDisposed(): boolean {
        return this._isDisposed;
    }

    /**
     * The render target used for this LUT.
     * @throws if the LUT has been disposed.
     */
    public get renderTarget(): RenderTargetTexture {
        if (this._isDisposed || this._renderTarget === null) {
            throw new Error();
        }
        return this._renderTarget;
    }

    /**
     * True if the LUT data has been read back from the GPU.
     */
    public get hasLutData(): boolean {
        return this._lutData[0] !== undefined;
    }

    /**
     * Constructs the {@link DiffuseSkyIrradianceLut}.
     * @param atmosphere - The atmosphere to use.
     */
    constructor(atmosphere: Atmosphere) {
        this._atmosphere = atmosphere;
        const scene = atmosphere.scene;
        const engine = scene.getEngine();

        const name = "atmo-diffuseSkyIrradiance";
        const caps = engine.getCaps();
        const textureType = caps.textureHalfFloatRender ? Constants.TEXTURETYPE_HALF_FLOAT : Constants.TEXTURETYPE_UNSIGNED_BYTE;
        const renderTarget = (this._renderTarget = new RenderTargetTexture(name, { width: LutWidthPx, height: LutHeightPx }, scene, {
            generateMipMaps: false,
            type: textureType,
            samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
            generateDepthBuffer: false,
            gammaSpace: false,
        }));
        renderTarget.wrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        renderTarget.wrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        renderTarget.anisotropicFilteringLevel = 1;
        renderTarget.skipInitialClear = true;

        const atmosphereUbo = atmosphere.uniformBuffer;
        const useUbo = atmosphereUbo.useUbo;
        const useWebGPU = engine.isWebGPU && !EffectWrapper.ForceGLSL;
        const uboName = useWebGPU ? "atmosphere" : atmosphereUbo.name;

        this._effectWrapper = new EffectWrapper({
            engine,
            name,
            vertexShader: "fullscreenTriangle",
            fragmentShader: "diffuseSkyIrradiance",
            attributeNames: ["position"],
            uniformNames: ["depth", ...(useUbo ? [] : atmosphereUbo.getUniformNames())],
            uniformBuffers: useUbo ? [uboName] : [],
            defines: ["#define POSITION_VEC2", `#define NUM_SAMPLES ${RaySamples}u`, "#define CUSTOM_IRRADIANCE_FILTERING_INPUT", "#define CUSTOM_IRRADIANCE_FILTERING_FUNCTION"],
            samplers: ["transmittanceLut", "multiScatteringLut"],
            useShaderStore: true,
            shaderLanguage: useWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
            extraInitializationsAsync: async () => {
                await Promise.all(
                    useWebGPU
                        ? [import("./ShadersWGSL/fullscreenTriangle.vertex"), import("./ShadersWGSL/diffuseSkyIrradiance.fragment")]
                        : [import("./Shaders/fullscreenTriangle.vertex"), import("./Shaders/diffuseSkyIrradiance.fragment")]
                );

                // Replace the CUSTOM_IRRADIANCE_FILTERING placeholder with call to integrateForIrradiance.
                const includeStore = useWebGPU ? ShaderStore.IncludesShadersStoreWGSL : ShaderStore.IncludesShadersStore;
                let patchedInclude = includeStore["hdrFilteringFunctions"];
                patchedInclude = patchedInclude.replace(/^(?!.*#(?:ifdef|ifndef)\s).*CUSTOM_IRRADIANCE_FILTERING_INPUT/gm, "");
                patchedInclude = patchedInclude.replace(
                    /^(?!.*#(?:ifdef|ifndef)\s).*CUSTOM_IRRADIANCE_FILTERING_FUNCTION/gm,
                    useWebGPU ? "var c = integrateForIrradiance(n, Ls, vec3f(0., filteringInfo.x, 0.));" : "vec3 c = integrateForIrradiance(n, Ls, vec3(0., filteringInfo.x, 0.));"
                );

                // Replace the existing #include<hdrFilteringFunctions> with the patched include.
                const shaderStore = useWebGPU ? ShaderStore.ShadersStoreWGSL : ShaderStore.ShadersStore;
                let shader = shaderStore["diffuseSkyIrradiancePixelShader"];
                shader = shader.replace("#include<hdrFilteringFunctions>", patchedInclude);
                shaderStore["diffuseSkyIrradiancePixelShader"] = shader;
            },
        });

        this._effectRenderer = new EffectRenderer(engine, {
            // Full screen triangle.
            indices: [0, 2, 1],
            positions: [-1, -1, -1, 3, 3, -1],
        });

        // The sky irradiance will also be used for the environment texture.
        scene.environmentTexture = renderTarget;
        scene.environmentTexture.irradianceTexture = renderTarget;
        scene.environmentIntensity = 1.0;

        // Prevent the irradiance LUT from being rendered redundantly at the beginning of the frame.
        scene.environmentTexture.isRenderTarget = false;
    }

    /**
     * Gets the diffuse sky irradiance for a surface oriented along the geocentric normal.
     * Resulting color is always in linear space.
     * @param directionToLight - The direction to the light in world space.
     * @param radius - The position's distance to the planet origin.
     * @param cameraGeocentricNormal - The geocentric normal of the camera.
     * @param lightIrradiance - The irradiance of the light.
     * @param result - The color to store the result in.
     * @returns The result color.
     */
    public getDiffuseSkyIrradianceToRef<T extends IColor3Like>(
        directionToLight: IVector3Like,
        radius: number,
        cameraGeocentricNormal: IVector3Like,
        lightIrradiance: number,
        result: T
    ): T {
        const atmosphere = this._atmosphere;
        const additionalDiffuseSkyIrradiance = atmosphere.additionalDiffuseSkyIrradiance;

        const properties = atmosphere.physicalProperties;
        if (this._lutData[0] === undefined || radius > properties.atmosphereRadius) {
            result.r = additionalDiffuseSkyIrradiance.r;
            result.g = additionalDiffuseSkyIrradiance.g;
            result.b = additionalDiffuseSkyIrradiance.b;
            return result;
        }

        const cosAngleLightToZenith = Vector3Dot(directionToLight, cameraGeocentricNormal);
        ComputeLutUVToRef(properties, radius, cosAngleLightToZenith, UvTemp);
        Sample2DRgbaToRef(UvTemp.x, UvTemp.y, LutWidthPx, LutHeightPx, this._lutData, Color4Temp, FromHalfFloat);

        const intensity = atmosphere.diffuseSkyIrradianceIntensity;
        result.r = intensity * (lightIrradiance * Color4Temp.r + additionalDiffuseSkyIrradiance.r);
        result.g = intensity * (lightIrradiance * Color4Temp.g + additionalDiffuseSkyIrradiance.g);
        result.b = intensity * (lightIrradiance * Color4Temp.b + additionalDiffuseSkyIrradiance.b);

        return result;
    }

    /**
     * Renders the LUT.
     * @returns True if the LUT was rendered.
     */
    public render(): boolean {
        // Only need to render the LUT once.
        const effectWrapper = this._effectWrapper;
        if (!this._isDirty || !effectWrapper?.isReady() || !this._renderTarget?.isReady()) {
            return false;
        }

        const effectRenderer = this._effectRenderer!;
        effectRenderer.saveStates();

        const engine = this._atmosphere.scene.getEngine();
        engine.bindFramebuffer(this.renderTarget.renderTarget!, undefined, undefined, undefined, true);

        effectRenderer.setViewport();
        effectRenderer.applyEffectWrapper(effectWrapper);

        const effect = effectWrapper.effect;
        effectRenderer.bindBuffers(effect);

        effect.setTexture("transmittanceLut", this._atmosphere.transmittanceLut!.renderTarget);
        effect.setTexture("multiScatteringLut", this._atmosphere.multiScatteringLutRenderTarget);

        this._atmosphere.bindUniformBufferToEffect(effect);

        effect.setFloat("depth", 0.0);

        effectRenderer.draw();

        effectRenderer.restoreStates();
        engine.restoreDefaultFramebuffer();

        this._isDirty = false;

        // eslint-disable-next-line github/no-then
        void this.renderTarget.readPixels(0, 0, undefined, undefined, true /* noDataConversion */)?.then((value: ArrayBufferView) => {
            if (this._isDisposed) {
                return;
            }
            this._lutData = value as Uint8Array | Uint16Array;
        });

        return true;
    }

    /**
     * Marks the LUT as needing to be rendered.
     */
    public markDirty(): void {
        this._isDirty = true;
    }

    /**
     * Disposes the LUT.
     */
    public dispose() {
        if (this._renderTarget) {
            this._renderTarget.irradianceTexture = null;
            this._renderTarget.dispose();
        }
        this._renderTarget = null;
        this._effectWrapper?.dispose();
        this._effectWrapper = null;
        this._effectRenderer?.dispose();
        this._effectRenderer = null;
        this._isDisposed = true;
    }
}
