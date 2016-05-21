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
                engine.bindBuffers(this.borderVB, this.borderIB, [1], 4, this.effectBorder);
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
            if (this._sizeDirty) {
                this._updateSize();
            }
            return this._size;
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

        protected updateLevelBoundingInfo() {
            BoundingInfo2D.CreateFromSizeToRef(this._size, this._levelBoundingInfo, this.origin);
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
            let computeMiter = (tangent: Vector2, miter: Vector2, a: Vector2, b: Vector2, halfThickness: number): number => {
                a.addToRef(b, tangent);
                tangent.normalize();

                miter.x = -tangent.y;
                miter.y = tangent.x;

                tps.x = -a.y;
                tps.y = a.x;

                return halfThickness / Vector2.Dot(miter, tps);
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

            let store = (array: Float32Array, index: number, p: Vector2, n: Vector2, halfThickness: number, detectFlip?: number) => {
                // Mandatory because we'll be out of bound in case of closed line, for the very last point (which is a duplicate of the first that we don't store in the vb)
                if (index * 4 >= array.length) {
                    return;
                }
                array[index * 4 + 0] = p.x + n.x * halfThickness;
                array[index * 4 + 1] = p.y + n.y * halfThickness;
                array[index * 4 + 2] = p.x + n.x * -halfThickness;
                array[index * 4 + 3] = p.y + n.y * -halfThickness;

                // If an index is given we check if the two segments formed between [index+0;dectectFlip+0] and [index+2;dectectFlip+2] intersect themselves.
                // It should not be the case, they should be parallel, so if they cross, we switch the order of storage to ensure we'll have parallel lines
                if (detectFlip !== undefined) {
                    // Flip if intersect
                    if (intersect(array[index * 4 + 0], array[index * 4 + 1], array[detectFlip * 4 + 0], array[detectFlip * 4 + 1], array[index * 4 + 2], array[index * 4 + 3], array[detectFlip * 4 + 2], array[detectFlip * 4 + 3])) {
                        let n = array[index * 4 + 0];
                        array[index * 4 + 0] = array[index * 4 + 2];
                        array[index * 4 + 2] = n;

                        n = array[index * 4 + 1];
                        array[index * 4 + 1] = array[index * 4 + 3];
                        array[index * 4 + 3] = n;
                    }
                }
            }


            // Need to create WebGL resources for fill part?
            if (this.fill) {
                let count = this.points.length;
                let vbSize = count * 2 * 2;
                let vb = new Float32Array(vbSize);
                let ht = this.fillThickness/2;
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
                        store(vb, 0, this.points[0], curNormal, ht);
                    }

                    if (!next) { 
                        perp(lineA, curNormal);
                        store(vb, i, this.points[i], curNormal, ht, i-1);
                    } else {
                        direction(next, cur, lineB);

                        var miterLen = computeMiter(tangent, miter, lineA, lineB, ht);
                        store(vb, i, this.points[i], miter, miterLen, i-1);
                    }
                }

                if (this.points.length > 2 && this.closed) {
                    let last2 = this.points[total - 2];
                    let cur2 = this.points[0];
                    let next2 = this.points[1];

                    direction(cur2, last2, lineA);
                    direction(next2, cur2, lineB);
                    perp(lineA, curNormal);

                    var miterLen2 = computeMiter(tangent, miter, lineA, lineB, ht);
                    store(vb, 0, this.points[0], miter, miterLen2, 1);
                }

                // Remove the point we added at the beginning
                if (this.closed) {
                    this.points.splice(total - 1);
                }

                renderCache.fillVB = engine.createVertexBuffer(vb);

                let max = (total - (this.closed ? 1 : 0)) * 2;
                let triCount = (count - (this.closed ? 0 : 1)) * 2;
                let ib = new Float32Array(triCount * 3);
                for (let i = 0; i < triCount; i+=2) {
                    ib[i * 3 + 0] = i + 0;
                    ib[i * 3 + 1] = i + 1;
                    ib[i * 3 + 2] = (i + 2) % max;

                    ib[i * 3 + 3] = i + 1;
                    ib[i * 3 + 4] = (i + 3) % max;
                    ib[i * 3 + 5] = (i + 2) % max;
                }

                renderCache.fillIB = engine.createIndexBuffer(ib);
                renderCache.fillIndicesCount = triCount * 3;

                let ei = this.getDataPartEffectInfo(Shape2D.SHAPE2D_FILLPARTID, ["position"]);
                renderCache.effectFill = engine.createEffect({ vertex: "lines2d", fragment: "lines2d" }, ei.attributes, ei.uniforms, [], ei.defines, null);
            }

            // Need to create WebGL resource for border part?
            //if (this.border) {
            //    let vbSize = this.subdivisions * 2;
            //    let vb = new Float32Array(vbSize);
            //    for (let i = 0; i < vbSize; i++) {
            //        vb[i] = i;
            //    }
            //    renderCache.borderVB = engine.createVertexBuffer(vb);

            //    let triCount = vbSize;
            //    let rs = triCount / 2;
            //    let ib = new Float32Array(triCount * 3);
            //    for (let i = 0; i < rs; i++) {
            //        let r0 = i;
            //        let r1 = (i + 1) % rs;

            //        ib[i * 6 + 0] = rs + r1;
            //        ib[i * 6 + 1] = rs + r0;
            //        ib[i * 6 + 2] = r0;

            //        ib[i * 6 + 3] = r1;
            //        ib[i * 6 + 4] = rs + r1;
            //        ib[i * 6 + 5] = r0;
            //    }

            //    renderCache.borderIB = engine.createIndexBuffer(ib);
            //    renderCache.borderIndicesCount = (triCount* 3);

            //    let ei = this.getDataPartEffectInfo(Shape2D.SHAPE2D_BORDERPARTID, ["index"]);
            //    renderCache.effectBorder = engine.createEffect({ vertex: "lines2d", fragment: "lines2d" }, ei.attributes, ei.uniforms, [], ei.defines, null);
            //}

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
            //if (part.id === Shape2D.SHAPE2D_BORDERPARTID) {
            //    let d = <Lines2DInstanceData>part;
            //}
            //else if (part.id === Shape2D.SHAPE2D_FILLPARTID) {
            //    let d = <Lines2DInstanceData>part;
            //}
            return true;
        }

        private _updateSize() {
            let res = Tools.ExtractMinAndMaxVector2(Tools.Vector2ArrayFeeder(this.points));
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

        private _size: Size;
        private _sizeDirty: boolean;

        private _closed: boolean;
        private _startCap: number;
        private _endCap: number;
        private _fillThickness: number;
        private _points: Vector2[];


    }
}