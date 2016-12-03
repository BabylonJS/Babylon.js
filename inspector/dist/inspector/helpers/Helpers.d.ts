declare module INSPECTOR {
    class Helpers {
        /**
         * Returns the type of the given object. First
         * uses getClassName. If nothing is returned, used the type of the constructor
         */
        static GET_TYPE(obj: any): string;
        /**
         * Returns the name of a function (workaround to get object type for IE11)
         */
        private static _GetFnName(fn);
        /** Send the event which name is given in parameter to the window */
        static SEND_EVENT(eventName: string): void;
        /** Returns the given number with 2 decimal number max if a decimal part exists */
        static Trunc(nb: any): number;
        /**
         * Useful function used to create a div
         */
        static CreateDiv(className?: string, parent?: HTMLElement): HTMLElement;
        static CreateElement(element: string, className?: string, parent?: HTMLElement): HTMLElement;
        /**
         * Removes all children of the given div.
         */
        static CleanDiv(div: HTMLElement): void;
        static LoadScript(): void;
    }
}
