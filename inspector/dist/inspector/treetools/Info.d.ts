declare module INSPECTOR {
    /** Any object implementing this interface should
     * provide methods to retrieve its info
     */
    interface IToolInfo {
        getInfo: () => string;
    }
    /**
     * Checkbox to display/hide the primitive
     */
    class Info extends AbstractTreeTool {
        private _obj;
        private _tooltip;
        constructor(obj: IToolInfo);
        protected action(): void;
    }
}
