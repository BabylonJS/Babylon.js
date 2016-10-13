module BABYLON {

    @className("Button", "BABYLON")
    export class Button extends ContentControl {

        static BUTTON_PROPCOUNT = ContentControl.CONTENTCONTROL_PROPCOUNT + 3;

        static isPushedProperty: Prim2DPropInfo;
        static isDefaultProperty: Prim2DPropInfo;
        static isOutlineProperty: Prim2DPropInfo;

        constructor(settings?: {

            id              ?: string,
            parent          ?: UIElement,
            templateName    ?: string,
            styleName       ?: string,
            content         ?: any,
            contentAlignment?: string,
            marginTop       ?: number | string,
            marginLeft      ?: number | string,
            marginRight     ?: number | string,
            marginBottom    ?: number | string,
            margin          ?: number | string,
            marginHAlignment?: number,
            marginVAlignment?: number,
            marginAlignment ?: string,
            paddingTop      ?: number | string,
            paddingLeft     ?: number | string,
            paddingRight    ?: number | string,
            paddingBottom   ?: number | string,
            padding         ?: string,
        }) {
            if (!settings) {
                settings = {};
            }

            super(settings);

            // For a button the default contentAlignemnt is center/center
            if (settings.contentAlignment == null) {
                this.contentAlignment.horizontal = PrimitiveAlignment.AlignCenter;
                this.contentAlignment.vertical = PrimitiveAlignment.AlignCenter;
            }
            this.normalEnabledBackground    = Canvas2D.GetSolidColorBrushFromHex("#337AB7FF");
            this.normalDisabledBackground   = Canvas2D.GetSolidColorBrushFromHex("#7BA9D0FF");
            this.normalMouseOverBackground  = Canvas2D.GetSolidColorBrushFromHex("#286090FF");
            this.normalPushedBackground     = Canvas2D.GetSolidColorBrushFromHex("#1E496EFF");
            this.normalEnabledBorder        = Canvas2D.GetSolidColorBrushFromHex("#2E6DA4FF");
            this.normalDisabledBorder       = Canvas2D.GetSolidColorBrushFromHex("#77A0C4FF");
            this.normalMouseOverBorder      = Canvas2D.GetSolidColorBrushFromHex("#204D74FF");
            this.normalPushedBorder         = Canvas2D.GetSolidColorBrushFromHex("#2E5D9EFF");

            this.defaultEnabledBackground   = Canvas2D.GetSolidColorBrushFromHex("#FFFFFFFF");
            this.defaultDisabledBackground  = Canvas2D.GetSolidColorBrushFromHex("#FFFFFFFF");
            this.defaultMouseOverBackground = Canvas2D.GetSolidColorBrushFromHex("#E6E6E6FF");
            this.defaultPushedBackground    = Canvas2D.GetSolidColorBrushFromHex("#D4D4D4FF");
            this.defaultEnabledBorder       = Canvas2D.GetSolidColorBrushFromHex("#CCCCCCFF");
            this.defaultDisabledBorder      = Canvas2D.GetSolidColorBrushFromHex("#DEDEDEFF");
            this.defaultMouseOverBorder     = Canvas2D.GetSolidColorBrushFromHex("#ADADADFF");
            this.defaultPushedBorder        = Canvas2D.GetSolidColorBrushFromHex("#6C8EC5FF");
        }

        @dependencyProperty(ContentControl.CONTROL_PROPCOUNT + 0, pi => Button.isPushedProperty = pi)
        public get isPushed(): boolean {
            return this._isPushed;
        }

        public set isPushed(value: boolean) {
            this._isPushed = value;
        }

        @dependencyProperty(ContentControl.CONTROL_PROPCOUNT + 1, pi => Button.isDefaultProperty = pi)
        public get isDefault(): boolean {
            return this._isDefault;
        }

        public set isDefault(value: boolean) {
            this._isDefault = value;
        }

        @dependencyProperty(ContentControl.CONTROL_PROPCOUNT + 2, pi => Button.isOutlineProperty = pi)
        public get isOutline(): boolean {
            return this._isOutline;
        }

        public set isOutline(value: boolean) {
            this._isOutline = value;
        }

        public get clickObservable(): Observable<Button> {
            if (!this._clickObservable) {
                this._clickObservable = new Observable<Button>();
            }
            return this._clickObservable;
        }

        public _raiseClick() {
            console.log("click");
        }

        protected createVisualTree() {
            super.createVisualTree();
            let p = this._visualPlaceholder;
            p.pointerEventObservable.add((e, s) => {
                // We reject an event coming from the placeholder because it means it's on an empty spot, so it's not valid.
                if (e.relatedTarget === this._visualPlaceholder) {
                    return;
                }

                if (s.mask === PrimitivePointerInfo.PointerUp) {
                    this._raiseClick();
                    this.isPushed = false;
                } else if (s.mask === PrimitivePointerInfo.PointerDown) {
                    this.isPushed = true;
                }

            }, PrimitivePointerInfo.PointerUp|PrimitivePointerInfo.PointerDown);
        }

        private _isPushed: boolean;
        private _isDefault: boolean;
        private _isOutline: boolean;
        private _clickObservable: Observable<Button>;

        protected get _position(): Vector2 {
            return Vector2.Zero();
        }

        public normalEnabledBackground  : IBrush2D;
        public normalDisabledBackground : IBrush2D;
        public normalMouseOverBackground: IBrush2D;
        public normalPushedBackground   : IBrush2D;
        public normalEnabledBorder      : IBrush2D;
        public normalDisabledBorder     : IBrush2D;
        public normalMouseOverBorder    : IBrush2D;
        public normalPushedBorder       : IBrush2D;

        public defaultEnabledBackground  : IBrush2D;
        public defaultDisabledBackground : IBrush2D;
        public defaultMouseOverBackground: IBrush2D;
        public defaultPushedBackground   : IBrush2D;
        public defaultEnabledBorder      : IBrush2D;
        public defaultDisabledBorder     : IBrush2D;
        public defaultMouseOverBorder    : IBrush2D;
        public defaultPushedBorder       : IBrush2D;
    }

    @registerWindowRenderingTemplate("BABYLON.Button", "Default", () => new DefaultButtonRenderingTemplate())
    export class DefaultButtonRenderingTemplate extends UIElementRenderingTemplateBase {

        createVisualTree(owner: UIElement, visualPlaceholder: Group2D): { root: Prim2DBase; contentPlaceholder: Prim2DBase } {
            this._rect = new Rectangle2D({ parent: visualPlaceholder, fill: "#FF8080FF", border: "#FF8080FF", roundRadius: 10, borderThickness: 2 });

            this.stateChange();
            return { root: this._rect, contentPlaceholder: this._rect };
        }

        attach(owner: UIElement): void {
            super.attach(owner);

            this.owner.propertyChanged.add((e, s) => this.stateChange(),
                UIElement.isEnabledProperty.flagId   |
                UIElement.isFocusedProperty.flagId   |
                UIElement.isMouseOverProperty.flagId |
                Button.isDefaultProperty.flagId      |
                Button.isOutlineProperty.flagId      |
                Button.isPushedProperty.flagId);
        }

        stateChange(): void {
            let b = <Button>this.owner;
            let bg = b.isDefault ? b.defaultEnabledBackground : b.normalEnabledBackground;
            let bd = b.isDefault ? b.defaultEnabledBorder : b.normalEnabledBorder;

            if (b.isPushed) {
                if (b.isDefault) {
                    bg = b.defaultPushedBackground;
                    bd = b.defaultPushedBorder;
                } else {
                    bg = b.normalPushedBackground;
                    bd = b.normalPushedBorder;
                }
            } else if (b.isMouseOver) {
                console.log("MouseOver Style");
                if (b.isDefault) {
                    bg = b.defaultMouseOverBackground;
                    bd = b.defaultMouseOverBorder;
                } else {
                    bg = b.normalMouseOverBackground;
                    bd = b.normalMouseOverBorder;
                }
            } else if (!b.isEnabled) {
                if (b.isDefault) {
                    bg = b.defaultDisabledBackground;
                    bd = b.defaultDisabledBorder;
                } else {
                    bg = b.normalDisabledBackground;
                    bd = b.normalDisabledBorder;
                }
            }

            this._rect.fill = bg;
            this._rect.border = bd;
        }

        private _rect: Rectangle2D;
    }
}