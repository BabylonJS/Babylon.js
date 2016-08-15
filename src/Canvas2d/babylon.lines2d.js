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
    var Lines2DRenderCache = (function (_super) {
        __extends(Lines2DRenderCache, _super);
        function Lines2DRenderCache(engine, modelKey) {
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
        Lines2DRenderCache.prototype.render = function (instanceInfo, context) {
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
                engine.bindBuffersDirectly(this.fillVB, this.fillIB, [2], 2 * 4, effect);
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
                engine.bindBuffersDirectly(this.borderVB, this.borderIB, [2], 2 * 4, effect);
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
        Lines2DRenderCache.prototype.dispose = function () {
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
        return Lines2DRenderCache;
    })(BABYLON.ModelRenderCache);
    BABYLON.Lines2DRenderCache = Lines2DRenderCache;
    var Lines2DInstanceData = (function (_super) {
        __extends(Lines2DInstanceData, _super);
        function Lines2DInstanceData(partId) {
            _super.call(this, partId, 1);
        }
        Object.defineProperty(Lines2DInstanceData.prototype, "boundingMin", {
            get: function () {
                return null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2DInstanceData.prototype, "boundingMax", {
            get: function () {
                return null;
            },
            enumerable: true,
            configurable: true
        });
        __decorate([
            BABYLON.instanceData(BABYLON.Shape2D.SHAPE2D_CATEGORY_FILLGRADIENT)
        ], Lines2DInstanceData.prototype, "boundingMin", null);
        __decorate([
            BABYLON.instanceData(BABYLON.Shape2D.SHAPE2D_CATEGORY_FILLGRADIENT)
        ], Lines2DInstanceData.prototype, "boundingMax", null);
        return Lines2DInstanceData;
    })(BABYLON.Shape2DInstanceData);
    BABYLON.Lines2DInstanceData = Lines2DInstanceData;
    var Lines2D = (function (_super) {
        __extends(Lines2D, _super);
        /**
         * Create an 2D Lines Shape primitive. The defined lines may be opened or closed (see below)
         * @param points an array that describe the points to use to draw the line, must contain at least two entries.
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1. You can alternatively use scaleX &| scaleY to apply non uniform scale
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - fillThickness: the thickness of the fill part of the line, can be null to draw nothing (but a border brush must be given), default is 1.
         * - closed: if false the lines are said to be opened, the first point and the latest DON'T connect. if true the lines are said to be closed, the first and last point will be connected by a line. For instance you can define the 4 points of a rectangle, if you set closed to true a 4 edges rectangle will be drawn. If you set false, only three edges will be drawn, the edge formed by the first and last point won't exist. Default is false.
         * - startCap: Draw a cap of the given type at the start of the first line, you can't define a Cap if the Lines2D is closed. Default is Lines2D.NoCap.
         * - endCap: Draw a cap of the given type at the end of the last line, you can't define a Cap if the Lines2D is closed. Default is Lines2D.NoCap.
         * - fill: the brush used to draw the fill content of the lines, you can set null to draw nothing (but you will have to set a border brush), default is a SolidColorBrush of plain white. can be a string value (see Canvas2D.GetBrushFromString)
         * - border: the brush used to draw the border of the lines, you can set null to draw nothing (but you will have to set a fill brush), default is null. can be a string value (see Canvas2D.GetBrushFromString)
         * - borderThickness: the thickness of the drawn border, default is 1.
         * - isVisible: true if the primitive must be visible, false for hidden. Default is true.
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
        function Lines2D(points, settings) {
            if (!settings) {
                settings = {};
            }
            _super.call(this, settings);
            this._fillVB = null;
            this._fillIB = null;
            this._borderVB = null;
            this._borderIB = null;
            this._size = BABYLON.Size.Zero();
            this._boundingMin = null;
            this._boundingMax = null;
            var fillThickness = (settings.fillThickness == null) ? 1 : settings.fillThickness;
            var startCap = (settings.startCap == null) ? 0 : settings.startCap;
            var endCap = (settings.endCap == null) ? 0 : settings.endCap;
            var closed = (settings.closed == null) ? false : settings.closed;
            this.points = points;
            this.fillThickness = fillThickness;
            this.startCap = startCap;
            this.endCap = endCap;
            this.closed = closed;
        }
        Object.defineProperty(Lines2D, "NoCap", {
            /**
             * No Cap to apply on the extremity
             */
            get: function () { return Lines2D._noCap; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D, "RoundCap", {
            /**
             * A round cap, will use the line thickness as diameter
             */
            get: function () { return Lines2D._roundCap; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D, "TriangleCap", {
            /**
             * Creates a triangle at the extremity.
             */
            get: function () { return Lines2D._triangleCap; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D, "SquareAnchorCap", {
            /**
             * Creates a Square anchor at the extremity, the square size is twice the thickness of the line
             */
            get: function () { return Lines2D._squareAnchorCap; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D, "RoundAnchorCap", {
            /**
             * Creates a round anchor at the extremity, the diameter is twice the thickness of the line
             */
            get: function () { return Lines2D._roundAnchorCap; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D, "DiamondAnchorCap", {
            /**
             * Creates a diamond anchor at the extremity.
             */
            get: function () { return Lines2D._diamondAnchorCap; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D, "ArrowCap", {
            /**
             * Creates an arrow anchor at the extremity. the arrow base size is twice the thickness of the line
             */
            get: function () { return Lines2D._arrowCap; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D.prototype, "points", {
            get: function () {
                return this._points;
            },
            set: function (value) {
                this._points = value;
                this._contour = null;
                this._boundingBoxDirty();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D.prototype, "fillThickness", {
            get: function () {
                return this._fillThickness;
            },
            set: function (value) {
                this._fillThickness = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D.prototype, "closed", {
            get: function () {
                return this._closed;
            },
            set: function (value) {
                this._closed = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D.prototype, "startCap", {
            get: function () {
                return this._startCap;
            },
            set: function (value) {
                this._startCap = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D.prototype, "endCap", {
            get: function () {
                return this._endCap;
            },
            set: function (value) {
                this._endCap = value;
            },
            enumerable: true,
            configurable: true
        });
        Lines2D.prototype.levelIntersect = function (intersectInfo) {
            var _this = this;
            if (this._contour == null) {
                this._computeLines2D();
            }
            var pl = this.points.length;
            var l = this.closed ? pl + 1 : pl;
            var p = intersectInfo._localPickPosition;
            this.transformPointWithOriginToRef(this._contour[0], null, Lines2D._prevA);
            this.transformPointWithOriginToRef(this._contour[1], null, Lines2D._prevB);
            for (var i = 1; i < l; i++) {
                this.transformPointWithOriginToRef(this._contour[(i % pl) * 2 + 0], null, Lines2D._curA);
                this.transformPointWithOriginToRef(this._contour[(i % pl) * 2 + 1], null, Lines2D._curB);
                if (BABYLON.Vector2.PointInTriangle(p, Lines2D._prevA, Lines2D._prevB, Lines2D._curA)) {
                    return true;
                }
                if (BABYLON.Vector2.PointInTriangle(p, Lines2D._curA, Lines2D._prevB, Lines2D._curB)) {
                    return true;
                }
                Lines2D._prevA.x = Lines2D._curA.x;
                Lines2D._prevA.y = Lines2D._curA.y;
                Lines2D._prevB.x = Lines2D._curB.x;
                Lines2D._prevB.y = Lines2D._curB.y;
            }
            var capIntersect = function (tri, points) {
                var l = tri.length;
                for (var i = 0; i < l; i += 3) {
                    Lines2D._curA.x = points[tri[i + 0] * 2 + 0];
                    Lines2D._curA.y = points[tri[i + 0] * 2 + 1];
                    _this.transformPointWithOriginToRef(Lines2D._curA, null, Lines2D._curB);
                    Lines2D._curA.x = points[tri[i + 1] * 2 + 0];
                    Lines2D._curA.y = points[tri[i + 1] * 2 + 1];
                    _this.transformPointWithOriginToRef(Lines2D._curA, null, Lines2D._prevA);
                    Lines2D._curA.x = points[tri[i + 2] * 2 + 0];
                    Lines2D._curA.y = points[tri[i + 2] * 2 + 1];
                    _this.transformPointWithOriginToRef(Lines2D._curA, null, Lines2D._prevB);
                    if (BABYLON.Vector2.PointInTriangle(p, Lines2D._prevA, Lines2D._prevB, Lines2D._curB)) {
                        return true;
                    }
                }
                return false;
            };
            if (this._startCapTriIndices) {
                if (this._startCapTriIndices && capIntersect(this._startCapTriIndices, this._startCapContour)) {
                    return true;
                }
                if (this._endCapTriIndices && capIntersect(this._endCapTriIndices, this._endCapContour)) {
                    return true;
                }
            }
            return false;
        };
        Object.defineProperty(Lines2D.prototype, "boundingMin", {
            get: function () {
                if (!this._boundingMin) {
                    this._computeLines2D();
                }
                return this._boundingMin;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D.prototype, "boundingMax", {
            get: function () {
                if (!this._boundingMax) {
                    this._computeLines2D();
                }
                return this._boundingMax;
            },
            enumerable: true,
            configurable: true
        });
        Lines2D.prototype.getUsedShaderCategories = function (dataPart) {
            var res = _super.prototype.getUsedShaderCategories.call(this, dataPart);
            // Remove the BORDER category, we don't use it in the VertexShader
            var i = res.indexOf(BABYLON.Shape2D.SHAPE2D_CATEGORY_BORDER);
            if (i !== -1) {
                res.splice(i, 1);
            }
            return res;
        };
        Lines2D.prototype.updateLevelBoundingInfo = function () {
            if (!this._boundingMin) {
                this._computeLines2D();
            }
            BABYLON.BoundingInfo2D.CreateFromMinMaxToRef(this._boundingMin.x, this._boundingMax.x, this._boundingMin.y, this._boundingMax.y, this._levelBoundingInfo);
        };
        Lines2D.prototype.createModelRenderCache = function (modelKey) {
            var renderCache = new Lines2DRenderCache(this.owner.engine, modelKey);
            return renderCache;
        };
        ///////////////////////////////////////////////////////////////////////////////////
        // Methods for Lines building
        Lines2D.prototype._perp = function (v, res) {
            res.x = v.y;
            res.y = -v.x;
        };
        ;
        Lines2D.prototype._direction = function (a, b, res) {
            a.subtractToRef(b, res);
            res.normalize();
        };
        Lines2D.prototype._computeMiter = function (tangent, miter, a, b) {
            a.addToRef(b, tangent);
            tangent.normalize();
            miter.x = -tangent.y;
            miter.y = tangent.x;
            Lines2D._miterTps.x = -a.y;
            Lines2D._miterTps.y = a.x;
            return 1 / BABYLON.Vector2.Dot(miter, Lines2D._miterTps);
        };
        Lines2D.prototype._intersect = function (x1, y1, x2, y2, x3, y3, x4, y4) {
            var d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
            if (d === 0)
                return false;
            var xi = ((x3 - x4) * (x1 * y2 - y1 * x2) - (x1 - x2) * (x3 * y4 - y3 * x4)) / d; // Intersection point is xi/yi, just in case...
            //let yi = ((y3 - y4) * (x1 * y2 - y1 * x2) - (y1 - y2) * (x3 * y4 - y3 * x4)) / d; // That's why I left it commented
            if (xi < Math.min(x1, x2) || xi > Math.max(x1, x2))
                return false;
            if (xi < Math.min(x3, x4) || xi > Math.max(x3, x4))
                return false;
            return true;
        };
        Lines2D.prototype._updateMinMax = function (array, offset) {
            if (offset >= array.length) {
                return;
            }
            this._boundingMin.x = Math.min(this._boundingMin.x, array[offset]);
            this._boundingMax.x = Math.max(this._boundingMax.x, array[offset]);
            this._boundingMin.y = Math.min(this._boundingMin.y, array[offset + 1]);
            this._boundingMax.y = Math.max(this._boundingMax.y, array[offset + 1]);
        };
        Lines2D.prototype._store = function (array, contour, index, max, p, n, halfThickness, borderThickness, detectFlip) {
            var borderMode = borderThickness != null && !isNaN(borderThickness);
            var off = index * (borderMode ? 8 : 4);
            // Mandatory because we'll be out of bound in case of closed line, for the very last point (which is a duplicate of the first that we don't store in the vb)
            if (off >= array.length) {
                return;
            }
            // Store start/end normal, we need it for the cap construction
            if (index === 0) {
                this._perp(n, Lines2D._startDir);
            }
            else if (index === max - 1) {
                this._perp(n, Lines2D._endDir);
                Lines2D._endDir.x *= -1;
                Lines2D._endDir.y *= -1;
            }
            var swap = false;
            array[off + 0] = p.x + n.x * halfThickness;
            array[off + 1] = p.y + n.y * halfThickness;
            array[off + 2] = p.x + n.x * -halfThickness;
            array[off + 3] = p.y + n.y * -halfThickness;
            this._updateMinMax(array, off);
            this._updateMinMax(array, off + 2);
            // If an index is given we check if the two segments formed between [index+0;detectFlip+0] and [index+2;detectFlip+2] intersect themselves.
            // It should not be the case, they should be parallel, so if they cross, we switch the order of storage to ensure we'll have parallel lines
            if (detectFlip !== undefined) {
                // Flip if intersect
                var flipOff = detectFlip * (borderMode ? 8 : 4);
                if (this._intersect(array[off + 0], array[off + 1], array[flipOff + 0], array[flipOff + 1], array[off + 2], array[off + 3], array[flipOff + 2], array[flipOff + 3])) {
                    swap = true;
                    var tps = array[off + 0];
                    array[off + 0] = array[off + 2];
                    array[off + 2] = tps;
                    tps = array[off + 1];
                    array[off + 1] = array[off + 3];
                    array[off + 3] = tps;
                }
            }
            if (borderMode) {
                var t = halfThickness + borderThickness;
                array[off + 4] = p.x + n.x * (swap ? -t : t);
                array[off + 5] = p.y + n.y * (swap ? -t : t);
                array[off + 6] = p.x + n.x * (swap ? t : -t);
                array[off + 7] = p.y + n.y * (swap ? t : -t);
                this._updateMinMax(array, off + 4);
                this._updateMinMax(array, off + 6);
            }
            if (contour) {
                off += borderMode ? 4 : 0;
                contour.push(new BABYLON.Vector2(array[off + 0], array[off + 1]));
                contour.push(new BABYLON.Vector2(array[off + 2], array[off + 3]));
            }
        };
        Lines2D.prototype._getCapSize = function (type, border) {
            if (border === void 0) { border = false; }
            var sd = Lines2D._roundCapSubDiv;
            // If no array given, we call this to get the size
            var vbsize = 0, ibsize = 0;
            switch (type) {
                case Lines2D.NoCap:
                    {
                        // If the line is not close and we're computing border, we add the size to generate the edge border
                        if (!this.closed && border) {
                            vbsize = 4;
                            ibsize = 6;
                        }
                        else {
                            vbsize = ibsize = 0;
                        }
                        break;
                    }
                case Lines2D.RoundCap:
                    {
                        if (border) {
                            vbsize = sd;
                            ibsize = (sd - 2) * 3;
                        }
                        else {
                            vbsize = (sd / 2) + 1;
                            ibsize = (sd / 2) * 3;
                        }
                        break;
                    }
                case Lines2D.ArrowCap:
                    {
                        if (border) {
                            vbsize = 12;
                            ibsize = 24;
                        }
                        else {
                            vbsize = 3;
                            ibsize = 3;
                        }
                        break;
                    }
                case Lines2D.TriangleCap:
                    {
                        if (border) {
                            vbsize = 6;
                            ibsize = 12;
                        }
                        else {
                            vbsize = 3;
                            ibsize = 3;
                        }
                        break;
                    }
                case Lines2D.DiamondAnchorCap:
                    {
                        if (border) {
                            vbsize = 10;
                            ibsize = 24;
                        }
                        else {
                            vbsize = 5;
                            ibsize = 9;
                        }
                        break;
                    }
                case Lines2D.SquareAnchorCap:
                    {
                        if (border) {
                            vbsize = 12;
                            ibsize = 30;
                        }
                        else {
                            vbsize = 4;
                            ibsize = 6;
                        }
                        break;
                    }
                case Lines2D.RoundAnchorCap:
                    {
                        if (border) {
                            vbsize = sd * 2;
                            ibsize = (sd - 1) * 6;
                        }
                        else {
                            vbsize = sd + 1;
                            ibsize = (sd + 1) * 3;
                        }
                        break;
                    }
            }
            return { vbsize: vbsize * 2, ibsize: ibsize };
        };
        Lines2D.prototype._storeVertex = function (vb, baseOffset, index, basePos, rotation, vertex, contour) {
            var c = Math.cos(rotation);
            var s = Math.sin(rotation);
            Lines2D._tpsV.x = (c * vertex.x) + (-s * vertex.y) + basePos.x;
            Lines2D._tpsV.y = (s * vertex.x) + (c * vertex.y) + basePos.y;
            var offset = baseOffset + (index * 2);
            vb[offset + 0] = Lines2D._tpsV.x;
            vb[offset + 1] = Lines2D._tpsV.y;
            if (contour) {
                contour.push(Lines2D._tpsV.x);
                contour.push(Lines2D._tpsV.y);
            }
            this._updateMinMax(vb, offset);
            return (baseOffset + index * 2) / 2;
        };
        Lines2D.prototype._storeIndex = function (ib, baseOffset, index, vertexIndex) {
            ib[baseOffset + index] = vertexIndex;
        };
        Lines2D.prototype._buildCap = function (vb, vbi, ib, ibi, pos, thickness, borderThickness, type, capDir, contour) {
            // Compute the transformation from the direction of the cap to build relative to our default orientation [1;0] (our cap are by default pointing toward right, horizontal
            var sd = Lines2D._roundCapSubDiv;
            var dir = new BABYLON.Vector2(1, 0);
            var angle = Math.atan2(capDir.y, capDir.x) - Math.atan2(dir.y, dir.x);
            var ht = thickness / 2;
            var t = thickness;
            var borderMode = borderThickness != null;
            var bt = borderThickness;
            switch (type) {
                case Lines2D.NoCap:
                    if (borderMode && !this.closed) {
                        var vi = 0;
                        var ii = 0;
                        var v1 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, ht + bt), contour);
                        var v2 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(bt, ht + bt), contour);
                        var v3 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(bt, -(ht + bt)), contour);
                        var v4 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, -(ht + bt)), contour);
                        this._storeIndex(ib, ibi, ii++, v1);
                        this._storeIndex(ib, ibi, ii++, v2);
                        this._storeIndex(ib, ibi, ii++, v3);
                        this._storeIndex(ib, ibi, ii++, v1);
                        this._storeIndex(ib, ibi, ii++, v3);
                        this._storeIndex(ib, ibi, ii++, v4);
                    }
                    break;
                case Lines2D.ArrowCap:
                    ht *= 2;
                case Lines2D.TriangleCap:
                    {
                        if (borderMode) {
                            var f = type === Lines2D.TriangleCap ? bt : Math.sqrt(bt * bt * 2);
                            var v1 = this._storeVertex(vb, vbi, 0, pos, angle, new BABYLON.Vector2(0, ht), null);
                            var v2 = this._storeVertex(vb, vbi, 1, pos, angle, new BABYLON.Vector2(ht, 0), null);
                            var v3 = this._storeVertex(vb, vbi, 2, pos, angle, new BABYLON.Vector2(0, -ht), null);
                            var v4 = this._storeVertex(vb, vbi, 3, pos, angle, new BABYLON.Vector2(0, ht + f), contour);
                            var v5 = this._storeVertex(vb, vbi, 4, pos, angle, new BABYLON.Vector2(ht + f, 0), contour);
                            var v6 = this._storeVertex(vb, vbi, 5, pos, angle, new BABYLON.Vector2(0, -(ht + f)), contour);
                            var ii = 0;
                            this._storeIndex(ib, ibi, ii++, v1);
                            this._storeIndex(ib, ibi, ii++, v4);
                            this._storeIndex(ib, ibi, ii++, v5);
                            this._storeIndex(ib, ibi, ii++, v1);
                            this._storeIndex(ib, ibi, ii++, v5);
                            this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v6);
                            this._storeIndex(ib, ibi, ii++, v3);
                            this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v6);
                            this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v5);
                            if (type === Lines2D.ArrowCap) {
                                var rht = thickness / 2;
                                var v10 = this._storeVertex(vb, vbi, 9, pos, angle, new BABYLON.Vector2(0, -(rht + bt)), null);
                                var v12 = this._storeVertex(vb, vbi, 11, pos, angle, new BABYLON.Vector2(-bt, -(ht + f)), contour);
                                var v11 = this._storeVertex(vb, vbi, 10, pos, angle, new BABYLON.Vector2(-bt, -(rht + bt)), contour);
                                var v7 = this._storeVertex(vb, vbi, 6, pos, angle, new BABYLON.Vector2(0, rht + bt), null);
                                var v8 = this._storeVertex(vb, vbi, 7, pos, angle, new BABYLON.Vector2(-bt, rht + bt), contour);
                                var v9 = this._storeVertex(vb, vbi, 8, pos, angle, new BABYLON.Vector2(-bt, ht + f), contour);
                                this._storeIndex(ib, ibi, ii++, v7);
                                this._storeIndex(ib, ibi, ii++, v8);
                                this._storeIndex(ib, ibi, ii++, v9);
                                this._storeIndex(ib, ibi, ii++, v7);
                                this._storeIndex(ib, ibi, ii++, v9);
                                this._storeIndex(ib, ibi, ii++, v4);
                                this._storeIndex(ib, ibi, ii++, v10);
                                this._storeIndex(ib, ibi, ii++, v12);
                                this._storeIndex(ib, ibi, ii++, v11);
                                this._storeIndex(ib, ibi, ii++, v10);
                                this._storeIndex(ib, ibi, ii++, v6);
                                this._storeIndex(ib, ibi, ii++, v12);
                            }
                        }
                        else {
                            var v1 = this._storeVertex(vb, vbi, 0, pos, angle, new BABYLON.Vector2(0, ht), contour);
                            var v2 = this._storeVertex(vb, vbi, 1, pos, angle, new BABYLON.Vector2(ht, 0), contour);
                            var v3 = this._storeVertex(vb, vbi, 2, pos, angle, new BABYLON.Vector2(0, -ht), contour);
                            this._storeIndex(ib, ibi, 0, v1);
                            this._storeIndex(ib, ibi, 1, v2);
                            this._storeIndex(ib, ibi, 2, v3);
                        }
                        break;
                    }
                case Lines2D.RoundCap:
                    {
                        if (borderMode) {
                            var curA = -Math.PI / 2;
                            var incA = Math.PI / (sd / 2 - 1);
                            var ii = 0;
                            for (var i = 0; i < (sd / 2); i++) {
                                var v1 = this._storeVertex(vb, vbi, i * 2 + 0, pos, angle, new BABYLON.Vector2(Math.cos(curA) * ht, Math.sin(curA) * ht), null);
                                var v2 = this._storeVertex(vb, vbi, i * 2 + 1, pos, angle, new BABYLON.Vector2(Math.cos(curA) * (ht + bt), Math.sin(curA) * (ht + bt)), contour);
                                if (i > 0) {
                                    this._storeIndex(ib, ibi, ii++, v1 - 2);
                                    this._storeIndex(ib, ibi, ii++, v2 - 2);
                                    this._storeIndex(ib, ibi, ii++, v2);
                                    this._storeIndex(ib, ibi, ii++, v1 - 2);
                                    this._storeIndex(ib, ibi, ii++, v2);
                                    this._storeIndex(ib, ibi, ii++, v1);
                                }
                                curA += incA;
                            }
                        }
                        else {
                            var c = this._storeVertex(vb, vbi, 0, pos, angle, new BABYLON.Vector2(0, 0), null);
                            var curA = -Math.PI / 2;
                            var incA = Math.PI / (sd / 2 - 1);
                            this._storeVertex(vb, vbi, 1, pos, angle, new BABYLON.Vector2(Math.cos(curA) * ht, Math.sin(curA) * ht), null);
                            curA += incA;
                            for (var i = 1; i < (sd / 2); i++) {
                                var v2 = this._storeVertex(vb, vbi, i + 1, pos, angle, new BABYLON.Vector2(Math.cos(curA) * ht, Math.sin(curA) * ht), contour);
                                this._storeIndex(ib, ibi, i * 3 + 0, c);
                                this._storeIndex(ib, ibi, i * 3 + 1, v2 - 1);
                                this._storeIndex(ib, ibi, i * 3 + 2, v2);
                                curA += incA;
                            }
                        }
                        break;
                    }
                case Lines2D.SquareAnchorCap:
                    {
                        var vi = 0;
                        var c = borderMode ? null : contour;
                        var v1 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, t), c);
                        var v2 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(t * 2, t), c);
                        var v3 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(t * 2, -t), c);
                        var v4 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, -t), c);
                        if (borderMode) {
                            var v5 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, ht + bt), null);
                            var v6 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(-bt, ht + bt), contour);
                            var v7 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(-bt, t + bt), contour);
                            var v8 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(t * 2 + bt, t + bt), contour);
                            var v9 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(t * 2 + bt, -(t + bt)), contour);
                            var v10 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(-bt, -(t + bt)), contour);
                            var v11 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(-bt, -(ht + bt)), contour);
                            var v12 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, -(ht + bt)), null);
                            var ii = 0;
                            this._storeIndex(ib, ibi, ii++, v6);
                            this._storeIndex(ib, ibi, ii++, v1);
                            this._storeIndex(ib, ibi, ii++, v5);
                            this._storeIndex(ib, ibi, ii++, v6);
                            this._storeIndex(ib, ibi, ii++, v7);
                            this._storeIndex(ib, ibi, ii++, v1);
                            this._storeIndex(ib, ibi, ii++, v1);
                            this._storeIndex(ib, ibi, ii++, v7);
                            this._storeIndex(ib, ibi, ii++, v8);
                            this._storeIndex(ib, ibi, ii++, v1);
                            this._storeIndex(ib, ibi, ii++, v8);
                            this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v8);
                            this._storeIndex(ib, ibi, ii++, v9);
                            this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v9);
                            this._storeIndex(ib, ibi, ii++, v3);
                            this._storeIndex(ib, ibi, ii++, v3);
                            this._storeIndex(ib, ibi, ii++, v9);
                            this._storeIndex(ib, ibi, ii++, v10);
                            this._storeIndex(ib, ibi, ii++, v3);
                            this._storeIndex(ib, ibi, ii++, v10);
                            this._storeIndex(ib, ibi, ii++, v4);
                            this._storeIndex(ib, ibi, ii++, v10);
                            this._storeIndex(ib, ibi, ii++, v11);
                            this._storeIndex(ib, ibi, ii++, v4);
                            this._storeIndex(ib, ibi, ii++, v11);
                            this._storeIndex(ib, ibi, ii++, v12);
                            this._storeIndex(ib, ibi, ii++, v4);
                        }
                        else {
                            this._storeIndex(ib, ibi, 0, v1);
                            this._storeIndex(ib, ibi, 1, v2);
                            this._storeIndex(ib, ibi, 2, v3);
                            this._storeIndex(ib, ibi, 3, v1);
                            this._storeIndex(ib, ibi, 4, v3);
                            this._storeIndex(ib, ibi, 5, v4);
                        }
                        break;
                    }
                case Lines2D.RoundAnchorCap:
                    {
                        var cpos = Math.sqrt(t * t - ht * ht);
                        var center = new BABYLON.Vector2(cpos, 0);
                        var curA = BABYLON.Tools.ToRadians(-150);
                        var incA = BABYLON.Tools.ToRadians(300) / (sd - 1);
                        if (borderMode) {
                            var ii = 0;
                            for (var i = 0; i < sd; i++) {
                                var v1 = this._storeVertex(vb, vbi, i * 2 + 0, pos, angle, new BABYLON.Vector2(cpos + Math.cos(curA) * t, Math.sin(curA) * t), null);
                                var v2 = this._storeVertex(vb, vbi, i * 2 + 1, pos, angle, new BABYLON.Vector2(cpos + Math.cos(curA) * (t + bt), Math.sin(curA) * (t + bt)), contour);
                                if (i > 0) {
                                    this._storeIndex(ib, ibi, ii++, v1 - 2);
                                    this._storeIndex(ib, ibi, ii++, v2 - 2);
                                    this._storeIndex(ib, ibi, ii++, v2);
                                    this._storeIndex(ib, ibi, ii++, v1 - 2);
                                    this._storeIndex(ib, ibi, ii++, v2);
                                    this._storeIndex(ib, ibi, ii++, v1);
                                }
                                curA += incA;
                            }
                        }
                        else {
                            var c = this._storeVertex(vb, vbi, 0, pos, angle, center, null);
                            this._storeVertex(vb, vbi, 1, pos, angle, new BABYLON.Vector2(cpos + Math.cos(curA) * t, Math.sin(curA) * t), null);
                            curA += incA;
                            for (var i = 1; i < sd; i++) {
                                var v2 = this._storeVertex(vb, vbi, i + 1, pos, angle, new BABYLON.Vector2(cpos + Math.cos(curA) * t, Math.sin(curA) * t), contour);
                                this._storeIndex(ib, ibi, i * 3 + 0, c);
                                this._storeIndex(ib, ibi, i * 3 + 1, v2 - 1);
                                this._storeIndex(ib, ibi, i * 3 + 2, v2);
                                curA += incA;
                            }
                            this._storeIndex(ib, ibi, sd * 3 + 0, c);
                            this._storeIndex(ib, ibi, sd * 3 + 1, c + 1);
                            this._storeIndex(ib, ibi, sd * 3 + 2, c + sd);
                        }
                        break;
                    }
                case Lines2D.DiamondAnchorCap:
                    {
                        var vi = 0;
                        var c = borderMode ? null : contour;
                        var v1 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, ht), c);
                        var v2 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(ht, t), c);
                        var v3 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(ht * 3, 0), c);
                        var v4 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(ht, -t), c);
                        var v5 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, -ht), c);
                        if (borderMode) {
                            var f = Math.sqrt(bt * bt * 2);
                            var v6 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(-f, ht), contour);
                            var v7 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(ht, t + f), contour);
                            var v8 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(ht * 3 + f, 0), contour);
                            var v9 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(ht, -(t + f)), contour);
                            var v10 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(-f, -ht), contour);
                            var ii = 0;
                            this._storeIndex(ib, ibi, ii++, v6);
                            this._storeIndex(ib, ibi, ii++, v7);
                            this._storeIndex(ib, ibi, ii++, v1);
                            this._storeIndex(ib, ibi, ii++, v1);
                            this._storeIndex(ib, ibi, ii++, v7);
                            this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v7);
                            this._storeIndex(ib, ibi, ii++, v8);
                            this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v8);
                            this._storeIndex(ib, ibi, ii++, v3);
                            this._storeIndex(ib, ibi, ii++, v3);
                            this._storeIndex(ib, ibi, ii++, v8);
                            this._storeIndex(ib, ibi, ii++, v9);
                            this._storeIndex(ib, ibi, ii++, v3);
                            this._storeIndex(ib, ibi, ii++, v9);
                            this._storeIndex(ib, ibi, ii++, v4);
                            this._storeIndex(ib, ibi, ii++, v4);
                            this._storeIndex(ib, ibi, ii++, v9);
                            this._storeIndex(ib, ibi, ii++, v10);
                            this._storeIndex(ib, ibi, ii++, v4);
                            this._storeIndex(ib, ibi, ii++, v10);
                            this._storeIndex(ib, ibi, ii++, v5);
                        }
                        else {
                            this._storeIndex(ib, ibi, 0, v1);
                            this._storeIndex(ib, ibi, 1, v2);
                            this._storeIndex(ib, ibi, 2, v3);
                            this._storeIndex(ib, ibi, 3, v1);
                            this._storeIndex(ib, ibi, 4, v3);
                            this._storeIndex(ib, ibi, 5, v5);
                            this._storeIndex(ib, ibi, 6, v5);
                            this._storeIndex(ib, ibi, 7, v3);
                            this._storeIndex(ib, ibi, 8, v4);
                        }
                        break;
                    }
            }
            return null;
        };
        Lines2D.prototype._buildLine = function (vb, contour, ht, bt) {
            var lineA = BABYLON.Vector2.Zero();
            var lineB = BABYLON.Vector2.Zero();
            var tangent = BABYLON.Vector2.Zero();
            var miter = BABYLON.Vector2.Zero();
            var curNormal = null;
            if (this.closed) {
                this.points.push(this.points[0]);
            }
            var total = this.points.length;
            for (var i = 1; i < total; i++) {
                var last = this.points[i - 1];
                var cur = this.points[i];
                var next = (i < (this.points.length - 1)) ? this.points[i + 1] : null;
                this._direction(cur, last, lineA);
                if (!curNormal) {
                    curNormal = BABYLON.Vector2.Zero();
                    this._perp(lineA, curNormal);
                }
                if (i === 1) {
                    this._store(vb, contour, 0, total, this.points[0], curNormal, ht, bt);
                }
                if (!next) {
                    this._perp(lineA, curNormal);
                    this._store(vb, contour, i, total, this.points[i], curNormal, ht, bt, i - 1);
                }
                else {
                    this._direction(next, cur, lineB);
                    var miterLen = this._computeMiter(tangent, miter, lineA, lineB);
                    this._store(vb, contour, i, total, this.points[i], miter, miterLen * ht, miterLen * bt, i - 1);
                }
            }
            if (this.points.length > 2 && this.closed) {
                var last2 = this.points[total - 2];
                var cur2 = this.points[0];
                var next2 = this.points[1];
                this._direction(cur2, last2, lineA);
                this._direction(next2, cur2, lineB);
                this._perp(lineA, curNormal);
                var miterLen2 = this._computeMiter(tangent, miter, lineA, lineB);
                this._store(vb, null, 0, total, this.points[0], miter, miterLen2 * ht, miterLen2 * bt, 1);
                // Patch contour
                if (contour) {
                    var off = (bt == null) ? 0 : 4;
                    contour[0].x = vb[off + 0];
                    contour[0].y = vb[off + 1];
                    contour[1].x = vb[off + 2];
                    contour[1].y = vb[off + 3];
                }
            }
            // Remove the point we added at the beginning
            if (this.closed) {
                this.points.splice(total - 1);
            }
        };
        // Methods for Lines building
        ///////////////////////////////////////////////////////////////////////////////////
        Lines2D.prototype.setupModelRenderCache = function (modelRenderCache) {
            var renderCache = modelRenderCache;
            var engine = this.owner.engine;
            if (this._fillVB === null) {
                this._computeLines2D();
            }
            // Need to create WebGL resources for fill part?
            if (this.fill) {
                renderCache.fillVB = engine.createVertexBuffer(this._fillVB);
                renderCache.fillIB = engine.createIndexBuffer(this._fillIB);
                renderCache.fillIndicesCount = this._fillIB.length;
                // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
                var ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_FILLPARTID, ["position"], null, true);
                if (ei) {
                    renderCache.effectFillInstanced = engine.createEffect("lines2d", ei.attributes, ei.uniforms, [], ei.defines, null);
                }
                // Get the non instanced version
                ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_FILLPARTID, ["position"], null, false);
                renderCache.effectFill = engine.createEffect("lines2d", ei.attributes, ei.uniforms, [], ei.defines, null);
            }
            // Need to create WebGL resources for border part?
            if (this.border) {
                renderCache.borderVB = engine.createVertexBuffer(this._borderVB);
                renderCache.borderIB = engine.createIndexBuffer(this._borderIB);
                renderCache.borderIndicesCount = this._borderIB.length;
                // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
                var ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, ["position"], null, true);
                if (ei) {
                    renderCache.effectBorderInstanced = engine.createEffect({ vertex: "lines2d", fragment: "lines2d" }, ei.attributes, ei.uniforms, [], ei.defines, null);
                }
                // Get the non instanced version
                ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, ["position"], null, false);
                renderCache.effectBorder = engine.createEffect({ vertex: "lines2d", fragment: "lines2d" }, ei.attributes, ei.uniforms, [], ei.defines, null);
            }
            this._fillVB = null;
            this._fillIB = null;
            this._borderVB = null;
            this._borderIB = null;
            return renderCache;
        };
        Lines2D.prototype._computeLines2D = function () {
            // Init min/max because their being computed here
            this._boundingMin = new BABYLON.Vector2(Number.MAX_VALUE, Number.MAX_VALUE);
            this._boundingMax = new BABYLON.Vector2(Number.MIN_VALUE, Number.MIN_VALUE);
            var contour = new Array();
            var startCapContour = new Array();
            var endCapContour = new Array();
            // Need to create WebGL resources for fill part?
            if (this.fill) {
                var startCapInfo = this._getCapSize(this.startCap);
                var endCapInfo = this._getCapSize(this.endCap);
                var count = this.points.length;
                var vbSize = (count * 2 * 2) + startCapInfo.vbsize + endCapInfo.vbsize;
                this._fillVB = new Float32Array(vbSize);
                var vb = this._fillVB;
                var ht = this.fillThickness / 2;
                var total = this.points.length;
                this._buildLine(vb, this.border ? null : contour, ht);
                var max = total * 2;
                var triCount = (count - (this.closed ? 0 : 1)) * 2;
                this._fillIB = new Float32Array(triCount * 3 + startCapInfo.ibsize + endCapInfo.ibsize);
                var ib = this._fillIB;
                for (var i = 0; i < triCount; i += 2) {
                    ib[i * 3 + 0] = i + 0;
                    ib[i * 3 + 1] = i + 1;
                    ib[i * 3 + 2] = (i + 2) % max;
                    ib[i * 3 + 3] = i + 1;
                    ib[i * 3 + 4] = (i + 3) % max;
                    ib[i * 3 + 5] = (i + 2) % max;
                }
                this._buildCap(vb, count * 2 * 2, ib, triCount * 3, this.points[0], this.fillThickness, null, this.startCap, Lines2D._startDir, this.border ? null : startCapContour);
                this._buildCap(vb, (count * 2 * 2) + startCapInfo.vbsize, ib, (triCount * 3) + startCapInfo.ibsize, this.points[total - 1], this.fillThickness, null, this.endCap, Lines2D._endDir, this.border ? null : startCapContour);
            }
            // Need to create WebGL resources for border part?
            if (this.border) {
                var startCapInfo = this._getCapSize(this.startCap, true);
                var endCapInfo = this._getCapSize(this.endCap, true);
                var count = this.points.length;
                var vbSize = (count * 2 * 2 * 2) + startCapInfo.vbsize + endCapInfo.vbsize;
                this._borderVB = new Float32Array(vbSize);
                var vb = this._borderVB;
                var ht = this.fillThickness / 2;
                var bt = this.borderThickness;
                var total = this.points.length;
                this._buildLine(vb, contour, ht, bt);
                var max = total * 2 * 2;
                var triCount = (count - (this.closed ? 0 : 1)) * 2 * 2;
                this._borderIB = new Float32Array(triCount * 3 + startCapInfo.ibsize + endCapInfo.ibsize);
                var ib = this._borderIB;
                for (var i = 0; i < triCount; i += 4) {
                    ib[i * 3 + 0] = i + 0;
                    ib[i * 3 + 1] = i + 2;
                    ib[i * 3 + 2] = (i + 6) % max;
                    ib[i * 3 + 3] = i + 0;
                    ib[i * 3 + 4] = (i + 6) % max;
                    ib[i * 3 + 5] = (i + 4) % max;
                    ib[i * 3 + 6] = i + 3;
                    ib[i * 3 + 7] = i + 1;
                    ib[i * 3 + 8] = (i + 5) % max;
                    ib[i * 3 + 9] = i + 3;
                    ib[i * 3 + 10] = (i + 5) % max;
                    ib[i * 3 + 11] = (i + 7) % max;
                }
                this._buildCap(vb, count * 2 * 2 * 2, ib, triCount * 3, this.points[0], this.fillThickness, this.borderThickness, this.startCap, Lines2D._startDir, startCapContour);
                this._buildCap(vb, (count * 2 * 2 * 2) + startCapInfo.vbsize, ib, (triCount * 3) + startCapInfo.ibsize, this.points[total - 1], this.fillThickness, this.borderThickness, this.endCap, Lines2D._endDir, endCapContour);
            }
            this._contour = contour;
            if (startCapContour.length > 0) {
                var startCapTri = Earcut.earcut(startCapContour, null, 2);
                this._startCapTriIndices = startCapTri;
                this._startCapContour = startCapContour;
            }
            else {
                this._startCapTriIndices = null;
                this._startCapContour = null;
            }
            if (endCapContour.length > 0) {
                var endCapTri = Earcut.earcut(endCapContour, null, 2);
                this._endCapContour = endCapContour;
                this._endCapTriIndices = endCapTri;
            }
            else {
                this._endCapContour = null;
                this._endCapTriIndices = null;
            }
            var bs = this._boundingMax.subtract(this._boundingMin);
            this._size.width = bs.x;
            this._size.height = bs.y;
        };
        Object.defineProperty(Lines2D.prototype, "size", {
            get: function () {
                if (this._size == null) {
                    this._computeLines2D();
                }
                return this._size;
            },
            enumerable: true,
            configurable: true
        });
        Lines2D.prototype.createInstanceDataParts = function () {
            var res = new Array();
            if (this.border) {
                res.push(new Lines2DInstanceData(BABYLON.Shape2D.SHAPE2D_BORDERPARTID));
            }
            if (this.fill) {
                res.push(new Lines2DInstanceData(BABYLON.Shape2D.SHAPE2D_FILLPARTID));
            }
            return res;
        };
        Lines2D.prototype.refreshInstanceDataPart = function (part) {
            if (!_super.prototype.refreshInstanceDataPart.call(this, part)) {
                return false;
            }
            if (part.id === BABYLON.Shape2D.SHAPE2D_BORDERPARTID) {
                var d = part;
                if (this.border instanceof BABYLON.GradientColorBrush2D) {
                    d.boundingMin = this.boundingMin;
                    d.boundingMax = this.boundingMax;
                }
            }
            else if (part.id === BABYLON.Shape2D.SHAPE2D_FILLPARTID) {
                var d = part;
                if (this.fill instanceof BABYLON.GradientColorBrush2D) {
                    d.boundingMin = this.boundingMin;
                    d.boundingMax = this.boundingMax;
                }
            }
            return true;
        };
        Lines2D._prevA = BABYLON.Vector2.Zero();
        Lines2D._prevB = BABYLON.Vector2.Zero();
        Lines2D._curA = BABYLON.Vector2.Zero();
        Lines2D._curB = BABYLON.Vector2.Zero();
        Lines2D._miterTps = BABYLON.Vector2.Zero();
        Lines2D._startDir = BABYLON.Vector2.Zero();
        Lines2D._endDir = BABYLON.Vector2.Zero();
        Lines2D._tpsV = BABYLON.Vector2.Zero();
        Lines2D._noCap = 0;
        Lines2D._roundCap = 1;
        Lines2D._triangleCap = 2;
        Lines2D._squareAnchorCap = 3;
        Lines2D._roundAnchorCap = 4;
        Lines2D._diamondAnchorCap = 5;
        Lines2D._arrowCap = 6;
        Lines2D._roundCapSubDiv = 36;
        __decorate([
            BABYLON.modelLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 1, function (pi) { return Lines2D.pointsProperty = pi; })
        ], Lines2D.prototype, "points", null);
        __decorate([
            BABYLON.modelLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 2, function (pi) { return Lines2D.fillThicknessProperty = pi; })
        ], Lines2D.prototype, "fillThickness", null);
        __decorate([
            BABYLON.modelLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 3, function (pi) { return Lines2D.closedProperty = pi; })
        ], Lines2D.prototype, "closed", null);
        __decorate([
            BABYLON.modelLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 4, function (pi) { return Lines2D.startCapProperty = pi; })
        ], Lines2D.prototype, "startCap", null);
        __decorate([
            BABYLON.modelLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 5, function (pi) { return Lines2D.endCapProperty = pi; })
        ], Lines2D.prototype, "endCap", null);
        Lines2D = __decorate([
            BABYLON.className("Lines2D")
        ], Lines2D);
        return Lines2D;
    })(BABYLON.Shape2D);
    BABYLON.Lines2D = Lines2D;
})(BABYLON || (BABYLON = {}));
