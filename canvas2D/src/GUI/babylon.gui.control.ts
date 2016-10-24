module BABYLON {

    @className("Control", "BABYLON")
    export abstract class Control extends UIElement {
        static CONTROL_PROPCOUNT = UIElement.UIELEMENT_PROPCOUNT + 5;

        static backgroundProperty     : Prim2DPropInfo;
        static borderProperty         : Prim2DPropInfo;
        static borderThicknessProperty: Prim2DPropInfo;
        static fontNameProperty       : Prim2DPropInfo;
        static foregroundProperty     : Prim2DPropInfo;

        constructor(settings: {
            id?: string,
            templateName?: string,
            styleName?: string,
        }) {
            super(settings);
        }

        @dependencyProperty(UIElement.UIELEMENT_PROPCOUNT + 0, pi => Control.backgroundProperty = pi)
        public get background(): StringDictionary<IBrush2D> {
            if (!this._background) {
                this._background = new ObservableStringDictionary<IBrush2D>(false);
            }
            return this._background;
        }

        public set background(value: StringDictionary<IBrush2D>) {
            this.background.copyFrom(value);
        }

        @dependencyProperty(UIElement.UIELEMENT_PROPCOUNT + 1, pi => Control.borderProperty = pi)
        public get border(): IBrush2D {
            return this._border;
        }

        public set border(value: IBrush2D) {
            this._border = value;
        }

        @dependencyProperty(UIElement.UIELEMENT_PROPCOUNT + 2, pi => Control.borderThicknessProperty = pi)
        public get borderThickness(): number {
            return this._borderThickness;
        }

        public set borderThickness(value: number) {
            this._borderThickness = value;
        }

        @dependencyProperty(UIElement.UIELEMENT_PROPCOUNT + 3, pi => Control.fontNameProperty = pi)
        public get fontName(): string {
            return this._fontName;
        }

        public set fontName(value: string) {
            this._fontName = value;
        }

        @dependencyProperty(UIElement.UIELEMENT_PROPCOUNT + 4, pi => Control.foregroundProperty = pi)
        public get foreground(): IBrush2D {
            return this._foreground;
        }

        public set foreground(value: IBrush2D) {
            this._foreground = value;
        }

        private _background: ObservableStringDictionary<IBrush2D>;
        private _border: IBrush2D;
        private _borderThickness: number;
        private _fontName: string;
        private _foreground: IBrush2D;
    }
}