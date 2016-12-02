declare module INSPECTOR {
    class Canvas2DAdapter extends Adapter implements IToolVisible, IToolDebug {
        constructor(obj: any);
        /** Returns the name displayed in the tree */
        id(): string;
        /** Returns the type of this object - displayed in the tree */
        type(): string;
        /** Returns the list of properties to be displayed for this adapter */
        getProperties(): Array<PropertyLine>;
        getTools(): Array<AbstractTreeTool>;
        setVisible(b: boolean): void;
        isVisible(): boolean;
        /** Overrides super */
        debug(b: boolean): void;
        /** Overrides super.highlight */
        highlight(b: boolean): void;
    }
}
