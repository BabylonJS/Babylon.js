declare module INSPECTOR {
    /** Any object implementing this interface should
     * provide methods to toggle its visibility
     */
    interface IToolVisible {
        isVisible: () => boolean;
        setVisible: (b: boolean) => void;
    }
    /**
     * Checkbox to display/hide the primitive
     */
    class Checkbox extends AbstractTreeTool {
        private _obj;
        constructor(obj: IToolVisible);
        protected action(): void;
        private _check();
    }
}
