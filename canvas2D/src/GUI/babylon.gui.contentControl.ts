module BABYLON {


    @className("ContentControl", "BABYLON")
    export abstract class ContentControl extends Control {
        static CONTENTCONTROL_PROPCOUNT = Control.CONTROL_PROPCOUNT + 2;

        static contentProperty: Prim2DPropInfo;

        constructor(settings?: {
            id              ?: string,
            templateName    ?: string,
            styleName       ?: string,
            content         ?: any,
        }) {
            if (!settings) {
                settings = {};
            }

            super(settings);

            if (settings.content!=null) {
                this._content = settings.content;
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

        protected get _contentUIElement(): UIElement {
            if (!this.__contentUIElement) {
                this._buildContentUIElement();
            }

            return this.__contentUIElement;
        }

        public _createVisualTree() {
            // Base implementation will create the Group2D for the Visual Placeholder and its Visual Tree
            super._createVisualTree();

            // A Content Control has a Group2D, child of the visualPlaceHolder, which is the Content placeholder.
            // The Content UIElement Tree will be create inside this placeholder.
            this._contentPlaceholder = new Group2D({ parent: this._visualPlaceholder, id: `ContentControl Content Placeholder of ${this.id}` });
            let p = this._contentPlaceholder;

            // The UIElement padding properties (padding and paddingAlignment) are bound to the Group2D Content placeholder, we bound to the Margin properties as the Group2D acts as an inner element already, so margin of inner is padding.
            p.dataSource = this;
            p.createSimpleDataBinding(Prim2DBase.marginProperty, "padding", DataBinding.MODE_ONEWAY);
            p.createSimpleDataBinding(Prim2DBase.marginAlignmentProperty, "paddingAlignment", DataBinding.MODE_ONEWAY);

            // The UIElement set the childrenPlaceholder with the visual returned by the renderingTemplate.
            // But it's not the case for a ContentControl, the placeholder of UIElement Children (the content)
            this._visualChildrenPlaceholder = this._contentPlaceholder;
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

                this.__contentUIElement = l;
            }

            // Data Template!
            else {
                // TODO: DataTemplate lookup and create instance
            }

            if (this.__contentUIElement) {
                this.__contentUIElement._patchUIElement(this.ownerWindow, this);               
            }
        }

        private _contentPlaceholder: Group2D;
        private _content: any;
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