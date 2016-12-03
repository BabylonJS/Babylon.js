declare module INSPECTOR {
    abstract class AbstractTreeTool {
        protected _elem: HTMLElement;
        /** Is the tool enabled ? */
        protected _on: boolean;
        constructor();
        toHtml(): HTMLElement;
        protected _addEvents(): void;
        /**
         * Action launched when clicked on this element
         * Should be overrided
         */
        protected action(): void;
    }
}
