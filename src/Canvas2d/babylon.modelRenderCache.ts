module BABYLON {
    export const enum ShaderDataType {
        Vector2, Vector3, Vector4, Matrix, float, Color3, Color4
    }

    export class GroupInstanceInfo {
        constructor(owner: Group2D, classTreeInfo: ClassTreeInfo<InstanceClassInfo, InstancePropInfo>, cache: ModelRenderCacheBase) {
            this._owner = owner;
            this._classTreeInfo = classTreeInfo;
            this._modelCache = cache;
        }

        _owner: Group2D;
        _classTreeInfo: ClassTreeInfo<InstanceClassInfo, InstancePropInfo>;
        _modelCache: ModelRenderCacheBase;
        _instancesData: DynamicFloatArray;
        _dirtyInstancesData: boolean;
        _instancesBuffer: WebGLBuffer;
        _instancesBufferSize: number;
    }

    export class ModelRenderCacheBase {
        /**
         * Render the model instances
         * @param instanceInfo
         * @param context
         * @return must return true is the rendering succeed, false if the rendering couldn't be done (asset's not yet ready, like Effect)
         */
        render(instanceInfo: GroupInstanceInfo, context: Render2DContext): boolean {
            return true;
        }
    }

    export class ModelRenderCache<TInstData> extends ModelRenderCacheBase {

        constructor() {
            super();
            this._nextKey = 1;
            this._instancesData = new StringDictionary<TInstData>();
        }

        addInstanceData(data: TInstData): string {
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

        _instancesData: StringDictionary<TInstData>;

        private _nextKey: number;
    }

}