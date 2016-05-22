module BABYLON {
    export class Lines2DRenderCache extends ModelRenderCache {
        fillVB: WebGLBuffer;
        fillIB: WebGLBuffer;
        fillIndicesCount: number;
        instancingFillAttributes: InstancingAttributeInfo[];
        effectFill: Effect;

        borderVB: WebGLBuffer;
        borderIB: WebGLBuffer;
        borderIndicesCount: number;
        instancingBorderAttributes: InstancingAttributeInfo[];
        effectBorder: Effect;

        constructor(engine: Engine, modelKey: string, isTransparent: boolean) {
            super(engine, modelKey, isTransparent);
        }

        render(instanceInfo: GroupInstanceInfo, context: Render2DContext): boolean {
            // Do nothing if the shader is still loading/preparing 
            if ((this.effectFill && !this.effectFill.isReady()) || (this.effectBorder && !this.effectBorder.isReady())) {
                return false;
            }

            var engine = instanceInfo._owner.owner.engine;

            let depthFunction = 0;
            if (this.effectFill && this.effectBorder) {
                depthFunction = engine.getDepthFunction();
                engine.setDepthFunctionToLessOrEqual();
            }

            var cur: number;
            if (this.isTransparent) {
                cur = engine.getAlphaMode();
                engine.setAlphaMode(Engine.ALPHA_COMBINE);
            }

            if (this.effectFill) {
                let partIndex = instanceInfo._partIndexFromId.get(Shape2D.SHAPE2D_FILLPARTID.toString());
             
                engine.enableEffect(this.effectFill);
                engine.bindBuffers(this.fillVB, this.fillIB, [2], 2*4, this.effectFill);
                let count = instanceInfo._instancesPartsData[partIndex].usedElementCount;
                if (instanceInfo._owner.owner.supportInstancedArray) {
                    if (!this.instancingFillAttributes) {
                        // Compute the offset locations of the attributes in the vertex shader that will be mapped to the instance buffer data
                        this.instancingFillAttributes = this.loadInstancingAttributes(Shape2D.SHAPE2D_FILLPARTID, this.effectFill);
                    }

                    engine.updateAndBindInstancesBuffer(instanceInfo._instancesPartsBuffer[partIndex], null, this.instancingFillAttributes);
                    engine.draw(true, 0, this.fillIndicesCount, count);
                    engine.unBindInstancesBuffer(instanceInfo._instancesPartsBuffer[partIndex], this.instancingFillAttributes);
                } else {
                    for (let i = 0; i < count; i++) {
                        this.setupUniforms(this.effectFill, partIndex, instanceInfo._instancesPartsData[partIndex], i);
                        engine.draw(true, 0, this.fillIndicesCount);                        
                    }
                }
            }

            if (this.effectBorder) {
                let partIndex = instanceInfo._partIndexFromId.get(Shape2D.SHAPE2D_BORDERPARTID.toString());

                engine.enableEffect(this.effectBorder);
                engine.bindBuffers(this.borderVB, this.borderIB, [2], 2 * 4, this.effectBorder);
                let count = instanceInfo._instancesPartsData[partIndex].usedElementCount;
                if (instanceInfo._owner.owner.supportInstancedArray) {
                    if (!this.instancingBorderAttributes) {
                        this.instancingBorderAttributes = this.loadInstancingAttributes(Shape2D.SHAPE2D_BORDERPARTID, this.effectBorder);
                    }

                    engine.updateAndBindInstancesBuffer(instanceInfo._instancesPartsBuffer[partIndex], null, this.instancingBorderAttributes);
                    engine.draw(true, 0, this.borderIndicesCount, count);
                    engine.unBindInstancesBuffer(instanceInfo._instancesPartsBuffer[partIndex], this.instancingBorderAttributes);
                } else {
                    for (let i = 0; i < count; i++) {
                        this.setupUniforms(this.effectBorder, partIndex, instanceInfo._instancesPartsData[partIndex], i);
                        engine.draw(true, 0, this.borderIndicesCount);
                    }
                }
            }

            if (this.isTransparent) {
                engine.setAlphaMode(cur);
            }

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

            return true;
        }
    }

    export class Lines2DInstanceData extends Shape2DInstanceData {
        constructor(partId: number) {
            super(partId, 1);
        }

        @instanceData()
        get boundingMin(): Vector2 {
            return null;
        }

        @instanceData()
        get boundingMax(): Vector2 {
            return null;
        }
    }

    @className("Lines2D")
    export class Lines2D extends Shape2D {
        static get NoCap            () { return Lines2D._noCap;            }
        static get RoundCap         () { return Lines2D._roundCap;         }
        static get TriangleCap      () { return Lines2D._triangleCap;      }
        static get SquareAnchorCap  () { return Lines2D._squareAnchorCap;  }
        static get RoundAnchorCap   () { return Lines2D._roundAnchorCap;   }
        static get DiamondAnchorCap () { return Lines2D._diamondAnchorCap; }
        static get ArrowCap         () { return Lines2D._arrowCap;         }

        public static pointsProperty: Prim2DPropInfo;
        public static fillThicknessProperty: Prim2DPropInfo;
        public static closedProperty: Prim2DPropInfo;
        public static startCapProperty: Prim2DPropInfo;
        public static endCapProperty: Prim2DPropInfo;

        public get actualSize(): Size {
            return this.size;
        }

        @modelLevelProperty(Shape2D.SHAPE2D_PROPCOUNT + 1, pi => Lines2D.pointsProperty = pi)
        public get points(): Vector2[] {
            return this._points;
        }

        public set points(value: Vector2[]) {
            this._points = value;
            this._levelBoundingInfoDirty = true;
            this._sizeDirty = true;
        }

        @modelLevelProperty(Shape2D.SHAPE2D_PROPCOUNT + 2, pi => Lines2D.fillThicknessProperty = pi)
        public get fillThickness(): number {
            return this._fillThickness;
        }

        public set fillThickness(value: number) {
            this._fillThickness = value;
        }

        @modelLevelProperty(Shape2D.SHAPE2D_PROPCOUNT + 3, pi => Lines2D.closedProperty = pi)
        public get closed(): boolean {
            return this._closed;
        }

        public set closed(value: boolean) {
            this._closed = value;
        }

        @modelLevelProperty(Shape2D.SHAPE2D_PROPCOUNT + 4, pi => Lines2D.startCapProperty = pi)
        public get startCap(): number {
            return this._startCap;
        }

        public set startCap(value: number) {
            this._startCap = value;
        }

        @modelLevelProperty(Shape2D.SHAPE2D_PROPCOUNT + 5, pi => Lines2D.endCapProperty = pi)
        public get endCap(): number {
            return this._endCap;
        }

        public set endCap(value: number) {
            this._endCap = value;
        }

        protected levelIntersect(intersectInfo: IntersectInfo2D): boolean {

            // TODO
            return false;
        }

        protected get size(): Size {
            if (this._sizeDirty) {
                this._updateSize();
            }
            return this._size;
        }

        protected get boundingMin(): Vector2 {
            if (this._sizeDirty) {
                this._updateSize();
            }
            return this._boundingMin;
        }

        protected get boundingMax(): Vector2 {
            if (this._sizeDirty) {
                this._updateSize();
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
            BoundingInfo2D.CreateFromSizeToRef(this.size, this._levelBoundingInfo, this.origin);
        }

        protected setupLines2D(owner: Canvas2D, parent: Prim2DBase, id: string, position: Vector2, points: Vector2[], fillThickness: number, startCap: number, endCap: number, fill?: IBrush2D, border?: IBrush2D, borderThickness: number = 1) {
            this.setupShape2D(owner, parent, id, position, true, fill, border, borderThickness);
            this.fillThickness = fillThickness;
            this.startCap = startCap;
            this.endCap = endCap;
            this.points = points;
            this.closed = false;
            this._size = Size.Zero();
        }

        public static Create(parent: Prim2DBase, id: string, x: number, y: number, points: Vector2[], fillThickness: number, startCap: number = Lines2D.NoCap, endCap: number = Lines2D.NoCap, fill?: IBrush2D, border?: IBrush2D, borderThickness?: number): Lines2D {
            Prim2DBase.CheckParent(parent);

            let lines = new Lines2D();
            lines.setupLines2D(parent.owner, parent, id, new Vector2(x, y), points, fillThickness, startCap, endCap, fill, border, borderThickness);
            return lines;
        }

        protected createModelRenderCache(modelKey: string, isTransparent: boolean): ModelRenderCache {
            let renderCache = new Lines2DRenderCache(this.owner.engine, modelKey, isTransparent);
            return renderCache;
        }

        protected setupModelRenderCache(modelRenderCache: ModelRenderCache) {
            let renderCache = <Lines2DRenderCache>modelRenderCache;
            let engine = this.owner.engine;

            let perp = (v: Vector2, res: Vector2) => {
                res.x = v.y;
                res.y = -v.x;
            };

            let direction = (a: Vector2, b: Vector2, res: Vector2) => {
                a.subtractToRef(b, res);
                res.normalize();
            }

            let tps = Vector2.Zero();
            let computeMiter = (tangent: Vector2, miter: Vector2, a: Vector2, b: Vector2): number => {
                a.addToRef(b, tangent);
                tangent.normalize();

                miter.x = -tangent.y;
                miter.y = tangent.x;

                tps.x = -a.y;
                tps.y = a.x;

                return 1 / Vector2.Dot(miter, tps);
            }

            let intersect = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): boolean => {
                let d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
                if (d === 0) return false;

                let xi = ((x3 - x4) * (x1 * y2 - y1 * x2) - (x1 - x2) * (x3 * y4 - y3 * x4)) / d;   // Intersection point is xi/yi, just in case...
                //let yi = ((y3 - y4) * (x1 * y2 - y1 * x2) - (y1 - y2) * (x3 * y4 - y3 * x4)) / d; // That's why I left it commented

                if (xi < Math.min(x1, x2) || xi > Math.max(x1, x2)) return false;
                if (xi < Math.min(x3, x4) || xi > Math.max(x3, x4)) return false;
                return true;
            }

            let startN: Vector2;
            let endN: Vector2;

            let store = (array: Float32Array, index: number, max: number, p: Vector2, n: Vector2, halfThickness: number, borderThickness: number, detectFlip?: number) => {
                // Mandatory because we'll be out of bound in case of closed line, for the very last point (which is a duplicate of the first that we don't store in the vb)
                if (index >= max) {
                    return;
                }

                // Store start/end normal, we need it for the cap construction
                if (index === 0) {
                    startN = n.clone();
                } else if (index === max - 1) {
                    endN = n.clone();
                }

                let borderMode = borderThickness != null && !isNaN(borderThickness);
                let off = index * (borderMode ? 8 : 4);
                let swap = false;

                array[off + 0] = p.x + n.x * halfThickness;
                array[off + 1] = p.y + n.y * halfThickness;
                array[off + 2] = p.x + n.x * -halfThickness;
                array[off + 3] = p.y + n.y * -halfThickness;

                // If an index is given we check if the two segments formed between [index+0;detectFlip+0] and [index+2;detectFlip+2] intersect themselves.
                // It should not be the case, they should be parallel, so if they cross, we switch the order of storage to ensure we'll have parallel lines
                if (detectFlip !== undefined) {
                    // Flip if intersect
                    let flipOff = detectFlip * (borderMode ? 8 : 4);
                    if (intersect(array[off + 0], array[off + 1], array[flipOff + 0], array[flipOff + 1], array[off + 2], array[off + 3], array[flipOff + 2], array[flipOff + 3])) {
                        swap = true;
                        let n = array[off + 0];
                        array[off + 0] = array[off + 2];
                        array[off + 2] = n;

                        n = array[off + 1];
                        array[off + 1] = array[off + 3];
                        array[off + 3] = n;
                    }
                }

                if (borderMode) {
                    let t = halfThickness + borderThickness;
                    array[off + 4] = p.x + n.x * (swap ? -t : t);
                    array[off + 5] = p.y + n.y * (swap ? -t : t);
                    array[off + 6] = p.x + n.x * (swap ? t : -t);
                    array[off + 7] = p.y + n.y * (swap ? t : -t);
                }
            }
            let sd = Lines2D._roundCapSubDiv;
            let getCapSize = (type: number, border: boolean = false): { vbsize: number; ibsize: number } => {
                // If no array given, we call this to get the size
                let vbsize: number = 0, ibsize: number = 0;
                switch (type) {
                    case Lines2D.NoCap:
                        // If the line is not close and we're computing border, we add the size to generate the edge border
                        if (!this.closed && border) {
                            vbsize = 4;
                            ibsize = 6;
                        } else {
                            vbsize = ibsize = 0;
                        }
                        break;
                    case Lines2D.RoundCap:
                        if (border) {
                            vbsize = sd;
                            ibsize = (sd-2) * 3;
                        } else {
                            vbsize = (sd / 2) + 1;
                            ibsize = (sd / 2) * 3;
                        }
                        break;
                    case Lines2D.ArrowCap:
                        if (border) {
                            vbsize = 12;
                            ibsize = 24;
                        } else {
                            vbsize = 3;
                            ibsize = 3;
                        }
                        break;
                    case Lines2D.TriangleCap:
                        if (border) {
                            vbsize = 6;
                            ibsize = 12;
                        } else {
                            vbsize = 3;
                            ibsize = 3;
                        }
                        break;
                    case Lines2D.DiamondAnchorCap:
                        if (border) {
                            vbsize = 10;
                            ibsize = 24;
                        } else {
                            vbsize = 5;
                            ibsize = 9;
                        }
                        break;
                    case Lines2D.SquareAnchorCap:
                        if (border) {
                            vbsize = 12;
                            ibsize = 30;
                        } else {
                            vbsize = 4;
                            ibsize = 6;
                        }
                        break;
                    case Lines2D.RoundAnchorCap:
                        if (border) {
                            vbsize = sd*2;
                            ibsize = (sd - 1) * 6;
                        } else {
                            vbsize = sd + 1;
                            ibsize = (sd + 1) * 3;
                        }
                        break;
                }

                return { vbsize: vbsize*2, ibsize: ibsize };
            }

            let v = Vector2.Zero();
            let storeVertex = (vb: Float32Array, baseOffset: number, index: number, basePos: Vector2, rotation: number, vertex: Vector2): number => {
                let c = Math.cos(rotation);
                let s = Math.sin(rotation);

                v.x = (c * vertex.x) + (-s * vertex.y) + basePos.x;
                v.y = (s * vertex.x) + ( c * vertex.y) + basePos.y;
                vb[baseOffset + (index*2) + 0] = v.x;
                vb[baseOffset + (index*2) + 1] = v.y;

                return (baseOffset + index*2) / 2;
            }

            let storeIndex = (ib: Float32Array, baseOffset: number, index: number, vertexIndex: number) => {
                ib[baseOffset + index] = vertexIndex;
            }

            let buildCap = (vb: Float32Array, vbi: number, ib: Float32Array, ibi: number, pos: Vector2, thickness: number, borderThickness: number, type: number, normal: Vector2): { vbsize: number; ibsize: number } => {
                // Default orientation is toward right, horizontal (1,0), its normal being (0,1). 
                // Compute the angle from the two vectors to get the rotation amount
                let angle = Math.acos(Vector2.Dot(normal, new Vector2(0, 1)));
                let ht = thickness / 2;
                let t = thickness;
                let borderMode = borderThickness != null;
                let bt = borderThickness;
                switch (type) {
                    case Lines2D.NoCap:
                        if (borderMode && !this.closed) {
                            let vi = 0;
                            let ii = 0;
                            let v1 = storeVertex(vb, vbi, vi++, pos, angle, new Vector2(0, ht + bt));
                            let v2 = storeVertex(vb, vbi, vi++, pos, angle, new Vector2(bt, ht + bt));
                            let v3 = storeVertex(vb, vbi, vi++, pos, angle, new Vector2(bt, -(ht + bt)));
                            let v4 = storeVertex(vb, vbi, vi++, pos, angle, new Vector2(0, -(ht + bt)));

                            storeIndex(ib, ibi, ii++, v1); storeIndex(ib, ibi, ii++, v2); storeIndex(ib, ibi, ii++, v3);
                            storeIndex(ib, ibi, ii++, v1); storeIndex(ib, ibi, ii++, v3); storeIndex(ib, ibi, ii++, v4);
                        }
                        break;
                    case Lines2D.ArrowCap:
                        ht *= 2;
                    case Lines2D.TriangleCap:
                    {
                        if (borderMode) {
                            let f = type===Lines2D.TriangleCap ? bt : Math.sqrt(bt * bt * 2);
                            let v1 = storeVertex(vb, vbi, 0, pos, angle, new Vector2(0, ht));
                            let v2 = storeVertex(vb, vbi, 1, pos, angle, new Vector2(ht, 0));
                            let v3 = storeVertex(vb, vbi, 2, pos, angle, new Vector2(0, -ht));
                            let v4 = storeVertex(vb, vbi, 3, pos, angle, new Vector2(0, ht+f));
                            let v5 = storeVertex(vb, vbi, 4, pos, angle, new Vector2(ht+f, 0));
                            let v6 = storeVertex(vb, vbi, 5, pos, angle, new Vector2(0, -(ht+f)));

                            let ii = 0;
                            storeIndex(ib, ibi, ii++, v1);  storeIndex(ib, ibi, ii++, v4);  storeIndex(ib, ibi, ii++, v5);
                            storeIndex(ib, ibi, ii++, v1);  storeIndex(ib, ibi, ii++, v5);  storeIndex(ib, ibi, ii++, v2);
                            storeIndex(ib, ibi, ii++, v6);  storeIndex(ib, ibi, ii++, v3);  storeIndex(ib, ibi, ii++, v2);
                            storeIndex(ib, ibi, ii++, v6);  storeIndex(ib, ibi, ii++, v2);  storeIndex(ib, ibi, ii++, v5);

                            if (type === Lines2D.ArrowCap) {
                                let rht = thickness / 2;
                                let v7 = storeVertex(vb, vbi, 6, pos, angle, new Vector2(0, rht+bt));
                                let v8 = storeVertex(vb, vbi, 7, pos, angle, new Vector2(-bt, rht+bt));
                                let v9 = storeVertex(vb, vbi, 8, pos, angle, new Vector2(-bt, ht+f));

                                let v10 = storeVertex(vb, vbi, 9, pos, angle, new Vector2(0, -(rht+bt)));
                                let v11 = storeVertex(vb, vbi, 10, pos, angle, new Vector2(-bt, -(rht+bt)));
                                let v12 = storeVertex(vb, vbi, 11, pos, angle, new Vector2(-bt, -(ht+f)));

                                storeIndex(ib, ibi, ii++, v7);  storeIndex(ib, ibi, ii++, v8);  storeIndex(ib, ibi, ii++, v9);
                                storeIndex(ib, ibi, ii++, v7);  storeIndex(ib, ibi, ii++, v9);  storeIndex(ib, ibi, ii++, v4);
                                storeIndex(ib, ibi, ii++, v10); storeIndex(ib, ibi, ii++, v12); storeIndex(ib, ibi, ii++, v11);
                                storeIndex(ib, ibi, ii++, v10); storeIndex(ib, ibi, ii++, v6);  storeIndex(ib, ibi, ii++, v12);
                            }
                        } else {
                            let v1 = storeVertex(vb, vbi, 0, pos, angle, new Vector2(0, ht));
                            let v2 = storeVertex(vb, vbi, 1, pos, angle, new Vector2(ht, 0));
                            let v3 = storeVertex(vb, vbi, 2, pos, angle, new Vector2(0, -ht));

                            storeIndex(ib, ibi, 0, v1);
                            storeIndex(ib, ibi, 1, v2);
                            storeIndex(ib, ibi, 2, v3);
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
                                let v1 = storeVertex(vb, vbi, i*2 + 0, pos, angle, new Vector2(Math.cos(curA) * ht, Math.sin(curA) * ht));
                                let v2 = storeVertex(vb, vbi, i*2 + 1, pos, angle, new Vector2(Math.cos(curA) * (ht+bt), Math.sin(curA) * (ht+bt)));

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
                        } else {
                            let c = storeVertex(vb, vbi, 0, pos, angle, new Vector2(0, 0));
                            let curA = -Math.PI / 2;
                            let incA = Math.PI / (sd / 2 - 1);

                            storeVertex(vb, vbi, 1, pos, angle, new Vector2(Math.cos(curA) * ht, Math.sin(curA) * ht));
                            curA += incA;
                            for (let i = 1; i < (sd / 2); i++) {
                                let v2 = storeVertex(vb, vbi, i + 1, pos, angle, new Vector2(Math.cos(curA) * ht, Math.sin(curA) * ht));

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
                        let vi = 0;
                        let v1 = storeVertex(vb, vbi, vi++, pos, angle, new Vector2(0, t));
                        let v2 = storeVertex(vb, vbi, vi++, pos, angle, new Vector2(t * 2, t));
                        let v3 = storeVertex(vb, vbi, vi++, pos, angle, new Vector2(t * 2, -t));
                        let v4 = storeVertex(vb, vbi, vi++, pos, angle, new Vector2(0, -t));

                        if (borderMode) {
                            let v5 = storeVertex(vb, vbi, vi++, pos, angle, new Vector2(0, ht+bt));
                            let v6 = storeVertex(vb, vbi, vi++, pos, angle, new Vector2(-bt, ht+bt));
                            let v7 = storeVertex(vb, vbi, vi++, pos, angle, new Vector2(-bt, t + bt));
                            let v8 = storeVertex(vb, vbi, vi++, pos, angle, new Vector2(t * 2 + bt, t + bt));

                            let v9 =  storeVertex(vb, vbi, vi++, pos, angle, new Vector2(t * 2 + bt, -(t+bt)));
                            let v10 = storeVertex(vb, vbi, vi++, pos, angle, new Vector2(-bt, -(t + bt)));
                            let v11 = storeVertex(vb, vbi, vi++, pos, angle, new Vector2(-bt, -(ht+bt)));
                            let v12 = storeVertex(vb, vbi, vi++, pos, angle, new Vector2(0, -(ht+bt)));

                            let ii = 0;
                            storeIndex(ib, ibi, ii++, v6);  storeIndex(ib, ibi, ii++, v1);  storeIndex(ib, ibi, ii++, v5);
                            storeIndex(ib, ibi, ii++, v6);  storeIndex(ib, ibi, ii++, v7);  storeIndex(ib, ibi, ii++, v1);
                            storeIndex(ib, ibi, ii++, v1);  storeIndex(ib, ibi, ii++, v7);  storeIndex(ib, ibi, ii++, v8);
                            storeIndex(ib, ibi, ii++, v1);  storeIndex(ib, ibi, ii++, v8);  storeIndex(ib, ibi, ii++, v2);
                            storeIndex(ib, ibi, ii++, v2);  storeIndex(ib, ibi, ii++, v8);  storeIndex(ib, ibi, ii++, v9);
                            storeIndex(ib, ibi, ii++, v2);  storeIndex(ib, ibi, ii++, v9);  storeIndex(ib, ibi, ii++, v3);
                            storeIndex(ib, ibi, ii++, v3);  storeIndex(ib, ibi, ii++, v9);  storeIndex(ib, ibi, ii++, v10);
                            storeIndex(ib, ibi, ii++, v3);  storeIndex(ib, ibi, ii++, v10); storeIndex(ib, ibi, ii++, v4);
                            storeIndex(ib, ibi, ii++, v10); storeIndex(ib, ibi, ii++, v11); storeIndex(ib, ibi, ii++, v4);
                            storeIndex(ib, ibi, ii++, v11); storeIndex(ib, ibi, ii++, v12); storeIndex(ib, ibi, ii++, v4);

                        } else {
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
                        let cpos = Math.sqrt(t * t - ht * ht);
                        let center = new Vector2(cpos, 0);
                        let curA = Tools.ToRadians(-150);
                        let incA = Tools.ToRadians(300) / (sd - 1);

                        if (borderMode) {
                            let ii = 0;

                            for (let i = 0; i < sd; i++) {
                                let v1 = storeVertex(vb, vbi, i * 2 + 0, pos, angle, new Vector2(cpos + Math.cos(curA) * t, Math.sin(curA) * t));
                                let v2 = storeVertex(vb, vbi, i * 2 + 1, pos, angle, new Vector2(cpos + Math.cos(curA) * (t + bt), Math.sin(curA) * (t + bt)));

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
                        } else {
                            let c = storeVertex(vb, vbi, 0, pos, angle, center);
                            storeVertex(vb, vbi, 1, pos, angle, new Vector2(cpos + Math.cos(curA) * t, Math.sin(curA) * t));
                            curA += incA;
                            for (let i = 1; i < sd; i++) {
                                let v2 = storeVertex(vb, vbi, i + 1, pos, angle, new Vector2(cpos + Math.cos(curA) * t, Math.sin(curA) * t));

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
                        let vi = 0;
                        let v1 = storeVertex(vb, vbi, vi++, pos, angle, new Vector2(0, ht));
                        let v2 = storeVertex(vb, vbi, vi++, pos, angle, new Vector2(ht, t));
                        let v3 = storeVertex(vb, vbi, vi++, pos, angle, new Vector2(ht * 3, 0));
                        let v4 = storeVertex(vb, vbi, vi++, pos, angle, new Vector2(ht, -t));
                        let v5 = storeVertex(vb, vbi, vi++, pos, angle, new Vector2(0, -ht));

                        if (borderMode) {
                            let f = Math.sqrt(bt * bt * 2);
                            let v6 = storeVertex(vb, vbi, vi++, pos, angle, new Vector2(-f,ht));
                            let v7 = storeVertex(vb, vbi, vi++, pos, angle, new Vector2(ht,t+f));
                            let v8 = storeVertex(vb, vbi, vi++, pos, angle, new Vector2(ht*3+f,0));
                            let v9 = storeVertex(vb, vbi, vi++, pos, angle, new Vector2(ht,-(t+f)));
                            let v10 = storeVertex(vb, vbi, vi++, pos, angle, new Vector2(-f, -ht));

                            let ii = 0;
                            storeIndex(ib, ibi, ii++, v6); storeIndex(ib, ibi, ii++, v7); storeIndex(ib, ibi, ii++, v1);
                            storeIndex(ib, ibi, ii++, v1); storeIndex(ib, ibi, ii++, v7); storeIndex(ib, ibi, ii++, v2);

                            storeIndex(ib, ibi, ii++, v2); storeIndex(ib, ibi, ii++, v7); storeIndex(ib, ibi, ii++, v8);
                            storeIndex(ib, ibi, ii++, v2); storeIndex(ib, ibi, ii++, v8); storeIndex(ib, ibi, ii++, v3);

                            storeIndex(ib, ibi, ii++, v3); storeIndex(ib, ibi, ii++, v8); storeIndex(ib, ibi, ii++, v9);
                            storeIndex(ib, ibi, ii++, v3); storeIndex(ib, ibi, ii++, v9); storeIndex(ib, ibi, ii++, v4);

                            storeIndex(ib, ibi, ii++, v4); storeIndex(ib, ibi, ii++, v9); storeIndex(ib, ibi, ii++, v10);
                            storeIndex(ib, ibi, ii++, v4); storeIndex(ib, ibi, ii++, v10); storeIndex(ib, ibi, ii++, v5);

                        } else {
                            storeIndex(ib, ibi, 0, v1); storeIndex(ib, ibi, 1, v2); storeIndex(ib, ibi, 2, v3);
                            storeIndex(ib, ibi, 3, v1); storeIndex(ib, ibi, 4, v3); storeIndex(ib, ibi, 5, v5);
                            storeIndex(ib, ibi, 6, v5); storeIndex(ib, ibi, 7, v3); storeIndex(ib, ibi, 8, v4);
                        }
                        break;
                    }
                }

                return null;
            }

            let buildLine = (vb: Float32Array, ht: number, bt?: number) => {
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

                    direction(cur, last, lineA);
                    if (!curNormal) {
                        curNormal = Vector2.Zero();
                        perp(lineA, curNormal);
                    }

                    if (i === 1) {
                        store(vb, 0, total, this.points[0], curNormal, ht, bt);
                    }

                    if (!next) {
                        perp(lineA, curNormal);
                        store(vb, i, total, this.points[i], curNormal, ht, bt, i - 1);
                    } else {
                        direction(next, cur, lineB);

                        var miterLen = computeMiter(tangent, miter, lineA, lineB);
                        store(vb, i, total, this.points[i], miter, miterLen*ht, miterLen*bt, i - 1);
                    }
                }

                if (this.points.length > 2 && this.closed) {
                    let last2 = this.points[total - 2];
                    let cur2 = this.points[0];
                    let next2 = this.points[1];

                    direction(cur2, last2, lineA);
                    direction(next2, cur2, lineB);
                    perp(lineA, curNormal);

                    var miterLen2 = computeMiter(tangent, miter, lineA, lineB);
                    store(vb, 0, total, this.points[0], miter, miterLen2 * ht, miterLen2 *bt, 1);
                }

                // Remove the point we added at the beginning
                if (this.closed) {
                    this.points.splice(total - 1);
                }
            }

            // Need to create WebGL resources for fill part?
            if (this.fill) {
                let startCapInfo = getCapSize(this.startCap);
                let endCapInfo = getCapSize(this.endCap);
                let count = this.points.length;
                let vbSize = (count * 2 * 2) + startCapInfo.vbsize + endCapInfo.vbsize;
                let vb = new Float32Array(vbSize);
                let ht = this.fillThickness / 2;
                let total = this.points.length;

                buildLine(vb, ht);

                let max = (total - (this.closed ? 1 : 0)) * 2;
                let triCount = (count - (this.closed ? 0 : 1)) * 2;
                let ib = new Float32Array(triCount * 3 + startCapInfo.ibsize + endCapInfo.ibsize);
                for (let i = 0; i < triCount; i+=2) {
                    ib[i * 3 + 0] = i + 0;
                    ib[i * 3 + 1] = i + 1;
                    ib[i * 3 + 2] = (i + 2) % max;

                    ib[i * 3 + 3] = i + 1;
                    ib[i * 3 + 4] = (i + 3) % max;
                    ib[i * 3 + 5] = (i + 2) % max;
                }

                buildCap(vb, count * 2 * 2, ib, triCount * 3, this.points[0], this.fillThickness, null, this.startCap, startN);
                buildCap(vb, (count * 2 * 2) + startCapInfo.vbsize, ib, (triCount * 3) + startCapInfo.ibsize, this.points[total - 1], this.fillThickness, null, this.endCap, endN);

                renderCache.fillVB = engine.createVertexBuffer(vb);
                renderCache.fillIB = engine.createIndexBuffer(ib);
                renderCache.fillIndicesCount = ib.length;

                let ei = this.getDataPartEffectInfo(Shape2D.SHAPE2D_FILLPARTID, ["position"]);
                renderCache.effectFill = engine.createEffect({ vertex: "lines2d", fragment: "lines2d" }, ei.attributes, ei.uniforms, [], ei.defines, null);
            }

            // Need to create WebGL resources for border part?
            if (this.border) {
                let startCapInfo = getCapSize(this.startCap, true);
                let endCapInfo = getCapSize(this.endCap, true);
                let count = this.points.length;
                let vbSize = (count * 2 * 2 * 2) + startCapInfo.vbsize + endCapInfo.vbsize;
                let vb = new Float32Array(vbSize);
                let ht = this.fillThickness / 2;
                let bt = this.borderThickness;
                let total = this.points.length;

                buildLine(vb, ht, bt);

                let max = (total - (this.closed ? 1 : 0)) * 2 * 2;
                let triCount = (count - (this.closed ? 0 : 1)) * 2 * 2;
                let ib = new Float32Array(triCount * 3 + startCapInfo.ibsize + endCapInfo.ibsize);
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

                buildCap(vb, count * 2 * 2 * 2, ib, triCount * 3, this.points[0], this.fillThickness, this.borderThickness, this.startCap, startN);
                buildCap(vb, (count * 2 * 2 * 2) + startCapInfo.vbsize, ib, (triCount * 3) + startCapInfo.ibsize, this.points[total - 1], this.fillThickness, this.borderThickness, this.endCap, endN);

                renderCache.borderVB = engine.createVertexBuffer(vb);
                renderCache.borderIB = engine.createIndexBuffer(ib);
                renderCache.borderIndicesCount = ib.length;

                let ei = this.getDataPartEffectInfo(Shape2D.SHAPE2D_BORDERPARTID, ["position"]);
                renderCache.effectBorder = engine.createEffect({ vertex: "lines2d", fragment: "lines2d" }, ei.attributes, ei.uniforms, [], ei.defines, null);
            }
 
            return renderCache;
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
                d.boundingMin = this.boundingMin;
                d.boundingMax = this.boundingMax;
            }
            else if (part.id === Shape2D.SHAPE2D_FILLPARTID) {
                let d = <Lines2DInstanceData>part;
                d.boundingMin = this.boundingMin;
                d.boundingMax = this.boundingMax;
            }
            return true;
        }

        private _updateSize() {
            let res = Tools.ExtractMinAndMaxVector2(Tools.Vector2ArrayFeeder(this.points));
            this._boundingMin = res.minimum;
            this._boundingMax = res.maximum;
            this._size.width = res.maximum.x - res.minimum.x;
            this._size.height = res.maximum.y - res.minimum.y;
            this._sizeDirty = false;
        }

        private static _noCap            = 0;
        private static _roundCap         = 1;
        private static _triangleCap      = 2;
        private static _squareAnchorCap  = 3;
        private static _roundAnchorCap   = 4;
        private static _diamondAnchorCap = 5;
        private static _arrowCap         = 6;

        private static _roundCapSubDiv = 36;

        private _boundingMin: Vector2;
        private _boundingMax: Vector2;
        private _size: Size;
        private _sizeDirty: boolean;

        private _closed: boolean;
        private _startCap: number;
        private _endCap: number;
        private _fillThickness: number;
        private _points: Vector2[];


    }
}