module BABYLON {
    export class Rectangle2DRenderCache extends ModelRenderCache<Rectangle2DInstanceData> {
        fillVB: WebGLBuffer;
        fillIB: WebGLBuffer;
        borderVB: WebGLBuffer;
        borderIB: WebGLBuffer;
        instancingAttributes: InstancingAttributeInfo[];

        effect: Effect;

        render(instanceInfo: GroupInstanceInfo, context: Render2DContext): boolean {
            // Do nothing if the shader is still loading/preparing
            if (!this.effect.isReady()) {
                return false;
            }

            // Compute the offset locations of the attributes in the vertexshader that will be mapped to the instance buffer data
            if (!this.instancingAttributes) {
                this.instancingAttributes = instanceInfo._classTreeInfo.classContent.getInstancingAttributeInfos(this.effect);
            }
            var engine = instanceInfo._owner.owner.engine;

            engine.enableEffect(this.effect);
            engine.bindBuffers(this.fillVB, this.fillIB, [1], 4, this.effect);

            engine.updateAndBindInstancesBuffer(instanceInfo._instancesBuffer, null, this.instancingAttributes);

            engine.draw(true, 0, Rectangle2D.roundSubdivisions * 4 * 3, instanceInfo._instancesData.usedElementCount);

            engine.unBindInstancesBuffer(instanceInfo._instancesBuffer, this.instancingAttributes);

            return true;
        }
    }

    export class Rectangle2DInstanceData extends InstanceDataBase {
        @instanceData()
        get properties(): Vector3 {
            return null;
        }
    }

    export class Rectangle2D extends RenderablePrim2D<Rectangle2DInstanceData> {

        public static sizeProperty: Prim2DPropInfo;
        public static notRoundedProperty: Prim2DPropInfo;
        public static roundRadiusProperty: Prim2DPropInfo;

        @instanceLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 1, pi => Rectangle2D.sizeProperty = pi, false, true)
        public get size(): Size {
            return this._size;
        }

        public set size(value: Size) {
            this._size = value;
        }

        @modelLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 2, pi => Rectangle2D.notRoundedProperty = pi)
        public get notRounded(): boolean {
            return this._notRounded;
        }

        public set notRounded(value: boolean) {
            this._notRounded = value;
        }

        @instanceLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 3, pi => Rectangle2D.roundRadiusProperty = pi)
        public get roundRadius(): number {
            return this._roundRadius;
        }

        public set roundRadius(value: number) {
            this._roundRadius = value;
            this.notRounded = value === 0;
        }

        protected updateLevelBoundingInfo() {
            this._levelBoundingInfo.radius = Math.sqrt(this.size.width * this.size.width + this.size.height * this.size.height);
            this._levelBoundingInfo.extent = this.size.clone();
        }

        protected setupRectangle2D(owner: Canvas2D, parent: Prim2DBase, id: string, position: Vector2, size: Size, roundRadius = 0, fill?: IFill2D, border?: IBorder2D) {
            this.setupRenderablePrim2D(owner, parent, id, position, true, fill, border);
            this.size = size;
            this.notRounded = !roundRadius;
            this.roundRadius = roundRadius;
        }

        public static Create(parent: Prim2DBase, id: string, x: number, y: number, width: number, height: number, fill?: IFill2D, border?: IBorder2D): Rectangle2D {
            Prim2DBase.CheckParent(parent);

            let rect = new Rectangle2D();
            rect.setupRectangle2D(parent.owner, parent, id, new Vector2(x, y), new Size(width, height), null);
            rect.fill = fill || Canvas2D.getSolidColorFillFromHex("#FFFFFFFF");
            rect.border = border;
            return rect;
        }

        public static CreateRounded(parent: Prim2DBase, id: string, x: number, y: number, width: number, height: number, roundRadius = 0, fill?: IFill2D, border?: IBorder2D): Rectangle2D {
            Prim2DBase.CheckParent(parent);

            let rect = new Rectangle2D();
            rect.setupRectangle2D(parent.owner, parent, id, new Vector2(x, y), new Size(width, height), roundRadius);
            rect.fill = fill || Canvas2D.getSolidColorFillFromHex("#FFFFFFFF");
            rect.border = border;
            return rect;
        }

        public static roundSubdivisions = 16;

        protected createModelRenderCache(): ModelRenderCache<Rectangle2DInstanceData> {
            let renderCache = new Rectangle2DRenderCache();
            let engine = this.owner.engine;

            // Need to create vb/ib for the fill part?
            if (this.fill) {
                var vbSize = ((this.notRounded ? 1 : Rectangle2D.roundSubdivisions) * 4) + 1;
                let vb = new Float32Array(vbSize);
                for (let i = 0; i < vbSize; i++) {
                    vb[i] = i;
                }
                renderCache.fillVB = engine.createVertexBuffer(vb);

                let triCount = vbSize - 1;
                let ib = new Float32Array(triCount * 3);
                for (let i = 0; i < triCount; i++) {
                    ib[i * 3 + 0] = 0;
                    ib[i * 3 + 1] = i + 1;
                    ib[i * 3 + 2] = i + 2;
                }
                ib[triCount * 3 - 1] = 1;

                renderCache.fillIB = engine.createIndexBuffer(ib);

                renderCache.effect = engine.createEffect({ vertex: "rect2d", fragment: "rect2d" }, ["index", "zBias", "transformX", "transformY", "origin", "properties"], [], [], "");
            }

            return renderCache;
        }


        protected createInstanceData(): Rectangle2DInstanceData {
            return new Rectangle2DInstanceData();
        }

        protected refreshInstanceData(): boolean {
            if (!super.refreshInstanceData()) {
                return false;
            }

            let d = this._instanceData;
            let size = this.size;
            d.properties = new Vector3(size.width, size.height, this.roundRadius || 0);
            return true;
        }

        private _size: Size;
        private _notRounded: boolean;
        private _roundRadius: number;
    }


}