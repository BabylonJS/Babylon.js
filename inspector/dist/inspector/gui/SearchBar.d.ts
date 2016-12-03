declare module INSPECTOR {
    /**
     * A search bar can be used to filter elements in the tree panel.
     * At each keypress on the input, the treepanel will be filtered.
     */
    class SearchBar extends BasicElement {
        private _tab;
        private _inputElement;
        constructor(tab: PropertyTab);
        /** Delete all characters typped in the input element */
        reset(): void;
        update(): void;
    }
}
