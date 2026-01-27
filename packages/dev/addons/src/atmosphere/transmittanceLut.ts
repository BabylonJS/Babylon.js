// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { Atmosphere } from "./atmosphere";
import type { AtmospherePhysicalProperties } from "./atmospherePhysicalProperties";
import { Clamp, SmoothStep } from "core/Maths/math.scalar.functions";
import { Constants } from "core/Engines/constants";
import type { DirectionalLight } from "core/Lights/directionalLight";
import { EffectRenderer, EffectWrapper } from "core/Materials/effectRenderer";
import { FromHalfFloat } from "core/Misc/textureTools";
import type { IColor3Like, IColor4Like, IVector2Like, IVector3Like } from "core/Maths/math.like";
import type { Nullable } from "core/types";
import { Observable } from "core/Misc/observable";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { Sample2DRgbaToRef } from "./sampling";
import { Vector3Dot } from "core/Maths/math.vector.functions";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

const LutWidthPx = 256;
const LutHeightPx = 64;
const EffectiveDomainInUVSpace = { x: (LutWidthPx - 1.0) / LutWidthPx, y: (LutHeightPx - 1.0) / LutHeightPx };
const HalfTexelSize = { x: 0.5 / LutWidthPx, y: 0.5 / LutHeightPx };
const TransmittanceHorizonRange = 2.0 * HalfTexelSize.x;
const TransmittanceMaxUnoccludedU = 1.0 - 0.5 * TransmittanceHorizonRange;

const UseHalfFloat = false;

// Temporary storage.
const Uv = { x: Number.NaN, y: Number.NaN } as IVector2Like;
const LightColorTemp = { r: Number.NaN, g: Number.NaN, b: Number.NaN } as IColor3Like;
const DirectionToLightTemp = { x: Number.NaN, y: Number.NaN, z: Number.NaN } as IVector3Like;
const Color4Temp = { r: Number.NaN, g: Number.NaN, b: Number.NaN, a: Number.NaN } as IColor4Like;

const ComputeLutUVToRef = (properties: AtmospherePhysicalProperties, radius: number, cosAngleLightToZenith: number, uv: IVector2Like): void => {
    const radiusSquared = radius * radius;
    const distanceToHorizon = Math.sqrt(Math.max(0.0, radiusSquared - properties.planetRadiusSquared));

    const cosAngleLightToZenithSq = cosAngleLightToZenith * cosAngleLightToZenith;
    const discriminant = radiusSquared * (cosAngleLightToZenithSq - 1.0) + properties.atmosphereRadiusSquared;
    const distanceToAtmosphereEdge = Math.max(0.0, -radius * cosAngleLightToZenith + Math.sqrt(Math.max(0.0, discriminant)));

    const minDistanceToAtmosphereEdge = Math.max(0.0, properties.atmosphereRadius - radius);
    const maxDistanceToAtmosphereEdge = distanceToHorizon + properties.horizonDistanceToAtmosphereEdge;
    const cosAngleLightToZenithCoordinate =
        (distanceToAtmosphereEdge - minDistanceToAtmosphereEdge) / Math.max(0.000001, maxDistanceToAtmosphereEdge - minDistanceToAtmosphereEdge);
    const distanceToHorizonCoordinate = distanceToHorizon / Math.max(0.000001, properties.horizonDistanceToAtmosphereEdge);

    // Unit to UV.
    uv.x = EffectiveDomainInUVSpace.x * cosAngleLightToZenithCoordinate + HalfTexelSize.x;
    uv.y = EffectiveDomainInUVSpace.y * distanceToHorizonCoordinate + HalfTexelSize.y;
};

const SampleLutToRef = (
    properties: AtmospherePhysicalProperties,
    lutData: Uint8Array | Uint16Array,
    positionDistanceToOrigin: number,
    cosAngleLightToZenith: number,
    result: IColor4Like
): void => {
    if (positionDistanceToOrigin > properties.atmosphereRadius) {
        result.r = result.g = result.b = result.a = 1.0;
        return;
    }

    ComputeLutUVToRef(properties, positionDistanceToOrigin, cosAngleLightToZenith, Uv);
    Sample2DRgbaToRef(Uv.x, Uv.y, LutWidthPx, LutHeightPx, lutData, result, UseHalfFloat ? FromHalfFloat : (value) => value / 255.0);

    const weight = Clamp(SmoothStep(1.0, 0.0, Clamp((Uv.x - TransmittanceMaxUnoccludedU) / TransmittanceHorizonRange)));
    result.r *= weight;
    result.g *= weight;
    result.b *= weight;
    result.a *= weight;
};

/**
 * The transmittance LUT can be used to get the radiance from an external light source arriving a given point, accounting for atmospheric scattering.
 */
export class TransmittanceLut {
    /**
     * Listen to this observer to know when the LUT data has been updated.
     * This is typically infrequent (once at startup), but also happens whenever the atmosphere's properties change.
     */
    public readonly onUpdatedObservable = new Observable<void>();

    private readonly _atmosphere: Atmosphere;
    private _lutData: Uint8Array | Uint16Array = new Uint8Array(0);
    private _renderTarget: Nullable<RenderTargetTexture>;
    private _effectWrapper: Nullable<EffectWrapper>;
    private _effectRenderer: Nullable<EffectRenderer>;
    private _isDirty = true;
    private _isDisposed = false;

    /**
     * True if the LUT has been rendered.
     */
    public get isDirty(): boolean {
        return this._isDirty;
    }

    /**
     * The render target that contains the transmittance LUT.
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
     * Constructs the {@link TransmittanceLut}.
     * @param atmosphere - The atmosphere that owns this LUT.
     */
    constructor(atmosphere: Atmosphere) {
        this._atmosphere = atmosphere;

        const scene = this._atmosphere.scene;
        const engine = scene.getEngine();
        const useHalfFloat = UseHalfFloat && engine.getCaps().textureHalfFloatRender;

        const name = "atmo-transmittance";
        const renderTarget = (this._renderTarget = new RenderTargetTexture(name, { width: LutWidthPx, height: LutHeightPx }, scene, {
            type: useHalfFloat ? Constants.TEXTURETYPE_HALF_FLOAT : Constants.TEXTURETYPE_UNSIGNED_BYTE,
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
            fragmentShader: "transmittance",
            attributeNames: ["position"],
            uniformNames: ["depth", ...(useUbo ? [] : atmosphereUbo.getUniformNames())],
            uniformBuffers: useUbo ? [uboName] : [],
            defines: ["#define POSITION_VEC2"],
            useShaderStore: true,
            shaderLanguage: useWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
            extraInitializations: (_, list) => {
                if (useWebGPU) {
                    list.push(Promise.all([import("./ShadersWGSL/fullscreenTriangle.vertex"), import("./ShadersWGSL/transmittance.fragment")]));
                } else {
                    list.push(Promise.all([import("./Shaders/fullscreenTriangle.vertex"), import("./Shaders/transmittance.fragment")]));
                }
            },
        });

        this._effectRenderer = new EffectRenderer(engine, {
            // Full screen triangle.
            indices: [0, 2, 1],
            positions: [-1, -1, -1, 3, 3, -1],
        });
    }

    /**
     * Gets the transmittance of an external light through the atmosphere to a point specified by its distance to the planet center and its geocentric normal.
     * The result is always a linear space color.
     * @param directionToLight - The direction to the light source.
     * @param pointRadius - The distance from the origin to the point.
     * @param pointGeocentricNormal - The normal of the point.
     * @param result - The color to write the result to.
     * @returns The result color.
     */
    public getTransmittedColorToRef<T extends IColor3Like>(directionToLight: IVector3Like, pointRadius: number, pointGeocentricNormal: IVector3Like, result: T): T {
        if (this._lutData[0] !== undefined) {
            const cosAngleLightToZenith = Vector3Dot(directionToLight, pointGeocentricNormal);
            SampleLutToRef(this._atmosphere.physicalProperties, this._lutData, pointRadius, cosAngleLightToZenith, Color4Temp);
            result.r = Color4Temp.r;
            result.g = Color4Temp.g;
            result.b = Color4Temp.b;
        } else {
            // Fallback.
            result.r = result.g = result.b = 1.0;
        }
        return result;
    }

    /**
     * Derives light color from the transmittance at a point specified by its distance to the planet center and its geocentric normal.
     * @param light - The light to update.
     * @param pointRadius - The distance from the origin to the point.
     * @param pointGeocentricNormal - The normal of the point.
     */
    public updateLightParameters(light: DirectionalLight, pointRadius: number, pointGeocentricNormal: IVector3Like): void {
        const lightDirection = light.direction;
        DirectionToLightTemp.x = -lightDirection.x;
        DirectionToLightTemp.y = -lightDirection.y;
        DirectionToLightTemp.z = -lightDirection.z;
        this.getTransmittedColorToRef(DirectionToLightTemp, pointRadius, pointGeocentricNormal, LightColorTemp);

        light.diffuse.copyFromFloats(LightColorTemp.r, LightColorTemp.g, LightColorTemp.b);
        light.specular.copyFromFloats(LightColorTemp.r, LightColorTemp.g, LightColorTemp.b);
    }

    /**
     * Renders the LUT if needed.
     * @returns true if the LUT was rendered.
     */
    public render(): boolean {
        // Only need to render the LUT once.
        const effectWrapper = this._effectWrapper;
        if (!this._isDirty || !effectWrapper?.isReady() || !this._renderTarget?.isReady()) {
            return false;
        }

        const engine = this._atmosphere.scene.getEngine();

        engine.bindFramebuffer(this.renderTarget.renderTarget!, undefined, undefined, undefined, true);

        const effectRenderer = this._effectRenderer!;
        effectRenderer.applyEffectWrapper(effectWrapper);

        effectRenderer.saveStates();
        effectRenderer.setViewport();

        const effect = effectWrapper.effect;
        effectRenderer.bindBuffers(effect);

        this._atmosphere.bindUniformBufferToEffect(effect);

        effect.setFloat("depth", 0);

        effectRenderer.draw();

        effectRenderer.restoreStates();
        engine.restoreDefaultFramebuffer();

        this._isDirty = false;

        // eslint-disable-next-line github/no-then
        void this.renderTarget.readPixels(0, 0, undefined, undefined, UseHalfFloat /* noDataConversion */)?.then((value: ArrayBufferView) => {
            if (this._isDisposed) {
                return;
            }
            this._lutData = value as Uint8Array | Uint16Array;
            this.onUpdatedObservable.notifyObservers();
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
     * Disposes the LUT and its resources.
     */
    public dispose(): void {
        this._renderTarget?.dispose();
        this._renderTarget = null;
        this._effectWrapper?.dispose();
        this._effectWrapper = null;
        this._effectRenderer?.dispose();
        this._effectRenderer = null;
        this._isDisposed = true;
    }
}
