import type { SmartArray } from "../../Misc/smartArray";
import type { Nullable } from "../../types";
import type { Scene } from "../../scene";
import { Matrix, Vector3, Vector2 } from "../../Maths/math.vector";
import { Color4 } from "../../Maths/math.color";
import { VertexBuffer } from "../../Buffers/buffer";
import type { SubMesh } from "../../Meshes/subMesh";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import type { Mesh } from "../../Meshes/mesh";

import type { IShadowLight } from "../../Lights/shadowLight";
import { Light } from "../../Lights/light";
import type { MaterialDefines } from "../../Materials/materialDefines";
import type { Effect, IEffectCreationOptions } from "../../Materials/effect";
import { Texture } from "../../Materials/Textures/texture";
import { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";

import { PostProcess } from "../../PostProcesses/postProcess";
import { BlurPostProcess } from "../../PostProcesses/blurPostProcess";
import { Constants } from "../../Engines/constants";
import { Observable } from "../../Misc/observable";
import { _WarnImport } from "../../Misc/devTools";
import { EffectFallbacks } from "../../Materials/effectFallbacks";
import { RenderingManager } from "../../Rendering/renderingManager";
import { DrawWrapper } from "../../Materials/drawWrapper";
import type { UniformBuffer } from "../../Materials/uniformBuffer";
import type { Camera } from "../../Cameras/camera";

import "../../Shaders/shadowMap.fragment";
import "../../Shaders/shadowMap.vertex";
import "../../Shaders/depthBoxBlur.fragment";
import "../../Shaders/ShadersInclude/shadowMapFragmentSoftTransparentShadow";
import { addClipPlaneUniforms, bindClipPlane, prepareStringDefinesForClipPlanes } from "../../Materials/clipPlaneMaterialHelper";
import type { BaseTexture } from "../../Materials/Textures/baseTexture";
import {
    BindMorphTargetParameters,
    BindSceneUniformBuffer,
    PrepareAttributesForMorphTargetsInfluencers,
    PushAttributesForInstances,
} from "../../Materials/materialHelper.functions";

/**
 * Defines the options associated with the creation of a custom shader for a shadow generator.
 */
export interface ICustomShaderOptions {
    /**
     * Gets or sets the custom shader name to use
     */
    shaderName: string;

    /**
     * The list of attribute names used in the shader
     */
    attributes?: string[];

    /**
     * The list of uniform names used in the shader
     */
    uniforms?: string[];

    /**
     * The list of sampler names used in the shader
     */
    samplers?: string[];

    /**
     * The list of defines used in the shader
     */
    defines?: string[];
}

/**
 * Interface to implement to create a shadow generator compatible with BJS.
 */
export interface IShadowGenerator {
    /** Gets or set the id of the shadow generator. It will be the one from the light if not defined */
    id: string;
    /**
     * Gets the main RTT containing the shadow map (usually storing depth from the light point of view).
     * @returns The render target texture if present otherwise, null
     */
    getShadowMap(): Nullable<RenderTargetTexture>;

    /**
     * Determine whether the shadow generator is ready or not (mainly all effects and related post processes needs to be ready).
     * @param subMesh The submesh we want to render in the shadow map
     * @param useInstances Defines whether will draw in the map using instances
     * @param isTransparent Indicates that isReady is called for a transparent subMesh
     * @returns true if ready otherwise, false
     */
    isReady(subMesh: SubMesh, useInstances: boolean, isTransparent: boolean): boolean;

    /**
     * Prepare all the defines in a material relying on a shadow map at the specified light index.
     * @param defines Defines of the material we want to update
     * @param lightIndex Index of the light in the enabled light list of the material
     */
    prepareDefines(defines: MaterialDefines, lightIndex: number): void;
    /**
     * Binds the shadow related information inside of an effect (information like near, far, darkness...
     * defined in the generator but impacting the effect).
     * It implies the uniforms available on the materials are the standard BJS ones.
     * @param lightIndex Index of the light in the enabled light list of the material owning the effect
     * @param effect The effect we are binding the information for
     */
    bindShadowLight(lightIndex: string, effect: Effect): void;
    /**
     * Gets the transformation matrix used to project the meshes into the map from the light point of view.
     * (eq to shadow projection matrix * light transform matrix)
     * @returns The transform matrix used to create the shadow map
     */
    getTransformMatrix(): Matrix;

    /**
     * Recreates the shadow map dependencies like RTT and post processes. This can be used during the switch between
     * Cube and 2D textures for instance.
     */
    recreateShadowMap(): void;

    /**
     * Forces all the attached effect to compile to enable rendering only once ready vs. lazily compiling effects.
     * @param onCompiled Callback triggered at the and of the effects compilation
     * @param options Sets of optional options forcing the compilation with different modes
     */
    forceCompilation(onCompiled?: (generator: IShadowGenerator) => void, options?: Partial<{ useInstances: boolean }>): void;

    /**
     * Forces all the attached effect to compile to enable rendering only once ready vs. lazily compiling effects.
     * @param options Sets of optional options forcing the compilation with different modes
     * @returns A promise that resolves when the compilation completes
     */
    forceCompilationAsync(options?: Partial<{ useInstances: boolean }>): Promise<void>;

    /**
     * Serializes the shadow generator setup to a json object.
     * @returns The serialized JSON object
     */
    serialize(): any;

    /**
     * Disposes the Shadow map and related Textures and effects.
     */
    dispose(): void;
}

/**
 * Default implementation IShadowGenerator.
 * This is the main object responsible of generating shadows in the framework.
 * Documentation: https://doc.babylonjs.com/features/featuresDeepDive/lights/shadows
 */
export class ShadowGenerator implements IShadowGenerator {
    /**
     * Name of the shadow generator class
     */
    public static CLASSNAME = "ShadowGenerator";

    /**
     * Shadow generator mode None: no filtering applied.
     */
    public static readonly FILTER_NONE = 0;
    /**
     * Shadow generator mode ESM: Exponential Shadow Mapping.
     * (http://developer.download.nvidia.com/presentations/2008/GDC/GDC08_SoftShadowMapping.pdf)
     */
    public static readonly FILTER_EXPONENTIALSHADOWMAP = 1;
    /**
     * Shadow generator mode Poisson Sampling: Percentage Closer Filtering.
     * (Multiple Tap around evenly distributed around the pixel are used to evaluate the shadow strength)
     */
    public static readonly FILTER_POISSONSAMPLING = 2;
    /**
     * Shadow generator mode ESM: Blurred Exponential Shadow Mapping.
     * (http://developer.download.nvidia.com/presentations/2008/GDC/GDC08_SoftShadowMapping.pdf)
     */
    public static readonly FILTER_BLUREXPONENTIALSHADOWMAP = 3;
    /**
     * Shadow generator mode ESM: Exponential Shadow Mapping using the inverse of the exponential preventing
     * edge artifacts on steep falloff.
     * (http://developer.download.nvidia.com/presentations/2008/GDC/GDC08_SoftShadowMapping.pdf)
     */
    public static readonly FILTER_CLOSEEXPONENTIALSHADOWMAP = 4;
    /**
     * Shadow generator mode ESM: Blurred Exponential Shadow Mapping using the inverse of the exponential preventing
     * edge artifacts on steep falloff.
     * (http://developer.download.nvidia.com/presentations/2008/GDC/GDC08_SoftShadowMapping.pdf)
     */
    public static readonly FILTER_BLURCLOSEEXPONENTIALSHADOWMAP = 5;
    /**
     * Shadow generator mode PCF: Percentage Closer Filtering
     * benefits from Webgl 2 shadow samplers. Fallback to Poisson Sampling in Webgl 1
     * (https://developer.nvidia.com/gpugems/GPUGems/gpugems_ch11.html)
     */
    public static readonly FILTER_PCF = 6;
    /**
     * Shadow generator mode PCSS: Percentage Closering Soft Shadow.
     * benefits from Webgl 2 shadow samplers. Fallback to Poisson Sampling in Webgl 1
     * Contact Hardening
     */
    public static readonly FILTER_PCSS = 7;

    /**
     * Reserved for PCF and PCSS
     * Highest Quality.
     *
     * Execute PCF on a 5*5 kernel improving a lot the shadow aliasing artifacts.
     *
     * Execute PCSS with 32 taps blocker search and 64 taps PCF.
     */
    public static readonly QUALITY_HIGH = 0;
    /**
     * Reserved for PCF and PCSS
     * Good tradeoff for quality/perf cross devices
     *
     * Execute PCF on a 3*3 kernel.
     *
     * Execute PCSS with 16 taps blocker search and 32 taps PCF.
     */
    public static readonly QUALITY_MEDIUM = 1;
    /**
     * Reserved for PCF and PCSS
     * The lowest quality but the fastest.
     *
     * Execute PCF on a 1*1 kernel.
     *
     * Execute PCSS with 16 taps blocker search and 16 taps PCF.
     */
    public static readonly QUALITY_LOW = 2;

    /**
     * Defines the default alpha cutoff value used for transparent alpha tested materials.
     */
    public static DEFAULT_ALPHA_CUTOFF = 0.5;

    /** Gets or set the id of the shadow generator. It will be the one from the light if not defined */
    public id: string;

    /** Gets or sets the custom shader name to use */
    public customShaderOptions: ICustomShaderOptions;

    /** Gets or sets a custom function to allow/disallow rendering a sub mesh in the shadow map */
    public customAllowRendering: (subMesh: SubMesh) => boolean;

    /**
     * Observable triggered before the shadow is rendered. Can be used to update internal effect state
     */
    public onBeforeShadowMapRenderObservable = new Observable<Effect>();

    /**
     * Observable triggered after the shadow is rendered. Can be used to restore internal effect state
     */
    public onAfterShadowMapRenderObservable = new Observable<Effect>();

    /**
     * Observable triggered before a mesh is rendered in the shadow map.
     * Can be used to update internal effect state (that you can get from the onBeforeShadowMapRenderObservable)
     */
    public onBeforeShadowMapRenderMeshObservable = new Observable<Mesh>();

    /**
     * Observable triggered after a mesh is rendered in the shadow map.
     * Can be used to update internal effect state (that you can get from the onAfterShadowMapRenderObservable)
     */
    public onAfterShadowMapRenderMeshObservable = new Observable<Mesh>();

    protected _bias = 0.00005;
    /**
     * Gets the bias: offset applied on the depth preventing acnea (in light direction).
     */
    public get bias(): number {
        return this._bias;
    }
    /**
     * Sets the bias: offset applied on the depth preventing acnea (in light direction).
     */
    public set bias(bias: number) {
        this._bias = bias;
    }

    protected _normalBias = 0;
    /**
     * Gets the normalBias: offset applied on the depth preventing acnea (along side the normal direction and proportional to the light/normal angle).
     */
    public get normalBias(): number {
        return this._normalBias;
    }
    /**
     * Sets the normalBias: offset applied on the depth preventing acnea (along side the normal direction and proportional to the light/normal angle).
     */
    public set normalBias(normalBias: number) {
        this._normalBias = normalBias;
    }

    protected _blurBoxOffset = 1;
    /**
     * Gets the blur box offset: offset applied during the blur pass.
     * Only useful if useKernelBlur = false
     */
    public get blurBoxOffset(): number {
        return this._blurBoxOffset;
    }
    /**
     * Sets the blur box offset: offset applied during the blur pass.
     * Only useful if useKernelBlur = false
     */
    public set blurBoxOffset(value: number) {
        if (this._blurBoxOffset === value) {
            return;
        }

        this._blurBoxOffset = value;
        this._disposeBlurPostProcesses();
    }

    protected _blurScale = 2;
    /**
     * Gets the blur scale: scale of the blurred texture compared to the main shadow map.
     * 2 means half of the size.
     */
    public get blurScale(): number {
        return this._blurScale;
    }
    /**
     * Sets the blur scale: scale of the blurred texture compared to the main shadow map.
     * 2 means half of the size.
     */
    public set blurScale(value: number) {
        if (this._blurScale === value) {
            return;
        }

        this._blurScale = value;
        this._disposeBlurPostProcesses();
    }

    protected _blurKernel = 1;
    /**
     * Gets the blur kernel: kernel size of the blur pass.
     * Only useful if useKernelBlur = true
     */
    public get blurKernel(): number {
        return this._blurKernel;
    }
    /**
     * Sets the blur kernel: kernel size of the blur pass.
     * Only useful if useKernelBlur = true
     */
    public set blurKernel(value: number) {
        if (this._blurKernel === value) {
            return;
        }

        this._blurKernel = value;
        this._disposeBlurPostProcesses();
    }

    protected _useKernelBlur = false;
    /**
     * Gets whether the blur pass is a kernel blur (if true) or box blur.
     * Only useful in filtered mode (useBlurExponentialShadowMap...)
     */
    public get useKernelBlur(): boolean {
        return this._useKernelBlur;
    }
    /**
     * Sets whether the blur pass is a kernel blur (if true) or box blur.
     * Only useful in filtered mode (useBlurExponentialShadowMap...)
     */
    public set useKernelBlur(value: boolean) {
        if (this._useKernelBlur === value) {
            return;
        }

        this._useKernelBlur = value;
        this._disposeBlurPostProcesses();
    }

    protected _depthScale: number;
    /**
     * Gets the depth scale used in ESM mode.
     */
    public get depthScale(): number {
        return this._depthScale !== undefined ? this._depthScale : this._light.getDepthScale();
    }
    /**
     * Sets the depth scale used in ESM mode.
     * This can override the scale stored on the light.
     */
    public set depthScale(value: number) {
        this._depthScale = value;
    }

    protected _validateFilter(filter: number): number {
        return filter;
    }

    protected _filter = ShadowGenerator.FILTER_NONE;
    /**
     * Gets the current mode of the shadow generator (normal, PCF, ESM...).
     * The returned value is a number equal to one of the available mode defined in ShadowMap.FILTER_x like _FILTER_NONE
     */
    public get filter(): number {
        return this._filter;
    }
    /**
     * Sets the current mode of the shadow generator (normal, PCF, ESM...).
     * The returned value is a number equal to one of the available mode defined in ShadowMap.FILTER_x like _FILTER_NONE
     */
    public set filter(value: number) {
        value = this._validateFilter(value);

        // Blurring the cubemap is going to be too expensive. Reverting to unblurred version
        if (this._light.needCube()) {
            if (value === ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP) {
                this.useExponentialShadowMap = true;
                return;
            } else if (value === ShadowGenerator.FILTER_BLURCLOSEEXPONENTIALSHADOWMAP) {
                this.useCloseExponentialShadowMap = true;
                return;
            }
            // PCF on cubemap would also be expensive
            else if (value === ShadowGenerator.FILTER_PCF || value === ShadowGenerator.FILTER_PCSS) {
                this.usePoissonSampling = true;
                return;
            }
        }

        // Weblg1 fallback for PCF.
        if (value === ShadowGenerator.FILTER_PCF || value === ShadowGenerator.FILTER_PCSS) {
            if (!this._scene.getEngine()._features.supportShadowSamplers) {
                this.usePoissonSampling = true;
                return;
            }
        }

        if (this._filter === value) {
            return;
        }

        this._filter = value;
        this._disposeBlurPostProcesses();
        this._applyFilterValues();
        this._light._markMeshesAsLightDirty();
    }

    /**
     * Gets if the current filter is set to Poisson Sampling.
     */
    public get usePoissonSampling(): boolean {
        return this.filter === ShadowGenerator.FILTER_POISSONSAMPLING;
    }
    /**
     * Sets the current filter to Poisson Sampling.
     */
    public set usePoissonSampling(value: boolean) {
        const filter = this._validateFilter(ShadowGenerator.FILTER_POISSONSAMPLING);

        if (!value && this.filter !== ShadowGenerator.FILTER_POISSONSAMPLING) {
            return;
        }

        this.filter = value ? filter : ShadowGenerator.FILTER_NONE;
    }

    /**
     * Gets if the current filter is set to ESM.
     */
    public get useExponentialShadowMap(): boolean {
        return this.filter === ShadowGenerator.FILTER_EXPONENTIALSHADOWMAP;
    }
    /**
     * Sets the current filter is to ESM.
     */
    public set useExponentialShadowMap(value: boolean) {
        const filter = this._validateFilter(ShadowGenerator.FILTER_EXPONENTIALSHADOWMAP);

        if (!value && this.filter !== ShadowGenerator.FILTER_EXPONENTIALSHADOWMAP) {
            return;
        }
        this.filter = value ? filter : ShadowGenerator.FILTER_NONE;
    }

    /**
     * Gets if the current filter is set to filtered ESM.
     */
    public get useBlurExponentialShadowMap(): boolean {
        return this.filter === ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP;
    }
    /**
     * Gets if the current filter is set to filtered  ESM.
     */
    public set useBlurExponentialShadowMap(value: boolean) {
        const filter = this._validateFilter(ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP);

        if (!value && this.filter !== ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP) {
            return;
        }
        this.filter = value ? filter : ShadowGenerator.FILTER_NONE;
    }

    /**
     * Gets if the current filter is set to "close ESM" (using the inverse of the
     * exponential to prevent steep falloff artifacts).
     */
    public get useCloseExponentialShadowMap(): boolean {
        return this.filter === ShadowGenerator.FILTER_CLOSEEXPONENTIALSHADOWMAP;
    }
    /**
     * Sets the current filter to "close ESM" (using the inverse of the
     * exponential to prevent steep falloff artifacts).
     */
    public set useCloseExponentialShadowMap(value: boolean) {
        const filter = this._validateFilter(ShadowGenerator.FILTER_CLOSEEXPONENTIALSHADOWMAP);

        if (!value && this.filter !== ShadowGenerator.FILTER_CLOSEEXPONENTIALSHADOWMAP) {
            return;
        }
        this.filter = value ? filter : ShadowGenerator.FILTER_NONE;
    }

    /**
     * Gets if the current filter is set to filtered "close ESM" (using the inverse of the
     * exponential to prevent steep falloff artifacts).
     */
    public get useBlurCloseExponentialShadowMap(): boolean {
        return this.filter === ShadowGenerator.FILTER_BLURCLOSEEXPONENTIALSHADOWMAP;
    }
    /**
     * Sets the current filter to filtered "close ESM" (using the inverse of the
     * exponential to prevent steep falloff artifacts).
     */
    public set useBlurCloseExponentialShadowMap(value: boolean) {
        const filter = this._validateFilter(ShadowGenerator.FILTER_BLURCLOSEEXPONENTIALSHADOWMAP);

        if (!value && this.filter !== ShadowGenerator.FILTER_BLURCLOSEEXPONENTIALSHADOWMAP) {
            return;
        }
        this.filter = value ? filter : ShadowGenerator.FILTER_NONE;
    }

    /**
     * Gets if the current filter is set to "PCF" (percentage closer filtering).
     */
    public get usePercentageCloserFiltering(): boolean {
        return this.filter === ShadowGenerator.FILTER_PCF;
    }
    /**
     * Sets the current filter to "PCF" (percentage closer filtering).
     */
    public set usePercentageCloserFiltering(value: boolean) {
        const filter = this._validateFilter(ShadowGenerator.FILTER_PCF);

        if (!value && this.filter !== ShadowGenerator.FILTER_PCF) {
            return;
        }
        this.filter = value ? filter : ShadowGenerator.FILTER_NONE;
    }

    protected _filteringQuality = ShadowGenerator.QUALITY_HIGH;
    /**
     * Gets the PCF or PCSS Quality.
     * Only valid if usePercentageCloserFiltering or usePercentageCloserFiltering is true.
     */
    public get filteringQuality(): number {
        return this._filteringQuality;
    }
    /**
     * Sets the PCF or PCSS Quality.
     * Only valid if usePercentageCloserFiltering or usePercentageCloserFiltering is true.
     */
    public set filteringQuality(filteringQuality: number) {
        if (this._filteringQuality === filteringQuality) {
            return;
        }

        this._filteringQuality = filteringQuality;

        this._disposeBlurPostProcesses();
        this._applyFilterValues();
        this._light._markMeshesAsLightDirty();
    }

    /**
     * Gets if the current filter is set to "PCSS" (contact hardening).
     */
    public get useContactHardeningShadow(): boolean {
        return this.filter === ShadowGenerator.FILTER_PCSS;
    }
    /**
     * Sets the current filter to "PCSS" (contact hardening).
     */
    public set useContactHardeningShadow(value: boolean) {
        const filter = this._validateFilter(ShadowGenerator.FILTER_PCSS);

        if (!value && this.filter !== ShadowGenerator.FILTER_PCSS) {
            return;
        }
        this.filter = value ? filter : ShadowGenerator.FILTER_NONE;
    }

    protected _contactHardeningLightSizeUVRatio = 0.1;
    /**
     * Gets the Light Size (in shadow map uv unit) used in PCSS to determine the blocker search area and the penumbra size.
     * Using a ratio helps keeping shape stability independently of the map size.
     *
     * It does not account for the light projection as it was having too much
     * instability during the light setup or during light position changes.
     *
     * Only valid if useContactHardeningShadow is true.
     */
    public get contactHardeningLightSizeUVRatio(): number {
        return this._contactHardeningLightSizeUVRatio;
    }
    /**
     * Sets the Light Size (in shadow map uv unit) used in PCSS to determine the blocker search area and the penumbra size.
     * Using a ratio helps keeping shape stability independently of the map size.
     *
     * It does not account for the light projection as it was having too much
     * instability during the light setup or during light position changes.
     *
     * Only valid if useContactHardeningShadow is true.
     */
    public set contactHardeningLightSizeUVRatio(contactHardeningLightSizeUVRatio: number) {
        this._contactHardeningLightSizeUVRatio = contactHardeningLightSizeUVRatio;
    }

    protected _darkness = 0;

    /** Gets or sets the actual darkness of a shadow */
    public get darkness() {
        return this._darkness;
    }

    public set darkness(value: number) {
        this.setDarkness(value);
    }

    /**
     * Returns the darkness value (float). This can only decrease the actual darkness of a shadow.
     * 0 means strongest and 1 would means no shadow.
     * @returns the darkness.
     */
    public getDarkness(): number {
        return this._darkness;
    }
    /**
     * Sets the darkness value (float). This can only decrease the actual darkness of a shadow.
     * @param darkness The darkness value 0 means strongest and 1 would means no shadow.
     * @returns the shadow generator allowing fluent coding.
     */
    public setDarkness(darkness: number): ShadowGenerator {
        if (darkness >= 1.0) {
            this._darkness = 1.0;
        } else if (darkness <= 0.0) {
            this._darkness = 0.0;
        } else {
            this._darkness = darkness;
        }
        return this;
    }

    protected _transparencyShadow = false;

    /** Gets or sets the ability to have transparent shadow  */
    public get transparencyShadow() {
        return this._transparencyShadow;
    }

    public set transparencyShadow(value: boolean) {
        this.setTransparencyShadow(value);
    }

    /**
     * Sets the ability to have transparent shadow (boolean).
     * @param transparent True if transparent else False
     * @returns the shadow generator allowing fluent coding
     */
    public setTransparencyShadow(transparent: boolean): ShadowGenerator {
        this._transparencyShadow = transparent;
        return this;
    }

    /**
     * Enables or disables shadows with varying strength based on the transparency
     * When it is enabled, the strength of the shadow is taken equal to mesh.visibility
     * If you enabled an alpha texture on your material, the alpha value red from the texture is also combined to compute the strength:
     *          mesh.visibility * alphaTexture.a
     * The texture used is the diffuse by default, but it can be set to the opacity by setting useOpacityTextureForTransparentShadow
     * Note that by definition transparencyShadow must be set to true for enableSoftTransparentShadow to work!
     */
    public enableSoftTransparentShadow: boolean = false;

    /**
     * If this is true, use the opacity texture's alpha channel for transparent shadows instead of the diffuse one
     */
    public useOpacityTextureForTransparentShadow: boolean = false;

    protected _shadowMap: Nullable<RenderTargetTexture>;
    protected _shadowMap2: Nullable<RenderTargetTexture>;

    /**
     * Gets the main RTT containing the shadow map (usually storing depth from the light point of view).
     * @returns The render target texture if present otherwise, null
     */
    public getShadowMap(): Nullable<RenderTargetTexture> {
        return this._shadowMap;
    }

    /**
     * Gets the RTT used during rendering (can be a blurred version of the shadow map or the shadow map itself).
     * @returns The render target texture if the shadow map is present otherwise, null
     */
    public getShadowMapForRendering(): Nullable<RenderTargetTexture> {
        if (this._shadowMap2) {
            return this._shadowMap2;
        }

        return this._shadowMap;
    }

    /**
     * Gets the class name of that object
     * @returns "ShadowGenerator"
     */
    public getClassName(): string {
        return ShadowGenerator.CLASSNAME;
    }

    /**
     * Helper function to add a mesh and its descendants to the list of shadow casters.
     * @param mesh Mesh to add
     * @param includeDescendants boolean indicating if the descendants should be added. Default to true
     * @returns the Shadow Generator itself
     */
    public addShadowCaster(mesh: AbstractMesh, includeDescendants = true): ShadowGenerator {
        if (!this._shadowMap) {
            return this;
        }

        if (!this._shadowMap.renderList) {
            this._shadowMap.renderList = [];
        }

        if (this._shadowMap.renderList.indexOf(mesh) === -1) {
            this._shadowMap.renderList.push(mesh);
        }

        if (includeDescendants) {
            for (const childMesh of mesh.getChildMeshes()) {
                if (this._shadowMap.renderList.indexOf(childMesh) === -1) {
                    this._shadowMap.renderList.push(childMesh);
                }
            }
        }

        return this;
    }

    /**
     * Helper function to remove a mesh and its descendants from the list of shadow casters
     * @param mesh Mesh to remove
     * @param includeDescendants boolean indicating if the descendants should be removed. Default to true
     * @returns the Shadow Generator itself
     */
    public removeShadowCaster(mesh: AbstractMesh, includeDescendants = true): ShadowGenerator {
        if (!this._shadowMap || !this._shadowMap.renderList) {
            return this;
        }

        const index = this._shadowMap.renderList.indexOf(mesh);

        if (index !== -1) {
            this._shadowMap.renderList.splice(index, 1);
        }

        if (includeDescendants) {
            for (const child of mesh.getChildren()) {
                this.removeShadowCaster(<any>child);
            }
        }

        return this;
    }

    /**
     * Controls the extent to which the shadows fade out at the edge of the frustum
     */
    public frustumEdgeFalloff = 0;

    protected _light: IShadowLight;
    /**
     * Returns the associated light object.
     * @returns the light generating the shadow
     */
    public getLight(): IShadowLight {
        return this._light;
    }

    /**
     * If true the shadow map is generated by rendering the back face of the mesh instead of the front face.
     * This can help with self-shadowing as the geometry making up the back of objects is slightly offset.
     * It might on the other hand introduce peter panning.
     */
    public forceBackFacesOnly = false;

    protected _camera: Nullable<Camera>;

    protected _getCamera() {
        return this._camera ?? this._scene.activeCamera;
    }

    protected _scene: Scene;
    protected _useRedTextureType: boolean;
    protected _lightDirection = Vector3.Zero();

    protected _viewMatrix = Matrix.Zero();
    protected _projectionMatrix = Matrix.Zero();
    protected _transformMatrix = Matrix.Zero();
    protected _cachedPosition: Vector3 = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    protected _cachedDirection: Vector3 = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    protected _cachedDefines: string;
    protected _currentRenderId: number;
    protected _boxBlurPostprocess: Nullable<PostProcess>;
    protected _kernelBlurXPostprocess: Nullable<PostProcess>;
    protected _kernelBlurYPostprocess: Nullable<PostProcess>;
    protected _blurPostProcesses: PostProcess[];
    protected _mapSize: number;
    protected _currentFaceIndex = 0;
    protected _currentFaceIndexCache = 0;
    protected _textureType: number;
    protected _defaultTextureMatrix = Matrix.Identity();
    protected _storedUniqueId: Nullable<number>;
    protected _useUBO: boolean;
    protected _sceneUBOs: UniformBuffer[];
    protected _currentSceneUBO: UniformBuffer;
    protected _opacityTexture: Nullable<BaseTexture>;

    /**
     * @internal
     */
    public static _SceneComponentInitialization: (scene: Scene) => void = (_) => {
        throw _WarnImport("ShadowGeneratorSceneComponent");
    };

    /**
     * Gets or sets the size of the texture what stores the shadows
     */
    public get mapSize(): number {
        return this._mapSize;
    }

    public set mapSize(size: number) {
        this._mapSize = size;
        this._light._markMeshesAsLightDirty();
        this.recreateShadowMap();
    }

    /**
     * Creates a ShadowGenerator object.
     * A ShadowGenerator is the required tool to use the shadows.
     * Each light casting shadows needs to use its own ShadowGenerator.
     * Documentation : https://doc.babylonjs.com/features/featuresDeepDive/lights/shadows
     * @param mapSize The size of the texture what stores the shadows. Example : 1024.
     * @param light The light object generating the shadows.
     * @param usefullFloatFirst By default the generator will try to use half float textures but if you need precision (for self shadowing for instance), you can use this option to enforce full float texture.
     * @param camera Camera associated with this shadow generator (default: null). If null, takes the scene active camera at the time we need to access it
     * @param useRedTextureType Forces the generator to use a Red instead of a RGBA type for the shadow map texture format (default: false)
     */
    constructor(mapSize: number, light: IShadowLight, usefullFloatFirst?: boolean, camera?: Nullable<Camera>, useRedTextureType?: boolean) {
        this._mapSize = mapSize;
        this._light = light;
        this._scene = light.getScene();
        this._camera = camera ?? null;
        this._useRedTextureType = !!useRedTextureType;

        let shadowGenerators = light._shadowGenerators;
        if (!shadowGenerators) {
            shadowGenerators = light._shadowGenerators = new Map();
        }
        shadowGenerators.set(this._camera, this);
        this.id = light.id;
        this._useUBO = this._scene.getEngine().supportsUniformBuffers;

        if (this._useUBO) {
            this._sceneUBOs = [];
            this._sceneUBOs.push(this._scene.createSceneUniformBuffer(`Scene for Shadow Generator (light "${this._light.name}")`));
        }

        ShadowGenerator._SceneComponentInitialization(this._scene);

        // Texture type fallback from float to int if not supported.
        const caps = this._scene.getEngine().getCaps();

        if (!usefullFloatFirst) {
            if (caps.textureHalfFloatRender && caps.textureHalfFloatLinearFiltering) {
                this._textureType = Constants.TEXTURETYPE_HALF_FLOAT;
            } else if (caps.textureFloatRender && caps.textureFloatLinearFiltering) {
                this._textureType = Constants.TEXTURETYPE_FLOAT;
            } else {
                this._textureType = Constants.TEXTURETYPE_UNSIGNED_INT;
            }
        } else {
            if (caps.textureFloatRender && caps.textureFloatLinearFiltering) {
                this._textureType = Constants.TEXTURETYPE_FLOAT;
            } else if (caps.textureHalfFloatRender && caps.textureHalfFloatLinearFiltering) {
                this._textureType = Constants.TEXTURETYPE_HALF_FLOAT;
            } else {
                this._textureType = Constants.TEXTURETYPE_UNSIGNED_INT;
            }
        }

        this._initializeGenerator();
        this._applyFilterValues();
    }

    protected _initializeGenerator(): void {
        this._light._markMeshesAsLightDirty();
        this._initializeShadowMap();
    }

    protected _createTargetRenderTexture(): void {
        const engine = this._scene.getEngine();
        if (engine._features.supportDepthStencilTexture) {
            this._shadowMap = new RenderTargetTexture(
                this._light.name + "_shadowMap",
                this._mapSize,
                this._scene,
                false,
                true,
                this._textureType,
                this._light.needCube(),
                undefined,
                false,
                false,
                undefined,
                this._useRedTextureType ? Constants.TEXTUREFORMAT_RED : Constants.TEXTUREFORMAT_RGBA
            );
            this._shadowMap.createDepthStencilTexture(
                engine.useReverseDepthBuffer ? Constants.GREATER : Constants.LESS,
                true,
                undefined,
                undefined,
                undefined,
                `DepthStencilForShadowGenerator-${this._light.name}`
            );
        } else {
            this._shadowMap = new RenderTargetTexture(this._light.name + "_shadowMap", this._mapSize, this._scene, false, true, this._textureType, this._light.needCube());
        }
        this._shadowMap.noPrePassRenderer = true;
    }

    protected _initializeShadowMap(): void {
        this._createTargetRenderTexture();

        if (this._shadowMap === null) {
            return;
        }

        this._shadowMap.wrapU = Texture.CLAMP_ADDRESSMODE;
        this._shadowMap.wrapV = Texture.CLAMP_ADDRESSMODE;
        this._shadowMap.anisotropicFilteringLevel = 1;
        this._shadowMap.updateSamplingMode(Texture.BILINEAR_SAMPLINGMODE);
        this._shadowMap.renderParticles = false;
        this._shadowMap.ignoreCameraViewport = true;
        if (this._storedUniqueId) {
            this._shadowMap.uniqueId = this._storedUniqueId;
        }

        // Custom render function.
        this._shadowMap.customRenderFunction = (
            opaqueSubMeshes: SmartArray<SubMesh>,
            alphaTestSubMeshes: SmartArray<SubMesh>,
            transparentSubMeshes: SmartArray<SubMesh>,
            depthOnlySubMeshes: SmartArray<SubMesh>
        ) => this._renderForShadowMap(opaqueSubMeshes, alphaTestSubMeshes, transparentSubMeshes, depthOnlySubMeshes);

        // Force the mesh is ready function to true as we are double checking it
        // in the custom render function. Also it prevents side effects and useless
        // shader variations in DEPTHPREPASS mode.
        this._shadowMap.customIsReadyFunction = () => {
            return true;
        };

        const engine = this._scene.getEngine();

        this._shadowMap.onBeforeBindObservable.add(() => {
            this._currentSceneUBO = this._scene.getSceneUniformBuffer();
            engine._debugPushGroup?.(`shadow map generation for pass id ${engine.currentRenderPassId}`, 1);
        });

        // Record Face Index before render.
        this._shadowMap.onBeforeRenderObservable.add((faceIndex: number) => {
            if (this._sceneUBOs) {
                this._scene.setSceneUniformBuffer(this._sceneUBOs[0]);
            }
            this._currentFaceIndex = faceIndex;
            if (this._filter === ShadowGenerator.FILTER_PCF) {
                engine.setColorWrite(false);
            }
            this.getTransformMatrix(); // generate the view/projection matrix
            this._scene.setTransformMatrix(this._viewMatrix, this._projectionMatrix);
            if (this._useUBO) {
                this._scene.getSceneUniformBuffer().unbindEffect();
                this._scene.finalizeSceneUbo();
            }
        });

        // Blur if required after render.
        this._shadowMap.onAfterUnbindObservable.add(() => {
            if (this._sceneUBOs) {
                this._scene.setSceneUniformBuffer(this._currentSceneUBO);
            }
            this._scene.updateTransformMatrix(); // restore the view/projection matrices of the active camera

            if (this._filter === ShadowGenerator.FILTER_PCF) {
                engine.setColorWrite(true);
            }
            if (!this.useBlurExponentialShadowMap && !this.useBlurCloseExponentialShadowMap) {
                engine._debugPopGroup?.(1);
                return;
            }
            const shadowMap = this.getShadowMapForRendering();

            if (shadowMap) {
                this._scene.postProcessManager.directRender(this._blurPostProcesses, shadowMap.renderTarget, true);
                engine.unBindFramebuffer(shadowMap.renderTarget!, true);
                engine._debugPopGroup?.(1);
            }
        });

        // Clear according to the chosen filter.
        const clearZero = new Color4(0, 0, 0, 0);
        const clearOne = new Color4(1.0, 1.0, 1.0, 1.0);
        this._shadowMap.onClearObservable.add((engine) => {
            if (this._filter === ShadowGenerator.FILTER_PCF) {
                engine.clear(clearOne, false, true, false);
            } else if (this.useExponentialShadowMap || this.useBlurExponentialShadowMap) {
                engine.clear(clearZero, true, true, false);
            } else {
                engine.clear(clearOne, true, true, false);
            }
        });

        // Recreate on resize.
        this._shadowMap.onResizeObservable.add((rtt) => {
            this._storedUniqueId = this._shadowMap!.uniqueId;
            this._mapSize = rtt.getRenderSize();
            this._light._markMeshesAsLightDirty();
            this.recreateShadowMap();
        });

        // Ensures rendering groupids do not erase the depth buffer
        // or we would lose the shadows information.
        for (let i = RenderingManager.MIN_RENDERINGGROUPS; i < RenderingManager.MAX_RENDERINGGROUPS; i++) {
            this._shadowMap.setRenderingAutoClearDepthStencil(i, false);
        }
    }

    protected _initializeBlurRTTAndPostProcesses(): void {
        const engine = this._scene.getEngine();
        const targetSize = this._mapSize / this.blurScale;

        if (!this.useKernelBlur || this.blurScale !== 1.0) {
            this._shadowMap2 = new RenderTargetTexture(this._light.name + "_shadowMap2", targetSize, this._scene, false, true, this._textureType, undefined, undefined, false);
            this._shadowMap2.wrapU = Texture.CLAMP_ADDRESSMODE;
            this._shadowMap2.wrapV = Texture.CLAMP_ADDRESSMODE;
            this._shadowMap2.updateSamplingMode(Texture.BILINEAR_SAMPLINGMODE);
        }

        if (this.useKernelBlur) {
            this._kernelBlurXPostprocess = new BlurPostProcess(
                this._light.name + "KernelBlurX",
                new Vector2(1, 0),
                this.blurKernel,
                1.0,
                null,
                Texture.BILINEAR_SAMPLINGMODE,
                engine,
                false,
                this._textureType
            );
            this._kernelBlurXPostprocess.width = targetSize;
            this._kernelBlurXPostprocess.height = targetSize;
            this._kernelBlurXPostprocess.externalTextureSamplerBinding = true;
            this._kernelBlurXPostprocess.onApplyObservable.add((effect) => {
                effect.setTexture("textureSampler", this._shadowMap);
            });

            this._kernelBlurYPostprocess = new BlurPostProcess(
                this._light.name + "KernelBlurY",
                new Vector2(0, 1),
                this.blurKernel,
                1.0,
                null,
                Texture.BILINEAR_SAMPLINGMODE,
                engine,
                false,
                this._textureType
            );

            this._kernelBlurXPostprocess.autoClear = false;
            this._kernelBlurYPostprocess.autoClear = false;

            if (this._textureType === Constants.TEXTURETYPE_UNSIGNED_INT) {
                (<BlurPostProcess>this._kernelBlurXPostprocess).packedFloat = true;
                (<BlurPostProcess>this._kernelBlurYPostprocess).packedFloat = true;
            }

            this._blurPostProcesses = [this._kernelBlurXPostprocess, this._kernelBlurYPostprocess];
        } else {
            this._boxBlurPostprocess = new PostProcess(
                this._light.name + "DepthBoxBlur",
                "depthBoxBlur",
                ["screenSize", "boxOffset"],
                [],
                1.0,
                null,
                Texture.BILINEAR_SAMPLINGMODE,
                engine,
                false,
                "#define OFFSET " + this._blurBoxOffset,
                this._textureType
            );
            this._boxBlurPostprocess.externalTextureSamplerBinding = true;
            this._boxBlurPostprocess.onApplyObservable.add((effect) => {
                effect.setFloat2("screenSize", targetSize, targetSize);
                effect.setTexture("textureSampler", this._shadowMap);
            });

            this._boxBlurPostprocess.autoClear = false;

            this._blurPostProcesses = [this._boxBlurPostprocess];
        }
    }

    protected _renderForShadowMap(
        opaqueSubMeshes: SmartArray<SubMesh>,
        alphaTestSubMeshes: SmartArray<SubMesh>,
        transparentSubMeshes: SmartArray<SubMesh>,
        depthOnlySubMeshes: SmartArray<SubMesh>
    ): void {
        let index: number;

        if (depthOnlySubMeshes.length) {
            for (index = 0; index < depthOnlySubMeshes.length; index++) {
                this._renderSubMeshForShadowMap(depthOnlySubMeshes.data[index]);
            }
        }

        for (index = 0; index < opaqueSubMeshes.length; index++) {
            this._renderSubMeshForShadowMap(opaqueSubMeshes.data[index]);
        }

        for (index = 0; index < alphaTestSubMeshes.length; index++) {
            this._renderSubMeshForShadowMap(alphaTestSubMeshes.data[index]);
        }

        if (this._transparencyShadow) {
            for (index = 0; index < transparentSubMeshes.length; index++) {
                this._renderSubMeshForShadowMap(transparentSubMeshes.data[index], true);
            }
        } else {
            for (index = 0; index < transparentSubMeshes.length; index++) {
                transparentSubMeshes.data[index].getEffectiveMesh()._internalAbstractMeshDataInfo._isActiveIntermediate = false;
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected _bindCustomEffectForRenderSubMeshForShadowMap(subMesh: SubMesh, effect: Effect, mesh: AbstractMesh): void {
        effect.setMatrix("viewProjection", this.getTransformMatrix());
    }

    protected _renderSubMeshForShadowMap(subMesh: SubMesh, isTransparent: boolean = false): void {
        const renderingMesh = subMesh.getRenderingMesh();
        const effectiveMesh = subMesh.getEffectiveMesh();
        const scene = this._scene;
        const engine = scene.getEngine();
        const material = subMesh.getMaterial();

        effectiveMesh._internalAbstractMeshDataInfo._isActiveIntermediate = false;

        if (!material || subMesh.verticesCount === 0 || subMesh._renderId === scene.getRenderId()) {
            return;
        }

        // Culling
        const detNeg = effectiveMesh._getWorldMatrixDeterminant() < 0;
        let sideOrientation = renderingMesh.overrideMaterialSideOrientation ?? material.sideOrientation;
        if (detNeg) {
            sideOrientation =
                sideOrientation === Constants.MATERIAL_ClockWiseSideOrientation ? Constants.MATERIAL_CounterClockWiseSideOrientation : Constants.MATERIAL_ClockWiseSideOrientation;
        }
        const reverseSideOrientation = sideOrientation === Constants.MATERIAL_ClockWiseSideOrientation;

        engine.setState(material.backFaceCulling, undefined, undefined, reverseSideOrientation, material.cullBackFaces);

        // Managing instances
        const batch = renderingMesh._getInstancesRenderList(subMesh._id, !!subMesh.getReplacementMesh());
        if (batch.mustReturn) {
            return;
        }

        const hardwareInstancedRendering =
            engine.getCaps().instancedArrays &&
            ((batch.visibleInstances[subMesh._id] !== null && batch.visibleInstances[subMesh._id] !== undefined) || renderingMesh.hasThinInstances);

        if (this.customAllowRendering && !this.customAllowRendering(subMesh)) {
            return;
        }

        if (this.isReady(subMesh, hardwareInstancedRendering, isTransparent)) {
            subMesh._renderId = scene.getRenderId();

            const shadowDepthWrapper = material.shadowDepthWrapper;

            const drawWrapper = shadowDepthWrapper?.getEffect(subMesh, this, engine.currentRenderPassId) ?? subMesh._getDrawWrapper()!;
            const effect = DrawWrapper.GetEffect(drawWrapper)!;

            engine.enableEffect(drawWrapper);

            if (!hardwareInstancedRendering) {
                renderingMesh._bind(subMesh, effect, material.fillMode);
            }

            this.getTransformMatrix(); // make sure _cachedDirection et _cachedPosition are up to date

            effect.setFloat3("biasAndScaleSM", this.bias, this.normalBias, this.depthScale);

            if (this.getLight().getTypeID() === Light.LIGHTTYPEID_DIRECTIONALLIGHT) {
                effect.setVector3("lightDataSM", this._cachedDirection);
            } else {
                effect.setVector3("lightDataSM", this._cachedPosition);
            }

            const camera = this._getCamera();
            if (camera) {
                effect.setFloat2("depthValuesSM", this.getLight().getDepthMinZ(camera), this.getLight().getDepthMinZ(camera) + this.getLight().getDepthMaxZ(camera));
            }

            if (isTransparent && this.enableSoftTransparentShadow) {
                effect.setFloat("softTransparentShadowSM", effectiveMesh.visibility * material.alpha);
            }

            if (shadowDepthWrapper) {
                subMesh._setMainDrawWrapperOverride(drawWrapper);
                if (shadowDepthWrapper.standalone) {
                    shadowDepthWrapper.baseMaterial.bindForSubMesh(effectiveMesh.getWorldMatrix(), renderingMesh, subMesh);
                } else {
                    material.bindForSubMesh(effectiveMesh.getWorldMatrix(), renderingMesh, subMesh);
                }
                subMesh._setMainDrawWrapperOverride(null);
            } else {
                // Alpha test
                if (this._opacityTexture) {
                    effect.setTexture("diffuseSampler", this._opacityTexture);
                    effect.setMatrix("diffuseMatrix", this._opacityTexture.getTextureMatrix() || this._defaultTextureMatrix);
                }

                // Bones
                if (renderingMesh.useBones && renderingMesh.computeBonesUsingShaders && renderingMesh.skeleton) {
                    const skeleton = renderingMesh.skeleton;

                    if (skeleton.isUsingTextureForMatrices) {
                        const boneTexture = skeleton.getTransformMatrixTexture(renderingMesh);

                        if (!boneTexture) {
                            return;
                        }

                        effect.setTexture("boneSampler", boneTexture);
                        effect.setFloat("boneTextureWidth", 4.0 * (skeleton.bones.length + 1));
                    } else {
                        effect.setMatrices("mBones", skeleton.getTransformMatrices(renderingMesh));
                    }
                }

                // Morph targets
                BindMorphTargetParameters(renderingMesh, effect);

                if (renderingMesh.morphTargetManager && renderingMesh.morphTargetManager.isUsingTextureForTargets) {
                    renderingMesh.morphTargetManager._bind(effect);
                }

                // Baked vertex animations
                const bvaManager = (<Mesh>subMesh.getMesh()).bakedVertexAnimationManager;
                if (hardwareInstancedRendering && bvaManager && bvaManager.isEnabled) {
                    bvaManager.bind(effect, true);
                }

                // Clip planes
                bindClipPlane(effect, material, scene);
            }

            if (!this._useUBO && !shadowDepthWrapper) {
                this._bindCustomEffectForRenderSubMeshForShadowMap(subMesh, effect, effectiveMesh);
            }

            BindSceneUniformBuffer(effect, this._scene.getSceneUniformBuffer());
            this._scene.getSceneUniformBuffer().bindUniformBuffer();

            const world = effectiveMesh.getWorldMatrix();

            // In the non hardware instanced mode, the Mesh ubo update is done by the callback passed to renderingMesh._processRendering (see below)
            if (hardwareInstancedRendering) {
                effectiveMesh.getMeshUniformBuffer().bindToEffect(effect, "Mesh");
                effectiveMesh.transferToEffect(world);
            }

            if (this.forceBackFacesOnly) {
                engine.setState(true, 0, false, true, material.cullBackFaces);
            }

            // Observables
            this.onBeforeShadowMapRenderMeshObservable.notifyObservers(renderingMesh);
            this.onBeforeShadowMapRenderObservable.notifyObservers(effect);

            // Draw
            renderingMesh._processRendering(effectiveMesh, subMesh, effect, material.fillMode, batch, hardwareInstancedRendering, (isInstance, worldOverride) => {
                if (effectiveMesh !== renderingMesh && !isInstance) {
                    renderingMesh.getMeshUniformBuffer().bindToEffect(effect, "Mesh");
                    renderingMesh.transferToEffect(worldOverride);
                } else {
                    effectiveMesh.getMeshUniformBuffer().bindToEffect(effect, "Mesh");
                    effectiveMesh.transferToEffect(isInstance ? worldOverride : world);
                }
            });

            if (this.forceBackFacesOnly) {
                engine.setState(true, 0, false, false, material.cullBackFaces);
            }

            // Observables
            this.onAfterShadowMapRenderObservable.notifyObservers(effect);
            this.onAfterShadowMapRenderMeshObservable.notifyObservers(renderingMesh);
        } else {
            // Need to reset refresh rate of the shadowMap
            if (this._shadowMap) {
                this._shadowMap.resetRefreshCounter();
            }
        }
    }

    protected _applyFilterValues(): void {
        if (!this._shadowMap) {
            return;
        }

        if (this.filter === ShadowGenerator.FILTER_NONE || this.filter === ShadowGenerator.FILTER_PCSS) {
            this._shadowMap.updateSamplingMode(Texture.NEAREST_SAMPLINGMODE);
        } else {
            this._shadowMap.updateSamplingMode(Texture.BILINEAR_SAMPLINGMODE);
        }
    }

    /**
     * Forces all the attached effect to compile to enable rendering only once ready vs. lazily compiling effects.
     * @param onCompiled Callback triggered at the and of the effects compilation
     * @param options Sets of optional options forcing the compilation with different modes
     */
    public forceCompilation(onCompiled?: (generator: IShadowGenerator) => void, options?: Partial<{ useInstances: boolean }>): void {
        const localOptions = {
            useInstances: false,
            ...options,
        };

        const shadowMap = this.getShadowMap();
        if (!shadowMap) {
            if (onCompiled) {
                onCompiled(this);
            }
            return;
        }

        const renderList = shadowMap.renderList;
        if (!renderList) {
            if (onCompiled) {
                onCompiled(this);
            }
            return;
        }

        const subMeshes: SubMesh[] = [];
        for (const mesh of renderList) {
            subMeshes.push(...mesh.subMeshes);
        }
        if (subMeshes.length === 0) {
            if (onCompiled) {
                onCompiled(this);
            }
            return;
        }

        let currentIndex = 0;

        const checkReady = () => {
            if (!this._scene || !this._scene.getEngine()) {
                return;
            }

            while (
                this.isReady(
                    subMeshes[currentIndex],
                    localOptions.useInstances,
                    subMeshes[currentIndex].getMaterial()?.needAlphaBlendingForMesh(subMeshes[currentIndex].getMesh()) ?? false
                )
            ) {
                currentIndex++;
                if (currentIndex >= subMeshes.length) {
                    if (onCompiled) {
                        onCompiled(this);
                    }
                    return;
                }
            }
            setTimeout(checkReady, 16);
        };

        checkReady();
    }

    /**
     * Forces all the attached effect to compile to enable rendering only once ready vs. lazily compiling effects.
     * @param options Sets of optional options forcing the compilation with different modes
     * @returns A promise that resolves when the compilation completes
     */
    public forceCompilationAsync(options?: Partial<{ useInstances: boolean }>): Promise<void> {
        return new Promise((resolve) => {
            this.forceCompilation(() => {
                resolve();
            }, options);
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected _isReadyCustomDefines(defines: any, subMesh: SubMesh, useInstances: boolean): void {}

    private _prepareShadowDefines(subMesh: SubMesh, useInstances: boolean, defines: string[], isTransparent: boolean): string[] {
        defines.push("#define SM_LIGHTTYPE_" + this._light.getClassName().toUpperCase());

        defines.push("#define SM_FLOAT " + (this._textureType !== Constants.TEXTURETYPE_UNSIGNED_INT ? "1" : "0"));

        defines.push("#define SM_ESM " + (this.useExponentialShadowMap || this.useBlurExponentialShadowMap ? "1" : "0"));

        defines.push("#define SM_DEPTHTEXTURE " + (this.usePercentageCloserFiltering || this.useContactHardeningShadow ? "1" : "0"));

        const mesh = subMesh.getMesh();

        // Normal bias.
        defines.push("#define SM_NORMALBIAS " + (this.normalBias && mesh.isVerticesDataPresent(VertexBuffer.NormalKind) ? "1" : "0"));
        defines.push("#define SM_DIRECTIONINLIGHTDATA " + (this.getLight().getTypeID() === Light.LIGHTTYPEID_DIRECTIONALLIGHT ? "1" : "0"));

        // Point light
        defines.push("#define SM_USEDISTANCE " + (this._light.needCube() ? "1" : "0"));

        // Soft transparent shadows
        defines.push("#define SM_SOFTTRANSPARENTSHADOW " + (this.enableSoftTransparentShadow && isTransparent ? "1" : "0"));

        this._isReadyCustomDefines(defines, subMesh, useInstances);

        return defines;
    }

    /**
     * Determine whether the shadow generator is ready or not (mainly all effects and related post processes needs to be ready).
     * @param subMesh The submesh we want to render in the shadow map
     * @param useInstances Defines whether will draw in the map using instances
     * @param isTransparent Indicates that isReady is called for a transparent subMesh
     * @returns true if ready otherwise, false
     */
    public isReady(subMesh: SubMesh, useInstances: boolean, isTransparent: boolean): boolean {
        const material = subMesh.getMaterial(),
            shadowDepthWrapper = material?.shadowDepthWrapper;

        this._opacityTexture = null;

        if (!material) {
            return false;
        }

        const defines: string[] = [];

        this._prepareShadowDefines(subMesh, useInstances, defines, isTransparent);

        if (shadowDepthWrapper) {
            if (!shadowDepthWrapper.isReadyForSubMesh(subMesh, defines, this, useInstances, this._scene.getEngine().currentRenderPassId)) {
                return false;
            }
        } else {
            const subMeshEffect = subMesh._getDrawWrapper(undefined, true)!;

            let effect = subMeshEffect.effect!;
            let cachedDefines = subMeshEffect.defines;

            const attribs = [VertexBuffer.PositionKind];

            const mesh = subMesh.getMesh();

            // Normal bias.
            if (this.normalBias && mesh.isVerticesDataPresent(VertexBuffer.NormalKind)) {
                attribs.push(VertexBuffer.NormalKind);
                defines.push("#define NORMAL");
                if (mesh.nonUniformScaling) {
                    defines.push("#define NONUNIFORMSCALING");
                }
            }

            // Alpha test
            const needAlphaTesting = material.needAlphaTesting();

            if (needAlphaTesting || material.needAlphaBlending()) {
                if (this.useOpacityTextureForTransparentShadow) {
                    this._opacityTexture = (material as any).opacityTexture;
                } else {
                    this._opacityTexture = material.getAlphaTestTexture();
                }
                if (this._opacityTexture) {
                    if (!this._opacityTexture.isReady()) {
                        return false;
                    }

                    const alphaCutOff = (material as any).alphaCutOff ?? ShadowGenerator.DEFAULT_ALPHA_CUTOFF;

                    defines.push("#define ALPHATEXTURE");
                    if (needAlphaTesting) {
                        defines.push(`#define ALPHATESTVALUE ${alphaCutOff}${alphaCutOff % 1 === 0 ? "." : ""}`);
                    }
                    if (mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
                        attribs.push(VertexBuffer.UVKind);
                        defines.push("#define UV1");
                    }
                    if (mesh.isVerticesDataPresent(VertexBuffer.UV2Kind)) {
                        if (this._opacityTexture.coordinatesIndex === 1) {
                            attribs.push(VertexBuffer.UV2Kind);
                            defines.push("#define UV2");
                        }
                    }
                }
            }

            // Bones
            const fallbacks = new EffectFallbacks();
            if (mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
                attribs.push(VertexBuffer.MatricesIndicesKind);
                attribs.push(VertexBuffer.MatricesWeightsKind);
                if (mesh.numBoneInfluencers > 4) {
                    attribs.push(VertexBuffer.MatricesIndicesExtraKind);
                    attribs.push(VertexBuffer.MatricesWeightsExtraKind);
                }
                const skeleton = mesh.skeleton;
                defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
                if (mesh.numBoneInfluencers > 0) {
                    fallbacks.addCPUSkinningFallback(0, mesh);
                }

                if (skeleton.isUsingTextureForMatrices) {
                    defines.push("#define BONETEXTURE");
                } else {
                    defines.push("#define BonesPerMesh " + (skeleton.bones.length + 1));
                }
            } else {
                defines.push("#define NUM_BONE_INFLUENCERS 0");
            }

            // Morph targets
            const manager = (<Mesh>mesh).morphTargetManager;
            let morphInfluencers = 0;
            if (manager) {
                morphInfluencers = manager.numMaxInfluencers || manager.numInfluencers;
                if (morphInfluencers > 0) {
                    defines.push("#define MORPHTARGETS");
                    defines.push("#define NUM_MORPH_INFLUENCERS " + morphInfluencers);
                    if (manager.isUsingTextureForTargets) {
                        defines.push("#define MORPHTARGETS_TEXTURE");
                    }
                    PrepareAttributesForMorphTargetsInfluencers(attribs, mesh, morphInfluencers);
                }
            }

            // ClipPlanes
            prepareStringDefinesForClipPlanes(material, this._scene, defines);

            // Instances
            if (useInstances) {
                defines.push("#define INSTANCES");
                PushAttributesForInstances(attribs);
                if (subMesh.getRenderingMesh().hasThinInstances) {
                    defines.push("#define THIN_INSTANCES");
                }
            }

            if (this.customShaderOptions) {
                if (this.customShaderOptions.defines) {
                    for (const define of this.customShaderOptions.defines) {
                        if (defines.indexOf(define) === -1) {
                            defines.push(define);
                        }
                    }
                }
            }

            // Baked vertex animations
            const bvaManager = (<Mesh>mesh).bakedVertexAnimationManager;
            if (useInstances && bvaManager && bvaManager.isEnabled) {
                defines.push("#define BAKED_VERTEX_ANIMATION_TEXTURE");
                attribs.push("bakedVertexAnimationSettingsInstanced");
            }

            // Get correct effect
            const join = defines.join("\n");
            if (cachedDefines !== join) {
                cachedDefines = join;

                let shaderName = "shadowMap";
                const uniforms = [
                    "world",
                    "mBones",
                    "viewProjection",
                    "diffuseMatrix",
                    "lightDataSM",
                    "depthValuesSM",
                    "biasAndScaleSM",
                    "morphTargetInfluences",
                    "morphTargetCount",
                    "boneTextureWidth",
                    "softTransparentShadowSM",
                    "morphTargetTextureInfo",
                    "morphTargetTextureIndices",
                    "bakedVertexAnimationSettings",
                    "bakedVertexAnimationTextureSizeInverted",
                    "bakedVertexAnimationTime",
                    "bakedVertexAnimationTexture",
                ];
                const samplers = ["diffuseSampler", "boneSampler", "morphTargets", "bakedVertexAnimationTexture"];
                const uniformBuffers = ["Scene", "Mesh"];

                addClipPlaneUniforms(uniforms);

                // Custom shader?
                if (this.customShaderOptions) {
                    shaderName = this.customShaderOptions.shaderName;

                    if (this.customShaderOptions.attributes) {
                        for (const attrib of this.customShaderOptions.attributes) {
                            if (attribs.indexOf(attrib) === -1) {
                                attribs.push(attrib);
                            }
                        }
                    }

                    if (this.customShaderOptions.uniforms) {
                        for (const uniform of this.customShaderOptions.uniforms) {
                            if (uniforms.indexOf(uniform) === -1) {
                                uniforms.push(uniform);
                            }
                        }
                    }

                    if (this.customShaderOptions.samplers) {
                        for (const sampler of this.customShaderOptions.samplers) {
                            if (samplers.indexOf(sampler) === -1) {
                                samplers.push(sampler);
                            }
                        }
                    }
                }

                const engine = this._scene.getEngine();

                effect = engine.createEffect(
                    shaderName,
                    <IEffectCreationOptions>{
                        attributes: attribs,
                        uniformsNames: uniforms,
                        uniformBuffersNames: uniformBuffers,
                        samplers: samplers,
                        defines: join,
                        fallbacks: fallbacks,
                        onCompiled: null,
                        onError: null,
                        indexParameters: { maxSimultaneousMorphTargets: morphInfluencers },
                    },
                    engine
                );

                subMeshEffect.setEffect(effect, cachedDefines);
            }

            if (!effect.isReady()) {
                return false;
            }
        }

        if (this.useBlurExponentialShadowMap || this.useBlurCloseExponentialShadowMap) {
            if (!this._blurPostProcesses || !this._blurPostProcesses.length) {
                this._initializeBlurRTTAndPostProcesses();
            }
        }

        if (this._kernelBlurXPostprocess && !this._kernelBlurXPostprocess.isReady()) {
            return false;
        }
        if (this._kernelBlurYPostprocess && !this._kernelBlurYPostprocess.isReady()) {
            return false;
        }
        if (this._boxBlurPostprocess && !this._boxBlurPostprocess.isReady()) {
            return false;
        }

        return true;
    }

    /**
     * Prepare all the defines in a material relying on a shadow map at the specified light index.
     * @param defines Defines of the material we want to update
     * @param lightIndex Index of the light in the enabled light list of the material
     */
    public prepareDefines(defines: any, lightIndex: number): void {
        const scene = this._scene;
        const light = this._light;

        if (!scene.shadowsEnabled || !light.shadowEnabled) {
            return;
        }

        defines["SHADOW" + lightIndex] = true;

        if (this.useContactHardeningShadow) {
            defines["SHADOWPCSS" + lightIndex] = true;
            if (this._filteringQuality === ShadowGenerator.QUALITY_LOW) {
                defines["SHADOWLOWQUALITY" + lightIndex] = true;
            } else if (this._filteringQuality === ShadowGenerator.QUALITY_MEDIUM) {
                defines["SHADOWMEDIUMQUALITY" + lightIndex] = true;
            }
            // else default to high.
        } else if (this.usePercentageCloserFiltering) {
            defines["SHADOWPCF" + lightIndex] = true;
            if (this._filteringQuality === ShadowGenerator.QUALITY_LOW) {
                defines["SHADOWLOWQUALITY" + lightIndex] = true;
            } else if (this._filteringQuality === ShadowGenerator.QUALITY_MEDIUM) {
                defines["SHADOWMEDIUMQUALITY" + lightIndex] = true;
            }
            // else default to high.
        } else if (this.usePoissonSampling) {
            defines["SHADOWPOISSON" + lightIndex] = true;
        } else if (this.useExponentialShadowMap || this.useBlurExponentialShadowMap) {
            defines["SHADOWESM" + lightIndex] = true;
        } else if (this.useCloseExponentialShadowMap || this.useBlurCloseExponentialShadowMap) {
            defines["SHADOWCLOSEESM" + lightIndex] = true;
        }

        if (light.needCube()) {
            defines["SHADOWCUBE" + lightIndex] = true;
        }
    }

    /**
     * Binds the shadow related information inside of an effect (information like near, far, darkness...
     * defined in the generator but impacting the effect).
     * @param lightIndex Index of the light in the enabled light list of the material owning the effect
     * @param effect The effect we are binding the information for
     */
    public bindShadowLight(lightIndex: string, effect: Effect): void {
        const light = this._light;
        const scene = this._scene;

        if (!scene.shadowsEnabled || !light.shadowEnabled) {
            return;
        }

        const camera = this._getCamera();
        if (!camera) {
            return;
        }

        const shadowMap = this.getShadowMap();

        if (!shadowMap) {
            return;
        }

        if (!light.needCube()) {
            effect.setMatrix("lightMatrix" + lightIndex, this.getTransformMatrix());
        }

        // Only PCF uses depth stencil texture.
        if (this._filter === ShadowGenerator.FILTER_PCF) {
            effect.setDepthStencilTexture("shadowSampler" + lightIndex, this.getShadowMapForRendering());
            light._uniformBuffer.updateFloat4("shadowsInfo", this.getDarkness(), shadowMap.getSize().width, 1 / shadowMap.getSize().width, this.frustumEdgeFalloff, lightIndex);
        } else if (this._filter === ShadowGenerator.FILTER_PCSS) {
            effect.setDepthStencilTexture("shadowSampler" + lightIndex, this.getShadowMapForRendering());
            effect.setTexture("depthSampler" + lightIndex, this.getShadowMapForRendering());
            light._uniformBuffer.updateFloat4(
                "shadowsInfo",
                this.getDarkness(),
                1 / shadowMap.getSize().width,
                this._contactHardeningLightSizeUVRatio * shadowMap.getSize().width,
                this.frustumEdgeFalloff,
                lightIndex
            );
        } else {
            effect.setTexture("shadowSampler" + lightIndex, this.getShadowMapForRendering());
            light._uniformBuffer.updateFloat4("shadowsInfo", this.getDarkness(), this.blurScale / shadowMap.getSize().width, this.depthScale, this.frustumEdgeFalloff, lightIndex);
        }

        light._uniformBuffer.updateFloat2(
            "depthValues",
            this.getLight().getDepthMinZ(camera),
            this.getLight().getDepthMinZ(camera) + this.getLight().getDepthMaxZ(camera),
            lightIndex
        );
    }

    /**
     * Gets the view matrix used to render the shadow map.
     */
    public get viewMatrix() {
        return this._viewMatrix;
    }

    /**
     * Gets the projection matrix used to render the shadow map.
     */
    public get projectionMatrix() {
        return this._projectionMatrix;
    }

    /**
     * Gets the transformation matrix used to project the meshes into the map from the light point of view.
     * (eq to shadow projection matrix * light transform matrix)
     * @returns The transform matrix used to create the shadow map
     */
    public getTransformMatrix(): Matrix {
        const scene = this._scene;
        if (this._currentRenderId === scene.getRenderId() && this._currentFaceIndexCache === this._currentFaceIndex) {
            return this._transformMatrix;
        }

        this._currentRenderId = scene.getRenderId();
        this._currentFaceIndexCache = this._currentFaceIndex;

        let lightPosition = this._light.position;
        if (this._light.computeTransformedInformation()) {
            lightPosition = this._light.transformedPosition;
        }

        Vector3.NormalizeToRef(this._light.getShadowDirection(this._currentFaceIndex), this._lightDirection);
        if (Math.abs(Vector3.Dot(this._lightDirection, Vector3.Up())) === 1.0) {
            this._lightDirection.z = 0.0000000000001; // Required to avoid perfectly perpendicular light
        }

        if (
            this._light.needProjectionMatrixCompute() ||
            !this._cachedPosition ||
            !this._cachedDirection ||
            !lightPosition.equals(this._cachedPosition) ||
            !this._lightDirection.equals(this._cachedDirection)
        ) {
            this._cachedPosition.copyFrom(lightPosition);
            this._cachedDirection.copyFrom(this._lightDirection);

            Matrix.LookAtLHToRef(lightPosition, lightPosition.add(this._lightDirection), Vector3.Up(), this._viewMatrix);

            const shadowMap = this.getShadowMap();

            if (shadowMap) {
                const renderList = shadowMap.renderList;

                if (renderList) {
                    this._light.setShadowProjectionMatrix(this._projectionMatrix, this._viewMatrix, renderList);
                }
            }

            this._viewMatrix.multiplyToRef(this._projectionMatrix, this._transformMatrix);
        }

        return this._transformMatrix;
    }

    /**
     * Recreates the shadow map dependencies like RTT and post processes. This can be used during the switch between
     * Cube and 2D textures for instance.
     */
    public recreateShadowMap(): void {
        const shadowMap = this._shadowMap;
        if (!shadowMap) {
            return;
        }

        // Track render list.
        const renderList = shadowMap.renderList;
        // Clean up existing data.
        this._disposeRTTandPostProcesses();
        // Reinitializes.
        this._initializeGenerator();
        // Reaffect the filter to ensure a correct fallback if necessary.
        this.filter = this._filter;
        // Reaffect the filter.
        this._applyFilterValues();
        // Reaffect Render List.
        if (renderList) {
            // Note: don't do this._shadowMap!.renderList = renderList;
            // The renderList hooked array is accessing the old RenderTargetTexture (see RenderTargetTexture._hookArray), which is disposed at this point (by the call to _disposeRTTandPostProcesses)
            if (!this._shadowMap!.renderList) {
                this._shadowMap!.renderList = [];
            }
            for (const mesh of renderList) {
                this._shadowMap!.renderList.push(mesh);
            }
        } else {
            this._shadowMap!.renderList = null;
        }
    }

    protected _disposeBlurPostProcesses(): void {
        if (this._shadowMap2) {
            this._shadowMap2.dispose();
            this._shadowMap2 = null;
        }

        if (this._boxBlurPostprocess) {
            this._boxBlurPostprocess.dispose();
            this._boxBlurPostprocess = null;
        }

        if (this._kernelBlurXPostprocess) {
            this._kernelBlurXPostprocess.dispose();
            this._kernelBlurXPostprocess = null;
        }

        if (this._kernelBlurYPostprocess) {
            this._kernelBlurYPostprocess.dispose();
            this._kernelBlurYPostprocess = null;
        }

        this._blurPostProcesses = [];
    }

    protected _disposeRTTandPostProcesses(): void {
        if (this._shadowMap) {
            this._shadowMap.dispose();
            this._shadowMap = null;
        }

        this._disposeBlurPostProcesses();
    }

    protected _disposeSceneUBOs(): void {
        if (this._sceneUBOs) {
            for (const ubo of this._sceneUBOs) {
                ubo.dispose();
            }
            this._sceneUBOs = [];
        }
    }

    /**
     * Disposes the ShadowGenerator.
     * Returns nothing.
     */
    public dispose(): void {
        this._disposeRTTandPostProcesses();

        this._disposeSceneUBOs();

        if (this._light) {
            if (this._light._shadowGenerators) {
                const iterator = this._light._shadowGenerators.entries();
                for (let entry = iterator.next(); entry.done !== true; entry = iterator.next()) {
                    const [camera, shadowGenerator] = entry.value;
                    if (shadowGenerator === this) {
                        this._light._shadowGenerators.delete(camera);
                    }
                }
                if (this._light._shadowGenerators.size === 0) {
                    this._light._shadowGenerators = null;
                }
            }
            this._light._markMeshesAsLightDirty();
        }

        this.onBeforeShadowMapRenderMeshObservable.clear();
        this.onBeforeShadowMapRenderObservable.clear();
        this.onAfterShadowMapRenderMeshObservable.clear();
        this.onAfterShadowMapRenderObservable.clear();
    }

    /**
     * Serializes the shadow generator setup to a json object.
     * @returns The serialized JSON object
     */
    public serialize(): any {
        const serializationObject: any = {};
        const shadowMap = this.getShadowMap();

        if (!shadowMap) {
            return serializationObject;
        }

        serializationObject.className = this.getClassName();
        serializationObject.lightId = this._light.id;
        serializationObject.cameraId = this._camera?.id;
        serializationObject.id = this.id;
        serializationObject.mapSize = shadowMap.getRenderSize();
        serializationObject.forceBackFacesOnly = this.forceBackFacesOnly;
        serializationObject.darkness = this.getDarkness();
        serializationObject.transparencyShadow = this._transparencyShadow;
        serializationObject.frustumEdgeFalloff = this.frustumEdgeFalloff;
        serializationObject.bias = this.bias;
        serializationObject.normalBias = this.normalBias;
        serializationObject.usePercentageCloserFiltering = this.usePercentageCloserFiltering;
        serializationObject.useContactHardeningShadow = this.useContactHardeningShadow;
        serializationObject.contactHardeningLightSizeUVRatio = this.contactHardeningLightSizeUVRatio;
        serializationObject.filteringQuality = this.filteringQuality;
        serializationObject.useExponentialShadowMap = this.useExponentialShadowMap;
        serializationObject.useBlurExponentialShadowMap = this.useBlurExponentialShadowMap;
        serializationObject.useCloseExponentialShadowMap = this.useBlurExponentialShadowMap;
        serializationObject.useBlurCloseExponentialShadowMap = this.useBlurExponentialShadowMap;
        serializationObject.usePoissonSampling = this.usePoissonSampling;
        serializationObject.depthScale = this.depthScale;
        serializationObject.blurBoxOffset = this.blurBoxOffset;
        serializationObject.blurKernel = this.blurKernel;
        serializationObject.blurScale = this.blurScale;
        serializationObject.useKernelBlur = this.useKernelBlur;

        serializationObject.renderList = [];
        if (shadowMap.renderList) {
            for (let meshIndex = 0; meshIndex < shadowMap.renderList.length; meshIndex++) {
                const mesh = shadowMap.renderList[meshIndex];

                serializationObject.renderList.push(mesh.id);
            }
        }

        return serializationObject;
    }

    /**
     * Parses a serialized ShadowGenerator and returns a new ShadowGenerator.
     * @param parsedShadowGenerator The JSON object to parse
     * @param scene The scene to create the shadow map for
     * @param constr A function that builds a shadow generator or undefined to create an instance of the default shadow generator
     * @returns The parsed shadow generator
     */
    public static Parse(parsedShadowGenerator: any, scene: Scene, constr?: (mapSize: number, light: IShadowLight, camera: Nullable<Camera>) => ShadowGenerator): ShadowGenerator {
        const light = <IShadowLight>scene.getLightById(parsedShadowGenerator.lightId);
        const camera: Nullable<Camera> = parsedShadowGenerator.cameraId !== undefined ? scene.getCameraById(parsedShadowGenerator.cameraId) : null;
        const shadowGenerator = constr ? constr(parsedShadowGenerator.mapSize, light, camera) : new ShadowGenerator(parsedShadowGenerator.mapSize, light, undefined, camera);
        const shadowMap = shadowGenerator.getShadowMap();

        for (let meshIndex = 0; meshIndex < parsedShadowGenerator.renderList.length; meshIndex++) {
            const meshes = scene.getMeshesById(parsedShadowGenerator.renderList[meshIndex]);
            meshes.forEach(function (mesh) {
                if (!shadowMap) {
                    return;
                }
                if (!shadowMap.renderList) {
                    shadowMap.renderList = [];
                }
                shadowMap.renderList.push(mesh);
            });
        }

        if (parsedShadowGenerator.id !== undefined) {
            shadowGenerator.id = parsedShadowGenerator.id;
        }

        shadowGenerator.forceBackFacesOnly = !!parsedShadowGenerator.forceBackFacesOnly;

        if (parsedShadowGenerator.darkness !== undefined) {
            shadowGenerator.setDarkness(parsedShadowGenerator.darkness);
        }

        if (parsedShadowGenerator.transparencyShadow) {
            shadowGenerator.setTransparencyShadow(true);
        }

        if (parsedShadowGenerator.frustumEdgeFalloff !== undefined) {
            shadowGenerator.frustumEdgeFalloff = parsedShadowGenerator.frustumEdgeFalloff;
        }

        if (parsedShadowGenerator.bias !== undefined) {
            shadowGenerator.bias = parsedShadowGenerator.bias;
        }

        if (parsedShadowGenerator.normalBias !== undefined) {
            shadowGenerator.normalBias = parsedShadowGenerator.normalBias;
        }

        if (parsedShadowGenerator.usePercentageCloserFiltering) {
            shadowGenerator.usePercentageCloserFiltering = true;
        } else if (parsedShadowGenerator.useContactHardeningShadow) {
            shadowGenerator.useContactHardeningShadow = true;
        } else if (parsedShadowGenerator.usePoissonSampling) {
            shadowGenerator.usePoissonSampling = true;
        } else if (parsedShadowGenerator.useExponentialShadowMap) {
            shadowGenerator.useExponentialShadowMap = true;
        } else if (parsedShadowGenerator.useBlurExponentialShadowMap) {
            shadowGenerator.useBlurExponentialShadowMap = true;
        } else if (parsedShadowGenerator.useCloseExponentialShadowMap) {
            shadowGenerator.useCloseExponentialShadowMap = true;
        } else if (parsedShadowGenerator.useBlurCloseExponentialShadowMap) {
            shadowGenerator.useBlurCloseExponentialShadowMap = true;
        }
        // Backward compat
        else if (parsedShadowGenerator.useVarianceShadowMap) {
            shadowGenerator.useExponentialShadowMap = true;
        } else if (parsedShadowGenerator.useBlurVarianceShadowMap) {
            shadowGenerator.useBlurExponentialShadowMap = true;
        }

        if (parsedShadowGenerator.contactHardeningLightSizeUVRatio !== undefined) {
            shadowGenerator.contactHardeningLightSizeUVRatio = parsedShadowGenerator.contactHardeningLightSizeUVRatio;
        }

        if (parsedShadowGenerator.filteringQuality !== undefined) {
            shadowGenerator.filteringQuality = parsedShadowGenerator.filteringQuality;
        }

        if (parsedShadowGenerator.depthScale) {
            shadowGenerator.depthScale = parsedShadowGenerator.depthScale;
        }

        if (parsedShadowGenerator.blurScale) {
            shadowGenerator.blurScale = parsedShadowGenerator.blurScale;
        }

        if (parsedShadowGenerator.blurBoxOffset) {
            shadowGenerator.blurBoxOffset = parsedShadowGenerator.blurBoxOffset;
        }

        if (parsedShadowGenerator.useKernelBlur) {
            shadowGenerator.useKernelBlur = parsedShadowGenerator.useKernelBlur;
        }

        if (parsedShadowGenerator.blurKernel) {
            shadowGenerator.blurKernel = parsedShadowGenerator.blurKernel;
        }

        return shadowGenerator;
    }
}
