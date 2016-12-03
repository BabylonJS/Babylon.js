declare module INSPECTOR {
    class TreeItem extends BasicElement {
        private _tab;
        private _adapter;
        private _tools;
        private _children;
        private _lineContent;
        constructor(tab: PropertyTab, obj: Adapter);
        /** Returns the item ID == its adapter ID */
        id: string;
        /** Add the given item as a child of this one */
        add(child: TreeItem): void;
        /**
         * Function used to compare this item to another tree item.
         * Returns the alphabetical sort of the adapter ID
         */
        compareTo(item: TreeItem): number;
        /** Returns true if the given obj correspond to the adapter linked to this tree item */
        correspondsTo(obj: any): boolean;
        /** hide all children of this item */
        fold(): void;
        /** Show all children of this item */
        unfold(): void;
        /** Build the HTML of this item */
        protected _build(): void;
        /**
         * Returns one HTML element (.details) containing all  details of this primitive
         */
        getDetails(): Array<PropertyLine>;
        update(): void;
        /**
         * Add an event listener on the item :
         * - one click display details
         * - on mouse hover the item is highlighted
         */
        protected _addEvent(): void;
        /** Highlight or downplay this node */
        highlight(b: boolean): void;
        /** Returns true if the node is folded, false otherwise */
        private _isFolded();
        /** Set this item as active (background lighter) in the tree panel */
        active(b: boolean): void;
    }
}
