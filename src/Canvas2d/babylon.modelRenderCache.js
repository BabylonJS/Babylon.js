var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var GroupInstanceInfo = (function () {
        function GroupInstanceInfo(owner, classTreeInfo, cache) {
            this._owner = owner;
            this._classTreeInfo = classTreeInfo;
            this._modelCache = cache;
        }
        return GroupInstanceInfo;
    }());
    BABYLON.GroupInstanceInfo = GroupInstanceInfo;
    var ModelRenderCacheBase = (function () {
        function ModelRenderCacheBase() {
        }
        /**
         * Render the model instances
         * @param instanceInfo
         * @param context
         * @return must return true is the rendering succeed, false if the rendering couldn't be done (asset's not yet ready, like Effect)
         */
        ModelRenderCacheBase.prototype.render = function (instanceInfo, context) {
            return true;
        };
        return ModelRenderCacheBase;
    }());
    BABYLON.ModelRenderCacheBase = ModelRenderCacheBase;
    var ModelRenderCache = (function (_super) {
        __extends(ModelRenderCache, _super);
        function ModelRenderCache() {
            _super.call(this);
            this._nextKey = 1;
            this._instancesData = new BABYLON.StringDictionary();
        }
        ModelRenderCache.prototype.addInstanceData = function (data) {
            var key = this._nextKey.toString();
            if (!this._instancesData.add(key, data)) {
                throw Error("Key: " + key + " is already allocated");
            }
            ++this._nextKey;
            return key;
        };
        ModelRenderCache.prototype.removeInstanceData = function (key) {
            this._instancesData.remove(key);
        };
        return ModelRenderCache;
    }(ModelRenderCacheBase));
    BABYLON.ModelRenderCache = ModelRenderCache;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.modelRenderCache.js.map