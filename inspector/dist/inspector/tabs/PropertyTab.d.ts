declare module INSPECTOR {
    /**
     * A Property tab can creates two panels:
     * a tree panel and a detail panel,
     * in which properties will be displayed.
     * Both panels are separated by a resize bar
     */
    abstract class PropertyTab extends Tab {
        protected _inspector: Inspector;
        /** The panel containing a list of items */
        protected _treePanel: HTMLElement;
        /** The panel containing a list if properties corresponding to an item */
        protected _detailsPanel: DetailPanel;
        protected _treeItems: Array<TreeItem>;
        protected _searchBar: SearchBar;
        constructor(tabbar: TabBar, name: string, insp: Inspector);
        /** Overrides dispose */
        dispose(): void;
        update(_items?: Array<TreeItem>): void;
        /** Display the details of the given item */
        displayDetails(item: TreeItem): void;
        /** Select an item in the tree */
        select(item: TreeItem): void;
        /** Highlight the given node, and downplay all others */
        highlightNode(item?: TreeItem): void;
        /** Set the given item as active in the tree */
        activateNode(item: TreeItem): void;
        /** Returns the treeitem corersponding to the given obj, null if not found */
        getItemFor(_obj: any): TreeItem;
        filter(filter: string): void;
        /** Builds the tree panel */
        protected abstract _getTree(): Array<TreeItem>;
    }
}
