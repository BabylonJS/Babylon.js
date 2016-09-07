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
            this.effectsReady = false;
            this.vb = null;
            this.ib = null;
            this.instancingAttributes = null;
            this.fontTexture = null;
            this.effect = null;
            this.effectInstanced = null;
        }
        Text2DRenderCache.prototype.render = function (instanceInfo, context) {
            // Do nothing if the shader is still loading/preparing 
            if (!this.effectsReady) {
                if ((this.effect && (!this.effect.isReady() || (this.effectInstanced && !this.effectInstanced.isReady())))) {
                    return false;
                }
                this.effectsReady = true;
            }
            var canvas = instanceInfo.owner.owner;
            var engine = canvas.engine;
            this.fontTexture.update();
            var effect = context.useInstancing ? this.effectInstanced : this.effect;
            engine.enableEffect(effect);
            effect.setTexture("diffuseSampler", this.fontTexture);
            engine.bindBuffersDirectly(this.vb, this.ib, [1], 4, effect);
            var curAlphaMode = engine.getAlphaMode();
            engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE, true);
            var pid = context.groupInfoPartData[0];
            if (context.useInstancing) {
                if (!this.instancingAttributes) {
                    this.instancingAttributes = this.loadInstancingAttributes(Text2D.TEXT2D_MAINPARTID, effect);
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
            engine.setAlphaMode(curAlphaMode, true);
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
                this.fontTexture.decCachedFontTextureCounter();
                this.fontTexture = null;
            }
            this.effect = null;
            this.effectInstanced = null;
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
        Object.defineProperty(Text2DInstanceData.prototype, "superSampleFactor", {
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
        __decorate([
            BABYLON.instanceData()
        ], Text2DInstanceData.prototype, "superSampleFactor", null);
        return Text2DInstanceData;
    }(BABYLON.InstanceDataBase));
    BABYLON.Text2DInstanceData = Text2DInstanceData;
    var Text2D = (function (_super) {
        __extends(Text2D, _super);
        /**
         * Create a Text primitive
         * @param text the text to display
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1. You can alternatively use scaleX &| scaleY to apply non uniform scale
         * - dontInheritParentScale: if set the parent's scale won't be taken into consideration to compute the actualScale property
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - fontName: the name/size/style of the font to use, following the CSS notation. Default is "12pt Arial".
         * - fontSuperSample: if true the text will be rendered with a superSampled font (the font is twice the given size). Use this settings if the text lies in world space or if it's scaled in.
         * - defaultFontColor: the color by default to apply on each letter of the text to display, default is plain white.
         * - areaSize: the size of the area in which to display the text, default is auto-fit from text content.
         * - tabulationSize: number of space character to insert when a tabulation is encountered, default is 4
         * - isVisible: true if the text must be visible, false for hidden. Default is true.
         * - isPickable: if true the Primitive can be used with interaction mode and will issue Pointer Event. If false it will be ignored for interaction/intersection test. Default value is true.
         * - isContainer: if true the Primitive acts as a container for interaction, if the primitive is not pickable or doesn't intersection, no further test will be perform on its children. If set to false, children will always be considered for intersection/interaction. Default value is true.
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
        function Text2D(text, settings) {
            if (!settings) {
                settings = {};
            }
            _super.call(this, settings);
            this.fontName = (settings.fontName == null) ? "12pt Arial" : settings.fontName;
            this._fontSuperSample = (settings.fontSuperSample != null && settings.fontSuperSample);
            this.defaultFontColor = (settings.defaultFontColor == null) ? new BABYLON.Color4(1, 1, 1, 1) : settings.defaultFontColor;
            this._tabulationSize = (settings.tabulationSize == null) ? 4 : settings.tabulationSize;
            this._textSize = null;
            this.text = text;
            this.size = (settings.size == null) ? null : settings.size;
            this._updateRenderMode();
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
                this._textSize = null; // A change of text will reset the TextSize which will be recomputed next time it's used
                this._size = null;
                this._updateCharCount();
                // Trigger a textSize to for a sizeChange if necessary, which is needed for layout to recompute
                var s = this.textSize;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D.prototype, "size", {
            get: function () {
                if (this._size != null) {
                    return this._size;
                }
                return this.textSize;
            },
            set: function (value) {
                this._size = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D.prototype, "actualSize", {
            /**
             * Get the actual size of the Text2D primitive
             */
            get: function () {
                if (this._actualSize) {
                    return this._actualSize;
                }
                return this.size;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D.prototype, "textSize", {
            /**
             * Get the area that bounds the text associated to the primitive
             */
            get: function () {
                if (!this._textSize) {
                    if (this.owner) {
                        var newSize = this.fontTexture.measureText(this._text, this._tabulationSize);
                        if (!newSize.equals(this._textSize)) {
                            this.onPrimitivePropertyDirty(BABYLON.Prim2DBase.sizeProperty.flagId);
                            this._positioningDirty();
                        }
                        this._textSize = newSize;
                    }
                    else {
                        return Text2D.nullSize;
                    }
                }
                return this._textSize;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D.prototype, "fontTexture", {
            get: function () {
                if (this._fontTexture) {
                    return this._fontTexture;
                }
                if (this.fontName == null || this.owner == null || this.owner.scene == null) {
                    return null;
                }
                this._fontTexture = BABYLON.FontTexture.GetCachedFontTexture(this.owner.scene, this.fontName, this._fontSuperSample);
                return this._fontTexture;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Dispose the primitive, remove it from its parent
         */
        Text2D.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this._fontTexture) {
                BABYLON.FontTexture.ReleaseCachedFontTexture(this.owner.scene, this.fontName, this._fontSuperSample);
                this._fontTexture = null;
            }
            return true;
        };
        Text2D.prototype.updateLevelBoundingInfo = function () {
            BABYLON.BoundingInfo2D.CreateFromSizeToRef(this.actualSize, this._levelBoundingInfo);
        };
        Text2D.prototype.levelIntersect = function (intersectInfo) {
            // For now I can't do something better that boundingInfo is a hit, detecting an intersection on a particular letter would be possible, but do we really need it? Not for now...
            return true;
        };
        Text2D.prototype.createModelRenderCache = function (modelKey) {
            var renderCache = new Text2DRenderCache(this.owner.engine, modelKey);
            return renderCache;
        };
        Text2D.prototype.setupModelRenderCache = function (modelRenderCache) {
            var renderCache = modelRenderCache;
            var engine = this.owner.engine;
            renderCache.fontTexture = this.fontTexture;
            renderCache.fontTexture.incCachedFontTextureCounter();
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
            // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
            var ei = this.getDataPartEffectInfo(Text2D.TEXT2D_MAINPARTID, ["index"], null, true);
            if (ei) {
                renderCache.effectInstanced = engine.createEffect("text2d", ei.attributes, ei.uniforms, ["diffuseSampler"], ei.defines, null);
            }
            ei = this.getDataPartEffectInfo(Text2D.TEXT2D_MAINPARTID, ["index"], null, false);
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
                var superSampleFactor = texture.isSuperSampled ? 0.5 : 1;
                var ts = texture.getSize();
                var offset = BABYLON.Vector2.Zero();
                var lh = this.fontTexture.lineHeight;
                offset.y = ((this.textSize.height / lh) - 1) * lh; // Origin is bottom, not top, so the offset is starting with a y that is the top location of the text
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
                    this.updateInstanceDataPart(d, offset);
                    var ci = texture.getChar(char);
                    offset.x += ci.charWidth;
                    d.topLeftUV = ci.topLeftUV;
                    var suv = ci.bottomRightUV.subtract(ci.topLeftUV);
                    d.sizeUV = suv;
                    d.textureSize = new BABYLON.Vector2(ts.width, ts.height);
                    d.color = this.defaultFontColor;
                    d.superSampleFactor = superSampleFactor;
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
        Text2D.prototype._useTextureAlpha = function () {
            return this.fontTexture != null && this.fontTexture.hasAlpha;
        };
        Text2D.prototype._shouldUseAlphaFromTexture = function () {
            return true;
        };
        Text2D.TEXT2D_MAINPARTID = 1;
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
            BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 4, function (pi) { return Text2D.sizeProperty = pi; })
        ], Text2D.prototype, "size", null);
        Text2D = __decorate([
            BABYLON.className("Text2D")
        ], Text2D);
        return Text2D;
    }(BABYLON.RenderablePrim2D));
    BABYLON.Text2D = Text2D;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.text2d.js.map