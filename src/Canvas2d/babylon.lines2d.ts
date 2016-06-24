module BABYLON {
    export class Lines2DRenderCache extends ModelRenderCache {
        effectsReady: boolean = false;
        fillVB: WebGLBuffer = null;
        fillIB: WebGLBuffer = null;
        fillIndicesCount: number = 0;
        instancingFillAttributes: InstancingAttributeInfo[] = null;
        effectFill: Effect = null;
        effectFillInstanced: Effect = null;

        borderVB: WebGLBuffer = null;
        borderIB: WebGLBuffer = null;
        borderIndicesCount: number = 0;
        instancingBorderAttributes: InstancingAttributeInfo[] = null;
        effectBorder: Effect = null;
        effectBorderInstanced: Effect = null;

        constructor(engine: Engine, modelKey: string) {
            super(engine, modelKey);
        }

        render(instanceInfo: GroupInstanceInfo, context: Render2DContext): boolean {
            // Do nothing if the shader is still loading/preparing 
            if (!this.effectsReady) {
                if ((this.effectFill && (!this.effectFill.isReady() || (this.effectFillInstanced && !this.effectFillInstanced.isReady()))) ||
                    (this.effectBorder && (!this.effectBorder.isReady() || (this.effectBorderInstanced && !this.effectBorderInstanced.isReady())))) {
                    return false;
                }
                this.effectsReady = true;
            }
            let canvas = instanceInfo.owner.owner;
            var engine = canvas.engine;

            let depthFunction = 0;
            if (this.effectFill && this.effectBorder) {
                depthFunction = engine.getDepthFunction();
                engine.setDepthFunctionToLessOrEqual();
            }

            let curAlphaMode = engine.getAlphaMode();

            if (this.effectFill) {
                let partIndex = instanceInfo.partIndexFromId.get(Shape2D.SHAPE2D_FILLPARTID.toString());
                let pid = context.groupInfoPartData[partIndex];

                if (context.renderMode !== Render2DContext.RenderModeOpaque) {
                    engine.setAlphaMode(Engine.ALPHA_COMBINE);
                }

                let effect = context.useInstancing ? this.effectFillInstanced : this.effectFill;

                engine.enableEffect(effect);
                engine.bindBuffersDirectly(this.fillVB, this.fillIB, [2], 2 * 4, effect);
                if (context.useInstancing) {
                    if (!this.instancingFillAttributes) {
                        this.instancingFillAttributes = this.loadInstancingAttributes(Shape2D.SHAPE2D_FILLPARTID, effect);
                    }

                    canvas._addDrawCallCount(1, context.renderMode);
                    engine.updateAndBindInstancesBuffer(pid._partBuffer, null, this.instancingFillAttributes);
                    engine.draw(true, 0, this.fillIndicesCount, pid._partData.usedElementCount);
                    engine.unbindInstanceAttributes();
                } else {
                    canvas._addDrawCallCount(context.partDataEndIndex - context.partDataStartIndex, context.renderMode);
                    for (let i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
                        this.setupUniforms(effect, partIndex, pid._partData, i);
                        engine.draw(true, 0, this.fillIndicesCount);
                    }
                }
            }

            if (this.effectBorder) {
                let partIndex = instanceInfo.partIndexFromId.get(Shape2D.SHAPE2D_BORDERPARTID.toString());
                let pid = context.groupInfoPartData[partIndex];

                if (context.renderMode !== Render2DContext.RenderModeOpaque) {
                    engine.setAlphaMode(Engine.ALPHA_COMBINE);
                }

                let effect = context.useInstancing ? this.effectBorderInstanced : this.effectBorder;

                engine.enableEffect(effect);
                engine.bindBuffersDirectly(this.borderVB, this.borderIB, [2], 2 * 4, effect);
                if (context.useInstancing) {
                    if (!this.instancingBorderAttributes) {
                        this.instancingBorderAttributes = this.loadInstancingAttributes(Shape2D.SHAPE2D_BORDERPARTID, effect);
                    }

                    canvas._addDrawCallCount(1, context.renderMode);
                    engine.updateAndBindInstancesBuffer(pid._partBuffer, null, this.instancingBorderAttributes);
                    engine.draw(true, 0, this.borderIndicesCount, pid._partData.usedElementCount);
                    engine.unbindInstanceAttributes();
                } else {
                    canvas._addDrawCallCount(context.partDataEndIndex - context.partDataStartIndex, context.renderMode);
                    for (let i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
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
        }

        public dispose(): boolean {
            if (!super.dispose()) {
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
        }
    }

    export class Lines2DInstanceData extends Shape2DInstanceData {
        constructor(partId: number) {
            super(partId, 1);
        }

        @instanceData(Shape2D.SHAPE2D_CATEGORY_FILLGRADIENT)
        get boundingMin(): Vector2 {
            return null;
        }

        @instanceData(Shape2D.SHAPE2D_CATEGORY_FILLGRADIENT)
        get boundingMax(): Vector2 {
            return null;
        }
    }

    @className("Lines2D")
    /**
     * Primitive drawing a series of line segments
     */
    export class Lines2D extends Shape2D {

        /**
         * No Cap to apply on the extremity
         */
        static get NoCap() { return Lines2D._noCap; }

        /**
         * A round cap, will use the line thickness as diameter
         */
        static get RoundCap() { return Lines2D._roundCap; }

        /**
         * Creates a triangle at the extremity.
         */
        static get TriangleCap() { return Lines2D._triangleCap; }

        /**
         * Creates a Square anchor at the extremity, the square size is twice the thickness of the line
         */
        static get SquareAnchorCap() { return Lines2D._squareAnchorCap; }

        /**
         * Creates a round anchor at the extremity, the diameter is twice the thickness of the line
         */
        static get RoundAnchorCap() { return Lines2D._roundAnchorCap; }

        /**
         * Creates a diamond anchor at the extremity.
         */
        static get DiamondAnchorCap() { return Lines2D._diamondAnchorCap; }

        /**
         * Creates an arrow anchor at the extremity. the arrow base size is twice the thickness of the line
         */
        static get ArrowCap() { return Lines2D._arrowCap; }

        public static pointsProperty: Prim2DPropInfo;
        public static fillThicknessProperty: Prim2DPropInfo;
        public static closedProperty: Prim2DPropInfo;
        public static startCapProperty: Prim2DPropInfo;
        public static endCapProperty: Prim2DPropInfo;

        @modelLevelProperty(Shape2D.SHAPE2D_PROPCOUNT + 1, pi => Lines2D.pointsProperty = pi)
        /**
         * Get the list of points that define the Lines2D primitive. You shouldn't try to change the list or its content. it's not supported right now.
         */
        public get points(): Vector2[] {
            return this._points;
        }

        public set points(value: Vector2[]) {
            this._points = value;
            this._boundingBoxDirty();
        }

        @modelLevelProperty(Shape2D.SHAPE2D_PROPCOUNT + 2, pi => Lines2D.fillThicknessProperty = pi)
        /**
         * Get the thickness of the line. You shouldn't try to change this value, it's not supported right now.
         */
        public get fillThickness(): number {
            return this._fillThickness;
        }

        public set fillThickness(value: number) {
            this._fillThickness = value;
        }

        @modelLevelProperty(Shape2D.SHAPE2D_PROPCOUNT + 3, pi => Lines2D.closedProperty = pi)
        /**
         * Get if the Lines2D is a closed shape (true) or an opened one (false).
         * Don't change this property, setter is for internal purpose only.
         */
        public get closed(): boolean {
            return this._closed;
        }

        public set closed(value: boolean) {
            this._closed = value;
        }

        @modelLevelProperty(Shape2D.SHAPE2D_PROPCOUNT + 4, pi => Lines2D.startCapProperty = pi)
        /**
         * Get the start cap of the line. You shouldn't try to change this value, it's not supported right now.
         */
        public get startCap(): number {
            return this._startCap;
        }

        public set startCap(value: number) {
            this._startCap = value;
        }

        @modelLevelProperty(Shape2D.SHAPE2D_PROPCOUNT + 5, pi => Lines2D.endCapProperty = pi)
        /**
         * Get the end cap of the line. You shouldn't try to change this value, it's not supported right now.
         */
        public get endCap(): number {
            return this._endCap;
        }

        public set endCap(value: number) {
            this._endCap = value;
        }

        private static _prevA: Vector2 = Vector2.Zero();
        private static _prevB: Vector2 = Vector2.Zero();
        private static _curA: Vector2 = Vector2.Zero();
        private static _curB: Vector2 = Vector2.Zero();

        protected levelIntersect(intersectInfo: IntersectInfo2D): boolean {
            if (this._contour == null) {
                this._computeLines2D();
            }

            let pl = this.points.length;
            let l = this.closed ? pl + 1 : pl;

            let p = intersectInfo._localPickPosition;

            this.transformPointWithOriginToRef(this._contour[0], null, Lines2D._prevA);
            this.transformPointWithOriginToRef(this._contour[1], null, Lines2D._prevB);
            for (let i = 1; i < l; i++) {
                this.transformPointWithOriginToRef(this._contour[(i % pl) * 2 + 0], null, Lines2D._curA);
                this.transformPointWithOriginToRef(this._contour[(i % pl) * 2 + 1], null, Lines2D._curB);

                if (Vector2.PointInTriangle(p, Lines2D._prevA, Lines2D._prevB, Lines2D._curA)) {
                    return true;
                }
                if (Vector2.PointInTriangle(p, Lines2D._curA, Lines2D._prevB, Lines2D._curB)) {
                    return true;
                }

                Lines2D._prevA.x = Lines2D._curA.x;
                Lines2D._prevA.y = Lines2D._curA.y;
                Lines2D._prevB.x = Lines2D._curB.x;
                Lines2D._prevB.y = Lines2D._curB.y;
            }

            let capIntersect = (tri: number[], points: number[]): boolean => {
                let l = tri.length;
                for (let i = 0; i < l; i += 3) {
                    Lines2D._curA.x = points[tri[i + 0] * 2 + 0];
                    Lines2D._curA.y = points[tri[i + 0] * 2 + 1];
                    this.transformPointWithOriginToRef(Lines2D._curA, null, Lines2D._curB);

                    Lines2D._curA.x = points[tri[i + 1] * 2 + 0];
                    Lines2D._curA.y = points[tri[i + 1] * 2 + 1];
                    this.transformPointWithOriginToRef(Lines2D._curA, null, Lines2D._prevA);

                    Lines2D._curA.x = points[tri[i + 2] * 2 + 0];
                    Lines2D._curA.y = points[tri[i + 2] * 2 + 1];
                    this.transformPointWithOriginToRef(Lines2D._curA, null, Lines2D._prevB);

                    if (Vector2.PointInTriangle(p, Lines2D._prevA, Lines2D._prevB, Lines2D._curB)) {
                        return true;
                    }
                }
                return false;
            }

            if (this._startCapTriIndices) {
                if (capIntersect(this._startCapTriIndices, this._startCapContour)) {
                    return true;
                }
                if (capIntersect(this._endCapTriIndices, this._endCapContour)) {
                    return true;
                }
            }

            return false;
        }

        protected get boundingMin(): Vector2 {
            if (!this._boundingMin) {
                this._computeLines2D();
            }
            return this._boundingMin;
        }

        protected get boundingMax(): Vector2 {
            if (!this._boundingMax) {
                this._computeLines2D();
            }
            return this._boundingMax;
        }

        protected getUsedShaderCategories(dataPart: InstanceDataBase): string[] {
            let res = super.getUsedShaderCategories(dataPart);

            // Remove the BORDER category, we don't use it in the VertexShader
            let i = res.indexOf(Shape2D.SHAPE2D_CATEGORY_BORDER);
            if (i !== -1) {
                res.splice(i, 1);
            }
            return res;
        }

        protected updateLevelBoundingInfo() {
            if (!this._boundingMin) {
                this._computeLines2D();
            }
            BoundingInfo2D.CreateFromMinMaxToRef(this._boundingMin.x, this._boundingMax.x, this._boundingMin.y, this._boundingMax.y, this._levelBoundingInfo);
        }

        /**
         * Create an 2D Lines Shape primitive. The defined lines may be opened or closed (see below)
         * @param points an array that describe the points to use to draw the line, must contain at least two entries.
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
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
        constructor(points: Vector2[], settings?: {

            parent            ?: Prim2DBase, 
            children          ?: Array<Prim2DBase>,
            id                ?: string,
            position          ?: Vector2,
            x                 ?: number,
            y                 ?: number,
            rotation          ?: number,
            scale             ?: number,
            opacity           ?: number,
            origin            ?: Vector2,
            fillThickness     ?: number,
            closed            ?: boolean,
            startCap          ?: number,
            endCap            ?: number,
            fill              ?: IBrush2D | string,
            border            ?: IBrush2D | string,
            borderThickness   ?: number,
            isVisible         ?: boolean,
            childrenFlatZOrder?: boolean,
            marginTop         ?: number | string,
            marginLeft        ?: number | string,
            marginRight       ?: number | string,
            marginBottom      ?: number | string,
            margin            ?: number | string,
            marginHAlignment  ?: number,
            marginVAlignment  ?: number,
            marginAlignment   ?: string,
            paddingTop        ?: number | string,
            paddingLeft       ?: number | string,
            paddingRight      ?: number | string,
            paddingBottom     ?: number | string,
            padding           ?: string,
        }) {

            if (!settings) {
                settings = {};
            }

            super(settings);

            this._fillVB   = null;
            this._fillIB   = null;
            this._borderVB = null;
            this._borderIB = null;

            this._size = Size.Zero();

            this._boundingMin = null;
            this._boundingMax = null;

            let fillThickness = (settings.fillThickness == null) ? 1     : settings.fillThickness;
            let startCap      = (settings.startCap == null)      ? 0     : settings.startCap;
            let endCap        = (settings.endCap == null)        ? 0     : settings.endCap;
            let closed        = (settings.closed == null)        ? false : settings.closed;

            this.points        = points;
            this.fillThickness = fillThickness;
            this.startCap      = startCap;
            this.endCap        = endCap;
            this.closed        = closed;
        }

        protected createModelRenderCache(modelKey: string): ModelRenderCache {
            let renderCache = new Lines2DRenderCache(this.owner.engine, modelKey);
            return renderCache;
        }

        ///////////////////////////////////////////////////////////////////////////////////
        // Methods for Lines building

        private _perp(v: Vector2, res: Vector2) {
            res.x = v.y;
            res.y = -v.x;
        };

        private _direction(a: Vector2, b: Vector2, res: Vector2) {
            a.subtractToRef(b, res);
            res.normalize();
        }

        private static _miterTps = Vector2.Zero();
        private _computeMiter(tangent: Vector2, miter: Vector2, a: Vector2, b: Vector2): number {
            a.addToRef(b, tangent);
            tangent.normalize();

            miter.x = -tangent.y;
            miter.y = tangent.x;

            Lines2D._miterTps.x = -a.y;
            Lines2D._miterTps.y = a.x;

            return 1 / Vector2.Dot(miter, Lines2D._miterTps);
        }

        private _intersect(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): boolean {
            let d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
            if (d === 0) return false;

            let xi = ((x3 - x4) * (x1 * y2 - y1 * x2) - (x1 - x2) * (x3 * y4 - y3 * x4)) / d;   // Intersection point is xi/yi, just in case...
            //let yi = ((y3 - y4) * (x1 * y2 - y1 * x2) - (y1 - y2) * (x3 * y4 - y3 * x4)) / d; // That's why I left it commented

            if (xi < Math.min(x1, x2) || xi > Math.max(x1, x2)) return false;
            if (xi < Math.min(x3, x4) || xi > Math.max(x3, x4)) return false;
            return true;
        }

        private _updateMinMax(array: Float32Array, offset: number) {
            if (offset >= array.length) {
                return;
            }
            this._boundingMin.x = Math.min(this._boundingMin.x, array[offset]);
            this._boundingMax.x = Math.max(this._boundingMax.x, array[offset]);
            this._boundingMin.y = Math.min(this._boundingMin.y, array[offset + 1]);
            this._boundingMax.y = Math.max(this._boundingMax.y, array[offset + 1]);
        }

        private static _startDir: Vector2 = Vector2.Zero();
        private static _endDir: Vector2 = Vector2.Zero();

        private _store(array: Float32Array, contour: Vector2[], index: number, max: number, p: Vector2, n: Vector2, halfThickness: number, borderThickness: number, detectFlip?: number) {
            let borderMode = borderThickness != null && !isNaN(borderThickness);
            let off = index * (borderMode ? 8 : 4);

            // Mandatory because we'll be out of bound in case of closed line, for the very last point (which is a duplicate of the first that we don't store in the vb)
            if (off >= array.length) {
                return;
            }

            // Store start/end normal, we need it for the cap construction
            if (index === 0) {
                this._perp(n, Lines2D._startDir);
            } else if (index === max - 1) {
                this._perp(n, Lines2D._endDir);
                Lines2D._endDir.x *= -1;
                Lines2D._endDir.y *= -1;
            }

            let swap = false;

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
                let flipOff = detectFlip * (borderMode ? 8 : 4);
                if (this._intersect(array[off + 0], array[off + 1], array[flipOff + 0], array[flipOff + 1], array[off + 2], array[off + 3], array[flipOff + 2], array[flipOff + 3])) {
                    swap = true;
                    let tps = array[off + 0];
                    array[off + 0] = array[off + 2];
                    array[off + 2] = tps;

                    tps = array[off + 1];
                    array[off + 1] = array[off + 3];
                    array[off + 3] = tps;
                }
            }

            if (borderMode) {
                let t = halfThickness + borderThickness;
                array[off + 4] = p.x + n.x * (swap ? -t : t);
                array[off + 5] = p.y + n.y * (swap ? -t : t);
                array[off + 6] = p.x + n.x * (swap ? t : -t);
                array[off + 7] = p.y + n.y * (swap ? t : -t);

                this._updateMinMax(array, off + 4);
                this._updateMinMax(array, off + 6);
            }

            if (contour) {
                off += borderMode ? 4 : 0;
                contour.push(new Vector2(array[off + 0], array[off + 1]));
                contour.push(new Vector2(array[off + 2], array[off + 3]));
            }
        }

        private _getCapSize(type: number, border: boolean = false): { vbsize: number; ibsize: number } {
            let sd = Lines2D._roundCapSubDiv;

            // If no array given, we call this to get the size
            let vbsize: number = 0, ibsize: number = 0;
            switch (type) {
                case Lines2D.NoCap:
                {
                    // If the line is not close and we're computing border, we add the size to generate the edge border
                    if (!this.closed && border) {
                        vbsize = 4;
                        ibsize = 6;
                    } else {
                        vbsize = ibsize = 0;
                    }
                    break;
                    
                }
                case Lines2D.RoundCap:
                {
                    if (border) {
                        vbsize = sd;
                        ibsize = (sd - 2) * 3;
                    } else {
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
                    } else {
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
                    } else {
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
                    } else {
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
                    } else {
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
                    } else {
                        vbsize = sd + 1;
                        ibsize = (sd + 1) * 3;
                    }
                    break;

                }
            }

            return { vbsize: vbsize * 2, ibsize: ibsize };
        }

        private static _tpsV = Vector2.Zero();
        private _storeVertex(vb: Float32Array, baseOffset: number, index: number, basePos: Vector2, rotation: number, vertex: Vector2, contour: number[]): number {
            let c = Math.cos(rotation);
            let s = Math.sin(rotation);

            Lines2D._tpsV.x = (c * vertex.x) + (-s * vertex.y) + basePos.x;
            Lines2D._tpsV.y = (s * vertex.x) + (c * vertex.y) + basePos.y;
            let offset = baseOffset + (index * 2);
            vb[offset + 0] = Lines2D._tpsV.x;
            vb[offset + 1] = Lines2D._tpsV.y;

            if (contour) {
                contour.push(Lines2D._tpsV.x);
                contour.push(Lines2D._tpsV.y);
            }

            this._updateMinMax(vb, offset);
            return (baseOffset + index * 2) / 2;
        }

        private _storeIndex(ib: Float32Array, baseOffset: number, index: number, vertexIndex: number) {
            ib[baseOffset + index] = vertexIndex;
        }

        private _buildCap(vb: Float32Array, vbi: number, ib: Float32Array, ibi: number, pos: Vector2, thickness: number, borderThickness: number, type: number, capDir: Vector2, contour: number[]): { vbsize: number; ibsize: number } {

            // Compute the transformation from the direction of the cap to build relative to our default orientation [1;0] (our cap are by default pointing toward right, horizontal
            let sd = Lines2D._roundCapSubDiv;
            let dir = new Vector2(1, 0);
            let angle = Math.atan2(capDir.y, capDir.x) - Math.atan2(dir.y, dir.x);

            let ht = thickness / 2;
            let t = thickness;
            let borderMode = borderThickness != null;
            let bt = borderThickness;
            switch (type) {
                case Lines2D.NoCap:
                    if (borderMode && !this.closed) {
                        let vi = 0;
                        let ii = 0;
                        let v1 = this._storeVertex(vb, vbi, vi++, pos, angle, new Vector2(0, ht + bt), contour);
                        let v2 = this._storeVertex(vb, vbi, vi++, pos, angle, new Vector2(bt, ht + bt), contour);
                        let v3 = this._storeVertex(vb, vbi, vi++, pos, angle, new Vector2(bt, -(ht + bt)), contour);
                        let v4 = this._storeVertex(vb, vbi, vi++, pos, angle, new Vector2(0, -(ht + bt)), contour);

                        this._storeIndex(ib, ibi, ii++, v1); this._storeIndex(ib, ibi, ii++, v2); this._storeIndex(ib, ibi, ii++, v3);
                        this._storeIndex(ib, ibi, ii++, v1); this._storeIndex(ib, ibi, ii++, v3); this._storeIndex(ib, ibi, ii++, v4);
                    }
                    break;
                case Lines2D.ArrowCap:
                    ht *= 2;
                case Lines2D.TriangleCap:
                    {
                        if (borderMode) {
                            let f = type === Lines2D.TriangleCap ? bt : Math.sqrt(bt * bt * 2);
                            let v1 = this._storeVertex(vb, vbi, 0, pos, angle, new Vector2(0, ht), null);
                            let v2 = this._storeVertex(vb, vbi, 1, pos, angle, new Vector2(ht, 0), null);
                            let v3 = this._storeVertex(vb, vbi, 2, pos, angle, new Vector2(0, -ht), null);
                            let v4 = this._storeVertex(vb, vbi, 3, pos, angle, new Vector2(0, ht + f), contour);
                            let v5 = this._storeVertex(vb, vbi, 4, pos, angle, new Vector2(ht + f, 0), contour);
                            let v6 = this._storeVertex(vb, vbi, 5, pos, angle, new Vector2(0, -(ht + f)), contour);

                            let ii = 0;
                            this._storeIndex(ib, ibi, ii++, v1); this._storeIndex(ib, ibi, ii++, v4); this._storeIndex(ib, ibi, ii++, v5);
                            this._storeIndex(ib, ibi, ii++, v1); this._storeIndex(ib, ibi, ii++, v5); this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v6); this._storeIndex(ib, ibi, ii++, v3); this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v6); this._storeIndex(ib, ibi, ii++, v2); this._storeIndex(ib, ibi, ii++, v5);

                            if (type === Lines2D.ArrowCap) {
                                let rht = thickness / 2;
                                let v10 = this._storeVertex(vb, vbi, 9, pos, angle, new Vector2(0, -(rht + bt)), null);
                                let v12 = this._storeVertex(vb, vbi, 11, pos, angle, new Vector2(-bt, -(ht + f)), contour);
                                let v11 = this._storeVertex(vb, vbi, 10, pos, angle, new Vector2(-bt, -(rht + bt)), contour);

                                let v7 = this._storeVertex(vb, vbi, 6, pos, angle, new Vector2(0, rht + bt), null);
                                let v8 = this._storeVertex(vb, vbi, 7, pos, angle, new Vector2(-bt, rht + bt), contour);
                                let v9 = this._storeVertex(vb, vbi, 8, pos, angle, new Vector2(-bt, ht + f), contour);


                                this._storeIndex(ib, ibi, ii++, v7); this._storeIndex(ib, ibi, ii++, v8); this._storeIndex(ib, ibi, ii++, v9);
                                this._storeIndex(ib, ibi, ii++, v7); this._storeIndex(ib, ibi, ii++, v9); this._storeIndex(ib, ibi, ii++, v4);
                                this._storeIndex(ib, ibi, ii++, v10); this._storeIndex(ib, ibi, ii++, v12); this._storeIndex(ib, ibi, ii++, v11);
                                this._storeIndex(ib, ibi, ii++, v10); this._storeIndex(ib, ibi, ii++, v6); this._storeIndex(ib, ibi, ii++, v12);
                            }
                        } else {
                            let v1 = this._storeVertex(vb, vbi, 0, pos, angle, new Vector2(0, ht), contour);
                            let v2 = this._storeVertex(vb, vbi, 1, pos, angle, new Vector2(ht, 0), contour);
                            let v3 = this._storeVertex(vb, vbi, 2, pos, angle, new Vector2(0, -ht), contour);

                            this._storeIndex(ib, ibi, 0, v1);
                            this._storeIndex(ib, ibi, 1, v2);
                            this._storeIndex(ib, ibi, 2, v3);
                        }
                        break;
                    }
                case Lines2D.RoundCap:
                    {
                        if (borderMode) {
                            let curA = -Math.PI / 2;
                            let incA = Math.PI / (sd / 2 - 1);
                            let ii = 0;

                            for (let i = 0; i < (sd / 2); i++) {
                                let v1 = this._storeVertex(vb, vbi, i * 2 + 0, pos, angle, new Vector2(Math.cos(curA) * ht, Math.sin(curA) * ht), null);
                                let v2 = this._storeVertex(vb, vbi, i * 2 + 1, pos, angle, new Vector2(Math.cos(curA) * (ht + bt), Math.sin(curA) * (ht + bt)), contour);

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
                        } else {
                            let c = this._storeVertex(vb, vbi, 0, pos, angle, new Vector2(0, 0), null);
                            let curA = -Math.PI / 2;
                            let incA = Math.PI / (sd / 2 - 1);

                            this._storeVertex(vb, vbi, 1, pos, angle, new Vector2(Math.cos(curA) * ht, Math.sin(curA) * ht), null);
                            curA += incA;
                            for (let i = 1; i < (sd / 2); i++) {
                                let v2 = this._storeVertex(vb, vbi, i + 1, pos, angle, new Vector2(Math.cos(curA) * ht, Math.sin(curA) * ht), contour);

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
                        let vi = 0;
                        let c = borderMode ? null : contour;
                        let v1 = this._storeVertex(vb, vbi, vi++, pos, angle, new Vector2(0, t), c);
                        let v2 = this._storeVertex(vb, vbi, vi++, pos, angle, new Vector2(t * 2, t), c);
                        let v3 = this._storeVertex(vb, vbi, vi++, pos, angle, new Vector2(t * 2, -t), c);
                        let v4 = this._storeVertex(vb, vbi, vi++, pos, angle, new Vector2(0, -t), c);

                        if (borderMode) {
                            let v5 = this._storeVertex(vb, vbi, vi++, pos, angle, new Vector2(0, ht + bt), null);
                            let v6 = this._storeVertex(vb, vbi, vi++, pos, angle, new Vector2(-bt, ht + bt), contour);
                            let v7 = this._storeVertex(vb, vbi, vi++, pos, angle, new Vector2(-bt, t + bt), contour);
                            let v8 = this._storeVertex(vb, vbi, vi++, pos, angle, new Vector2(t * 2 + bt, t + bt), contour);

                            let v9 = this._storeVertex(vb, vbi, vi++, pos, angle, new Vector2(t * 2 + bt, -(t + bt)), contour);
                            let v10 = this._storeVertex(vb, vbi, vi++, pos, angle, new Vector2(-bt, -(t + bt)), contour);
                            let v11 = this._storeVertex(vb, vbi, vi++, pos, angle, new Vector2(-bt, -(ht + bt)), contour);
                            let v12 = this._storeVertex(vb, vbi, vi++, pos, angle, new Vector2(0, -(ht + bt)), null);

                            let ii = 0;
                            this._storeIndex(ib, ibi, ii++, v6); this._storeIndex(ib, ibi, ii++, v1); this._storeIndex(ib, ibi, ii++, v5);
                            this._storeIndex(ib, ibi, ii++, v6); this._storeIndex(ib, ibi, ii++, v7); this._storeIndex(ib, ibi, ii++, v1);
                            this._storeIndex(ib, ibi, ii++, v1); this._storeIndex(ib, ibi, ii++, v7); this._storeIndex(ib, ibi, ii++, v8);
                            this._storeIndex(ib, ibi, ii++, v1); this._storeIndex(ib, ibi, ii++, v8); this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v2); this._storeIndex(ib, ibi, ii++, v8); this._storeIndex(ib, ibi, ii++, v9);
                            this._storeIndex(ib, ibi, ii++, v2); this._storeIndex(ib, ibi, ii++, v9); this._storeIndex(ib, ibi, ii++, v3);
                            this._storeIndex(ib, ibi, ii++, v3); this._storeIndex(ib, ibi, ii++, v9); this._storeIndex(ib, ibi, ii++, v10);
                            this._storeIndex(ib, ibi, ii++, v3); this._storeIndex(ib, ibi, ii++, v10); this._storeIndex(ib, ibi, ii++, v4);
                            this._storeIndex(ib, ibi, ii++, v10); this._storeIndex(ib, ibi, ii++, v11); this._storeIndex(ib, ibi, ii++, v4);
                            this._storeIndex(ib, ibi, ii++, v11); this._storeIndex(ib, ibi, ii++, v12); this._storeIndex(ib, ibi, ii++, v4);

                        } else {
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
                        let cpos = Math.sqrt(t * t - ht * ht);
                        let center = new Vector2(cpos, 0);
                        let curA = Tools.ToRadians(-150);
                        let incA = Tools.ToRadians(300) / (sd - 1);

                        if (borderMode) {
                            let ii = 0;

                            for (let i = 0; i < sd; i++) {
                                let v1 = this._storeVertex(vb, vbi, i * 2 + 0, pos, angle, new Vector2(cpos + Math.cos(curA) * t, Math.sin(curA) * t), null);
                                let v2 = this._storeVertex(vb, vbi, i * 2 + 1, pos, angle, new Vector2(cpos + Math.cos(curA) * (t + bt), Math.sin(curA) * (t + bt)), contour);

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
                        } else {
                            let c = this._storeVertex(vb, vbi, 0, pos, angle, center, null);
                            this._storeVertex(vb, vbi, 1, pos, angle, new Vector2(cpos + Math.cos(curA) * t, Math.sin(curA) * t), null);
                            curA += incA;
                            for (let i = 1; i < sd; i++) {
                                let v2 = this._storeVertex(vb, vbi, i + 1, pos, angle, new Vector2(cpos + Math.cos(curA) * t, Math.sin(curA) * t), contour);

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
                        let vi = 0;
                        let c = borderMode ? null : contour;
                        let v1 = this._storeVertex(vb, vbi, vi++, pos, angle, new Vector2(0, ht), c);
                        let v2 = this._storeVertex(vb, vbi, vi++, pos, angle, new Vector2(ht, t), c);
                        let v3 = this._storeVertex(vb, vbi, vi++, pos, angle, new Vector2(ht * 3, 0), c);
                        let v4 = this._storeVertex(vb, vbi, vi++, pos, angle, new Vector2(ht, -t), c);
                        let v5 = this._storeVertex(vb, vbi, vi++, pos, angle, new Vector2(0, -ht), c);

                        if (borderMode) {
                            let f = Math.sqrt(bt * bt * 2);
                            let v6 = this._storeVertex(vb, vbi, vi++, pos, angle, new Vector2(-f, ht), contour);
                            let v7 = this._storeVertex(vb, vbi, vi++, pos, angle, new Vector2(ht, t + f), contour);
                            let v8 = this._storeVertex(vb, vbi, vi++, pos, angle, new Vector2(ht * 3 + f, 0), contour);
                            let v9 = this._storeVertex(vb, vbi, vi++, pos, angle, new Vector2(ht, -(t + f)), contour);
                            let v10 = this._storeVertex(vb, vbi, vi++, pos, angle, new Vector2(-f, -ht), contour);

                            let ii = 0;
                            this._storeIndex(ib, ibi, ii++, v6); this._storeIndex(ib, ibi, ii++, v7); this._storeIndex(ib, ibi, ii++, v1);
                            this._storeIndex(ib, ibi, ii++, v1); this._storeIndex(ib, ibi, ii++, v7); this._storeIndex(ib, ibi, ii++, v2);

                            this._storeIndex(ib, ibi, ii++, v2); this._storeIndex(ib, ibi, ii++, v7); this._storeIndex(ib, ibi, ii++, v8);
                            this._storeIndex(ib, ibi, ii++, v2); this._storeIndex(ib, ibi, ii++, v8); this._storeIndex(ib, ibi, ii++, v3);

                            this._storeIndex(ib, ibi, ii++, v3); this._storeIndex(ib, ibi, ii++, v8); this._storeIndex(ib, ibi, ii++, v9);
                            this._storeIndex(ib, ibi, ii++, v3); this._storeIndex(ib, ibi, ii++, v9); this._storeIndex(ib, ibi, ii++, v4);

                            this._storeIndex(ib, ibi, ii++, v4); this._storeIndex(ib, ibi, ii++, v9); this._storeIndex(ib, ibi, ii++, v10);
                            this._storeIndex(ib, ibi, ii++, v4); this._storeIndex(ib, ibi, ii++, v10); this._storeIndex(ib, ibi, ii++, v5);

                        } else {
                            this._storeIndex(ib, ibi, 0, v1); this._storeIndex(ib, ibi, 1, v2); this._storeIndex(ib, ibi, 2, v3);
                            this._storeIndex(ib, ibi, 3, v1); this._storeIndex(ib, ibi, 4, v3); this._storeIndex(ib, ibi, 5, v5);
                            this._storeIndex(ib, ibi, 6, v5); this._storeIndex(ib, ibi, 7, v3); this._storeIndex(ib, ibi, 8, v4);
                        }
                        break;
                    }
            }

            return null;
        }

        private _buildLine(vb: Float32Array, contour: Vector2[], ht: number, bt?: number) {
            let lineA = Vector2.Zero();
            let lineB = Vector2.Zero();
            let tangent = Vector2.Zero();
            let miter = Vector2.Zero();
            let curNormal: Vector2 = null;

            if (this.closed) {
                this.points.push(this.points[0]);
            }

            var total = this.points.length;
            for (let i = 1; i < total; i++) {
                let last = this.points[i - 1];
                let cur = this.points[i];
                let next = (i < (this.points.length - 1)) ? this.points[i + 1] : null;

                this._direction(cur, last, lineA);
                if (!curNormal) {
                    curNormal = Vector2.Zero();
                    this._perp(lineA, curNormal);
                }

                if (i === 1) {
                    this._store(vb, contour, 0, total, this.points[0], curNormal, ht, bt);
                }

                if (!next) {
                    this._perp(lineA, curNormal);
                    this._store(vb, contour, i, total, this.points[i], curNormal, ht, bt, i - 1);
                } else {
                    this._direction(next, cur, lineB);

                    var miterLen = this._computeMiter(tangent, miter, lineA, lineB);
                    this._store(vb, contour, i, total, this.points[i], miter, miterLen * ht, miterLen * bt, i - 1);
                }
            }

            if (this.points.length > 2 && this.closed) {
                let last2 = this.points[total - 2];
                let cur2 = this.points[0];
                let next2 = this.points[1];

                this._direction(cur2, last2, lineA);
                this._direction(next2, cur2, lineB);
                this._perp(lineA, curNormal);

                var miterLen2 = this._computeMiter(tangent, miter, lineA, lineB);
                this._store(vb, null, 0, total, this.points[0], miter, miterLen2 * ht, miterLen2 * bt, 1);

                // Patch contour
                if (contour) {
                    let off = (bt == null) ? 0 : 4;
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
        }

        // Methods for Lines building
        ///////////////////////////////////////////////////////////////////////////////////

        protected setupModelRenderCache(modelRenderCache: ModelRenderCache) {
            let renderCache = <Lines2DRenderCache>modelRenderCache;
            let engine = this.owner.engine;

            if (this._fillVB === null) {
                this._computeLines2D();
            }

            // Need to create WebGL resources for fill part?
            if (this.fill) {
                renderCache.fillVB = engine.createVertexBuffer(this._fillVB);
                renderCache.fillIB = engine.createIndexBuffer(this._fillIB);
                renderCache.fillIndicesCount = this._fillIB.length;

                // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
                let ei = this.getDataPartEffectInfo(Shape2D.SHAPE2D_FILLPARTID, ["position"], true);
                if (ei) {
                    renderCache.effectFillInstanced = engine.createEffect("lines2d", ei.attributes, ei.uniforms, [], ei.defines, null);
                }

                // Get the non instanced version
                ei = this.getDataPartEffectInfo(Shape2D.SHAPE2D_FILLPARTID, ["position"], false);
                renderCache.effectFill = engine.createEffect("lines2d", ei.attributes, ei.uniforms, [], ei.defines, null);
            }

            // Need to create WebGL resources for border part?
            if (this.border) {
                renderCache.borderVB = engine.createVertexBuffer(this._borderVB);
                renderCache.borderIB = engine.createIndexBuffer(this._borderIB);
                renderCache.borderIndicesCount = this._borderIB.length;

                // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
                let ei = this.getDataPartEffectInfo(Shape2D.SHAPE2D_BORDERPARTID, ["position"], true);
                if (ei) {
                    renderCache.effectBorderInstanced = engine.createEffect({ vertex: "lines2d", fragment: "lines2d" }, ei.attributes, ei.uniforms, [], ei.defines, null);
                }

                // Get the non instanced version
                ei = this.getDataPartEffectInfo(Shape2D.SHAPE2D_BORDERPARTID, ["position"], false);
                renderCache.effectBorder = engine.createEffect({ vertex: "lines2d", fragment: "lines2d" }, ei.attributes, ei.uniforms, [], ei.defines, null);
            }

            this._fillVB   = null;
            this._fillIB   = null;
            this._borderVB = null;
            this._borderIB = null;

            return renderCache;
        }

        private _computeLines2D() {
            // Init min/max because their being computed here
            this._boundingMin = new Vector2(Number.MAX_VALUE, Number.MAX_VALUE);
            this._boundingMax = new Vector2(Number.MIN_VALUE, Number.MIN_VALUE);

            let contour = new Array<Vector2>();
            let startCapContour = new Array<number>();
            let endCapContour = new Array<number>();

            // Need to create WebGL resources for fill part?
            if (this.fill) {
                let startCapInfo = this._getCapSize(this.startCap);
                let endCapInfo   = this._getCapSize(this.endCap);
                let count        = this.points.length;
                let vbSize       = (count * 2 * 2) + startCapInfo.vbsize + endCapInfo.vbsize;
                this._fillVB     = new Float32Array(vbSize);
                let vb           = this._fillVB;
                let ht           = this.fillThickness / 2;
                let total        = this.points.length;

                this._buildLine(vb, this.border ? null : contour, ht);

                let max      = total * 2;
                let triCount = (count - (this.closed ? 0 : 1)) * 2;
                this._fillIB = new Float32Array(triCount * 3 + startCapInfo.ibsize + endCapInfo.ibsize);
                let ib       = this._fillIB;

                for (let i = 0; i < triCount; i += 2) {
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
                let startCapInfo = this._getCapSize(this.startCap, true);
                let endCapInfo = this._getCapSize(this.endCap, true);
                let count = this.points.length;
                let vbSize = (count * 2 * 2 * 2) + startCapInfo.vbsize + endCapInfo.vbsize;
                this._borderVB = new Float32Array(vbSize);
                let vb = this._borderVB;
                let ht = this.fillThickness / 2;
                let bt = this.borderThickness;
                let total = this.points.length;

                this._buildLine(vb, contour, ht, bt);

                let max = total * 2 * 2;
                let triCount = (count - (this.closed ? 0 : 1)) * 2 * 2;
                this._borderIB = new Float32Array(triCount * 3 + startCapInfo.ibsize + endCapInfo.ibsize);
                let ib = this._borderIB;
                for (let i = 0; i < triCount; i += 4) {
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
                let startCapTri = Earcut.earcut(startCapContour, null, 2);
                this._startCapTriIndices = startCapTri;
                this._startCapContour = startCapContour;
            }
            if (endCapContour.length > 0) {
                let endCapTri = Earcut.earcut(endCapContour, null, 2);
                this._endCapContour = endCapContour;
                this._endCapTriIndices = endCapTri;
            }
            let bs = this._boundingMax.subtract(this._boundingMin);
            this._size.width = bs.x;
            this._size.height = bs.y;
        }

        public get size(): Size {
            if (this._size == null) {
                this._computeLines2D();
            }
            return this._size;
        }

        protected createInstanceDataParts(): InstanceDataBase[] {
            var res = new Array<InstanceDataBase>();
            if (this.border) {
                res.push(new Lines2DInstanceData(Shape2D.SHAPE2D_BORDERPARTID));
            }
            if (this.fill) {
                res.push(new Lines2DInstanceData(Shape2D.SHAPE2D_FILLPARTID));
            }
            return res;
        }

        protected refreshInstanceDataPart(part: InstanceDataBase): boolean {
            if (!super.refreshInstanceDataPart(part)) {
                return false;
            }
            if (part.id === Shape2D.SHAPE2D_BORDERPARTID) {
                let d = <Lines2DInstanceData>part;
                if (this.border instanceof GradientColorBrush2D) {
                    d.boundingMin = this.boundingMin;
                    d.boundingMax = this.boundingMax;
                }
            }
            else if (part.id === Shape2D.SHAPE2D_FILLPARTID) {
                let d = <Lines2DInstanceData>part;
                if (this.fill instanceof GradientColorBrush2D) {
                    d.boundingMin = this.boundingMin;
                    d.boundingMax = this.boundingMax;
                }
            }
            return true;
        }

        private static _noCap = 0;
        private static _roundCap = 1;
        private static _triangleCap = 2;
        private static _squareAnchorCap = 3;
        private static _roundAnchorCap = 4;
        private static _diamondAnchorCap = 5;
        private static _arrowCap = 6;

        private static _roundCapSubDiv = 36;

        private _fillVB: Float32Array;
        private _fillIB: Float32Array;
        private _borderVB: Float32Array;
        private _borderIB: Float32Array;
        private _boundingMin: Vector2;
        private _boundingMax: Vector2;
        private _contour: Vector2[];
        private _startCapContour: number[];
        private _startCapTriIndices: number[];
        private _endCapContour: number[];
        private _endCapTriIndices: number[];

        private _closed: boolean;
        private _startCap: number;
        private _endCap: number;
        private _fillThickness: number;
        private _points: Vector2[];


    }
}