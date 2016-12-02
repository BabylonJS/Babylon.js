declare module INSPECTOR {
    class LightAdapter extends Adapter implements IToolVisible {
        private static _PROPERTIES;
        constructor(obj: BABYLON.Light);
        /** Returns the name displayed in the tree */
        id(): string;
        /** Returns the type of this object - displayed in the tree */
        type(): string;
        /** Returns the list of properties to be displayed for this adapter */
        getProperties(): Array<PropertyLine>;
        getTools(): Array<AbstractTreeTool>;
        setVisible(b: boolean): void;
        isVisible(): boolean;
        /** Returns some information about this mesh */
        /** Overrides super.highlight */
        highlight(b: boolean): void;
    }
}
