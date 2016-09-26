module BABYLON {
    export class Sprite2DRenderCache extends ModelRenderCache {
        effectsReady: boolean = false;
        vb: WebGLBuffer = null;
        ib: WebGLBuffer = null;
        instancingAttributes: InstancingAttributeInfo[] = null;
        texture: Texture = null;
        effect: Effect = null;
        effectInstanced: Effect = null;

        render(instanceInfo: GroupInstanceInfo, context: Render2DContext): boolean {
            // Do nothing if the shader is still loading/preparing 
            if (!this.effectsReady) {
                if ((this.effect && (!this.effect.isReady() || (this.effectInstanced && !this.effectInstanced.isReady())))) {
                    return false;
                }
                this.effectsReady = true;
            }

            // Compute the offset locations of the attributes in the vertex shader that will be mapped to the instance buffer data
            let canvas = instanceInfo.owner.owner;
            var engine = canvas.engine;

            var cur = engine.getAlphaMode();
            let effect = context.useInstancing ? this.effectInstanced : this.effect;

            engine.enableEffect(effect);
            effect.setTexture("diffuseSampler", this.texture);
            engine.bindBuffersDirectly(this.vb, this.ib, [1], 4, effect);

            if (context.renderMode !== Render2DContext.RenderModeOpaque) {
                engine.setAlphaMode(Engine.ALPHA_COMBINE, true);
            }

            effect.setBool("alphaTest", context.renderMode === Render2DContext.RenderModeAlphaTest);

            let pid = context.groupInfoPartData[0];
            if (context.useInstancing) {
                if (!this.instancingAttributes) {
                    this.instancingAttributes = this.loadInstancingAttributes(Sprite2D.SPRITE2D_MAINPARTID, effect);
                }
                let glBuffer = context.instancedBuffers ? context.instancedBuffers[0] : pid._partBuffer;
                let count = context.instancedBuffers ? context.instancesCount : pid._partData.usedElementCount;
                canvas._addDrawCallCount(1, context.renderMode);
                engine.updateAndBindInstancesBuffer(glBuffer, null, this.instancingAttributes);
                engine.draw(true, 0, 6, count);
                engine.unbindInstanceAttributes();
            } else {
                canvas._addDrawCallCount(context.partDataEndIndex - context.partDataStartIndex, context.renderMode);
                for (let i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
                    this.setupUniforms(effect, 0, pid._partData, i);
                    engine.draw(true, 0, 6);
                }
            }

            engine.setAlphaMode(cur, true);

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

            //if (this.texture) {
            //    this.texture.dispose();
            //    this.texture = null;
            //}

            this.effect = null;
            this.effectInstanced = null;

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
        get scaleFactor(): Vector2 {
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

    @className("Sprite2D", "BABYLON")
    /**
     * Primitive that displays a Sprite/Picture
     */
    export class Sprite2D extends RenderablePrim2D {
        static SPRITE2D_MAINPARTID = 1;

        public static textureProperty: Prim2DPropInfo;
        public static useAlphaFromTextureProperty: Prim2DPropInfo;
        public static actualSizeProperty: Prim2DPropInfo;
        public static spriteLocationProperty: Prim2DPropInfo;
        public static spriteFrameProperty: Prim2DPropInfo;
        public static invertYProperty: Prim2DPropInfo;
        public static spriteScaleFactorProperty: Prim2DPropInfo;

        @modelLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 1, pi => Sprite2D.textureProperty = pi)
        /**
         * Get/set the texture that contains the sprite to display
         */
        public get texture(): Texture {
            return this._texture;
        }

        public set texture(value: Texture) {
            this._texture = value;
            this._oldTextureHasAlpha = this._texture && this.texture.hasAlpha;
        }

        @dynamicLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 2, pi => Sprite2D.useAlphaFromTextureProperty = pi)
        /**
         * If true and the texture has an Alpha Channel which is used (BaseTexture.hasAlpha = true) the Sprite2d will be rendered as a Transparent Primitive, if false and the texture has an Alpha Channel which is used (BaseTexture.hasAlpha = true) the Sprite2d will be rendered as Alpha Test. If false or if the Texture has no alpha or it's not used (BaseTexture.hasAlpha = false) the Sprite2d will be rendered as an Opaque Primitive
         */
        public get useAlphaFromTexture(): boolean {
            return this._useAlphaFromTexture;
        }

        public set useAlphaFromTexture(value: boolean) {
            if (this._useAlphaFromTexture === value) {
                return;
            }
            this._useAlphaFromTexture = value;
            this._updateRenderMode();
        }

        @instanceLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 3, pi => Sprite2D.actualSizeProperty = pi, false, true)
        /**
         * Get/set the actual size of the sprite to display
         */
        public get actualSize(): Size {
            if (this._actualSize) {
                return this._actualSize;
            }
            return this.size;
        }

        public set actualSize(value: Size) {
            this._actualSize = value;
        }

        @instanceLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 4, pi => Sprite2D.spriteLocationProperty = pi)
        /**
         * Get/set the sprite location (in pixels) in the texture
         */
        public get spriteLocation(): Vector2 {
            return this._location;
        }

        public set spriteLocation(value: Vector2) {
            this._location = value;
        }

        @instanceLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 5, pi => Sprite2D.spriteFrameProperty = pi)
        /**
         * Get/set the sprite frame to display.
         * The frame number is just an offset applied horizontally, based on the sprite's width. it does not wrap, all the frames must be on the same line.
         */
        public get spriteFrame(): number {
            return this._spriteFrame;
        }

        public set spriteFrame(value: number) {
            this._spriteFrame = value;
        }

        @instanceLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 6, pi => Sprite2D.invertYProperty = pi)
        /**
         * Get/set if the sprite texture coordinates should be inverted on the Y axis
         */
        public get invertY(): boolean {
            return this._invertY;
        }

        public set invertY(value: boolean) {
            this._invertY = value;
        }

        @instanceLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 7, pi => Sprite2D.spriteScaleFactorProperty = pi)
        /**
         * Get/set the sprite location (in pixels) in the texture
         */
        public get spriteScaleFactor(): Vector2 {
            return this._spriteScaleFactor;
        }

        public set spriteScaleFactor(value: Vector2) {
            this._spriteScaleFactor = value;
        }

        /**
         * Sets the scale of the sprite using a BABYLON.Size(w,h).
         * Keeps proportion by taking the maximum of the two scale for x and y.
         * @param {Size} size Size(width,height)
         */
        public scaleToSize(size: Size) {
            var baseSize = this.size;
            if (baseSize == null || !this.texture.isReady()) {
                // we're probably at initiation of the scene, size is not set
                if (this.texture.isReady()) {
                    baseSize = <Size>this.texture.getBaseSize();
                }
                else {
                    // the texture is not ready, wait for it to load before calling scaleToSize again
                    var thisObject = <Sprite2D>this;
                    this.texture.onLoadObservable.add(function () {
                            thisObject.scaleToSize(size); 
                        });
                    return;
                }
            }
            
            this.scale = Math.max(size.height / baseSize.height, size.width / baseSize.width);
        }

        /**
         * Get/set if the sprite rendering should be aligned to the target rendering device pixel or not
         */
        public get alignToPixel(): boolean {
            return this._alignToPixel;
        }

        public set alignToPixel(value: boolean) {
            this._alignToPixel = value;
        }

        protected updateLevelBoundingInfo() {
            BoundingInfo2D.CreateFromSizeToRef(this.size, this._levelBoundingInfo);
        }

        /**
         * Get the animatable array (see http://doc.babylonjs.com/tutorials/Animations)
         */
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
         * @param texture the texture that stores the sprite to render
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1. You can alternatively use scaleX &| scaleY to apply non uniform scale
         * - dontInheritParentScale: if set the parent's scale won't be taken into consideration to compute the actualScale property
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - spriteSize: the size of the sprite (in pixels), if null the size of the given texture will be used, default is null.
         * - spriteLocation: the location (in pixels) in the texture of the top/left corner of the Sprite to display, default is null (0,0)
         * - spriteScaleFactor: say you want to display a sprite twice as big as its bitmap which is 64,64, you set the spriteSize to 128,128 and have to set the spriteScaleFactory to 0.5,0.5 in order to address only the 64,64 pixels of the bitmaps. Default is 1,1.
         * - invertY: if true the texture Y will be inverted, default is false.
         * - alignToPixel: if true the sprite's texels will be aligned to the rendering viewport pixels, ensuring the best rendering quality but slow animations won't be done as smooth as if you set false. If false a texel could lies between two pixels, being blended by the texture sampling mode you choose, the rendering result won't be as good, but very slow animation will be overall better looking. Default is true: content will be aligned.
         * - isVisible: true if the sprite must be visible, false for hidden. Default is true.
         * - isPickable: if true the Primitive can be used with interaction mode and will issue Pointer Event. If false it will be ignored for interaction/intersection test. Default value is true.
         * - isContainer: if true the Primitive acts as a container for interaction, if the primitive is not pickable or doesn't intersection, no further test will be perform on its children. If set to false, children will always be considered for intersection/interaction. Default value is true.
         * - childrenFlatZOrder: if true all the children (direct and indirect) will share the same Z-Order. Use this when there's a lot of children which don't overlap. The drawing order IS NOT GUARANTED!
         * - marginTop: top margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginLeft: left margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginRight: right margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginBottom: bottom margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - margin: top, left, right and bottom margin formatted as a single string (see PrimitiveThickness.fromString)
         * - marginHAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginVAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginAlignment: a string defining the alignment, see PrimitiveAlignment.fromString
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see PrimitiveThickness.fromString)
         */
        constructor(texture: Texture, settings?: {

            parent                ?: Prim2DBase,
            children              ?: Array<Prim2DBase>,
            id                    ?: string,
            position              ?: Vector2,
            x                     ?: number,
            y                     ?: number,
            rotation              ?: number,
            scale                 ?: number,
            scaleX                ?: number,
            scaleY                ?: number,
            dontInheritParentScale?: boolean,
            opacity               ?: number,
            zOrder                ?: number, 
            origin                ?: Vector2,
            spriteSize            ?: Size,
            spriteLocation        ?: Vector2,
            spriteScaleFactor     ?: Vector2,
            invertY               ?: boolean,
            alignToPixel          ?: boolean,
            isVisible             ?: boolean,
            isPickable            ?: boolean,
            isContainer           ?: boolean,
            childrenFlatZOrder    ?: boolean,
            marginTop             ?: number | string,
            marginLeft            ?: number | string,
            marginRight           ?: number | string,
            marginBottom          ?: number | string,
            margin                ?: number | string,
            marginHAlignment      ?: number,
            marginVAlignment      ?: number,
            marginAlignment       ?: string,
            paddingTop            ?: number | string,
            paddingLeft           ?: number | string,
            paddingRight          ?: number | string,
            paddingBottom         ?: number | string,
            padding               ?: string,
        }) {

            if (!settings) {
                settings = {};
            }

            super(settings);

            this.texture = texture;
            this.texture.wrapU = Texture.CLAMP_ADDRESSMODE;
            this.texture.wrapV = Texture.CLAMP_ADDRESSMODE;
            this.size = settings.spriteSize;
            this.spriteLocation = settings.spriteLocation || new Vector2(0, 0);
            this.spriteScaleFactor = settings.spriteScaleFactor || new Vector2(1, 1);
            this.spriteFrame = 0;
            this.invertY = (settings.invertY == null) ? false : settings.invertY;
            this.alignToPixel = (settings.alignToPixel == null) ? true : settings.alignToPixel;
            this.useAlphaFromTexture = true;

            if (settings.spriteSize == null || !texture.isReady()) {
                if (texture.isReady()) {
                    this.size = <Size>texture.getBaseSize();
                } else {
                    texture.onLoadObservable.add(() => {
                        if (settings.spriteSize == null) {
                            this.size = <Size>texture.getBaseSize();
                        }
                        this._positioningDirty();
                        this._instanceDirtyFlags |= Prim2DBase.originProperty.flagId | Sprite2D.textureProperty.flagId;  // To make sure the sprite is issued again for render
                    });
                }
            }
        }

        static _createCachedCanvasSprite(owner: Canvas2D, texture: MapTexture, size: Size, pos: Vector2): Sprite2D {

            let sprite = new Sprite2D(texture, { parent: owner, id: "__cachedCanvasSprite__", position: Vector2.Zero(), origin: Vector2.Zero(), spriteSize: size, spriteLocation: pos, alignToPixel: true });
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
            let ei = this.getDataPartEffectInfo(Sprite2D.SPRITE2D_MAINPARTID, ["index"], ["alphaTest"], true);
            if (ei) {
                renderCache.effectInstanced = engine.createEffect("sprite2d", ei.attributes, ei.uniforms, ["diffuseSampler"], ei.defines, null);
            }

            ei = this.getDataPartEffectInfo(Sprite2D.SPRITE2D_MAINPARTID, ["index"], ["alphaTest"], false);
            renderCache.effect = engine.createEffect("sprite2d", ei.attributes, ei.uniforms, ["diffuseSampler"], ei.defines, null);

            return renderCache;
        }

        protected createInstanceDataParts(): InstanceDataBase[] {
            return [new Sprite2DInstanceData(Sprite2D.SPRITE2D_MAINPARTID)];
        }

        private static _prop: Vector3 = Vector3.Zero();

        private static layoutConstructMode = false;
        protected beforeRefreshForLayoutConstruction(part: InstanceDataBase): any {
            Sprite2D.layoutConstructMode = true;
        }

        // if obj contains something, we restore the _text property
        protected afterRefreshForLayoutConstruction(part: InstanceDataBase, obj: any) {
            Sprite2D.layoutConstructMode = false;
        }

        protected refreshInstanceDataPart(part: InstanceDataBase): boolean {
            if (!super.refreshInstanceDataPart(part)) {
                return false;
            }

            if (!this.texture.isReady() && !Sprite2D.layoutConstructMode) {
                return false;
            }

            if (part.id === Sprite2D.SPRITE2D_MAINPARTID) {
                let d = <Sprite2DInstanceData>this._instanceDataParts[0];

                if (Sprite2D.layoutConstructMode) {
                    d.topLeftUV = Vector2.Zero();
                    d.sizeUV = Vector2.Zero();
                    d.properties = Vector3.Zero();
                    d.textureSize = Vector2.Zero();
                    d.scaleFactor = Vector2.Zero();
                } else {
                    let ts = this.texture.getBaseSize();
                    let sl = this.spriteLocation;
                    let ss = this.actualSize;
                    let ssf = this.spriteScaleFactor;
                    d.topLeftUV = new Vector2(sl.x / ts.width, sl.y / ts.height);
                    let suv = new Vector2(ss.width / ts.width, ss.height / ts.height);
                    d.sizeUV = suv;
                    d.scaleFactor = ssf;

                    Sprite2D._prop.x = this.spriteFrame;
                    Sprite2D._prop.y = this.invertY ? 1 : 0;
                    Sprite2D._prop.z = this.alignToPixel ? 1 : 0;
                    d.properties = Sprite2D._prop;

                    d.textureSize = new Vector2(ts.width, ts.height);
                }
            }
            return true;
        }

        protected _mustUpdateInstance(): boolean {
            let res = this._oldTextureHasAlpha !== (this.texture != null && this.texture.hasAlpha);
            this._oldTextureHasAlpha = this.texture != null && this.texture.hasAlpha;
            if (res) {
                this._updateRenderMode();
            }
            return res;
        }

        protected _useTextureAlpha(): boolean {
            return this.texture!=null && this.texture.hasAlpha;
        }

        protected _shouldUseAlphaFromTexture(): boolean {
            return this.texture!=null && this.texture.hasAlpha && this.useAlphaFromTexture;
        }

        private _texture: Texture;
        private _oldTextureHasAlpha: boolean;
        private _useAlphaFromTexture: boolean;
        private _location: Vector2;
        private _spriteScaleFactor: Vector2;
        private _spriteFrame: number;
        private _invertY: boolean;
        private _alignToPixel: boolean;
    }
}