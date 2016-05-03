module BABYLON {

    @className("Shape2D")
    export class Shape2D extends RenderablePrim2D {
        static SHAPE2D_BORDERPARTID = 1;
        static SHAPE2D_FILLPARTID = 1;
        static SHAPE2D_CATEGORY_BORDERSOLID = "BorderSolid";
        static SHAPE2D_CATEGORY_FILLSOLID = "FillSolid";

        static SHAPE2D_PROPCOUNT: number = RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 5;
        public static borderProperty: Prim2DPropInfo;
        public static fillProperty: Prim2DPropInfo;

        @modelLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 1, pi => Shape2D.borderProperty = pi, true)
        public get border(): IBrush2D {
            return this._border;
        }

        public set border(value: IBrush2D) {
            this._border = value;
        }

        @modelLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 2, pi => Shape2D.fillProperty = pi, true)
        public get fill(): IBrush2D {
            return this._fill;
        }

        public set fill(value: IBrush2D) {
            this._fill = value;
        }

        protected getUsedShaderCategories(dataPart: InstanceDataBase): string[] {
            var cat = super.getUsedShaderCategories(dataPart);

            // Fill Part
            if (dataPart.id === Shape2D.SHAPE2D_FILLPARTID) {
                let fill = this.fill;
                if (fill instanceof SolidColorBrush2D) {
                    cat.push(Shape2D.SHAPE2D_CATEGORY_FILLSOLID);
                }
            }

            // Fill Part
            if (dataPart.id === Shape2D.SHAPE2D_BORDERPARTID) {
                let border = this.border;
                if (border instanceof SolidColorBrush2D) {
                    cat.push(Shape2D.SHAPE2D_CATEGORY_BORDERSOLID);
                }
            }

            return cat;
        }

        protected refreshInstanceDataParts(): boolean {
            if (!super.refreshInstanceDataParts()) {
                return false;
            }

            let d = <Shape2DInstanceData>this._instanceDataParts[0];

            if (this.border) {
                let border = this.border;
                if (border instanceof SolidColorBrush2D) {
                    d.borderSolidColor = border.color;
                }
            }

            if (this.fill) {
                let fill = this.fill;
                if (fill instanceof SolidColorBrush2D) {
                    d.fillSolidColor = fill.color;
                }
            }

            return true;
        }

        private _border: IBrush2D;
        private _fill: IBrush2D;
    }

    export class Shape2DInstanceData extends InstanceDataBase {
        @instanceData(Shape2D.SHAPE2D_CATEGORY_BORDERSOLID)
        get borderSolidColor(): Color4 {
            return null;
        }

        @instanceData(Shape2D.SHAPE2D_CATEGORY_FILLSOLID)
        get fillSolidColor(): Color4 {
            return null;
        }

    }


}