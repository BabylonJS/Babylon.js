module BABYLON {

    @className("Button", "BABYLON")
    export class Button extends ContentControl {

        static get pushedState() {
            return Button._pushedState;
        }

        static BUTTON_PROPCOUNT = ContentControl.CONTENTCONTROL_PROPCOUNT + 3;

        static isPushedProperty: Prim2DPropInfo;
        static isDefaultProperty: Prim2DPropInfo;
        static isOutlineProperty: Prim2DPropInfo;

        constructor(settings?: {

            id               ?: string,
            parent           ?: UIElement,
            templateName     ?: string,
            styleName        ?: string,
            content          ?: any,
            marginTop        ?: number | string,
            marginLeft       ?: number | string,
            marginRight      ?: number | string,
            marginBottom     ?: number | string,
            margin           ?: number | string,
            marginHAlignment ?: number,
            marginVAlignment ?: number,
            marginAlignment  ?: string,
            paddingTop       ?: number | string,
            paddingLeft      ?: number | string,
            paddingRight     ?: number | string,
            paddingBottom    ?: number | string,
            padding          ?: string,
            paddingHAlignment?: number,
            paddingVAlignment?: number,
            paddingAlignment ?: string,
        }) {
            if (!settings) {
                settings = {};
            }

            super(settings);

            if (settings.paddingAlignment == null) {
                this.paddingAlignment.horizontal = PrimitiveAlignment.AlignCenter;
                this.paddingAlignment.vertical = PrimitiveAlignment.AlignCenter;
            }

            this._normalStateBackground  = new ObservableStringDictionary<IBrush2D>(false);
            this._normalStateBorder      = new ObservableStringDictionary<IBrush2D>(false);
            this._defaultStateBackground = new ObservableStringDictionary<IBrush2D>(false);
            this._defaultStateBorder     = new ObservableStringDictionary<IBrush2D>(false);

            this._normalStateBackground.add(UIElement.enabledState   , Canvas2D.GetSolidColorBrushFromHex("#337AB7FF"));
            this._normalStateBackground.add(UIElement.disabledState  , Canvas2D.GetSolidColorBrushFromHex("#7BA9D0FF"));
            this._normalStateBackground.add(UIElement.mouseOverState , Canvas2D.GetSolidColorBrushFromHex("#286090FF"));
            this._normalStateBackground.add(Button.pushedState       , Canvas2D.GetSolidColorBrushFromHex("#1E496EFF"));
            this._normalStateBorder.add(UIElement.enabledState       , Canvas2D.GetSolidColorBrushFromHex("#2E6DA4FF"));
            this._normalStateBorder.add(UIElement.disabledState      , Canvas2D.GetSolidColorBrushFromHex("#77A0C4FF"));
            this._normalStateBorder.add(UIElement.mouseOverState     , Canvas2D.GetSolidColorBrushFromHex("#204D74FF"));
            this._normalStateBorder.add(Button.pushedState           , Canvas2D.GetSolidColorBrushFromHex("#2E5D9EFF"));

            this._defaultStateBackground.add(UIElement.enabledState   , Canvas2D.GetSolidColorBrushFromHex("#FFFFFFFF"));
            this._defaultStateBackground.add(UIElement.disabledState  , Canvas2D.GetSolidColorBrushFromHex("#FFFFFFFF"));
            this._defaultStateBackground.add(UIElement.mouseOverState , Canvas2D.GetSolidColorBrushFromHex("#E6E6E6FF"));
            this._defaultStateBackground.add(Button.pushedState       , Canvas2D.GetSolidColorBrushFromHex("#D4D4D4FF"));
            this._defaultStateBorder.add(UIElement.enabledState       , Canvas2D.GetSolidColorBrushFromHex("#CCCCCCFF"));
            this._defaultStateBorder.add(UIElement.disabledState      , Canvas2D.GetSolidColorBrushFromHex("#DEDEDEFF"));
            this._defaultStateBorder.add(UIElement.mouseOverState     , Canvas2D.GetSolidColorBrushFromHex("#ADADADFF"));
            this._defaultStateBorder.add(Button.pushedState           , Canvas2D.GetSolidColorBrushFromHex("#6C8EC5FF"));
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
            if (this._clickObservable && this._clickObservable.hasObservers()) {
                this._clickObservable.notifyObservers(this);
            }
        }

        protected createVisualTree() {
            super.createVisualTree();
            let p = this._visualPlaceholder;
            p.pointerEventObservable.add((e, s) => {
                // check if input must be discarded
                if (!this.isVisible || !this.isEnabled) {
                    return;
                }

                // We reject an event coming from the placeholder because it means it's on an empty spot, so it's not valid.
                if (e.relatedTarget === this._visualPlaceholder) {
                    return;
                }

                if (s.mask === PrimitivePointerInfo.PointerUp) {
                    this._raiseClick();
                    this.isPushed = false;
                } else if (s.mask === PrimitivePointerInfo.PointerDown) {
                    this.isPushed = true;
                    this.isFocused = true;
                }

            }, PrimitivePointerInfo.PointerUp|PrimitivePointerInfo.PointerDown);
        }

        public get normalStateBackground(): ObservableStringDictionary<IBrush2D> {
            return this._normalStateBackground;
        }

        public get defaultStateBackground(): ObservableStringDictionary<IBrush2D> {
            return this._defaultStateBackground;
        }

        public get normalStateBorder(): ObservableStringDictionary<IBrush2D> {
            return this._normalStateBorder;
        }

        public get defaultStateBorder(): ObservableStringDictionary<IBrush2D> {
            return this._defaultStateBorder;
        }

        private _normalStateBackground: ObservableStringDictionary<IBrush2D>;
        private _normalStateBorder: ObservableStringDictionary<IBrush2D>;
        private _defaultStateBackground: ObservableStringDictionary<IBrush2D>;
        private _defaultStateBorder: ObservableStringDictionary<IBrush2D>;
        private _isPushed: boolean;
        private _isDefault: boolean;
        private _isOutline: boolean;
        private _clickObservable: Observable<Button>;

        private static _pushedState = "Pushed";
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

            // Register for brush change and update the Visual
            let button = <Button>owner;
            button.normalStateBackground.dictionaryChanged.add ((e, c) => this.stateChange());
            button.normalStateBorder.dictionaryChanged.add     ((e, c) => this.stateChange());
            button.defaultStateBackground.dictionaryChanged.add((e, c) => this.stateChange());
            button.defaultStateBorder.dictionaryChanged.add    ((e, c) => this.stateChange());
        }

        stateChange(): void {
            //console.log("state changed");
            let b = <Button>this.owner;
            let state = UIElement.enabledState;
            let bg = b.isDefault ? b.defaultStateBackground.get(state) : b.normalStateBackground.get(state);
            let bd = b.isDefault ? b.defaultStateBorder.get(state) : b.normalStateBorder.get(state);

            if (b.isPushed) {
                state = Button.pushedState;
                if (b.isDefault) {
                    bg = b.defaultStateBackground.get(state);
                    bd = b.defaultStateBorder.get(state);
                } else {
                    bg = b.normalStateBackground.get(state);
                    bd = b.normalStateBorder.get(state);
                }
            } else if (b.isMouseOver) {
                state = UIElement.mouseOverState;
                if (b.isDefault) {
                    bg = b.defaultStateBackground.get(state);
                    bd = b.defaultStateBorder.get(state);
                } else {
                    bg = b.normalStateBackground.get(state);
                    bd = b.normalStateBorder.get(state);
                }
            } else if (!b.isEnabled) {
                state = UIElement.disabledState;
                if (b.isDefault) {
                    bg = b.defaultStateBackground.get(state);
                    bd = b.defaultStateBorder.get(state);
                } else {
                    bg = b.normalStateBackground.get(state);
                    bd = b.normalStateBorder.get(state);
                }
            }

            this._rect.fill = bg;
            this._rect.border = bd;
        }

        private _rect: Rectangle2D;
    }
}