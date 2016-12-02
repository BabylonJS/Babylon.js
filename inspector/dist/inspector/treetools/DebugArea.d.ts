declare module INSPECTOR {
    /** Any object implementing this interface should
     * provide methods to toggle a debug area
     */
    interface IToolDebug {
        debug: (b: boolean) => void;
    }
    class DebugArea extends AbstractTreeTool {
        private _obj;
        constructor(obj: IToolDebug);
        protected action(): void;
    }
}
