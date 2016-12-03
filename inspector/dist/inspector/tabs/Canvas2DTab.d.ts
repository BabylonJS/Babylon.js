declare module INSPECTOR {
    class Canvas2DTab extends PropertyTab {
        constructor(tabbar: TabBar, inspector: Inspector);
        protected _getTree(): Array<TreeItem>;
    }
}
