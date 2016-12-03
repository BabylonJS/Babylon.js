declare module INSPECTOR {
    class MeshAdapter extends Adapter implements IToolVisible, IToolDebug, IToolBoundingBox, IToolInfo {
        /** Keep track of the axis of the actual object */
        private _axis;
        constructor(obj: BABYLON.AbstractMesh);
        /** Returns the name displayed in the tree */
        id(): string;
        /** Returns the type of this object - displayed in the tree */
        type(): string;
        /** Returns the list of properties to be displayed for this adapter */
        getProperties(): Array<PropertyLine>;
        getTools(): Array<AbstractTreeTool>;
        setVisible(b: boolean): void;
        isVisible(): boolean;
        isBoxVisible(): boolean;
        setBoxVisible(b: boolean): boolean;
        debug(b: boolean): void;
        /** Returns some information about this mesh */
        getInfo(): string;
        /** Overrides super.highlight */
        highlight(b: boolean): void;
        /** Draw X, Y and Z axis for the actual object if this adapter.
         * Should be called only one time as it will fill this._axis
         */
        private _drawAxis();
    }
}
