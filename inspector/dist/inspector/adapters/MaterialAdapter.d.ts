declare module INSPECTOR {
    class MaterialAdapter extends Adapter {
        constructor(obj: BABYLON.Material);
        /** Returns the name displayed in the tree */
        id(): string;
        /** Returns the type of this object - displayed in the tree */
        type(): string;
        /** Returns the list of properties to be displayed for this adapter */
        getProperties(): Array<PropertyLine>;
        /** No tools for a material adapter */
        getTools(): Array<AbstractTreeTool>;
        /** Overrides super.highlight.
         * Highlighting a material outlines all meshes linked to this material
         */
        highlight(b: boolean): void;
    }
}
