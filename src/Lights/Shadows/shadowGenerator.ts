import { SmartArray } from "../../Misc/smartArray";
import { Nullable } from "../../types";
import { Scene } from "../../scene";
import { Matrix, Vector3, Vector2, Color4 } from "../../Maths/math";
import { VertexBuffer } from "../../Meshes/buffer";
import { SubMesh } from "../../Meshes/subMesh";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { Mesh } from "../../Meshes/mesh";

import { IShadowLight } from "../../Lights/shadowLight";
import { Light } from "../../Lights/light";

import { Material } from "../../Materials/material";
import { MaterialDefines } from "../../Materials/materialDefines";
import { MaterialHelper } from "../../Materials/materialHelper";
import { Effect } from "../../Materials/effect";
import { Texture } from "../../Materials/Textures/texture";
import { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";

import { PostProcess } from "../../PostProcesses/postProcess";
import { BlurPostProcess } from "../../PostProcesses/blurPostProcess";
import { _TimeToken } from "../../Instrumentation/timeToken";
import { _DepthCullingState, _StencilState, _AlphaState } from "../../States/index";
import { Constants } from "../../Engines/constants";

import "../../Shaders/shadowMap.fragment";
import "../../Shaders/shadowMap.vertex";
import "../../Shaders/depthBoxBlur.fragment";
import { Observable } from '../../Misc/observable';
import { _DevTools } from '../../Misc/devTools';

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
     * The list of unifrom names used in the shader
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
    /**
     * Gets the main RTT containing the shadow map (usually storing depth from the light point of view).
     * @returns The render target texture if present otherwise, null
     */
    getShadowMap(): Nullable<RenderTargetTexture>;
    /**
     * Gets the RTT used during rendering (can be a blurred version of the shadow map or the shadow map itself).
     * @returns The render target texture if the shadow map is present otherwise, null
     */
    getShadowMapForRendering(): Nullable<RenderTargetTexture>;

    /**
     * Determine wheter the shadow generator is ready or not (mainly all effects and related post processes needs to be ready).
     * @param subMesh The submesh we want to render in the shadow map
     * @param useInstances Defines wether will draw in the map using instances
     * @returns true if ready otherwise, false
     */
    isReady(subMesh: SubMesh, useInstances: boolean): boolean;

    /**
     * Prepare all the defines in a material relying on a shadow map at the specified light index.
     * @param defines Defines of the material we want to update
     * @param lightIndex Index of the light in the enabled light list of the material
     */
    prepareDefines(defines: MaterialDefines, lightIndex: number): void;
    /**
     * Binds the shadow related information inside of an effect (information like near, far, darkness...
     * defined in the generator but impacting the effect).
     * It implies the unifroms available on the materials are the standard BJS ones.
     * @param lightIndex Index of the light in the enabled light list of the material owning the effect
     * @param effect The effect we are binfing the information for
     */
    bindShadowLight(lightIndex: string, effect: Effect): void;
    /**
     * Gets the transformation matrix used to project the meshes into the map from the light point of view.
     * (eq to shadow prjection matrix * light transform matrix)
     * @returns The transform matrix used to create the shadow map
     */
    getTransformMatrix(): Matrix;

    /**
     * Recreates the shadow map dependencies like RTT and post processes. This can be used during the switch between
     * Cube and 2D textures for instance.
     */
    recreateShadowMap(): void;

    /**
     * Forces all the attached effect to compile to enable rendering only once ready vs. lazyly compiling effects.
     * @param onCompiled Callback triggered at the and of the effects compilation
     * @param options Sets of optional options forcing the compilation with different modes
     */
    forceCompilation(onCompiled?: (generator: ShadowGenerator) => void, options?: Partial<{ useInstances: boolean }>): void;

    /**
     * Forces all the attached effect to compile to enable rendering only once ready vs. lazyly compiling effects.
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
 * Documentation: https://doc.babylonjs.com/babylon101/shadows
 */
export class ShadowGenerator implements IShadowGenerator {
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

    /** Gets or sets the custom shader name to use */
    public customShaderOptions: ICustomShaderOptions;

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

    private _bias = 0.00005;
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

    private _normalBias = 0;
    /**
     * Gets the normalBias: offset applied on the depth preventing acnea (along side the normal direction and proportinal to the light/normal angle).
     */
    public get normalBias(): number {
        return this._normalBias;
    }
    /**
     * Sets the normalBias: offset applied on the depth preventing acnea (along side the normal direction and proportinal to the light/normal angle).
     */
    public set normalBias(normalBias: number) {
        this._normalBias = normalBias;
    }

    private _blurBoxOffset = 1;
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

    private _blurScale = 2;
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

    private _blurKernel = 1;
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

    private _useKernelBlur = false;
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

    private _depthScale: number;
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

    private _filter = ShadowGenerator.FILTER_NONE;
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
        // Blurring the cubemap is going to be too expensive. Reverting to unblurred version
        if (this._light.needCube()) {
            if (value === ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP) {
                this.useExponentialShadowMap = true;
                return;
            }
            else if (value === ShadowGenerator.FILTER_BLURCLOSEEXPONENTIALSHADOWMAP) {
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
            if (this._scene.getEngine().webGLVersion === 1) {
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
        if (!value && this.filter !== ShadowGenerator.FILTER_POISSONSAMPLING) {
            return;
        }

        this.filter = (value ? ShadowGenerator.FILTER_POISSONSAMPLING : ShadowGenerator.FILTER_NONE);
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
        if (!value && this.filter !== ShadowGenerator.FILTER_EXPONENTIALSHADOWMAP) {
            return;
        }
        this.filter = (value ? ShadowGenerator.FILTER_EXPONENTIALSHADOWMAP : ShadowGenerator.FILTER_NONE);
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
        if (!value && this.filter !== ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP) {
            return;
        }
        this.filter = (value ? ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP : ShadowGenerator.FILTER_NONE);
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
        if (!value && this.filter !== ShadowGenerator.FILTER_CLOSEEXPONENTIALSHADOWMAP) {
            return;
        }
        this.filter = (value ? ShadowGenerator.FILTER_CLOSEEXPONENTIALSHADOWMAP : ShadowGenerator.FILTER_NONE);
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
        if (!value && this.filter !== ShadowGenerator.FILTER_BLURCLOSEEXPONENTIALSHADOWMAP) {
            return;
        }
        this.filter = (value ? ShadowGenerator.FILTER_BLURCLOSEEXPONENTIALSHADOWMAP : ShadowGenerator.FILTER_NONE);
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
        if (!value && this.filter !== ShadowGenerator.FILTER_PCF) {
            return;
        }
        this.filter = (value ? ShadowGenerator.FILTER_PCF : ShadowGenerator.FILTER_NONE);
    }

    private _filteringQuality = ShadowGenerator.QUALITY_HIGH;
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
        if (!value && this.filter !== ShadowGenerator.FILTER_PCSS) {
            return;
        }
        this.filter = (value ? ShadowGenerator.FILTER_PCSS : ShadowGenerator.FILTER_NONE);
    }

    private _contactHardeningLightSizeUVRatio = 0.1;
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

    private _darkness = 0;

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
        }
        else if (darkness <= 0.0) {
            this._darkness = 0.0;
        }
        else {
            this._darkness = darkness;
        }
        return this;
    }

    private _transparencyShadow = false;

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

    private _shadowMap: Nullable<RenderTargetTexture>;
    private _shadowMap2: Nullable<RenderTargetTexture>;
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
        return "ShadowGenerator";
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

        this._shadowMap.renderList.push(mesh);

        if (includeDescendants) {
            this._shadowMap.renderList.push(...mesh.getChildMeshes());
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

        var index = this._shadowMap.renderList.indexOf(mesh);

        if (index !== -1) {
            this._shadowMap.renderList.splice(index, 1);
        }

        if (includeDescendants) {
            for (var child of mesh.getChildren()) {
                this.removeShadowCaster(<any>child);
            }
        }

        return this;
    }

    /**
     * Controls the extent to which the shadows fade out at the edge of the frustum
     * Used only by directionals and spots
     */
    public frustumEdgeFalloff = 0;

    private _light: IShadowLight;
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

    private _scene: Scene;
    private _lightDirection = Vector3.Zero();

    private _effect: Effect;

    private _viewMatrix = Matrix.Zero();
    private _projectionMatrix = Matrix.Zero();
    private _transformMatrix = Matrix.Zero();
    private _cachedPosition: Vector3 = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    private _cachedDirection: Vector3 = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    private _cachedDefines: string;
    private _currentRenderID: number;
    private _boxBlurPostprocess: Nullable<PostProcess>;
    private _kernelBlurXPostprocess: Nullable<PostProcess>;
    private _kernelBlurYPostprocess: Nullable<PostProcess>;
    private _blurPostProcesses: PostProcess[];
    private _mapSize: number;
    private _currentFaceIndex = 0;
    private _currentFaceIndexCache = 0;
    private _textureType: number;
    private _defaultTextureMatrix = Matrix.Identity();

    /** @hidden */
    public static _SceneComponentInitialization: (scene: Scene) => void = (_) => {
        throw _DevTools.WarnImport("ShadowGeneratorSceneComponent");
    }

    /**
     * Creates a ShadowGenerator object.
     * A ShadowGenerator is the required tool to use the shadows.
     * Each light casting shadows needs to use its own ShadowGenerator.
     * Documentation : https://doc.babylonjs.com/babylon101/shadows
     * @param mapSize The size of the texture what stores the shadows. Example : 1024.
     * @param light The light object generating the shadows.
     * @param usefulFloatFirst By default the generator will try to use half float textures but if you need precision (for self shadowing for instance), you can use this option to enforce full float texture.
     */
    constructor(mapSize: number, light: IShadowLight, usefulFloatFirst?: boolean) {
        this._mapSize = mapSize;
        this._light = light;
        this._scene = light.getScene();
        light._shadowGenerator = this;

        ShadowGenerator._SceneComponentInitialization(this._scene);

        // Texture type fallback from float to int if not supported.
        var caps = this._scene.getEngine().getCaps();

        if (!usefulFloatFirst) {
            if (caps.textureHalfFloatRender && caps.textureHalfFloatLinearFiltering) {
                this._textureType = Constants.TEXTURETYPE_HALF_FLOAT;
            }
            else if (caps.textureFloatRender && caps.textureFloatLinearFiltering) {
                this._textureType = Constants.TEXTURETYPE_FLOAT;
            }
            else {
                this._textureType = Constants.TEXTURETYPE_UNSIGNED_INT;
            }
        } else {
            if (caps.textureFloatRender && caps.textureFloatLinearFiltering) {
                this._textureType = Constants.TEXTURETYPE_FLOAT;
            }
            else if (caps.textureHalfFloatRender && caps.textureHalfFloatLinearFiltering) {
                this._textureType = Constants.TEXTURETYPE_HALF_FLOAT;
            }
            else {
                this._textureType = Constants.TEXTURETYPE_UNSIGNED_INT;
            }
        }

        this._initializeGenerator();
        this._applyFilterValues();
    }

    private _initializeGenerator(): void {
        this._light._markMeshesAsLightDirty();
        this._initializeShadowMap();
    }

    private _initializeShadowMap(): void {
        // Render target
        let engine = this._scene.getEngine();
        if (engine.webGLVersion > 1) {
            this._shadowMap = new RenderTargetTexture(this._light.name + "_shadowMap", this._mapSize, this._scene, false, true, this._textureType, this._light.needCube(), undefined, false, false);
            this._shadowMap.createDepthStencilTexture(Constants.LESS, true);
        }
        else {
            this._shadowMap = new RenderTargetTexture(this._light.name + "_shadowMap", this._mapSize, this._scene, false, true, this._textureType, this._light.needCube());
        }
        this._shadowMap.wrapU = Texture.CLAMP_ADDRESSMODE;
        this._shadowMap.wrapV = Texture.CLAMP_ADDRESSMODE;
        this._shadowMap.anisotropicFilteringLevel = 1;
        this._shadowMap.updateSamplingMode(Texture.BILINEAR_SAMPLINGMODE);
        this._shadowMap.renderParticles = false;
        this._shadowMap.ignoreCameraViewport = true;

        // Record Face Index before render.
        this._shadowMap.onBeforeRenderObservable.add((faceIndex: number) => {
            this._currentFaceIndex = faceIndex;
            if (this._filter === ShadowGenerator.FILTER_PCF) {
                engine.setColorWrite(false);
            }
        });

        // Custom render function.
        this._shadowMap.customRenderFunction = this._renderForShadowMap.bind(this);

        // Blur if required afer render.
        this._shadowMap.onAfterUnbindObservable.add(() => {
            if (this._filter === ShadowGenerator.FILTER_PCF) {
                engine.setColorWrite(true);
            }
            if (!this.useBlurExponentialShadowMap && !this.useBlurCloseExponentialShadowMap) {
                return;
            }
            let shadowMap = this.getShadowMapForRendering();

            if (shadowMap) {
                this._scene.postProcessManager.directRender(this._blurPostProcesses, shadowMap.getInternalTexture(), true);
            }
        });

        // Clear according to the chosen filter.
        var clearZero = new Color4(0, 0, 0, 0);
        var clearOne = new Color4(1.0, 1.0, 1.0, 1.0);
        this._shadowMap.onClearObservable.add((engine) => {
            if (this._filter === ShadowGenerator.FILTER_PCF) {
                engine.clear(clearOne, false, true, false);
            }
            else if (this.useExponentialShadowMap || this.useBlurExponentialShadowMap) {
                engine.clear(clearZero, true, true, false);
            }
            else {
                engine.clear(clearOne, true, true, false);
            }
        });
    }

    private _initializeBlurRTTAndPostProcesses(): void {
        var engine = this._scene.getEngine();
        var targetSize = this._mapSize / this.blurScale;

        if (!this.useKernelBlur || this.blurScale !== 1.0) {
            this._shadowMap2 = new RenderTargetTexture(this._light.name + "_shadowMap2", targetSize, this._scene, false, true, this._textureType);
            this._shadowMap2.wrapU = Texture.CLAMP_ADDRESSMODE;
            this._shadowMap2.wrapV = Texture.CLAMP_ADDRESSMODE;
            this._shadowMap2.updateSamplingMode(Texture.BILINEAR_SAMPLINGMODE);
        }

        if (this.useKernelBlur) {
            this._kernelBlurXPostprocess = new BlurPostProcess(this._light.name + "KernelBlurX", new Vector2(1, 0), this.blurKernel, 1.0, null, Texture.BILINEAR_SAMPLINGMODE, engine, false, this._textureType);
            this._kernelBlurXPostprocess.width = targetSize;
            this._kernelBlurXPostprocess.height = targetSize;
            this._kernelBlurXPostprocess.onApplyObservable.add((effect) => {
                effect.setTexture("textureSampler", this._shadowMap);
            });

            this._kernelBlurYPostprocess = new BlurPostProcess(this._light.name + "KernelBlurY", new Vector2(0, 1), this.blurKernel, 1.0, null, Texture.BILINEAR_SAMPLINGMODE, engine, false, this._textureType);

            this._kernelBlurXPostprocess.autoClear = false;
            this._kernelBlurYPostprocess.autoClear = false;

            if (this._textureType === Constants.TEXTURETYPE_UNSIGNED_INT) {
                (<BlurPostProcess>this._kernelBlurXPostprocess).packedFloat = true;
                (<BlurPostProcess>this._kernelBlurYPostprocess).packedFloat = true;
            }

            this._blurPostProcesses = [this._kernelBlurXPostprocess, this._kernelBlurYPostprocess];
        }
        else {
            this._boxBlurPostprocess = new PostProcess(this._light.name + "DepthBoxBlur", "depthBoxBlur", ["screenSize", "boxOffset"], [], 1.0, null, Texture.BILINEAR_SAMPLINGMODE, engine, false, "#define OFFSET " + this._blurBoxOffset, this._textureType);
            this._boxBlurPostprocess.onApplyObservable.add((effect) => {
                effect.setFloat2("screenSize", targetSize, targetSize);
                effect.setTexture("textureSampler", this._shadowMap);
            });

            this._boxBlurPostprocess.autoClear = false;

            this._blurPostProcesses = [this._boxBlurPostprocess];
        }
    }

    private _renderForShadowMap(opaqueSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, depthOnlySubMeshes: SmartArray<SubMesh>): void {
        var index: number;
        let engine = this._scene.getEngine();

        if (depthOnlySubMeshes.length) {
            engine.setColorWrite(false);
            for (index = 0; index < depthOnlySubMeshes.length; index++) {
                this._renderSubMeshForShadowMap(depthOnlySubMeshes.data[index]);
            }
            engine.setColorWrite(true);
        }

        for (index = 0; index < opaqueSubMeshes.length; index++) {
            this._renderSubMeshForShadowMap(opaqueSubMeshes.data[index]);
        }

        for (index = 0; index < alphaTestSubMeshes.length; index++) {
            this._renderSubMeshForShadowMap(alphaTestSubMeshes.data[index]);
        }

        if (this._transparencyShadow) {
            for (index = 0; index < transparentSubMeshes.length; index++) {
                this._renderSubMeshForShadowMap(transparentSubMeshes.data[index]);
            }
        }
    }

    private _renderSubMeshForShadowMap(subMesh: SubMesh): void {
        var mesh = subMesh.getRenderingMesh();
        var scene = this._scene;
        var engine = scene.getEngine();
        let material = subMesh.getMaterial();

        mesh._internalAbstractMeshDataInfo._isActiveIntermediate = false;

        if (!material || subMesh.verticesCount === 0) {
            return;
        }

        // Culling
        engine.setState(material.backFaceCulling);

        // Managing instances
        var batch = mesh._getInstancesRenderList(subMesh._id);
        if (batch.mustReturn) {
            return;
        }

        var hardwareInstancedRendering = (engine.getCaps().instancedArrays) && (batch.visibleInstances[subMesh._id] !== null) && (batch.visibleInstances[subMesh._id] !== undefined);
        if (this.isReady(subMesh, hardwareInstancedRendering)) {
            engine.enableEffect(this._effect);
            mesh._bind(subMesh, this._effect, Material.TriangleFillMode);

            this._effect.setFloat3("biasAndScale", this.bias, this.normalBias, this.depthScale);

            this._effect.setMatrix("viewProjection", this.getTransformMatrix());
            if (this.getLight().getTypeID() === Light.LIGHTTYPEID_DIRECTIONALLIGHT) {
                this._effect.setVector3("lightData", this._cachedDirection);
            }
            else {
                this._effect.setVector3("lightData", this._cachedPosition);
            }

            if (scene.activeCamera) {
                this._effect.setFloat2("depthValues", this.getLight().getDepthMinZ(scene.activeCamera), this.getLight().getDepthMinZ(scene.activeCamera) + this.getLight().getDepthMaxZ(scene.activeCamera));
            }

            // Alpha test
            if (material && material.needAlphaTesting()) {
                var alphaTexture = material.getAlphaTestTexture();
                if (alphaTexture) {
                    this._effect.setTexture("diffuseSampler", alphaTexture);
                    this._effect.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix() || this._defaultTextureMatrix);
                }
            }

            // Bones
            if (mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
                const skeleton = mesh.skeleton;

                if (skeleton.isUsingTextureForMatrices) {
                    const boneTexture = skeleton.getTransformMatrixTexture();

                    if (!boneTexture) {
                        return;
                    }

                    this._effect.setTexture("boneSampler", boneTexture);
                    this._effect.setFloat("boneTextureWidth", 4.0 * (skeleton.bones.length + 1));
                } else {
                    this._effect.setMatrices("mBones", skeleton.getTransformMatrices((mesh)));
                }
            }

            // Morph targets
            MaterialHelper.BindMorphTargetParameters(mesh, this._effect);

            if (this.forceBackFacesOnly) {
                engine.setState(true, 0, false, true);
            }

            // Observables
            this.onBeforeShadowMapRenderMeshObservable.notifyObservers(mesh);
            this.onBeforeShadowMapRenderObservable.notifyObservers(this._effect);

            // Draw
            mesh._processRendering(subMesh, this._effect, Material.TriangleFillMode, batch, hardwareInstancedRendering,
                (isInstance, world) => this._effect.setMatrix("world", world));

            if (this.forceBackFacesOnly) {
                engine.setState(true, 0, false, false);
            }

            // Observables
            this.onAfterShadowMapRenderObservable.notifyObservers(this._effect);
            this.onAfterShadowMapRenderMeshObservable.notifyObservers(mesh);

        } else {
            // Need to reset refresh rate of the shadowMap
            if (this._shadowMap) {
                this._shadowMap.resetRefreshCounter();
            }
        }
    }

    private _applyFilterValues(): void {
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
     * Forces all the attached effect to compile to enable rendering only once ready vs. lazyly compiling effects.
     * @param onCompiled Callback triggered at the and of the effects compilation
     * @param options Sets of optional options forcing the compilation with different modes
     */
    public forceCompilation(onCompiled?: (generator: ShadowGenerator) => void, options?: Partial<{ useInstances: boolean }>): void {
        let localOptions = {
            useInstances: false,
            ...options
        };

        let shadowMap = this.getShadowMap();
        if (!shadowMap) {
            if (onCompiled) {
                onCompiled(this);
            }
            return;
        }

        let renderList = shadowMap.renderList;
        if (!renderList) {
            if (onCompiled) {
                onCompiled(this);
            }
            return;
        }

        var subMeshes = new Array<SubMesh>();
        for (var mesh of renderList) {
            subMeshes.push(...mesh.subMeshes);
        }
        if (subMeshes.length === 0) {
            if (onCompiled) {
                onCompiled(this);
            }
            return;
        }

        var currentIndex = 0;

        var checkReady = () => {
            if (!this._scene || !this._scene.getEngine()) {
                return;
            }

            while (this.isReady(subMeshes[currentIndex], localOptions.useInstances)) {
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
     * Forces all the attached effect to compile to enable rendering only once ready vs. lazyly compiling effects.
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

    /**
     * Determine wheter the shadow generator is ready or not (mainly all effects and related post processes needs to be ready).
     * @param subMesh The submesh we want to render in the shadow map
     * @param useInstances Defines wether will draw in the map using instances
     * @returns true if ready otherwise, false
     */
    public isReady(subMesh: SubMesh, useInstances: boolean): boolean {
        var defines = [];

        if (this._textureType !== Constants.TEXTURETYPE_UNSIGNED_INT) {
            defines.push("#define FLOAT");
        }

        if (this.useExponentialShadowMap || this.useBlurExponentialShadowMap) {
            defines.push("#define ESM");
        }
        else if (this.usePercentageCloserFiltering || this.useContactHardeningShadow) {
            defines.push("#define DEPTHTEXTURE");
        }

        var attribs = [VertexBuffer.PositionKind];

        var mesh = subMesh.getMesh();
        var material = subMesh.getMaterial();

        // Normal bias.
        if (this.normalBias && mesh.isVerticesDataPresent(VertexBuffer.NormalKind)) {
            attribs.push(VertexBuffer.NormalKind);
            defines.push("#define NORMAL");
            if (mesh.nonUniformScaling) {
                defines.push("#define NONUNIFORMSCALING");
            }
            if (this.getLight().getTypeID() === Light.LIGHTTYPEID_DIRECTIONALLIGHT) {
                defines.push("#define DIRECTIONINLIGHTDATA");
            }
        }

        // Alpha test
        if (material && material.needAlphaTesting()) {
            var alphaTexture = material.getAlphaTestTexture();
            if (alphaTexture) {
                defines.push("#define ALPHATEST");
                if (mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
                    attribs.push(VertexBuffer.UVKind);
                    defines.push("#define UV1");
                }
                if (mesh.isVerticesDataPresent(VertexBuffer.UV2Kind)) {
                    if (alphaTexture.coordinatesIndex === 1) {
                        attribs.push(VertexBuffer.UV2Kind);
                        defines.push("#define UV2");
                    }
                }
            }
        }

        // Bones
        if (mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
            attribs.push(VertexBuffer.MatricesIndicesKind);
            attribs.push(VertexBuffer.MatricesWeightsKind);
            if (mesh.numBoneInfluencers > 4) {
                attribs.push(VertexBuffer.MatricesIndicesExtraKind);
                attribs.push(VertexBuffer.MatricesWeightsExtraKind);
            }
            const skeleton = mesh.skeleton;
            defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);

            if (skeleton.isUsingTextureForMatrices) {
                defines.push("#define BONETEXTURE");
            } else {
                defines.push("#define BonesPerMesh " + (skeleton.bones.length + 1));
            }

        } else {
            defines.push("#define NUM_BONE_INFLUENCERS 0");
        }

        // Morph targets
        var manager = (<Mesh>mesh).morphTargetManager;
        let morphInfluencers = 0;
        if (manager) {
            if (manager.numInfluencers > 0) {
                defines.push("#define MORPHTARGETS");
                morphInfluencers = manager.numInfluencers;
                defines.push("#define NUM_MORPH_INFLUENCERS " + morphInfluencers);
                MaterialHelper.PrepareAttributesForMorphTargets(attribs, mesh, { "NUM_MORPH_INFLUENCERS": morphInfluencers });
            }
        }

        // Instances
        if (useInstances) {
            defines.push("#define INSTANCES");
            MaterialHelper.PushAttributesForInstances(attribs);
        }

        if (this.customShaderOptions) {
            if (this.customShaderOptions.defines) {
                for (var define of this.customShaderOptions.defines) {
                    if (defines.indexOf(define) === -1) {
                        defines.push(define);
                    }
                }
            }
        }

        // Get correct effect
        var join = defines.join("\n");
        if (this._cachedDefines !== join) {
            this._cachedDefines = join;

            let shaderName = "shadowMap";
            let uniforms = ["world", "mBones", "viewProjection", "diffuseMatrix", "lightData", "depthValues", "biasAndScale", "morphTargetInfluences", "boneTextureWidth"];
            let samplers = ["diffuseSampler", "boneSampler"];

            // Custom shader?
            if (this.customShaderOptions) {
                shaderName = this.customShaderOptions.shaderName;

                if (this.customShaderOptions.attributes) {
                    for (var attrib of this.customShaderOptions.attributes) {
                        if (attribs.indexOf(attrib) === -1) {
                            attribs.push(attrib);
                        }
                    }
                }

                if (this.customShaderOptions.uniforms) {
                    for (var uniform of this.customShaderOptions.uniforms) {
                        if (uniforms.indexOf(uniform) === -1) {
                            uniforms.push(uniform);
                        }
                    }
                }

                if (this.customShaderOptions.samplers) {
                    for (var sampler of this.customShaderOptions.samplers) {
                        if (samplers.indexOf(sampler) === -1) {
                            samplers.push(sampler);
                        }
                    }
                }
            }

            this._effect = this._scene.getEngine().createEffect(shaderName,
                attribs, uniforms,
                samplers, join,
                undefined, undefined, undefined, { maxSimultaneousMorphTargets: morphInfluencers });
        }

        if (!this._effect.isReady()) {
            return false;
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
        var scene = this._scene;
        var light = this._light;

        if (!scene.shadowsEnabled || !light.shadowEnabled) {
            return;
        }

        defines["SHADOW" + lightIndex] = true;

        if (this.useContactHardeningShadow) {
            defines["SHADOWPCSS" + lightIndex] = true;
            if (this._filteringQuality === ShadowGenerator.QUALITY_LOW) {
                defines["SHADOWLOWQUALITY" + lightIndex] = true;
            }
            else if (this._filteringQuality === ShadowGenerator.QUALITY_MEDIUM) {
                defines["SHADOWMEDIUMQUALITY" + lightIndex] = true;
            }
            // else default to high.
        }
        if (this.usePercentageCloserFiltering) {
            defines["SHADOWPCF" + lightIndex] = true;
            if (this._filteringQuality === ShadowGenerator.QUALITY_LOW) {
                defines["SHADOWLOWQUALITY" + lightIndex] = true;
            }
            else if (this._filteringQuality === ShadowGenerator.QUALITY_MEDIUM) {
                defines["SHADOWMEDIUMQUALITY" + lightIndex] = true;
            }
            // else default to high.
        }
        else if (this.usePoissonSampling) {
            defines["SHADOWPOISSON" + lightIndex] = true;
        }
        else if (this.useExponentialShadowMap || this.useBlurExponentialShadowMap) {
            defines["SHADOWESM" + lightIndex] = true;
        }
        else if (this.useCloseExponentialShadowMap || this.useBlurCloseExponentialShadowMap) {
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
     * @param effect The effect we are binfing the information for
     */
    public bindShadowLight(lightIndex: string, effect: Effect): void {
        var light = this._light;
        var scene = this._scene;

        if (!scene.shadowsEnabled || !light.shadowEnabled) {
            return;
        }

        let camera = scene.activeCamera;
        if (!camera) {
            return;
        }

        let shadowMap = this.getShadowMap();

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
        }
        else if (this._filter === ShadowGenerator.FILTER_PCSS) {
            effect.setDepthStencilTexture("shadowSampler" + lightIndex, this.getShadowMapForRendering());
            effect.setTexture("depthSampler" + lightIndex, this.getShadowMapForRendering());
            light._uniformBuffer.updateFloat4("shadowsInfo", this.getDarkness(), 1 / shadowMap.getSize().width, this._contactHardeningLightSizeUVRatio * shadowMap.getSize().width, this.frustumEdgeFalloff, lightIndex);
        }
        else {
            effect.setTexture("shadowSampler" + lightIndex, this.getShadowMapForRendering());
            light._uniformBuffer.updateFloat4("shadowsInfo", this.getDarkness(), this.blurScale / shadowMap.getSize().width, this.depthScale, this.frustumEdgeFalloff, lightIndex);
        }

        light._uniformBuffer.updateFloat2("depthValues", this.getLight().getDepthMinZ(camera), this.getLight().getDepthMinZ(camera) + this.getLight().getDepthMaxZ(camera), lightIndex);
    }

    /**
     * Gets the transformation matrix used to project the meshes into the map from the light point of view.
     * (eq to shadow prjection matrix * light transform matrix)
     * @returns The transform matrix used to create the shadow map
     */
    public getTransformMatrix(): Matrix {
        var scene = this._scene;
        if (this._currentRenderID === scene.getRenderId() && this._currentFaceIndexCache === this._currentFaceIndex) {
            return this._transformMatrix;
        }

        this._currentRenderID = scene.getRenderId();
        this._currentFaceIndexCache = this._currentFaceIndex;

        var lightPosition = this._light.position;
        if (this._light.computeTransformedInformation()) {
            lightPosition = this._light.transformedPosition;
        }

        Vector3.NormalizeToRef(this._light.getShadowDirection(this._currentFaceIndex), this._lightDirection);
        if (Math.abs(Vector3.Dot(this._lightDirection, Vector3.Up())) === 1.0) {
            this._lightDirection.z = 0.0000000000001; // Required to avoid perfectly perpendicular light
        }

        if (this._light.needProjectionMatrixCompute() || !this._cachedPosition || !this._cachedDirection || !lightPosition.equals(this._cachedPosition) || !this._lightDirection.equals(this._cachedDirection)) {

            this._cachedPosition.copyFrom(lightPosition);
            this._cachedDirection.copyFrom(this._lightDirection);

            Matrix.LookAtLHToRef(lightPosition, lightPosition.add(this._lightDirection), Vector3.Up(), this._viewMatrix);

            let shadowMap = this.getShadowMap();

            if (shadowMap) {
                let renderList = shadowMap.renderList;

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
        let shadowMap = this._shadowMap;
        if (!shadowMap) {
            return;
        }

        // Track render list.
        var renderList = shadowMap.renderList;
        // Clean up existing data.
        this._disposeRTTandPostProcesses();
        // Reinitializes.
        this._initializeGenerator();
        // Reaffect the filter to ensure a correct fallback if necessary.
        this.filter = this.filter;
        // Reaffect the filter.
        this._applyFilterValues();
        // Reaffect Render List.
        this._shadowMap!.renderList = renderList;
    }

    private _disposeBlurPostProcesses(): void {
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

    private _disposeRTTandPostProcesses(): void {
        if (this._shadowMap) {
            this._shadowMap.dispose();
            this._shadowMap = null;
        }

        this._disposeBlurPostProcesses();
    }

    /**
     * Disposes the ShadowGenerator.
     * Returns nothing.
     */
    public dispose(): void {
        this._disposeRTTandPostProcesses();

        if (this._light) {
            this._light._shadowGenerator = null;
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
        var serializationObject: any = {};
        var shadowMap = this.getShadowMap();

        if (!shadowMap) {
            return serializationObject;
        }

        serializationObject.lightId = this._light.id;
        serializationObject.mapSize = shadowMap.getRenderSize();
        serializationObject.useExponentialShadowMap = this.useExponentialShadowMap;
        serializationObject.useBlurExponentialShadowMap = this.useBlurExponentialShadowMap;
        serializationObject.useCloseExponentialShadowMap = this.useBlurExponentialShadowMap;
        serializationObject.useBlurCloseExponentialShadowMap = this.useBlurExponentialShadowMap;
        serializationObject.usePoissonSampling = this.usePoissonSampling;
        serializationObject.forceBackFacesOnly = this.forceBackFacesOnly;
        serializationObject.depthScale = this.depthScale;
        serializationObject.darkness = this.getDarkness();
        serializationObject.blurBoxOffset = this.blurBoxOffset;
        serializationObject.blurKernel = this.blurKernel;
        serializationObject.blurScale = this.blurScale;
        serializationObject.useKernelBlur = this.useKernelBlur;
        serializationObject.transparencyShadow = this._transparencyShadow;
        serializationObject.frustumEdgeFalloff = this.frustumEdgeFalloff;

        serializationObject.bias = this.bias;
        serializationObject.normalBias = this.normalBias;

        serializationObject.usePercentageCloserFiltering = this.usePercentageCloserFiltering;
        serializationObject.useContactHardeningShadow = this.useContactHardeningShadow;
        serializationObject.filteringQuality = this.filteringQuality;
        serializationObject.contactHardeningLightSizeUVRatio = this.contactHardeningLightSizeUVRatio;

        serializationObject.renderList = [];
        if (shadowMap.renderList) {
            for (var meshIndex = 0; meshIndex < shadowMap.renderList.length; meshIndex++) {
                var mesh = shadowMap.renderList[meshIndex];

                serializationObject.renderList.push(mesh.id);
            }
        }

        return serializationObject;
    }

    /**
     * Parses a serialized ShadowGenerator and returns a new ShadowGenerator.
     * @param parsedShadowGenerator The JSON object to parse
     * @param scene The scene to create the shadow map for
     * @returns The parsed shadow generator
     */
    public static Parse(parsedShadowGenerator: any, scene: Scene): ShadowGenerator {
        var light = <IShadowLight>scene.getLightByID(parsedShadowGenerator.lightId);
        var shadowGenerator = new ShadowGenerator(parsedShadowGenerator.mapSize, light);
        var shadowMap = shadowGenerator.getShadowMap();

        for (var meshIndex = 0; meshIndex < parsedShadowGenerator.renderList.length; meshIndex++) {
            var meshes = scene.getMeshesByID(parsedShadowGenerator.renderList[meshIndex]);
            meshes.forEach(function(mesh) {
                if (!shadowMap) {
                    return;
                }
                if (!shadowMap.renderList) {
                    shadowMap.renderList = [];
                }
                shadowMap.renderList.push(mesh);
            });
        }

        if (parsedShadowGenerator.usePoissonSampling) {
            shadowGenerator.usePoissonSampling = true;
        }
        else if (parsedShadowGenerator.useExponentialShadowMap) {
            shadowGenerator.useExponentialShadowMap = true;
        }
        else if (parsedShadowGenerator.useBlurExponentialShadowMap) {
            shadowGenerator.useBlurExponentialShadowMap = true;
        }
        else if (parsedShadowGenerator.useCloseExponentialShadowMap) {
            shadowGenerator.useCloseExponentialShadowMap = true;
        }
        else if (parsedShadowGenerator.useBlurCloseExponentialShadowMap) {
            shadowGenerator.useBlurCloseExponentialShadowMap = true;
        }
        else if (parsedShadowGenerator.usePercentageCloserFiltering) {
            shadowGenerator.usePercentageCloserFiltering = true;
        }
        else if (parsedShadowGenerator.useContactHardeningShadow) {
            shadowGenerator.useContactHardeningShadow = true;
        }

        if (parsedShadowGenerator.filteringQuality) {
            shadowGenerator.filteringQuality = parsedShadowGenerator.filteringQuality;
        }

        if (parsedShadowGenerator.contactHardeningLightSizeUVRatio) {
            shadowGenerator.contactHardeningLightSizeUVRatio = parsedShadowGenerator.contactHardeningLightSizeUVRatio;
        }

        // Backward compat
        else if (parsedShadowGenerator.useVarianceShadowMap) {
            shadowGenerator.useExponentialShadowMap = true;
        }
        else if (parsedShadowGenerator.useBlurVarianceShadowMap) {
            shadowGenerator.useBlurExponentialShadowMap = true;
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

        if (parsedShadowGenerator.bias !== undefined) {
            shadowGenerator.bias = parsedShadowGenerator.bias;
        }

        if (parsedShadowGenerator.normalBias !== undefined) {
            shadowGenerator.normalBias = parsedShadowGenerator.normalBias;
        }

        if (parsedShadowGenerator.frustumEdgeFalloff !== undefined) {
            shadowGenerator.frustumEdgeFalloff = parsedShadowGenerator.frustumEdgeFalloff;
        }

        if (parsedShadowGenerator.darkness) {
            shadowGenerator.setDarkness(parsedShadowGenerator.darkness);
        }

        if (parsedShadowGenerator.transparencyShadow) {
            shadowGenerator.setTransparencyShadow(true);
        }

        shadowGenerator.forceBackFacesOnly = parsedShadowGenerator.forceBackFacesOnly;

        return shadowGenerator;
    }
}
