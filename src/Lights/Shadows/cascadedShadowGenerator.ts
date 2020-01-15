import { SmartArray } from "../../Misc/smartArray";
import { Nullable } from "../../types";
import { Scene } from "../../scene";
import { Matrix, Vector3 } from "../../Maths/math.vector";
import { Color4 } from "../../Maths/math.color";
import { VertexBuffer } from "../../Meshes/buffer";
import { SubMesh } from "../../Meshes/subMesh";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { Mesh } from "../../Meshes/mesh";

import { Material } from "../../Materials/material";
import { MaterialHelper } from "../../Materials/materialHelper";
import { Effect } from "../../Materials/effect";
import { Texture } from "../../Materials/Textures/texture";
import { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";

import { _TimeToken } from "../../Instrumentation/timeToken";
import { Constants } from "../../Engines/constants";

import "../../Shaders/shadowMap.fragment";
import "../../Shaders/shadowMap.vertex";
import "../../Shaders/depthBoxBlur.fragment";
import { Observable, Observer } from '../../Misc/observable';
import { _DevTools } from '../../Misc/devTools';
import { EffectFallbacks } from '../../Materials/effectFallbacks';
import { IShadowGenerator } from './shadowGenerator';
import { DirectionalLight } from '../directionalLight';

import { BoundingInfo } from '../../Culling/boundingInfo';
import { DepthRenderer } from '../../Rendering/depthRenderer';
import { DepthReducer } from '../../Misc/depthReducer';

interface ICascade {
    prevBreakDistance: number;
    breakDistance: number;
}

const UpDir = Vector3.Up();
const ZeroVec = Vector3.Zero();

let tmpv1 = new Vector3(),
    tmpv2 = new Vector3(),
    matrix = new Matrix();

/**
 * A CSM implementation allowing casting shadows on large scenes.
 * Documentation : https://doc.babylonjs.com/babylon101/cascadedShadows
 * Based on: https://github.com/TheRealMJP/Shadows and https://johanmedestrom.wordpress.com/2016/03/18/opengl-cascaded-shadow-maps/
 */
export class CascadedShadowGenerator implements IShadowGenerator {

    private static readonly frustumCornersNDCSpace = [
        new Vector3(-1.0, +1.0, -1.0),
        new Vector3(+1.0, +1.0, -1.0),
        new Vector3(+1.0, -1.0, -1.0),
        new Vector3(-1.0, -1.0, -1.0),
        new Vector3(-1.0, +1.0, +1.0),
        new Vector3(+1.0, +1.0, +1.0),
        new Vector3(+1.0, -1.0, +1.0),
        new Vector3(-1.0, -1.0, +1.0),
    ];

    /**
     * Defines the default number of cascades used by the CSM.
     */
    public static readonly DEFAULT_CASCADES_COUNT = 4;
    /**
     * Defines the minimum number of cascades used by the CSM.
     */
    public static readonly MIN_CASCADES_COUNT = 2;
    /**
     * Defines the maximum number of cascades used by the CSM.
     */
    public static readonly MAX_CASCADES_COUNT = 4;

    /**
     * Shadow generator mode None: no filtering applied.
     */
    public static readonly FILTER_NONE = 0;
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

    private static readonly _CLEARONE = new Color4(1.0, 1.0, 1.0, 1.0);

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

    private _filter = CascadedShadowGenerator.FILTER_PCF;
    /**
     * Gets the current mode of the shadow generator (normal, PCF, PCSS...).
     * The returned value is a number equal to one of the available mode defined in ShadowMap.FILTER_x like _FILTER_NONE
     */
    public get filter(): number {
        return this._filter;
    }
    /**
     * Sets the current mode of the shadow generator (normal, PCF, PCSS...).
     * The returned value is a number equal to one of the available mode defined in ShadowMap.FILTER_x like _FILTER_NONE
     */
    public set filter(value: number) {
        if (this._filter === value) {
            return;
        }

        this._filter = value;
        this._applyFilterValues();
        this._light._markMeshesAsLightDirty();
    }

    /**
     * Gets if the current filter is set to "PCF" (percentage closer filtering).
     */
    public get usePercentageCloserFiltering(): boolean {
        return this.filter === CascadedShadowGenerator.FILTER_PCF;
    }
    /**
     * Sets the current filter to "PCF" (percentage closer filtering).
     */
    public set usePercentageCloserFiltering(value: boolean) {
        if (!value && this.filter !== CascadedShadowGenerator.FILTER_PCF) {
            return;
        }
        this.filter = (value ? CascadedShadowGenerator.FILTER_PCF : CascadedShadowGenerator.FILTER_NONE);
    }

    private _filteringQuality = CascadedShadowGenerator.QUALITY_HIGH;
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

        this._applyFilterValues();
        this._light._markMeshesAsLightDirty();
    }

    /**
     * Gets if the current filter is set to "PCSS" (contact hardening).
     */
    public get useContactHardeningShadow(): boolean {
        return this.filter === CascadedShadowGenerator.FILTER_PCSS;
    }
    /**
     * Sets the current filter to "PCSS" (contact hardening).
     */
    public set useContactHardeningShadow(value: boolean) {
        if (!value && this.filter !== CascadedShadowGenerator.FILTER_PCSS) {
            return;
        }
        this.filter = (value ? CascadedShadowGenerator.FILTER_PCSS : CascadedShadowGenerator.FILTER_NONE);
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
    public setDarkness(darkness: number): CascadedShadowGenerator {
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

    /**
     * Gets or sets the actual darkness of the soft shadows while using PCSS filtering (value between 0. and 1.)
     */
    public penumbraDarkness: number = 1.0;

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
    public setTransparencyShadow(transparent: boolean): CascadedShadowGenerator {
        this._transparencyShadow = transparent;
        return this;
    }

    private _numCascades = CascadedShadowGenerator.DEFAULT_CASCADES_COUNT;

    /**
     * Gets or set the number of cascades used by the CSM.
     */
    public get numCascades(): number {
        return this._numCascades;
    }

    public set numCascades(value: number) {
        value = Math.min(Math.max(value, CascadedShadowGenerator.MIN_CASCADES_COUNT), CascadedShadowGenerator.MAX_CASCADES_COUNT);
        if (value === this._numCascades) {
            return;
        }

        this._numCascades = value;
        this.recreateShadowMap();
    }

    /**
     * Sets this to true if you want that the edges of the shadows don't "swimm" / "shimmer" when rotating the camera.
     * The trade off is that you loose some precision in the shadow rendering when enabling this setting.
     */
    public stabilizeCascades: boolean = false;

    private _shadowMap: Nullable<RenderTargetTexture>;
    /**
     * Gets the main RTT containing the shadow map (usually storing depth from the light point of view).
     * @returns The render target texture if present otherwise, null
     */
    public getShadowMap(): Nullable<RenderTargetTexture> {
        return this._shadowMap;
    }

    protected _freezeShadowCastersBoundingInfo: boolean = false;
    private _freezeShadowCastersBoundingInfoObservable: Nullable<Observer<Scene>> = null;

    /**
     * Enables or disables the shadow casters bounding info computation.
     * If your shadow casters don't move, you can disable this feature.
     * If it is enabled, the bounding box computation is done every frame.
     */
    public get freezeShadowCastersBoundingInfo(): boolean {
        return this._freezeShadowCastersBoundingInfo;
    }

    public set freezeShadowCastersBoundingInfo(freeze: boolean) {
        if (this._freezeShadowCastersBoundingInfoObservable && freeze) {
            this._scene.onBeforeRenderObservable.remove(this._freezeShadowCastersBoundingInfoObservable);
            this._freezeShadowCastersBoundingInfoObservable = null;
        }

        if (!this._freezeShadowCastersBoundingInfoObservable && !freeze) {
            this._freezeShadowCastersBoundingInfoObservable = this._scene.onBeforeRenderObservable.add(this._computeShadowCastersBoundingInfo.bind(this));
        }

        this._freezeShadowCastersBoundingInfo = freeze;

        if (freeze) {
            this._computeShadowCastersBoundingInfo();
        }
    }

    private _scbiMin = new Vector3(0, 0, 0);
    private _scbiMax = new Vector3(0, 0, 0);

    protected _computeShadowCastersBoundingInfo(): void {
        this._scbiMin.copyFromFloats(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        this._scbiMax.copyFromFloats(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);

        if (this._shadowMap && this._shadowMap.renderList) {
            const renderList = this._shadowMap.renderList;
            for (let meshIndex = 0; meshIndex < renderList.length; meshIndex++) {
                const mesh = renderList[meshIndex];

                if (!mesh) {
                    continue;
                }

                const boundingInfo = mesh.getBoundingInfo(),
                      boundingBox = boundingInfo.boundingBox;

                this._scbiMin.minimizeInPlace(boundingBox.minimumWorld);
                this._scbiMax.maximizeInPlace(boundingBox.maximumWorld);
            }

            const meshes = this._scene.meshes;
            for (let meshIndex = 0; meshIndex < meshes.length; meshIndex++) {
                const mesh = meshes[meshIndex];

                if (!mesh || !mesh.isVisible || !mesh.isEnabled || !mesh.receiveShadows) {
                    continue;
                }

                const boundingInfo = mesh.getBoundingInfo(),
                      boundingBox = boundingInfo.boundingBox;

                this._scbiMin.minimizeInPlace(boundingBox.minimumWorld);
                this._scbiMax.maximizeInPlace(boundingBox.maximumWorld);
            }
        }

        this._shadowCastersBoundingInfo.reConstruct(this._scbiMin, this._scbiMax);
    }

    protected _shadowCastersBoundingInfo: BoundingInfo;

    /**
     * Gets or sets the shadow casters bounding info.
     * If you provide your own shadow casters bounding info, first enable freezeShadowCastersBoundingInfo
     * so that the system won't overwrite the bounds you provide
     */
    public get shadowCastersBoundingInfo(): BoundingInfo {
        return this._shadowCastersBoundingInfo;
    }

    public set shadowCastersBoundingInfo(boundingInfo: BoundingInfo) {
        this._shadowCastersBoundingInfo = boundingInfo;
    }

    protected _breaksAreDirty: boolean = true;

    protected _minDistance: number = 0;
    protected _maxDistance: number = 1;

    /**
     * Sets the minimal and maximal distances to use when computing the cascade breaks.
     *
     * The values of min / max are typically the depth zmin and zmax values of your scene, for a given frame.
     * If you don't know these values, simply leave them to their defaults and don't call this function.
     * @param min minimal distance for the breaks (default to 0.)
     * @param max maximal distance for the breaks (default to 1.)
     */
    public setMinMaxDistance(min: number, max: number): void {
        if (this._minDistance === min && this._maxDistance === max) {
            return;
        }

        if (min > max) {
            min = 0;
            max = 1;
        }

        if (min < 0) {
            min = 0;
        }

        if (max > 1) {
            max = 1;
        }

        this._minDistance = min;
        this._maxDistance = max;
        this._breaksAreDirty = true;
    }

    /** Gets the minimal distance used in the cascade break computation */
    public get minDistance(): number {
        return this._minDistance;
    }

    /** Gets the maximal distance used in the cascade break computation */
    public get maxDistance(): number {
        return this._maxDistance;
    }

    /**
     * Gets the class name of that object
     * @returns "ShadowGenerator"
     */
    public getClassName(): string {
        return "CascadedShadowGenerator";
    }

    /**
     * Helper function to add a mesh and its descendants to the list of shadow casters.
     * @param mesh Mesh to add
     * @param includeDescendants boolean indicating if the descendants should be added. Default to true
     * @returns the Shadow Generator itself
     */
    public addShadowCaster(mesh: AbstractMesh, includeDescendants = true): CascadedShadowGenerator {
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
    public removeShadowCaster(mesh: AbstractMesh, includeDescendants = true): CascadedShadowGenerator {
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
     */
    public frustumEdgeFalloff = 0;

    private _light: DirectionalLight;
    /**
     * Returns the associated light object.
     * @returns the light generating the shadow
     */
    public getLight(): DirectionalLight {
        return this._light;
    }

    /**
     * If true the shadow map is generated by rendering the back face of the mesh instead of the front face.
     * This can help with self-shadowing as the geometry making up the back of objects is slightly offset.
     * It might on the other hand introduce peter panning.
     */
    public forceBackFacesOnly = false;

    private _cascadeMinExtents: Array<Vector3>;
    private _cascadeMaxExtents: Array<Vector3>;

    /**
     * Gets a cascade minimum extents
     * @param cascadeIndex index of the cascade
     * @returns the minimum cascade extents
     */
    public getCascadeMinExtents(cascadeIndex: number): Nullable<Vector3> {
        return cascadeIndex >= 0 && cascadeIndex < this._numCascades ? this._cascadeMinExtents[cascadeIndex] : null;
    }

    /**
     * Gets a cascade maximum extents
     * @param cascadeIndex index of the cascade
     * @returns the maximum cascade extents
     */
    public getCascadeMaxExtents(cascadeIndex: number): Nullable<Vector3> {
        return cascadeIndex >= 0 && cascadeIndex < this._numCascades ? this._cascadeMaxExtents[cascadeIndex] : null;
    }

    private _scene: Scene;
    private _lightDirection = Vector3.Zero();

    private _effect: Effect;

    private _cascades: Array<ICascade>;
    private _cachedDirection: Vector3 = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    private _cachedDefines: string;
    private _mapSize: number;
    private _currentLayer = 0;
    private _textureType: number;
    private _defaultTextureMatrix = Matrix.Identity();
    private _storedUniqueId: Nullable<number>;

    private _viewSpaceFrustumsZ: Array<number>;
    private _viewMatrices: Array<Matrix>;
    private _projectionMatrices: Array<Matrix>;
    private _transformMatrices: Array<Matrix>;
    private _transformMatricesAsArray: Float32Array;
    private _frustumLengths: Array<number>;
    private _lightSizeUVCorrection: Array<number>;
    private _depthCorrection: Array<number>;
    private _frustumCornersWorldSpace: Array<Array<Vector3>>;
    private _frustumCenter: Array<Vector3>;
    private _shadowCameraPos: Array<Vector3>;

    private _shadowMaxZ: number;
    /**
     * Gets the shadow max z distance. It's the limit beyond which shadows are not displayed.
     * It defaults to camera.maxZ
     */
    public get shadowMaxZ(): number {
        if (!this._scene || !this._scene.activeCamera) {
            return 0;
        }
        return this._shadowMaxZ;
    }
    /**
     * Sets the shadow max z distance.
     */
    public set shadowMaxZ(value: number) {
        if (!this._scene || !this._scene.activeCamera) {
            this._shadowMaxZ = value;
            return;
        }
        if (this._shadowMaxZ === value || value < this._scene.activeCamera.minZ || value > this._scene.activeCamera.maxZ) {
            return;
        }
        this._shadowMaxZ = value;
        this._light._markMeshesAsLightDirty();
        this._breaksAreDirty = true;
    }

    protected _debug = false;

    /**
     * Gets or sets the debug flag.
     * When enabled, the cascades are materialized by different colors on the screen.
     */
    public get debug(): boolean {
        return this._debug;
    }

    public set debug(dbg: boolean) {
        this._debug = dbg;
        this._light._markMeshesAsLightDirty();
    }

    private _depthClamp = true;

    /**
     * Gets or sets the depth clamping value.
     *
     * When enabled, it improves the shadow quality because the near z plane of the light frustum don't need to be adjusted
     * to account for the shadow casters far away.
     *
     * Note that this property is incompatible with PCSS filtering, so it won't be used in that case.
     */
    public get depthClamp(): boolean {
        return this._depthClamp;
    }

    public set depthClamp(value: boolean) {
        this._depthClamp = value;
    }

    private _cascadeBlendPercentage: number = 0.1;

    /**
     * Gets or sets the percentage of blending between two cascades (value between 0. and 1.).
     * It defaults to 0.1 (10% blending).
     */
    public get cascadeBlendPercentage(): number {
        return this._cascadeBlendPercentage;
    }

    public set cascadeBlendPercentage(value: number) {
        this._cascadeBlendPercentage = value;
        this._light._markMeshesAsLightDirty();
    }

    private _lambda = 0.5;

    /**
     * Gets or set the lambda parameter.
     * This parameter is used to split the camera frustum and create the cascades.
     * It's a value between 0. and 1.: If 0, the split is a uniform split of the frustum, if 1 it is a logarithmic split.
     * For all values in-between, it's a linear combination of the uniform and logarithm split algorithm.
     */
    public get lambda(): number {
        return this._lambda;
    }

    public set lambda(value: number) {
        const lambda = Math.min(Math.max(value, 0), 1);
        if (this._lambda == lambda) {
            return;
        }
        this._lambda = lambda;
        this._breaksAreDirty = true;
    }

    /**
     * Gets the view matrix corresponding to a given cascade
     * @param cascadeNum cascade to retrieve the view matrix from
     * @returns the cascade view matrix
     */
    public getCascadeViewMatrix(cascadeNum: number): Nullable<Matrix> {
        return cascadeNum >= 0 && cascadeNum < this._numCascades ? this._viewMatrices[cascadeNum] : null;
    }

    /**
     * Gets the projection matrix corresponding to a given cascade
     * @param cascadeNum cascade to retrieve the projection matrix from
     * @returns the cascade projection matrix
     */
    public getCascadeProjectionMatrix(cascadeNum: number): Nullable<Matrix> {
        return cascadeNum >= 0 && cascadeNum < this._numCascades ? this._projectionMatrices[cascadeNum] : null;
    }

    private _depthRenderer: Nullable<DepthRenderer>;
    /**
     * Sets the depth renderer to use when autoCalcDepthBounds is enabled.
     *
     * Note that if no depth renderer is set, a new one will be automatically created internally when necessary.
     *
     * You should call this function if you already have a depth renderer enabled in your scene, to avoid
     * doing multiple depth rendering each frame. If you provide your own depth renderer, make sure it stores linear depth!
     * @param depthRenderer The depth renderer to use when autoCalcDepthBounds is enabled. If you pass null or don't call this function at all, a depth renderer will be automatically created
     */
    public setDepthRenderer(depthRenderer: Nullable<DepthRenderer>): void {
        this._depthRenderer = depthRenderer;

        if (this._depthReducer) {
            this._depthReducer.setDepthRenderer(this._depthRenderer);
        }
    }

    private _depthReducer: Nullable<DepthReducer>;
    private _autoCalcDepthBounds = false;

    /**
     * Gets or sets the autoCalcDepthBounds property.
     *
     * When enabled, a depth rendering pass is first performed (with an internally created depth renderer or with the one
     * you provide by calling setDepthRenderer). Then, a min/max reducing is applied on the depth map to compute the
     * minimal and maximal depth of the map and those values are used as inputs for the setMinMaxDistance() function.
     * It can greatly enhance the shadow quality, at the expense of more GPU works.
     * When using this option, you should increase the value of the lambda parameter, and even set it to 1 for best results.
     */
    public get autoCalcDepthBounds(): boolean {
        return this._autoCalcDepthBounds;
    }

    public set autoCalcDepthBounds(value: boolean) {
        const camera = this._scene.activeCamera;

        if (!camera) {
            return;
        }

        this._autoCalcDepthBounds = value;

        if (!value) {
            if (this._depthReducer) {
                this._depthReducer.deactivate();
            }
            this.setMinMaxDistance(0, 1);
            return;
        }

        if (!this._depthReducer) {
            this._depthReducer = new DepthReducer(camera);
            this._depthReducer.onAfterReductionPerformed.add((minmax: { min: number, max: number}) => {
                let min = minmax.min, max = minmax.max;
                if (min >= max) {
                    min = 0;
                    max = 1;
                }
                if (min != this._minDistance || max != this._maxDistance) {
                    this.setMinMaxDistance(min, max);
                }
            });
            this._depthReducer.setDepthRenderer(this._depthRenderer);
        }

        this._depthReducer.activate();
    }

    /**
     * Defines the refresh rate of the min/max computation used when autoCalcDepthBounds is set to true
     * Use 0 to compute just once, 1 to compute on every frame, 2 to compute every two frames and so on...
     * Note that if you provided your own depth renderer through a call to setDepthRenderer, you are responsible
     * for setting the refresh rate on the renderer yourself!
     */
    public get autoCalcDepthBoundsRefreshRate(): number {
        return this._depthReducer?.depthRenderer?.getDepthMap().refreshRate ?? -1;
    }

    public set autoCalcDepthBoundsRefreshRate(value: number) {
        if (this._depthReducer?.depthRenderer) {
            this._depthReducer.depthRenderer.getDepthMap().refreshRate = value;
        }
    }

    /**
     * Create the cascade breaks according to the lambda, shadowMaxZ and min/max distance properties, as well as the camera near and far planes.
     * This function is automatically called when updating lambda, shadowMaxZ and min/max distances, however you should call it yourself if
     * you change the camera near/far planes!
     */
    public splitFrustum(): void {
        this._breaksAreDirty = true;
    }

    private _splitFrustum(): void {
        let camera = this._scene.activeCamera;
        if (!camera) {
            return;
        }

        const near = camera.minZ,
              far = camera.maxZ,
              cameraRange = far - near,
              minDistance = this._minDistance,
              maxDistance = this._shadowMaxZ < far && this._shadowMaxZ >= near ? Math.min((this._shadowMaxZ - near) / (far - near), this._maxDistance) : this._maxDistance;

        const minZ = near + minDistance * cameraRange,
              maxZ = near + maxDistance * cameraRange;

        const range = maxZ - minZ,
              ratio = maxZ / minZ;

        for (let cascadeIndex = 0; cascadeIndex < this._cascades.length; ++cascadeIndex) {
            const p = (cascadeIndex + 1) / this._numCascades,
                  log = minZ * (ratio ** p),
                  uniform = minZ + range * p;

            const d = this._lambda * (log - uniform) + uniform;

            this._cascades[cascadeIndex].prevBreakDistance = cascadeIndex === 0 ? minDistance : this._cascades[cascadeIndex - 1].breakDistance;
            this._cascades[cascadeIndex].breakDistance = (d - near) / cameraRange;

            this._viewSpaceFrustumsZ[cascadeIndex] = near + this._cascades[cascadeIndex].breakDistance * cameraRange;
            this._frustumLengths[cascadeIndex] = (this._cascades[cascadeIndex].breakDistance - this._cascades[cascadeIndex].prevBreakDistance) * cameraRange;
        }

        this._breaksAreDirty = false;
    }

    /**
     * Gets the CSM transformation matrix used to project the meshes into the map from the light point of view.
     * (eq to view projection * shadow projection matrices)
	 * @param cascadeIndex index number of the cascaded shadow map
     * @returns The transform matrix used to create the CSM shadow map
     */
    public getCSMTransformMatrix(cascadeIndex: number): Matrix {
        return this._transformMatrices[cascadeIndex];
    }

    private _computeMatrices(): void {
        var scene = this._scene;

        let camera = scene.activeCamera;
        if (!camera) {
            return;
        }

        Vector3.NormalizeToRef(this._light.getShadowDirection(0), this._lightDirection);
        if (Math.abs(Vector3.Dot(this._lightDirection, Vector3.Up())) === 1.0) {
            this._lightDirection.z = 0.0000000000001; // Required to avoid perfectly perpendicular light
        }

        this._cachedDirection.copyFrom(this._lightDirection);

        for (let cascadeIndex = 0; cascadeIndex < this._numCascades; ++cascadeIndex) {
            this._computeFrustumInWorldSpace(cascadeIndex);
            this._computeCascadeFrustum(cascadeIndex);

            this._cascadeMaxExtents[cascadeIndex].subtractToRef(this._cascadeMinExtents[cascadeIndex], tmpv1); // tmpv1 = cascadeExtents

            // Get position of the shadow camera
            this._frustumCenter[cascadeIndex].addToRef(this._lightDirection.scale(this._cascadeMinExtents[cascadeIndex].z), this._shadowCameraPos[cascadeIndex]);

            // Come up with a new orthographic camera for the shadow caster
            Matrix.LookAtLHToRef(this._shadowCameraPos[cascadeIndex], this._frustumCenter[cascadeIndex], UpDir, this._viewMatrices[cascadeIndex]);

            let minZ = 0, maxZ = tmpv1.z;

            // Try to tighten minZ and maxZ based on the bounding box of the shadow casters
            const boundingInfo = this._shadowCastersBoundingInfo;

            boundingInfo.update(this._viewMatrices[cascadeIndex]);

            maxZ = Math.min(maxZ, boundingInfo.boundingBox.maximumWorld.z);

            if (!this._depthClamp || this.filter === CascadedShadowGenerator.FILTER_PCSS) {
                // If we don't use depth clamping, we must set minZ so that all shadow casters are in the light frustum
                minZ = Math.min(minZ, boundingInfo.boundingBox.minimumWorld.z);
            } else {
                // If using depth clamping, we can adjust minZ to reduce the [minZ, maxZ] range (and get some additional precision in the shadow map)
                minZ = Math.max(minZ, boundingInfo.boundingBox.minimumWorld.z);
            }

            if (this._scene.useRightHandedSystem) {
                Matrix.OrthoOffCenterRHToRef(this._cascadeMinExtents[cascadeIndex].x, this._cascadeMaxExtents[cascadeIndex].x, this._cascadeMinExtents[cascadeIndex].y, this._cascadeMaxExtents[cascadeIndex].y, minZ, maxZ, this._projectionMatrices[cascadeIndex]);
            } else {
                Matrix.OrthoOffCenterLHToRef(this._cascadeMinExtents[cascadeIndex].x, this._cascadeMaxExtents[cascadeIndex].x, this._cascadeMinExtents[cascadeIndex].y, this._cascadeMaxExtents[cascadeIndex].y, minZ, maxZ, this._projectionMatrices[cascadeIndex]);
            }

            this._cascadeMinExtents[cascadeIndex].z = minZ;
            this._cascadeMaxExtents[cascadeIndex].z = maxZ;

            this._viewMatrices[cascadeIndex].multiplyToRef(this._projectionMatrices[cascadeIndex], this._transformMatrices[cascadeIndex]);

            // Create the rounding matrix, by projecting the world-space origin and determining
            // the fractional offset in texel space
            Vector3.TransformCoordinatesToRef(ZeroVec, this._transformMatrices[cascadeIndex], tmpv1); // tmpv1 = shadowOrigin
            tmpv1.scaleInPlace(this._mapSize / 2);

            tmpv2.copyFromFloats(Math.round(tmpv1.x), Math.round(tmpv1.y), Math.round(tmpv1.z)); // tmpv2 = roundedOrigin
            tmpv2.subtractInPlace(tmpv1).scaleInPlace(2 / this._mapSize); // tmpv2 = roundOffset

            Matrix.TranslationToRef(tmpv2.x, tmpv2.y, 0.0, matrix);

            this._projectionMatrices[cascadeIndex].multiplyToRef(matrix, this._projectionMatrices[cascadeIndex]);
            this._viewMatrices[cascadeIndex].multiplyToRef(this._projectionMatrices[cascadeIndex], this._transformMatrices[cascadeIndex]);

            this._transformMatrices[cascadeIndex].copyToArray(this._transformMatricesAsArray, cascadeIndex * 16);
        }
    }

    // Get the 8 points of the view frustum in world space
    private _computeFrustumInWorldSpace(cascadeIndex: number): void {
        if (!this._scene.activeCamera) {
            return;
        }

        const prevSplitDist = this._cascades[cascadeIndex].prevBreakDistance,
              splitDist = this._cascades[cascadeIndex].breakDistance;

        this._scene.activeCamera.getViewMatrix(); // make sure the transformation matrix we get when calling 'getTransformationMatrix()' is calculated with an up to date view matrix

        const invViewProj = Matrix.Invert(this._scene.activeCamera.getTransformationMatrix());
        for (let cornerIndex = 0; cornerIndex < CascadedShadowGenerator.frustumCornersNDCSpace.length; ++cornerIndex) {
            Vector3.TransformCoordinatesToRef(CascadedShadowGenerator.frustumCornersNDCSpace[cornerIndex], invViewProj, this._frustumCornersWorldSpace[cascadeIndex][cornerIndex]);
        }

        // Get the corners of the current cascade slice of the view frustum
        for (let cornerIndex = 0; cornerIndex < CascadedShadowGenerator.frustumCornersNDCSpace.length / 2; ++cornerIndex) {
            tmpv1.copyFrom(this._frustumCornersWorldSpace[cascadeIndex][cornerIndex + 4]).subtractInPlace(this._frustumCornersWorldSpace[cascadeIndex][cornerIndex]);
            tmpv2.copyFrom(tmpv1).scaleInPlace(prevSplitDist); // near corner ray
            tmpv1.scaleInPlace(splitDist); // far corner ray

            tmpv1.addInPlace(this._frustumCornersWorldSpace[cascadeIndex][cornerIndex]);

            this._frustumCornersWorldSpace[cascadeIndex][cornerIndex + 4].copyFrom(tmpv1);
            this._frustumCornersWorldSpace[cascadeIndex][cornerIndex].addInPlace(tmpv2);
        }
    }

    private _computeCascadeFrustum(cascadeIndex: number): void {
        this._cascadeMinExtents[cascadeIndex].copyFromFloats(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        this._cascadeMaxExtents[cascadeIndex].copyFromFloats(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);
        this._frustumCenter[cascadeIndex].copyFromFloats(0, 0, 0);

        const camera = this._scene.activeCamera;

        if (!camera) {
            return;
        }

        // Calculate the centroid of the view frustum slice
        for (let cornerIndex = 0; cornerIndex < this._frustumCornersWorldSpace[cascadeIndex].length; ++cornerIndex) {
            this._frustumCenter[cascadeIndex].addInPlace(this._frustumCornersWorldSpace[cascadeIndex][cornerIndex]);
        }

        this._frustumCenter[cascadeIndex].scaleInPlace(1 / this._frustumCornersWorldSpace[cascadeIndex].length);

        if (this.stabilizeCascades) {
            // Calculate the radius of a bounding sphere surrounding the frustum corners
            let sphereRadius = 0;
            for (let cornerIndex = 0; cornerIndex < this._frustumCornersWorldSpace[cascadeIndex].length; ++cornerIndex) {
                const dist = this._frustumCornersWorldSpace[cascadeIndex][cornerIndex].subtractToRef(this._frustumCenter[cascadeIndex], tmpv1).length();
                sphereRadius = Math.max(sphereRadius, dist);
            }

            sphereRadius = Math.ceil(sphereRadius * 16) / 16;

            this._cascadeMaxExtents[cascadeIndex].copyFromFloats(sphereRadius, sphereRadius, sphereRadius);
            this._cascadeMinExtents[cascadeIndex].copyFromFloats(-sphereRadius, -sphereRadius, -sphereRadius);
        } else {
            // Create a temporary view matrix for the light
            const lightCameraPos = this._frustumCenter[cascadeIndex];

            this._frustumCenter[cascadeIndex].addToRef(this._lightDirection, tmpv1); // tmpv1 = look at

            Matrix.LookAtLHToRef(lightCameraPos, tmpv1, UpDir, matrix); // matrix = lightView

            // Calculate an AABB around the frustum corners
            for (let cornerIndex = 0; cornerIndex < this._frustumCornersWorldSpace[cascadeIndex].length; ++cornerIndex) {
                Vector3.TransformCoordinatesToRef(this._frustumCornersWorldSpace[cascadeIndex][cornerIndex], matrix, tmpv1);

                this._cascadeMinExtents[cascadeIndex].minimizeInPlace(tmpv1);
                this._cascadeMaxExtents[cascadeIndex].maximizeInPlace(tmpv1);
            }
        }
    }

    /** @hidden */
    public static _SceneComponentInitialization: (scene: Scene) => void = (_) => {
        throw _DevTools.WarnImport("ShadowGeneratorSceneComponent");
    }

    /**
     * Creates a Cascaded Shadow Generator object.
     * A ShadowGenerator is the required tool to use the shadows.
     * Each directional light casting shadows needs to use its own ShadowGenerator.
     * Documentation : https://doc.babylonjs.com/babylon101/cascadedShadows
     * @param mapSize The size of the texture what stores the shadows. Example : 1024.
     * @param light The directional light object generating the shadows.
     * @param usefulFloatFirst By default the generator will try to use half float textures but if you need precision (for self shadowing for instance), you can use this option to enforce full float texture.
     */
    constructor(mapSize: number, light: DirectionalLight, usefulFloatFirst?: boolean) {
        this._scene = light.getScene();
        if (this._scene.getEngine().webGLVersion == 1) {
            throw "CSM can only be used in WebGL2";
        }

        this._light = light;
        this._mapSize = mapSize;
        light._shadowGenerator = this;
        this._shadowMaxZ = this._scene.activeCamera?.maxZ ?? 10000;
        this._shadowCastersBoundingInfo = new BoundingInfo(new Vector3(0, 0, 0), new Vector3(0, 0, 0));
        this.freezeShadowCastersBoundingInfo = false;

        CascadedShadowGenerator._SceneComponentInitialization(this._scene);

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
        // CSM
        this._transformMatricesAsArray = new Float32Array(this._numCascades * 16);
        this._viewSpaceFrustumsZ = new Array(this._numCascades);
        this._frustumLengths = new Array(this._numCascades);
        this._lightSizeUVCorrection = new Array(this._numCascades * 2);
        this._depthCorrection = new Array(this._numCascades);

        this._cascades = [];
        this._viewMatrices = [];
        this._projectionMatrices = [];
        this._transformMatrices = [];
        this._cascadeMinExtents = [];
        this._cascadeMaxExtents = [];
        this._frustumCenter = [];
        this._shadowCameraPos = [];
        this._frustumCornersWorldSpace = [];

        for (let cascadeIndex = 0; cascadeIndex < this._numCascades; ++cascadeIndex) {
            this._cascades[cascadeIndex] = {
                prevBreakDistance: 0,
                breakDistance: 0,
            };

            this._viewMatrices[cascadeIndex] = Matrix.Zero();
            this._projectionMatrices[cascadeIndex] = Matrix.Zero();
            this._transformMatrices[cascadeIndex] = Matrix.Zero();
            this._cascadeMinExtents[cascadeIndex] = new Vector3();
            this._cascadeMaxExtents[cascadeIndex] = new Vector3();
            this._frustumCenter[cascadeIndex] = new Vector3();
            this._shadowCameraPos[cascadeIndex] = new Vector3();
            this._frustumCornersWorldSpace[cascadeIndex] = new Array(CascadedShadowGenerator.frustumCornersNDCSpace.length);

            for (let i = 0; i < CascadedShadowGenerator.frustumCornersNDCSpace.length; ++i) {
                this._frustumCornersWorldSpace[cascadeIndex][i] = new Vector3();
            }
        }

        // Render target
        let engine = this._scene.getEngine();

        const size = { width: this._mapSize, height: this._mapSize, layers: this.numCascades };
        this._shadowMap = new RenderTargetTexture(this._light.name + "_shadowMap", size, this._scene, false, true, this._textureType, false, undefined, false, false, undefined, Constants.TEXTUREFORMAT_RED);
        this._shadowMap.createDepthStencilTexture(Constants.LESS, true);

        this._shadowMap.wrapU = Texture.CLAMP_ADDRESSMODE;
        this._shadowMap.wrapV = Texture.CLAMP_ADDRESSMODE;
        this._shadowMap.anisotropicFilteringLevel = 4;
        this._shadowMap.updateSamplingMode(Texture.BILINEAR_SAMPLINGMODE);
        this._shadowMap.renderParticles = false;
        this._shadowMap.ignoreCameraViewport = true;
        if (this._storedUniqueId) {
            this._shadowMap.uniqueId = this._storedUniqueId;
        }

        this._shadowMap.onBeforeBindObservable.add(() => {
            if (this._breaksAreDirty) {
                this._splitFrustum();
            }
            this._computeMatrices();
        });

        // Record Face Index before render.
        this._shadowMap.onBeforeRenderObservable.add((layer: number) => {
            this._currentLayer = layer;
            if (this._filter === CascadedShadowGenerator.FILTER_PCF) {
                engine.setColorWrite(this.debug);
            }
        });

        // Custom render function.
        this._shadowMap.customRenderFunction = this._renderForShadowMap.bind(this);

        // Restore state after bind.
        this._shadowMap.onAfterUnbindObservable.add(() => {
            if (this._filter === CascadedShadowGenerator.FILTER_PCF) {
                engine.setColorWrite(true);
            }
        });

        // Clear according to the chosen filter.
        this._shadowMap.onClearObservable.add((engine) => {
            if (this._filter === CascadedShadowGenerator.FILTER_PCF) {
                engine.clear(CascadedShadowGenerator._CLEARONE, this.debug, true, false);
            }
            else {
                engine.clear(CascadedShadowGenerator._CLEARONE, true, true, false);
            }
        });

        // Recreate on resize.
        this._shadowMap.onResizeObservable.add((RTT) => {
            this._storedUniqueId = this._shadowMap!.uniqueId;
            this._mapSize = RTT.getRenderSize();
            this._light._markMeshesAsLightDirty();
            this.recreateShadowMap();
        });

        this._splitFrustum();
    }

    private _renderForShadowMap(opaqueSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, depthOnlySubMeshes: SmartArray<SubMesh>): void {
        var index: number;
        let engine = this._scene.getEngine();

        const colorWrite = engine.getColorWrite();
        if (depthOnlySubMeshes.length) {
            engine.setColorWrite(false);
            for (index = 0; index < depthOnlySubMeshes.length; index++) {
                this._renderSubMeshForShadowMap(depthOnlySubMeshes.data[index]);
            }
            engine.setColorWrite(colorWrite);
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

            this._effect.setFloat3("biasAndScale", this.bias, this.normalBias, 0);

            this._effect.setMatrix("viewProjection", this.getCSMTransformMatrix(this._currentLayer));
            this._effect.setVector3("lightData", this._cachedDirection);

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
                    const boneTexture = skeleton.getTransformMatrixTexture(mesh);

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

        if (this.filter === CascadedShadowGenerator.FILTER_PCSS) {
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
    public forceCompilation(onCompiled?: (generator: IShadowGenerator) => void, options?: Partial<{ useInstances: boolean }>): void {
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

        defines.push("#define DEPTHTEXTURE");

        if (this._depthClamp && this._filter !== CascadedShadowGenerator.FILTER_PCSS) {
            defines.push("#define DEPTHCLAMP");
        }

        var attribs = [VertexBuffer.PositionKind];

        var mesh = subMesh.getMesh();
        var material = subMesh.getMaterial();

        // Normal bias.
        if (this.normalBias && mesh.isVerticesDataPresent(VertexBuffer.NormalKind)) {
            attribs.push(VertexBuffer.NormalKind);
            defines.push("#define NORMAL");
            defines.push("#define DIRECTIONINLIGHTDATA");
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
        var manager = (<Mesh>mesh).morphTargetManager;
        let morphInfluencers = 0;
        if (manager) {
            if (manager.numInfluencers > 0) {
                defines.push("#define MORPHTARGETS");
                morphInfluencers = manager.numInfluencers;
                defines.push("#define NUM_MORPH_INFLUENCERS " + morphInfluencers);
                MaterialHelper.PrepareAttributesForMorphTargetsInfluencers(attribs, mesh, morphInfluencers);
            }
        }

        // Instances
        if (useInstances) {
            defines.push("#define INSTANCES");
            MaterialHelper.PushAttributesForInstances(attribs);
        }

        // Get correct effect
        var join = defines.join("\n");
        if (this._cachedDefines !== join) {
            this._cachedDefines = join;

            let shaderName = "shadowMap";
            let uniforms = ["world", "mBones", "viewProjection", "diffuseMatrix", "lightData", "depthValues", "biasAndScale", "morphTargetInfluences", "boneTextureWidth"];
            let samplers = ["diffuseSampler", "boneSampler"];

            this._effect = this._scene.getEngine().createEffect(shaderName,
                attribs, uniforms,
                samplers, join,
                fallbacks, undefined, undefined, { maxSimultaneousMorphTargets: morphInfluencers });
        }

        if (!this._effect.isReady()) {
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

        defines["SHADOWCSM" + lightIndex] = true;
        defines["SHADOWCSMDEBUG" + lightIndex] = this.debug;
        defines["SHADOWCSMNUM_CASCADES" + lightIndex] = this.numCascades;

        const camera = scene.activeCamera;

        if (camera && this._shadowMaxZ < camera.maxZ) {
            defines["SHADOWCSMUSESHADOWMAXZ" + lightIndex] = true;
        }

        if (this.cascadeBlendPercentage === 0) {
            defines["SHADOWCSMNOBLEND" + lightIndex] = true;
        }

        if (this.useContactHardeningShadow) {
            defines["SHADOWPCSS" + lightIndex] = true;
            if (this._filteringQuality === CascadedShadowGenerator.QUALITY_LOW) {
                defines["SHADOWLOWQUALITY" + lightIndex] = true;
            }
            else if (this._filteringQuality === CascadedShadowGenerator.QUALITY_MEDIUM) {
                defines["SHADOWMEDIUMQUALITY" + lightIndex] = true;
            }
            // else default to high.
        }
        else if (this.usePercentageCloserFiltering) {
            defines["SHADOWPCF" + lightIndex] = true;
            if (this._filteringQuality === CascadedShadowGenerator.QUALITY_LOW) {
                defines["SHADOWLOWQUALITY" + lightIndex] = true;
            }
            else if (this._filteringQuality === CascadedShadowGenerator.QUALITY_MEDIUM) {
                defines["SHADOWMEDIUMQUALITY" + lightIndex] = true;
            }
            // else default to high.
        }
    }

    /**
     * Binds the shadow related information inside of an effect (information like near, far, darkness...
     * defined in the generator but impacting the effect).
     * @param lightIndex Index of the light in the enabled light list of the material owning the effect
     * @param effect The effect we are binfing the information for
     */
    public bindShadowLight(lightIndex: string, effect: Effect): void {
        const light = this._light;
        const scene = this._scene;

        if (!scene.shadowsEnabled || !light.shadowEnabled) {
            return;
        }

        const camera = scene.activeCamera;
        if (!camera) {
            return;
        }

        const shadowMap = this.getShadowMap();
        if (!shadowMap) {
            return;
        }

        const width = shadowMap.getSize().width;

        effect.setMatrices("lightMatrix" + lightIndex, this._transformMatricesAsArray);
        effect.setArray("viewFrustumZ" + lightIndex, this._viewSpaceFrustumsZ);
        effect.setFloat("cascadeBlendFactor" + lightIndex, this.cascadeBlendPercentage === 0 ? 10000 : 1 / this.cascadeBlendPercentage);
        effect.setArray("frustumLengths" + lightIndex, this._frustumLengths);

        // Only PCF uses depth stencil texture.
        if (this._filter === CascadedShadowGenerator.FILTER_PCF) {
            effect.setDepthStencilTexture("shadowSampler" + lightIndex, shadowMap);
            light._uniformBuffer.updateFloat4("shadowsInfo", this.getDarkness(), width, 1 / width, this.frustumEdgeFalloff, lightIndex);
        } else if (this._filter === CascadedShadowGenerator.FILTER_PCSS) {
            for (let cascadeIndex = 0; cascadeIndex < this._numCascades; ++cascadeIndex) {
                this._lightSizeUVCorrection[cascadeIndex * 2 + 0] = cascadeIndex === 0 ? 1 : (this._cascadeMaxExtents[0].x - this._cascadeMinExtents[0].x) / (this._cascadeMaxExtents[cascadeIndex].x - this._cascadeMinExtents[cascadeIndex].x); // x correction
                this._lightSizeUVCorrection[cascadeIndex * 2 + 1] = cascadeIndex === 0 ? 1 : (this._cascadeMaxExtents[0].y - this._cascadeMinExtents[0].y) / (this._cascadeMaxExtents[cascadeIndex].y - this._cascadeMinExtents[cascadeIndex].y); // y correction
                this._depthCorrection[cascadeIndex] = cascadeIndex === 0 ? 1 : (this._cascadeMaxExtents[cascadeIndex].z - this._cascadeMinExtents[cascadeIndex].z) / (this._cascadeMaxExtents[0].z - this._cascadeMinExtents[0].z);
            }
            effect.setDepthStencilTexture("shadowSampler" + lightIndex, shadowMap);
            effect.setTexture("depthSampler" + lightIndex, shadowMap);
            effect.setArray2("lightSizeUVCorrection" + lightIndex, this._lightSizeUVCorrection);
            effect.setArray("depthCorrection" + lightIndex, this._depthCorrection);
            effect.setFloat("penumbraDarkness" + lightIndex, this.penumbraDarkness);
            light._uniformBuffer.updateFloat4("shadowsInfo", this.getDarkness(), 1 / width, this._contactHardeningLightSizeUVRatio * width, this.frustumEdgeFalloff, lightIndex);
        }
        else {
            effect.setTexture("shadowSampler" + lightIndex, shadowMap);
            light._uniformBuffer.updateFloat4("shadowsInfo", this.getDarkness(), width, 1 / width, this.frustumEdgeFalloff, lightIndex);
        }

        light._uniformBuffer.updateFloat2("depthValues", this.getLight().getDepthMinZ(camera), this.getLight().getDepthMinZ(camera) + this.getLight().getDepthMaxZ(camera), lightIndex);
    }

    /**
     * Gets the transformation matrix of the first cascade used to project the meshes into the map from the light point of view.
     * (eq to view projection * shadow projection matrices)
     * @returns The transform matrix used to create the shadow map
     */
    public getTransformMatrix(): Matrix {
        return this.getCSMTransformMatrix(0);
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
        this._disposeRTT();
        // Reinitializes.
        this._initializeGenerator();
        // Reaffect the filter to ensure a correct fallback if necessary.
        this.filter = this.filter;
        // Reaffect the filter.
        this._applyFilterValues();
        // Reaffect Render List.
        this._shadowMap!.renderList = renderList;
    }

    private _disposeRTT(): void {
        if (this._shadowMap) {
            this._shadowMap.dispose();
            this._shadowMap = null;
        }
    }

    /**
     * Disposes the ShadowGenerator.
     * Returns nothing.
     */
    public dispose(): void {
        this._disposeRTT();

        if (this._light) {
            this._light._shadowGenerator = null;
            this._light._markMeshesAsLightDirty();
        }

        this.onBeforeShadowMapRenderMeshObservable.clear();
        this.onBeforeShadowMapRenderObservable.clear();
        this.onAfterShadowMapRenderMeshObservable.clear();
        this.onAfterShadowMapRenderObservable.clear();

        if (this._freezeShadowCastersBoundingInfoObservable) {
            this._scene.onBeforeRenderObservable.remove(this._freezeShadowCastersBoundingInfoObservable);
            this._freezeShadowCastersBoundingInfoObservable = null;
        }

        if (this._depthReducer) {
            this._depthReducer.dispose();
            this._depthReducer = null;
        }
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
        serializationObject.forceBackFacesOnly = this.forceBackFacesOnly;
        serializationObject.darkness = this.getDarkness();
        serializationObject.transparencyShadow = this._transparencyShadow;
        serializationObject.frustumEdgeFalloff = this.frustumEdgeFalloff;
        serializationObject.numCascades = this._numCascades;
        serializationObject.stabilizeCascades = this.stabilizeCascades;
        serializationObject.depthClamp = this._depthClamp;
        serializationObject.lambda = this._lambda;
        serializationObject.freezeShadowCastersBoundingInfo = this._freezeShadowCastersBoundingInfo;
        serializationObject.shadowMaxZ = this._shadowMaxZ;
        serializationObject.cascadeBlendPercentage = this.cascadeBlendPercentage;

        serializationObject.bias = this.bias;
        serializationObject.normalBias = this.normalBias;

        serializationObject.usePercentageCloserFiltering = this.usePercentageCloserFiltering;
        serializationObject.useContactHardeningShadow = this.useContactHardeningShadow;
        serializationObject.filteringQuality = this.filteringQuality;
        serializationObject.contactHardeningLightSizeUVRatio = this.contactHardeningLightSizeUVRatio;
        serializationObject.penumbraDarkness = this.penumbraDarkness;

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
    public static Parse(parsedShadowGenerator: any, scene: Scene): CascadedShadowGenerator {
        var light = <DirectionalLight>scene.getLightByID(parsedShadowGenerator.lightId);
        var shadowGenerator = new CascadedShadowGenerator(parsedShadowGenerator.mapSize, light);
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

        if (parsedShadowGenerator.usePercentageCloserFiltering) {
            shadowGenerator.usePercentageCloserFiltering = true;
        }
        else if (parsedShadowGenerator.useContactHardeningShadow) {
            shadowGenerator.useContactHardeningShadow = true;
        }

        if (parsedShadowGenerator.filteringQuality !== undefined) {
            shadowGenerator.filteringQuality = parsedShadowGenerator.filteringQuality;
        }

        if (parsedShadowGenerator.contactHardeningLightSizeUVRatio !== undefined) {
            shadowGenerator.contactHardeningLightSizeUVRatio = parsedShadowGenerator.contactHardeningLightSizeUVRatio;
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

        if (parsedShadowGenerator.darkness !== undefined) {
            shadowGenerator.setDarkness(parsedShadowGenerator.darkness);
        }

        if (parsedShadowGenerator.transparencyShadow) {
            shadowGenerator.setTransparencyShadow(true);
        }

        shadowGenerator.forceBackFacesOnly = !!parsedShadowGenerator.forceBackFacesOnly;

        if (parsedShadowGenerator.stabilizeCascades !== undefined) {
            shadowGenerator.stabilizeCascades = parsedShadowGenerator.stabilizeCascades;
        }

        if (parsedShadowGenerator.depthClamp !== undefined) {
             shadowGenerator.depthClamp = parsedShadowGenerator.depthClamp;
        }

        if (parsedShadowGenerator.lambda !== undefined) {
             shadowGenerator.lambda = parsedShadowGenerator.lambda;
        }

        if (parsedShadowGenerator.freezeShadowCastersBoundingInfo !== undefined) {
            shadowGenerator.freezeShadowCastersBoundingInfo = parsedShadowGenerator.freezeShadowCastersBoundingInfo;
        }

        if (parsedShadowGenerator.shadowMaxZ !== undefined) {
             shadowGenerator.shadowMaxZ = parsedShadowGenerator.shadowMaxZ;
        }

        if (parsedShadowGenerator.cascadeBlendPercentage !== undefined) {
             shadowGenerator.cascadeBlendPercentage = parsedShadowGenerator.cascadeBlendPercentage;
        }

        if (parsedShadowGenerator.penumbraDarkness !== undefined) {
            shadowGenerator.penumbraDarkness = parsedShadowGenerator.penumbraDarkness;
        }

        if (parsedShadowGenerator.numCascades !== undefined) {
            shadowGenerator.numCascades = parsedShadowGenerator.numCascades;
        }

        return shadowGenerator;
    }
}
