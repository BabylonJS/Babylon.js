var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var GroupInstanceInfo = (function () {
        function GroupInstanceInfo(owner, mrc, partCount) {
            this._partCount = partCount;
            this.owner = owner;
            this.modelRenderCache = mrc;
            this.modelRenderCache.addRef();
            this.partIndexFromId = new BABYLON.StringDictionary();
            this._usedShaderCategories = new Array(partCount);
            this._strides = new Array(partCount);
            this._opaqueData = null;
            this._alphaTestData = null;
            this._transparentData = null;
            this.opaqueDirty = this.alphaTestDirty = this.transparentDirty = this.transparentOrderDirty = false;
        }
        GroupInstanceInfo.prototype.dispose = function () {
            if (this._isDisposed) {
                return false;
            }
            if (this.modelRenderCache) {
                this.modelRenderCache.dispose();
            }
            var engine = this.owner.owner.engine;
            if (this.opaqueData) {
                this.opaqueData.forEach(function (d) { return d.dispose(engine); });
                this.opaqueData = null;
            }
            this.partIndexFromId = null;
            this._isDisposed = true;
            return true;
        };
        Object.defineProperty(GroupInstanceInfo.prototype, "hasOpaqueData", {
            get: function () {
                return this._opaqueData != null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GroupInstanceInfo.prototype, "hasAlphaTestData", {
            get: function () {
                return this._alphaTestData != null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GroupInstanceInfo.prototype, "hasTransparentData", {
            get: function () {
                return this._transparentData != null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GroupInstanceInfo.prototype, "opaqueData", {
            get: function () {
                if (!this._opaqueData) {
                    this._opaqueData = new Array(this._partCount);
                    for (var i = 0; i < this._partCount; i++) {
                        this._opaqueData[i] = new GroupInfoPartData(this._strides[i]);
                    }
                }
                return this._opaqueData;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GroupInstanceInfo.prototype, "alphaTestData", {
            get: function () {
                if (!this._alphaTestData) {
                    this._alphaTestData = new Array(this._partCount);
                    for (var i = 0; i < this._partCount; i++) {
                        this._alphaTestData[i] = new GroupInfoPartData(this._strides[i]);
                    }
                }
                return this._alphaTestData;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GroupInstanceInfo.prototype, "transparentData", {
            get: function () {
                if (!this._transparentData) {
                    this._transparentData = new Array(this._partCount);
                    for (var i = 0; i < this._partCount; i++) {
                        var zoff = this.modelRenderCache._partData[i]._zBiasOffset;
                        this._transparentData[i] = new TransparentGroupInfoPartData(this._strides[i], zoff);
                    }
                }
                return this._transparentData;
            },
            enumerable: true,
            configurable: true
        });
        GroupInstanceInfo.prototype.sortTransparentData = function () {
            if (!this.transparentOrderDirty) {
                return;
            }
            for (var i = 0; i < this._transparentData.length; i++) {
                var td = this._transparentData[i];
                td._partData.sort();
            }
            this.transparentOrderDirty = false;
        };
        Object.defineProperty(GroupInstanceInfo.prototype, "usedShaderCategories", {
            get: function () {
                return this._usedShaderCategories;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GroupInstanceInfo.prototype, "strides", {
            get: function () {
                return this._strides;
            },
            enumerable: true,
            configurable: true
        });
        return GroupInstanceInfo;
    })();
    BABYLON.GroupInstanceInfo = GroupInstanceInfo;
    var TransparentSegment = (function () {
        function TransparentSegment() {
            this.groupInsanceInfo = null;
            this.startZ = 0;
            this.endZ = 0;
            this.startDataIndex = 0;
            this.endDataIndex = 0;
            this.partBuffers = null;
        }
        TransparentSegment.prototype.dispose = function (engine) {
            if (this.partBuffers) {
                this.partBuffers.forEach(function (b) { return engine._releaseBuffer(b); });
                this.partBuffers.splice(0);
                this.partBuffers = null;
            }
        };
        return TransparentSegment;
    })();
    BABYLON.TransparentSegment = TransparentSegment;
    var GroupInfoPartData = (function () {
        function GroupInfoPartData(stride) {
            this._partData = null;
            this._partBuffer = null;
            this._partBufferSize = 0;
            this._partData = new BABYLON.DynamicFloatArray(stride / 4, 50);
            this._isDisposed = false;
        }
        GroupInfoPartData.prototype.dispose = function (engine) {
            if (this._isDisposed) {
                return false;
            }
            if (this._partBuffer) {
                engine._releaseBuffer(this._partBuffer);
                this._partBuffer = null;
            }
            this._partData = null;
            this._isDisposed = true;
        };
        return GroupInfoPartData;
    })();
    BABYLON.GroupInfoPartData = GroupInfoPartData;
    var TransparentGroupInfoPartData = (function (_super) {
        __extends(TransparentGroupInfoPartData, _super);
        function TransparentGroupInfoPartData(stride, zoff) {
            _super.call(this, stride);
            this._partData.compareValueOffset = zoff;
            this._partData.sortingAscending = false;
        }
        return TransparentGroupInfoPartData;
    })(GroupInfoPartData);
    BABYLON.TransparentGroupInfoPartData = TransparentGroupInfoPartData;
    var ModelRenderCache = (function () {
        function ModelRenderCache(engine, modelKey) {
            this._engine = engine;
            this._modelKey = modelKey;
            this._nextKey = 1;
            this._refCounter = 1;
            this._partData = null;
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
        ModelRenderCache.prototype.getPartIndexFromId = function (partId) {
            for (var i = 0; i < this._partData.length; i++) {
                if (this._partData[i]._partId === partId) {
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
            var categories = this._partData[i]._partUsedCategories;
            var res = ci.classContent.getInstancingAttributeInfos(effect, categories);
            return res;
        };
        ModelRenderCache.prototype.setupUniforms = function (effect, partIndex, data, elementCount) {
            var pd = this._partData[partIndex];
            var offset = (pd._partDataStride / 4) * elementCount;
            var pci = this._partsClassInfo[partIndex];
            var self = this;
            pci.fullContent.forEach(function (k, v) {
                if (!v.category || pd._partUsedCategories.indexOf(v.category) !== -1) {
                    switch (v.dataType) {
                        case 4 /* float */:
                            {
                                var attribOffset = v.instanceOffset.get(pd._partJoinedUsedCategories);
                                effect.setFloat(v.attributeName, data.buffer[offset + attribOffset]);
                                break;
                            }
                        case 0 /* Vector2 */:
                            {
                                var attribOffset = v.instanceOffset.get(pd._partJoinedUsedCategories);
                                ModelRenderCache.v2.x = data.buffer[offset + attribOffset + 0];
                                ModelRenderCache.v2.y = data.buffer[offset + attribOffset + 1];
                                effect.setVector2(v.attributeName, ModelRenderCache.v2);
                                break;
                            }
                        case 5 /* Color3 */:
                        case 1 /* Vector3 */:
                            {
                                var attribOffset = v.instanceOffset.get(pd._partJoinedUsedCategories);
                                ModelRenderCache.v3.x = data.buffer[offset + attribOffset + 0];
                                ModelRenderCache.v3.y = data.buffer[offset + attribOffset + 1];
                                ModelRenderCache.v3.z = data.buffer[offset + attribOffset + 2];
                                effect.setVector3(v.attributeName, ModelRenderCache.v3);
                                break;
                            }
                        case 6 /* Color4 */:
                        case 2 /* Vector4 */:
                            {
                                var attribOffset = v.instanceOffset.get(pd._partJoinedUsedCategories);
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
    })();
    BABYLON.ModelRenderCache = ModelRenderCache;
    var ModelRenderCachePartData = (function () {
        function ModelRenderCachePartData() {
        }
        return ModelRenderCachePartData;
    })();
    BABYLON.ModelRenderCachePartData = ModelRenderCachePartData;
})(BABYLON || (BABYLON = {}));
