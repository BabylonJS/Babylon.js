module BABYLON {
    export const enum ShaderDataType {
        Vector2, Vector3, Vector4, Matrix, float, Color3, Color4
    }

    export class GroupInstanceInfo {
        constructor(owner: Group2D, cache: ModelRenderCache) {
            this._owner = owner;
            this._modelCache = cache;
            this._instancesPartsData = new Array<DynamicFloatArray>();
            this._instancesPartsBuffer = new Array<WebGLBuffer>();
            this._instancesPartsBufferSize = new Array<number>();
            this._partIndexFromId = new StringDictionary<number>();
            this._instancesPartsUsedShaderCategories = new Array<string>();
        }

        _owner: Group2D;
        _modelCache: ModelRenderCache;
        _partIndexFromId: StringDictionary<number>;
        _instancesPartsData: DynamicFloatArray[];
        _dirtyInstancesData: boolean;
        _instancesPartsBuffer: WebGLBuffer[];
        _instancesPartsBufferSize: number[];
        _instancesPartsUsedShaderCategories: string[];
    }

    export class ModelRenderCache {
        constructor(modelKey: string, isTransparent: boolean) {
            this._modelKey = modelKey;
            this._isTransparent = isTransparent;
            this._nextKey = 1;
            this._instancesData = new StringDictionary<InstanceDataBase[]>();
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

        addInstanceDataParts(data: InstanceDataBase[]): string {
            let key = this._nextKey.toString();

            if (!this._instancesData.add(key, data)) {
                throw Error(`Key: ${key} is already allocated`);
            }

            ++this._nextKey;

            return key;
        }

        removeInstanceData(key: string) {
            this._instancesData.remove(key);
        }

        protected getPartIndexFromId(partId: number) {
            for (var i = 0; i < this._partIdList.length; i++) {
                if (this._partIdList[i] === partId) {
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
            var categories = this._partsUsedCategories[i];
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
            let offset = (this._partsDataStride[partIndex]/4) * elementCount;
            let pci = this._partsClassInfo[partIndex];

            let self = this;
            pci.fullContent.forEach((k, v) => {
                if (!v.category || self._partsUsedCategories[partIndex].indexOf(v.category)!==1) {
                    switch (v.dataType) {
                        case ShaderDataType.float:
                        {
                            let attribOffset = v.instanceOffset.get(self._partsJoinedUsedCategories[partIndex]);
                            effect.setFloat(v.attributeName, data.buffer[offset + attribOffset]);
                            break;
                        }
                        case ShaderDataType.Vector2:
                        {
                            let attribOffset = v.instanceOffset.get(self._partsJoinedUsedCategories[partIndex]);
                            ModelRenderCache.v2.x = data.buffer[offset + attribOffset + 0];
                            ModelRenderCache.v2.y = data.buffer[offset + attribOffset + 1];
                            effect.setVector2(v.attributeName, ModelRenderCache.v2);
                            break;
                        }
                        case ShaderDataType.Color3:
                        case ShaderDataType.Vector3:
                        {
                            let attribOffset = v.instanceOffset.get(self._partsJoinedUsedCategories[partIndex]);
                            ModelRenderCache.v3.x = data.buffer[offset + attribOffset + 0];
                            ModelRenderCache.v3.y = data.buffer[offset + attribOffset + 1];
                            ModelRenderCache.v3.z = data.buffer[offset + attribOffset + 2];
                            effect.setVector3(v.attributeName, ModelRenderCache.v3);
                            break;
                        }
                        case ShaderDataType.Color4:
                        case ShaderDataType.Vector4:
                        {
                            let attribOffset = v.instanceOffset.get(self._partsJoinedUsedCategories[partIndex]);
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

        private _modelKey: string;
        private _isTransparent: boolean;

        public get isTransparent() {
            return this._isTransparent;
        }

        _instancesData: StringDictionary<InstanceDataBase[]>;

        private _nextKey: number;
        _partIdList: number[];
        _partsDataStride: number[];
        _partsUsedCategories: Array<string[]>;
        _partsJoinedUsedCategories: string[];
        _partsClassInfo: ClassTreeInfo<InstanceClassInfo, InstancePropInfo>[];
    }
}