module BABYLON {
    export class Sprite2DRenderCache extends ModelRenderCache {
        effectsReady: boolean                           = false;
        vb: WebGLBuffer                                 = null;
        ib: WebGLBuffer                                 = null;
        instancingAttributes: InstancingAttributeInfo[] = null;
        texture: Texture                                = null;
        effect: Effect                                  = null;
        effectInstanced: Effect                         = null;

        render(instanceInfo: GroupInstanceInfo, context: Render2DContext): boolean {
            // Do nothing if the shader is still loading/preparing 
            if (!this.effectsReady) {
                if ((this.effect && (!this.effect.isReady() || (this.effectInstanced && !this.effectInstanced.isReady())))) {
                    return false;
                }
                this.effectsReady = true;
            }

            // Compute the offset locations of the attributes in the vertex shader that will be mapped to the instance buffer data
            var engine = instanceInfo.owner.owner.engine;

            let effect = context.useInstancing ? this.effectInstanced : this.effect;

            engine.enableEffect(effect);
            effect.setTexture("diffuseSampler", this.texture);
            engine.bindBuffersDirectly(this.vb, this.ib, [1], 4, effect);

            var cur = engine.getAlphaMode();

            if (context.renderMode !== Render2DContext.RenderModeOpaque) {
                engine.setAlphaMode(Engine.ALPHA_COMBINE);
            }

            let pid = context.groupInfoPartData[0];
            if (context.useInstancing) {
                if (!this.instancingAttributes) {
                    this.instancingAttributes = this.loadInstancingAttributes(Sprite2D.SPRITE2D_MAINPARTID, effect);
                }
                engine.updateAndBindInstancesBuffer(pid._partBuffer, null, this.instancingAttributes);
                engine.draw(true, 0, 6, pid._partData.usedElementCount);
                engine.unbindInstanceAttributes();
            } else {
                for (let i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
                    this.setupUniforms(effect, 0, pid._partData, i);
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

            if (this.effectInstanced) {
                this._engine._releaseEffect(this.effectInstanced);
                this.effectInstanced = null;
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

        // 3 floats being:
        // - x: frame number to display
        // - y: invertY setting
        // - z: alignToPixel setting
        @instanceData()
        get properties(): Vector3 {
            return null;
        }
    }

    @className("Sprite2D")
    export class Sprite2D extends RenderablePrim2D {
        static SPRITE2D_MAINPARTID = 1;

        public static textureProperty: Prim2DPropInfo;
        public static actualSizeProperty: Prim2DPropInfo;
        public static spriteLocationProperty: Prim2DPropInfo;
        public static spriteFrameProperty: Prim2DPropInfo;
        public static invertYProperty: Prim2DPropInfo;
        public static alignToPixelProperty: Prim2DPropInfo;

        @modelLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 1, pi => Sprite2D.textureProperty = pi)
        public get texture(): Texture {
            return this._texture;
        }

        public set texture(value: Texture) {
            this._texture = value;
        }

        @instanceLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 2, pi => Sprite2D.actualSizeProperty = pi, false, true)
        public get actualSize(): Size {
            if (this._actualSize) {
                return this._actualSize;
            }
            return this.size;
        }

        public set actualSize(value: Size) {
            this._actualSize = value;
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

        public get alignToPixel(): boolean {
            return this._alignToPixel;
        }

        public set alignToPixel(value: boolean) {
            this._alignToPixel = value;
        }

        protected updateLevelBoundingInfo() {
            BoundingInfo2D.CreateFromSizeToRef(this.size, this._levelBoundingInfo);
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
         *  - alignToPixel: if true the sprite's texels will be aligned to the rendering viewport pixels, ensuring the best rendering quality but slow animations won't be done as smooth as if you set false. If false a texel could lies between two pixels, being blended by the texture sampling mode you choose, the rendering result won't be as good, but very slow animation will be overall better looking. Default is true: content will be aligned.
         *  - isVisible: true if the sprite must be visible, false for hidden. Default is true.
         *  - marginTop/Left/Right/Bottom: define the margin for the corresponding edge, if all of them are null, margin is not used in layout computing. Default Value is null for each.
         *  - hAlighment: define horizontal alignment of the Canvas, alignment is optional, default value null: no alignment.
         *  - vAlighment: define horizontal alignment of the Canvas, alignment is optional, default value null: no alignment.
         */
        constructor(texture: Texture, settings?: {

            parent           ?: Prim2DBase, 
            children         ?: Array<Prim2DBase>,
            id               ?: string,
            position         ?: Vector2,
            x                ?: number,
            y                ?: number,
            origin           ?: Vector2,
            spriteSize       ?: Size,
            spriteLocation   ?: Vector2,
            invertY          ?: boolean,
            alignToPixel     ?: boolean,
            isVisible        ?: boolean,
            marginTop        ?: number | string,
            marginLeft       ?: number | string,
            marginRight      ?: number | string,
            marginBottom     ?: number | string,
            margin           ?: number | string,
            marginHAlignment ?: number,
            marginVAlignment ?: number,
            marginAlignment  ?: string,
            paddingTop       ?: number | string,
            paddingLeft      ?: number | string,
            paddingRight     ?: number | string,
            paddingBottom    ?: number | string,
            padding          ?: string,
            paddingHAlignment?: number,
            paddingVAlignment?: number,
        }) {

            if (!settings) {
                settings = {};
            }

            super(settings);

            this.texture = texture;
            this.texture.wrapU = Texture.CLAMP_ADDRESSMODE;
            this.texture.wrapV = Texture.CLAMP_ADDRESSMODE;
            this.size = settings.spriteSize || null;
            this.spriteLocation = settings.spriteLocation || new Vector2(0, 0);
            this.spriteFrame = 0;
            this.invertY = (settings.invertY == null) ? false : settings.invertY;
            this.alignToPixel = (settings.alignToPixel == null) ? true : settings.alignToPixel;
            this._isTransparent = true;

            if (!this.size) {
                var s = texture.getSize();
                this.size = new Size(s.width, s.height);
            }
        }

        static _createCachedCanvasSprite(owner: Canvas2D, texture: MapTexture, size: Size, pos: Vector2): Sprite2D {

            let sprite = new Sprite2D(texture, { parent: owner, id:"__cachedCanvasSprite__", position: Vector2.Zero(), origin: Vector2.Zero(), spriteSize: size, spriteLocation:pos, alignToPixel: true});
            return sprite;
        }

        protected createModelRenderCache(modelKey: string): ModelRenderCache {
            let renderCache = new Sprite2DRenderCache(this.owner.engine, modelKey);
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

            // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
            let ei = this.getDataPartEffectInfo(Sprite2D.SPRITE2D_MAINPARTID, ["index"], true);
            if (ei) {
                renderCache.effectInstanced = engine.createEffect("sprite2d", ei.attributes, ei.uniforms, ["diffuseSampler"], ei.defines, null);
            }

            ei = this.getDataPartEffectInfo(Sprite2D.SPRITE2D_MAINPARTID, ["index"], false);
            renderCache.effect = engine.createEffect("sprite2d", ei.attributes, ei.uniforms, ["diffuseSampler"], ei.defines, null);

            return renderCache;
        }

        protected createInstanceDataParts(): InstanceDataBase[] {
            return [new Sprite2DInstanceData(Sprite2D.SPRITE2D_MAINPARTID)];
        }

        private static _prop: Vector3 = Vector3.Zero();

        protected refreshInstanceDataPart(part: InstanceDataBase): boolean {
            if (!super.refreshInstanceDataPart(part)) {
                return false;
            }

            if (part.id === Sprite2D.SPRITE2D_MAINPARTID) {
                let d = <Sprite2DInstanceData>this._instanceDataParts[0];
                let ts = this.texture.getBaseSize();
                let sl = this.spriteLocation;
                let ss = this.actualSize;
                d.topLeftUV = new Vector2(sl.x / ts.width, sl.y / ts.height);
                let suv = new Vector2(ss.width / ts.width, ss.height / ts.height);
                d.sizeUV = suv;

                Sprite2D._prop.x = this.spriteFrame;
                Sprite2D._prop.y = this.invertY ? 1 : 0;
                Sprite2D._prop.z = this.alignToPixel ? 1 : 0;
                d.properties = Sprite2D._prop;

                d.textureSize = new Vector2(ts.width, ts.height);
            }
            return true;
        }

        private _texture: Texture;
        private _location: Vector2;
        private _spriteFrame: number;
        private _invertY: boolean;
        private _alignToPixel: boolean;
    }


}