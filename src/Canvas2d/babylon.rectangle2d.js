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
        function Rectangle2DRenderCache() {
            _super.apply(this, arguments);
        }
        Rectangle2DRenderCache.prototype.render = function (instanceInfo, context) {
            // Do nothing if the shader is still loading/preparing
            if (!this.effect.isReady()) {
                return false;
            }
            // Compute the offset locations of the attributes in the vertexshader that will be mapped to the instance buffer data
            if (!this.instancingAttributes) {
                this.instancingAttributes = instanceInfo._classTreeInfo.classContent.getInstancingAttributeInfos(this.effect);
            }
            var engine = instanceInfo._owner.owner.engine;
            engine.enableEffect(this.effect);
            engine.bindBuffers(this.fillVB, this.fillIB, [1], 4, this.effect);
            engine.updateAndBindInstancesBuffer(instanceInfo._instancesBuffer, null, this.instancingAttributes);
            engine.draw(true, 0, Rectangle2D.roundSubdivisions * 4 * 3, instanceInfo._instancesData.usedElementCount);
            engine.unBindInstancesBuffer(instanceInfo._instancesBuffer, this.instancingAttributes);
            return true;
        };
        return Rectangle2DRenderCache;
    }(BABYLON.ModelRenderCache));
    BABYLON.Rectangle2DRenderCache = Rectangle2DRenderCache;
    var Rectangle2DInstanceData = (function (_super) {
        __extends(Rectangle2DInstanceData, _super);
        function Rectangle2DInstanceData() {
            _super.apply(this, arguments);
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
    }(BABYLON.InstanceDataBase));
    BABYLON.Rectangle2DInstanceData = Rectangle2DInstanceData;
    var Rectangle2D = (function (_super) {
        __extends(Rectangle2D, _super);
        function Rectangle2D() {
            _super.apply(this, arguments);
        }
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
        Rectangle2D.prototype.updateLevelBoundingInfo = function () {
            this._levelBoundingInfo.radius = Math.sqrt(this.size.width * this.size.width + this.size.height * this.size.height);
            this._levelBoundingInfo.extent = this.size.clone();
        };
        Rectangle2D.prototype.setupRectangle2D = function (owner, parent, id, position, size, roundRadius, fill, border) {
            if (roundRadius === void 0) { roundRadius = 0; }
            this.setupRenderablePrim2D(owner, parent, id, position, true, fill, border);
            this.size = size;
            this.notRounded = !roundRadius;
            this.roundRadius = roundRadius;
        };
        Rectangle2D.Create = function (parent, id, x, y, width, height, fill, border) {
            BABYLON.Prim2DBase.CheckParent(parent);
            var rect = new Rectangle2D();
            rect.setupRectangle2D(parent.owner, parent, id, new BABYLON.Vector2(x, y), new BABYLON.Size(width, height), null);
            rect.fill = fill || BABYLON.Canvas2D.GetSolidColorFillFromHex("#FFFFFFFF");
            rect.border = border;
            return rect;
        };
        Rectangle2D.CreateRounded = function (parent, id, x, y, width, height, roundRadius, fill, border) {
            if (roundRadius === void 0) { roundRadius = 0; }
            BABYLON.Prim2DBase.CheckParent(parent);
            var rect = new Rectangle2D();
            rect.setupRectangle2D(parent.owner, parent, id, new BABYLON.Vector2(x, y), new BABYLON.Size(width, height), roundRadius);
            rect.fill = fill || BABYLON.Canvas2D.GetSolidColorFillFromHex("#FFFFFFFF");
            rect.border = border;
            return rect;
        };
        Rectangle2D.prototype.createModelRenderCache = function () {
            var renderCache = new Rectangle2DRenderCache();
            var engine = this.owner.engine;
            // Need to create vb/ib for the fill part?
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
                    ib[i * 3 + 1] = i + 1;
                    ib[i * 3 + 2] = i + 2;
                }
                ib[triCount * 3 - 1] = 1;
                renderCache.fillIB = engine.createIndexBuffer(ib);
                renderCache.effect = engine.createEffect({ vertex: "rect2d", fragment: "rect2d" }, ["index", "zBias", "transformX", "transformY", "origin", "properties"], [], [], "");
            }
            return renderCache;
        };
        Rectangle2D.prototype.createInstanceData = function () {
            return new Rectangle2DInstanceData();
        };
        Rectangle2D.prototype.refreshInstanceData = function () {
            if (!_super.prototype.refreshInstanceData.call(this)) {
                return false;
            }
            var d = this._instanceData;
            var size = this.size;
            d.properties = new BABYLON.Vector3(size.width, size.height, this.roundRadius || 0);
            return true;
        };
        Rectangle2D.roundSubdivisions = 16;
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 1, function (pi) { return Rectangle2D.sizeProperty = pi; }, false, true)
        ], Rectangle2D.prototype, "size", null);
        __decorate([
            BABYLON.modelLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 2, function (pi) { return Rectangle2D.notRoundedProperty = pi; })
        ], Rectangle2D.prototype, "notRounded", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 3, function (pi) { return Rectangle2D.roundRadiusProperty = pi; })
        ], Rectangle2D.prototype, "roundRadius", null);
        Rectangle2D = __decorate([
            BABYLON.className("Rectangle2D")
        ], Rectangle2D);
        return Rectangle2D;
    }(BABYLON.RenderablePrim2D));
    BABYLON.Rectangle2D = Rectangle2D;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.rectangle2d.js.map