module BABYLON {
    export class Rectangle2DRenderCache extends ModelRenderCache {
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
                engine.bindBuffersDirectly(this.fillVB, this.fillIB, [1], 4, this.effectFill);
                let count = instanceInfo._instancesPartsData[partIndex].usedElementCount;
                if (instanceInfo._owner.owner.supportInstancedArray) {
                    if (!this.instancingFillAttributes) {
                        // Compute the offset locations of the attributes in the vertex shader that will be mapped to the instance buffer data
                        this.instancingFillAttributes = this.loadInstancingAttributes(Shape2D.SHAPE2D_FILLPARTID, this.effectFill);
                    }

                    engine.updateAndBindInstancesBuffer(instanceInfo._instancesPartsBuffer[partIndex], null, this.instancingFillAttributes);
                    engine.draw(true, 0, this.fillIndicesCount, count);
                    engine.unbindInstanceAttributes();
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
                engine.bindBuffersDirectly(this.borderVB, this.borderIB, [1], 4, this.effectBorder);
                let count = instanceInfo._instancesPartsData[partIndex].usedElementCount;
                if (instanceInfo._owner.owner.supportInstancedArray) {
                    if (!this.instancingBorderAttributes) {
                        this.instancingBorderAttributes = this.loadInstancingAttributes(Shape2D.SHAPE2D_BORDERPARTID, this.effectBorder);
                    }

                    engine.updateAndBindInstancesBuffer(instanceInfo._instancesPartsBuffer[partIndex], null, this.instancingBorderAttributes);
                    engine.draw(true, 0, this.borderIndicesCount, count);
                    engine.unbindInstanceAttributes();
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

    export class Rectangle2DInstanceData extends Shape2DInstanceData {
        constructor(partId: number) {
            super(partId, 1);
        }

        @instanceData()
        get properties(): Vector3 {
            return null;
        }
    }

    @className("Rectangle2D")
    export class Rectangle2D extends Shape2D {

        public static sizeProperty: Prim2DPropInfo;
        public static notRoundedProperty: Prim2DPropInfo;
        public static roundRadiusProperty: Prim2DPropInfo;

        public get actualSize(): Size {
            return this.size;
        }

        @instanceLevelProperty(Shape2D.SHAPE2D_PROPCOUNT + 1, pi => Rectangle2D.sizeProperty = pi, false, true)
        public get size(): Size {
            return this._size;
        }

        public set size(value: Size) {
            this._size = value;
        }

        @modelLevelProperty(Shape2D.SHAPE2D_PROPCOUNT + 2, pi => Rectangle2D.notRoundedProperty = pi)
        public get notRounded(): boolean {
            return this._notRounded;
        }

        public set notRounded(value: boolean) {
            this._notRounded = value;
        }

        @instanceLevelProperty(Shape2D.SHAPE2D_PROPCOUNT + 3, pi => Rectangle2D.roundRadiusProperty = pi)
        public get roundRadius(): number {
            return this._roundRadius;
        }

        public set roundRadius(value: number) {
            this._roundRadius = value;
            this.notRounded = value === 0;
        }

        protected levelIntersect(intersectInfo: IntersectInfo2D): boolean {
            // If we got there it mean the boundingInfo intersection succeed, if the rectangle has not roundRadius, it means it succeed!
            if (this.notRounded) {
                return true;
            }

            // Well, for now we neglect the area where the pickPosition could be outside due to the roundRadius...
            // TODO make REAL intersection test here!
            return true;
        }

        protected updateLevelBoundingInfo() {
            BoundingInfo2D.CreateFromSizeToRef(this.size, this._levelBoundingInfo, this.origin);
        }

        protected setupRectangle2D(owner: Canvas2D, parent: Prim2DBase, id: string, position: Vector2, origin: Vector2, size: Size, roundRadius, fill: IBrush2D, border: IBrush2D, borderThickness: number, isVisible: boolean, marginTop: number, marginLeft: number, marginRight: number, marginBottom: number, vAlignment: number, hAlignment: number) {
            this.setupShape2D(owner, parent, id, position, origin, isVisible, fill, border, borderThickness, marginTop, marginLeft, marginRight, marginBottom, hAlignment, vAlignment);
            this.size = size;
            this.notRounded = !roundRadius;
            this.roundRadius = roundRadius;
        }

        /**
         * Create an Rectangle 2D Shape primitive. May be a sharp rectangle (with sharp corners), or a rounded one.
         * @param parent the parent primitive, must be a valid primitive (or the Canvas)
         * options:
         *  - id a text identifier, for information purpose
         *  - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         *  - origin: define the normalized origin point location, default [0.5;0.5]
         *  - size: the size of the group. Alternatively the width and height properties can be set. Default will be [10;10].
         *  - roundRadius: if the rectangle has rounded corner, set their radius, default is 0 (to get a sharp rectangle).
         *  - fill: the brush used to draw the fill content of the ellipse, you can set null to draw nothing (but you will have to set a border brush), default is a SolidColorBrush of plain white.
         *  - border: the brush used to draw the border of the ellipse, you can set null to draw nothing (but you will have to set a fill brush), default is null.
         *  - borderThickness: the thickness of the drawn border, default is 1.
         *  - isVisible: true if the primitive must be visible, false for hidden. Default is true.
         *  - marginTop/Left/Right/Bottom: define the margin for the corresponding edge, if all of them are null, margin is not used in layout computing. Default Value is null for each.
         *  - hAlighment: define horizontal alignment of the Canvas, alignment is optional, default value null: no alignment.
         *  - vAlighment: define horizontal alignment of the Canvas, alignment is optional, default value null: no alignment.
         */
        public static Create(parent: Prim2DBase, options: { id?: string, position?: Vector2, x?: number, y?: number, origin?: Vector2, size?: Size, width?: number, height?: number, roundRadius?: number, fill?: IBrush2D, border?: IBrush2D, borderThickness?: number, isVisible?: boolean, marginTop?: number, marginLeft?: number, marginRight?: number, marginBottom?: number, vAlignment?: number, hAlignment?: number}): Rectangle2D {
            Prim2DBase.CheckParent(parent);

            let rect = new Rectangle2D();

            if (!options) {
                rect.setupRectangle2D(parent.owner, parent, null, Vector2.Zero(), null, new Size(10, 10), 0, Canvas2D.GetSolidColorBrushFromHex("#FFFFFFFF"), null, 1, true, null, null, null, null, null, null);
            } else {
                let pos = options.position || new Vector2(options.x || 0, options.y || 0);
                let size = options.size || (new Size(options.width || 10, options.height || 10));

                rect.setupRectangle2D(parent.owner, parent, options.id || null, pos, options.origin || null, size, options.roundRadius || 0, options.fill || Canvas2D.GetSolidColorBrushFromHex("#FFFFFFFF"), options.border || null, options.borderThickness || 1, options.isVisible || true, options.marginTop || null, options.marginLeft || null, options.marginRight || null, options.marginBottom || null, options.vAlignment || null, options.hAlignment || null);
            }
            return rect;
        }

        public static roundSubdivisions = 16;

        protected createModelRenderCache(modelKey: string, isTransparent: boolean): ModelRenderCache {
            let renderCache = new Rectangle2DRenderCache(this.owner.engine, modelKey, isTransparent);
            return renderCache;
        }

        protected setupModelRenderCache(modelRenderCache: ModelRenderCache) {
            let renderCache = <Rectangle2DRenderCache>modelRenderCache;
            let engine = this.owner.engine;

            // Need to create WebGL resources for fill part?
            if (this.fill) {
                let vbSize = ((this.notRounded ? 1 : Rectangle2D.roundSubdivisions) * 4) + 1;
                let vb = new Float32Array(vbSize);
                for (let i = 0; i < vbSize; i++) {
                    vb[i] = i;
                }
                renderCache.fillVB = engine.createVertexBuffer(vb);

                let triCount = vbSize - 1;
                let ib = new Float32Array(triCount * 3);
                for (let i = 0; i < triCount; i++) {
                    ib[i * 3 + 0] = 0;
                    ib[i * 3 + 2] = i + 1;
                    ib[i * 3 + 1] = i + 2;
                }
                ib[triCount * 3 - 2] = 1;

                renderCache.fillIB = engine.createIndexBuffer(ib);
                renderCache.fillIndicesCount = triCount * 3;

                let ei = this.getDataPartEffectInfo(Shape2D.SHAPE2D_FILLPARTID, ["index"]);
                renderCache.effectFill = engine.createEffect({ vertex: "rect2d", fragment: "rect2d" }, ei.attributes, ei.uniforms, [], ei.defines, null, e => {
//                    renderCache.setupUniformsLocation(e, ei.uniforms, Shape2D.SHAPE2D_FILLPARTID);
                });
            }

            // Need to create WebGL resource for border part?
            if (this.border) {
                let vbSize = (this.notRounded ? 1 : Rectangle2D.roundSubdivisions) * 4 * 2;
                let vb = new Float32Array(vbSize);
                for (let i = 0; i < vbSize; i++) {
                    vb[i] = i;
                }
                renderCache.borderVB = engine.createVertexBuffer(vb);

                let triCount = vbSize;
                let rs = triCount / 2;
                let ib = new Float32Array(triCount * 3);
                for (let i = 0; i < rs; i++) {
                    let r0 = i;
                    let r1 = (i + 1) % rs;

                    ib[i * 6 + 0] = rs + r1;
                    ib[i * 6 + 1] = rs + r0;
                    ib[i * 6 + 2] = r0;

                    ib[i * 6 + 3] = r1;
                    ib[i * 6 + 4] = rs + r1;
                    ib[i * 6 + 5] = r0;
                }

                renderCache.borderIB = engine.createIndexBuffer(ib);
                renderCache.borderIndicesCount = triCount * 3;

                let ei = this.getDataPartEffectInfo(Shape2D.SHAPE2D_BORDERPARTID, ["index"]);
                renderCache.effectBorder = engine.createEffect({ vertex: "rect2d", fragment: "rect2d" }, ei.attributes, ei.uniforms, [], ei.defines, null, e => {
//                    renderCache.setupUniformsLocation(e, ei.uniforms, Shape2D.SHAPE2D_BORDERPARTID);
                });
            }

            return renderCache;
        }


        protected createInstanceDataParts(): InstanceDataBase[] {
            var res = new Array<InstanceDataBase>();
            if (this.border) {
                res.push(new Rectangle2DInstanceData(Shape2D.SHAPE2D_BORDERPARTID));
            }
            if (this.fill) {
                res.push(new Rectangle2DInstanceData(Shape2D.SHAPE2D_FILLPARTID));
            }
            return res;
        }

        protected refreshInstanceDataPart(part: InstanceDataBase): boolean {
            if (!super.refreshInstanceDataPart(part)) {
                return false;
            }
            if (part.id === Shape2D.SHAPE2D_BORDERPARTID) {
                let d = <Rectangle2DInstanceData>part;
                let size = this.size;
                d.properties = new Vector3(size.width, size.height, this.roundRadius || 0);
            }
            else if (part.id === Shape2D.SHAPE2D_FILLPARTID) {
                let d = <Rectangle2DInstanceData>part;
                let size = this.size;
                d.properties = new Vector3(size.width, size.height, this.roundRadius || 0);
            }
            return true;
        }

        private _size: Size;
        private _notRounded: boolean;
        private _roundRadius: number;
    }
}