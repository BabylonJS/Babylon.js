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


    @className("ContentControl", "BABYLON")
    export abstract class ContentControl extends Control {
        static CONTENTCONTROL_PROPCOUNT = Control.CONTROL_PROPCOUNT + 2;

        static contentProperty: Prim2DPropInfo;
        static contentAlignmentProperty: Prim2DPropInfo;

        constructor(settings?: {
            id              ?: string,
            templateName    ?: string,
            styleName       ?: string,
            content         ?: any,
            contentAlignment?: string,
        }) {
            if (!settings) {
                settings = {};
            }

            super(settings);

            if (settings.content!=null) {
                this._content = settings.content;
            }

            if (settings.contentAlignment != null) {
                this.contentAlignment.fromString(settings.contentAlignment);
            }
        }

        dispose(): boolean {
            if (this.isDisposed) {
                return false;
            }

            if (this.content && this.content.dispose) {
                this.content.dispose();
                this.content = null;
            }

            if (this.__contentUIElement) {
                this.__contentUIElement.dispose();
                this.__contentUIElement = null;
            }

            super.dispose();

            return true;
        }

        @dependencyProperty(Control.CONTROL_PROPCOUNT + 0, pi => ContentControl.contentProperty = pi)
        public get content(): any {
            return this._content;
        }

        public set content(value: any) {
            this._content = value;
        }

        @dependencyProperty(Control.CONTROL_PROPCOUNT + 1, pi => ContentControl.contentAlignmentProperty = pi)
        public get contentAlignment(): PrimitiveAlignment {
            if (!this._contentAlignment) {
                this._contentAlignment = new PrimitiveAlignment();
            }
            return this._contentAlignment;
        }

        public set contentAlignment(value: PrimitiveAlignment) {
            this.contentAlignment.copyFrom(value);
        }

        /**
         * Check if there a contentAlignment specified (non null and not default)
         */
        public get _hasContentAlignment(): boolean {
            return (this._contentAlignment !== null && !this._contentAlignment.isDefault);
        }

        protected get _contentUIElement(): UIElement {
            if (!this.__contentUIElement) {
                this._buildContentUIElement();
            }

            return this.__contentUIElement;
        }

        private _buildContentUIElement() {
            let c = this._content;
            this.__contentUIElement = null;

            // Already a UIElement
            if (c instanceof UIElement) {
                this.__contentUIElement = c;
            }

            // Test primary types
            else if ((typeof c === "string") || (typeof c === "boolean") || (typeof c === "number")) {
                let l = new Label({ parent: this, id: "Content of " + this.id });
                let binding = new DataBinding();
                binding.propertyPathName = "content";
                binding.stringFormat = v => `${v}`;
                binding.dataSource = this;
                l.createDataBinding(Label.textProperty, binding);

                binding = new DataBinding();
                binding.propertyPathName = "contentAlignment";
                binding.dataSource = this;
                l.createDataBinding(Label.marginAlignmentProperty, binding);

                this.__contentUIElement = l;
            }

            // Data Template!
            else {
                // TODO: DataTemplate lookup and create instance
            }

            if (this.__contentUIElement) {
                this.__contentUIElement._patchUIElement(this.ownerWindows, this);               
            }
        }

        private _content: any;
        private _contentAlignment: PrimitiveAlignment;
        private __contentUIElement: UIElement;

        protected _getChildren(): Array<UIElement> {
            let children = new Array<UIElement>();

            if (this.content) {
                children.push(this._contentUIElement);
            }

            return children;
        }
    }
}