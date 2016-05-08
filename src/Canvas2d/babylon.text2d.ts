module BABYLON {
    export class Text2DRenderCache extends ModelRenderCache {
        vb: WebGLBuffer;
        ib: WebGLBuffer;
        borderVB: WebGLBuffer;
        borderIB: WebGLBuffer;
        instancingAttributes: InstancingAttributeInfo[];
        fontTexture: FontTexture;
        effect: Effect;

        render(instanceInfo: GroupInstanceInfo, context: Render2DContext): boolean {
            // Do nothing if the shader is still loading/preparing
            if (!this.effect.isReady() || !this.fontTexture.isReady()) {
                return false;
            }

            // Compute the offset locations of the attributes in the vertexshader that will be mapped to the instance buffer data
            if (!this.instancingAttributes) {
                this.instancingAttributes = this.loadInstancingAttributes(Text2D.TEXT2D_MAINPARTID, this.effect);
            }
            var engine = instanceInfo._owner.owner.engine;

            this.fontTexture.update();

            engine.enableEffect(this.effect);
            this.effect.setTexture("diffuseSampler", this.fontTexture);
            engine.bindBuffers(this.vb, this.ib, [1], 4, this.effect);

            var cur = engine.getAlphaMode();
            engine.setAlphaMode(Engine.ALPHA_COMBINE);
            let count = instanceInfo._instancesPartsData[0].usedElementCount;
            if (instanceInfo._owner.owner.supportInstancedArray) {
                engine.updateAndBindInstancesBuffer(instanceInfo._instancesPartsBuffer[0], null, this.instancingAttributes);
                engine.draw(true, 0, 6, count);
                engine.unBindInstancesBuffer(instanceInfo._instancesPartsBuffer[0], this.instancingAttributes);
            } else {
                for (let i = 0; i < count; i++) {
                    this.setupUniforms(this.effect, 0, instanceInfo._instancesPartsData[0], i);
                    engine.draw(true, 0, 6);
                }
            }

            engine.setAlphaMode(cur);


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
    }

    @className("Text2D")
    export class Text2D extends RenderablePrim2D {
        static TEXT2D_MAINPARTID = 1;

        public static fontProperty: Prim2DPropInfo;
        public static textProperty: Prim2DPropInfo;
        public static areaSizeProperty: Prim2DPropInfo;
        public static vAlignProperty: Prim2DPropInfo;
        public static hAlignProperty: Prim2DPropInfo;

        public static TEXT2D_VALIGN_TOP = 1;
        public static TEXT2D_VALIGN_CENTER = 2;
        public static TEXT2D_VALIGN_BOTTOM = 3;
        public static TEXT2D_HALIGN_LEFT = 1;
        public static TEXT2D_HALIGN_CENTER = 2;
        public static TEXT2D_HALIGN_RIGHT = 3;

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

        @instanceLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 2, pi => Text2D.textProperty = pi, false, true)
        public get text(): string {
            return this._text;
        }

        public set text(value: string) {
            this._text = value;
            this._actualAreaSize = null;    // A change of text will reset the Actual Area Size which will be recomputed next time it's used
            this._updateCharCount();
        }

        @instanceLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 3, pi => Text2D.areaSizeProperty = pi)
        public get areaSize(): Size {
            return this._areaSize;
        }

        public set areaSize(value: Size) {
            this._areaSize = value;
        }

        @instanceLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 4, pi => Text2D.vAlignProperty = pi)
        public get vAlign(): number {
            return this._vAlign;
        }

        public set vAlign(value: number) {
            this._vAlign = value;
        }

        @instanceLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 5, pi => Text2D.hAlignProperty = pi)
        public get hAlign(): number {
            return this._hAlign;
        }

        public set hAlign(value: number) {
            this._hAlign = value;
        }

        public get actualAreaSize(): Size {
            if (this.areaSize) {
                return this.areaSize;
            }

            if (this._actualAreaSize) {
                return this._actualAreaSize;
            }

            this._actualAreaSize = this.fontTexture.measureText(this._text, this._tabulationSize);

            return this._actualAreaSize;
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
            BoundingInfo2D.ConstructFromSizeToRef(this.actualAreaSize, this._levelBoundingInfo);
        }

        protected setupText2D(owner: Canvas2D, parent: Prim2DBase, id: string, position: Vector2, fontName: string, text: string, areaSize: Size, vAlign, hAlign, tabulationSize: number) {
            this.setupRenderablePrim2D(owner, parent, id, position, true);

            this.fontName = fontName;
            this.text = text;
            this.areaSize = areaSize;
            this.vAlign = vAlign;
            this.hAlign = hAlign;
            this._tabulationSize = tabulationSize;
            this._isTransparent = true;
            this.origin = Vector2.Zero();
        }

        public static Create(parent: Prim2DBase, id: string, x: number, y: number, fontName: string, text: string, areaSize?: Size, vAlign = Text2D.TEXT2D_VALIGN_TOP, hAlign = Text2D.TEXT2D_HALIGN_LEFT, tabulationSize: number = 4): Text2D {
            Prim2DBase.CheckParent(parent);

            let text2d = new Text2D();
            text2d.setupText2D(parent.owner, parent, id, new Vector2(x, y), fontName, text, areaSize, vAlign, hAlign, tabulationSize);
            return text2d;
        }

        protected createModelRenderCache(): ModelRenderCache {
            let renderCache = new Text2DRenderCache();
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

            // Effects
            let ei = this.getDataPartEffectInfo(Text2D.TEXT2D_MAINPARTID, ["index"]);
            renderCache.effect = engine.createEffect("text2d", ei.attributes, ei.uniforms, ["diffuseSampler"], ei.defines, null, e => {
//                renderCache.setupUniformsLocation(e, ei.uniforms, Text2D.TEXT2D_MAINPARTID);
            });

            return renderCache;
        }

        protected createInstanceDataParts(): InstanceDataBase[] {
            return [new Text2DInstanceData(Text2D.TEXT2D_MAINPARTID, this._charCount)];
        }

        protected refreshInstanceDataPart(part: InstanceDataBase): boolean {
            if (!super.refreshInstanceDataPart(part)) {
                return false;
            }

            if (part.id === Text2D.TEXT2D_MAINPARTID) {
                let d = <Text2DInstanceData>part;
                let texture = this.fontTexture;
                let ts = texture.getSize();

                let offset = Vector2.Zero();
                let charxpos = 0;
                d.curElement = 0;
                for (let char of this.text) {

                    // Line feed
                    if (char === "\n") {
                        offset.x = 0;
                        offset.y += texture.lineHeight;
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
        private _text: string;
        private _areaSize: Size;
        private _actualAreaSize: Size;
        private _vAlign: number;
        private _hAlign: number;
    }


}