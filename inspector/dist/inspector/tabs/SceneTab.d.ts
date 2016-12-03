declare module INSPECTOR {
    class SceneTab extends Tab {
        private _inspector;
        /** The list of  channels/options that can be activated/deactivated */
        private _actions;
        /** The list of skeleton viewer */
        private _skeletonViewers;
        /** The detail of the scene */
        private _detailsPanel;
        constructor(tabbar: TabBar, insp: Inspector);
        /** Overrides super.dispose */
        dispose(): void;
        /** generates a div which correspond to an option that can be activated/deactivated */
        private _generateActionLine(name, initValue, action);
        /**
         * Add a click action for all given elements :
         * the clicked element is set as active, all others elements are deactivated
         */
        private _generateRadioAction(arr);
    }
}
