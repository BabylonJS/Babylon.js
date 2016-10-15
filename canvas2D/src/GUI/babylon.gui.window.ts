module BABYLON {
    @className("Window", "BABYLON")
    export class Window extends ContentControl {
        static WINDOW_PROPCOUNT = ContentControl.CONTENTCONTROL_PROPCOUNT + 2;

        static leftProperty: Prim2DPropInfo;
        static bottomProperty: Prim2DPropInfo;
        static positionProperty: Prim2DPropInfo;

        constructor(scene: Scene, settings?: {

            id              ?: string,
            templateName    ?: string,
            styleName       ?: string,
            content         ?: any,
            contentAlignment?: string,
            left            ?: number,
            bottom          ?: number,
            minWidth        ?: number,
            minHeight       ?: number,
            maxWidth        ?: number,
            maxHeight       ?: number,
            width           ?: number,
            height          ?: number,
            worldPosition   ?: Vector3,
            worldRotation   ?: Quaternion,
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

            if (!this._UIElementVisualToBuildList) {
                this._UIElementVisualToBuildList = new Array<UIElement>();
            }

            // Patch the owner and also the parent property through the whole tree
            this._patchUIElement(this, null);

            // Screen Space UI
            if (!settings.worldPosition && !settings.worldRotation) {
                this._canvas = Window.getScreenCanvas(scene);
                this._isWorldSpaceCanvas = false;
                this._left = (settings.left != null) ? settings.left : 0;
                this._bottom = (settings.bottom != null) ? settings.bottom : 0;
            }

            // WorldSpace UI
            else {
                let w = (settings.width == null) ? 100 : settings.width;
                let h = (settings.height == null) ? 100 : settings.height;
                let wpos = (settings.worldPosition == null) ? Vector3.Zero() : settings.worldPosition;
                let wrot = (settings.worldRotation == null) ? Quaternion.Identity() : settings.worldRotation;
                this._canvas = new WorldSpaceCanvas2D(scene, new Size(w, h), { id: "GUI Canvas", cachingStrategy: Canvas2D.CACHESTRATEGY_DONTCACHE, worldPosition: wpos, worldRotation: wrot });
                this._isWorldSpaceCanvas = true;
            }

            this._renderObserver = this._canvas.renderObservable.add((e, s) => this._canvasPreRender(), Canvas2D.RENDEROBSERVABLE_PRE);
            this._disposeObserver = this._canvas.disposeObservable.add((e, s) => this._canvasDisposed());
            this._canvas.propertyChanged.add((e, s) => {
                if (e.propertyName === "overPrim") {
                    this._overPrimChanged(e.oldValue, e.newValue);
                }
            });
            this._mouseOverUIElement = null;
        }

        public get canvas(): Canvas2D {
            return this._canvas;
        }

        @dependencyProperty(ContentControl.CONTENTCONTROL_PROPCOUNT + 0, pi => Window.leftProperty = pi)
        public get left(): number {
            return this._left;
        }

        public set left(value: number) {
            let old = new Vector2(this._left, this._bottom);
            this._left = value;
            this.onPropertyChanged("_position", old, this._position);
        }

        @dependencyProperty(ContentControl.CONTENTCONTROL_PROPCOUNT + 1, pi => Window.bottomProperty = pi)
        public get bottom(): number {
            return this._bottom;
        }

        public set bottom(value: number) {
            let old = new Vector2(this._left, this._bottom);
            this._bottom = value;
            this.onPropertyChanged("_position", old, this._position);
        }

        @dependencyProperty(ContentControl.CONTENTCONTROL_PROPCOUNT + 2, pi => Window.positionProperty = pi)
        public get position(): Vector2 {
            return this._position;
        }

        public set position(value: Vector2) {
            this._left = value.x;
            this._bottom = value.y;
        }

        protected get _position(): Vector2 {
            return new Vector2(this.left, this.bottom);
        }

        protected createVisualTree() {
            super.createVisualTree();
            let p = this._visualPlaceholder;
            p.createSimpleDataBinding(Group2D.positionProperty, "position");
        }

        public _registerVisualToBuild(uiel: UIElement) {
            if (uiel._isFlagSet(UIElement.flagVisualToBuild)) {
                return;
            }

            if (!this._UIElementVisualToBuildList) {
                this._UIElementVisualToBuildList = new Array<UIElement>();
            }

            this._UIElementVisualToBuildList.push(uiel);
            uiel._setFlags(UIElement.flagVisualToBuild);
        }

        private _overPrimChanged(oldPrim: Prim2DBase, newPrim: Prim2DBase) {
            let curOverEl = this._mouseOverUIElement;
            let newOverEl: UIElement = null;

            let curGroup = newPrim ? newPrim.traverseUp(p => p instanceof Group2D) : null;
            while (curGroup) {
                let uiel = curGroup.getExternalData<UIElement>("_GUIOwnerElement_");
                if (uiel) {
                    newOverEl = uiel;
                    break;
                }
                curGroup = curGroup.parent ? curGroup.parent.traverseUp(p => p instanceof Group2D) : null;
            }

            if (curOverEl === newOverEl) {
                return;
            }

            if (curOverEl) {
                curOverEl.isMouseOver = false;
            }

            if (newOverEl) {
                newOverEl.isMouseOver = true;
            }

            this._mouseOverUIElement = newOverEl;
        }

        private _canvasPreRender() {

            // Check if we have visual to create
            if (this._UIElementVisualToBuildList.length > 0) {
                // Sort the UI Element to get the highest (so lowest hierarchy depth) in the hierarchy tree first
                let sortedElementList = this._UIElementVisualToBuildList.sort((a, b) => a.hierarchyDepth - b.hierarchyDepth);

                for (let el of sortedElementList) {
                    el._createVisualTree();
                }

                this._UIElementVisualToBuildList.splice(0);
            }
        }

        private _canvasDisposed() {


            this._canvas.disposeObservable.remove(this._disposeObserver);
            this._canvas.renderObservable.remove(this._renderObserver);
        }

        private _canvas: Canvas2D;
        private _left: number;
        private _bottom: number;
        private _isWorldSpaceCanvas: boolean;
        private _renderObserver: Observer<Canvas2D>;
        private _disposeObserver: Observer<SmartPropertyBase>;
        private _UIElementVisualToBuildList: Array<UIElement>;
        private _mouseOverUIElement: UIElement;

        private static getScreenCanvas(scene: Scene): ScreenSpaceCanvas2D {
            let canvas = Tools.first(Window._screenCanvasList, c => c.scene === scene);
            if (canvas) {
                return canvas;
            }

            canvas = new ScreenSpaceCanvas2D(scene, { id: "GUI Canvas", cachingStrategy: Canvas2D.CACHESTRATEGY_DONTCACHE });
            Window._screenCanvasList.push(canvas);

            return canvas;
        }

        private static _screenCanvasList: Array<ScreenSpaceCanvas2D> = new Array<ScreenSpaceCanvas2D>();
    }

    @registerWindowRenderingTemplate("BABYLON.Window", "Default", () => new DefaultWindowRenderingTemplate ())
    export class DefaultWindowRenderingTemplate extends UIElementRenderingTemplateBase {

        createVisualTree(owner: UIElement, visualPlaceholder: Group2D): { root: Prim2DBase; contentPlaceholder: Prim2DBase } {

            let r = new Rectangle2D({ parent: visualPlaceholder, fill: "#808080FF" });

            return { root: r, contentPlaceholder: r };
        }
    }
}