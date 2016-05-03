module BABYLON {
    export class Sprite2DRenderCache extends ModelRenderCache {
        vb: WebGLBuffer;
        ib: WebGLBuffer;
        borderVB: WebGLBuffer;
        borderIB: WebGLBuffer;
        instancingAttributes: Array<InstancingAttributeInfo[]>;

        texture: Texture;
        effect: Effect;

        render(instanceInfo: GroupInstanceInfo, context: Render2DContext): boolean {
            // Do nothing if the shader is still loading/preparing
            if (!this.effect.isReady() || !this.texture.isReady()) {
                return false;
            }

            // Compute the offset locations of the attributes in the vertexshader that will be mapped to the instance buffer data
            if (!this.instancingAttributes) {
                this.instancingAttributes = this.loadInstancingAttributes(this.effect);
            }
            var engine = instanceInfo._owner.owner.engine;

            engine.enableEffect(this.effect);
            this.effect.setTexture("diffuseSampler", this.texture);
            engine.bindBuffers(this.vb, this.ib, [1], 4, this.effect);

            engine.updateAndBindInstancesBuffer(instanceInfo._instancesPartsBuffer[0], null, this.instancingAttributes[0]);
            var cur = engine.getAlphaMode();
            engine.setAlphaMode(Engine.ALPHA_COMBINE);
            engine.draw(true, 0, 6, instanceInfo._instancesPartsData[0].usedElementCount);
            engine.setAlphaMode(cur);

            engine.unBindInstancesBuffer(instanceInfo._instancesPartsBuffer[0], this.instancingAttributes[0]);

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
    export class Sprite2D extends RenderablePrim2D {
        static SPRITE2D_MAINPARTID = 1;

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
            this._isTransparent = true;
        }

        public static Create(parent: Prim2DBase, id: string, x: number, y: number, texture: Texture, spriteSize: Size, spriteLocation: Vector2, invertY: boolean = false): Sprite2D {
            Prim2DBase.CheckParent(parent);

            let sprite = new Sprite2D();
            sprite.setupSprite2D(parent.owner, parent, id, new Vector2(x, y), texture, spriteSize, spriteLocation, invertY);
            return sprite;
        }

        protected createModelRenderCache(): ModelRenderCache {
            let renderCache = new Sprite2DRenderCache();
            return renderCache;
        }

        protected setupModelRenderCache(modelRenderCache: ModelRenderCache) {
            let renderCache = <Sprite2DRenderCache>modelRenderCache;
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

            var ei = this.getDataPartEffectInfo(Sprite2D.SPRITE2D_MAINPARTID, ["index"]);
            renderCache.effect = engine.createEffect({ vertex: "sprite2d", fragment: "sprite2d" }, ei.attributes, [], ["diffuseSampler"], ei.defines);

            return renderCache;
        }

        protected createInstanceDataParts(): InstanceDataBase[] {
            return [new Sprite2DInstanceData(Sprite2D.SPRITE2D_MAINPARTID)];
        }

        protected refreshInstanceDataParts(part: InstanceDataBase): boolean {
            if (!super.refreshInstanceDataParts(part)) {
                return false;
            }

            if (part.id === Sprite2D.SPRITE2D_MAINPARTID) {
                let d = <Sprite2DInstanceData>this._instanceDataParts[0];
                let ts = this.texture.getSize();
                let sl = this.spriteLocation;
                let ss = this.spriteSize;
                d.topLeftUV = new Vector2(sl.x / ts.width, sl.y / ts.height);
                let suv = new Vector2(ss.width / ts.width, ss.height / ts.height);
                d.sizeUV = suv;
                d.frame = this.spriteFrame;
                d.textureSize = new Vector2(ts.width, ts.height);
                d.invertY = this.invertY ? 1 : 0;
            }
            return true;
        }

        private _texture: Texture;
        private _size: Size;
        private _location: Vector2;
        private _spriteFrame: number;
        private _invertY: boolean;
    }


}