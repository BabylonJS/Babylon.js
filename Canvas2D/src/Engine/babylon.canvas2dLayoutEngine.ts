module BABYLON {

    @className("LayoutEngineBase", "BABYLON")
    /**
     * This is the base class you have to extend in order to implement your own Layout Engine.
     * Note that for performance reason, each different Layout Engine type can be exposed as one/many singleton or must be instanced each time.
     * If data has to be associated to a given primitive you can use the SmartPropertyPrim.addExternalData API to do it.
     */
    export class LayoutEngineBase implements ILockable {
        constructor() {
            this.layoutDirtyOnPropertyChangedMask = 0;
        }

        public updateLayout(prim: Prim2DBase) {
        }

        public get isChildPositionAllowed(): boolean {
            return false;
        }

        isLocked(): boolean {
            return this._isLocked;
        }

        lock(): boolean {
            if (this._isLocked) {
                return false;
            }
            this._isLocked = true;
            return true;
        }

        public layoutDirtyOnPropertyChangedMask;

        private _isLocked: boolean;
    }

    @className("CanvasLayoutEngine", "BABYLON")
    /**
     * The default Layout Engine, primitive are positioning into a Canvas, using their x/y coordinates.
     * This layout must be used as a Singleton through the CanvasLayoutEngine.Singleton property.
     */
    export class CanvasLayoutEngine extends LayoutEngineBase {
        public static Singleton: CanvasLayoutEngine = new CanvasLayoutEngine();

        // A very simple (no) layout computing...
        // The Canvas and its direct children gets the Canvas' size as Layout Area
        // Indirect children have their Layout Area to the actualSize (margin area) of their parent
        public updateLayout(prim: Prim2DBase) {

            // If this prim is layoutDiry we update  its layoutArea and also the one of its direct children
            if (prim._isFlagSet(SmartPropertyPrim.flagLayoutDirty)) {

                for (let child of prim.children) {
                    this._doUpdate(child);
                }
                prim._clearFlags(SmartPropertyPrim.flagLayoutDirty);
            }

        }

        private _doUpdate(prim: Prim2DBase) {
            // Canvas ?
            if (prim instanceof Canvas2D) {
                prim.layoutArea = prim.actualSize;
            }

            // Direct child of Canvas ?
            else if (prim.parent instanceof Canvas2D) {
                prim.layoutArea = prim.owner.actualSize;
            }

            // Indirect child of Canvas
            else {
                prim.layoutArea = prim.parent.contentArea;
            }
        }

        get isChildPositionAllowed(): boolean {
            return true;
        }
    }


    @className("StackPanelLayoutEngine", "BABYLON")
    /**
     * A stack panel layout. Primitive will be stack either horizontally or vertically.
     * This Layout type must be used as a Singleton, use the StackPanelLayoutEngine.Horizontal for an horizontal stack panel or StackPanelLayoutEngine.Vertical for a vertical one.
     */
    export class StackPanelLayoutEngine extends LayoutEngineBase {
        constructor() {
            super();
            this.layoutDirtyOnPropertyChangedMask = Prim2DBase.sizeProperty.flagId;
        }

        public static get Horizontal(): StackPanelLayoutEngine {
            if (!StackPanelLayoutEngine._horizontal) {
                StackPanelLayoutEngine._horizontal = new StackPanelLayoutEngine();
                StackPanelLayoutEngine._horizontal.isHorizontal = true;
                StackPanelLayoutEngine._horizontal.lock();
            }

            return StackPanelLayoutEngine._horizontal;
        }

        public static get Vertical(): StackPanelLayoutEngine {
            if (!StackPanelLayoutEngine._vertical) {
                StackPanelLayoutEngine._vertical = new StackPanelLayoutEngine();
                StackPanelLayoutEngine._vertical.isHorizontal = false;
                StackPanelLayoutEngine._vertical.lock();
            }

            return StackPanelLayoutEngine._vertical;
        }
        private static _horizontal: StackPanelLayoutEngine = null;
        private static _vertical: StackPanelLayoutEngine = null;


        get isHorizontal(): boolean {
            return this._isHorizontal;
        }

        set isHorizontal(val: boolean) {
            if (this.isLocked()) {
                return;
            }
            this._isHorizontal = val;
        }

        private _isHorizontal: boolean = true;

        private static dstOffset = Vector2.Zero();
        private static dstArea = Size.Zero();

        public updateLayout(prim: Prim2DBase) {
            if (prim._isFlagSet(SmartPropertyPrim.flagLayoutDirty)) {

                let x = 0;
                let y = 0;
                let h = this.isHorizontal;
                let max = 0;

                for (let child of prim.children) {

                    let layoutArea: Size;
                    if (child._hasMargin) {
                        child.margin.computeWithAlignment(prim.layoutArea, child.actualSize, child.marginAlignment, StackPanelLayoutEngine.dstOffset, StackPanelLayoutEngine.dstArea, true);
                        layoutArea = StackPanelLayoutEngine.dstArea.clone();
                        child.layoutArea = layoutArea;
                    } else {
                        layoutArea = child.layoutArea;
                        child.margin.computeArea(child.actualSize, layoutArea);
                    }

                    max = Math.max(max, h ? layoutArea.height : layoutArea.width);

                }

                for (let child of prim.children) {
                    child.layoutAreaPos = new Vector2(x, y);

                    let layoutArea = child.layoutArea;

                    if (h) {
                        x += layoutArea.width;
                        child.layoutArea = new Size(layoutArea.width, max);
                    } else {
                        y += layoutArea.height;
                        child.layoutArea = new Size(max, layoutArea.height);
                    }
                }
                prim._clearFlags(SmartPropertyPrim.flagLayoutDirty);
            }

        }

        get isChildPositionAllowed(): boolean {
            return false;
        }
    }
}