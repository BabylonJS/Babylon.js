module BABYLON {
    export class Sprite2DRenderCache extends ModelRenderCache<Sprite2DInstanceData> {
        vb: WebGLBuffer;
        ib: WebGLBuffer;
        borderVB: WebGLBuffer;
        borderIB: WebGLBuffer;
        instancingAttributes: InstancingAttributeInfo[];

        texture: Texture;
        effect: Effect;

        render(instanceInfo: GroupInstanceInfo, context: Render2DContext): boolean {
            // Do nothing if the shader is still loading/preparing
            if (!this.effect.isReady() || !this.texture.isReady()) {
                return false;
            }

            // Compute the offset locations of the attributes in the vertexshader that will be mapped to the instance buffer data
            if (!this.instancingAttributes) {
                this.instancingAttributes = instanceInfo._classTreeInfo.classContent.getInstancingAttributeInfos(this.effect);
            }
            var engine = instanceInfo._owner.owner.engine;

            engine.enableEffect(this.effect);
            this.effect.setTexture("diffuseSampler", this.texture);
            engine.bindBuffers(this.vb, this.ib, [1], 4, this.effect);

            engine.updateAndBindInstancesBuffer(instanceInfo._instancesBuffer, null, this.instancingAttributes);

            engine.draw(true, 0, 6, instanceInfo._instancesData.usedElementCount);

            engine.unBindInstancesBuffer(instanceInfo._instancesBuffer, this.instancingAttributes);

            return true;
        }
    }

    export class Sprite2DInstanceData extends InstanceDataBase {
        @instanceData()
        get topLeftUV(): Vector2 {
            return null;
        }

        @instanceData()
        get sizeUV(): Vector2 {
            return null;
        }

        @instanceData()
        get textureSize(): Vector2 {
            return null;
        }

        @instanceData()
        get frame(): number {
            return null;
        }

        @instanceData()
        get invertY(): number {
            return null;
        }
    }

    @className("Sprite2D")
    export class Sprite2D extends RenderablePrim2D<Sprite2DInstanceData> {

        public static textureProperty: Prim2DPropInfo;
        public static spriteSizeProperty: Prim2DPropInfo;
        public static spriteLocationProperty: Prim2DPropInfo;
        public static spriteFrameProperty: Prim2DPropInfo;
        public static invertYProperty: Prim2DPropInfo;

        @modelLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 1, pi => Sprite2D.textureProperty = pi)
        public get texture(): Texture {
            return this._texture;
        }

        public set texture(value: Texture) {
            this._texture = value;
        }

        @instanceLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 2, pi => Sprite2D.spriteSizeProperty = pi, false, true)
        public get spriteSize(): Size {
            return this._size;
        }

        public set spriteSize(value: Size) {
            this._size = value;
        }

        @instanceLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 3, pi => Sprite2D.spriteLocationProperty = pi)
        public get spriteLocation(): Vector2 {
            return this._location;
        }

        public set spriteLocation(value: Vector2) {
            this._location = value;
        }

        @instanceLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 4, pi => Sprite2D.spriteFrameProperty = pi)
        public get spriteFrame(): number {
            return this._spriteFrame;
        }

        public set spriteFrame(value: number) {
            this._spriteFrame = value;
        }

        @instanceLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 5, pi => Sprite2D.invertYProperty = pi)
        public get invertY(): boolean {
            return this._invertY;
        }

        public set invertY(value: boolean) {
            this._invertY = value;
        }

        protected updateLevelBoundingInfo() {
            this._levelBoundingInfo.radius = Math.sqrt(this.spriteSize.width * this.spriteSize.width + this.spriteSize.height * this.spriteSize.height);
            this._levelBoundingInfo.extent = this.spriteSize.clone();
        }

        protected setupSprite2D(owner: Canvas2D, parent: Prim2DBase, id: string, position: Vector2, texture: Texture, spriteSize: Size, spriteLocation: Vector2, invertY: boolean) {
            this.setupRenderablePrim2D(owner, parent, id, position, true, null, null);
            this.texture = texture;
            this.spriteSize = spriteSize;
            this.spriteLocation = spriteLocation;
            this.spriteFrame = 0;
            this.invertY = invertY;
        }

        public static Create(parent: Prim2DBase, id: string, x: number, y: number, texture: Texture, spriteSize: Size, spriteLocation: Vector2, invertY: boolean = false): Sprite2D {
            Prim2DBase.CheckParent(parent);

            let sprite = new Sprite2D();
            sprite.setupSprite2D(parent.owner, parent, id, new Vector2(x, y), texture, spriteSize, spriteLocation, invertY);
            return sprite;
        }

        protected createModelRenderCache(): ModelRenderCache<Sprite2DInstanceData> {
            let renderCache = new Sprite2DRenderCache();
            let engine = this.owner.engine;

            let vb = new Float32Array(4);
            for (let i = 0; i < 4; i++) {
                vb[i] = i;
            }
            renderCache.vb = engine.createVertexBuffer(vb);

            let ib = new Float32Array(6);
            ib[0] = 0;
            ib[1] = 1;
            ib[2] = 2;
            ib[3] = 0;
            ib[4] = 2;
            ib[5] = 3;

            renderCache.ib = engine.createIndexBuffer(ib);

            renderCache.texture = this.texture;
            renderCache.effect = engine.createEffect({ vertex: "sprite2d", fragment: "sprite2d" }, ["index", "zBias", "transformX", "transformY", "topLeftUV", "sizeUV", "origin", "textureSize", "frame", "invertY"], [], ["diffuseSampler"], "");

            return renderCache;
        }

        protected createInstanceData(): Sprite2DInstanceData {
            return new Sprite2DInstanceData();
        }

        protected refreshInstanceData(): boolean {
            if (!super.refreshInstanceData()) {
                return false;
            }

            let d = this._instanceData;
            let ts = this.texture.getSize();
            let sl = this.spriteLocation;
            let ss = this.spriteSize;
            d.topLeftUV = new Vector2(sl.x / ts.width, sl.y / ts.height);
            let suv = new Vector2(ss.width / ts.width, ss.height / ts.height);
            d.sizeUV = suv;
            d.frame = this.spriteFrame;
            d.textureSize = new Vector2(ts.width, ts.height);
            d.invertY = this.invertY ? 1 : 0;
            return true;
        }

        private _texture: Texture;
        private _size: Size;
        private _location: Vector2;
        private _spriteFrame: number;
        private _invertY: boolean;
    }


}