module BABYLON {
    export class Ellipse2DRenderCache extends ModelRenderCache {
        effectsReady: boolean                               = false;
        fillVB: WebGLBuffer                                 = null;
        fillIB: WebGLBuffer                                 = null;
        fillIndicesCount: number                            = 0;
        instancingFillAttributes: InstancingAttributeInfo[] = null;
        effectFillInstanced: Effect                         = null;
        effectFill: Effect                                  = null;

        borderVB: WebGLBuffer                                 = null;
        borderIB: WebGLBuffer                                 = null;
        borderIndicesCount: number                            = 0;
        instancingBorderAttributes: InstancingAttributeInfo[] = null;
        effectBorderInstanced: Effect                         = null;
        effectBorder: Effect                                  = null;

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

            var engine = instanceInfo.owner.owner.engine;

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
                engine.bindBuffersDirectly(this.fillVB, this.fillIB, [1], 4, effect);
                if (context.useInstancing) {
                    if (!this.instancingFillAttributes) {
                        this.instancingFillAttributes = this.loadInstancingAttributes(Shape2D.SHAPE2D_FILLPARTID, effect);
                    }

                    engine.updateAndBindInstancesBuffer(pid._partBuffer, null, this.instancingFillAttributes);
                    engine.draw(true, 0, this.fillIndicesCount, pid._partData.usedElementCount);
                    engine.unbindInstanceAttributes();
                } else {
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
                engine.bindBuffersDirectly(this.borderVB, this.borderIB, [1], 4, effect);
                if (context.useInstancing) {
                    if (!this.instancingBorderAttributes) {
                        this.instancingBorderAttributes = this.loadInstancingAttributes(Shape2D.SHAPE2D_BORDERPARTID, effect);
                    }

                    engine.updateAndBindInstancesBuffer(pid._partBuffer, null, this.instancingBorderAttributes);
                    engine.draw(true, 0, this.borderIndicesCount, pid._partData.usedElementCount);
                    engine.unbindInstanceAttributes();
                } else {
                    for (let i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
                        this.setupUniforms(this.effectBorder, partIndex, pid._partData, i);
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

        protected setupEllipse2D(owner: Canvas2D, parent: Prim2DBase, id: string, position: Vector2, origin: Vector2, size: Size, subdivisions: number, fill: IBrush2D, border: IBrush2D, borderThickness: number, isVisible: boolean, marginTop: number, marginLeft: number, marginRight: number, marginBottom: number, vAlignment: number, hAlignment: number) {
            this.setupShape2D(owner, parent, id, position, origin, isVisible, fill, border, borderThickness, marginTop, marginLeft, marginRight, marginBottom, hAlignment, vAlignment);
            this.size = size;
            this.subdivisions = subdivisions;
        }

        /**
         * Create an Ellipse 2D Shape primitive
         * @param parent the parent primitive, must be a valid primitive (or the Canvas)
         * options:
         *  - id: a text identifier, for information purpose
         *  - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         *  - origin: define the normalized origin point location, default [0.5;0.5]
         *  - size: the size of the group. Alternatively the width and height properties can be set. Default will be [10;10].
         *  - subdivision: the number of subdivision to create the ellipse perimeter, default is 64.
         *  - fill: the brush used to draw the fill content of the ellipse, you can set null to draw nothing (but you will have to set a border brush), default is a SolidColorBrush of plain white.
         *  - border: the brush used to draw the border of the ellipse, you can set null to draw nothing (but you will have to set a fill brush), default is null.
         *  - borderThickness: the thickness of the drawn border, default is 1.
         *  - isVisible: true if the primitive must be visible, false for hidden. Default is true.
         *  - marginTop/Left/Right/Bottom: define the margin for the corresponding edge, if all of them are null, margin is not used in layout computing. Default Value is null for each.
         *  - hAlighment: define horizontal alignment of the Canvas, alignment is optional, default value null: no alignment.
         *  - vAlighment: define horizontal alignment of the Canvas, alignment is optional, default value null: no alignment.
         */
        public static Create(parent: Prim2DBase, options: { id?: string, position?: Vector2, x?: number, y?: number, origin?: Vector2, size?: Size, width?: number, height?: number, subdivisions?: number, fill?: IBrush2D, border?: IBrush2D, borderThickness?: number, isVisible?: boolean, marginTop?: number, marginLeft?: number, marginRight?: number, marginBottom?: number, vAlignment?: number, hAlignment?: number}): Ellipse2D {
            Prim2DBase.CheckParent(parent);

            let ellipse = new Ellipse2D();

            if (!options) {
                ellipse.setupEllipse2D(parent.owner, parent, null, Vector2.Zero(), null, new Size(10, 10), 64, Canvas2D.GetSolidColorBrushFromHex("#FFFFFFFF"), null, 1, true, null, null, null, null, null, null);
            } else {
                let fill: IBrush2D;
                if (options.fill === undefined) {
                    fill = Canvas2D.GetSolidColorBrushFromHex("#FFFFFFFF");
                } else {
                    fill = options.fill;
                }
                let pos = options.position || new Vector2(options.x || 0, options.y || 0);
                let size = options.size || (new Size(options.width || 10, options.height || 10));

                ellipse.setupEllipse2D(parent.owner, parent, options.id || null, pos, options.origin || null, size, options.subdivisions || 64, fill, options.border || null, options.borderThickness || 1, options.isVisible || true, options.marginTop || null, options.marginLeft || null, options.marginRight || null, options.marginBottom || null, options.vAlignment || null, options.hAlignment || null);
            }

            return ellipse;
        }

        protected createModelRenderCache(modelKey: string): ModelRenderCache {
            let renderCache = new Ellipse2DRenderCache(this.owner.engine, modelKey);
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

                // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
                let ei = this.getDataPartEffectInfo(Shape2D.SHAPE2D_FILLPARTID, ["index"], true);
                if (ei) {
                    renderCache.effectFillInstanced = engine.createEffect({ vertex: "ellipse2d", fragment: "ellipse2d" }, ei.attributes, ei.uniforms, [], ei.defines, null);
                }

                // Get the non instanced version
                ei = this.getDataPartEffectInfo(Shape2D.SHAPE2D_FILLPARTID, ["index"], false);
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

                // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
                let ei = this.getDataPartEffectInfo(Shape2D.SHAPE2D_BORDERPARTID, ["index"], true);
                if (ei) {
                    renderCache.effectBorderInstanced = engine.createEffect("ellipse2d", ei.attributes, ei.uniforms, [], ei.defines, null);
                }

                // Get the non instanced version
                ei = this.getDataPartEffectInfo(Shape2D.SHAPE2D_BORDERPARTID, ["index"], false);
                renderCache.effectBorder = engine.createEffect("ellipse2d", ei.attributes, ei.uniforms, [], ei.defines, null);
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