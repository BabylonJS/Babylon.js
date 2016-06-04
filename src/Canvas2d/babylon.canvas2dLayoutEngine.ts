module BABYLON {

    @className("LayoutEngineBase")
    /**
     * This is the base class you have to extend in order to implement your own Layout Engine.
     * Note that for performance reason, each different Layout Engine type must be instanced only once, good practice is through a static `Singleton`property defined in the type itself.
     * If data has to be associated to a given primitive you can use the SmartPropertyPrim.addExternalData API to do it.
     */
    export class LayoutEngineBase {
        public updateLayout(prim: Prim2DBase) {
        }

        public get isChildPositionAllowed(): boolean {
            return false;
        }
    }

    @className("CanvasLayoutEngine")
    export class CanvasLayoutEngine extends LayoutEngineBase {
        public static Singleton: CanvasLayoutEngine = new CanvasLayoutEngine();

        // A very simple (no) layout computing...
        // The Canvas and its direct children gets the Canvas' size as Layout Area
        // Indirect children have their Layout Area to the actualSize (margin area) of their parent
        public updateLayout(prim: Prim2DBase) {

            // If this prim is layoutDiry we update  its layoutArea and also the one of its direct children
            // Then we recurse on each child where their respective layoutDirty will also be test, and so on.
            if (prim._isFlagSet(SmartPropertyPrim.flagLayoutDirty)) {
                this._doUpdate(prim);
                prim._clearFlags(SmartPropertyPrim.flagLayoutDirty);

                // Recurse
                for (let child of prim.children) {
                    this._doUpdate(child);
                    child._clearFlags(SmartPropertyPrim.flagLayoutDirty);
                    this.updateLayout(child);
                }
            }

        }

        private _doUpdate(prim: Prim2DBase) {
            // Canvas ?
            if (prim instanceof Canvas2D) {
                prim._layoutArea = prim.actualSize;
            }

            // Direct child of Canvas ?
            else if (prim.parent instanceof Canvas2D) {
                prim._layoutArea = prim.owner.actualSize;
            }

            // Indirect child of Canvas
            else {
                prim._layoutArea = prim.parent.contentArea;
            }
        }

        get isChildPositionAllowed(): boolean {
            return true;
        }
    }

}