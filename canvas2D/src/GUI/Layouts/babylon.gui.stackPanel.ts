module BABYLON {

    @className("StackPanel", "BABYLON")
    export class StackPanel extends UIElement {

        static STACKPANEL_PROPCOUNT = UIElement.UIELEMENT_PROPCOUNT + 3;

        static orientationHorizontalProperty: Prim2DPropInfo;

        constructor(settings?: {

            id                      ?: string,
            parent                  ?: UIElement,
            children                ?: Array<UIElement>,
            templateName            ?: string,
            styleName               ?: string,
            isOrientationHorizontal ?: any,
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
            padding                 ?: string,
            paddingHAlignment       ?: number,
            paddingVAlignment       ?: number,
            paddingAlignment        ?: string,
        }) {
            if (!settings) {
                settings = {};
            }

            super(settings);

            this.isOrientationHorizontal = (settings.isOrientationHorizontal == null) ? true : settings.isOrientationHorizontal;
            this._children = new Array<UIElement>();

            if (settings.children != null) {
                for (let child of settings.children) {
                    this._children.push(child);
                }
            }

        }

        @dependencyProperty(StackPanel.STACKPANEL_PROPCOUNT + 0, pi => StackPanel.orientationHorizontalProperty = pi)
        public get isOrientationHorizontal(): boolean {
            return this._isOrientationHorizontal;
        }

        public set isOrientationHorizontal(value: boolean) {
            this._isOrientationHorizontal = value;
        }

        protected createVisualTree() {
            super.createVisualTree();

            // A StackPanel Control has a Group2D, child of the visualPlaceHolder, which is the Children placeholder.
            // The Children UIElement Tree will be create inside this placeholder.
            this._childrenPlaceholder = new Group2D({ parent: this._visualPlaceholder, id: `StackPanel Children Placeholder of ${this.id}` });
            let p = this._childrenPlaceholder;

            p.layoutEngine = this.isOrientationHorizontal ? StackPanelLayoutEngine.Horizontal : StackPanelLayoutEngine.Vertical;

            // The UIElement padding properties (padding and paddingAlignment) are bound to the Group2D Children placeholder, we bound to the Margin properties as the Group2D acts as an inner element already, so margin of inner is padding.
            p.dataSource = this;
            p.createSimpleDataBinding(Prim2DBase.marginProperty, "padding", DataBinding.MODE_ONEWAY);
            p.createSimpleDataBinding(Prim2DBase.marginAlignmentProperty, "paddingAlignment", DataBinding.MODE_ONEWAY);

            // The UIElement set the childrenPlaceholder with the visual returned by the renderingTemplate.
            // But it's not the case for a StackPanel, the placeholder of UIElement Children (the content)
            this._visualChildrenPlaceholder = this._childrenPlaceholder;
        }

        public get children(): Array<UIElement> {
            return this._children;
        }

        protected _getChildren(): Array<UIElement> {
            return this.children;
        }

        private _childrenPlaceholder: Group2D;
        private _children;
        private _isOrientationHorizontal: boolean;
    }


    @registerWindowRenderingTemplate("BABYLON.StackPanel", "Default", () => new DefaultStackPanelRenderingTemplate())
    export class DefaultStackPanelRenderingTemplate extends UIElementRenderingTemplateBase {

        createVisualTree(owner: UIElement, visualPlaceholder: Group2D): { root: Prim2DBase; contentPlaceholder: Prim2DBase } {
            return { root: visualPlaceholder, contentPlaceholder: visualPlaceholder };
        }

        attach(owner: UIElement): void {
            super.attach(owner);
        }
    }
}