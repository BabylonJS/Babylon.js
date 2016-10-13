module BABYLON {

    @className("Shape2D", "BABYLON")
    /**
     * The abstract class for parametric shape based Primitives types.
     * Shape2D based primitives are composed of two parts: fill and border, both are optional but at least one must be specified.
     * The fill part is the primitive 'body', the border is a border around this body. The border has a thickness that can be changed.
     */
    export abstract class Shape2D extends RenderablePrim2D {
        static SHAPE2D_BORDERPARTID            = 1;
        static SHAPE2D_FILLPARTID              = 2;
        static SHAPE2D_CATEGORY_BORDER         = "Border";
        static SHAPE2D_CATEGORY_BORDERSOLID    = "BorderSolid";
        static SHAPE2D_CATEGORY_BORDERGRADIENT = "BorderGradient";
        static SHAPE2D_CATEGORY_FILLSOLID      = "FillSolid";
        static SHAPE2D_CATEGORY_FILLGRADIENT   = "FillGradient";

        static SHAPE2D_PROPCOUNT: number = RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 5;
        public static borderProperty: Prim2DPropInfo;
        public static fillProperty: Prim2DPropInfo;
        public static borderThicknessProperty: Prim2DPropInfo;

        @modelLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 1, pi => Shape2D.borderProperty = pi, true)
        /**
         * Get/set the brush to render the Border part of the Primitive
         */
        public get border(): IBrush2D {
            return this._border;
        }

        public set border(value: IBrush2D) {
            this._border = value;
            this._updateTransparencyStatus();
        }

        /**
         * Get/set the brush to render the Fill part of the Primitive
         */
        @modelLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 2, pi => Shape2D.fillProperty = pi, true)
        public get fill(): IBrush2D {
            return this._fill;
        }

        public set fill(value: IBrush2D) {
            this._fill = value;
            this._updateTransparencyStatus();
        }

        @instanceLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 3, pi => Shape2D.borderThicknessProperty = pi)
        /**
         * Get/set the thickness of the border part.
         */
        public get borderThickness(): number {
            return this._borderThickness;
        }

        public set borderThickness(value: number) {
            this._borderThickness = value;
        }

        constructor(settings?: {
            fill           ?: IBrush2D | string,
            border         ?: IBrush2D | string,
            borderThickness?: number,
        }) {

            super(settings);

            if (!settings) {
                settings = {};
            }

            let borderBrush: IBrush2D = null;
            if (settings.border) {
                if (typeof (settings.border) === "string") {
                    borderBrush = Canvas2D.GetBrushFromString(<string>settings.border);
                } else {
                    borderBrush = <IBrush2D>settings.border;
                }
            }

            let fillBrush: IBrush2D = null;
            if (settings.fill) {
                if (typeof (settings.fill) === "string") {
                    fillBrush = Canvas2D.GetBrushFromString(<string>settings.fill);
                } else {
                    fillBrush = <IBrush2D>settings.fill;
                }
            }

            this._isTransparent = false;
            this._oldTransparent = false;
            this.border = borderBrush;
            this.fill = fillBrush;
            this._updateTransparencyStatus();
            this.borderThickness = settings.borderThickness;
        }

        protected getUsedShaderCategories(dataPart: InstanceDataBase): string[] {
            var cat = super.getUsedShaderCategories(dataPart);

            // Fill Part
            if (dataPart.id === Shape2D.SHAPE2D_FILLPARTID) {
                let fill = this.fill;
                if (fill instanceof SolidColorBrush2D) {
                    cat.push(Shape2D.SHAPE2D_CATEGORY_FILLSOLID);
                }
                if (fill instanceof GradientColorBrush2D) {
                    cat.push(Shape2D.SHAPE2D_CATEGORY_FILLGRADIENT);
                }
            }

            // Border Part
            if (dataPart.id === Shape2D.SHAPE2D_BORDERPARTID) {
                cat.push(Shape2D.SHAPE2D_CATEGORY_BORDER);

                let border = this.border;
                if (border instanceof SolidColorBrush2D) {
                    cat.push(Shape2D.SHAPE2D_CATEGORY_BORDERSOLID);
                }
                if (border instanceof GradientColorBrush2D) {
                    cat.push(Shape2D.SHAPE2D_CATEGORY_BORDERGRADIENT);
                }
            }

            return cat;
        }

        protected applyActualScaleOnTransform(): boolean {
            return false;
        }

        protected refreshInstanceDataPart(part: InstanceDataBase): boolean {
            if (!super.refreshInstanceDataPart(part)) {
                return false;
            }

            // Fill Part
            if (part.id === Shape2D.SHAPE2D_FILLPARTID) {
                let d = <Shape2DInstanceData>part;

                if (this.fill) {
                    let fill = this.fill;
                    if (fill instanceof SolidColorBrush2D) {
                        d.fillSolidColor = fill.color;
                    } else if (fill instanceof GradientColorBrush2D) {
                        d.fillGradientColor1 = fill.color1;
                        d.fillGradientColor2 = fill.color2;
                        var t = Matrix.Compose(new Vector3(fill.scale, fill.scale, fill.scale), Quaternion.RotationAxis(new Vector3(0, 0, 1), fill.rotation), new Vector3(fill.translation.x, fill.translation.y, 0));

                        let ty = new Vector4(t.m[1], t.m[5], t.m[9], t.m[13]);
                        d.fillGradientTY = ty;
                    }
                }
            }

            else if (part.id === Shape2D.SHAPE2D_BORDERPARTID) {
                let d = <Shape2DInstanceData>part;

                if (this.border) {
                    d.borderThickness = this.borderThickness;

                    let border = this.border;
                    if (border instanceof SolidColorBrush2D) {
                        d.borderSolidColor = border.color;
                    } else if (border instanceof GradientColorBrush2D) {
                        d.borderGradientColor1 = border.color1;
                        d.borderGradientColor2 = border.color2;
                        var t = Matrix.Compose(new Vector3(border.scale, border.scale, border.scale), Quaternion.RotationAxis(new Vector3(0, 0, 1), border.rotation), new Vector3(border.translation.x, border.translation.y, 0));

                        let ty = new Vector4(t.m[1], t.m[5], t.m[9], t.m[13]);
                        d.borderGradientTY = ty;
                    }
                }
            }

            return true;
        }

        private _updateTransparencyStatus() {
            this._isTransparent = (this._border && this._border.isTransparent()) || (this._fill && this._fill.isTransparent()) || (this.actualOpacity < 1);
            if (this._isTransparent !== this._oldTransparent) {
                this._oldTransparent = this._isTransparent;
                this._updateRenderMode();
            }
        }

        protected _mustUpdateInstance(): boolean {
            let res = this._oldTransparent !== this._isTransparent;
            if (res) {
                this._updateRenderMode();
                this._oldTransparent = this._isTransparent;
            }
            return res;
        }

        protected _isPrimTransparent(): boolean {
            return this._isTransparent;
        }

        private _oldTransparent: boolean;
        private _isTransparent: boolean;
        private _border: IBrush2D;
        private _borderThickness: number;
        private _fill: IBrush2D;

    }

    export class Shape2DInstanceData extends InstanceDataBase {
        // FILL ATTRIBUTES

        @instanceData(Shape2D.SHAPE2D_CATEGORY_FILLSOLID)
        get fillSolidColor(): Color4 {
            return null;
        }
        set fillSolidColor(value: Color4) {
        }

        @instanceData(Shape2D.SHAPE2D_CATEGORY_FILLGRADIENT)
        get fillGradientColor1(): Color4 {
            return null;
        }
        set fillGradientColor1(value: Color4) {
        }

        @instanceData(Shape2D.SHAPE2D_CATEGORY_FILLGRADIENT)
        get fillGradientColor2(): Color4 {
            return null;
        }
        set fillGradientColor2(value: Color4) {
        }

        @instanceData(Shape2D.SHAPE2D_CATEGORY_FILLGRADIENT)
        get fillGradientTY(): Vector4 {
            return null;
        }
        set fillGradientTY(value: Vector4) {
        }

        // BORDER ATTRIBUTES

        @instanceData(Shape2D.SHAPE2D_CATEGORY_BORDER)
        get borderThickness(): number {
            return null;
        }
        set borderThickness(value: number) {
        }

        @instanceData(Shape2D.SHAPE2D_CATEGORY_BORDERSOLID)
        get borderSolidColor(): Color4 {
            return null;
        }
        set borderSolidColor(value: Color4) {
        }

        @instanceData(Shape2D.SHAPE2D_CATEGORY_BORDERGRADIENT)
        get borderGradientColor1(): Color4 {
            return null;
        }
        set borderGradientColor1(value: Color4) {
        }

        @instanceData(Shape2D.SHAPE2D_CATEGORY_BORDERGRADIENT)
        get borderGradientColor2(): Color4 {
            return null;
        }
        set borderGradientColor2(value: Color4) {
        }

        @instanceData(Shape2D.SHAPE2D_CATEGORY_BORDERGRADIENT)
        get borderGradientTY(): Vector4 {
            return null;
        }
        set borderGradientTY(value: Vector4) {
        }
    }
}