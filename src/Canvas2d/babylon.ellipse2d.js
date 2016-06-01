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
    var Ellipse2DRenderCache = (function (_super) {
        __extends(Ellipse2DRenderCache, _super);
        function Ellipse2DRenderCache(engine, modelKey, isTransparent) {
            _super.call(this, engine, modelKey, isTransparent);
        }
        Ellipse2DRenderCache.prototype.render = function (instanceInfo, context) {
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
                engine.bindBuffersDirectly(this.fillVB, this.fillIB, [1], 4, this.effectFill);
                var count = instanceInfo._instancesPartsData[partIndex].usedElementCount;
                if (instanceInfo._owner.owner.supportInstancedArray) {
                    if (!this.instancingFillAttributes) {
                        // Compute the offset locations of the attributes in the vertex shader that will be mapped to the instance buffer data
                        this.instancingFillAttributes = this.loadInstancingAttributes(BABYLON.Shape2D.SHAPE2D_FILLPARTID, this.effectFill);
                    }
                    engine.updateAndBindInstancesBuffer(instanceInfo._instancesPartsBuffer[partIndex], null, this.instancingFillAttributes);
                    engine.draw(true, 0, this.fillIndicesCount, count);
                    engine.unbindInstanceAttributes();
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
                engine.bindBuffersDirectly(this.borderVB, this.borderIB, [1], 4, this.effectBorder);
                var count = instanceInfo._instancesPartsData[partIndex].usedElementCount;
                if (instanceInfo._owner.owner.supportInstancedArray) {
                    if (!this.instancingBorderAttributes) {
                        this.instancingBorderAttributes = this.loadInstancingAttributes(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, this.effectBorder);
                    }
                    engine.updateAndBindInstancesBuffer(instanceInfo._instancesPartsBuffer[partIndex], null, this.instancingBorderAttributes);
                    engine.draw(true, 0, this.borderIndicesCount, count);
                    engine.unbindInstanceAttributes();
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
        Ellipse2DRenderCache.prototype.dispose = function () {
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
        return Ellipse2DRenderCache;
    }(BABYLON.ModelRenderCache));
    BABYLON.Ellipse2DRenderCache = Ellipse2DRenderCache;
    var Ellipse2DInstanceData = (function (_super) {
        __extends(Ellipse2DInstanceData, _super);
        function Ellipse2DInstanceData(partId) {
            _super.call(this, partId, 1);
        }
        Object.defineProperty(Ellipse2DInstanceData.prototype, "properties", {
            get: function () {
                return null;
            },
            enumerable: true,
            configurable: true
        });
        __decorate([
            BABYLON.instanceData()
        ], Ellipse2DInstanceData.prototype, "properties", null);
        return Ellipse2DInstanceData;
    }(BABYLON.Shape2DInstanceData));
    BABYLON.Ellipse2DInstanceData = Ellipse2DInstanceData;
    var Ellipse2D = (function (_super) {
        __extends(Ellipse2D, _super);
        function Ellipse2D() {
            _super.apply(this, arguments);
        }
        Object.defineProperty(Ellipse2D.prototype, "actualSize", {
            get: function () {
                return this.size;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Ellipse2D.prototype, "size", {
            get: function () {
                return this._size;
            },
            set: function (value) {
                this._size = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Ellipse2D.prototype, "subdivisions", {
            get: function () {
                return this._subdivisions;
            },
            set: function (value) {
                this._subdivisions = value;
            },
            enumerable: true,
            configurable: true
        });
        Ellipse2D.prototype.levelIntersect = function (intersectInfo) {
            var x = intersectInfo._localPickPosition.x;
            var y = intersectInfo._localPickPosition.y;
            var w = this.size.width / 2;
            var h = this.size.height / 2;
            return ((x * x) / (w * w) + (y * y) / (h * h)) <= 1;
        };
        Ellipse2D.prototype.updateLevelBoundingInfo = function () {
            BABYLON.BoundingInfo2D.CreateFromSizeToRef(this.size, this._levelBoundingInfo, this.origin);
        };
        Ellipse2D.prototype.setupEllipse2D = function (owner, parent, id, position, origin, size, subdivisions, fill, border, borderThickness) {
            if (subdivisions === void 0) { subdivisions = 64; }
            if (borderThickness === void 0) { borderThickness = 1; }
            this.setupShape2D(owner, parent, id, position, origin, true, fill, border, borderThickness);
            this.size = size;
            this.subdivisions = subdivisions;
        };
        /**
         * Create an Ellipse 2D Shape primitive
         * @param parent the parent primitive, must be a valid primitive (or the Canvas)
         * options:
         *  - id: a text identifier, for information purpose
         *  - x: the X position relative to its parent, default is 0
         *  - y: the Y position relative to its parent, default is 0
         *  - origin: define the normalized origin point location, default [0.5;0.5]
         *  - width: the width of the ellipse, default is 10
         *  - height: the height of the ellipse, default is 10
         *  - subdivision: the number of subdivision to create the ellipse perimeter, default is 64.
         *  - fill: the brush used to draw the fill content of the ellipse, you can set null to draw nothing (but you will have to set a border brush), default is a SolidColorBrush of plain white.
         *  - border: the brush used to draw the border of the ellipse, you can set null to draw nothing (but you will have to set a fill brush), default is null.
         *  - borderThickness: the thickness of the drawn border, default is 1.
         */
        Ellipse2D.Create = function (parent, options) {
            BABYLON.Prim2DBase.CheckParent(parent);
            var fill;
            if (options && options.fill !== undefined) {
                fill = options.fill;
            }
            else {
                fill = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#FFFFFFFF");
            }
            var ellipse = new Ellipse2D();
            ellipse.setupEllipse2D(parent.owner, parent, options && options.id || null, new BABYLON.Vector2(options && options.x || 0, options && options.y || 0), options && options.origin || null, new BABYLON.Size(options && options.width || 10, options && options.height || 10), options && options.subdivisions || 64, fill, options && options.border || null, options && options.borderThickness || 1);
            return ellipse;
        };
        Ellipse2D.prototype.createModelRenderCache = function (modelKey, isTransparent) {
            var renderCache = new Ellipse2DRenderCache(this.owner.engine, modelKey, isTransparent);
            return renderCache;
        };
        Ellipse2D.prototype.setupModelRenderCache = function (modelRenderCache) {
            var renderCache = modelRenderCache;
            var engine = this.owner.engine;
            // Need to create WebGL resources for fill part?
            if (this.fill) {
                var vbSize = this.subdivisions + 1;
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
                renderCache.effectFill = engine.createEffect({ vertex: "ellipse2d", fragment: "ellipse2d" }, ei.attributes, ei.uniforms, [], ei.defines, null);
            }
            // Need to create WebGL resource for border part?
            if (this.border) {
                var vbSize = this.subdivisions * 2;
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
                renderCache.borderIndicesCount = (triCount * 3);
                var ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, ["index"]);
                renderCache.effectBorder = engine.createEffect({ vertex: "ellipse2d", fragment: "ellipse2d" }, ei.attributes, ei.uniforms, [], ei.defines, null);
            }
            return renderCache;
        };
        Ellipse2D.prototype.createInstanceDataParts = function () {
            var res = new Array();
            if (this.border) {
                res.push(new Ellipse2DInstanceData(BABYLON.Shape2D.SHAPE2D_BORDERPARTID));
            }
            if (this.fill) {
                res.push(new Ellipse2DInstanceData(BABYLON.Shape2D.SHAPE2D_FILLPARTID));
            }
            return res;
        };
        Ellipse2D.prototype.refreshInstanceDataPart = function (part) {
            if (!_super.prototype.refreshInstanceDataPart.call(this, part)) {
                return false;
            }
            if (part.id === BABYLON.Shape2D.SHAPE2D_BORDERPARTID) {
                var d = part;
                var size = this.size;
                d.properties = new BABYLON.Vector3(size.width, size.height, this.subdivisions);
            }
            else if (part.id === BABYLON.Shape2D.SHAPE2D_FILLPARTID) {
                var d = part;
                var size = this.size;
                d.properties = new BABYLON.Vector3(size.width, size.height, this.subdivisions);
            }
            return true;
        };
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 1, function (pi) { return Ellipse2D.sizeProperty = pi; }, false, true)
        ], Ellipse2D.prototype, "size", null);
        __decorate([
            BABYLON.modelLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 2, function (pi) { return Ellipse2D.subdivisionsProperty = pi; })
        ], Ellipse2D.prototype, "subdivisions", null);
        Ellipse2D = __decorate([
            BABYLON.className("Ellipse2D")
        ], Ellipse2D);
        return Ellipse2D;
    }(BABYLON.Shape2D));
    BABYLON.Ellipse2D = Ellipse2D;
})(BABYLON || (BABYLON = {}));
