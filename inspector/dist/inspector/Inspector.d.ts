declare module INSPECTOR {
    class Inspector {
        private _c2diwrapper;
        /** The panel displayed at the top of the inspector */
        private _topPanel;
        /** The div containing the content of the active tab */
        private _tabPanel;
        /** The panel containing the list if items */
        /** The list if tree items displayed in the tree panel. */
        private _items;
        private _tabbar;
        private _scene;
        /** The HTML document relative to this inspector (the window or the popup depending on its mode) */
        static DOCUMENT: HTMLDocument;
        /** True if the inspector is built as a popup tab */
        private _popupMode;
        /** The original canvas size, before applying the inspector*/
        private _canvasSize;
        /** The inspector is created with the given engine.
         * If a HTML parent is not given as a parameter, the inspector is created as a right panel on the main window.
         * If a HTML parent is given, the inspector is created in this element, taking full size of its parent.
         */
        constructor(scene: BABYLON.Scene, parent?: HTMLElement);
        /** Build the inspector panel in the given HTML element */
        private _buildInspector(parent);
        scene: BABYLON.Scene;
        popupMode: boolean;
        /**
         * Filter the list of item present in the tree.
         * All item returned should have the given filter contained in the item id.
        */
        filterItem(filter: string): void;
        /** Display the mesh tab on the given object */
        displayObjectDetails(mesh: BABYLON.AbstractMesh): void;
        /** Clean the whole tree of item and rebuilds it */
        refresh(): void;
        /** Remove the inspector panel when it's built as a right panel:
         * remove the right panel and remove the wrapper
         */
        private _disposeInspector();
        /** Open the inspector in a new popup */
        openPopup(): void;
    }
}
