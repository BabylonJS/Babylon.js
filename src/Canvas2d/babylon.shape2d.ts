module BABYLON {
    @className("Shape2D")
    export class Shape2D<TInstData extends InstanceDataBase> extends RenderablePrim2D<TInstData> {
        static SHAPE2D_PROPCOUNT: number = RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 5;
        public static borderProperty: Prim2DPropInfo;
        public static fillProperty: Prim2DPropInfo;

        @modelLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 1, pi => Shape2D.borderProperty = pi, true)
        public get border(): IBorder2D {
            return this._border;
        }

        public set border(value: IBorder2D) {
            if (value === this._border) {
                return;
            }

            this._border = value;
        }

        @modelLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 2, pi => Shape2D.fillProperty = pi, true)
        public get fill(): IFill2D {
            return this._fill;
        }

        public set fill(value: IBorder2D) {
            if (value === this._fill) {
                return;
            }

            this._fill = value;
        }

        private _border: IBorder2D;
        private _fill: IFill2D;
    }


}