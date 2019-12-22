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
import { Observable } from '../../Misc/observable';
import { _DevTools } from '../../Misc/devTools';
import { EffectFallbacks } from '../../Materials/effectFallbacks';
import { IShadowGenerator } from './shadowGenerator';
import { DirectionalLight } from '../directionalLight';

import { BoundingSphere } from "../../Culling/boundingSphere";

/**
 * A CSM implementation allowing casting shadows on large scenes.
 * Documentation : https://doc.babylonjs.com/babylon101/cascadedShadows
 * Based on: https://johanmedestrom.wordpress.com/2016/03/18/opengl-cascaded-shadow-maps/
 */
export class CascadedShadowGenerator implements IShadowGenerator {
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

    private _cascades = CascadedShadowGenerator.DEFAULT_CASCADES_COUNT;

    /**
     * Gets or set the number of cascades used by the CSM.
     */
    public get cascades(): number {
        return this._cascades;
    }
    public set cascades(value: number) {
        value = Math.min(Math.max(value, CascadedShadowGenerator.MIN_CASCADES_COUNT), CascadedShadowGenerator.MAX_CASCADES_COUNT);
        if (value === this._cascades) {
            return;
        }

        this._cascades = value;
        this.recreateShadowMap();
    }

    private _shadowMap: Nullable<RenderTargetTexture>;
    /**
     * Gets the main RTT containing the shadow map (usually storing depth from the light point of view).
     * @returns The render target texture if present otherwise, null
     */
    public getShadowMap(): Nullable<RenderTargetTexture> {
        return this._shadowMap;
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
     * Used only by directionals and spots
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

    private _scene: Scene;
    private _lightDirection = Vector3.Zero();

    private _effect: Effect;

    private _viewMatrix: Array<Matrix>;
    private _cachedPosition: Vector3 = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    private _cachedDirection: Vector3 = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    private _cachedDefines: string;
    private _currentRenderID: Array<number>;
    private _mapSize: number;
    private _currentLayer = 0;
    private _textureType: number;
    private _defaultTextureMatrix = Matrix.Identity();
    private _storedUniqueId: Nullable<number>;

    private _viewSpaceFrustums: Array<Array<Vector3>>;
    private _viewSpaceFrustumsZ: Array<number>;
    private _viewSpaceBoundingSpheres: Array<BoundingSphere>;
    private _transformMatrices: Array<Matrix>;
    private _transformMatricesAsArray: Float32Array;

    private _frustumLength: number;
    /**
     * Gets the csmFrustumLength value: furthest range of the frustum for the CSM mode.
     */
    public get frustumLength(): number {
        if (!this._scene || !this._scene.activeCamera) {
            return 0;
        }
        return this._frustumLength;
    }
    /**
     * Sets the csmFrustumLength: furthest range of the frustum for the CSM mode.
     */
    public set frustumLength(value: number) {
        if (!this._scene || !this._scene.activeCamera) {
            this._frustumLength = value;
            return;
        }
        if (this._frustumLength === value || value < this._scene.activeCamera.minZ || value > this._scene.activeCamera.maxZ) {
            return;
        }
        this._frustumLength = value;
        this._initCascades();
    }

    protected _debug = false;

    public get debug(): boolean {
        return this._debug;
    }

    public set debug(dbg: boolean) {
        this._debug = dbg;
        this._light._markMeshesAsLightDirty();
    }

    public depthClamp: boolean = false;

    public splitBlendPercentage: number = 0.1;

    private _lambda = 0.5;

    /**
     * Gets csmLambda: parameter used for calculating the frustum in CSM.
     */
    public get lambda(): number {
        return this._lambda;
    }
    /**
     * Sets csmLambda: parameter used for calculating the frustum in CSM.
     */
    public set lambda(value: number) {
        const lambda = Math.min(Math.max(value, 0), 1);
        if (this._lambda == lambda) {
            return;
        }
        this._lambda = lambda;
        this._initCascades();
    }

    private _initCascades(): void {
        let camera = this._scene.activeCamera;
        if (!camera) {
            return;
        }

        if (!this._frustumLength) {
            this._frustumLength = camera.maxZ;
        }

        this._currentRenderID = new Array(this._cascades);

        // inits and sets all static params related to CSM
        let engine = this._scene.getEngine();
        this._viewSpaceFrustums = [];
        this._viewSpaceFrustumsZ = [];
        this._viewSpaceBoundingSpheres = [];
        let nearx = 0;
        let neary = 0;
        let farx = 0;
        let fary = 0;

        // get all internal camera cascaded frustum points
        let breaks = this._frustumSplit(this.cascades, camera.minZ, this._frustumLength, this._lambda);
        if (camera.fovMode === 0) {
            nearx = camera.minZ * Math.tan(camera.fov / 2) * engine.getAspectRatio(camera);
            neary = camera.minZ * Math.tan(camera.fov / 2);
            farx = this._frustumLength * Math.tan(camera.fov / 2) * engine.getAspectRatio(camera);
            fary = this._frustumLength * Math.tan(camera.fov / 2);
        } else if (camera.fovMode === 1) {
            nearx = camera.minZ * Math.tan(camera.fov / 2);
            neary = camera.minZ * Math.tan(camera.fov / 2) * engine.getAspectRatio(camera);
            farx = this._frustumLength * Math.tan(camera.fov / 2);
            fary = this._frustumLength * Math.tan(camera.fov / 2) * engine.getAspectRatio(camera);
        }

        // populate the viewSpaceFrustums array
        for (let i = 0; i < this.cascades + 1; i++) {
            this._viewSpaceFrustums[i] = [];
            this._viewSpaceFrustums[i].push(Vector3.Lerp(new Vector3(nearx, neary, camera.minZ), new Vector3(farx, fary, this._frustumLength), breaks[i]));
            this._viewSpaceFrustums[i].push(Vector3.Lerp(new Vector3(nearx, -neary, camera.minZ), new Vector3(farx, -fary, this._frustumLength), breaks[i]));
            this._viewSpaceFrustums[i].push(Vector3.Lerp(new Vector3(-nearx, -neary, camera.minZ), new Vector3(-farx, -fary, this._frustumLength), breaks[i]));
            this._viewSpaceFrustums[i].push(Vector3.Lerp(new Vector3(-nearx, neary, camera.minZ), new Vector3(-farx, fary, this._frustumLength), breaks[i]));
        }

        // populate the viewSpaceBoundingSpheres array
        var minX = Number.MAX_VALUE;
        var minY = Number.MAX_VALUE;
        var minZ = Number.MAX_VALUE;
        var maxX = Number.MIN_VALUE;
        var maxY = Number.MIN_VALUE;
        var maxZ = Number.MIN_VALUE;
        for (let i = 0; i < this.cascades; i++) {
            for (let j = 0; j < this._viewSpaceFrustums[i].length; j++) {
                minX = Math.min(minX, this._viewSpaceFrustums[i][j].x);
                minY = Math.min(minY, this._viewSpaceFrustums[i][j].y);
                minZ = Math.min(minZ, this._viewSpaceFrustums[i][j].z);
                maxX = Math.max(maxX, this._viewSpaceFrustums[i][j].x);
                maxY = Math.max(maxY, this._viewSpaceFrustums[i][j].y);
                maxZ = Math.max(maxZ, this._viewSpaceFrustums[i][j].z);

                minX = Math.min(minX, this._viewSpaceFrustums[i + 1][j].x);
                minY = Math.min(minY, this._viewSpaceFrustums[i + 1][j].y);
                minZ = Math.min(minZ, this._viewSpaceFrustums[i + 1][j].z);
                maxX = Math.max(maxX, this._viewSpaceFrustums[i + 1][j].x);
                maxY = Math.max(maxY, this._viewSpaceFrustums[i + 1][j].y);
                maxZ = Math.max(maxZ, this._viewSpaceFrustums[i + 1][j].z);
            }
            let bs = new BoundingSphere(new Vector3(minX, minY, minZ), new Vector3(maxX, maxY, maxZ));
            this._viewSpaceBoundingSpheres.push(bs);

            this._viewSpaceFrustumsZ[i] = this._viewSpaceFrustums[i + 1][0].z;
        }

        // initialize the CSM transformMatrices
        this._viewMatrix = [];
        this._transformMatrices = [];
        for (let index = 0; index < this.cascades; index++) {
            this._viewMatrix[index] = Matrix.Zero();
            this._transformMatrices[index] = Matrix.Zero();
        }
        this._transformMatricesAsArray = new Float32Array(this.cascades * 16);
    }

    private _uniformSplit(amount: number, near: number, far: number): Array<number> {
        let r = [];
        for (let i = 1; i < amount; i++) {
            r.push(i / amount);
        }
        r.push(1);
        return r;
    }

    private _logarithmicSplit(amount: number, near: number, far: number): Array<number> {
        let r = [];
        for (let i = 1; i < amount; i++) {
            r.push((near * (far / near) ** (i / amount) - near) / (far - near));
        }
        r.push(1);
        return r;
    }

    private _frustumSplit(amount: number, near: number, far: number, lambda: number): Array<number> {
        let log = this._logarithmicSplit(amount, near, far);
        let uni = this._uniformSplit(amount, near, far);
        let r = [];
        r.push(0);
        for (let i = 1; i < amount; i++) {
            r.push(lambda * log[i - 1] + (1 - lambda) * uni[i - 1]);
        }
        r.push(1);
        return r;
    }

    /**
     * Gets the CSM transformation matrix used to project the meshes into the map from the light point of view.
     * (eq to shadow prjection matrix * light transform matrix)
	 * @param mapIndex index number of the cascaded shadow map
     * @returns The transform matrix used to create the CSM shadow map
     */
    public getCSMTransformMatrix(mapIndex: number): Matrix {
        var scene = this._scene;
        if (this._currentRenderID[mapIndex] === scene.getRenderId()) {
            return this._transformMatrices[mapIndex];
        }

        let camera = scene.activeCamera;
        if (!camera) {
            return this._transformMatrices[mapIndex];
        }

        this._currentRenderID[mapIndex] = scene.getRenderId();

        var lightPosition = this._light.position;
        if (this._light.computeTransformedInformation()) {
            lightPosition = this._light.transformedPosition;
        }

        Vector3.NormalizeToRef(this._light.getShadowDirection(0), this._lightDirection);
        if (Math.abs(Vector3.Dot(this._lightDirection, Vector3.Up())) === 1.0) {
            this._lightDirection.z = 0.0000000000001; // Required to avoid perfectly perpendicular light
        }

        if (this._light.needProjectionMatrixCompute() || !this._cachedPosition || !this._cachedDirection || !lightPosition.equals(this._cachedPosition) || !this._lightDirection.equals(this._cachedDirection)) {
            this._cachedPosition.copyFrom(lightPosition);
            this._cachedDirection.copyFrom(this._lightDirection);

            // get bounding sphere of current cascade
            let bs = new BoundingSphere(this._viewSpaceBoundingSpheres[mapIndex].minimum, this._viewSpaceBoundingSpheres[mapIndex].maximum, camera.getWorldMatrix());
            // get view matrix
            let shadowCamPos = bs.centerWorld.subtract(this._lightDirection.scale(bs.radius));
            Matrix.LookAtLHToRef(shadowCamPos, bs.centerWorld, Vector3.Up(), this._viewMatrix[mapIndex]);
            // get ortho matrix
            let OrthoMatrix = Matrix.OrthoLH(2.0 * bs.radius, 2.0 * bs.radius, 0, 2.0 * bs.radius);
            // get projection matrix
            this._viewMatrix[mapIndex].multiplyToRef(OrthoMatrix, this._transformMatrices[mapIndex]);

            // rounding the transform matrix to prevent shimmering artifacts from camera movement
            let shadowOrigin = Vector3.TransformCoordinates(Vector3.Zero(), this._transformMatrices[mapIndex]);
            shadowOrigin = shadowOrigin.scale(this._mapSize / 2.0);
            let roundedOrigin = new Vector3(Math.ceil(shadowOrigin.x), Math.ceil(shadowOrigin.y), Math.ceil(shadowOrigin.z));
            let roundOffset = roundedOrigin.subtract(shadowOrigin);
            roundOffset = roundOffset.scale(2.0 / this._mapSize);
            let roundMatrix = Matrix.Translation(roundOffset.x, roundOffset.y, 0.0);
            this._transformMatrices[mapIndex].multiplyToRef(roundMatrix, this._transformMatrices[mapIndex]);
        }

        this._transformMatrices[mapIndex].copyToArray(this._transformMatricesAsArray, mapIndex * 16);
        return this._transformMatrices[mapIndex];
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
        this._frustumLength = this._scene.activeCamera?.maxZ ?? 10000;

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
        // Render target
        let engine = this._scene.getEngine();

        const size = { width: this._mapSize, height: this._mapSize, layers: this.cascades };
        this._shadowMap = new RenderTargetTexture(this._light.name + "_shadowMap", size, this._scene, false, true, this._textureType, false, undefined, false, false);
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

        this._initCascades();
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

        if (this.depthClamp) {
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
        defines["SHADOWCSMNUM_CASCADES" + lightIndex] = this.cascades;

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
        effect.setFloat("splitBlendFactor" + lightIndex, this.splitBlendPercentage === 0 ? 10000 : 1 / this.splitBlendPercentage);

        // Only PCF uses depth stencil texture.
        if (this._filter === CascadedShadowGenerator.FILTER_PCF) {
            effect.setDepthStencilTexture("shadowSampler" + lightIndex, shadowMap);
            light._uniformBuffer.updateFloat4("shadowsInfo", this.getDarkness(), width, 1 / width, this.frustumEdgeFalloff, lightIndex);
        } else if (this._filter === CascadedShadowGenerator.FILTER_PCSS) {
            effect.setDepthStencilTexture("shadowSampler" + lightIndex, shadowMap);
            effect.setTexture("depthSampler" + lightIndex, shadowMap);
            light._uniformBuffer.updateFloat4("shadowsInfo", this.getDarkness(), 1 / width, this._contactHardeningLightSizeUVRatio * width, this.frustumEdgeFalloff, lightIndex);
        }
        else {
            effect.setTexture("shadowSampler" + lightIndex, shadowMap);
            light._uniformBuffer.updateFloat4("shadowsInfo", this.getDarkness(), width, 1 / width, this.frustumEdgeFalloff, lightIndex);
        }

        light._uniformBuffer.updateFloat2("depthValues", this.getLight().getDepthMinZ(camera), this.getLight().getDepthMinZ(camera) + this.getLight().getDepthMaxZ(camera), lightIndex);
    }

    /**
     * Gets the transformation matrix used to project the meshes into the map from the light point of view.
     * (eq to shadow prjection matrix * light transform matrix)
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

        if (parsedShadowGenerator.filteringQuality) {
            shadowGenerator.filteringQuality = parsedShadowGenerator.filteringQuality;
        }

        if (parsedShadowGenerator.contactHardeningLightSizeUVRatio) {
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
