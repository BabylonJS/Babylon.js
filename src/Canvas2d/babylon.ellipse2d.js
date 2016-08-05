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
        function Ellipse2DRenderCache(engine, modelKey) {
            _super.call(this, engine, modelKey);
            this.effectsReady = false;
            this.fillVB = null;
            this.fillIB = null;
            this.fillIndicesCount = 0;
            this.instancingFillAttributes = null;
            this.effectFillInstanced = null;
            this.effectFill = null;
            this.borderVB = null;
            this.borderIB = null;
            this.borderIndicesCount = 0;
            this.instancingBorderAttributes = null;
            this.effectBorderInstanced = null;
            this.effectBorder = null;
        }
        Ellipse2DRenderCache.prototype.render = function (instanceInfo, context) {
            // Do nothing if the shader is still loading/preparing 
            if (!this.effectsReady) {
                if ((this.effectFill && (!this.effectFill.isReady() || (this.effectFillInstanced && !this.effectFillInstanced.isReady()))) ||
                    (this.effectBorder && (!this.effectBorder.isReady() || (this.effectBorderInstanced && !this.effectBorderInstanced.isReady())))) {
                    return false;
                }
                this.effectsReady = true;
            }
            var canvas = instanceInfo.owner.owner;
            var engine = canvas.engine;
            var depthFunction = 0;
            if (this.effectFill && this.effectBorder) {
                depthFunction = engine.getDepthFunction();
                engine.setDepthFunctionToLessOrEqual();
            }
            var curAlphaMode = engine.getAlphaMode();
            if (this.effectFill) {
                var partIndex = instanceInfo.partIndexFromId.get(BABYLON.Shape2D.SHAPE2D_FILLPARTID.toString());
                var pid = context.groupInfoPartData[partIndex];
                if (context.renderMode !== BABYLON.Render2DContext.RenderModeOpaque) {
                    engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE, true);
                }
                var effect = context.useInstancing ? this.effectFillInstanced : this.effectFill;
                engine.enableEffect(effect);
                engine.bindBuffersDirectly(this.fillVB, this.fillIB, [1], 4, effect);
                if (context.useInstancing) {
                    if (!this.instancingFillAttributes) {
                        this.instancingFillAttributes = this.loadInstancingAttributes(BABYLON.Shape2D.SHAPE2D_FILLPARTID, effect);
                    }
                    var glBuffer = context.instancedBuffers ? context.instancedBuffers[partIndex] : pid._partBuffer;
                    var count = context.instancedBuffers ? context.instancesCount : pid._partData.usedElementCount;
                    canvas._addDrawCallCount(1, context.renderMode);
                    engine.updateAndBindInstancesBuffer(glBuffer, null, this.instancingFillAttributes);
                    engine.draw(true, 0, this.fillIndicesCount, count);
                    engine.unbindInstanceAttributes();
                }
                else {
                    canvas._addDrawCallCount(context.partDataEndIndex - context.partDataStartIndex, context.renderMode);
                    for (var i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
                        this.setupUniforms(effect, partIndex, pid._partData, i);
                        engine.draw(true, 0, this.fillIndicesCount);
                    }
                }
            }
            if (this.effectBorder) {
                var partIndex = instanceInfo.partIndexFromId.get(BABYLON.Shape2D.SHAPE2D_BORDERPARTID.toString());
                var pid = context.groupInfoPartData[partIndex];
                if (context.renderMode !== BABYLON.Render2DContext.RenderModeOpaque) {
                    engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE, true);
                }
                var effect = context.useInstancing ? this.effectBorderInstanced : this.effectBorder;
                engine.enableEffect(effect);
                engine.bindBuffersDirectly(this.borderVB, this.borderIB, [1], 4, effect);
                if (context.useInstancing) {
                    if (!this.instancingBorderAttributes) {
                        this.instancingBorderAttributes = this.loadInstancingAttributes(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, effect);
                    }
                    var glBuffer = context.instancedBuffers ? context.instancedBuffers[partIndex] : pid._partBuffer;
                    var count = context.instancedBuffers ? context.instancesCount : pid._partData.usedElementCount;
                    canvas._addDrawCallCount(1, context.renderMode);
                    engine.updateAndBindInstancesBuffer(glBuffer, null, this.instancingBorderAttributes);
                    engine.draw(true, 0, this.borderIndicesCount, count);
                    engine.unbindInstanceAttributes();
                }
                else {
                    canvas._addDrawCallCount(context.partDataEndIndex - context.partDataStartIndex, context.renderMode);
                    for (var i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
                        this.setupUniforms(effect, partIndex, pid._partData, i);
                        engine.draw(true, 0, this.borderIndicesCount);
                    }
                }
            }
            engine.setAlphaMode(curAlphaMode, true);
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
            this.effectFill = null;
            this.effectFillInstanced = null;
            this.effectBorder = null;
            this.effectBorderInstanced = null;
            if (this.borderVB) {
                this._engine._releaseBuffer(this.borderVB);
                this.borderVB = null;
            }
            if (this.borderIB) {
                this._engine._releaseBuffer(this.borderIB);
                this.borderIB = null;
            }
            return true;
        };
        return Ellipse2DRenderCache;
    })(BABYLON.ModelRenderCache);
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
    })(BABYLON.Shape2DInstanceData);
    BABYLON.Ellipse2DInstanceData = Ellipse2DInstanceData;
    var Ellipse2D = (function (_super) {
        __extends(Ellipse2D, _super);
        /**
         * Create an Ellipse 2D Shape primitive
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id: a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1. You can alternatively use scaleX &| scaleY to apply non uniform scale
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - size: the size of the group. Alternatively the width and height properties can be set. Default will be [10;10].
         * - subdivision: the number of subdivision to create the ellipse perimeter, default is 64.
         * - fill: the brush used to draw the fill content of the ellipse, you can set null to draw nothing (but you will have to set a border brush), default is a SolidColorBrush of plain white. can also be a string value (see Canvas2D.GetBrushFromString)
         * - border: the brush used to draw the border of the ellipse, you can set null to draw nothing (but you will have to set a fill brush), default is null. can be a string value (see Canvas2D.GetBrushFromString)
         * - borderThickness: the thickness of the drawn border, default is 1.
         * - isVisible: true if the group must be visible, false for hidden. Default is true.
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
        function Ellipse2D(settings) {
            // Avoid checking every time if the object exists
            if (settings == null) {
                settings = {};
            }
            _super.call(this, settings);
            if (settings.size != null) {
                this.size = settings.size;
            }
            else if (settings.width || settings.height) {
                var size = new BABYLON.Size(settings.width, settings.height);
                this.size = size;
            }
            var sub = (settings.subdivisions == null) ? 64 : settings.subdivisions;
            this.subdivisions = sub;
        }
        Object.defineProperty(Ellipse2D.prototype, "actualSize", {
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
            var w = this.size.width / 2;
            var h = this.size.height / 2;
            var x = intersectInfo._localPickPosition.x - w;
            var y = intersectInfo._localPickPosition.y - h;
            return ((x * x) / (w * w) + (y * y) / (h * h)) <= 1;
        };
        Ellipse2D.prototype.updateLevelBoundingInfo = function () {
            BABYLON.BoundingInfo2D.CreateFromSizeToRef(this.actualSize, this._levelBoundingInfo);
        };
        Ellipse2D.prototype.createModelRenderCache = function (modelKey) {
            var renderCache = new Ellipse2DRenderCache(this.owner.engine, modelKey);
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
                // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
                var ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_FILLPARTID, ["index"], true);
                if (ei) {
                    renderCache.effectFillInstanced = engine.createEffect({ vertex: "ellipse2d", fragment: "ellipse2d" }, ei.attributes, ei.uniforms, [], ei.defines, null);
                }
                // Get the non instanced version
                ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_FILLPARTID, ["index"], false);
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
                // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
                var ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, ["index"], true);
                if (ei) {
                    renderCache.effectBorderInstanced = engine.createEffect("ellipse2d", ei.attributes, ei.uniforms, [], ei.defines, null);
                }
                // Get the non instanced version
                ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, ["index"], false);
                renderCache.effectBorder = engine.createEffect("ellipse2d", ei.attributes, ei.uniforms, [], ei.defines, null);
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
                var size = this.actualSize;
                d.properties = new BABYLON.Vector3(size.width, size.height, this.subdivisions);
            }
            else if (part.id === BABYLON.Shape2D.SHAPE2D_FILLPARTID) {
                var d = part;
                var size = this.actualSize;
                d.properties = new BABYLON.Vector3(size.width, size.height, this.subdivisions);
            }
            return true;
        };
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 1, function (pi) { return Ellipse2D.acutalSizeProperty = pi; }, false, true)
        ], Ellipse2D.prototype, "actualSize", null);
        __decorate([
            BABYLON.modelLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 2, function (pi) { return Ellipse2D.subdivisionsProperty = pi; })
        ], Ellipse2D.prototype, "subdivisions", null);
        Ellipse2D = __decorate([
            BABYLON.className("Ellipse2D")
        ], Ellipse2D);
        return Ellipse2D;
    })(BABYLON.Shape2D);
    BABYLON.Ellipse2D = Ellipse2D;
})(BABYLON || (BABYLON = {}));
