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
        }

        _owner: Group2D;
        _modelCache: ModelRenderCache;
        _partIndexFromId: StringDictionary<number>;
        _instancesPartsData: DynamicFloatArray[];
        _dirtyInstancesData: boolean;
        _instancesPartsBuffer: WebGLBuffer[];
        _instancesPartsBufferSize: number[];
    }

    export class ModelRenderCache {
        constructor() {
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

        protected loadInstancingAttributes(partId: number, effect: Effect): InstancingAttributeInfo[] {
            for (var i = 0; i < this._partIdList.length; i++) {
                if (this._partIdList[i] === partId) {
                    break;
                }
            }
            if (i === this._partIdList.length) {
                return null;
            }

            var ci = this._partsClassInfo[i];
            var categories = this._partsUsedCategories[i];
            let res = ci.classContent.getInstancingAttributeInfos(effect, categories);

            return res;
        }

        _instancesData: StringDictionary<InstanceDataBase[]>;

        private _nextKey: number;
        _partIdList: number[];
        _partsDataStride: number[];
        _partsUsedCategories: Array<string[]>;
        _partsClassInfo: ClassTreeInfo<InstanceClassInfo, InstancePropInfo>[];
    }
}