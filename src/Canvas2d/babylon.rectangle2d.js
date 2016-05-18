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
    var Rectangle2DRenderCache = (function (_super) {
        __extends(Rectangle2DRenderCache, _super);
        function Rectangle2DRenderCache(engine, modelKey, isTransparent) {
            _super.call(this, engine, modelKey, isTransparent);
        }
        Rectangle2DRenderCache.prototype.render = function (instanceInfo, context) {
            // Do nothing if the shader is still loading/preparing
            if ((this.effectFill && !this.effectFill.isReady()) || (this.effectBorder && !this.effectBorder.isReady())) {
                return false;
            }
            var engine = instanceInfo._owner.owner.engine;
            var depthFunction = 0;
            if (this.effectFill && this.effectBorder) {
                depthFunction = engine.getDepthFunction();
                engine.setDepthFunctionToLessOrEqual();
            }
            var cur;
            if (this.isTransparent) {
                cur = engine.getAlphaMode();
                engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE);
            }
            if (this.effectFill) {
                var partIndex = instanceInfo._partIndexFromId.get(BABYLON.Shape2D.SHAPE2D_FILLPARTID.toString());
                engine.enableEffect(this.effectFill);
                engine.bindBuffers(this.fillVB, this.fillIB, [1], 4, this.effectFill);
                var count = instanceInfo._instancesPartsData[partIndex].usedElementCount;
                if (instanceInfo._owner.owner.supportInstancedArray) {
                    if (!this.instancingFillAttributes) {
                        // Compute the offset locations of the attributes in the vertex shader that will be mapped to the instance buffer data
                        this.instancingFillAttributes = this.loadInstancingAttributes(BABYLON.Shape2D.SHAPE2D_FILLPARTID, this.effectFill);
                    }
                    engine.updateAndBindInstancesBuffer(instanceInfo._instancesPartsBuffer[partIndex], null, this.instancingFillAttributes);
                    engine.draw(true, 0, this.fillIndicesCount, count);
                    engine.unBindInstancesBuffer(instanceInfo._instancesPartsBuffer[partIndex], this.instancingFillAttributes);
                }
                else {
                    for (var i = 0; i < count; i++) {
                        this.setupUniforms(this.effectFill, partIndex, instanceInfo._instancesPartsData[partIndex], i);
                        engine.draw(true, 0, this.fillIndicesCount);
                    }
                }
            }
            if (this.effectBorder) {
                var partIndex = instanceInfo._partIndexFromId.get(BABYLON.Shape2D.SHAPE2D_BORDERPARTID.toString());
                engine.enableEffect(this.effectBorder);
                engine.bindBuffers(this.borderVB, this.borderIB, [1], 4, this.effectBorder);
                var count = instanceInfo._instancesPartsData[partIndex].usedElementCount;
                if (instanceInfo._owner.owner.supportInstancedArray) {
                    if (!this.instancingBorderAttributes) {
                        this.instancingBorderAttributes = this.loadInstancingAttributes(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, this.effectBorder);
                    }
                    engine.updateAndBindInstancesBuffer(instanceInfo._instancesPartsBuffer[partIndex], null, this.instancingBorderAttributes);
                    engine.draw(true, 0, this.borderIndicesCount, count);
                    engine.unBindInstancesBuffer(instanceInfo._instancesPartsBuffer[partIndex], this.instancingBorderAttributes);
                }
                else {
                    for (var i = 0; i < count; i++) {
                        this.setupUniforms(this.effectBorder, partIndex, instanceInfo._instancesPartsData[partIndex], i);
                        engine.draw(true, 0, this.borderIndicesCount);
                    }
                }
            }
            if (this.isTransparent) {
                engine.setAlphaMode(cur);
            }
            if (this.effectFill && this.effectBorder) {
                engine.setDepthFunction(depthFunction);
            }
            return true;
        };
        Rectangle2DRenderCache.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this.fillVB) {
                this._engine._releaseBuffer(this.fillVB);
                this.fillVB = null;
            }
            if (this.fillIB) {
                this._engine._releaseBuffer(this.fillIB);
                this.fillIB = null;
            }
            if (this.effectFill) {
                this._engine._releaseEffect(this.effectFill);
                this.effectFill = null;
            }
            if (this.borderVB) {
                this._engine._releaseBuffer(this.borderVB);
                this.borderVB = null;
            }
            if (this.borderIB) {
                this._engine._releaseBuffer(this.borderIB);
                this.borderIB = null;
            }
            if (this.effectBorder) {
                this._engine._releaseEffect(this.effectBorder);
                this.effectBorder = null;
            }
            return true;
        };
        return Rectangle2DRenderCache;
    })(BABYLON.ModelRenderCache);
    BABYLON.Rectangle2DRenderCache = Rectangle2DRenderCache;
    var Rectangle2DInstanceData = (function (_super) {
        __extends(Rectangle2DInstanceData, _super);
        function Rectangle2DInstanceData(partId) {
            _super.call(this, partId, 1);
        }
        Object.defineProperty(Rectangle2DInstanceData.prototype, "properties", {
            get: function () {
                return null;
            },
            enumerable: true,
            configurable: true
        });
        __decorate([
            BABYLON.instanceData()
        ], Rectangle2DInstanceData.prototype, "properties", null);
        return Rectangle2DInstanceData;
    })(BABYLON.Shape2DInstanceData);
    BABYLON.Rectangle2DInstanceData = Rectangle2DInstanceData;
    var Rectangle2D = (function (_super) {
        __extends(Rectangle2D, _super);
        function Rectangle2D() {
            _super.apply(this, arguments);
        }
        Object.defineProperty(Rectangle2D.prototype, "actualSize", {
            get: function () {
                return this.size;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle2D.prototype, "size", {
            get: function () {
                return this._size;
            },
            set: function (value) {
                this._size = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle2D.prototype, "notRounded", {
            get: function () {
                return this._notRounded;
            },
            set: function (value) {
                this._notRounded = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle2D.prototype, "roundRadius", {
            get: function () {
                return this._roundRadius;
            },
            set: function (value) {
                this._roundRadius = value;
                this.notRounded = value === 0;
            },
            enumerable: true,
            configurable: true
        });
        Rectangle2D.prototype.levelIntersect = function (intersectInfo) {
            // If we got there it mean the boundingInfo intersection succeed, if the rectangle has not roundRadius, it means it succeed!
            if (this.notRounded) {
                return true;
            }
            // Well, for now we neglect the area where the pickPosition could be outside due to the roundRadius...
            // TODO make REAL intersection test here!
            return true;
        };
        Rectangle2D.prototype.updateLevelBoundingInfo = function () {
            BABYLON.BoundingInfo2D.CreateFromSizeToRef(this.size, this._levelBoundingInfo, this.origin);
        };
        Rectangle2D.prototype.setupRectangle2D = function (owner, parent, id, position, size, roundRadius, fill, border, borderThickness) {
            if (roundRadius === void 0) { roundRadius = 0; }
            if (borderThickness === void 0) { borderThickness = 1; }
            this.setupShape2D(owner, parent, id, position, true, fill, border, borderThickness);
            this.size = size;
            this.notRounded = !roundRadius;
            this.roundRadius = roundRadius;
        };
        Rectangle2D.Create = function (parent, id, x, y, width, height, fill, border) {
            BABYLON.Prim2DBase.CheckParent(parent);
            var rect = new Rectangle2D();
            rect.setupRectangle2D(parent.owner, parent, id, new BABYLON.Vector2(x, y), new BABYLON.Size(width, height), null);
            rect.fill = fill;
            rect.border = border;
            return rect;
        };
        Rectangle2D.CreateRounded = function (parent, id, x, y, width, height, roundRadius, fill, border) {
            if (roundRadius === void 0) { roundRadius = 0; }
            BABYLON.Prim2DBase.CheckParent(parent);
            var rect = new Rectangle2D();
            rect.setupRectangle2D(parent.owner, parent, id, new BABYLON.Vector2(x, y), new BABYLON.Size(width, height), roundRadius);
            rect.fill = fill || BABYLON.Canvas2D.GetSolidColorBrushFromHex("#FFFFFFFF");
            rect.border = border;
            return rect;
        };
        Rectangle2D.prototype.createModelRenderCache = function (modelKey, isTransparent) {
            var renderCache = new Rectangle2DRenderCache(this.owner.engine, modelKey, isTransparent);
            return renderCache;
        };
        Rectangle2D.prototype.setupModelRenderCache = function (modelRenderCache) {
            var renderCache = modelRenderCache;
            var engine = this.owner.engine;
            // Need to create WebGL resources for fill part?
            if (this.fill) {
                var vbSize = ((this.notRounded ? 1 : Rectangle2D.roundSubdivisions) * 4) + 1;
                var vb = new Float32Array(vbSize);
                for (var i = 0; i < vbSize; i++) {
                    vb[i] = i;
                }
                renderCache.fillVB = engine.createVertexBuffer(vb);
                var triCount = vbSize - 1;
                var ib = new Float32Array(triCount * 3);
                for (var i = 0; i < triCount; i++) {
                    ib[i * 3 + 0] = 0;
                    ib[i * 3 + 2] = i + 1;
                    ib[i * 3 + 1] = i + 2;
                }
                ib[triCount * 3 - 2] = 1;
                renderCache.fillIB = engine.createIndexBuffer(ib);
                renderCache.fillIndicesCount = triCount * 3;
                var ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_FILLPARTID, ["index"]);
                renderCache.effectFill = engine.createEffect({ vertex: "rect2d", fragment: "rect2d" }, ei.attributes, ei.uniforms, [], ei.defines, null, function (e) {
                    //                    renderCache.setupUniformsLocation(e, ei.uniforms, Shape2D.SHAPE2D_FILLPARTID);
                });
            }
            // Need to create WebGL resource for border part?
            if (this.border) {
                var vbSize = (this.notRounded ? 1 : Rectangle2D.roundSubdivisions) * 4 * 2;
                var vb = new Float32Array(vbSize);
                for (var i = 0; i < vbSize; i++) {
                    vb[i] = i;
                }
                renderCache.borderVB = engine.createVertexBuffer(vb);
                var triCount = vbSize;
                var rs = triCount / 2;
                var ib = new Float32Array(triCount * 3);
                for (var i = 0; i < rs; i++) {
                    var r0 = i;
                    var r1 = (i + 1) % rs;
                    ib[i * 6 + 0] = rs + r1;
                    ib[i * 6 + 1] = rs + r0;
                    ib[i * 6 + 2] = r0;
                    ib[i * 6 + 3] = r1;
                    ib[i * 6 + 4] = rs + r1;
                    ib[i * 6 + 5] = r0;
                }
                renderCache.borderIB = engine.createIndexBuffer(ib);
                renderCache.borderIndicesCount = triCount * 3;
                var ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, ["index"]);
                renderCache.effectBorder = engine.createEffect({ vertex: "rect2d", fragment: "rect2d" }, ei.attributes, ei.uniforms, [], ei.defines, null, function (e) {
                    //                    renderCache.setupUniformsLocation(e, ei.uniforms, Shape2D.SHAPE2D_BORDERPARTID);
                });
            }
            return renderCache;
        };
        Rectangle2D.prototype.createInstanceDataParts = function () {
            var res = new Array();
            if (this.border) {
                res.push(new Rectangle2DInstanceData(BABYLON.Shape2D.SHAPE2D_BORDERPARTID));
            }
            if (this.fill) {
                res.push(new Rectangle2DInstanceData(BABYLON.Shape2D.SHAPE2D_FILLPARTID));
            }
            return res;
        };
        Rectangle2D.prototype.refreshInstanceDataPart = function (part) {
            if (!_super.prototype.refreshInstanceDataPart.call(this, part)) {
                return false;
            }
            if (part.id === BABYLON.Shape2D.SHAPE2D_BORDERPARTID) {
                var d = part;
                var size = this.size;
                d.properties = new BABYLON.Vector3(size.width, size.height, this.roundRadius || 0);
            }
            else if (part.id === BABYLON.Shape2D.SHAPE2D_FILLPARTID) {
                var d = part;
                var size = this.size;
                d.properties = new BABYLON.Vector3(size.width, size.height, this.roundRadius || 0);
            }
            return true;
        };
        Rectangle2D.roundSubdivisions = 16;
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 1, function (pi) { return Rectangle2D.sizeProperty = pi; }, false, true)
        ], Rectangle2D.prototype, "size", null);
        __decorate([
            BABYLON.modelLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 2, function (pi) { return Rectangle2D.notRoundedProperty = pi; })
        ], Rectangle2D.prototype, "notRounded", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 3, function (pi) { return Rectangle2D.roundRadiusProperty = pi; })
        ], Rectangle2D.prototype, "roundRadius", null);
        Rectangle2D = __decorate([
            BABYLON.className("Rectangle2D")
        ], Rectangle2D);
        return Rectangle2D;
    })(BABYLON.Shape2D);
    BABYLON.Rectangle2D = Rectangle2D;
})(BABYLON || (BABYLON = {}));
