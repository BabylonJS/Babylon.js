declare module INSPECTOR {
    class LightTab extends PropertyTab {
        constructor(tabbar: TabBar, inspector: Inspector);
        protected _getTree(): Array<TreeItem>;
    }
}
