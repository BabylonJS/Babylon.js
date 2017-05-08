﻿module BABYLON {
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

    @className("Sprite2D", "BABYLON")
    /**
     * Primitive that displays a Sprite/Picture
     */
    export class Sprite2D extends RenderablePrim2D {
        static SPRITE2D_MAINPARTID = 1;

        static SHAPE2D_CATEGORY_SCALE9 = "Scale9";

        public static textureProperty: Prim2DPropInfo;
        public static useAlphaFromTextureProperty: Prim2DPropInfo;
        public static actualSizeProperty: Prim2DPropInfo;
        public static spriteSizeProperty: Prim2DPropInfo;
        public static spriteLocationProperty: Prim2DPropInfo;
        public static spriteFrameProperty: Prim2DPropInfo;
        public static invertYProperty: Prim2DPropInfo;
        public static spriteScale9Property: Prim2DPropInfo;

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

        public get size(): Size {
            if (this._size == null) {
                return this.spriteSize;
            }
            return this.internalGetSize();
        }

        public set size(value: Size) {
            this._useSize = value != null;
            this.internalSetSize(value);
            this._updateSpriteScaleFactor();
        }


        @instanceLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 4, pi => Sprite2D.spriteSizeProperty = pi, false, true)
        /**
         * Get/set the sprite location (in pixels) in the texture
         */
        public get spriteSize(): Size {
            return this._spriteSize;
        }

        public set spriteSize(value: Size) {
            if (!this._spriteSize) {
                this._spriteSize = value.clone();
            } else {
                this._spriteSize.copyFrom(value);
            }
            this._updateSpriteScaleFactor();
        }

        @instanceLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 5, pi => Sprite2D.spriteLocationProperty = pi)
        /**
         * Get/set the sprite location (in pixels) in the texture
         */
        public get spriteLocation(): Vector2 {
            return this._spriteLocation;
        }

        public set spriteLocation(value: Vector2) {
            if (!this._spriteLocation) {
                this._spriteLocation = value.clone();
            } else {
                this._spriteLocation.copyFrom(value);
            }
        }

        @instanceLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 6, pi => Sprite2D.spriteFrameProperty = pi)
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

        @instanceLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 7, pi => Sprite2D.invertYProperty = pi)
        /**
         * Get/set if the sprite texture coordinates should be inverted on the Y axis
         */
        public get invertY(): boolean {
            return this._invertY;
        }

        public set invertY(value: boolean) {
            this._invertY = value;
        }

        @modelLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 8, pi => Sprite2D.spriteScale9Property = pi)
        /**
         * Get/set the texture that contains the sprite to display
         */
        public get isScale9(): boolean {
            return this._scale9!==null;
        }

        //@instanceLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 7, pi => Sprite2D.spriteScaleFactorProperty = pi)
        ///**
        // * Get/set the sprite location (in pixels) in the texture
        // */
        //public get spriteScaleFactor(): Vector2 {
        //    return this._spriteScaleFactor;
        //}

        //public set spriteScaleFactor(value: Vector2) {
        //    this._spriteScaleFactor = value;
        //}

        protected updateLevelBoundingInfo(): boolean {
            BoundingInfo2D.CreateFromSizeToRef(this.size, this._levelBoundingInfo);
            return true;
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

        public get isSizeAuto(): boolean {
            return this.size == null;
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
         * - size: the size of the sprite displayed in the canvas, if not specified the spriteSize will be used
         * - dontInheritParentScale: if set the parent's scale won't be taken into consideration to compute the actualScale property
         * - alignToPixel: if true the sprite's texels will be aligned to the rendering viewport pixels, ensuring the best rendering quality but slow animations won't be done as smooth as if you set false. If false a texel could lies between two pixels, being blended by the texture sampling mode you choose, the rendering result won't be as good, but very slow animation will be overall better looking. Default is true: content will be aligned.
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - spriteSize: the size of the sprite (in pixels) as it is stored in the texture, if null the size of the given texture will be used, default is null.
         * - spriteLocation: the location (in pixels) in the texture of the top/left corner of the Sprite to display, default is null (0,0)
         * - scale9: draw the sprite as a Scale9 sprite, see http://yannickloriot.com/2013/03/9-patch-technique-in-cocos2d/ for more info. x, y, w, z are left, bottom, right, top coordinate of the resizable box
         * - invertY: if true the texture Y will be inverted, default is false.
         * - isVisible: true if the sprite must be visible, false for hidden. Default is true.
         * - isPickable: if true the Primitive can be used with interaction mode and will issue Pointer Event. If false it will be ignored for interaction/intersection test. Default value is true.
         * - isContainer: if true the Primitive acts as a container for interaction, if the primitive is not pickable or doesn't intersection, no further test will be perform on its children. If set to false, children will always be considered for intersection/interaction. Default value is true.
         * - childrenFlatZOrder: if true all the children (direct and indirect) will share the same Z-Order. Use this when there's a lot of children which don't overlap. The drawing order IS NOT GUARANTED!
         * - levelCollision: this primitive is an actor of the Collision Manager and only this level will be used for collision (i.e. not the children). Use deepCollision if you want collision detection on the primitives and its children.
         * - deepCollision: this primitive is an actor of the Collision Manager, this level AND ALSO its children will be used for collision (note: you don't need to set the children as level/deepCollision).
         * - layoutData: a instance of a class implementing the ILayoutData interface that contain data to pass to the primitive parent's layout engine
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
            size                  ?: Size,
            scale                 ?: number,
            scaleX                ?: number,
            scaleY                ?: number,
            dontInheritParentScale?: boolean,
            alignToPixel          ?: boolean,
            opacity               ?: number,
            zOrder                ?: number, 
            origin                ?: Vector2,
            spriteSize            ?: Size,
            spriteLocation        ?: Vector2,
            spriteScaleFactor     ?: Vector2,
            scale9                ?: Vector4,
            invertY               ?: boolean,
            isVisible             ?: boolean,
            isPickable            ?: boolean,
            isContainer           ?: boolean,
            childrenFlatZOrder    ?: boolean,
            levelCollision        ?: boolean,
            deepCollision         ?: boolean,
            layoutData            ?: ILayoutData,
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
            padding               ?: number | string,
        }) {

            if (!settings) {
                settings = {};
            }

            super(settings);

            this.texture = texture;
            // This is removed to let the user the possibility to setup the addressing mode he wants
            //this.texture.wrapU = Texture.CLAMP_ADDRESSMODE;
            //this.texture.wrapV = Texture.CLAMP_ADDRESSMODE;
            this._useSize = false;
            this._spriteSize = (settings.spriteSize!=null) ? settings.spriteSize.clone() : null;
            this._spriteLocation = (settings.spriteLocation!=null) ? settings.spriteLocation.clone() : new Vector2(0, 0);
            if (settings.size != null) {
                this.size = settings.size;
            }
            this._updatePositioningState();
            this.spriteFrame = 0;
            this.invertY = (settings.invertY == null) ? false : settings.invertY;
            this.alignToPixel = (settings.alignToPixel == null) ? true : settings.alignToPixel;
            this.useAlphaFromTexture = true;
            this._scale9 = (settings.scale9 != null) ? settings.scale9.clone() : null;

            // If the user doesn't set a size, we'll use the texture's one, but if the texture is not loading, we HAVE to set a temporary dummy size otherwise the positioning engine will switch the marginAlignement to stretch/stretch, and WE DON'T WANT THAT.
            // The fucking delayed texture sprite bug is fixed!
            if (settings.spriteSize == null) {
                this.spriteSize = new Size(10, 10);
            }

            if (settings.spriteSize == null || !texture.isReady()) {
                if (texture.isReady()) {
                    let s = texture.getBaseSize();
                    this.spriteSize = new Size(s.width, s.height);
                    this._updateSpriteScaleFactor();
                } else {

                    texture.onLoadObservable.add(() => {
                        if (settings.spriteSize == null) {
                            let s = texture.getBaseSize();
                            this.spriteSize = new Size(s.width, s.height);
                        }
                        this._updateSpriteScaleFactor();
                        this._positioningDirty();
                        this._setLayoutDirty();
                        this._instanceDirtyFlags |= Prim2DBase.originProperty.flagId | Sprite2D.textureProperty.flagId;  // To make sure the sprite is issued again for render
                    });
                }
            }
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

        protected getUsedShaderCategories(dataPart: InstanceDataBase): string[] {
            var cat = super.getUsedShaderCategories(dataPart);

            if (dataPart.id === Sprite2D.SPRITE2D_MAINPARTID) {
                let useScale9 = this._scale9 != null;
                if (useScale9) {
                    cat.push(Sprite2D.SHAPE2D_CATEGORY_SCALE9);
                }
            }
            return cat;
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
                    if (this.isScale9) {
                        d.scale9 = Vector4.Zero();
                    }
                } else {
                    let ts = this.texture.getBaseSize();
                    let ss = this.spriteSize;
                    let sl = this.spriteLocation;
                    let ssf = this.actualScale;
                    d.topLeftUV = new Vector2(sl.x / ts.width, sl.y / ts.height);
                    let suv = new Vector2(ss.width / ts.width, ss.height / ts.height);
                    d.sizeUV = suv;
                    d.scaleFactor = ssf;

                    Sprite2D._prop.x = this.spriteFrame;
                    Sprite2D._prop.y = this.invertY ? 1 : 0;
                    Sprite2D._prop.z = this.alignToPixel ? 1 : 0;
                    d.properties = Sprite2D._prop;

                    d.textureSize = new Vector2(ts.width, ts.height);

                    let scale9 = this._scale9;
                    if (scale9 != null) {
                        let normalizedScale9 = new Vector4(scale9.x * suv.x / ss.width, scale9.y * suv.y / ss.height, scale9.z * suv.x / ss.width, scale9.w * suv.y / ss.height);
                        d.scale9 = normalizedScale9;
                    }
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

        private _updateSpriteScaleFactor() {
            if (!this._useSize) {
                return;
            }

            let sS = this.spriteSize;
            let s = this.size;
            if (s == null || sS == null) {
                return;
            }
            this._postScale.x = s.width / sS.width;
            this._postScale.y = s.height / sS.height;
        }

        private _texture: Texture;
        private _oldTextureHasAlpha: boolean;
        private _useAlphaFromTexture: boolean;
        private _useSize: boolean;
        private _spriteLocation: Vector2;
        private _spriteSize: Size;
        private _spriteFrame: number;
        private _scale9: Vector4;
        private _invertY: boolean;
    }

    export class Sprite2DInstanceData extends InstanceDataBase {
        constructor(partId: number) {
            super(partId, 1);
        }

        @instanceData()
        get topLeftUV(): Vector2 {
            return null;
        }
        set topLeftUV(value: Vector2) {
        }

        @instanceData()
        get sizeUV(): Vector2 {
            return null;
        }
        set sizeUV(value: Vector2) {
        }

        @instanceData(Sprite2D.SHAPE2D_CATEGORY_SCALE9)
        get scaleFactor(): Vector2 {
            return null;
        }
        set scaleFactor(value: Vector2) {
        }

        @instanceData()
        get textureSize(): Vector2 {
            return null;
        }
        set textureSize(value: Vector2) {
        }

        // 3 floats being:
        // - x: frame number to display
        // - y: invertY setting
        // - z: alignToPixel setting
        @instanceData()
        get properties(): Vector3 {
            return null;
        }
        set properties(value: Vector3) {
        }

        @instanceData(Sprite2D.SHAPE2D_CATEGORY_SCALE9)
        get scale9(): Vector4 {
            return null;
        }
        set scale9(value: Vector4) {
        }
    }
}