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
    var Sprite2DRenderCache = (function (_super) {
        __extends(Sprite2DRenderCache, _super);
        function Sprite2DRenderCache() {
            _super.apply(this, arguments);
        }
        Sprite2DRenderCache.prototype.render = function (instanceInfo, context) {
            // Do nothing if the shader is still loading/preparing
            if (!this.effect.isReady() || !this.texture.isReady()) {
                return false;
            }
            // Compute the offset locations of the attributes in the vertexshader that will be mapped to the instance buffer data
            if (!this.instancingAttributes) {
                this.instancingAttributes = instanceInfo._classTreeInfo.classContent.getInstancingAttributeInfos(this.effect);
            }
            var engine = instanceInfo._owner.owner.engine;
            engine.enableEffect(this.effect);
            this.effect.setTexture("diffuseSampler", this.texture);
            engine.bindBuffers(this.vb, this.ib, [1], 4, this.effect);
            engine.updateAndBindInstancesBuffer(instanceInfo._instancesBuffer, null, this.instancingAttributes);
            engine.draw(true, 0, 6, instanceInfo._instancesData.usedElementCount);
            engine.unBindInstancesBuffer(instanceInfo._instancesBuffer, this.instancingAttributes);
            return true;
        };
        return Sprite2DRenderCache;
    }(BABYLON.ModelRenderCache));
    BABYLON.Sprite2DRenderCache = Sprite2DRenderCache;
    var Sprite2DInstanceData = (function (_super) {
        __extends(Sprite2DInstanceData, _super);
        function Sprite2DInstanceData() {
            _super.apply(this, arguments);
        }
        Object.defineProperty(Sprite2DInstanceData.prototype, "topLeftUV", {
            get: function () {
                return null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2DInstanceData.prototype, "sizeUV", {
            get: function () {
                return null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2DInstanceData.prototype, "textureSize", {
            get: function () {
                return null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2DInstanceData.prototype, "frame", {
            get: function () {
                return null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2DInstanceData.prototype, "invertY", {
            get: function () {
                return null;
            },
            enumerable: true,
            configurable: true
        });
        __decorate([
            BABYLON.instanceData()
        ], Sprite2DInstanceData.prototype, "topLeftUV", null);
        __decorate([
            BABYLON.instanceData()
        ], Sprite2DInstanceData.prototype, "sizeUV", null);
        __decorate([
            BABYLON.instanceData()
        ], Sprite2DInstanceData.prototype, "textureSize", null);
        __decorate([
            BABYLON.instanceData()
        ], Sprite2DInstanceData.prototype, "frame", null);
        __decorate([
            BABYLON.instanceData()
        ], Sprite2DInstanceData.prototype, "invertY", null);
        return Sprite2DInstanceData;
    }(BABYLON.InstanceDataBase));
    BABYLON.Sprite2DInstanceData = Sprite2DInstanceData;
    var Sprite2D = (function (_super) {
        __extends(Sprite2D, _super);
        function Sprite2D() {
            _super.apply(this, arguments);
        }
        Object.defineProperty(Sprite2D.prototype, "texture", {
            get: function () {
                return this._texture;
            },
            set: function (value) {
                this._texture = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2D.prototype, "spriteSize", {
            get: function () {
                return this._size;
            },
            set: function (value) {
                this._size = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2D.prototype, "spriteLocation", {
            get: function () {
                return this._location;
            },
            set: function (value) {
                this._location = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2D.prototype, "spriteFrame", {
            get: function () {
                return this._spriteFrame;
            },
            set: function (value) {
                this._spriteFrame = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2D.prototype, "invertY", {
            get: function () {
                return this._invertY;
            },
            set: function (value) {
                this._invertY = value;
            },
            enumerable: true,
            configurable: true
        });
        Sprite2D.prototype.updateLevelBoundingInfo = function () {
            this._levelBoundingInfo.radius = Math.sqrt(this.spriteSize.width * this.spriteSize.width + this.spriteSize.height * this.spriteSize.height);
            this._levelBoundingInfo.extent = this.spriteSize.clone();
        };
        Sprite2D.prototype.setupSprite2D = function (owner, parent, id, position, texture, spriteSize, spriteLocation, invertY) {
            this.setupRenderablePrim2D(owner, parent, id, position, true, null, null);
            this.texture = texture;
            this.spriteSize = spriteSize;
            this.spriteLocation = spriteLocation;
            this.spriteFrame = 0;
            this.invertY = invertY;
        };
        Sprite2D.Create = function (parent, id, x, y, texture, spriteSize, spriteLocation, invertY) {
            if (invertY === void 0) { invertY = false; }
            BABYLON.Prim2DBase.CheckParent(parent);
            var sprite = new Sprite2D();
            sprite.setupSprite2D(parent.owner, parent, id, new BABYLON.Vector2(x, y), texture, spriteSize, spriteLocation, invertY);
            return sprite;
        };
        Sprite2D.prototype.createModelRenderCache = function () {
            var renderCache = new Sprite2DRenderCache();
            var engine = this.owner.engine;
            var vb = new Float32Array(4);
            for (var i = 0; i < 4; i++) {
                vb[i] = i;
            }
            renderCache.vb = engine.createVertexBuffer(vb);
            var ib = new Float32Array(6);
            ib[0] = 0;
            ib[1] = 1;
            ib[2] = 2;
            ib[3] = 0;
            ib[4] = 2;
            ib[5] = 3;
            renderCache.ib = engine.createIndexBuffer(ib);
            renderCache.texture = this.texture;
            renderCache.effect = engine.createEffect({ vertex: "sprite2d", fragment: "sprite2d" }, ["index", "zBias", "transformX", "transformY", "topLeftUV", "sizeUV", "origin", "textureSize", "frame", "invertY"], [], ["diffuseSampler"], "");
            return renderCache;
        };
        Sprite2D.prototype.createInstanceData = function () {
            return new Sprite2DInstanceData();
        };
        Sprite2D.prototype.refreshInstanceData = function () {
            if (!_super.prototype.refreshInstanceData.call(this)) {
                return false;
            }
            var d = this._instanceData;
            var ts = this.texture.getSize();
            var sl = this.spriteLocation;
            var ss = this.spriteSize;
            d.topLeftUV = new BABYLON.Vector2(sl.x / ts.width, sl.y / ts.height);
            var suv = new BABYLON.Vector2(ss.width / ts.width, ss.height / ts.height);
            d.sizeUV = suv;
            d.frame = this.spriteFrame;
            d.textureSize = new BABYLON.Vector2(ts.width, ts.height);
            d.invertY = this.invertY ? 1 : 0;
            return true;
        };
        __decorate([
            BABYLON.modelLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 1, function (pi) { return Sprite2D.textureProperty = pi; })
        ], Sprite2D.prototype, "texture", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 2, function (pi) { return Sprite2D.spriteSizeProperty = pi; }, false, true)
        ], Sprite2D.prototype, "spriteSize", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 3, function (pi) { return Sprite2D.spriteLocationProperty = pi; })
        ], Sprite2D.prototype, "spriteLocation", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 4, function (pi) { return Sprite2D.spriteFrameProperty = pi; })
        ], Sprite2D.prototype, "spriteFrame", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 5, function (pi) { return Sprite2D.invertYProperty = pi; })
        ], Sprite2D.prototype, "invertY", null);
        Sprite2D = __decorate([
            BABYLON.className("Sprite2D")
        ], Sprite2D);
        return Sprite2D;
    }(BABYLON.RenderablePrim2D));
    BABYLON.Sprite2D = Sprite2D;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.sprite2d.js.map