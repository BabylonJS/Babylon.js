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
            this.effectsReady = false;
            this.vb = null;
            this.ib = null;
            this.instancingAttributes = null;
            this.texture = null;
            this.effect = null;
            this.effectInstanced = null;
        }
        Sprite2DRenderCache.prototype.render = function (instanceInfo, context) {
            // Do nothing if the shader is still loading/preparing 
            if (!this.effectsReady) {
                if ((this.effect && (!this.effect.isReady() || (this.effectInstanced && !this.effectInstanced.isReady())))) {
                    return false;
                }
                this.effectsReady = true;
            }
            // Compute the offset locations of the attributes in the vertex shader that will be mapped to the instance buffer data
            var canvas = instanceInfo.owner.owner;
            var engine = canvas.engine;
            var cur = engine.getAlphaMode();
            var effect = context.useInstancing ? this.effectInstanced : this.effect;
            engine.enableEffect(effect);
            effect.setTexture("diffuseSampler", this.texture);
            engine.bindBuffersDirectly(this.vb, this.ib, [1], 4, effect);
            if (context.renderMode !== BABYLON.Render2DContext.RenderModeOpaque) {
                engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE, true);
            }
            var pid = context.groupInfoPartData[0];
            if (context.useInstancing) {
                if (!this.instancingAttributes) {
                    this.instancingAttributes = this.loadInstancingAttributes(Sprite2D.SPRITE2D_MAINPARTID, effect);
                }
                var glBuffer = context.instancedBuffers ? context.instancedBuffers[0] : pid._partBuffer;
                var count = context.instancedBuffers ? context.instancesCount : pid._partData.usedElementCount;
                canvas._addDrawCallCount(1, context.renderMode);
                engine.updateAndBindInstancesBuffer(glBuffer, null, this.instancingAttributes);
                engine.draw(true, 0, 6, count);
                engine.unbindInstanceAttributes();
            }
            else {
                canvas._addDrawCallCount(context.partDataEndIndex - context.partDataStartIndex, context.renderMode);
                for (var i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
                    this.setupUniforms(effect, 0, pid._partData, i);
                    engine.draw(true, 0, 6);
                }
            }
            engine.setAlphaMode(cur, true);
            return true;
        };
        Sprite2DRenderCache.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this.vb) {
                this._engine._releaseBuffer(this.vb);
                this.vb = null;
            }
            if (this.ib) {
                this._engine._releaseBuffer(this.ib);
                this.ib = null;
            }
            if (this.texture) {
                this.texture.dispose();
                this.texture = null;
            }
            this.effect = null;
            this.effectInstanced = null;
            return true;
        };
        return Sprite2DRenderCache;
    })(BABYLON.ModelRenderCache);
    BABYLON.Sprite2DRenderCache = Sprite2DRenderCache;
    var Sprite2DInstanceData = (function (_super) {
        __extends(Sprite2DInstanceData, _super);
        function Sprite2DInstanceData(partId) {
            _super.call(this, partId, 1);
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
        Object.defineProperty(Sprite2DInstanceData.prototype, "scaleFactor", {
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
        Object.defineProperty(Sprite2DInstanceData.prototype, "properties", {
            // 3 floats being:
            // - x: frame number to display
            // - y: invertY setting
            // - z: alignToPixel setting
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
        ], Sprite2DInstanceData.prototype, "scaleFactor", null);
        __decorate([
            BABYLON.instanceData()
        ], Sprite2DInstanceData.prototype, "textureSize", null);
        __decorate([
            BABYLON.instanceData()
        ], Sprite2DInstanceData.prototype, "properties", null);
        return Sprite2DInstanceData;
    })(BABYLON.InstanceDataBase);
    BABYLON.Sprite2DInstanceData = Sprite2DInstanceData;
    var Sprite2D = (function (_super) {
        __extends(Sprite2D, _super);
        /**
         * Create an 2D Sprite primitive
         * @param texture the texture that stores the sprite to render
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1. You can alternatively use scaleX &| scaleY to apply non uniform scale
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - spriteSize: the size of the sprite (in pixels), if null the size of the given texture will be used, default is null.
         * - spriteLocation: the location (in pixels) in the texture of the top/left corner of the Sprite to display, default is null (0,0)
         * - spriteScaleFactor: say you want to display a sprite twice as big as its bitmap which is 64,64, you set the spriteSize to 128,128 and have to set the spriteScaleFactory to 0.5,0.5 in order to address only the 64,64 pixels of the bitmaps. Default is 1,1.
         * - invertY: if true the texture Y will be inverted, default is false.
         * - alignToPixel: if true the sprite's texels will be aligned to the rendering viewport pixels, ensuring the best rendering quality but slow animations won't be done as smooth as if you set false. If false a texel could lies between two pixels, being blended by the texture sampling mode you choose, the rendering result won't be as good, but very slow animation will be overall better looking. Default is true: content will be aligned.
         * - isVisible: true if the sprite must be visible, false for hidden. Default is true.
         * - childrenFlatZOrder: if true all the children (direct and indirect) will share the same Z-Order. Use this when there's a lot of children which don't overlap. The drawing order IS NOT GUARANTED!
         * - marginTop: top margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginLeft: left margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginRight: right margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginBottom: bottom margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - margin: top, left, right and bottom margin formatted as a single string (see PrimitiveThickness.fromString)
         * - marginHAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginVAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginAlignment: a string defining the alignment, see PrimitiveAlignment.fromString
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see PrimitiveThickness.fromString)
         */
        function Sprite2D(texture, settings) {
            var _this = this;
            if (!settings) {
                settings = {};
            }
            _super.call(this, settings);
            this.texture = texture;
            this.texture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this.texture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this.size = settings.spriteSize;
            this.spriteLocation = settings.spriteLocation || new BABYLON.Vector2(0, 0);
            this.spriteScaleFactor = settings.spriteScaleFactor || new BABYLON.Vector2(1, 1);
            this.spriteFrame = 0;
            this.invertY = (settings.invertY == null) ? false : settings.invertY;
            this.alignToPixel = (settings.alignToPixel == null) ? true : settings.alignToPixel;
            this.isAlphaTest = true;
            if (settings.spriteSize == null || !texture.isReady()) {
                if (texture.isReady()) {
                    this.size = texture.getBaseSize();
                }
                else {
                    texture.onLoadObservable.add(function () {
                        if (settings.spriteSize == null) {
                            _this.size = texture.getBaseSize();
                        }
                        _this._positioningDirty();
                        _this._instanceDirtyFlags |= Sprite2D.textureProperty.flagId; // To make sure the sprite is issued again for render
                    });
                }
            }
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
        Object.defineProperty(Sprite2D.prototype, "actualSize", {
            get: function () {
                if (this._actualSize) {
                    return this._actualSize;
                }
                return this.size;
            },
            set: function (value) {
                this._actualSize = value;
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
        Object.defineProperty(Sprite2D.prototype, "spriteScaleFactor", {
            get: function () {
                return this._spriteScaleFactor;
            },
            set: function (value) {
                this._spriteScaleFactor = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2D.prototype, "alignToPixel", {
            /**
             * Get/set if the sprite rendering should be aligned to the target rendering device pixel or not
             */
            get: function () {
                return this._alignToPixel;
            },
            set: function (value) {
                this._alignToPixel = value;
            },
            enumerable: true,
            configurable: true
        });
        Sprite2D.prototype.updateLevelBoundingInfo = function () {
            BABYLON.BoundingInfo2D.CreateFromSizeToRef(this.size, this._levelBoundingInfo);
        };
        /**
         * Get the animatable array (see http://doc.babylonjs.com/tutorials/Animations)
         */
        Sprite2D.prototype.getAnimatables = function () {
            var res = new Array();
            if (this.texture && this.texture.animations && this.texture.animations.length > 0) {
                res.push(this.texture);
            }
            return res;
        };
        Sprite2D.prototype.levelIntersect = function (intersectInfo) {
            // If we've made it so far it means the boundingInfo intersection test succeed, the Sprite2D is shaped the same, so we always return true
            return true;
        };
        Sprite2D._createCachedCanvasSprite = function (owner, texture, size, pos) {
            var sprite = new Sprite2D(texture, { parent: owner, id: "__cachedCanvasSprite__", position: BABYLON.Vector2.Zero(), origin: BABYLON.Vector2.Zero(), spriteSize: size, spriteLocation: pos, alignToPixel: true });
            return sprite;
        };
        Sprite2D.prototype.createModelRenderCache = function (modelKey) {
            var renderCache = new Sprite2DRenderCache(this.owner.engine, modelKey);
            return renderCache;
        };
        Sprite2D.prototype.setupModelRenderCache = function (modelRenderCache) {
            var renderCache = modelRenderCache;
            var engine = this.owner.engine;
            var vb = new Float32Array(4);
            for (var i = 0; i < 4; i++) {
                vb[i] = i;
            }
            renderCache.vb = engine.createVertexBuffer(vb);
            var ib = new Float32Array(6);
            ib[0] = 0;
            ib[1] = 2;
            ib[2] = 1;
            ib[3] = 0;
            ib[4] = 3;
            ib[5] = 2;
            renderCache.ib = engine.createIndexBuffer(ib);
            renderCache.texture = this.texture;
            // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
            var ei = this.getDataPartEffectInfo(Sprite2D.SPRITE2D_MAINPARTID, ["index"], true);
            if (ei) {
                renderCache.effectInstanced = engine.createEffect("sprite2d", ei.attributes, ei.uniforms, ["diffuseSampler"], ei.defines, null);
            }
            ei = this.getDataPartEffectInfo(Sprite2D.SPRITE2D_MAINPARTID, ["index"], false);
            renderCache.effect = engine.createEffect("sprite2d", ei.attributes, ei.uniforms, ["diffuseSampler"], ei.defines, null);
            return renderCache;
        };
        Sprite2D.prototype.createInstanceDataParts = function () {
            return [new Sprite2DInstanceData(Sprite2D.SPRITE2D_MAINPARTID)];
        };
        Sprite2D.prototype.beforeRefreshForLayoutConstruction = function (part) {
            Sprite2D.layoutConstructMode = true;
        };
        // if obj contains something, we restore the _text property
        Sprite2D.prototype.afterRefreshForLayoutConstruction = function (part, obj) {
            Sprite2D.layoutConstructMode = false;
        };
        Sprite2D.prototype.refreshInstanceDataPart = function (part) {
            if (!_super.prototype.refreshInstanceDataPart.call(this, part)) {
                return false;
            }
            if (!this.texture.isReady() && !Sprite2D.layoutConstructMode) {
                return false;
            }
            if (part.id === Sprite2D.SPRITE2D_MAINPARTID) {
                var d = this._instanceDataParts[0];
                if (Sprite2D.layoutConstructMode) {
                    d.topLeftUV = BABYLON.Vector2.Zero();
                    d.sizeUV = BABYLON.Vector2.Zero();
                    d.properties = BABYLON.Vector3.Zero();
                    d.textureSize = BABYLON.Vector2.Zero();
                    d.scaleFactor = BABYLON.Vector2.Zero();
                }
                else {
                    var ts = this.texture.getBaseSize();
                    var sl = this.spriteLocation;
                    var ss = this.actualSize;
                    var ssf = this.spriteScaleFactor;
                    d.topLeftUV = new BABYLON.Vector2(sl.x / ts.width, sl.y / ts.height);
                    var suv = new BABYLON.Vector2(ss.width / ts.width, ss.height / ts.height);
                    d.sizeUV = suv;
                    d.scaleFactor = ssf;
                    Sprite2D._prop.x = this.spriteFrame;
                    Sprite2D._prop.y = this.invertY ? 1 : 0;
                    Sprite2D._prop.z = this.alignToPixel ? 1 : 0;
                    d.properties = Sprite2D._prop;
                    d.textureSize = new BABYLON.Vector2(ts.width, ts.height);
                }
            }
            return true;
        };
        Sprite2D.SPRITE2D_MAINPARTID = 1;
        Sprite2D._prop = BABYLON.Vector3.Zero();
        Sprite2D.layoutConstructMode = false;
        __decorate([
            BABYLON.modelLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 1, function (pi) { return Sprite2D.textureProperty = pi; })
        ], Sprite2D.prototype, "texture", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 2, function (pi) { return Sprite2D.actualSizeProperty = pi; }, false, true)
        ], Sprite2D.prototype, "actualSize", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 3, function (pi) { return Sprite2D.spriteLocationProperty = pi; })
        ], Sprite2D.prototype, "spriteLocation", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 4, function (pi) { return Sprite2D.spriteFrameProperty = pi; })
        ], Sprite2D.prototype, "spriteFrame", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 5, function (pi) { return Sprite2D.invertYProperty = pi; })
        ], Sprite2D.prototype, "invertY", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 6, function (pi) { return Sprite2D.spriteScaleFactorProperty = pi; })
        ], Sprite2D.prototype, "spriteScaleFactor", null);
        Sprite2D = __decorate([
            BABYLON.className("Sprite2D")
        ], Sprite2D);
        return Sprite2D;
    })(BABYLON.RenderablePrim2D);
    BABYLON.Sprite2D = Sprite2D;
})(BABYLON || (BABYLON = {}));
