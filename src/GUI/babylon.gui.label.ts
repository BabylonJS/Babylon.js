module BABYLON {

    @className("Label", "BABYLON")
    export class Label extends Control {

        static textProperty: Prim2DPropInfo;

        constructor(settings?: {

            id              ?: string,
            parent          ?: UIElement,
            templateName    ?: string,
            styleName       ?: string,
            text            ?: string,
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

            if (settings.text != null) {
                this.text = settings.text;
            }
        }

        protected get _position(): Vector2 {
            return Vector2.Zero();
        }

        private static _emptyArray = new Array<UIElement>();
        protected _getChildren(): UIElement[] {
            return Label._emptyArray;
        }

        protected createVisualTree() {
            super.createVisualTree();
            let p = this._visualChildrenPlaceholder;

        }

        @dependencyProperty(Control.CONTROL_PROPCOUNT + 0, pi => Label.textProperty = pi)
        public get text(): string {
            return this._text;
        }

        public set text(value: string) {
            this._text = value;
        }

        private _text: string;

    }

    @registerWindowRenderingTemplate("BABYLON.Label", "Default", () => new DefaultLabelRenderingTemplate())
    export class DefaultLabelRenderingTemplate extends UIElementRenderingTemplateBase {

        createVisualTree(owner: UIElement, visualPlaceholder: Group2D): { root: Prim2DBase; contentPlaceholder: Prim2DBase } {
            let r = new Text2D("", { parent: visualPlaceholder });
            r.createSimpleDataBinding(Text2D.textProperty, "text");

            return { root: r, contentPlaceholder: r };
        }
    }
}