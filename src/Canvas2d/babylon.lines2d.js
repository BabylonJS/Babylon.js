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
            var engine = instanceInfo.owner.owner.engine;
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
                    engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE);
                }
                var effect = context.useInstancing ? this.effectFillInstanced : this.effectFill;
                engine.enableEffect(effect);
                engine.bindBuffersDirectly(this.fillVB, this.fillIB, [2], 2 * 4, effect);
                if (context.useInstancing) {
                    if (!this.instancingFillAttributes) {
                        this.instancingFillAttributes = this.loadInstancingAttributes(BABYLON.Shape2D.SHAPE2D_FILLPARTID, effect);
                    }
                    engine.updateAndBindInstancesBuffer(pid._partBuffer, null, this.instancingFillAttributes);
                    engine.draw(true, 0, this.fillIndicesCount, pid._partData.usedElementCount);
                    engine.unbindInstanceAttributes();
                }
                else {
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
                    engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE);
                }
                var effect = context.useInstancing ? this.effectBorderInstanced : this.effectBorder;
                engine.enableEffect(effect);
                engine.bindBuffersDirectly(this.borderVB, this.borderIB, [2], 2 * 4, effect);
                if (context.useInstancing) {
                    if (!this.instancingBorderAttributes) {
                        this.instancingBorderAttributes = this.loadInstancingAttributes(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, effect);
                    }
                    engine.updateAndBindInstancesBuffer(pid._partBuffer, null, this.instancingBorderAttributes);
                    engine.draw(true, 0, this.borderIndicesCount, pid._partData.usedElementCount);
                    engine.unbindInstanceAttributes();
                }
                else {
                    for (var i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
                        this.setupUniforms(effect, partIndex, pid._partData, i);
                        engine.draw(true, 0, this.borderIndicesCount);
                    }
                }
            }
            engine.setAlphaMode(curAlphaMode);
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
            if (this.effectFill) {
                this._engine._releaseEffect(this.effectFill);
                this.effectFill = null;
            }
            if (this.effectFillInstanced) {
                this._engine._releaseEffect(this.effectFillInstanced);
                this.effectFillInstanced = null;
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
            if (this.effectBorderInstanced) {
                this._engine._releaseEffect(this.effectBorderInstanced);
                this.effectBorderInstanced = null;
            }
            return true;
        };
        return Lines2DRenderCache;
    }(BABYLON.ModelRenderCache));
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
            BABYLON.instanceData()
        ], Lines2DInstanceData.prototype, "boundingMin", null);
        __decorate([
            BABYLON.instanceData()
        ], Lines2DInstanceData.prototype, "boundingMax", null);
        return Lines2DInstanceData;
    }(BABYLON.Shape2DInstanceData));
    BABYLON.Lines2DInstanceData = Lines2DInstanceData;
    var Lines2D = (function (_super) {
        __extends(Lines2D, _super);
        function Lines2D() {
            _super.apply(this, arguments);
        }
        Object.defineProperty(Lines2D, "NoCap", {
            get: function () { return Lines2D._noCap; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D, "RoundCap", {
            get: function () { return Lines2D._roundCap; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D, "TriangleCap", {
            get: function () { return Lines2D._triangleCap; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D, "SquareAnchorCap", {
            get: function () { return Lines2D._squareAnchorCap; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D, "RoundAnchorCap", {
            get: function () { return Lines2D._roundAnchorCap; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D, "DiamondAnchorCap", {
            get: function () { return Lines2D._diamondAnchorCap; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D, "ArrowCap", {
            get: function () { return Lines2D._arrowCap; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D.prototype, "actualSize", {
            get: function () {
                return this.size;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D.prototype, "points", {
            get: function () {
                return this._points;
            },
            set: function (value) {
                this._points = value;
                this._levelBoundingInfoDirty = true;
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
                if (capIntersect(this._startCapTriIndices, this._startCapContour)) {
                    return true;
                }
                if (capIntersect(this._endCapTriIndices, this._endCapContour)) {
                    return true;
                }
            }
            return false;
        };
        Object.defineProperty(Lines2D.prototype, "size", {
            get: function () {
                return this._size;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D.prototype, "boundingMin", {
            get: function () {
                return this._boundingMin;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D.prototype, "boundingMax", {
            get: function () {
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
            BABYLON.BoundingInfo2D.CreateFromMinMaxToRef(this._boundingMin.x, this._boundingMax.x, this._boundingMin.y, this._boundingMax.y, this._levelBoundingInfo, this.origin);
        };
        Lines2D.prototype.setupLines2D = function (owner, parent, id, position, origin, points, fillThickness, startCap, endCap, fill, border, borderThickness, closed, isVisible, marginTop, marginLeft, marginRight, marginBottom, vAlignment, hAlignment) {
            this.setupShape2D(owner, parent, id, position, origin, isVisible, fill, border, borderThickness, marginTop, marginLeft, marginRight, marginBottom, hAlignment, vAlignment);
            this.fillThickness = fillThickness;
            this.startCap = startCap;
            this.endCap = endCap;
            this.points = points;
            this.closed = closed;
            this._size = BABYLON.Size.Zero();
            this._boundingMin = BABYLON.Vector2.Zero();
            this._boundingMax = BABYLON.Vector2.Zero();
        };
        /**
         * Create an 2D Lines Shape primitive. The defined lines may be opened or closed (see below)
         * @param parent the parent primitive, must be a valid primitive (or the Canvas)
         * @param points an array that describe the points to use to draw the line, must contain at least two entries.
         * options:
         *  - id a text identifier, for information purpose
         *  - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         *  - origin: define the normalized origin point location, default [0.5;0.5]
         *  - fillThickness: the thickness of the fill part of the line, can be null to draw nothing (but a border brush must be given), default is 1.
         *  - closed: if false the lines are said to be opened, the first point and the latest DON'T connect. if true the lines are said to be closed, the first and last point will be connected by a line. For instance you can define the 4 points of a rectangle, if you set closed to true a 4 edges rectangle will be drawn. If you set false, only three edges will be drawn, the edge formed by the first and last point won't exist. Default is false.
         *  - Draw a cap of the given type at the start of the first line, you can't define a Cap if the Lines2D is closed. Default is Lines2D.NoCap.
         *  - Draw a cap of the given type at the end of the last line, you can't define a Cap if the Lines2D is closed. Default is Lines2D.NoCap.
         *  - fill: the brush used to draw the fill content of the lines, you can set null to draw nothing (but you will have to set a border brush), default is a SolidColorBrush of plain white.
         *  - border: the brush used to draw the border of the lines, you can set null to draw nothing (but you will have to set a fill brush), default is null.
         *  - borderThickness: the thickness of the drawn border, default is 1.
         *  - isVisible: true if the primitive must be visible, false for hidden. Default is true.
         *  - marginTop/Left/Right/Bottom: define the margin for the corresponding edge, if all of them are null, margin is not used in layout computing. Default Value is null for each.
         *  - hAlighment: define horizontal alignment of the Canvas, alignment is optional, default value null: no alignment.
         *  - vAlighment: define horizontal alignment of the Canvas, alignment is optional, default value null: no alignment.
         */
        Lines2D.Create = function (parent, points, options) {
            BABYLON.Prim2DBase.CheckParent(parent);
            var lines = new Lines2D();
            if (!options) {
                lines.setupLines2D(parent.owner, parent, null, BABYLON.Vector2.Zero(), null, points, 1, 0, 0, BABYLON.Canvas2D.GetSolidColorBrushFromHex("#FFFFFFFF"), null, 1, false, true, null, null, null, null, null, null);
            }
            else {
                var fill = void 0;
                if (options.fill === undefined) {
                    fill = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#FFFFFFFF");
                }
                else {
                    fill = options.fill;
                }
                var pos = options.position || new BABYLON.Vector2(options.x || 0, options.y || 0);
                lines.setupLines2D(parent.owner, parent, options.id || null, pos, options.origin || null, points, (options.fillThickness == null) ? 1 : options.fillThickness, (options.startCap == null) ? 0 : options.startCap, (options.endCap == null) ? 0 : options.endCap, fill, options.border || null, (options.borderThickness == null) ? 1 : options.borderThickness, (options.closed == null) ? false : options.closed, (options.isVisible == null) ? true : options.isVisible, options.marginTop || null, options.marginLeft || null, options.marginRight || null, options.marginBottom || null, options.vAlignment || null, options.hAlignment || null);
            }
            return lines;
        };
        Lines2D.prototype.createModelRenderCache = function (modelKey) {
            var renderCache = new Lines2DRenderCache(this.owner.engine, modelKey);
            return renderCache;
        };
        Lines2D.prototype.setupModelRenderCache = function (modelRenderCache) {
            var _this = this;
            var renderCache = modelRenderCache;
            var engine = this.owner.engine;
            // Init min/max because their being computed here
            this._boundingMin = new BABYLON.Vector2(Number.MAX_VALUE, Number.MAX_VALUE);
            this._boundingMax = new BABYLON.Vector2(Number.MIN_VALUE, Number.MIN_VALUE);
            var perp = function (v, res) {
                res.x = v.y;
                res.y = -v.x;
            };
            var direction = function (a, b, res) {
                a.subtractToRef(b, res);
                res.normalize();
            };
            var tps = BABYLON.Vector2.Zero();
            var computeMiter = function (tangent, miter, a, b) {
                a.addToRef(b, tangent);
                tangent.normalize();
                miter.x = -tangent.y;
                miter.y = tangent.x;
                tps.x = -a.y;
                tps.y = a.x;
                return 1 / BABYLON.Vector2.Dot(miter, tps);
            };
            var intersect = function (x1, y1, x2, y2, x3, y3, x4, y4) {
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
            var startDir = BABYLON.Vector2.Zero();
            var endDir = BABYLON.Vector2.Zero();
            var updateMinMax = function (array, offset) {
                if (offset >= array.length) {
                    return;
                }
                _this._boundingMin.x = Math.min(_this._boundingMin.x, array[offset]);
                _this._boundingMax.x = Math.max(_this._boundingMax.x, array[offset]);
                _this._boundingMin.y = Math.min(_this._boundingMin.y, array[offset + 1]);
                _this._boundingMax.y = Math.max(_this._boundingMax.y, array[offset + 1]);
            };
            var store = function (array, contour, index, max, p, n, halfThickness, borderThickness, detectFlip) {
                var borderMode = borderThickness != null && !isNaN(borderThickness);
                var off = index * (borderMode ? 8 : 4);
                // Mandatory because we'll be out of bound in case of closed line, for the very last point (which is a duplicate of the first that we don't store in the vb)
                if (off >= array.length) {
                    return;
                }
                // Store start/end normal, we need it for the cap construction
                if (index === 0) {
                    perp(n, startDir);
                }
                else if (index === max - 1) {
                    perp(n, endDir);
                    endDir.x *= -1;
                    endDir.y *= -1;
                }
                var swap = false;
                array[off + 0] = p.x + n.x * halfThickness;
                array[off + 1] = p.y + n.y * halfThickness;
                array[off + 2] = p.x + n.x * -halfThickness;
                array[off + 3] = p.y + n.y * -halfThickness;
                updateMinMax(array, off);
                updateMinMax(array, off + 2);
                // If an index is given we check if the two segments formed between [index+0;detectFlip+0] and [index+2;detectFlip+2] intersect themselves.
                // It should not be the case, they should be parallel, so if they cross, we switch the order of storage to ensure we'll have parallel lines
                if (detectFlip !== undefined) {
                    // Flip if intersect
                    var flipOff = detectFlip * (borderMode ? 8 : 4);
                    if (intersect(array[off + 0], array[off + 1], array[flipOff + 0], array[flipOff + 1], array[off + 2], array[off + 3], array[flipOff + 2], array[flipOff + 3])) {
                        swap = true;
                        var tps_1 = array[off + 0];
                        array[off + 0] = array[off + 2];
                        array[off + 2] = tps_1;
                        tps_1 = array[off + 1];
                        array[off + 1] = array[off + 3];
                        array[off + 3] = tps_1;
                    }
                }
                if (borderMode) {
                    var t = halfThickness + borderThickness;
                    array[off + 4] = p.x + n.x * (swap ? -t : t);
                    array[off + 5] = p.y + n.y * (swap ? -t : t);
                    array[off + 6] = p.x + n.x * (swap ? t : -t);
                    array[off + 7] = p.y + n.y * (swap ? t : -t);
                    updateMinMax(array, off + 4);
                    updateMinMax(array, off + 6);
                }
                if (contour) {
                    off += borderMode ? 4 : 0;
                    contour.push(new BABYLON.Vector2(array[off + 0], array[off + 1]));
                    contour.push(new BABYLON.Vector2(array[off + 2], array[off + 3]));
                }
            };
            var sd = Lines2D._roundCapSubDiv;
            var getCapSize = function (type, border) {
                if (border === void 0) { border = false; }
                // If no array given, we call this to get the size
                var vbsize = 0, ibsize = 0;
                switch (type) {
                    case Lines2D.NoCap:
                        // If the line is not close and we're computing border, we add the size to generate the edge border
                        if (!_this.closed && border) {
                            vbsize = 4;
                            ibsize = 6;
                        }
                        else {
                            vbsize = ibsize = 0;
                        }
                        break;
                    case Lines2D.RoundCap:
                        if (border) {
                            vbsize = sd;
                            ibsize = (sd - 2) * 3;
                        }
                        else {
                            vbsize = (sd / 2) + 1;
                            ibsize = (sd / 2) * 3;
                        }
                        break;
                    case Lines2D.ArrowCap:
                        if (border) {
                            vbsize = 12;
                            ibsize = 24;
                        }
                        else {
                            vbsize = 3;
                            ibsize = 3;
                        }
                        break;
                    case Lines2D.TriangleCap:
                        if (border) {
                            vbsize = 6;
                            ibsize = 12;
                        }
                        else {
                            vbsize = 3;
                            ibsize = 3;
                        }
                        break;
                    case Lines2D.DiamondAnchorCap:
                        if (border) {
                            vbsize = 10;
                            ibsize = 24;
                        }
                        else {
                            vbsize = 5;
                            ibsize = 9;
                        }
                        break;
                    case Lines2D.SquareAnchorCap:
                        if (border) {
                            vbsize = 12;
                            ibsize = 30;
                        }
                        else {
                            vbsize = 4;
                            ibsize = 6;
                        }
                        break;
                    case Lines2D.RoundAnchorCap:
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
                return { vbsize: vbsize * 2, ibsize: ibsize };
            };
            var v = BABYLON.Vector2.Zero();
            var storeVertex = function (vb, baseOffset, index, basePos, rotation, vertex, contour) {
                var c = Math.cos(rotation);
                var s = Math.sin(rotation);
                v.x = (c * vertex.x) + (-s * vertex.y) + basePos.x;
                v.y = (s * vertex.x) + (c * vertex.y) + basePos.y;
                var offset = baseOffset + (index * 2);
                vb[offset + 0] = v.x;
                vb[offset + 1] = v.y;
                if (contour) {
                    contour.push(v.x);
                    contour.push(v.y);
                }
                updateMinMax(vb, offset);
                return (baseOffset + index * 2) / 2;
            };
            var storeIndex = function (ib, baseOffset, index, vertexIndex) {
                ib[baseOffset + index] = vertexIndex;
            };
            var buildCap = function (vb, vbi, ib, ibi, pos, thickness, borderThickness, type, capDir, contour) {
                // Compute the transformation from the direction of the cap to build relative to our default orientation [1;0] (our cap are by default pointing toward right, horizontal
                var dir = new BABYLON.Vector2(1, 0);
                var angle = Math.atan2(capDir.y, capDir.x) - Math.atan2(dir.y, dir.x);
                var ht = thickness / 2;
                var t = thickness;
                var borderMode = borderThickness != null;
                var bt = borderThickness;
                switch (type) {
                    case Lines2D.NoCap:
                        if (borderMode && !_this.closed) {
                            var vi = 0;
                            var ii = 0;
                            var v1 = storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, ht + bt), contour);
                            var v2 = storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(bt, ht + bt), contour);
                            var v3 = storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(bt, -(ht + bt)), contour);
                            var v4 = storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, -(ht + bt)), contour);
                            storeIndex(ib, ibi, ii++, v1);
                            storeIndex(ib, ibi, ii++, v2);
                            storeIndex(ib, ibi, ii++, v3);
                            storeIndex(ib, ibi, ii++, v1);
                            storeIndex(ib, ibi, ii++, v3);
                            storeIndex(ib, ibi, ii++, v4);
                        }
                        break;
                    case Lines2D.ArrowCap:
                        ht *= 2;
                    case Lines2D.TriangleCap:
                        {
                            if (borderMode) {
                                var f = type === Lines2D.TriangleCap ? bt : Math.sqrt(bt * bt * 2);
                                var v1 = storeVertex(vb, vbi, 0, pos, angle, new BABYLON.Vector2(0, ht), null);
                                var v2 = storeVertex(vb, vbi, 1, pos, angle, new BABYLON.Vector2(ht, 0), null);
                                var v3 = storeVertex(vb, vbi, 2, pos, angle, new BABYLON.Vector2(0, -ht), null);
                                var v4 = storeVertex(vb, vbi, 3, pos, angle, new BABYLON.Vector2(0, ht + f), contour);
                                var v5 = storeVertex(vb, vbi, 4, pos, angle, new BABYLON.Vector2(ht + f, 0), contour);
                                var v6 = storeVertex(vb, vbi, 5, pos, angle, new BABYLON.Vector2(0, -(ht + f)), contour);
                                var ii = 0;
                                storeIndex(ib, ibi, ii++, v1);
                                storeIndex(ib, ibi, ii++, v4);
                                storeIndex(ib, ibi, ii++, v5);
                                storeIndex(ib, ibi, ii++, v1);
                                storeIndex(ib, ibi, ii++, v5);
                                storeIndex(ib, ibi, ii++, v2);
                                storeIndex(ib, ibi, ii++, v6);
                                storeIndex(ib, ibi, ii++, v3);
                                storeIndex(ib, ibi, ii++, v2);
                                storeIndex(ib, ibi, ii++, v6);
                                storeIndex(ib, ibi, ii++, v2);
                                storeIndex(ib, ibi, ii++, v5);
                                if (type === Lines2D.ArrowCap) {
                                    var rht = thickness / 2;
                                    var v10 = storeVertex(vb, vbi, 9, pos, angle, new BABYLON.Vector2(0, -(rht + bt)), null);
                                    var v12 = storeVertex(vb, vbi, 11, pos, angle, new BABYLON.Vector2(-bt, -(ht + f)), contour);
                                    var v11 = storeVertex(vb, vbi, 10, pos, angle, new BABYLON.Vector2(-bt, -(rht + bt)), contour);
                                    var v7 = storeVertex(vb, vbi, 6, pos, angle, new BABYLON.Vector2(0, rht + bt), null);
                                    var v8 = storeVertex(vb, vbi, 7, pos, angle, new BABYLON.Vector2(-bt, rht + bt), contour);
                                    var v9 = storeVertex(vb, vbi, 8, pos, angle, new BABYLON.Vector2(-bt, ht + f), contour);
                                    storeIndex(ib, ibi, ii++, v7);
                                    storeIndex(ib, ibi, ii++, v8);
                                    storeIndex(ib, ibi, ii++, v9);
                                    storeIndex(ib, ibi, ii++, v7);
                                    storeIndex(ib, ibi, ii++, v9);
                                    storeIndex(ib, ibi, ii++, v4);
                                    storeIndex(ib, ibi, ii++, v10);
                                    storeIndex(ib, ibi, ii++, v12);
                                    storeIndex(ib, ibi, ii++, v11);
                                    storeIndex(ib, ibi, ii++, v10);
                                    storeIndex(ib, ibi, ii++, v6);
                                    storeIndex(ib, ibi, ii++, v12);
                                }
                            }
                            else {
                                var v1 = storeVertex(vb, vbi, 0, pos, angle, new BABYLON.Vector2(0, ht), contour);
                                var v2 = storeVertex(vb, vbi, 1, pos, angle, new BABYLON.Vector2(ht, 0), contour);
                                var v3 = storeVertex(vb, vbi, 2, pos, angle, new BABYLON.Vector2(0, -ht), contour);
                                storeIndex(ib, ibi, 0, v1);
                                storeIndex(ib, ibi, 1, v2);
                                storeIndex(ib, ibi, 2, v3);
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
                                    var v1 = storeVertex(vb, vbi, i * 2 + 0, pos, angle, new BABYLON.Vector2(Math.cos(curA) * ht, Math.sin(curA) * ht), null);
                                    var v2 = storeVertex(vb, vbi, i * 2 + 1, pos, angle, new BABYLON.Vector2(Math.cos(curA) * (ht + bt), Math.sin(curA) * (ht + bt)), contour);
                                    if (i > 0) {
                                        storeIndex(ib, ibi, ii++, v1 - 2);
                                        storeIndex(ib, ibi, ii++, v2 - 2);
                                        storeIndex(ib, ibi, ii++, v2);
                                        storeIndex(ib, ibi, ii++, v1 - 2);
                                        storeIndex(ib, ibi, ii++, v2);
                                        storeIndex(ib, ibi, ii++, v1);
                                    }
                                    curA += incA;
                                }
                            }
                            else {
                                var c = storeVertex(vb, vbi, 0, pos, angle, new BABYLON.Vector2(0, 0), null);
                                var curA = -Math.PI / 2;
                                var incA = Math.PI / (sd / 2 - 1);
                                storeVertex(vb, vbi, 1, pos, angle, new BABYLON.Vector2(Math.cos(curA) * ht, Math.sin(curA) * ht), null);
                                curA += incA;
                                for (var i = 1; i < (sd / 2); i++) {
                                    var v2 = storeVertex(vb, vbi, i + 1, pos, angle, new BABYLON.Vector2(Math.cos(curA) * ht, Math.sin(curA) * ht), contour);
                                    storeIndex(ib, ibi, i * 3 + 0, c);
                                    storeIndex(ib, ibi, i * 3 + 1, v2 - 1);
                                    storeIndex(ib, ibi, i * 3 + 2, v2);
                                    curA += incA;
                                }
                            }
                            break;
                        }
                    case Lines2D.SquareAnchorCap:
                        {
                            var vi = 0;
                            var c = borderMode ? null : contour;
                            var v1 = storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, t), c);
                            var v2 = storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(t * 2, t), c);
                            var v3 = storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(t * 2, -t), c);
                            var v4 = storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, -t), c);
                            if (borderMode) {
                                var v5 = storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, ht + bt), null);
                                var v6 = storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(-bt, ht + bt), contour);
                                var v7 = storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(-bt, t + bt), contour);
                                var v8 = storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(t * 2 + bt, t + bt), contour);
                                var v9 = storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(t * 2 + bt, -(t + bt)), contour);
                                var v10 = storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(-bt, -(t + bt)), contour);
                                var v11 = storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(-bt, -(ht + bt)), contour);
                                var v12 = storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, -(ht + bt)), null);
                                var ii = 0;
                                storeIndex(ib, ibi, ii++, v6);
                                storeIndex(ib, ibi, ii++, v1);
                                storeIndex(ib, ibi, ii++, v5);
                                storeIndex(ib, ibi, ii++, v6);
                                storeIndex(ib, ibi, ii++, v7);
                                storeIndex(ib, ibi, ii++, v1);
                                storeIndex(ib, ibi, ii++, v1);
                                storeIndex(ib, ibi, ii++, v7);
                                storeIndex(ib, ibi, ii++, v8);
                                storeIndex(ib, ibi, ii++, v1);
                                storeIndex(ib, ibi, ii++, v8);
                                storeIndex(ib, ibi, ii++, v2);
                                storeIndex(ib, ibi, ii++, v2);
                                storeIndex(ib, ibi, ii++, v8);
                                storeIndex(ib, ibi, ii++, v9);
                                storeIndex(ib, ibi, ii++, v2);
                                storeIndex(ib, ibi, ii++, v9);
                                storeIndex(ib, ibi, ii++, v3);
                                storeIndex(ib, ibi, ii++, v3);
                                storeIndex(ib, ibi, ii++, v9);
                                storeIndex(ib, ibi, ii++, v10);
                                storeIndex(ib, ibi, ii++, v3);
                                storeIndex(ib, ibi, ii++, v10);
                                storeIndex(ib, ibi, ii++, v4);
                                storeIndex(ib, ibi, ii++, v10);
                                storeIndex(ib, ibi, ii++, v11);
                                storeIndex(ib, ibi, ii++, v4);
                                storeIndex(ib, ibi, ii++, v11);
                                storeIndex(ib, ibi, ii++, v12);
                                storeIndex(ib, ibi, ii++, v4);
                            }
                            else {
                                storeIndex(ib, ibi, 0, v1);
                                storeIndex(ib, ibi, 1, v2);
                                storeIndex(ib, ibi, 2, v3);
                                storeIndex(ib, ibi, 3, v1);
                                storeIndex(ib, ibi, 4, v3);
                                storeIndex(ib, ibi, 5, v4);
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
                                    var v1 = storeVertex(vb, vbi, i * 2 + 0, pos, angle, new BABYLON.Vector2(cpos + Math.cos(curA) * t, Math.sin(curA) * t), null);
                                    var v2 = storeVertex(vb, vbi, i * 2 + 1, pos, angle, new BABYLON.Vector2(cpos + Math.cos(curA) * (t + bt), Math.sin(curA) * (t + bt)), contour);
                                    if (i > 0) {
                                        storeIndex(ib, ibi, ii++, v1 - 2);
                                        storeIndex(ib, ibi, ii++, v2 - 2);
                                        storeIndex(ib, ibi, ii++, v2);
                                        storeIndex(ib, ibi, ii++, v1 - 2);
                                        storeIndex(ib, ibi, ii++, v2);
                                        storeIndex(ib, ibi, ii++, v1);
                                    }
                                    curA += incA;
                                }
                            }
                            else {
                                var c = storeVertex(vb, vbi, 0, pos, angle, center, null);
                                storeVertex(vb, vbi, 1, pos, angle, new BABYLON.Vector2(cpos + Math.cos(curA) * t, Math.sin(curA) * t), null); // contour maybe TODO
                                curA += incA;
                                for (var i = 1; i < sd; i++) {
                                    var v2 = storeVertex(vb, vbi, i + 1, pos, angle, new BABYLON.Vector2(cpos + Math.cos(curA) * t, Math.sin(curA) * t), contour);
                                    storeIndex(ib, ibi, i * 3 + 0, c);
                                    storeIndex(ib, ibi, i * 3 + 1, v2 - 1);
                                    storeIndex(ib, ibi, i * 3 + 2, v2);
                                    curA += incA;
                                }
                                storeIndex(ib, ibi, sd * 3 + 0, c);
                                storeIndex(ib, ibi, sd * 3 + 1, c + 1);
                                storeIndex(ib, ibi, sd * 3 + 2, c + sd);
                            }
                            break;
                        }
                    case Lines2D.DiamondAnchorCap:
                        {
                            var vi = 0;
                            var c = borderMode ? null : contour;
                            var v1 = storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, ht), c);
                            var v2 = storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(ht, t), c);
                            var v3 = storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(ht * 3, 0), c);
                            var v4 = storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(ht, -t), c);
                            var v5 = storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, -ht), c);
                            if (borderMode) {
                                var f = Math.sqrt(bt * bt * 2);
                                var v6 = storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(-f, ht), contour);
                                var v7 = storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(ht, t + f), contour);
                                var v8 = storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(ht * 3 + f, 0), contour);
                                var v9 = storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(ht, -(t + f)), contour);
                                var v10 = storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(-f, -ht), contour);
                                var ii = 0;
                                storeIndex(ib, ibi, ii++, v6);
                                storeIndex(ib, ibi, ii++, v7);
                                storeIndex(ib, ibi, ii++, v1);
                                storeIndex(ib, ibi, ii++, v1);
                                storeIndex(ib, ibi, ii++, v7);
                                storeIndex(ib, ibi, ii++, v2);
                                storeIndex(ib, ibi, ii++, v2);
                                storeIndex(ib, ibi, ii++, v7);
                                storeIndex(ib, ibi, ii++, v8);
                                storeIndex(ib, ibi, ii++, v2);
                                storeIndex(ib, ibi, ii++, v8);
                                storeIndex(ib, ibi, ii++, v3);
                                storeIndex(ib, ibi, ii++, v3);
                                storeIndex(ib, ibi, ii++, v8);
                                storeIndex(ib, ibi, ii++, v9);
                                storeIndex(ib, ibi, ii++, v3);
                                storeIndex(ib, ibi, ii++, v9);
                                storeIndex(ib, ibi, ii++, v4);
                                storeIndex(ib, ibi, ii++, v4);
                                storeIndex(ib, ibi, ii++, v9);
                                storeIndex(ib, ibi, ii++, v10);
                                storeIndex(ib, ibi, ii++, v4);
                                storeIndex(ib, ibi, ii++, v10);
                                storeIndex(ib, ibi, ii++, v5);
                            }
                            else {
                                storeIndex(ib, ibi, 0, v1);
                                storeIndex(ib, ibi, 1, v2);
                                storeIndex(ib, ibi, 2, v3);
                                storeIndex(ib, ibi, 3, v1);
                                storeIndex(ib, ibi, 4, v3);
                                storeIndex(ib, ibi, 5, v5);
                                storeIndex(ib, ibi, 6, v5);
                                storeIndex(ib, ibi, 7, v3);
                                storeIndex(ib, ibi, 8, v4);
                            }
                            break;
                        }
                }
                return null;
            };
            var buildLine = function (vb, contour, ht, bt) {
                var lineA = BABYLON.Vector2.Zero();
                var lineB = BABYLON.Vector2.Zero();
                var tangent = BABYLON.Vector2.Zero();
                var miter = BABYLON.Vector2.Zero();
                var curNormal = null;
                if (_this.closed) {
                    _this.points.push(_this.points[0]);
                }
                var total = _this.points.length;
                for (var i = 1; i < total; i++) {
                    var last = _this.points[i - 1];
                    var cur = _this.points[i];
                    var next = (i < (_this.points.length - 1)) ? _this.points[i + 1] : null;
                    direction(cur, last, lineA);
                    if (!curNormal) {
                        curNormal = BABYLON.Vector2.Zero();
                        perp(lineA, curNormal);
                    }
                    if (i === 1) {
                        store(vb, contour, 0, total, _this.points[0], curNormal, ht, bt);
                    }
                    if (!next) {
                        perp(lineA, curNormal);
                        store(vb, contour, i, total, _this.points[i], curNormal, ht, bt, i - 1);
                    }
                    else {
                        direction(next, cur, lineB);
                        var miterLen = computeMiter(tangent, miter, lineA, lineB);
                        store(vb, contour, i, total, _this.points[i], miter, miterLen * ht, miterLen * bt, i - 1);
                    }
                }
                if (_this.points.length > 2 && _this.closed) {
                    var last2 = _this.points[total - 2];
                    var cur2 = _this.points[0];
                    var next2 = _this.points[1];
                    direction(cur2, last2, lineA);
                    direction(next2, cur2, lineB);
                    perp(lineA, curNormal);
                    var miterLen2 = computeMiter(tangent, miter, lineA, lineB);
                    store(vb, null, 0, total, _this.points[0], miter, miterLen2 * ht, miterLen2 * bt, 1);
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
                if (_this.closed) {
                    _this.points.splice(total - 1);
                }
            };
            var contour = new Array();
            var startCapContour = new Array();
            var endCapContour = new Array();
            // Need to create WebGL resources for fill part?
            if (this.fill) {
                var startCapInfo = getCapSize(this.startCap);
                var endCapInfo = getCapSize(this.endCap);
                var count = this.points.length;
                var vbSize = (count * 2 * 2) + startCapInfo.vbsize + endCapInfo.vbsize;
                var vb = new Float32Array(vbSize);
                var ht = this.fillThickness / 2;
                var total = this.points.length;
                buildLine(vb, this.border ? null : contour, ht);
                var max = total * 2;
                var triCount = (count - (this.closed ? 0 : 1)) * 2;
                var ib = new Float32Array(triCount * 3 + startCapInfo.ibsize + endCapInfo.ibsize);
                for (var i = 0; i < triCount; i += 2) {
                    ib[i * 3 + 0] = i + 0;
                    ib[i * 3 + 1] = i + 1;
                    ib[i * 3 + 2] = (i + 2) % max;
                    ib[i * 3 + 3] = i + 1;
                    ib[i * 3 + 4] = (i + 3) % max;
                    ib[i * 3 + 5] = (i + 2) % max;
                }
                buildCap(vb, count * 2 * 2, ib, triCount * 3, this.points[0], this.fillThickness, null, this.startCap, startDir, this.border ? null : startCapContour);
                buildCap(vb, (count * 2 * 2) + startCapInfo.vbsize, ib, (triCount * 3) + startCapInfo.ibsize, this.points[total - 1], this.fillThickness, null, this.endCap, endDir, this.border ? null : startCapContour);
                renderCache.fillVB = engine.createVertexBuffer(vb);
                renderCache.fillIB = engine.createIndexBuffer(ib);
                renderCache.fillIndicesCount = ib.length;
                // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
                var ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_FILLPARTID, ["position"], true);
                if (ei) {
                    renderCache.effectFillInstanced = engine.createEffect("lines2d", ei.attributes, ei.uniforms, [], ei.defines, null);
                }
                // Get the non instanced version
                ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_FILLPARTID, ["position"], false);
                renderCache.effectFill = engine.createEffect("lines2d", ei.attributes, ei.uniforms, [], ei.defines, null);
            }
            // Need to create WebGL resources for border part?
            if (this.border) {
                var startCapInfo = getCapSize(this.startCap, true);
                var endCapInfo = getCapSize(this.endCap, true);
                var count = this.points.length;
                var vbSize = (count * 2 * 2 * 2) + startCapInfo.vbsize + endCapInfo.vbsize;
                var vb = new Float32Array(vbSize);
                var ht = this.fillThickness / 2;
                var bt = this.borderThickness;
                var total = this.points.length;
                buildLine(vb, contour, ht, bt);
                var max = total * 2 * 2;
                var triCount = (count - (this.closed ? 0 : 1)) * 2 * 2;
                var ib = new Float32Array(triCount * 3 + startCapInfo.ibsize + endCapInfo.ibsize);
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
                buildCap(vb, count * 2 * 2 * 2, ib, triCount * 3, this.points[0], this.fillThickness, this.borderThickness, this.startCap, startDir, startCapContour);
                buildCap(vb, (count * 2 * 2 * 2) + startCapInfo.vbsize, ib, (triCount * 3) + startCapInfo.ibsize, this.points[total - 1], this.fillThickness, this.borderThickness, this.endCap, endDir, endCapContour);
                renderCache.borderVB = engine.createVertexBuffer(vb);
                renderCache.borderIB = engine.createIndexBuffer(ib);
                renderCache.borderIndicesCount = ib.length;
                // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
                var ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, ["position"], true);
                if (ei) {
                    renderCache.effectBorderInstanced = engine.createEffect({ vertex: "lines2d", fragment: "lines2d" }, ei.attributes, ei.uniforms, [], ei.defines, null);
                }
                // Get the non instanced version
                ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, ["position"], false);
                renderCache.effectBorder = engine.createEffect({ vertex: "lines2d", fragment: "lines2d" }, ei.attributes, ei.uniforms, [], ei.defines, null);
            }
            this._contour = contour;
            if (startCapContour.length > 0) {
                var startCapTri = Earcut.earcut(startCapContour, null, 2);
                this._startCapTriIndices = startCapTri;
                this._startCapContour = startCapContour;
            }
            if (endCapContour.length > 0) {
                var endCapTri = Earcut.earcut(endCapContour, null, 2);
                this._endCapContour = endCapContour;
                this._endCapTriIndices = endCapTri;
            }
            var bs = this._boundingMax.subtract(this._boundingMin);
            this._size.width = bs.x;
            this._size.height = bs.y;
            return renderCache;
        };
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
                d.boundingMin = this.boundingMin;
                d.boundingMax = this.boundingMax;
            }
            else if (part.id === BABYLON.Shape2D.SHAPE2D_FILLPARTID) {
                var d = part;
                d.boundingMin = this.boundingMin;
                d.boundingMax = this.boundingMax;
            }
            return true;
        };
        Lines2D._prevA = BABYLON.Vector2.Zero();
        Lines2D._prevB = BABYLON.Vector2.Zero();
        Lines2D._curA = BABYLON.Vector2.Zero();
        Lines2D._curB = BABYLON.Vector2.Zero();
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
    }(BABYLON.Shape2D));
    BABYLON.Lines2D = Lines2D;
})(BABYLON || (BABYLON = {}));
