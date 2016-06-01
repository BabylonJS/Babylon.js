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
    var Text2DRenderCache = (function (_super) {
        __extends(Text2DRenderCache, _super);
        function Text2DRenderCache() {
            _super.apply(this, arguments);
        }
        Text2DRenderCache.prototype.render = function (instanceInfo, context) {
            // Do nothing if the shader is still loading/preparing
            if (!this.effect.isReady() || !this.fontTexture.isReady()) {
                return false;
            }
            // Compute the offset locations of the attributes in the vertexshader that will be mapped to the instance buffer data
            if (!this.instancingAttributes) {
                this.instancingAttributes = this.loadInstancingAttributes(Text2D.TEXT2D_MAINPARTID, this.effect);
            }
            var engine = instanceInfo._owner.owner.engine;
            this.fontTexture.update();
            engine.enableEffect(this.effect);
            this.effect.setTexture("diffuseSampler", this.fontTexture);
            engine.bindBuffersDirectly(this.vb, this.ib, [1], 4, this.effect);
            var cur = engine.getAlphaMode();
            engine.setAlphaMode(BABYLON.Engine.ALPHA_ADD);
            var count = instanceInfo._instancesPartsData[0].usedElementCount;
            if (instanceInfo._owner.owner.supportInstancedArray) {
                engine.updateAndBindInstancesBuffer(instanceInfo._instancesPartsBuffer[0], null, this.instancingAttributes);
                engine.draw(true, 0, 6, count);
                engine.unbindInstanceAttributes();
            }
            else {
                for (var i = 0; i < count; i++) {
                    this.setupUniforms(this.effect, 0, instanceInfo._instancesPartsData[0], i);
                    engine.draw(true, 0, 6);
                }
            }
            engine.setAlphaMode(cur);
            return true;
        };
        Text2DRenderCache.prototype.dispose = function () {
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
            if (this.fontTexture) {
                this.fontTexture.dispose();
                this.fontTexture = null;
            }
            if (this.effect) {
                this._engine._releaseEffect(this.effect);
                this.effect = null;
            }
            return true;
        };
        return Text2DRenderCache;
    }(BABYLON.ModelRenderCache));
    BABYLON.Text2DRenderCache = Text2DRenderCache;
    var Text2DInstanceData = (function (_super) {
        __extends(Text2DInstanceData, _super);
        function Text2DInstanceData(partId, dataElementCount) {
            _super.call(this, partId, dataElementCount);
        }
        Object.defineProperty(Text2DInstanceData.prototype, "topLeftUV", {
            get: function () {
                return null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2DInstanceData.prototype, "sizeUV", {
            get: function () {
                return null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2DInstanceData.prototype, "textureSize", {
            get: function () {
                return null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2DInstanceData.prototype, "color", {
            get: function () {
                return null;
            },
            enumerable: true,
            configurable: true
        });
        __decorate([
            BABYLON.instanceData()
        ], Text2DInstanceData.prototype, "topLeftUV", null);
        __decorate([
            BABYLON.instanceData()
        ], Text2DInstanceData.prototype, "sizeUV", null);
        __decorate([
            BABYLON.instanceData()
        ], Text2DInstanceData.prototype, "textureSize", null);
        __decorate([
            BABYLON.instanceData()
        ], Text2DInstanceData.prototype, "color", null);
        return Text2DInstanceData;
    }(BABYLON.InstanceDataBase));
    BABYLON.Text2DInstanceData = Text2DInstanceData;
    var Text2D = (function (_super) {
        __extends(Text2D, _super);
        function Text2D() {
            _super.apply(this, arguments);
        }
        Object.defineProperty(Text2D.prototype, "fontName", {
            get: function () {
                return this._fontName;
            },
            set: function (value) {
                if (this._fontName) {
                    throw new Error("Font Name change is not supported right now.");
                }
                this._fontName = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D.prototype, "defaultFontColor", {
            get: function () {
                return this._defaultFontColor;
            },
            set: function (value) {
                this._defaultFontColor = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D.prototype, "text", {
            get: function () {
                return this._text;
            },
            set: function (value) {
                this._text = value;
                this._actualSize = null; // A change of text will reset the Actual Area Size which will be recomputed next time it's used
                this._updateCharCount();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D.prototype, "areaSize", {
            get: function () {
                return this._areaSize;
            },
            set: function (value) {
                this._areaSize = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D.prototype, "vAlign", {
            get: function () {
                return this._vAlign;
            },
            set: function (value) {
                this._vAlign = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D.prototype, "hAlign", {
            get: function () {
                return this._hAlign;
            },
            set: function (value) {
                this._hAlign = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D.prototype, "actualSize", {
            get: function () {
                if (this.areaSize) {
                    return this.areaSize;
                }
                if (this._actualSize) {
                    return this._actualSize;
                }
                this._actualSize = this.fontTexture.measureText(this._text, this._tabulationSize);
                return this._actualSize;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D.prototype, "fontTexture", {
            get: function () {
                if (this._fontTexture) {
                    return this._fontTexture;
                }
                this._fontTexture = BABYLON.FontTexture.GetCachedFontTexture(this.owner.scene, this.fontName);
                return this._fontTexture;
            },
            enumerable: true,
            configurable: true
        });
        Text2D.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this._fontTexture) {
                BABYLON.FontTexture.ReleaseCachedFontTexture(this.owner.scene, this.fontName);
                this._fontTexture = null;
            }
            return true;
        };
        Text2D.prototype.updateLevelBoundingInfo = function () {
            BABYLON.BoundingInfo2D.CreateFromSizeToRef(this.actualSize, this._levelBoundingInfo, this.origin);
        };
        Text2D.prototype.setupText2D = function (owner, parent, id, position, origin, fontName, text, areaSize, defaultFontColor, vAlign, hAlign, tabulationSize) {
            this.setupRenderablePrim2D(owner, parent, id, position, origin, true);
            this.fontName = fontName;
            this.defaultFontColor = defaultFontColor;
            this.text = text;
            this.areaSize = areaSize;
            this.vAlign = vAlign;
            this.hAlign = hAlign;
            this._tabulationSize = tabulationSize;
            this._isTransparent = true;
        };
        /**
         * Create a Text primitive
         * @param parent the parent primitive, must be a valid primitive (or the Canvas)
         * @param text the text to display
         * Options:
         *  - id a text identifier, for information purpose
         *  - x: the X position relative to its parent, default is 0
         *  - y: the Y position relative to its parent, default is 0
         *  - origin: define the normalized origin point location, default [0.5;0.5]
         *  - fontName: the name/size/style of the font to use, following the CSS notation. Default is "12pt Arial".
         *  - defaultColor: the color by default to apply on each letter of the text to display, default is plain white.
         *  - areaSize: the size of the area in which to display the text, default is auto-fit from text content.
         *  - vAlign: vertical alignment (areaSize must be specified), default is Text2D.TEXT2D_VALIGN_CENTER
         *  - hAlign: horizontal alignment (areaSize must be specified), default is Text2D.TEXT2D_HALIGN_CENTER
         *  - tabulationSize: number of space character to insert when a tabulation is encountered, default is 4
         */
        Text2D.Create = function (parent, text, options) {
            BABYLON.Prim2DBase.CheckParent(parent);
            var text2d = new Text2D();
            text2d.setupText2D(parent.owner, parent, options && options.id || null, new BABYLON.Vector2(options && options.x || 0, options && options.y || 0), options && options.origin || null, options && options.fontName || "12pt Arial", text, options && options.areaSize, options && options.defaultFontColor || new BABYLON.Color4(1, 1, 1, 1), options && options.vAlign || Text2D.TEXT2D_VALIGN_CENTER, options && options.hAlign || Text2D.TEXT2D_HALIGN_CENTER, options && options.tabulationSize || 4);
            return text2d;
        };
        Text2D.prototype.levelIntersect = function (intersectInfo) {
            // For now I can't do something better that boundingInfo is a hit, detecting an intersection on a particular letter would be possible, but do we really need it? Not for now...
            return true;
        };
        Text2D.prototype.createModelRenderCache = function (modelKey, isTransparent) {
            var renderCache = new Text2DRenderCache(this.owner.engine, modelKey, isTransparent);
            return renderCache;
        };
        Text2D.prototype.setupModelRenderCache = function (modelRenderCache) {
            var renderCache = modelRenderCache;
            var engine = this.owner.engine;
            renderCache.fontTexture = this.fontTexture;
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
            // Effects
            var ei = this.getDataPartEffectInfo(Text2D.TEXT2D_MAINPARTID, ["index"]);
            renderCache.effect = engine.createEffect("text2d", ei.attributes, ei.uniforms, ["diffuseSampler"], ei.defines, null);
            return renderCache;
        };
        Text2D.prototype.createInstanceDataParts = function () {
            return [new Text2DInstanceData(Text2D.TEXT2D_MAINPARTID, this._charCount)];
        };
        // Looks like a hack!? Yes! Because that's what it is!
        // For the InstanceData layer to compute correctly we need to set all the properties involved, which won't be the case if there's no text
        // This method is called before the layout construction for us to detect this case, set some text and return the initial one to restore it after (there can be some text without char to display, say "\t\n" for instance)
        Text2D.prototype.beforeRefreshForLayoutConstruction = function (part) {
            if (!this._charCount) {
                var curText = this._text;
                this.text = "A";
                return curText;
            }
        };
        // if obj contains something, we restore the _text property
        Text2D.prototype.afterRefreshForLayoutConstruction = function (part, obj) {
            if (obj !== undefined) {
                this.text = obj;
            }
        };
        Text2D.prototype.refreshInstanceDataPart = function (part) {
            if (!_super.prototype.refreshInstanceDataPart.call(this, part)) {
                return false;
            }
            if (part.id === Text2D.TEXT2D_MAINPARTID) {
                var d = part;
                var texture = this.fontTexture;
                var ts = texture.getSize();
                var textSize = texture.measureText(this.text, this._tabulationSize);
                var offset = BABYLON.Vector2.Zero();
                var charxpos = 0;
                d.dataElementCount = this._charCount;
                d.curElement = 0;
                for (var _i = 0, _a = this.text; _i < _a.length; _i++) {
                    var char = _a[_i];
                    // Line feed
                    if (char === "\n") {
                        offset.x = 0;
                        offset.y -= texture.lineHeight;
                    }
                    // Tabulation ?
                    if (char === "\t") {
                        var nextPos = charxpos + this._tabulationSize;
                        nextPos = nextPos - (nextPos % this._tabulationSize);
                        offset.x += (nextPos - charxpos) * texture.spaceWidth;
                        charxpos = nextPos;
                        continue;
                    }
                    if (char < " ") {
                        continue;
                    }
                    this.updateInstanceDataPart(d, offset, textSize);
                    var ci = texture.getChar(char);
                    offset.x += ci.charWidth;
                    d.topLeftUV = ci.topLeftUV;
                    var suv = ci.bottomRightUV.subtract(ci.topLeftUV);
                    d.sizeUV = suv;
                    d.textureSize = new BABYLON.Vector2(ts.width, ts.height);
                    d.color = this.defaultFontColor;
                    ++d.curElement;
                }
            }
            return true;
        };
        Text2D.prototype._updateCharCount = function () {
            var count = 0;
            for (var _i = 0, _a = this._text; _i < _a.length; _i++) {
                var char = _a[_i];
                if (char === "\r" || char === "\n" || char === "\t" || char < " ") {
                    continue;
                }
                ++count;
            }
            this._charCount = count;
        };
        Text2D.TEXT2D_MAINPARTID = 1;
        Text2D.TEXT2D_VALIGN_TOP = 1;
        Text2D.TEXT2D_VALIGN_CENTER = 2;
        Text2D.TEXT2D_VALIGN_BOTTOM = 3;
        Text2D.TEXT2D_HALIGN_LEFT = 1;
        Text2D.TEXT2D_HALIGN_CENTER = 2;
        Text2D.TEXT2D_HALIGN_RIGHT = 3;
        __decorate([
            BABYLON.modelLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 1, function (pi) { return Text2D.fontProperty = pi; }, false, true)
        ], Text2D.prototype, "fontName", null);
        __decorate([
            BABYLON.dynamicLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 2, function (pi) { return Text2D.defaultFontColorProperty = pi; })
        ], Text2D.prototype, "defaultFontColor", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 3, function (pi) { return Text2D.textProperty = pi; }, false, true)
        ], Text2D.prototype, "text", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 4, function (pi) { return Text2D.areaSizeProperty = pi; })
        ], Text2D.prototype, "areaSize", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 5, function (pi) { return Text2D.vAlignProperty = pi; })
        ], Text2D.prototype, "vAlign", null);
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 6, function (pi) { return Text2D.hAlignProperty = pi; })
        ], Text2D.prototype, "hAlign", null);
        Text2D = __decorate([
            BABYLON.className("Text2D")
        ], Text2D);
        return Text2D;
    }(BABYLON.RenderablePrim2D));
    BABYLON.Text2D = Text2D;
})(BABYLON || (BABYLON = {}));
