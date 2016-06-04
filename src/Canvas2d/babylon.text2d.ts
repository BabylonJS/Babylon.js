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

            var engine = instanceInfo.owner.owner.engine;

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

                engine.updateAndBindInstancesBuffer(pid._partBuffer, null, this.instancingAttributes);
                engine.draw(true, 0, 6, pid._partData.usedElementCount);
                engine.unbindInstanceAttributes();
            } else {
                for (let i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
                    this.setupUniforms(effect, 0, pid._partData, i);
                    engine.draw(true, 0, 6);
                }
            }

            engine.setAlphaMode(curAlphaMode);

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
                this.fontTexture.dispose();
                this.fontTexture = null;
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
    }

    @className("Text2D")
    export class Text2D extends RenderablePrim2D {
        static TEXT2D_MAINPARTID = 1;

        public static fontProperty: Prim2DPropInfo;
        public static defaultFontColorProperty: Prim2DPropInfo;
        public static textProperty: Prim2DPropInfo;
        public static sizeProperty: Prim2DPropInfo;

        @modelLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 1, pi => Text2D.fontProperty = pi, false, true)
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
        public get defaultFontColor(): Color4 {
            return this._defaultFontColor;
        }

        public set defaultFontColor(value: Color4) {
            this._defaultFontColor = value;
        }

        @instanceLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 3, pi => Text2D.textProperty = pi, false, true)
        public get text(): string {
            return this._text;
        }

        public set text(value: string) {
            this._text = value;
            this._actualSize = null;    // A change of text will reset the Actual Area Size which will be recomputed next time it's used
            this._updateCharCount();
        }

        @instanceLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 4, pi => Text2D.sizeProperty = pi)
        public get size(): Size {
            return this._areaSize;
        }

        public set size(value: Size) {
            this._areaSize = value;
        }

        public get actualSize(): Size {
            if (this.size) {
                return this.size;
            }

            if (this._actualSize) {
                return this._actualSize;
            }

            this._actualSize = this.fontTexture.measureText(this._text, this._tabulationSize);

            return this._actualSize;
        }

        protected get fontTexture(): FontTexture {
            if (this._fontTexture) {
                return this._fontTexture;
            }

            this._fontTexture = FontTexture.GetCachedFontTexture(this.owner.scene, this.fontName);
            return this._fontTexture;
        }

        public dispose(): boolean {
            if (!super.dispose()) {
                return false;
            }

            if (this._fontTexture) {
                FontTexture.ReleaseCachedFontTexture(this.owner.scene, this.fontName);
                this._fontTexture = null;
            }

            return true;
        }

        protected updateLevelBoundingInfo() {
            BoundingInfo2D.CreateFromSizeToRef(this.actualSize, this._levelBoundingInfo, this.origin);
        }

        protected setupText2D(owner: Canvas2D, parent: Prim2DBase, id: string, position: Vector2, origin: Vector2, fontName: string, text: string, areaSize: Size, defaultFontColor: Color4, tabulationSize: number, isVisible: boolean, marginTop: number | string, marginLeft: number | string, marginRight: number | string, marginBottom: number | string, vAlignment: number, hAlignment: number) {
            this.setupRenderablePrim2D(owner, parent, id, position, origin, isVisible, marginTop, marginLeft, marginRight, marginBottom, hAlignment, vAlignment);

            this.fontName = fontName;
            this.defaultFontColor = defaultFontColor;
            this.text = text;
            this.size = areaSize;
            this._tabulationSize = tabulationSize;
            this.isAlphaTest = true;
        }

        /**
         * Create a Text primitive
         * @param parent the parent primitive, must be a valid primitive (or the Canvas)
         * @param text the text to display
         * Options:
         *  - id a text identifier, for information purpose
         *  - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         *  - origin: define the normalized origin point location, default [0.5;0.5]
         *  - fontName: the name/size/style of the font to use, following the CSS notation. Default is "12pt Arial".
         *  - defaultColor: the color by default to apply on each letter of the text to display, default is plain white.
         *  - areaSize: the size of the area in which to display the text, default is auto-fit from text content.
         *  - tabulationSize: number of space character to insert when a tabulation is encountered, default is 4
         *  - isVisible: true if the text must be visible, false for hidden. Default is true.
         *  - marginTop/Left/Right/Bottom: define the margin for the corresponding edge, if all of them are null, margin is not used in layout computing. Default Value is null for each.
         *  - hAlighment: define horizontal alignment of the Canvas, alignment is optional, default value null: no alignment.
         *  - vAlighment: define horizontal alignment of the Canvas, alignment is optional, default value null: no alignment.
         */
        public static Create(parent: Prim2DBase, text: string, options?: { id?: string, position?: Vector2, x?: number, y?: number, origin?: Vector2, fontName?: string, defaultFontColor?: Color4, size?: Size, tabulationSize?: number, isVisible?: boolean, marginTop?: number | string, marginLeft?: number | string, marginRight?: number | string, marginBottom?: number | string, hAlignment?: number, vAlignment?: number}): Text2D {
            Prim2DBase.CheckParent(parent);

            let text2d = new Text2D();
            if (!options) {
                text2d.setupText2D(parent.owner, parent, null, Vector2.Zero(), null, "12pt Arial", text, null, new Color4(1,1,1,1), 4, true, null, null, null, null, null, null);
            } else {
                let pos = options.position || new Vector2(options.x || 0, options.y || 0);
                text2d.setupText2D
                (
                    parent.owner,
                    parent,
                    options.id || null,
                    pos,
                    options.origin || null,
                    options.fontName || "12pt Arial",
                    text,
                    options.size,
                    options.defaultFontColor || new Color4(1, 1, 1, 1),
                    (options.tabulationSize==null) ? 4 : options.tabulationSize,
                    (options.isVisible==null) ? true : options.isVisible,
                    options.marginTop,
                    options.marginLeft,
                    options.marginRight,
                    options.marginBottom,
                    options.vAlignment,
                    options.hAlignment);
            }
            return text2d;
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
            let ei = this.getDataPartEffectInfo(Text2D.TEXT2D_MAINPARTID, ["index"], true);
            if (ei) {
                renderCache.effectInstanced = engine.createEffect("text2d", ei.attributes, ei.uniforms, ["diffuseSampler"], ei.defines, null);
            }

            ei = this.getDataPartEffectInfo(Text2D.TEXT2D_MAINPARTID, ["index"], false);
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
                let ts = texture.getSize();
                let textSize = texture.measureText(this.text, this._tabulationSize);
                let offset = Vector2.Zero();
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

                    this.updateInstanceDataPart(d, offset, textSize);

                    let ci = texture.getChar(char);
                    offset.x += ci.charWidth;

                    d.topLeftUV = ci.topLeftUV;
                    let suv = ci.bottomRightUV.subtract(ci.topLeftUV);
                    d.sizeUV = suv;
                    d.textureSize = new Vector2(ts.width, ts.height);
                    d.color = this.defaultFontColor;

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

        private _fontTexture: FontTexture;
        private _tabulationSize: number;
        private _charCount: number;
        private _fontName: string;
        private _defaultFontColor: Color4;
        private _text: string;
        private _areaSize: Size;

    }


}