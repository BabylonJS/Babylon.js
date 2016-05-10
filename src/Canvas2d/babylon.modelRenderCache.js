var BABYLON;
(function (BABYLON) {
    var GroupInstanceInfo = (function () {
        function GroupInstanceInfo(owner, cache) {
            this._owner = owner;
            this._modelCache = cache;
            this._modelCache.addRef();
            this._instancesPartsData = new Array();
            this._instancesPartsBuffer = new Array();
            this._instancesPartsBufferSize = new Array();
            this._partIndexFromId = new BABYLON.StringDictionary();
            this._instancesPartsUsedShaderCategories = new Array();
        }
        GroupInstanceInfo.prototype.dispose = function () {
            if (this._isDisposed) {
                return false;
            }
            if (this._modelCache) {
                this._modelCache.dispose();
            }
            var engine = this._owner.owner.engine;
            if (this._instancesPartsBuffer) {
                this._instancesPartsBuffer.forEach(function (b) {
                    engine._releaseBuffer(b);
                });
            }
            this._partIndexFromId = null;
            this._instancesPartsData = null;
            this._instancesPartsBufferSize = null;
            this._instancesPartsUsedShaderCategories = null;
            return true;
        };
        return GroupInstanceInfo;
    }());
    BABYLON.GroupInstanceInfo = GroupInstanceInfo;
    var ModelRenderCache = (function () {
        function ModelRenderCache(engine, modelKey, isTransparent) {
            this._engine = engine;
            this._modelKey = modelKey;
            this._isTransparent = isTransparent;
            this._nextKey = 1;
            this._refCounter = 1;
            this._instancesData = new BABYLON.StringDictionary();
        }
        ModelRenderCache.prototype.dispose = function () {
            if (--this._refCounter !== 0) {
                return false;
            }
            // Remove the Model Render Cache from the global dictionary
            var edata = this._engine.getExternalData("__BJSCANVAS2D__");
            if (edata) {
                edata.DisposeModelRenderCache(this);
            }
            return true;
        };
        Object.defineProperty(ModelRenderCache.prototype, "isDisposed", {
            get: function () {
                return this._refCounter <= 0;
            },
            enumerable: true,
            configurable: true
        });
        ModelRenderCache.prototype.addRef = function () {
            return ++this._refCounter;
        };
        Object.defineProperty(ModelRenderCache.prototype, "modelKey", {
            get: function () {
                return this._modelKey;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Render the model instances
         * @param instanceInfo
         * @param context
         * @return must return true is the rendering succeed, false if the rendering couldn't be done (asset's not yet ready, like Effect)
         */
        ModelRenderCache.prototype.render = function (instanceInfo, context) {
            return true;
        };
        ModelRenderCache.prototype.addInstanceDataParts = function (data) {
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
        ModelRenderCache.prototype.getPartIndexFromId = function (partId) {
            for (var i = 0; i < this._partIdList.length; i++) {
                if (this._partIdList[i] === partId) {
                    return i;
                }
            }
            return null;
        };
        ModelRenderCache.prototype.loadInstancingAttributes = function (partId, effect) {
            var i = this.getPartIndexFromId(partId);
            if (i === null) {
                return null;
            }
            var ci = this._partsClassInfo[i];
            var categories = this._partsUsedCategories[i];
            var res = ci.classContent.getInstancingAttributeInfos(effect, categories);
            return res;
        };
        ModelRenderCache.prototype.setupUniforms = function (effect, partIndex, data, elementCount) {
            var offset = (this._partsDataStride[partIndex] / 4) * elementCount;
            var pci = this._partsClassInfo[partIndex];
            var self = this;
            pci.fullContent.forEach(function (k, v) {
                if (!v.category || self._partsUsedCategories[partIndex].indexOf(v.category) !== 1) {
                    switch (v.dataType) {
                        case 4 /* float */:
                            {
                                var attribOffset = v.instanceOffset.get(self._partsJoinedUsedCategories[partIndex]);
                                effect.setFloat(v.attributeName, data.buffer[offset + attribOffset]);
                                break;
                            }
                        case 0 /* Vector2 */:
                            {
                                var attribOffset = v.instanceOffset.get(self._partsJoinedUsedCategories[partIndex]);
                                ModelRenderCache.v2.x = data.buffer[offset + attribOffset + 0];
                                ModelRenderCache.v2.y = data.buffer[offset + attribOffset + 1];
                                effect.setVector2(v.attributeName, ModelRenderCache.v2);
                                break;
                            }
                        case 5 /* Color3 */:
                        case 1 /* Vector3 */:
                            {
                                var attribOffset = v.instanceOffset.get(self._partsJoinedUsedCategories[partIndex]);
                                ModelRenderCache.v3.x = data.buffer[offset + attribOffset + 0];
                                ModelRenderCache.v3.y = data.buffer[offset + attribOffset + 1];
                                ModelRenderCache.v3.z = data.buffer[offset + attribOffset + 2];
                                effect.setVector3(v.attributeName, ModelRenderCache.v3);
                                break;
                            }
                        case 6 /* Color4 */:
                        case 2 /* Vector4 */:
                            {
                                var attribOffset = v.instanceOffset.get(self._partsJoinedUsedCategories[partIndex]);
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
        };
        Object.defineProperty(ModelRenderCache.prototype, "isTransparent", {
            get: function () {
                return this._isTransparent;
            },
            enumerable: true,
            configurable: true
        });
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
        ModelRenderCache.v2 = BABYLON.Vector2.Zero();
        ModelRenderCache.v3 = BABYLON.Vector3.Zero();
        ModelRenderCache.v4 = BABYLON.Vector4.Zero();
        return ModelRenderCache;
    }());
    BABYLON.ModelRenderCache = ModelRenderCache;
})(BABYLON || (BABYLON = {}));
