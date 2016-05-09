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
            var catInline = categories.join(";");
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
        //uniformLocation: WebGLUniformLocation;
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
            node.levelContent.add(instanceDataName, info);
            descriptor.get = function () {
                return null;
            };
            descriptor.set = function (val) {
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
            this.dataElementCount = dataElementCount;
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
        Object.defineProperty(InstanceDataBase.prototype, "origin", {
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
            var res = new Array(this.dataElementCount);
            for (var i = 0; i < this.dataElementCount; i++) {
                res[i] = this.dataBuffer.allocElement();
            }
            this.dataElements = res;
        };
        InstanceDataBase.prototype.freeElements = function () {
            for (var _i = 0, _a = this.dataElements; _i < _a.length; _i++) {
                var ei = _a[_i];
                this.dataBuffer.freeElement(ei);
            }
            this.dataElements = null;
        };
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
        ], InstanceDataBase.prototype, "origin", null);
        return InstanceDataBase;
    })();
    BABYLON.InstanceDataBase = InstanceDataBase;
    var RenderablePrim2D = (function (_super) {
        __extends(RenderablePrim2D, _super);
        function RenderablePrim2D() {
            _super.apply(this, arguments);
        }
        Object.defineProperty(RenderablePrim2D.prototype, "isTransparent", {
            get: function () {
                return this._isTransparent;
            },
            set: function (value) {
                this._isTransparent = value;
            },
            enumerable: true,
            configurable: true
        });
        RenderablePrim2D.prototype.setupRenderablePrim2D = function (owner, parent, id, position, isVisible) {
            this.setupPrim2DBase(owner, parent, id, position);
            this._isTransparent = false;
        };
        RenderablePrim2D.prototype._prepareRenderPre = function (context) {
            var _this = this;
            _super.prototype._prepareRenderPre.call(this, context);
            // If the model changed and we have already an instance, we must remove this instance from the obsolete model
            if (this._modelDirty && this._modelRenderInstanceID) {
                this._modelRenderCache.removeInstanceData(this._modelRenderInstanceID);
                this._modelRenderInstanceID = null;
            }
            // Need to create the model?
            var setupModelRenderCache = false;
            if (!this._modelRenderCache || this._modelDirty) {
                this._modelRenderCache = BABYLON.SmartPropertyPrim.GetOrAddModelCache(this.modelKey, function (key) {
                    var mrc = _this.createModelRenderCache(key, _this.isTransparent);
                    setupModelRenderCache = true;
                    return mrc;
                });
                this._modelDirty = false;
            }
            // Need to create the instance?
            var gii;
            var newInstance = false;
            if (!this._modelRenderInstanceID) {
                newInstance = true;
                var parts = this.createInstanceDataParts();
                this._instanceDataParts = parts;
                if (!this._modelRenderCache._partsDataStride) {
                    var ctiArray = new Array();
                    var dataStrides = new Array();
                    var usedCatList = new Array();
                    var partIdList = new Array();
                    var joinedUsedCatList = new Array();
                    for (var _i = 0; _i < parts.length; _i++) {
                        var dataPart = parts[_i];
                        var cat = this.getUsedShaderCategories(dataPart);
                        var cti = dataPart.getClassTreeInfo();
                        // Make sure the instance is visible other the properties won't be set and their size/offset wont be computed
                        var curVisible = this.isVisible;
                        this.isVisible = true;
                        // We manually trigger refreshInstanceData for the only sake of evaluating each isntance property size and offset in the instance data, this can only be made at runtime. Once it's done we have all the information to create the instance data buffer.
                        //console.log("Build Prop Layout for " + Tools.getClassName(this._instanceDataParts[0]));
                        var joinCat = cat.join(";");
                        joinedUsedCatList.push(joinCat);
                        InstanceClassInfo._CurCategories = joinCat;
                        this.refreshInstanceDataPart(dataPart);
                        this.isVisible = curVisible;
                        var size = 0;
                        for (var index = 0; index < cti.fullContent.count; index++) {
                            var v = cti.fullContent[index];
                            if (!v.category || cat.indexOf(v.category) !== -1) {
                                if (!v.size) {
                                    console.log("ERROR: Couldn't detect the size of the Property " + v.attributeName + " from type " + BABYLON.Tools.getClassName(cti.type) + ". Property is ignored.");
                                }
                                else {
                                    size += v.size;
                                }
                            }
                        }
                        dataStrides.push(size);
                        usedCatList.push(cat);
                        ctiArray.push(cti);
                        partIdList.push(dataPart.id);
                    }
                    this._modelRenderCache._partsDataStride = dataStrides;
                    this._modelRenderCache._partsUsedCategories = usedCatList;
                    this._modelRenderCache._partsJoinedUsedCategories = joinedUsedCatList;
                    this._modelRenderCache._partsClassInfo = ctiArray;
                    this._modelRenderCache._partIdList = partIdList;
                }
                gii = this.renderGroup.groupRenderInfo.getOrAddWithFactory(this.modelKey, function (k) { return new BABYLON.GroupInstanceInfo(_this.renderGroup, _this._modelRenderCache); });
                // First time init of the GroupInstanceInfo
                if (gii._instancesPartsData.length === 0) {
                    for (var j = 0; j < this._modelRenderCache._partsDataStride.length; j++) {
                        var stride = this._modelRenderCache._partsDataStride[j];
                        gii._instancesPartsData.push(new BABYLON.DynamicFloatArray(stride / 4, 50));
                        gii._partIndexFromId.add(this._modelRenderCache._partIdList[j].toString(), j);
                        for (var _a = 0, _b = this._instanceDataParts; _a < _b.length; _a++) {
                            var part = _b[_a];
                            gii._instancesPartsUsedShaderCategories[gii._partIndexFromId.get(part.id.toString())] = this.getUsedShaderCategories(part).join(";");
                        }
                    }
                }
                for (var i = 0; i < parts.length; i++) {
                    var part = parts[i];
                    part.dataBuffer = gii._instancesPartsData[i];
                    part.allocElements();
                }
                this._modelRenderInstanceID = this._modelRenderCache.addInstanceDataParts(this._instanceDataParts);
            }
            if (setupModelRenderCache) {
                this.setupModelRenderCache(this._modelRenderCache);
            }
            if (context.forceRefreshPrimitive || newInstance || (this._instanceDirtyFlags !== 0) || (this._globalTransformProcessStep !== this._globalTransformStep)) {
                if (!gii) {
                    gii = this.renderGroup.groupRenderInfo.get(this.modelKey);
                }
                for (var _c = 0, _d = this._instanceDataParts; _c < _d.length; _c++) {
                    var part = _d[_c];
                    var cat = this.getUsedShaderCategories(part);
                    InstanceClassInfo._CurCategories = gii._instancesPartsUsedShaderCategories[gii._partIndexFromId.get(part.id.toString())];
                    // Will return false if the instance should not be rendered (not visible or other any reasons)
                    if (!this.refreshInstanceDataPart(part)) {
                        // Free the data element
                        if (part.dataElements) {
                            part.freeElements();
                        }
                    }
                }
                this._instanceDirtyFlags = 0;
                gii._dirtyInstancesData = true;
            }
        };
        RenderablePrim2D.prototype.getDataPartEffectInfo = function (dataPartId, vertexBufferAttributes) {
            var dataPart = BABYLON.Tools.first(this._instanceDataParts, function (i) { return i.id === dataPartId; });
            if (!dataPart) {
                return null;
            }
            var instancedArray = this.owner.supportInstancedArray;
            var cti = dataPart.getClassTreeInfo();
            var categories = this.getUsedShaderCategories(dataPart);
            var att = cti.classContent.getShaderAttributes(categories);
            var defines = "";
            categories.forEach(function (c) { defines += "#define " + c + "\n"; });
            if (instancedArray) {
                defines += "#define Instanced\n";
            }
            return { attributes: instancedArray ? vertexBufferAttributes.concat(att) : vertexBufferAttributes, uniforms: instancedArray ? [] : att, defines: defines };
        };
        Object.defineProperty(RenderablePrim2D.prototype, "modelRenderCache", {
            get: function () {
                return this._modelRenderCache;
            },
            enumerable: true,
            configurable: true
        });
        RenderablePrim2D.prototype.createModelRenderCache = function (modelKey, isTransparent) {
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
        RenderablePrim2D.prototype.refreshInstanceDataPart = function (part) {
            if (!this.isVisible) {
                return false;
            }
            part.isVisible = this.isVisible;
            // Which means, if there's only one data element, we're update it from this method, otherwise it is the responsability of the derived class to call updateInstanceDataPart as many times as needed, properly (look at Text2D's implementation for more information)
            if (part.dataElementCount === 1) {
                this.updateInstanceDataPart(part);
            }
            return true;
        };
        RenderablePrim2D.prototype.updateInstanceDataPart = function (part, positionOffset) {
            if (positionOffset === void 0) { positionOffset = null; }
            var t = this._globalTransform.multiply(this.renderGroup.invGlobalTransform);
            var size = this.renderGroup.viewportSize;
            var zBias = this.getActualZOffset();
            var offX = 0;
            var offY = 0;
            // If there's an offset, apply the global transformation matrix on it to get a global offset
            if (positionOffset) {
                offX = positionOffset.x * t.m[0] + positionOffset.y * t.m[4];
                offY = positionOffset.x * t.m[1] + positionOffset.y * t.m[5];
            }
            // Have to convert the coordinates to clip space which is ranged between [-1;1] on X and Y axis, with 0,0 being the left/bottom corner
            // Current coordinates are expressed in renderGroup coordinates ([0, renderGroup.actualSize.width|height]) with 0,0 being at the left/top corner
            // RenderGroup Width and Height are multiplied by zBias because the VertexShader will multiply X and Y by W, which is 1/zBias. As we divide our coordinate by these Width/Height, we will also divide by the zBias to compensate the operation made by the VertexShader.
            // So for X: 
            //  - tx.x = value * 2 / width: is to switch from [0, renderGroup.width] to [0, 2]
            //  - tx.w = (value * 2 / width) - 1: w stores the translation in renderGroup coordinates so (value * 2 / width) to switch to a clip space translation value. - 1 is to offset the overall [0;2] to [-1;1]. Don't forget it's -(1/zBias) and not -1 because everything need to be scaled by 1/zBias.
            var w = size.width * zBias;
            var h = size.height * zBias;
            var invZBias = 1 / zBias;
            var tx = new BABYLON.Vector4(t.m[0] * 2 / w, t.m[4] * 2 / w, 0 /*t.m[8]*/, ((t.m[12] + offX) * 2 / w) - (invZBias));
            var ty = new BABYLON.Vector4(t.m[1] * 2 / h, t.m[5] * 2 / h, 0 /*t.m[9]*/, ((t.m[13] + offY) * 2 / h) - (invZBias));
            part.transformX = tx;
            part.transformY = ty;
            part.origin = this.origin;
            // Stores zBias and it's inverse value because that's needed to compute the clip space W coordinate (which is 1/Z, so 1/zBias)
            part.zBias = new BABYLON.Vector2(zBias, invZBias);
        };
        RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT = BABYLON.Prim2DBase.PRIM2DBASE_PROPCOUNT + 5;
        __decorate([
            BABYLON.modelLevelProperty(BABYLON.Prim2DBase.PRIM2DBASE_PROPCOUNT + 1, function (pi) { return RenderablePrim2D.isTransparentProperty = pi; })
        ], RenderablePrim2D.prototype, "isTransparent", null);
        RenderablePrim2D = __decorate([
            BABYLON.className("RenderablePrim2D")
        ], RenderablePrim2D);
        return RenderablePrim2D;
    })(BABYLON.Prim2DBase);
    BABYLON.RenderablePrim2D = RenderablePrim2D;
})(BABYLON || (BABYLON = {}));
