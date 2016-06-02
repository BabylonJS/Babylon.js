module BABYLON {
    export class Rectangle2DRenderCache extends ModelRenderCache {
        effectsReady: boolean                               = false;
        fillVB: WebGLBuffer                                 = null;
        fillIB: WebGLBuffer                                 = null;
        fillIndicesCount: number                            = 0;
        instancingFillAttributes: InstancingAttributeInfo[] = null;
        effectFill: Effect                                  = null;
        effectFillInstanced: Effect                         = null;

        borderVB: WebGLBuffer                                 = null;
        borderIB: WebGLBuffer                                 = null;
        borderIndicesCount: number                            = 0;
        instancingBorderAttributes: InstancingAttributeInfo[] = null;
        effectBorder: Effect                                  = null;
        effectBorderInstanced: Effect                         = null;

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

            var curAlphaMode = engine.getAlphaMode();

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

        private static _i0 = Vector2.Zero();
        private static _i1 = Vector2.Zero();
        private static _i2 = Vector2.Zero();

        protected levelIntersect(intersectInfo: IntersectInfo2D): boolean {
            // If we got there it mean the boundingInfo intersection succeed, if the rectangle has not roundRadius, it means it succeed!
            if (this.notRounded) {
                return true;
            }

            // If we got so far it means the bounding box at least passed, so we know it's inside the bounding rectangle, but it can be outside the roundedRectangle.
            // The easiest way is to check if the point is inside on of the four corners area (a little square of roundRadius size at the four corners)
            // If it's the case for one, check if the mouse is located in the quarter that we care about (the one who is visible) then finally make a distance check with the roundRadius radius to see if it's inside the circle quarter or outside.

            // First let remove the origin out the equation, to have the rectangle with an origin at bottom/left
            let o = this.origin;
            let size = this.size;
            Rectangle2D._i0.x = intersectInfo._localPickPosition.x + (size.width * o.x);
            Rectangle2D._i0.y = intersectInfo._localPickPosition.y + (size.height * o.y);

            let rr = this.roundRadius;
            let rrs = rr * rr;

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
                let fill = options.fill===undefined ? Canvas2D.GetSolidColorBrushFromHex("#FFFFFFFF") : options.fill;

                rect.setupRectangle2D
                (
                    parent.owner,
                    parent,
                    options.id || null,
                    pos,
                    options.origin || null,
                    size,
                    (options.roundRadius == null) ? 0 : options.roundRadius,
                    fill,
                    options.border || null,
                    (options.borderThickness==null) ? 1 : options.borderThickness,
                    options.isVisible || true,
                    options.marginTop || null,
                    options.marginLeft || null,
                    options.marginRight || null,
                    options.marginBottom || null,
                    options.vAlignment || null,
                    options.hAlignment || null);
            }
            return rect;
        }

        public static roundSubdivisions = 16;

        protected createModelRenderCache(modelKey: string): ModelRenderCache {
            let renderCache = new Rectangle2DRenderCache(this.owner.engine, modelKey);
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

                // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
                let ei = this.getDataPartEffectInfo(Shape2D.SHAPE2D_FILLPARTID, ["index"], true);
                if (ei) {
                    renderCache.effectFillInstanced = engine.createEffect("rect2d", ei.attributes, ei.uniforms, [], ei.defines, null);
                }

                // Get the non instanced version
                ei = this.getDataPartEffectInfo(Shape2D.SHAPE2D_FILLPARTID, ["index"], false);
                renderCache.effectFill = engine.createEffect("rect2d", ei.attributes, ei.uniforms, [], ei.defines, null);
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

                // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
                let ei = this.getDataPartEffectInfo(Shape2D.SHAPE2D_BORDERPARTID, ["index"], true);
                if (ei) {
                    renderCache.effectBorderInstanced = engine.createEffect("rect2d", ei.attributes, ei.uniforms, [], ei.defines, null);
                }

                // Get the non instanced version
                ei = this.getDataPartEffectInfo(Shape2D.SHAPE2D_BORDERPARTID, ["index"], false);
                renderCache.effectBorder = engine.createEffect("rect2d", ei.attributes, ei.uniforms, [], ei.defines, null);
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