module BABYLON {
    export class Ellipse2DRenderCache extends ModelRenderCache {
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
                engine.bindBuffers(this.fillVB, this.fillIB, [1], 4, this.effectFill);
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

    export class Ellipse2DInstanceData extends Shape2DInstanceData {
        constructor(partId: number) {
            super(partId, 1);
        }

        @instanceData()
        get properties(): Vector3 {
            return null;
        }
    }

    @className("Ellipse2D")
    export class Ellipse2D extends Shape2D {

        public static sizeProperty: Prim2DPropInfo;
        public static subdivisionsProperty: Prim2DPropInfo;

        public get actualSize(): Size {
            return this.size;
        }

        @instanceLevelProperty(Shape2D.SHAPE2D_PROPCOUNT + 1, pi => Ellipse2D.sizeProperty = pi, false, true)
        public get size(): Size {
            return this._size;
        }

        public set size(value: Size) {
            this._size = value;
        }

        @modelLevelProperty(Shape2D.SHAPE2D_PROPCOUNT + 2, pi => Ellipse2D.subdivisionsProperty = pi)
        public get subdivisions(): number {
            return this._subdivisions;
        }

        public set subdivisions(value: number) {
            this._subdivisions = value;
        }

        protected levelIntersect(intersectInfo: IntersectInfo2D): boolean {
            let x = intersectInfo._localPickPosition.x;
            let y = intersectInfo._localPickPosition.y;
            let w = this.size.width/2;
            let h = this.size.height/2;
            return ((x * x) / (w * w) + (y * y) / (h * h)) <= 1;
        }

        protected updateLevelBoundingInfo() {
            BoundingInfo2D.CreateFromSizeToRef(this.size, this._levelBoundingInfo, this.origin);
        }

        protected setupEllipse2D(owner: Canvas2D, parent: Prim2DBase, id: string, position: Vector2, origin: Vector2, size: Size, subdivisions: number=64, fill?: IBrush2D, border?: IBrush2D, borderThickness: number = 1) {
            this.setupShape2D(owner, parent, id, position, origin, true, fill, border, borderThickness);
            this.size = size;
            this.subdivisions = subdivisions;
        }

        /**
         * Create an Ellipse 2D Shape primitive
         * @param parent the parent primitive, must be a valid primitive (or the Canvas)
         * options:
         *  - id: a text identifier, for information purpose
         *  - x: the X position relative to its parent, default is 0
         *  - y: the Y position relative to its parent, default is 0
         *  - origin: define the normalized origin point location, default [0.5;0.5]
         *  - width: the width of the ellipse, default is 10
         *  - height: the height of the ellipse, default is 10
         *  - subdivision: the number of subdivision to create the ellipse perimeter, default is 64.
         *  - fill: the brush used to draw the fill content of the ellipse, you can set null to draw nothing (but you will have to set a border brush), default is a SolidColorBrush of plain white.
         *  - border: the brush used to draw the border of the ellipse, you can set null to draw nothing (but you will have to set a fill brush), default is null.
         *  - borderThickness: the thickness of the drawn border, default is 1.
         */
        public static Create(parent: Prim2DBase, options: { id?: string, x?: number, y?: number, origin?: Vector2, width?: number, height?: number, subdivisions?: number, fill?: IBrush2D, border?: IBrush2D, borderThickness?: number }): Ellipse2D {
            Prim2DBase.CheckParent(parent);

            let fill: IBrush2D;
            if (options && options.fill !== undefined) {
                fill = options.fill;
            } else {
                fill = Canvas2D.GetSolidColorBrushFromHex("#FFFFFFFF");
            }

            let ellipse = new Ellipse2D();
            ellipse.setupEllipse2D(parent.owner, parent, options && options.id || null, new Vector2(options && options.x || 0, options && options.y || 0), options && options.origin || null, new Size(options && options.width || 10, options && options.height || 10), options && options.subdivisions || 64, fill, options && options.border || null, options && options.borderThickness || 1);
            return ellipse;
        }

        protected createModelRenderCache(modelKey: string, isTransparent: boolean): ModelRenderCache {
            let renderCache = new Ellipse2DRenderCache(this.owner.engine, modelKey, isTransparent);
            return renderCache;
        }

        protected setupModelRenderCache(modelRenderCache: ModelRenderCache) {
            let renderCache = <Ellipse2DRenderCache>modelRenderCache;
            let engine = this.owner.engine;

            // Need to create WebGL resources for fill part?
            if (this.fill) {
                let vbSize = this.subdivisions + 1;
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
                renderCache.effectFill = engine.createEffect({ vertex: "ellipse2d", fragment: "ellipse2d" }, ei.attributes, ei.uniforms, [], ei.defines, null);
            }

            // Need to create WebGL resource for border part?
            if (this.border) {
                let vbSize = this.subdivisions * 2;
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
                renderCache.borderIndicesCount = (triCount* 3);

                let ei = this.getDataPartEffectInfo(Shape2D.SHAPE2D_BORDERPARTID, ["index"]);
                renderCache.effectBorder = engine.createEffect({ vertex: "ellipse2d", fragment: "ellipse2d" }, ei.attributes, ei.uniforms, [], ei.defines, null);
            }

            return renderCache;
        }


        protected createInstanceDataParts(): InstanceDataBase[] {
            var res = new Array<InstanceDataBase>();
            if (this.border) {
                res.push(new Ellipse2DInstanceData(Shape2D.SHAPE2D_BORDERPARTID));
            }
            if (this.fill) {
                res.push(new Ellipse2DInstanceData(Shape2D.SHAPE2D_FILLPARTID));
            }
            return res;
        }

        protected refreshInstanceDataPart(part: InstanceDataBase): boolean {
            if (!super.refreshInstanceDataPart(part)) {
                return false;
            }
            if (part.id === Shape2D.SHAPE2D_BORDERPARTID) {
                let d = <Ellipse2DInstanceData>part;
                let size = this.size;
                d.properties = new Vector3(size.width, size.height, this.subdivisions);
            }
            else if (part.id === Shape2D.SHAPE2D_FILLPARTID) {
                let d = <Ellipse2DInstanceData>part;
                let size = this.size;
                d.properties = new Vector3(size.width, size.height, this.subdivisions);
            }
            return true;
        }

        private _size: Size;
        private _subdivisions: number;
    }
}