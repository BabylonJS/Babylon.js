declare module INSPECTOR {
    /** Any object implementing this interface should
     * provide methods to toggle its bounding box
     */
    interface IToolBoundingBox {
        isBoxVisible: () => boolean;
        setBoxVisible: (b: boolean) => void;
    }
    /**
     * Checkbox to display/hide the primitive
     */
    class BoundingBox extends AbstractTreeTool {
        private _obj;
        constructor(obj: IToolBoundingBox);
        protected action(): void;
        private _check();
    }
}
