module BABYLON {
    export class Text2DRenderCache extends ModelRenderCache {
        effectsReady: boolean                           = false;
        vb: WebGLBuffer                                 = null;
        ib: WebGLBuffer                                 = null;
        instancingAttributes: InstancingAttributeInfo[] = null;
        fontTexture: BaseFontTexture                    = null;
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

            let sdf = this.fontTexture.isSignedDistanceField;

            // Enable alpha mode only if the texture is not using SDF, SDF is rendered in AlphaTest mode, which mean no alpha blend
            var curAlphaMode: number;
            if (!sdf) {
                curAlphaMode = engine.getAlphaMode();
                engine.setAlphaMode(Engine.ALPHA_COMBINE, true);
            }

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

            if (!sdf) {
                engine.setAlphaMode(curAlphaMode, true);
            }

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
        set topLeftUV(value: Vector2) {
        }

        @instanceData()
        get sizeUV(): Vector2 {
            return null;
        }
        set sizeUV(value: Vector2) {
        }

        @instanceData()
        get textureSize(): Vector2 {
            return null;
        }
        set textureSize(value: Vector2) {
        }

        @instanceData()
        get color(): Color4 {
            return null;
        }
        set color(value: Color4) {
        }

        @instanceData()
        get superSampleFactor(): number {
            return null;
        }
        set superSampleFactor(value: number) {
        }
    }

    @className("Text2D", "BABYLON")
    /**
     * Primitive that render text using a specific font
     */
    export class Text2D extends RenderablePrim2D {
        static TEXT2D_MAINPARTID = 1;

        static TEXT2D_CATEGORY_SDF = "SignedDistanceField";

        public static fontProperty: Prim2DPropInfo;
        public static defaultFontColorProperty: Prim2DPropInfo;
        public static textProperty: Prim2DPropInfo;
        public static sizeProperty: Prim2DPropInfo;
        public static fontSuperSampleProperty: Prim2DPropInfo;
        public static fontSignedDistanceFieldProperty: Prim2DPropInfo;

        /**
         * Alignment is made relative to the left edge of the Content Area. Valid for horizontal alignment only.
         */
        public static get AlignLeft(): number { return Text2D._AlignLeft; }

        /**
         * Alignment is made relative to the top edge of the Content Area. Valid for vertical alignment only.
         */
        public static get AlignTop(): number { return Text2D._AlignTop; }

        /**
         * Alignment is made relative to the right edge of the Content Area. Valid for horizontal alignment only.
         */
        public static get AlignRight(): number { return Text2D._AlignRight; }

        /**
         * Alignment is made relative to the bottom edge of the Content Area. Valid for vertical alignment only.
         */
        public static get AlignBottom(): number { return Text2D._AlignBottom; }

        /**
         * Alignment is made to center the text from equal distance to the opposite edges of the Content Area
         */
        public static get AlignCenter(): number { return Text2D._AlignCenter; }

        private static _AlignLeft = 1;
        private static _AlignTop = 1;   // Same as left
        private static _AlignRight = 2;
        private static _AlignBottom = 2;   // Same as right
        private static _AlignCenter = 3;

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
            if (!this._defaultFontColor) {
                this._defaultFontColor = value.clone();
            } else {
                this._defaultFontColor.copyFrom(value);
            }
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
            if (!value) {
                value = "";
            }
            this._text = value;
            this._textSize = null;    // A change of text will reset the TextSize which will be recomputed next time it's used

            if(!this._sizeSetByUser){
                this._size = null;
            }

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
            this.internalSetSize(value);
        }

        @modelLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 5, pi => Text2D.fontSuperSampleProperty = pi, false, false)
        /**
         * Get/set the font name to use, using HTML CSS notation.
         * Set is not supported right now.
         */
        public get fontSuperSample(): boolean {
            return this._fontTexture && this._fontTexture.isSuperSampled;
        }

        @modelLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 6, pi => Text2D.fontSuperSampleProperty = pi, false, false)
        /**
         * Get/set the font name to use, using HTML CSS notation.
         * Set is not supported right now.
         */
        public get fontSignedDistanceField(): boolean {
            return this._fontTexture && this._fontTexture.isSignedDistanceField;
        }

        public get isSizeAuto(): boolean {
            return false;
        }

        public get isVerticalSizeAuto(): boolean {
            return false;
        }

        public get isHorizontalSizeAuto(): boolean {
            return false;
        }

        /**
         * Get the area that bounds the text associated to the primitive
         */
        public get textSize(): Size {
            if (!this._textSize) {
                if (this.owner && this._text) {
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

        protected onSetOwner() {
            if (!this._textSize) {
                this.onPrimitivePropertyDirty(Prim2DBase.sizeProperty.flagId);
                this._setLayoutDirty();
                this._positioningDirty();
                this._actualSize = null;
            }
        }

        protected get fontTexture(): BaseFontTexture {
            if (this._fontTexture) {
                return this._fontTexture;
            }

            if (this.fontName == null || this.owner == null || this.owner.scene == null) {
                return null;
            }

            this._fontTexture = FontTexture.GetCachedFontTexture(this.owner.scene, this.fontName, this._fontSuperSample, this._fontSDF);
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
                FontTexture.ReleaseCachedFontTexture(this.owner.scene, this.fontName, this._fontSuperSample, this._fontSDF);
                this._fontTexture = null;
            }

            return true;
        }

        protected updateLevelBoundingInfo() {
            if (!this.owner || !this._text) {
                return false;
            }
            BoundingInfo2D.CreateFromSizeToRef(this.actualSize, this._levelBoundingInfo);
            return true;
        }

        /**
         * You can get/set the text alignment through this property
         */
        public get textAlignment(): string {
            return this._textAlignment;
        }

        public set textAlignment(value: string) {
            this._textAlignment = value;
            this._setTextAlignmentfromString(value);
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
         * - dontInheritParentScale: if set the parent's scale won't be taken into consideration to compute the actualScale property
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - fontName: the name/size/style of the font to use, following the CSS notation. Default is "12pt Arial".
         * - fontSuperSample: if true the text will be rendered with a superSampled font (the font is twice the given size). Use this settings if the text lies in world space or if it's scaled in.
         * - signedDistanceField: if true the text will be rendered using the SignedDistanceField technique. This technique has the advantage to be rendered order independent (then much less drawing calls), but only works on font that are a little more than one pixel wide on the screen but the rendering quality is excellent whatever the font size is on the screen (which is the purpose of this technique). Outlining/Shadow is not supported right now. If you can, you should use this mode, the quality and the performances are the best. Note that fontSuperSample has no effect when this mode is on.
         * - defaultFontColor: the color by default to apply on each letter of the text to display, default is plain white.
         * - areaSize: the size of the area in which to display the text, default is auto-fit from text content.
         * - tabulationSize: number of space character to insert when a tabulation is encountered, default is 4
         * - isVisible: true if the text must be visible, false for hidden. Default is true.
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
         * - textAlignmentH: align text horizontally (Text2D.AlignLeft, Text2D.AlignCenter, Text2D.AlignRight)
         * - textAlignmentV: align text vertically (Text2D.AlignTop, Text2D.AlignCenter, Text2D.AlignBottom)
         * - textAlignment: a string defining the text alignment, text can be: [<h:|horizontal:><left|right|center>], [<v:|vertical:><top|bottom|center>]
         * - wordWrap: if true the text will wrap inside content area
         */
        constructor(text: string, settings?: {

            parent                  ?: Prim2DBase, 
            children                ?: Array<Prim2DBase>,
            id                      ?: string,
            position                ?: Vector2,
            x                       ?: number,
            y                       ?: number,
            rotation                ?: number,
            scale                   ?: number,
            scaleX                  ?: number,
            scaleY                  ?: number,
            dontInheritParentScale  ?: boolean,
            opacity                 ?: number,
            zOrder                  ?: number, 
            origin                  ?: Vector2,
            fontName                ?: string,
            fontSuperSample         ?: boolean,
            fontSignedDistanceField ?: boolean,
            bitmapFontTexture       ?: BitmapFontTexture,
            defaultFontColor        ?: Color4,
            size                    ?: Size,
            tabulationSize          ?: number,
            isVisible               ?: boolean,
            isPickable              ?: boolean,
            isContainer             ?: boolean,
            childrenFlatZOrder      ?: boolean,
            levelCollision          ?: boolean,
            deepCollision           ?: boolean,
            layoutData              ?: ILayoutData,
            marginTop               ?: number | string,
            marginLeft              ?: number | string,
            marginRight             ?: number | string,
            marginBottom            ?: number | string,
            margin                  ?: number | string,
            marginHAlignment        ?: number,
            marginVAlignment        ?: number,
            marginAlignment         ?: string,
            paddingTop              ?: number | string,
            paddingLeft             ?: number | string,
            paddingRight            ?: number | string,
            paddingBottom           ?: number | string,
            padding                 ?: number | string,
            textAlignmentH          ?: number,
            textAlignmentV          ?: number,
            textAlignment           ?: string,
            wordWrap                ?: boolean
        }) {

            if (!settings) {
                settings = {};
            }

            super(settings);

            if (settings.bitmapFontTexture != null) {
                this._fontTexture     = settings.bitmapFontTexture;
                this._fontName        = null;
                this._fontSuperSample = false;
                this._fontSDF         = false;

                let ft = this._fontTexture;
                if (ft != null && !ft.isReady()) {
                    ft.onLoadObservable.add(() => {
                        this._positioningDirty();
                        this._setLayoutDirty();
                        this._instanceDirtyFlags |= Prim2DBase.originProperty.flagId;  // To make sure the Text2D is issued again for render
                    });                    
                }
            } else {
                this._fontName       = (settings.fontName==null) ? "12pt Arial" : settings.fontName;
                this._fontSuperSample= (settings.fontSuperSample!=null && settings.fontSuperSample);
                this._fontSDF        = (settings.fontSignedDistanceField!=null && settings.fontSignedDistanceField);
            }
            this._defaultFontColor   = (settings.defaultFontColor==null) ? new Color4(1,1,1,1) : settings.defaultFontColor.clone();
            this._tabulationSize     = (settings.tabulationSize == null) ? 4 : settings.tabulationSize;
            this._textSize           = null;
            this.text                = text;
            if(settings.size != null){
                this.size = settings.size;
                this._sizeSetByUser = true;
            }else{
                this.size = null;
            }
            this.textAlignmentH      = (settings.textAlignmentH==null) ? Text2D.AlignLeft : settings.textAlignmentH;
            this.textAlignmentV      = (settings.textAlignmentV==null) ? Text2D.AlignTop : settings.textAlignmentV;
            this.textAlignment       = (settings.textAlignment==null) ? "" : settings.textAlignment;
            this._wordWrap           = (settings.wordWrap==null) ? false : settings.wordWrap;
            
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

        protected getUsedShaderCategories(dataPart: InstanceDataBase): string[] {
            var cat = super.getUsedShaderCategories(dataPart);

            if (this._fontSDF) {
                cat.push(Text2D.TEXT2D_CATEGORY_SDF);
            }
            return cat;
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

                d.dataElementCount = this._charCount;
                d.curElement = 0;

                let lineLengths = [];
                let charWidths = [];
                let charsPerLine = [];
                let numCharsCurrenLine = 0;
                let contentAreaWidth = this.contentArea.width;
                let contentAreaHeight = this.contentArea.height;
                let numCharsCurrentWord = 0;
                let widthCurrentWord = 0;
                let numWordsPerLine = 0;
                let text = this.text;
                let tabWidth = this._tabulationSize * texture.spaceWidth;

                // First pass: analyze the text to build data like pixel length of each lines, width of each char, number of char per line
                for (let i = 0; i < text.length; i++) {
                    let char = text[i];
                    numCharsCurrenLine++;
                   
                    charWidths[i] = 0;

                    // Line feed
                    if (this._isWhiteSpaceCharVert(char)) {
                        lineLengths.push(offset.x);
                        charsPerLine.push(numCharsCurrenLine - 1);
                        numCharsCurrenLine = 1;
                        offset.x = 0;

                        if (widthCurrentWord > 0) {
                            numWordsPerLine++;
                        }

                        numWordsPerLine = 0;
                        numCharsCurrentWord = 0;
                        widthCurrentWord = 0;
                        
                        continue;
                    }

                    let ci = texture.getChar(char);
                    let charWidth = 0;

                    if (char === "\t") {
                        charWidth = tabWidth;
                    }else{
                        charWidth = ci.xAdvance;
                    }

                    offset.x += charWidth;
                    charWidths[i] = charWidth;

                    if (this._isWhiteSpaceCharHoriz(char)) {
                        if (widthCurrentWord > 0) {
                            numWordsPerLine++;
                        }
                        numCharsCurrentWord = 0;
                        widthCurrentWord = 0;
                    }else {
                        widthCurrentWord += ci.xAdvance;
                        numCharsCurrentWord++;
                    }

                    if (this._wordWrap && numWordsPerLine > 0 && offset.x > contentAreaWidth) {
                        lineLengths.push(offset.x - widthCurrentWord);
                        numCharsCurrenLine -= numCharsCurrentWord;
                        let j = i - numCharsCurrentWord;
                        //skip white space at the end of this line
                        while (this._isWhiteSpaceCharHoriz(text[j])) {
                            lineLengths[lineLengths.length - 1] -= charWidths[j];
                            j--;
                        }

                        charsPerLine.push(numCharsCurrenLine);

                        if(this._isWhiteSpaceCharHoriz(text[i])){
                            
                            //skip white space at the beginning of next line
                            let numSpaces = 0;
                            while (this._isWhiteSpaceCharHoriz(text[i+numSpaces])) {
                                numSpaces++;
                                charWidths[i+numSpaces] = 0;
                            }
                           
                            i += numSpaces-1;
                            
                            offset.x = 0;
                            numCharsCurrenLine = numSpaces-1;
                        }else{
                            numCharsCurrenLine = numCharsCurrentWord;
                            offset.x = widthCurrentWord;
                        }
                        
                        numWordsPerLine = 0;
                    }
                }
                lineLengths.push(offset.x);
                charsPerLine.push(numCharsCurrenLine);

                //skip white space at the end
                let i = text.length - 1;
                while (this._isWhiteSpaceCharHoriz(text[i])) {
                    lineLengths[lineLengths.length - 1] -= charWidths[i];
                    i--;
                }

                let charNum = 0;
                let maxLineLen = 0;
                let alignH = this.textAlignmentH;
                let alignV = this.textAlignmentV;

                offset.x = 0;

                if (alignH == Text2D.AlignRight || alignH == Text2D.AlignCenter) {
                    for (let i = 0; i < lineLengths.length; i++) {
                        if (lineLengths[i] > maxLineLen) {
                            maxLineLen = lineLengths[i];
                        }
                    }
                }

                let textHeight = lineLengths.length * lh;
                let offsetX = this.padding.leftPixels;
                
                if (alignH == Text2D.AlignRight) {
                    offsetX += contentAreaWidth - maxLineLen;
                } else if (alignH == Text2D.AlignCenter) {
                    offsetX += (contentAreaWidth - maxLineLen) * .5;
                }

                offset.x += offsetX;

                offset.y += contentAreaHeight + textHeight - lh;
                offset.y += this.padding.bottomPixels;

                if (alignV == Text2D.AlignBottom) {
                    offset.y -= contentAreaHeight;
                }else if (alignV == Text2D.AlignCenter) {
                    offset.y -= (contentAreaHeight - textHeight) * .5 + lineLengths.length * lh;
                }else {
                    offset.y -= lineLengths.length * lh;
                }

                let lineHeight = texture.lineHeight;
                for (let i = 0; i < lineLengths.length; i++) {
                    let numChars = charsPerLine[i];
                    let lineLength = lineLengths[i];

                    if (alignH == Text2D.AlignRight) {
                        offset.x += maxLineLen - lineLength;
                    }else if (alignH == Text2D.AlignCenter) {
                        offset.x += (maxLineLen - lineLength) * .5;
                    }

                    for (let j = 0; j < numChars; j++) {
                        let char = text[charNum];
                        let charWidth = charWidths[charNum];

                        if(char !== "\t" && !this._isWhiteSpaceCharVert(char)){ 
                            //make sure space char gets processed here or overlapping can occur when text is set
                            let ci = texture.getChar(char);
                            this.updateInstanceDataPart(d, new Vector2(offset.x + ci.xOffset, offset.y +ci.yOffset));
                            d.topLeftUV = ci.topLeftUV;
                            let suv = ci.bottomRightUV.subtract(ci.topLeftUV);
                            d.sizeUV = suv;
                            d.textureSize = new BABYLON.Vector2(ts.width, ts.height);
                            d.color = this.defaultFontColor;
                            d.superSampleFactor = superSampleFactor;
                            ++d.curElement;
                        }

                        offset.x += charWidth;
                        charNum++;
                    }

                    offset.x = offsetX;
                    offset.y -= lineHeight;
                }

            }
            return true;
        }

        private _isWhiteSpaceCharHoriz(char): boolean {
            if(char === " " || char === "\t"){
                return true;
            }
        }

        private _isWhiteSpaceCharVert(char): boolean {
            if(char === "\n" || char === "\r"){
                return true;
            }
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

        private _setTextAlignmentfromString(value: string) {
            let m = value.trim().split(",");

            for (let v of m) {
                v = v.toLocaleLowerCase().trim();

                // Horizontal
                let i = v.indexOf("h:");
                if (i === -1) {
                    i = v.indexOf("horizontal:");
                }

                if (i !== -1) {
                    v = v.substr(v.indexOf(":") + 1);
                    this._setTextAlignmentHorizontal(v);
                    continue;
                }

                // Vertical
                i = v.indexOf("v:");
                if (i === -1) {
                    i = v.indexOf("vertical:");
                }

                if (i !== -1) {
                    v = v.substr(v.indexOf(":") + 1);
                    this._setTextAlignmentVertical(v);
                    continue;
                }
            }
        }

        private _setTextAlignmentHorizontal(text: string) {
            let v = text.trim().toLocaleLowerCase();
            switch (v) {
                case "left":
                    this.textAlignmentH = Text2D.AlignLeft;
                    return;
                case "right":
                    this.textAlignmentH = Text2D.AlignRight;
                    return;
                case "center":
                    this.textAlignmentH = Text2D.AlignCenter;
                    return;
            }
        }

        private _setTextAlignmentVertical(text: string) {
            let v = text.trim().toLocaleLowerCase();
            switch (v) {
                case "top":
                    this.textAlignmentV = Text2D.AlignTop;
                    return;
                case "bottom":
                    this.textAlignmentV = Text2D.AlignBottom;
                    return;
                case "center":
                    this.textAlignmentV = Text2D.AlignCenter;
                    return;
            }
        }

        protected _useTextureAlpha(): boolean {
            return this._fontSDF;
        }

        protected _shouldUseAlphaFromTexture(): boolean {
            return !this._fontSDF;
        }

        private _fontTexture: BaseFontTexture;
        private _tabulationSize: number;
        private _charCount: number;
        private _fontName: string;
        private _fontSuperSample: boolean;
        private _fontSDF: boolean;
        private _defaultFontColor: Color4;
        private _text: string;
        private _textSize: Size;
        private _wordWrap: boolean;
        private _textAlignment: string;
        private _sizeSetByUser: boolean;

        public textAlignmentH: number;
        public textAlignmentV: number;
        
    }
}