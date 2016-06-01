module BABYLON {
    export class Sprite2DRenderCache extends ModelRenderCache {
        vb: WebGLBuffer;
        ib: WebGLBuffer;
        instancingAttributes: InstancingAttributeInfo[];

        texture: Texture;
        effect: Effect;

        render(instanceInfo: GroupInstanceInfo, context: Render2DContext): boolean {
            // Do nothing if the shader is still loading/preparing
            if (!this.effect.isReady() || !this.texture.isReady()) {
                return false;
            }

            // Compute the offset locations of the attributes in the vertex shader that will be mapped to the instance buffer data
            var engine = instanceInfo._owner.owner.engine;

            engine.enableEffect(this.effect);
            this.effect.setTexture("diffuseSampler", this.texture);
            engine.bindBuffersDirectly(this.vb, this.ib, [1], 4, this.effect);

            var cur = engine.getAlphaMode();
            engine.setAlphaMode(Engine.ALPHA_COMBINE);
            let count = instanceInfo._instancesPartsData[0].usedElementCount;
            if (instanceInfo._owner.owner.supportInstancedArray) {
                if (!this.instancingAttributes) {
                    this.instancingAttributes = this.loadInstancingAttributes(Sprite2D.SPRITE2D_MAINPARTID, this.effect);
                }
                engine.updateAndBindInstancesBuffer(instanceInfo._instancesPartsBuffer[0], null, this.instancingAttributes);
                engine.draw(true, 0, 6, count);
                engine.unbindInstanceAttributes();
            } else {
                for (let i = 0; i < count; i++) {
                    this.setupUniforms(this.effect, 0, instanceInfo._instancesPartsData[0], i);
                    engine.draw(true, 0, 6);
                }
            }

            engine.setAlphaMode(cur);

            return true;
        }

        public dispose(): boolean {
            if (!super.dispose()) {
                return false;
            }

            if (this.vb) {
                this._engine._releaseBuffer(this.vb);
                this.vb = null;
            }

            if (this.ib) {
                this._engine._releaseBuffer(this.ib);
                this.ib = null;
            }

            if (this.texture) {
                this.texture.dispose();
                this.texture = null;
            }

            if (this.effect) {
                this._engine._releaseEffect(this.effect);
                this.effect = null;
            }

            return true;
        }
    }

    export class Sprite2DInstanceData extends InstanceDataBase {
        constructor(partId: number) {
            super(partId, 1);
        }

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

        public get actualSize(): Size {
            return this.spriteSize;
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
            BoundingInfo2D.CreateFromSizeToRef(this.spriteSize, this._levelBoundingInfo, this.origin);
        }

        public getAnimatables(): IAnimatable[] {
            let res = new Array<IAnimatable>();

            if (this.texture && this.texture.animations && this.texture.animations.length > 0) {
                res.push(this.texture);
            }
            return res;
        }

        protected levelIntersect(intersectInfo: IntersectInfo2D): boolean {
            // If we've made it so far it means the boundingInfo intersection test succeed, the Sprite2D is shaped the same, so we always return true
            return true;
        }

        protected setupSprite2D(owner: Canvas2D, parent: Prim2DBase, id: string, position: Vector2, origin: Vector2, texture: Texture, spriteSize: Size, spriteLocation: Vector2, invertY: boolean, isVisible: boolean, marginTop: number, marginLeft: number, marginRight: number, marginBottom: number, vAlignment: number, hAlignment: number) {
            this.setupRenderablePrim2D(owner, parent, id, position, origin, isVisible, marginTop, marginLeft, marginRight, marginBottom, hAlignment, vAlignment);
            this.texture = texture;
            this.texture.wrapU = Texture.CLAMP_ADDRESSMODE;
            this.texture.wrapV = Texture.CLAMP_ADDRESSMODE;
            this.spriteSize = spriteSize || null;
            this.spriteLocation = spriteLocation || new Vector2(0,0);
            this.spriteFrame = 0;
            this.invertY = invertY;
            this._isTransparent = true;

            if (!this.spriteSize) {
                var s = texture.getSize();
                this.spriteSize = new Size(s.width, s.height);
            }
        }

        /**
         * Create an 2D Sprite primitive
         * @param parent the parent primitive, must be a valid primitive (or the Canvas)
         * @param texture the texture that stores the sprite to render
         * options:
         *  - id a text identifier, for information purpose
         *  - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         *  - origin: define the normalized origin point location, default [0.5;0.5]
         *  - spriteSize: the size of the sprite, if null the size of the given texture will be used, default is null.
         *  - spriteLocation: the location in the texture of the top/left corner of the Sprite to display, default is null (0,0)
         *  - invertY: if true the texture Y will be inverted, default is false.
         *  - isVisible: true if the sprite must be visible, false for hidden. Default is true.
         *  - marginTop/Left/Right/Bottom: define the margin for the corresponding edge, if all of them are null, margin is not used in layout computing. Default Value is null for each.
         *  - hAlighment: define horizontal alignment of the Canvas, alignment is optional, default value null: no alignment.
         *  - vAlighment: define horizontal alignment of the Canvas, alignment is optional, default value null: no alignment.
         */
        public static Create(parent: Prim2DBase, texture: Texture, options: { id?: string, position?: Vector2, x?: number, y?: number, origin?: Vector2, spriteSize?: Size, spriteLocation?: Vector2, invertY?: boolean, isVisible?: boolean, marginTop?: number, marginLeft?: number, marginRight?: number, marginBottom?: number, vAlignment?: number, hAlignment?: number}): Sprite2D {
            Prim2DBase.CheckParent(parent);

            let sprite = new Sprite2D();
            if (!options) {
                sprite.setupSprite2D(parent.owner, parent, null, Vector2.Zero(), null, texture, null, null, false, true, null, null, null, null, null, null);
            } else {
                let pos = options.position || new Vector2(options.x || 0, options.y || 0);
                sprite.setupSprite2D(parent.owner, parent, options.id || null, pos, options.origin || null, texture, options.spriteSize || null, options.spriteLocation || null, options.invertY || false, options.isVisible || true, options.marginTop || null, options.marginLeft || null, options.marginRight || null, options.marginBottom || null, options.vAlignment || null, options.hAlignment || null);
            }

            return sprite;
        }

        static _createCachedCanvasSprite(owner: Canvas2D, texture: MapTexture, size: Size, pos: Vector2): Sprite2D {

            let sprite = new Sprite2D();
            sprite.setupSprite2D(owner, null, "__cachedCanvasSprite__", new Vector2(0, 0), null, texture, size, pos, false, true, null, null, null, null, null, null);

            return sprite;
        }

        protected createModelRenderCache(modelKey: string, isTransparent: boolean): ModelRenderCache {
            let renderCache = new Sprite2DRenderCache(this.owner.engine, modelKey, isTransparent);
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
            ib[1] = 2;
            ib[2] = 1;
            ib[3] = 0;
            ib[4] = 3;
            ib[5] = 2;

            renderCache.ib = engine.createIndexBuffer(ib);

            renderCache.texture = this.texture;

            var ei = this.getDataPartEffectInfo(Sprite2D.SPRITE2D_MAINPARTID, ["index"]);
            renderCache.effect = engine.createEffect({ vertex: "sprite2d", fragment: "sprite2d" }, ei.attributes, ei.uniforms, ["diffuseSampler"], ei.defines, null, e => {
//                renderCache.setupUniformsLocation(e, ei.uniforms, Sprite2D.SPRITE2D_MAINPARTID);
            });

            return renderCache;
        }

        protected createInstanceDataParts(): InstanceDataBase[] {
            return [new Sprite2DInstanceData(Sprite2D.SPRITE2D_MAINPARTID)];
        }

        protected refreshInstanceDataPart(part: InstanceDataBase): boolean {
            if (!super.refreshInstanceDataPart(part)) {
                return false;
            }

            if (part.id === Sprite2D.SPRITE2D_MAINPARTID) {
                let d = <Sprite2DInstanceData>this._instanceDataParts[0];
                let ts = this.texture.getBaseSize();
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