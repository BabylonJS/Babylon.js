module BABYLON {
    export class Text2DRenderCache extends ModelRenderCache {
        effectsReady: boolean                           = false;
        vb: WebGLBuffer                                 = null;
        ib: WebGLBuffer                                 = null;
        instancingAttributes: InstancingAttributeInfo[] = null;
        fontTexture: FontTexture                        = null;
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
            let canvas = instanceInfo.owner.owner;
            var engine = canvas.engine;

            this.fontTexture.update();

            let effect = context.useInstancing ? this.effectInstanced : this.effect;

            engine.enableEffect(effect);
            effect.setTexture("diffuseSampler", this.fontTexture);
            engine.bindBuffersDirectly(this.vb, this.ib, [1], 4, effect);

            var curAlphaMode = engine.getAlphaMode();

            engine.setAlphaMode(Engine.ALPHA_COMBINE, true);

            let pid = context.groupInfoPartData[0];
            if (context.useInstancing) {
                if (!this.instancingAttributes) {
                    this.instancingAttributes = this.loadInstancingAttributes(Text2D.TEXT2D_MAINPARTID, effect);
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

            engine.setAlphaMode(curAlphaMode, true);

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

            if (this.fontTexture) {
                this.fontTexture.decCachedFontTextureCounter();
                this.fontTexture = null;
            }

            this.effect = null;
            this.effectInstanced = null;

            return true;
        }

    }

    export class Text2DInstanceData extends InstanceDataBase {
        constructor(partId: number, dataElementCount: number) {
            super(partId, dataElementCount);
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
        get color(): Color4 {
            return null;
        }

        @instanceData()
        get superSampleFactor(): number {
            return null;
        }
    }

    @className("Text2D")
    /**
     * Primitive that render text using a specific font
     */
    export class Text2D extends RenderablePrim2D {
        static TEXT2D_MAINPARTID = 1;

        public static fontProperty: Prim2DPropInfo;
        public static defaultFontColorProperty: Prim2DPropInfo;
        public static textProperty: Prim2DPropInfo;
        public static sizeProperty: Prim2DPropInfo;

        @modelLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 1, pi => Text2D.fontProperty = pi, false, true)
        /**
         * Get/set the font name to use, using HTML CSS notation.
         * Set is not supported right now.
         */
        public get fontName(): string {
            return this._fontName;
        }

        public set fontName(value: string) {
            if (this._fontName) {
                throw new Error("Font Name change is not supported right now.");
            }
            this._fontName = value;
        }

        @dynamicLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 2, pi => Text2D.defaultFontColorProperty = pi)
        /**
         * Get/set the font default color
         */
        public get defaultFontColor(): Color4 {
            return this._defaultFontColor;
        }

        public set defaultFontColor(value: Color4) {
            this._defaultFontColor = value;
        }

        @instanceLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 3, pi => Text2D.textProperty = pi, false, true)
        /**
         * Get/set the text to render.
         * \n \t character are supported. 
         */
        public get text(): string {
            return this._text;
        }

        public set text(value: string) {
            this._text = value;
            this._textSize = null;    // A change of text will reset the TextSize which will be recomputed next time it's used
            this._size = null;
            this._updateCharCount();

            // Trigger a textSize to for a sizeChange if necessary, which is needed for layout to recompute
            let s = this.textSize;
        }

        @instanceLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 4, pi => Text2D.sizeProperty = pi)
        /**
         * Get/set the size of the area where the text is drawn.
         * You should not set this size, the default behavior compute the size based on the actual text.
         */
        public get size(): Size {
            if (this._size != null) {
                return this._size;
            }
            return this.textSize;
        }

        public set size(value: Size) {
            this._size = value;
        }

        /**
         * Get the actual size of the Text2D primitive
         */
        public get actualSize(): Size {
            if (this._actualSize) {
                return this._actualSize;
            }
            return this.size;
        }

        /**
         * Get the area that bounds the text associated to the primitive
         */
        public get textSize(): Size {
            if (!this._textSize) {
                if (this.owner) {
                    let newSize = this.fontTexture.measureText(this._text, this._tabulationSize);
                    if (!newSize.equals(this._textSize)) {
                        this.onPrimitivePropertyDirty(Prim2DBase.sizeProperty.flagId);
                        this._positioningDirty();
                    }
                    this._textSize = newSize;
                } else {
                    return Text2D.nullSize;
                }
            }
            
            return this._textSize;
        }

        protected get fontTexture(): FontTexture {
            if (this._fontTexture) {
                return this._fontTexture;
            }

            if (this.fontName == null || this.owner == null || this.owner.scene == null) {
                return null;
            }

            this._fontTexture = FontTexture.GetCachedFontTexture(this.owner.scene, this.fontName, this._fontSuperSample);
            return this._fontTexture;
        }

        /**
         * Dispose the primitive, remove it from its parent
         */
        public dispose(): boolean {
            if (!super.dispose()) {
                return false;
            }

            if (this._fontTexture) {
                FontTexture.ReleaseCachedFontTexture(this.owner.scene, this.fontName, this._fontSuperSample);
                this._fontTexture = null;
            }

            return true;
        }

        protected updateLevelBoundingInfo() {
            BoundingInfo2D.CreateFromSizeToRef(this.actualSize, this._levelBoundingInfo);
        }

        /**
         * Create a Text primitive
         * @param text the text to display
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1. You can alternatively use scaleX &| scaleY to apply non uniform scale
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - fontName: the name/size/style of the font to use, following the CSS notation. Default is "12pt Arial".
         * - fontSuperSample: if true the text will be rendered with a superSampled font (the font is twice the given size). Use this settings if the text lies in world space or if it's scaled in.
         * - defaultColor: the color by default to apply on each letter of the text to display, default is plain white.
         * - areaSize: the size of the area in which to display the text, default is auto-fit from text content.
         * - tabulationSize: number of space character to insert when a tabulation is encountered, default is 4
         * - isVisible: true if the text must be visible, false for hidden. Default is true.
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
        constructor(text: string, settings?: {

            parent            ?: Prim2DBase, 
            children          ?: Array<Prim2DBase>,
            id                ?: string,
            position          ?: Vector2,
            x                 ?: number,
            y                 ?: number,
            rotation          ?: number,
            scale             ?: number,
            scaleX            ?: number,
            scaleY            ?: number,
            opacity           ?: number,
            zOrder            ?: number, 
            origin            ?: Vector2,
            fontName          ?: string,
            fontSuperSample   ?: boolean,
            defaultFontColor  ?: Color4,
            size              ?: Size,
            tabulationSize    ?: number,
            isVisible         ?: boolean,
            childrenFlatZOrder?: boolean,
            marginTop         ?: number | string,
            marginLeft        ?: number | string,
            marginRight       ?: number | string,
            marginBottom      ?: number | string,
            margin            ?: number | string,
            marginHAlignment  ?: number,
            marginVAlignment  ?: number,
            marginAlignment   ?: string,
            paddingTop        ?: number | string,
            paddingLeft       ?: number | string,
            paddingRight      ?: number | string,
            paddingBottom     ?: number | string,
            padding           ?: string,
        }) {

            if (!settings) {
                settings = {};
            }

            super(settings);

            this.fontName            = (settings.fontName==null) ? "12pt Arial" : settings.fontName;
            this._fontSuperSample    = (settings.fontSuperSample!=null && settings.fontSuperSample);
            this.defaultFontColor    = (settings.defaultFontColor==null) ? new Color4(1,1,1,1) : settings.defaultFontColor;
            this._tabulationSize     = (settings.tabulationSize == null) ? 4 : settings.tabulationSize;
            this._textSize           = null;
            this.text                = text;
            this.size                = (settings.size==null) ? null : settings.size;

            this._updateRenderMode();
        }

        protected levelIntersect(intersectInfo: IntersectInfo2D): boolean {
            // For now I can't do something better that boundingInfo is a hit, detecting an intersection on a particular letter would be possible, but do we really need it? Not for now...
            return true;
        }

        protected createModelRenderCache(modelKey: string): ModelRenderCache {
            let renderCache = new Text2DRenderCache(this.owner.engine, modelKey);
            return renderCache;
        }

        protected setupModelRenderCache(modelRenderCache: ModelRenderCache) {
            let renderCache = <Text2DRenderCache>modelRenderCache;
            let engine = this.owner.engine;

            renderCache.fontTexture = this.fontTexture;
            renderCache.fontTexture.incCachedFontTextureCounter();

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

            // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
            let ei = this.getDataPartEffectInfo(Text2D.TEXT2D_MAINPARTID, ["index"], null, true);
            if (ei) {
                renderCache.effectInstanced = engine.createEffect("text2d", ei.attributes, ei.uniforms, ["diffuseSampler"], ei.defines, null);
            }

            ei = this.getDataPartEffectInfo(Text2D.TEXT2D_MAINPARTID, ["index"], null, false);
            renderCache.effect = engine.createEffect("text2d", ei.attributes, ei.uniforms, ["diffuseSampler"], ei.defines, null);

            return renderCache;
        }

        protected createInstanceDataParts(): InstanceDataBase[] {
            return [new Text2DInstanceData(Text2D.TEXT2D_MAINPARTID, this._charCount)];
        }

        // Looks like a hack!? Yes! Because that's what it is!
        // For the InstanceData layer to compute correctly we need to set all the properties involved, which won't be the case if there's no text
        // This method is called before the layout construction for us to detect this case, set some text and return the initial one to restore it after (there can be some text without char to display, say "\t\n" for instance)
        protected beforeRefreshForLayoutConstruction(part: InstanceDataBase): any {
            if (!this._charCount) {
                let curText = this._text;
                this.text = "A";
                return curText;
            }
        }

        // if obj contains something, we restore the _text property
        protected afterRefreshForLayoutConstruction(part: InstanceDataBase, obj: any) {
            if (obj !== undefined) {
                this.text = obj;
            }
        }

        protected refreshInstanceDataPart(part: InstanceDataBase): boolean {
            if (!super.refreshInstanceDataPart(part)) {
                return false;
            }

            if (part.id === Text2D.TEXT2D_MAINPARTID) {
                let d = <Text2DInstanceData>part;
                let texture = this.fontTexture;
                let superSampleFactor = texture.isSuperSampled ? 0.5 : 1;
                let ts = texture.getSize();
                let offset = Vector2.Zero();
                let lh = this.fontTexture.lineHeight;
                offset.y = ((this.textSize.height/lh)-1) * lh;  // Origin is bottom, not top, so the offset is starting with a y that is the top location of the text
                let charxpos = 0;
                d.dataElementCount = this._charCount;
                d.curElement = 0;
                for (let char of this.text) {

                    // Line feed
                    if (char === "\n") {
                        offset.x = 0;
                        offset.y -= texture.lineHeight;
                    }

                    // Tabulation ?
                    if (char === "\t") {
                        let nextPos = charxpos + this._tabulationSize;
                        nextPos = nextPos - (nextPos % this._tabulationSize);

                        offset.x += (nextPos - charxpos) * texture.spaceWidth;
                        charxpos = nextPos;
                        continue;
                    }

                    if (char < " ") {
                        continue;
                    }

                    this.updateInstanceDataPart(d, offset);

                    let ci = texture.getChar(char);
                    offset.x += ci.charWidth;

                    d.topLeftUV = ci.topLeftUV;
                    let suv = ci.bottomRightUV.subtract(ci.topLeftUV);
                    d.sizeUV = suv;
                    d.textureSize = new Vector2(ts.width, ts.height);
                    d.color = this.defaultFontColor;
                    d.superSampleFactor = superSampleFactor;

                    ++d.curElement;
                }
            }
            return true;
        }

        private _updateCharCount() {
            let count = 0;
            for (let char of this._text) {
                if (char === "\r" || char === "\n" || char === "\t" || char < " ") {
                    continue;
                }
                ++count;
            }
            this._charCount = count;
        }

        protected _useTextureAlpha(): boolean {
            return this.fontTexture != null && this.fontTexture.hasAlpha;
        }

        protected _shouldUseAlphaFromTexture(): boolean {
            return true;
        }

        private _fontTexture: FontTexture;
        private _tabulationSize: number;
        private _charCount: number;
        private _fontName: string;
        private _fontSuperSample: boolean;
        private _defaultFontColor: Color4;
        private _text: string;
        private _textSize: Size;
    }


}