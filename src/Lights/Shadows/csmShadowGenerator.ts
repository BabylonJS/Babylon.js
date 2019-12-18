import { AbstractMesh } from "../../Meshes/abstractMesh";
import { BoundingInfo } from "../../Culling/boundingInfo";
import { Effect } from "../../Materials/effect";
import { IShadowGenerator, ShadowGenerator } from "./shadowGenerator";
import { IShadowLight } from "../../Lights/shadowLight";
import { MaterialDefines } from "../../Materials/materialDefines";
import { Matrix, Vector3 } from "../../Maths/math.vector";
import { Nullable } from "../../types";
import { Observer } from "../../Misc/observable";
import { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";
import { Scene } from "../../scene";
import { SubMesh } from "../../Meshes/subMesh";

import { CSMShadowMap } from './csmShadowMap';

export interface ICascade {

    generator: CSMShadowMap;

    prevSplitDistance: number;

    splitDistance: number;

}

export class CSMShadowGenerator implements IShadowGenerator {

    public static readonly CASCADE_ALL = -1;
    public static readonly CASCADE_1 = 0;
    public static readonly CASCADE_2 = 1;
    public static readonly CASCADE_3 = 2;
    public static readonly CASCADE_4 = 3;
    public static readonly CASCADE_5 = 4;
    public static readonly CASCADE_6 = 5;
    public static readonly CASCADE_7 = 6;
    public static readonly CASCADE_8 = 7;

    protected _activeCascade: number;

    public get activeCascade(): number {
        return this._activeCascade;
    }

    public set activeCascade(index: number) {
        if (index !== CSMShadowGenerator.CASCADE_ALL && (index < 0 || index >= this._numCascades)) {
            index = 0;
        }
        this._activeCascade = index;
    }

    protected _numCascades: number;

    public get numCascades(): number {
        return this._numCascades;
    }

    protected _lambda: number;

    public get lambda(): number {
        return this._lambda;
    }

    public set lambda(value: number) {
        this._lambda = value;
        this._setDistanceSplit();
    }

    protected _minDistance: number;

    public get minDistance(): number {
        return this._minDistance;
    }

    public set minDistance(min: number) {
        this._minDistance = min;
    }

    protected _maxDistance: number;

    public get maxDistance(): number {
        return this._maxDistance;
    }

    public set maxDistance(min: number) {
        this._maxDistance = min;
    }

    protected _stabilizeCascades: boolean;

    public get stabilizeCascades(): boolean {
        return this._stabilizeCascades;
    }

    public set stabilizeCascades(value: boolean) {
        this._stabilizeCascades = value;
    }

    protected _useRightDirectionAsUpForOrthoProj: boolean;

    public get useRightDirectionAsUpForOrthoProj(): boolean {
        return this._useRightDirectionAsUpForOrthoProj;
    }

    public set useRightDirectionAsUpForOrthoProj(value: boolean) {
        this._useRightDirectionAsUpForOrthoProj = value;
    }

    protected _freezeShadowCastersBoundingInfo: boolean = false;
    private _freezeShadowCastersBoundingInfoObservable: Nullable<Observer<Scene>> = null;

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

    protected _shadowCastersBoundingInfo: BoundingInfo;

    public get shadowCastersBoundingInfo(): BoundingInfo {
        return this._shadowCastersBoundingInfo;
    }

    public set shadowCastersBoundingInfo(boundingInfo: BoundingInfo) {
        this._shadowCastersBoundingInfo = boundingInfo;
    }

    protected _cascades: Array<ICascade>;

    public get cascade(): Nullable<ICascade> {
        return this._activeCascade >= 0 && this._activeCascade < this._cascades.length ? this._cascades[this._activeCascade] : null;
    }

    protected _renderList: Array<AbstractMesh>;

    public get renderList(): Array<AbstractMesh> {
        return this._renderList;
    }

    public get bias(): number {
        return this._activeCascade >= 0 && this._activeCascade < this._cascades.length ? this._cascades[this._activeCascade].generator.bias : -1;
    }

    public set bias(bias: number) {
        this._getActiveCascades().forEach((cascade) => cascade.generator.bias = bias);
    }

    public get normalBias(): number {
        return this._activeCascade >= 0 && this._activeCascade < this._cascades.length ? this._cascades[this._activeCascade].generator.normalBias : -1;
    }

    public set normalBias(normalBias: number) {
        this._getActiveCascades().forEach((cascade) => cascade.generator.normalBias = normalBias);
    }

    public get blurBoxOffset(): number {
        return this._activeCascade >= 0 && this._activeCascade < this._cascades.length ? this._cascades[this._activeCascade].generator.blurBoxOffset : -1;
    }

    public set blurBoxOffset(value: number) {
        this._getActiveCascades().forEach((cascade) => cascade.generator.blurBoxOffset = value);
    }

    public get blurScale(): number {
        return this._activeCascade >= 0 && this._activeCascade < this._cascades.length ? this._cascades[this._activeCascade].generator.blurScale : -1;
    }

    public set blurScale(value: number) {
        this._getActiveCascades().forEach((cascade) => cascade.generator.blurScale = value);
    }

    public get blurKernel(): number {
        return this._activeCascade >= 0 && this._activeCascade < this._cascades.length ? this._cascades[this._activeCascade].generator.blurKernel : -1;
    }

    public set blurKernel(value: number) {
        this._getActiveCascades().forEach((cascade) => cascade.generator.blurKernel = value);
    }

    public get useKernelBlur(): boolean {
        return this._activeCascade >= 0 && this._activeCascade < this._cascades.length ? this._cascades[this._activeCascade].generator.useKernelBlur : false;
    }

    public set useKernelBlur(value: boolean) {
        this._getActiveCascades().forEach((cascade) => cascade.generator.useKernelBlur = value);
    }

    public get depthScale(): number {
        return this._activeCascade >= 0 && this._activeCascade < this._cascades.length ? this._cascades[this._activeCascade].generator.depthScale : -1;
    }

    public set depthScale(value: number) {
        this._getActiveCascades().forEach((cascade) => cascade.generator.depthScale = value);
    }

    public get filter(): number {
        return this._activeCascade >= 0 && this._activeCascade < this._cascades.length ? this._cascades[this._activeCascade].generator.filter : -1;
    }

    public set filter(value: number) {
        this._getActiveCascades().forEach((cascade) => cascade.generator.filter = value);
    }

    public get filteringQuality(): number {
        return this._activeCascade >= 0 && this._activeCascade < this._cascades.length ? this._cascades[this._activeCascade].generator.filteringQuality : -1;
    }

    public set filteringQuality(filteringQuality: number) {
        this._getActiveCascades().forEach((cascade) => cascade.generator.filteringQuality = filteringQuality);
    }

    public get contactHardeningLightSizeUVRatio(): number {
        return this._activeCascade >= 0 && this._activeCascade < this._cascades.length ? this._cascades[this._activeCascade].generator.contactHardeningLightSizeUVRatio : -1;
    }

    public set contactHardeningLightSizeUVRatio(contactHardeningLightSizeUVRatio: number) {
        this._getActiveCascades().forEach((cascade) => cascade.generator.contactHardeningLightSizeUVRatio = contactHardeningLightSizeUVRatio);
    }

    public get darkness() {
        return this._activeCascade >= 0 && this._activeCascade < this._cascades.length ? this._cascades[this._activeCascade].generator.darkness : -1;
    }

    public set darkness(value: number) {
        this._getActiveCascades().forEach((cascade) => cascade.generator.darkness = value);
    }

    public get transparencyShadow() {
        return this._activeCascade >= 0 && this._activeCascade < this._cascades.length ? this._cascades[this._activeCascade].generator.transparencyShadow : false;
    }

    public set transparencyShadow(value: boolean) {
        this._getActiveCascades().forEach((cascade) => cascade.generator.transparencyShadow = value);
    }

    public get forceBackFacesOnly(): boolean {
        return this._activeCascade >= 0 && this._activeCascade < this._cascades.length ? this._cascades[this._activeCascade].generator.forceBackFacesOnly : false;
    }

    public set forceBackFacesOnly(value: boolean) {
        this._getActiveCascades().forEach((cascade) => cascade.generator.forceBackFacesOnly = value);
    }

    public get depthClamp(): boolean {
        return this._activeCascade >= 0 && this._activeCascade < this._cascades.length ? this._cascades[this._activeCascade].generator.depthClamp : false;
    }

    public set depthClamp(value: boolean) {
        this._getActiveCascades().forEach((cascade) => cascade.generator.depthClamp = value);
    }

    public get viewMatrix(): Nullable<Matrix> {
        return this._activeCascade >= 0 && this._activeCascade < this._cascades.length ? this._cascades[this._activeCascade].generator.viewMatrix : null;
    }

    public getClassName(): string {
        return "CSMShadowGenerator";
    }

    public addShadowCaster(mesh: AbstractMesh, includeDescendants = true): CSMShadowGenerator {
        this._renderList.push(mesh);

        if (includeDescendants) {
            this._renderList.push(...mesh.getChildMeshes());
        }

        return this;
    }

    public removeShadowCaster(mesh: AbstractMesh, includeDescendants = true): CSMShadowGenerator {
        const index = this._renderList.indexOf(mesh);

        if (index !== -1) {
            this._renderList.splice(index, 1);
        }

        if (includeDescendants) {
            for (let child of mesh.getChildren()) {
                this.removeShadowCaster(<any>child);
            }
        }

        return this;
    }

    protected _getActiveCascades(): Array<ICascade> {
        return  this._activeCascade === CSMShadowGenerator.CASCADE_ALL ? this._cascades :
                this._activeCascade >= 0 && this._activeCascade < this._cascades.length ? [this._cascades[this._activeCascade]] : [];
    }

    protected _light: IShadowLight;

    public getLight(): IShadowLight {
        return this._light;
    }

    protected _scene: Scene;
    protected _mapSize: number;
    protected _usefulFloatFirst: boolean | undefined;

    constructor(mapSize: number, light: IShadowLight, numCascades: number = 4, usefulFloatFirst?: boolean) {
        if (numCascades < 1) {
            numCascades = 1;
        }

        this._cascades = [];
        this._activeCascade = CSMShadowGenerator.CASCADE_ALL;
        this._renderList = [];
        this._numCascades = numCascades;
        this._lambda = 0.5;
        this._minDistance = 0;
        this._maxDistance = 1;
        this._stabilizeCascades = false;
        this._useRightDirectionAsUpForOrthoProj = false;
        this._shadowCastersBoundingInfo = new BoundingInfo(new Vector3(0, 0, 0), new Vector3(0, 0, 0));

        this._mapSize = mapSize;
        this._usefulFloatFirst = usefulFloatFirst;
        this._light = light;
        this._scene = light.getScene();

        ShadowGenerator._SceneComponentInitialization(this._scene);

        this.freezeShadowCastersBoundingInfo = false;

        this._initializeGenerator();
    }

    protected _initializeGenerator(): void {
        this._light._markMeshesAsLightDirty();
        this._initializeCSM();
    }

    protected _initializeCSM(): void {
        this._cascades = [];
        for (let cascadeIndex = 0; cascadeIndex < this._numCascades; ++cascadeIndex) {
            const cascade: ICascade = {
                generator: new CSMShadowMap(this._mapSize, this._light, !!this._usefulFloatFirst, this),
                prevSplitDistance: 0,
                splitDistance: 0,
            };

            cascade.generator.cascade = cascade;
            cascade.generator.renderList = this._renderList;

            this._cascades.push(cascade);
        }

        if (this._activeCascade !== CSMShadowGenerator.CASCADE_ALL && this._activeCascade >= this._numCascades) {
            this._activeCascade = 0;
        }

        this._setDistanceSplit();
    }

    protected _setDistanceSplit(): void {
        let camera = this._scene.activeCamera;
        if (!camera) {
            return;
        }

        const near = camera.minZ,
              far = camera.maxZ,
              cameraRange = far - near;

        const minZ = near + this._minDistance * cameraRange,
              maxZ = near + this._maxDistance * cameraRange;

        const range = maxZ - minZ,
              ratio = maxZ / minZ;

        for (let cascadeIndex = 0; cascadeIndex < this._cascades.length; ++cascadeIndex) {
            const p = (cascadeIndex + 1) / this._numCascades,
                  log = minZ * (ratio ** p),
                  uniform = minZ + range * p;

            const d = this._lambda * (log - uniform) + uniform;

            this._cascades[cascadeIndex].prevSplitDistance = cascadeIndex === 0 ? this._minDistance : this._cascades[cascadeIndex - 1].splitDistance;
            this._cascades[cascadeIndex].splitDistance = (d - near) / cameraRange;
        }

    }

    protected _computeShadowCastersBoundingInfo(): void {
        const min = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE),
              max = new Vector3(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);

        for (let meshIndex = 0; meshIndex < this._renderList.length; meshIndex++) {
            const mesh = this._renderList[meshIndex];

            if (!mesh) {
                continue;
            }

            const boundingInfo = mesh.getBoundingInfo(),
                  boundingBox = boundingInfo.boundingBox;

            min.minimizeInPlace(boundingBox.minimumWorld);
            max.maximizeInPlace(boundingBox.maximumWorld);
        }

        this._shadowCastersBoundingInfo.reConstruct(min, max);
    }

    public get mustRender(): boolean {
        return this.renderList.length > 0;
    }

    isReady(subMesh: SubMesh, useInstances: boolean): boolean {
        let ready = true;

        for (let cascadeIndex = 0; cascadeIndex < this._cascades.length && ready; ++cascadeIndex) {
            ready = ready && this._cascades[cascadeIndex].generator.isReady(subMesh, useInstances);
        }

        return ready;
    }

    getShadowMaps(): Array<RenderTargetTexture> {
        const rttList: Array<RenderTargetTexture> = [];

        for (let cascadeIndex = 0; cascadeIndex < this._cascades.length; ++cascadeIndex) {
            const cascade = this._cascades[cascadeIndex],
                  rtt = cascade.generator.getShadowMap();

            if (rtt) {
                rttList.push(rtt);
            }
        }

        return rttList;
    }

    prepareDefines(defines: MaterialDefines, lightIndex: number): void {
        // todo. For the time being, only the first shadow map is sampled
        this._cascades[0].generator.prepareDefines(defines, lightIndex);
    }

    bindShadowLight(lightIndex: string, effect: Effect): void {
        // todo. For the time being, only the first shadow map is sampled
        this._cascades[0].generator.bindShadowLight(lightIndex, effect);
    }

    recreate(): void {
        for (let cascadeIndex = 0; cascadeIndex < this._cascades.length; ++cascadeIndex) {
            this._cascades[cascadeIndex].generator.recreate();
        }
    }

    forceCompilation(onCompiled?: (generator: ShadowGenerator) => void, options?: Partial<{ useInstances: boolean }>): void {
        // todo
    }

    forceCompilationAsync(options?: Partial<{ useInstances: boolean }>): Promise<void> {
        // todo
        return Promise.resolve();
    }

    serialize(): any {
        // todo
    }

    dispose(): void {
        for (let cascadeIndex = 0; cascadeIndex < this._cascades.length; ++cascadeIndex) {
            this._cascades[cascadeIndex].generator.dispose();
        }
        this._cascades = [];
        this._numCascades = 0;
        if (this._freezeShadowCastersBoundingInfoObservable) {
            this._scene.onBeforeRenderObservable.remove(this._freezeShadowCastersBoundingInfoObservable);
            this._freezeShadowCastersBoundingInfoObservable = null;
        }
    }

}