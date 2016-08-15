var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var InstanceClassInfo = (function () {
        function InstanceClassInfo(base) {
            this._baseInfo = base;
            this._nextOffset = new BABYLON.StringDictionary();
            this._attributes = new Array();
        }
        InstanceClassInfo.prototype.mapProperty = function (propInfo, push) {
            var curOff = this._nextOffset.getOrAdd(InstanceClassInfo._CurCategories, 0);
            propInfo.instanceOffset.add(InstanceClassInfo._CurCategories, this._getBaseOffset(InstanceClassInfo._CurCategories) + curOff);
            //console.log(`[${InstanceClassInfo._CurCategories}] New PropInfo. Category: ${propInfo.category}, Name: ${propInfo.attributeName}, Offset: ${propInfo.instanceOffset.get(InstanceClassInfo._CurCategories)}, Size: ${propInfo.size / 4}`);
            this._nextOffset.set(InstanceClassInfo._CurCategories, curOff + (propInfo.size / 4));
            if (push) {
                this._attributes.push(propInfo);
            }
        };
        InstanceClassInfo.prototype.getInstancingAttributeInfos = function (effect, categories) {
            var catInline = ";" + categories.join(";") + ";";
            var res = new Array();
            var curInfo = this;
            while (curInfo) {
                for (var _i = 0, _a = curInfo._attributes; _i < _a.length; _i++) {
                    var attrib = _a[_i];
                    // Only map if there's no category assigned to the instance data or if there's a category and it's in the given list
                    if (!attrib.category || categories.indexOf(attrib.category) !== -1) {
                        var index = effect.getAttributeLocationByName(attrib.attributeName);
                        var iai = new BABYLON.InstancingAttributeInfo();
                        iai.index = index;
                        iai.attributeSize = attrib.size / 4; // attrib.size is in byte and we need to store in "component" (i.e float is 1, vec3 is 3)
                        iai.offset = attrib.instanceOffset.get(catInline) * 4; // attrib.instanceOffset is in float, iai.offset must be in bytes
                        iai.attributeName = attrib.attributeName;
                        res.push(iai);
                    }
                }
                curInfo = curInfo._baseInfo;
            }
            return res;
        };
        InstanceClassInfo.prototype.getShaderAttributes = function (categories) {
            var res = new Array();
            var curInfo = this;
            while (curInfo) {
                for (var _i = 0, _a = curInfo._attributes; _i < _a.length; _i++) {
                    var attrib = _a[_i];
                    // Only map if there's no category assigned to the instance data or if there's a category and it's in the given list
                    if (!attrib.category || categories.indexOf(attrib.category) !== -1) {
                        res.push(attrib.attributeName);
                    }
                }
                curInfo = curInfo._baseInfo;
            }
            return res;
        };
        InstanceClassInfo.prototype._getBaseOffset = function (categories) {
            var curOffset = 0;
            var curBase = this._baseInfo;
            while (curBase) {
                curOffset += curBase._nextOffset.getOrAdd(categories, 0);
                curBase = curBase._baseInfo;
            }
            return curOffset;
        };
        return InstanceClassInfo;
    })();
    BABYLON.InstanceClassInfo = InstanceClassInfo;
    var InstancePropInfo = (function () {
        function InstancePropInfo() {
            this.instanceOffset = new BABYLON.StringDictionary();
        }
        InstancePropInfo.prototype.setSize = function (val) {
            if (val instanceof BABYLON.Vector2) {
                this.size = 8;
                this.dataType = 0 /* Vector2 */;
                return;
            }
            if (val instanceof BABYLON.Vector3) {
                this.size = 12;
                this.dataType = 1 /* Vector3 */;
                return;
            }
            if (val instanceof BABYLON.Vector4) {
                this.size = 16;
                this.dataType = 2 /* Vector4 */;
                return;
            }
            if (val instanceof BABYLON.Matrix) {
                throw new Error("Matrix type is not supported by WebGL Instance Buffer, you have to use four Vector4 properties instead");
            }
            if (typeof (val) === "number") {
                this.size = 4;
                this.dataType = 4 /* float */;
                return;
            }
            if (val instanceof BABYLON.Color3) {
                this.size = 12;
                this.dataType = 5 /* Color3 */;
                return;
            }
            if (val instanceof BABYLON.Color4) {
                this.size = 16;
                this.dataType = 6 /* Color4 */;
                return;
            }
            if (val instanceof BABYLON.Size) {
                this.size = 8;
                this.dataType = 7 /* Size */;
                return;
            }
            return;
        };
        InstancePropInfo.prototype.writeData = function (array, offset, val) {
            switch (this.dataType) {
                case 0 /* Vector2 */:
                    {
                        var v = val;
                        array[offset + 0] = v.x;
                        array[offset + 1] = v.y;
                        break;
                    }
                case 1 /* Vector3 */:
                    {
                        var v = val;
                        array[offset + 0] = v.x;
                        array[offset + 1] = v.y;
                        array[offset + 2] = v.z;
                        break;
                    }
                case 2 /* Vector4 */:
                    {
                        var v = val;
                        array[offset + 0] = v.x;
                        array[offset + 1] = v.y;
                        array[offset + 2] = v.z;
                        array[offset + 3] = v.w;
                        break;
                    }
                case 5 /* Color3 */:
                    {
                        var v = val;
                        array[offset + 0] = v.r;
                        array[offset + 1] = v.g;
                        array[offset + 2] = v.b;
                        break;
                    }
                case 6 /* Color4 */:
                    {
                        var v = val;
                        array[offset + 0] = v.r;
                        array[offset + 1] = v.g;
                        array[offset + 2] = v.b;
                        array[offset + 3] = v.a;
                        break;
                    }
                case 4 /* float */:
                    {
                        var v = val;
                        array[offset] = v;
                        break;
                    }
                case 3 /* Matrix */:
                    {
                        var v = val;
                        for (var i = 0; i < 16; i++) {
                            array[offset + i] = v.m[i];
                        }
                        break;
                    }
                case 7 /* Size */:
                    {
                        var s = val;
                        array[offset + 0] = s.width;
                        array[offset + 1] = s.height;
                        break;
                    }
            }
        };
        return InstancePropInfo;
    })();
    BABYLON.InstancePropInfo = InstancePropInfo;
    function instanceData(category, shaderAttributeName) {
        return function (target, propName, descriptor) {
            var dic = BABYLON.ClassTreeInfo.getOrRegister(target, function (base) { return new InstanceClassInfo(base); });
            var node = dic.getLevelOf(target);
            var instanceDataName = propName;
            shaderAttributeName = shaderAttributeName || instanceDataName;
            var info = node.levelContent.get(instanceDataName);
            if (info) {
                throw new Error("The ID " + instanceDataName + " is already taken by another instance data");
            }
            info = new InstancePropInfo();
            info.attributeName = shaderAttributeName;
            info.category = category || null;
            if (info.category) {
                info.delimitedCategory = ";" + info.category + ";";
            }
            node.levelContent.add(instanceDataName, info);
            descriptor.get = function () {
                return null;
            };
            descriptor.set = function (val) {
                // Check that we're not trying to set a property that belongs to a category that is not allowed (current)
                // Quit if it's the case, otherwise we could overwrite data somewhere...
                if (info.category && InstanceClassInfo._CurCategories.indexOf(info.delimitedCategory) === -1) {
                    return;
                }
                if (!info.size) {
                    info.setSize(val);
                    node.classContent.mapProperty(info, true);
                }
                else if (!info.instanceOffset.contains(InstanceClassInfo._CurCategories)) {
                    node.classContent.mapProperty(info, false);
                }
                var obj = this;
                if (obj.dataBuffer && obj.dataElements) {
                    var offset = obj.dataElements[obj.curElement].offset + info.instanceOffset.get(InstanceClassInfo._CurCategories);
                    info.writeData(obj.dataBuffer.buffer, offset, val);
                }
            };
        };
    }
    BABYLON.instanceData = instanceData;
    var InstanceDataBase = (function () {
        function InstanceDataBase(partId, dataElementCount) {
            this.id = partId;
            this.curElement = 0;
            this._dataElementCount = dataElementCount;
            this.renderMode = 0;
            this.arrayLengthChanged = false;
        }
        Object.defineProperty(InstanceDataBase.prototype, "zBias", {
            get: function () {
                return null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(InstanceDataBase.prototype, "transformX", {
            get: function () {
                return null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(InstanceDataBase.prototype, "transformY", {
            get: function () {
                return null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(InstanceDataBase.prototype, "opacity", {
            get: function () {
                return null;
            },
            enumerable: true,
            configurable: true
        });
        InstanceDataBase.prototype.getClassTreeInfo = function () {
            if (!this.typeInfo) {
                this.typeInfo = BABYLON.ClassTreeInfo.get(Object.getPrototypeOf(this));
            }
            return this.typeInfo;
        };
        InstanceDataBase.prototype.allocElements = function () {
            if (!this.dataBuffer || this.dataElements) {
                return;
            }
            var res = new Array(this.dataElementCount);
            for (var i = 0; i < this.dataElementCount; i++) {
                res[i] = this.dataBuffer.allocElement();
            }
            this.dataElements = res;
        };
        InstanceDataBase.prototype.freeElements = function () {
            if (!this.dataElements) {
                return;
            }
            for (var _i = 0, _a = this.dataElements; _i < _a.length; _i++) {
                var ei = _a[_i];
                this.dataBuffer.freeElement(ei);
            }
            this.dataElements = null;
        };
        Object.defineProperty(InstanceDataBase.prototype, "dataElementCount", {
            get: function () {
                return this._dataElementCount;
            },
            set: function (value) {
                if (value === this._dataElementCount) {
                    return;
                }
                this.arrayLengthChanged = true;
                this.freeElements();
                this._dataElementCount = value;
                this.allocElements();
            },
            enumerable: true,
            configurable: true
        });
        __decorate([
            instanceData()
        ], InstanceDataBase.prototype, "zBias", null);
        __decorate([
            instanceData()
        ], InstanceDataBase.prototype, "transformX", null);
        __decorate([
            instanceData()
        ], InstanceDataBase.prototype, "transformY", null);
        __decorate([
            instanceData()
        ], InstanceDataBase.prototype, "opacity", null);
        return InstanceDataBase;
    })();
    BABYLON.InstanceDataBase = InstanceDataBase;
    var RenderablePrim2D = (function (_super) {
        __extends(RenderablePrim2D, _super);
        function RenderablePrim2D(settings) {
            _super.call(this, settings);
            this._transparentPrimitiveInfo = null;
        }
        Object.defineProperty(RenderablePrim2D.prototype, "isAlphaTest", {
            get: function () {
                return this._useTextureAlpha() || this._isPrimAlphaTest();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RenderablePrim2D.prototype, "isTransparent", {
            get: function () {
                return (this._opacity < 1) || this._shouldUseAlphaFromTexture() || this._isPrimTransparent();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RenderablePrim2D.prototype, "renderMode", {
            get: function () {
                return this._renderMode;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Dispose the primitive and its resources, remove it from its parent
         */
        RenderablePrim2D.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this.renderGroup) {
                this.renderGroup._setCacheGroupDirty();
            }
            if (this._transparentPrimitiveInfo) {
                this.renderGroup._renderableData.removeTransparentPrimitiveInfo(this._transparentPrimitiveInfo);
                this._transparentPrimitiveInfo = null;
            }
            if (this._instanceDataParts) {
                this._cleanupInstanceDataParts();
            }
            if (this._modelRenderCache) {
                this._modelRenderCache.dispose();
                this._modelRenderCache = null;
            }
            if (this._instanceDataParts) {
                this._instanceDataParts.forEach(function (p) {
                    p.freeElements();
                });
                this._instanceDataParts = null;
            }
            return true;
        };
        RenderablePrim2D.prototype._cleanupInstanceDataParts = function () {
            var gii = null;
            for (var _i = 0, _a = this._instanceDataParts; _i < _a.length; _i++) {
                var part = _a[_i];
                part.freeElements();
                gii = part.groupInstanceInfo;
            }
            if (gii) {
                var usedCount = 0;
                if (gii.hasOpaqueData) {
                    var od = gii.opaqueData[0];
                    usedCount += od._partData.usedElementCount;
                }
                if (gii.hasAlphaTestData) {
                    var atd = gii.alphaTestData[0];
                    usedCount += atd._partData.usedElementCount;
                }
                if (gii.hasTransparentData) {
                    var td = gii.transparentData[0];
                    usedCount += td._partData.usedElementCount;
                }
                if (usedCount === 0) {
                    this.renderGroup._renderableData._renderGroupInstancesInfo.remove(gii.modelRenderCache.modelKey);
                    gii.dispose();
                }
                if (this._modelRenderCache) {
                    this._modelRenderCache.dispose();
                    this._modelRenderCache = null;
                }
            }
            this._instanceDataParts = null;
        };
        RenderablePrim2D.prototype._prepareRenderPre = function (context) {
            _super.prototype._prepareRenderPre.call(this, context);
            // If the model changed and we have already an instance, we must remove this instance from the obsolete model
            if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagModelDirty) && this._instanceDataParts) {
                this._cleanupInstanceDataParts();
            }
            // Need to create the model?
            var setupModelRenderCache = false;
            if (!this._modelRenderCache || this._isFlagSet(BABYLON.SmartPropertyPrim.flagModelDirty)) {
                setupModelRenderCache = this._createModelRenderCache();
            }
            var gii = null;
            var newInstance = false;
            // Need to create the instance data parts?
            if (!this._instanceDataParts) {
                // Yes, flag it for later, more processing will have to be done
                newInstance = true;
                gii = this._createModelDataParts();
            }
            // If the ModelRenderCache is brand new, now is the time to call the implementation's specific setup method to create the rendering resources
            if (setupModelRenderCache) {
                this.setupModelRenderCache(this._modelRenderCache);
            }
            // At this stage we have everything correctly initialized, ModelRenderCache is setup, Model Instance data are good too, they have allocated elements in the Instanced DynamicFloatArray.
            // The last thing to do is check if the instanced related data must be updated because a InstanceLevel property had changed or the primitive visibility changed.
            if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagVisibilityChanged) || context.forceRefreshPrimitive || newInstance || (this._instanceDirtyFlags !== 0) || (this._globalTransformProcessStep !== this._globalTransformStep) || this._mustUpdateInstance()) {
                this._updateInstanceDataParts(gii);
            }
        };
        RenderablePrim2D.prototype._createModelRenderCache = function () {
            var _this = this;
            var setupModelRenderCache = false;
            if (this._modelRenderCache) {
                this._modelRenderCache.dispose();
            }
            this._modelRenderCache = this.owner._engineData.GetOrAddModelCache(this.modelKey, function (key) {
                var mrc = _this.createModelRenderCache(key);
                setupModelRenderCache = true;
                return mrc;
            });
            this._clearFlags(BABYLON.SmartPropertyPrim.flagModelDirty);
            // if this is still false it means the MRC already exists, so we add a reference to it
            if (!setupModelRenderCache) {
                this._modelRenderCache.addRef();
            }
            return setupModelRenderCache;
        };
        RenderablePrim2D.prototype._createModelDataParts = function () {
            var _this = this;
            // Create the instance data parts of the primitive and store them
            var parts = this.createInstanceDataParts();
            this._instanceDataParts = parts;
            // Check if the ModelRenderCache for this particular instance is also brand new, initialize it if it's the case
            if (!this._modelRenderCache._partData) {
                this._setupModelRenderCache(parts);
            }
            // The Rendering resources (Effect, VB, IB, Textures) are stored in the ModelRenderCache
            // But it's the RenderGroup that will store all the Instanced related data to render all the primitive it owns.
            // So for a given ModelKey we getOrAdd a GroupInstanceInfo that will store all these data
            var gii = this.renderGroup._renderableData._renderGroupInstancesInfo.getOrAddWithFactory(this.modelKey, function (k) {
                var res = new BABYLON.GroupInstanceInfo(_this.renderGroup, _this._modelRenderCache, _this._modelRenderCache._partData.length);
                for (var j = 0; j < _this._modelRenderCache._partData.length; j++) {
                    var part = _this._instanceDataParts[j];
                    res.partIndexFromId.add(part.id.toString(), j);
                    res.usedShaderCategories[j] = ";" + _this.getUsedShaderCategories(part).join(";") + ";";
                    res.strides[j] = _this._modelRenderCache._partData[j]._partDataStride;
                }
                return res;
            });
            // Get the GroupInfoDataPart corresponding to the render category of the part
            var rm = 0;
            var gipd = null;
            if (this.isTransparent) {
                gipd = gii.transparentData;
                rm = BABYLON.Render2DContext.RenderModeTransparent;
            }
            else if (this.isAlphaTest) {
                gipd = gii.alphaTestData;
                rm = BABYLON.Render2DContext.RenderModeAlphaTest;
            }
            else {
                gipd = gii.opaqueData;
                rm = BABYLON.Render2DContext.RenderModeOpaque;
            }
            // For each instance data part of the primitive, allocate the instanced element it needs for render
            for (var i = 0; i < parts.length; i++) {
                var part = parts[i];
                part.dataBuffer = gipd[i]._partData;
                part.allocElements();
                part.renderMode = rm;
                part.groupInstanceInfo = gii;
            }
            return gii;
        };
        RenderablePrim2D.prototype._setupModelRenderCache = function (parts) {
            var ctiArray = new Array();
            this._modelRenderCache._partData = new Array();
            for (var _i = 0; _i < parts.length; _i++) {
                var dataPart = parts[_i];
                var pd = new BABYLON.ModelRenderCachePartData();
                this._modelRenderCache._partData.push(pd);
                var cat = this.getUsedShaderCategories(dataPart);
                var cti = dataPart.getClassTreeInfo();
                // Make sure the instance is visible other the properties won't be set and their size/offset wont be computed
                var curVisible = this.isVisible;
                this.isVisible = true;
                // We manually trigger refreshInstanceData for the only sake of evaluating each instance property size and offset in the instance data, this can only be made at runtime. Once it's done we have all the information to create the instance data buffer.
                //console.log("Build Prop Layout for " + Tools.getClassName(this._instanceDataParts[0]));
                var joinCat = ";" + cat.join(";") + ";";
                pd._partJoinedUsedCategories = joinCat;
                InstanceClassInfo._CurCategories = joinCat;
                var obj = this.beforeRefreshForLayoutConstruction(dataPart);
                if (!this.refreshInstanceDataPart(dataPart)) {
                    console.log("Layout construction for " + BABYLON.Tools.getClassName(this._instanceDataParts[0]) + " failed because refresh returned false");
                }
                this.afterRefreshForLayoutConstruction(dataPart, obj);
                this.isVisible = curVisible;
                var size = 0;
                cti.fullContent.forEach(function (k, v) {
                    if (!v.category || cat.indexOf(v.category) !== -1) {
                        if (v.attributeName === "zBias") {
                            pd._zBiasOffset = v.instanceOffset.get(joinCat);
                        }
                        if (!v.size) {
                            console.log("ERROR: Couldn't detect the size of the Property " + v.attributeName + " from type " + BABYLON.Tools.getClassName(cti.type) + ". Property is ignored.");
                        }
                        else {
                            size += v.size;
                        }
                    }
                });
                pd._partDataStride = size;
                pd._partUsedCategories = cat;
                pd._partId = dataPart.id;
                ctiArray.push(cti);
            }
            this._modelRenderCache._partsClassInfo = ctiArray;
        };
        RenderablePrim2D.prototype.onZOrderChanged = function () {
            if (this.isTransparent && this._transparentPrimitiveInfo) {
                this.renderGroup._renderableData.transparentPrimitiveZChanged(this._transparentPrimitiveInfo);
                var gii = this.renderGroup._renderableData._renderGroupInstancesInfo.get(this.modelKey);
                // Flag the transparentData dirty has will have to sort it again
                gii.transparentOrderDirty = true;
            }
        };
        RenderablePrim2D.prototype._mustUpdateInstance = function () {
            return false;
        };
        RenderablePrim2D.prototype._useTextureAlpha = function () {
            return false;
        };
        RenderablePrim2D.prototype._shouldUseAlphaFromTexture = function () {
            return false;
        };
        RenderablePrim2D.prototype._isPrimAlphaTest = function () {
            return false;
        };
        RenderablePrim2D.prototype._isPrimTransparent = function () {
            return false;
        };
        RenderablePrim2D.prototype._updateInstanceDataParts = function (gii) {
            // Fetch the GroupInstanceInfo if we don't already have it
            var rd = this.renderGroup._renderableData;
            if (!gii) {
                gii = rd._renderGroupInstancesInfo.get(this.modelKey);
            }
            var isTransparent = this.isTransparent;
            var isAlphaTest = this.isAlphaTest;
            var wereTransparent = false;
            // Check a render mode change
            var rmChanged = false;
            if (this._instanceDataParts.length > 0) {
                var firstPart = this._instanceDataParts[0];
                var partRM = firstPart.renderMode;
                var curRM = this.renderMode;
                if (partRM !== curRM) {
                    wereTransparent = partRM === BABYLON.Render2DContext.RenderModeTransparent;
                    rmChanged = true;
                    var gipd;
                    switch (curRM) {
                        case BABYLON.Render2DContext.RenderModeTransparent:
                            gipd = gii.transparentData;
                            break;
                        case BABYLON.Render2DContext.RenderModeAlphaTest:
                            gipd = gii.alphaTestData;
                            break;
                        default:
                            gipd = gii.opaqueData;
                    }
                    for (var i = 0; i < this._instanceDataParts.length; i++) {
                        var part = this._instanceDataParts[i];
                        part.freeElements();
                        part.dataBuffer = gipd[i]._partData;
                        part.renderMode = curRM;
                    }
                }
            }
            // Handle changes related to ZOffset
            var visChanged = this._isFlagSet(BABYLON.SmartPropertyPrim.flagVisibilityChanged);
            if (isTransparent || wereTransparent) {
                // Handle visibility change, which is also triggered when the primitive just got created
                if (visChanged || rmChanged) {
                    if (this.isVisible && !wereTransparent) {
                        if (!this._transparentPrimitiveInfo) {
                            // Add the primitive to the list of transparent ones in the group that render is
                            this._transparentPrimitiveInfo = rd.addNewTransparentPrimitiveInfo(this, gii);
                        }
                    }
                    else {
                        if (this._transparentPrimitiveInfo) {
                            rd.removeTransparentPrimitiveInfo(this._transparentPrimitiveInfo);
                            this._transparentPrimitiveInfo = null;
                        }
                    }
                    gii.transparentOrderDirty = true;
                }
            }
            var rebuildTrans = false;
            // For each Instance Data part, refresh it to update the data in the DynamicFloatArray
            for (var _i = 0, _a = this._instanceDataParts; _i < _a.length; _i++) {
                var part = _a[_i];
                var justAllocated = false;
                // Check if we need to allocate data elements (hidden prim which becomes visible again)
                if (!part.dataElements && (visChanged || rmChanged || this.isVisible)) {
                    part.allocElements();
                    justAllocated = true;
                }
                InstanceClassInfo._CurCategories = gii.usedShaderCategories[gii.partIndexFromId.get(part.id.toString())];
                // Will return false if the instance should not be rendered (not visible or other any reasons)
                part.arrayLengthChanged = false;
                if (!this.refreshInstanceDataPart(part)) {
                    // Free the data element
                    if (part.dataElements) {
                        part.freeElements();
                    }
                }
                rebuildTrans = rebuildTrans || part.arrayLengthChanged || justAllocated;
            }
            this._instanceDirtyFlags = 0;
            // Make the appropriate data dirty
            if (isTransparent) {
                gii.transparentDirty = true;
                if (rebuildTrans) {
                    rd._transparentListChanged = true;
                }
            }
            else if (isAlphaTest) {
                gii.alphaTestDirty = true;
            }
            else {
                gii.opaqueDirty = true;
            }
            this._clearFlags(BABYLON.SmartPropertyPrim.flagVisibilityChanged); // Reset the flag as we've handled the case            
        };
        RenderablePrim2D.prototype._updateTransparentSegmentIndices = function (ts) {
            var minOff = BABYLON.Prim2DBase._bigInt;
            var maxOff = 0;
            for (var _i = 0, _a = this._instanceDataParts; _i < _a.length; _i++) {
                var part = _a[_i];
                if (part && part.dataElements) {
                    part.dataBuffer.pack();
                    for (var _b = 0, _c = part.dataElements; _b < _c.length; _b++) {
                        var el = _c[_b];
                        minOff = Math.min(minOff, el.offset);
                        maxOff = Math.max(maxOff, el.offset);
                    }
                    ts.startDataIndex = Math.min(ts.startDataIndex, minOff / part.dataBuffer.stride);
                    ts.endDataIndex = Math.max(ts.endDataIndex, (maxOff / part.dataBuffer.stride) + 1); // +1 for exclusive
                }
            }
        };
        // This internal method is mainly used for transparency processing
        RenderablePrim2D.prototype._getNextPrimZOrder = function () {
            var length = this._instanceDataParts.length;
            for (var i = 0; i < length; i++) {
                var part = this._instanceDataParts[i];
                if (part) {
                    var stride = part.dataBuffer.stride;
                    var lastElementOffset = part.dataElements[part.dataElements.length - 1].offset;
                    // check if it's the last in the DFA
                    if (part.dataBuffer.totalElementCount * stride <= lastElementOffset) {
                        return null;
                    }
                    // Return the Z of the next primitive that lies in the DFA
                    return part.dataBuffer[lastElementOffset + stride + this.modelRenderCache._partData[i]._zBiasOffset];
                }
            }
            return null;
        };
        // This internal method is mainly used for transparency processing
        RenderablePrim2D.prototype._getPrevPrimZOrder = function () {
            var length = this._instanceDataParts.length;
            for (var i = 0; i < length; i++) {
                var part = this._instanceDataParts[i];
                if (part) {
                    var stride = part.dataBuffer.stride;
                    var firstElementOffset = part.dataElements[0].offset;
                    // check if it's the first in the DFA
                    if (firstElementOffset === 0) {
                        return null;
                    }
                    // Return the Z of the previous primitive that lies in the DFA
                    return part.dataBuffer[firstElementOffset - stride + this.modelRenderCache._partData[i]._zBiasOffset];
                }
            }
            return null;
        };
        /**
         * Transform a given point using the Primitive's origin setting.
         * This method requires the Primitive's actualSize to be accurate
         * @param p the point to transform
         * @param originOffset an offset applied on the current origin before performing the transformation. Depending on which frame of reference your data is expressed you may have to apply a offset. (if you data is expressed from the bottom/left, no offset is required. If it's expressed from the center the a [-0.5;-0.5] offset has to be applied.
         * @param res an allocated Vector2 that will receive the transformed content
         */
        RenderablePrim2D.prototype.transformPointWithOriginByRef = function (p, originOffset, res) {
            var actualSize = this.actualSize;
            res.x = p.x - ((this.origin.x + (originOffset ? originOffset.x : 0)) * actualSize.width);
            res.y = p.y - ((this.origin.y + (originOffset ? originOffset.y : 0)) * actualSize.height);
        };
        RenderablePrim2D.prototype.transformPointWithOriginToRef = function (p, originOffset, res) {
            this.transformPointWithOriginByRef(p, originOffset, res);
            return res;
        };
        /**
         * Get the info for a given effect based on the dataPart metadata
         * @param dataPartId partId in part list to get the info
         * @param vertexBufferAttributes vertex buffer attributes to manually add
         * @param uniforms uniforms to manually add
         * @param useInstanced specified if Instanced Array should be used, if null the engine caps will be used (so true if WebGL supports it, false otherwise), but you have the possibility to override the engine capability. However, if you manually set true but the engine does not support Instanced Array, this method will return null
         */
        RenderablePrim2D.prototype.getDataPartEffectInfo = function (dataPartId, vertexBufferAttributes, uniforms, useInstanced) {
            if (uniforms === void 0) { uniforms = null; }
            if (useInstanced === void 0) { useInstanced = null; }
            var dataPart = BABYLON.Tools.first(this._instanceDataParts, function (i) { return i.id === dataPartId; });
            if (!dataPart) {
                return null;
            }
            var instancedArray = this.owner.supportInstancedArray;
            if (useInstanced != null) {
                // Check if the caller ask for Instanced Array and the engine does not support it, return null if it's the case
                if (useInstanced && instancedArray === false) {
                    return null;
                }
                // Use the caller's setting
                instancedArray = useInstanced;
            }
            var cti = dataPart.getClassTreeInfo();
            var categories = this.getUsedShaderCategories(dataPart);
            var att = cti.classContent.getShaderAttributes(categories);
            var defines = "";
            categories.forEach(function (c) { defines += "#define " + c + "\n"; });
            if (instancedArray) {
                defines += "#define Instanced\n";
            }
            return {
                attributes: instancedArray ? vertexBufferAttributes.concat(att) : vertexBufferAttributes,
                uniforms: instancedArray ? (uniforms != null ? uniforms : []) : ((uniforms != null) ? att.concat(uniforms) : (att != null ? att : [])),
                defines: defines
            };
        };
        Object.defineProperty(RenderablePrim2D.prototype, "modelRenderCache", {
            get: function () {
                return this._modelRenderCache;
            },
            enumerable: true,
            configurable: true
        });
        RenderablePrim2D.prototype.createModelRenderCache = function (modelKey) {
            return null;
        };
        RenderablePrim2D.prototype.setupModelRenderCache = function (modelRenderCache) {
        };
        RenderablePrim2D.prototype.createInstanceDataParts = function () {
            return null;
        };
        RenderablePrim2D.prototype.getUsedShaderCategories = function (dataPart) {
            return [];
        };
        RenderablePrim2D.prototype.beforeRefreshForLayoutConstruction = function (part) {
        };
        RenderablePrim2D.prototype.afterRefreshForLayoutConstruction = function (part, obj) {
        };
        RenderablePrim2D.prototype.refreshInstanceDataPart = function (part) {
            if (!this.isVisible) {
                return false;
            }
            part.isVisible = this.isVisible;
            // Which means, if there's only one data element, we're update it from this method, otherwise it is the responsibility of the derived class to call updateInstanceDataPart as many times as needed, properly (look at Text2D's implementation for more information)
            if (part.dataElementCount === 1) {
                part.curElement = 0;
                this.updateInstanceDataPart(part);
            }
            return true;
        };
        /**
         * Update the instanceDataBase level properties of a part
         * @param part the part to update
         * @param positionOffset to use in multi part per primitive (e.g. the Text2D has N parts for N letter to display), this give the offset to apply (e.g. the position of the letter from the bottom/left corner of the text).
         */
        RenderablePrim2D.prototype.updateInstanceDataPart = function (part, positionOffset) {
            if (positionOffset === void 0) { positionOffset = null; }
            var t = this._globalTransform.multiply(this.renderGroup.invGlobalTransform);
            var size = this.renderGroup.viewportSize;
            var zBias = this.actualZOffset;
            var offX = 0;
            var offY = 0;
            // If there's an offset, apply the global transformation matrix on it to get a global offset
            if (positionOffset) {
                offX = positionOffset.x * t.m[0] + positionOffset.y * t.m[4];
                offY = positionOffset.x * t.m[1] + positionOffset.y * t.m[5];
            }
            // Have to convert the coordinates to clip space which is ranged between [-1;1] on X and Y axis, with 0,0 being the left/bottom corner
            // Current coordinates are expressed in renderGroup coordinates ([0, renderGroup.actualSize.width|height]) with 0,0 being at the left/top corner
            // So for X: 
            //  - tx.x = value * 2 / width: is to switch from [0, renderGroup.width] to [0, 2]
            //  - tx.w = (value * 2 / width) - 1: w stores the translation in renderGroup coordinates so (value * 2 / width) to switch to a clip space translation value. - 1 is to offset the overall [0;2] to [-1;1].
            var w = size.width;
            var h = size.height;
            var invZBias = 1 / zBias;
            var tx = new BABYLON.Vector4(t.m[0] * 2 / w, t.m[4] * 2 / w, 0 /*t.m[8]*/, ((t.m[12] + offX) * 2 / w) - 1);
            var ty = new BABYLON.Vector4(t.m[1] * 2 / h, t.m[5] * 2 / h, 0 /*t.m[9]*/, ((t.m[13] + offY) * 2 / h) - 1);
            part.transformX = tx;
            part.transformY = ty;
            part.opacity = this.actualOpacity;
            // Stores zBias and it's inverse value because that's needed to compute the clip space W coordinate (which is 1/Z, so 1/zBias)
            part.zBias = new BABYLON.Vector2(zBias, invZBias);
        };
        RenderablePrim2D.prototype._updateRenderMode = function () {
            if (this.isTransparent) {
                this._renderMode = BABYLON.Render2DContext.RenderModeTransparent;
            }
            else if (this.isAlphaTest) {
                this._renderMode = BABYLON.Render2DContext.RenderModeAlphaTest;
            }
            else {
                this._renderMode = BABYLON.Render2DContext.RenderModeOpaque;
            }
        };
        RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT = BABYLON.Prim2DBase.PRIM2DBASE_PROPCOUNT + 5;
        __decorate([
            BABYLON.dynamicLevelProperty(BABYLON.Prim2DBase.PRIM2DBASE_PROPCOUNT + 0, function (pi) { return RenderablePrim2D.isAlphaTestProperty = pi; })
        ], RenderablePrim2D.prototype, "isAlphaTest", null);
        __decorate([
            BABYLON.dynamicLevelProperty(BABYLON.Prim2DBase.PRIM2DBASE_PROPCOUNT + 1, function (pi) { return RenderablePrim2D.isTransparentProperty = pi; })
        ], RenderablePrim2D.prototype, "isTransparent", null);
        RenderablePrim2D = __decorate([
            BABYLON.className("RenderablePrim2D")
        ], RenderablePrim2D);
        return RenderablePrim2D;
    })(BABYLON.Prim2DBase);
    BABYLON.RenderablePrim2D = RenderablePrim2D;
})(BABYLON || (BABYLON = {}));
