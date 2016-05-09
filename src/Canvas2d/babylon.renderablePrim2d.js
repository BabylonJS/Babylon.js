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
            this._nextOffset = 0;
            this._attributes = new Array();
        }
        InstanceClassInfo.prototype.mapProperty = function (propInfo) {
            propInfo.instanceOffset = (this._baseInfo ? this._baseInfo._nextOffset : 0) + this._nextOffset;
            this._nextOffset += (propInfo.size / 4);
            this._attributes.push(propInfo);
        };
        InstanceClassInfo.prototype.getInstancingAttributeInfos = function (effect) {
            var res = new Array();
            var curInfo = this;
            while (curInfo) {
                for (var _i = 0, _a = curInfo._attributes; _i < _a.length; _i++) {
                    var attrib = _a[_i];
                    var index = effect.getAttributeLocationByName(attrib.attributeName);
                    var iai = new BABYLON.InstancingAttributeInfo();
                    iai.index = index;
                    iai.attributeSize = attrib.size / 4; // attrib.size is in byte and we need to store in "component" (i.e float is 1, vec3 is 3)
                    iai.offset = attrib.instanceOffset * 4; // attrub.instanceOffset is in float, iai.offset must be in bytes
                    res.push(iai);
                }
                curInfo = curInfo._baseInfo;
            }
            return res;
        };
        return InstanceClassInfo;
    }());
    BABYLON.InstanceClassInfo = InstanceClassInfo;
    var InstancePropInfo = (function () {
        function InstancePropInfo() {
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
    }());
    BABYLON.InstancePropInfo = InstancePropInfo;
    function instanceData(name) {
        return function (target, propName, descriptor) {
            var dic = BABYLON.ClassTreeInfo.getOrRegister(target, function (base) { return new InstanceClassInfo(base); });
            var node = dic.getLevelOf(target);
            name = name || propName;
            var info = node.levelContent.get(name);
            if (info) {
                throw new Error("The ID " + name + " is already taken by another instance data");
            }
            info = new InstancePropInfo();
            info.attributeName = name;
            node.levelContent.add(name, info);
            descriptor.get = function () {
                return null;
            };
            descriptor.set = function (val) {
                if (!info.size) {
                    info.setSize(val);
                    node.classContent.mapProperty(info);
                }
                var obj = this;
                if (obj._dataBuffer) {
                    info.writeData(obj._dataBuffer.buffer, obj._dataElement.offset + info.instanceOffset, val);
                }
            };
        };
    }
    BABYLON.instanceData = instanceData;
    var InstanceDataBase = (function () {
        function InstanceDataBase() {
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
            if (!this._typeInfo) {
                this._typeInfo = BABYLON.ClassTreeInfo.get(Object.getPrototypeOf(this));
            }
            return this._typeInfo;
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
    }());
    BABYLON.InstanceDataBase = InstanceDataBase;
    var RenderablePrim2D = (function (_super) {
        __extends(RenderablePrim2D, _super);
        function RenderablePrim2D() {
            _super.apply(this, arguments);
        }
        RenderablePrim2D.prototype.setupRenderablePrim2D = function (owner, parent, id, position, isVisible, fill, border) {
            this.setupPrim2DBase(owner, parent, id, position);
            this._isTransparent = false;
        };
        Object.defineProperty(RenderablePrim2D.prototype, "border", {
            get: function () {
                return this._border;
            },
            set: function (value) {
                if (value === this._border) {
                    return;
                }
                this._border = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RenderablePrim2D.prototype, "fill", {
            get: function () {
                return this._fill;
            },
            set: function (value) {
                if (value === this._fill) {
                    return;
                }
                this._fill = value;
            },
            enumerable: true,
            configurable: true
        });
        RenderablePrim2D.prototype._prepareRenderPre = function (context) {
            var _this = this;
            _super.prototype._prepareRenderPre.call(this, context);
            // If the model changed and we have already an instance, we must remove this instance from the obsolete model
            if (this._modelDirty && this._modelRenderInstanceID) {
                this._modelRenderCache.removeInstanceData(this._modelRenderInstanceID);
                this._modelRenderInstanceID = null;
            }
            // Need to create the model?
            if (!this._modelRenderCache || this._modelDirty) {
                this._modelRenderCache = BABYLON.SmartPropertyPrim.GetOrAddModelCache(this.modelKey, function (key) { return _this.createModelRenderCache(); });
                this._modelDirty = false;
            }
            // Need to create the instance?
            var gii;
            var newInstance = false;
            if (!this._modelRenderInstanceID) {
                newInstance = true;
                var id = this.createInstanceData();
                this._instanceData = id;
                var cti_1 = id.getClassTreeInfo();
                if (!cti_1.classContent.instanceDataStride) {
                    // Make sure the instance is visible other the properties won't be set and their size/offset wont be computed
                    var curVisible = this.isVisible;
                    this.isVisible = true;
                    // We manually trigger refreshInstanceData for the only sake of evaluating each isntance property size and offset in the instance data, this can only be made at runtime. Once it's done we have all the information to create the instance data buffer.
                    this.refreshInstanceData();
                    this.isVisible = curVisible;
                    var size = 0;
                    cti_1.fullContent.forEach(function (k, v) {
                        if (!v.size) {
                            console.log("ERROR: Couldn't detect the size of the Property " + v.attributeName + " from type " + BABYLON.Tools.getClassName(cti_1.type) + ". Property is ignored.");
                        }
                        else {
                            size += v.size;
                        }
                    });
                    cti_1.classContent.instanceDataStride = size;
                }
                gii = this.renderGroup.groupRenderInfo.getOrAddWithFactory(this.modelKey, function (k) { return new BABYLON.GroupInstanceInfo(_this.renderGroup, cti_1, _this._modelRenderCache); });
                if (!gii._instancesData) {
                    // instanceDataStride's unit is byte but DynamicFloatArray is float32, so div by four to get the correct number
                    gii._instancesData = new BABYLON.DynamicFloatArray(cti_1.classContent.instanceDataStride / 4, 50);
                }
                id._dataBuffer = gii._instancesData;
                id._dataElement = id._dataBuffer.allocElement();
                this._modelRenderInstanceID = this._modelRenderCache.addInstanceData(this._instanceData);
            }
            if (context.forceRefreshPrimitive || newInstance || (this._instanceDirtyFlags !== 0) || (this._globalTransformPreviousStep !== this._globalTransformStep)) {
                // Will return false if the instance should not be rendered (not visible or other any reasons)
                if (!this.refreshInstanceData()) {
                    // Free the data element
                    if (this._instanceData._dataElement) {
                        this._instanceData._dataBuffer.freeElement(this._instanceData._dataElement);
                        this._instanceData._dataElement = null;
                    }
                }
                this._instanceDirtyFlags = 0;
                if (!gii) {
                    gii = this.renderGroup.groupRenderInfo.get(this.modelKey);
                }
                gii._dirtyInstancesData = true;
            }
        };
        RenderablePrim2D.prototype.createModelRenderCache = function () {
            return null;
        };
        RenderablePrim2D.prototype.createInstanceData = function () {
            return null;
        };
        RenderablePrim2D.prototype.refreshInstanceData = function () {
            var d = this._instanceData;
            if (!this.isVisible) {
                return false;
            }
            d.isVisible = this.isVisible;
            var t = this.renderGroup.invGlobalTransform.multiply(this._globalTransform);
            var size = this.renderGroup.viewportSize;
            var zBias = this.getActualZOffset();
            // Have to convert the coordinates to clip space which is ranged between [-1;1] on X and Y axis, with 0,0 being the left/bottom corner
            // Current coordinates are expressed in renderGroup coordinates ([0, renderGroup.actualSize.width|height]) with 0,0 being at the left/top corner
            // RenderGroup Width and Height are multiplied by zBias because the VertexShader will multiply X and Y by W, which is 1/zBias. Has we divide our coordinate by these Width/Height, we will also divide by the zBias to compensate the operation made by the VertexShader.
            // So for X: 
            //  - tx.x = value * 2 / width: is to switch from [0, renderGroup.width] to [0, 2]
            //  - tx.w = (value * 2 / width) - 1: w stores the translation in renderGroup coordinates so (value * 2 / width) to switch to a clip space translation value. - 1 is to offset the overall [0;2] to [-1;1]. Don't forget it's -(1/zBias) and not -1 because everything need to be scaled by 1/zBias.
            // Same thing for Y, except the "* -2" instead of "* 2" to switch the origin from top to bottom (has expected by the clip space)
            var w = size.width * zBias;
            var h = size.height * zBias;
            var invZBias = 1 / zBias;
            var tx = new BABYLON.Vector4(t.m[0] * 2 / w, t.m[4] * 2 / w, t.m[8], (t.m[12] * 2 / w) - (invZBias));
            var ty = new BABYLON.Vector4(t.m[1] * -2 / h, t.m[5] * -2 / h, t.m[9], ((t.m[13] * 2 / h) - (invZBias)) * -1);
            d.transformX = tx;
            d.transformY = ty;
            d.origin = this.origin;
            // Stores zBias and it's inverse value because that's needed to compute the clip space W coordinate (which is 1/Z, so 1/zBias)
            d.zBias = new BABYLON.Vector2(zBias, invZBias);
            return true;
        };
        RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT = BABYLON.Prim2DBase.PRIM2DBASE_PROPCOUNT + 10;
        __decorate([
            BABYLON.modelLevelProperty(BABYLON.Prim2DBase.PRIM2DBASE_PROPCOUNT + 1, function (pi) { return RenderablePrim2D.borderProperty = pi; }, true)
        ], RenderablePrim2D.prototype, "border", null);
        __decorate([
            BABYLON.modelLevelProperty(BABYLON.Prim2DBase.PRIM2DBASE_PROPCOUNT + 2, function (pi) { return RenderablePrim2D.fillProperty = pi; }, true)
        ], RenderablePrim2D.prototype, "fill", null);
        RenderablePrim2D = __decorate([
            BABYLON.className("RenderablePrim2D")
        ], RenderablePrim2D);
        return RenderablePrim2D;
    }(BABYLON.Prim2DBase));
    BABYLON.RenderablePrim2D = RenderablePrim2D;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.renderablePrim2d.js.map