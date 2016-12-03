declare module INSPECTOR {
    /**
     * A tab bar will contains each view the inspector can have : Canvas2D, Meshes...
     * The default active tab is the first one of the list.
     */
    class TabBar extends BasicElement {
        private _tabs;
        private _inspector;
        /** The tab displaying all meshes */
        private _meshTab;
        /** The toolbar */
        private _toolBar;
        /** The icon displayed at the end of the toolbar displaying a combo box of tabs not displayed */
        private _moreTabsIcon;
        /** The panel displayed when the 'more-tab' icon is selected */
        private _moreTabsPanel;
        /** The list of tab displayed by clicking on the remainingIcon */
        private _invisibleTabs;
        /** The list of tabs visible, displayed in the tab bar */
        private _visibleTabs;
        constructor(inspector: Inspector);
        update(): void;
        protected _build(): void;
        /**
         * Add a tab to the 'more-tabs' panel, displayed by clicking on the
         * 'more-tabs' icon
         */
        private _addInvisibleTabToPanel(tab);
        /** Dispose the current tab, set the given tab as active, and refresh the treeview */
        switchTab(tab: Tab): void;
        /** Display the mesh tab.
         * If a parameter is given, the given mesh details are displayed
         */
        switchMeshTab(mesh?: BABYLON.AbstractMesh): void;
        /** Returns the active tab */
        getActiveTab(): Tab;
        inspector: Inspector;
        /**
         * Returns the total width in pixel of the tabbar,
         * that corresponds to the sum of the width of each visible tab + toolbar width
        */
        getPixelWidth(): number;
        /** Display the remaining icon or not depending on the tabbar width.
         * This function should be called each time the inspector width is updated
         */
        updateWidth(): void;
    }
}
