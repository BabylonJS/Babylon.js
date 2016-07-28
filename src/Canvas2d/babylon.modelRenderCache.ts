module BABYLON {
    export const enum ShaderDataType {
        Vector2, Vector3, Vector4, Matrix, float, Color3, Color4, Size
    }

    export class GroupInstanceInfo {
        constructor(owner: Group2D, mrc: ModelRenderCache, partCount: number) {
            this._partCount = partCount;
            this.owner = owner;
            this.modelRenderCache = mrc;
            this.modelRenderCache.addRef();
            this.partIndexFromId = new StringDictionary<number>();
            this._usedShaderCategories = new Array<string>(partCount);
            this._strides = new Array<number>(partCount);
            this._opaqueData = null;
            this._alphaTestData = null;
            this._transparentData = null;
            this.opaqueDirty = this.alphaTestDirty = this.transparentDirty = this.transparentOrderDirty = false;
        }

        public dispose(): boolean {
            if (this._isDisposed) {
                return false;
            }

            if (this.modelRenderCache) {
                this.modelRenderCache.dispose();
            }

            let engine = this.owner.owner.engine;

            if (this.opaqueData) {
                this.opaqueData.forEach(d => d.dispose(engine));
                this.opaqueData = null;
            }

            this.partIndexFromId = null;
            this._isDisposed = true;
            return true;
        }

        private _isDisposed: boolean;
        owner: Group2D;

        modelRenderCache: ModelRenderCache;
        partIndexFromId: StringDictionary<number>;

        get hasOpaqueData(): boolean {
            return this._opaqueData != null;
        }

        get hasAlphaTestData(): boolean {
            return this._alphaTestData != null;
        }

        get hasTransparentData(): boolean {
            return this._transparentData != null;
        }

        opaqueDirty: boolean;
        get opaqueData(): GroupInfoPartData[] {
            if (!this._opaqueData) {
                this._opaqueData = new Array<GroupInfoPartData>(this._partCount);
                for (let i = 0; i < this._partCount; i++) {
                    this._opaqueData[i] = new GroupInfoPartData(this._strides[i]);
                }
            }
            return this._opaqueData;
        }

        alphaTestDirty: boolean;
        get alphaTestData(): GroupInfoPartData[] {
            if (!this._alphaTestData) {
                this._alphaTestData = new Array<GroupInfoPartData>(this._partCount);
                for (let i = 0; i < this._partCount; i++) {
                    this._alphaTestData[i] = new GroupInfoPartData(this._strides[i]);
                }
            }
            return this._alphaTestData;
        }

        transparentOrderDirty: boolean;
        transparentDirty: boolean;
        get transparentData(): TransparentGroupInfoPartData[] {
            if (!this._transparentData) {
                this._transparentData = new Array<TransparentGroupInfoPartData>(this._partCount);
                for (let i = 0; i < this._partCount; i++) {
                    let zoff = this.modelRenderCache._partData[i]._zBiasOffset;
                    this._transparentData[i] = new TransparentGroupInfoPartData(this._strides[i], zoff);
                }
            }
            return this._transparentData;
        }

        sortTransparentData() {
            if (!this.transparentOrderDirty) {
                return;
            }

            for (let i = 0; i < this._transparentData.length; i++) {
                let td = this._transparentData[i];
                td._partData.sort();

            }

            this.transparentOrderDirty = false;
        }

        get usedShaderCategories(): string[] {
            return this._usedShaderCategories;
        }

        get strides(): number[] {
            return this._strides;
        }

        private _partCount: number;
        private _strides: number[];
        private _usedShaderCategories: string[];
        private _opaqueData: GroupInfoPartData[];
        private _alphaTestData: GroupInfoPartData[];
        private _transparentData: TransparentGroupInfoPartData[];
    }

    export class TransparentSegment {
        constructor() {
            this.groupInsanceInfo = null;
            this.startZ = 0;
            this.endZ = 0;
            this.startDataIndex = 0;
            this.endDataIndex = 0;
            this.partBuffers = null;
        }

        dispose(engine: Engine) {
            if (this.partBuffers) {
                this.partBuffers.forEach(b => engine._releaseBuffer(b));
                this.partBuffers.splice(0);
                this.partBuffers = null;
            }
        }

        groupInsanceInfo: GroupInstanceInfo;
        startZ: number;
        endZ: number;
        startDataIndex: number;
        endDataIndex: number;
        partBuffers: WebGLBuffer[];
    }

    export class GroupInfoPartData {
        _partData: DynamicFloatArray = null;
        _partBuffer: WebGLBuffer     = null;
        _partBufferSize: number      = 0;

        constructor(stride: number) {
            this._partData = new DynamicFloatArray(stride/4, 50);
            this._isDisposed = false;
        }

        public dispose(engine: Engine): boolean {
            if (this._isDisposed) {
                return false;
            }

            if (this._partBuffer) {
                engine._releaseBuffer(this._partBuffer);
                this._partBuffer = null;
            }

            this._partData = null;

            this._isDisposed = true;
        }

        private _isDisposed: boolean;        
    }

    export class TransparentGroupInfoPartData extends GroupInfoPartData {
        constructor(stride: number, zoff: number) {
            super(stride);
            this._partData.compareValueOffset = zoff;
            this._partData.sortingAscending = false;
        }
        
    }

    export class ModelRenderCache {
        constructor(engine: Engine, modelKey: string) {
            this._engine = engine;
            this._modelKey = modelKey;
            this._nextKey = 1;
            this._refCounter = 1;
            this._partData = null;
        }

        public dispose(): boolean {
            if (--this._refCounter !== 0) {
                return false;
            }

            // Remove the Model Render Cache from the global dictionary
            let edata = this._engine.getExternalData<Canvas2DEngineBoundData>("__BJSCANVAS2D__");
            if (edata) {
                edata.DisposeModelRenderCache(this);
            }

            return true;
        }

        public get isDisposed(): boolean {
            return this._refCounter <= 0;
        }

        public addRef(): number {
            return ++this._refCounter;
        }

        public get modelKey(): string {
            return this._modelKey;
        }

        /**
         * Render the model instances
         * @param instanceInfo
         * @param context
         * @return must return true is the rendering succeed, false if the rendering couldn't be done (asset's not yet ready, like Effect)
         */
        render(instanceInfo: GroupInstanceInfo, context: Render2DContext): boolean {
            return true;
        }

        protected getPartIndexFromId(partId: number) {
            for (var i = 0; i < this._partData.length; i++) {
                if (this._partData[i]._partId === partId) {
                    return i;
                }
            }
            return null;
        }

        protected loadInstancingAttributes(partId: number, effect: Effect): InstancingAttributeInfo[] {
            let i = this.getPartIndexFromId(partId);
            if (i === null) {
                return null;
            }

            var ci = this._partsClassInfo[i];
            var categories = this._partData[i]._partUsedCategories;
            let res = ci.classContent.getInstancingAttributeInfos(effect, categories);

            return res;
        }

        //setupUniformsLocation(effect: Effect, uniforms: string[], partId: number) {
        //    let i = this.getPartIndexFromId(partId);
        //    if (i === null) {
        //        return null;
        //    }

        //    let pci = this._partsClassInfo[i];
        //    pci.fullContent.forEach((k, v) => {
        //        if (uniforms.indexOf(v.attributeName) !== -1) {
        //            v.uniformLocation = effect.getUniform(v.attributeName);
        //        }
        //    });
        //}

        private static v2 = Vector2.Zero();
        private static v3 = Vector3.Zero();
        private static v4 = Vector4.Zero();

        protected setupUniforms(effect: Effect, partIndex: number, data: DynamicFloatArray, elementCount: number) {
            let pd = this._partData[partIndex];
            let offset = (pd._partDataStride/4) * elementCount;
            let pci = this._partsClassInfo[partIndex];

            let self = this;
            pci.fullContent.forEach((k, v) => {
                if (!v.category || pd._partUsedCategories.indexOf(v.category) !== -1) {
                    switch (v.dataType) {
                        case ShaderDataType.float:
                        {
                            let attribOffset = v.instanceOffset.get(pd._partJoinedUsedCategories);
                            effect.setFloat(v.attributeName, data.buffer[offset + attribOffset]);
                            break;
                        }
                        case ShaderDataType.Vector2:
                        {
                            let attribOffset = v.instanceOffset.get(pd._partJoinedUsedCategories);
                            ModelRenderCache.v2.x = data.buffer[offset + attribOffset + 0];
                            ModelRenderCache.v2.y = data.buffer[offset + attribOffset + 1];
                            effect.setVector2(v.attributeName, ModelRenderCache.v2);
                            break;
                        }
                        case ShaderDataType.Color3:
                        case ShaderDataType.Vector3:
                        {
                            let attribOffset = v.instanceOffset.get(pd._partJoinedUsedCategories);
                            ModelRenderCache.v3.x = data.buffer[offset + attribOffset + 0];
                            ModelRenderCache.v3.y = data.buffer[offset + attribOffset + 1];
                            ModelRenderCache.v3.z = data.buffer[offset + attribOffset + 2];
                            effect.setVector3(v.attributeName, ModelRenderCache.v3);
                            break;
                        }
                        case ShaderDataType.Color4:
                        case ShaderDataType.Vector4:
                        {
                            let attribOffset = v.instanceOffset.get(pd._partJoinedUsedCategories);
                            ModelRenderCache.v4.x = data.buffer[offset + attribOffset + 0];
                            ModelRenderCache.v4.y = data.buffer[offset + attribOffset + 1];
                            ModelRenderCache.v4.z = data.buffer[offset + attribOffset + 2];
                            ModelRenderCache.v4.w = data.buffer[offset + attribOffset + 3];
                            effect.setVector4(v.attributeName, ModelRenderCache.v4);
                            break;
                        }
                        default:
                    }
                }
            });
        }

        protected _engine: Engine;
        private _modelKey: string;
        private _nextKey: number;
        private _refCounter: number;

        _partData: ModelRenderCachePartData[];
        _partsClassInfo: ClassTreeInfo<InstanceClassInfo, InstancePropInfo>[];
    }

    export class ModelRenderCachePartData {
        _partId: number;
        _zBiasOffset: number;
        _partDataStride: number;
        _partUsedCategories: string[];
        _partJoinedUsedCategories: string;
    }
}