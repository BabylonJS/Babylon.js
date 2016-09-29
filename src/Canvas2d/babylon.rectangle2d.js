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
        function Rectangle2DRenderCache(engine, modelKey) {
            _super.call(this, engine, modelKey);
            this.effectsReady = false;
            this.fillVB = null;
            this.fillIB = null;
            this.fillIndicesCount = 0;
            this.instancingFillAttributes = null;
            this.effectFill = null;
            this.effectFillInstanced = null;
            this.borderVB = null;
            this.borderIB = null;
            this.borderIndicesCount = 0;
            this.instancingBorderAttributes = null;
            this.effectBorder = null;
            this.effectBorderInstanced = null;
        }
        Rectangle2DRenderCache.prototype.render = function (instanceInfo, context) {
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
        return Rectangle2DRenderCache;
    }(BABYLON.ModelRenderCache));
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
    }(BABYLON.Shape2DInstanceData));
    BABYLON.Rectangle2DInstanceData = Rectangle2DInstanceData;
    var Rectangle2D = (function (_super) {
        __extends(Rectangle2D, _super);
        /**
         * Create an Rectangle 2D Shape primitive. May be a sharp rectangle (with sharp corners), or a rounded one.
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y settings can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1. You can alternatively use scaleX &| scaleY to apply non uniform scale
         * - dontInheritParentScale: if set the parent's scale won't be taken into consideration to compute the actualScale property
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - size: the size of the group. Alternatively the width and height settings can be set. Default will be [10;10].
         * - roundRadius: if the rectangle has rounded corner, set their radius, default is 0 (to get a sharp edges rectangle).
         * - fill: the brush used to draw the fill content of the rectangle, you can set null to draw nothing (but you will have to set a border brush), default is a SolidColorBrush of plain white. can also be a string value (see Canvas2D.GetBrushFromString)
         * - border: the brush used to draw the border of the rectangle, you can set null to draw nothing (but you will have to set a fill brush), default is null. can also be a string value (see Canvas2D.GetBrushFromString)
         * - borderThickness: the thickness of the drawn border, default is 1.
         * - isVisible: true if the primitive must be visible, false for hidden. Default is true.
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
        function Rectangle2D(settings) {
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
            //let size            = settings.size || (new Size((settings.width === null) ? null : (settings.width || 10), (settings.height === null) ? null : (settings.height || 10)));
            var roundRadius = (settings.roundRadius == null) ? 0 : settings.roundRadius;
            var borderThickness = (settings.borderThickness == null) ? 1 : settings.borderThickness;
            //this.size            = size;
            this.roundRadius = roundRadius;
            this.borderThickness = borderThickness;
        }
        Object.defineProperty(Rectangle2D.prototype, "actualSize", {
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
                this._positioningDirty();
            },
            enumerable: true,
            configurable: true
        });
        Rectangle2D.prototype.levelIntersect = function (intersectInfo) {
            // If we got there it mean the boundingInfo intersection succeed, if the rectangle has not roundRadius, it means it succeed!
            if (this.notRounded) {
                return true;
            }
            // If we got so far it means the bounding box at least passed, so we know it's inside the bounding rectangle, but it can be outside the roundedRectangle.
            // The easiest way is to check if the point is inside on of the four corners area (a little square of roundRadius size at the four corners)
            // If it's the case for one, check if the mouse is located in the quarter that we care about (the one who is visible) then finally make a distance check with the roundRadius radius to see if it's inside the circle quarter or outside.
            // First let remove the origin out the equation, to have the rectangle with an origin at bottom/left
            var size = this.size;
            Rectangle2D._i0.x = intersectInfo._localPickPosition.x;
            Rectangle2D._i0.y = intersectInfo._localPickPosition.y;
            var rr = this.roundRadius;
            var rrs = rr * rr;
            // Check if the point is in the bottom/left quarter area
            Rectangle2D._i1.x = rr;
            Rectangle2D._i1.y = rr;
            if (Rectangle2D._i0.x <= Rectangle2D._i1.x && Rectangle2D._i0.y <= Rectangle2D._i1.y) {
                // Compute the intersection point in the quarter local space
                Rectangle2D._i2.x = Rectangle2D._i0.x - Rectangle2D._i1.x;
                Rectangle2D._i2.y = Rectangle2D._i0.y - Rectangle2D._i1.y;
                // It's a hit if the squared distance is less/equal to the squared radius of the round circle
                return Rectangle2D._i2.lengthSquared() <= rrs;
            }
            // Check if the point is in the top/left quarter area
            Rectangle2D._i1.x = rr;
            Rectangle2D._i1.y = size.height - rr;
            if (Rectangle2D._i0.x <= Rectangle2D._i1.x && Rectangle2D._i0.y >= Rectangle2D._i1.y) {
                // Compute the intersection point in the quarter local space
                Rectangle2D._i2.x = Rectangle2D._i0.x - Rectangle2D._i1.x;
                Rectangle2D._i2.y = Rectangle2D._i0.y - Rectangle2D._i1.y;
                // It's a hit if the squared distance is less/equal to the squared radius of the round circle
                return Rectangle2D._i2.lengthSquared() <= rrs;
            }
            // Check if the point is in the top/right quarter area
            Rectangle2D._i1.x = size.width - rr;
            Rectangle2D._i1.y = size.height - rr;
            if (Rectangle2D._i0.x >= Rectangle2D._i1.x && Rectangle2D._i0.y >= Rectangle2D._i1.y) {
                // Compute the intersection point in the quarter local space
                Rectangle2D._i2.x = Rectangle2D._i0.x - Rectangle2D._i1.x;
                Rectangle2D._i2.y = Rectangle2D._i0.y - Rectangle2D._i1.y;
                // It's a hit if the squared distance is less/equal to the squared radius of the round circle
                return Rectangle2D._i2.lengthSquared() <= rrs;
            }
            // Check if the point is in the bottom/right quarter area
            Rectangle2D._i1.x = size.width - rr;
            Rectangle2D._i1.y = rr;
            if (Rectangle2D._i0.x >= Rectangle2D._i1.x && Rectangle2D._i0.y <= Rectangle2D._i1.y) {
                // Compute the intersection point in the quarter local space
                Rectangle2D._i2.x = Rectangle2D._i0.x - Rectangle2D._i1.x;
                Rectangle2D._i2.y = Rectangle2D._i0.y - Rectangle2D._i1.y;
                // It's a hit if the squared distance is less/equal to the squared radius of the round circle
                return Rectangle2D._i2.lengthSquared() <= rrs;
            }
            // At any other locations the point is guarantied to be inside
            return true;
        };
        Rectangle2D.prototype.updateLevelBoundingInfo = function () {
            BABYLON.BoundingInfo2D.CreateFromSizeToRef(this.actualSize, this._levelBoundingInfo);
        };
        Rectangle2D.prototype.createModelRenderCache = function (modelKey) {
            var renderCache = new Rectangle2DRenderCache(this.owner.engine, modelKey);
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
                // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
                var ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_FILLPARTID, ["index"], null, true);
                if (ei) {
                    renderCache.effectFillInstanced = engine.createEffect("rect2d", ei.attributes, ei.uniforms, [], ei.defines, null);
                }
                // Get the non instanced version
                ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_FILLPARTID, ["index"], null, false);
                renderCache.effectFill = engine.createEffect("rect2d", ei.attributes, ei.uniforms, [], ei.defines, null);
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
                // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
                var ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, ["index"], null, true);
                if (ei) {
                    renderCache.effectBorderInstanced = engine.createEffect("rect2d", ei.attributes, ei.uniforms, [], ei.defines, null);
                }
                // Get the non instanced version
                ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, ["index"], null, false);
                renderCache.effectBorder = engine.createEffect("rect2d", ei.attributes, ei.uniforms, [], ei.defines, null);
            }
            return renderCache;
        };
        // We override this method because if there's a roundRadius set, we will reduce the initial Content Area to make sure the computed area won't intersect with the shape contour. The formula is simple: we shrink the incoming size by the amount of the roundRadius
        Rectangle2D.prototype._getInitialContentAreaToRef = function (primSize, initialContentPosition, initialContentArea) {
            // Fall back to default implementation if there's no round Radius
            if (this._notRounded) {
                _super.prototype._getInitialContentAreaToRef.call(this, primSize, initialContentPosition, initialContentArea);
            }
            else {
                var rr = Math.round((this.roundRadius - (this.roundRadius / Math.sqrt(2))) * 1.3);
                initialContentPosition.x = initialContentPosition.y = rr;
                initialContentArea.width = Math.max(0, primSize.width - (rr * 2));
                initialContentArea.height = Math.max(0, primSize.height - (rr * 2));
            }
        };
        Rectangle2D.prototype._getActualSizeFromContentToRef = function (primSize, newPrimSize) {
            // Fall back to default implementation if there's no round Radius
            if (this._notRounded) {
                _super.prototype._getActualSizeFromContentToRef.call(this, primSize, newPrimSize);
            }
            else {
                var rr = Math.round((this.roundRadius - (this.roundRadius / Math.sqrt(2))) * 1.3);
                newPrimSize.copyFrom(primSize);
                newPrimSize.width += rr * 2;
                newPrimSize.height += rr * 2;
            }
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
                var size = this.actualSize;
                var s = this.actualScale;
                d.properties = new BABYLON.Vector3(size.width * s.x, size.height * s.y, this.roundRadius || 0);
            }
            else if (part.id === BABYLON.Shape2D.SHAPE2D_FILLPARTID) {
                var d = part;
                var size = this.actualSize;
                var s = this.actualScale;
                d.properties = new BABYLON.Vector3(size.width * s.x, size.height * s.y, this.roundRadius || 0);
            }
            return true;
        };
        Rectangle2D._i0 = BABYLON.Vector2.Zero();
        Rectangle2D._i1 = BABYLON.Vector2.Zero();
        Rectangle2D._i2 = BABYLON.Vector2.Zero();
        Rectangle2D.roundSubdivisions = 16;
        __decorate([
            BABYLON.instanceLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 1, function (pi) { return Rectangle2D.actualSizeProperty = pi; }, false, true)
        ], Rectangle2D.prototype, "actualSize", null);
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
    }(BABYLON.Shape2D));
    BABYLON.Rectangle2D = Rectangle2D;
})(BABYLON || (BABYLON = {}));
