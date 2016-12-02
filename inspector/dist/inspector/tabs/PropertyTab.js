var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var INSPECTOR;
(function (INSPECTOR) {
    /**
     * A Property tab can creates two panels:
     * a tree panel and a detail panel,
     * in which properties will be displayed.
     * Both panels are separated by a resize bar
     */
    var PropertyTab = (function (_super) {
        __extends(PropertyTab, _super);
        function PropertyTab(tabbar, name, insp) {
            _super.call(this, tabbar, name);
            this._treeItems = [];
            this._inspector = insp;
            // Build the properties panel : a div that will contains the tree and the detail panel
            this._panel = INSPECTOR.Helpers.CreateDiv('tab-panel');
            // Search bar
            this._searchBar = new INSPECTOR.SearchBar(this);
            // Add searchbar
            this._panel.appendChild(this._searchBar.toHtml());
            // Build the treepanel
            this._treePanel = INSPECTOR.Helpers.CreateDiv('insp-tree', this._panel);
            // Build the detail panel
            this._detailsPanel = new INSPECTOR.DetailPanel();
            this._panel.appendChild(this._detailsPanel.toHtml());
            Split([this._treePanel, this._detailsPanel.toHtml()], { direction: 'vertical' });
            this.update();
        }
        /** Overrides dispose */
        PropertyTab.prototype.dispose = function () {
            this._detailsPanel.dispose();
        };
        PropertyTab.prototype.update = function (_items) {
            var items;
            if (_items) {
                items = _items;
            }
            else {
                // Rebuild the tree
                this._treeItems = this._getTree();
                items = this._treeItems;
            }
            // Clean the tree
            INSPECTOR.Helpers.CleanDiv(this._treePanel);
            // Clean the detail properties
            this._detailsPanel.clean();
            // Sort items alphabetically
            items.sort(function (item1, item2) {
                return item1.compareTo(item2);
            });
            // Display items
            for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
                var item = items_1[_i];
                this._treePanel.appendChild(item.toHtml());
            }
        };
        /** Display the details of the given item */
        PropertyTab.prototype.displayDetails = function (item) {
            // Remove active state on all items
            this.activateNode(item);
            // Update the detail panel
            this._detailsPanel.details = item.getDetails();
        };
        /** Select an item in the tree */
        PropertyTab.prototype.select = function (item) {
            // Remove the node highlight
            this.highlightNode();
            // Active the node
            this.activateNode(item);
            // Display its details
            this.displayDetails(item);
        };
        /** Highlight the given node, and downplay all others */
        PropertyTab.prototype.highlightNode = function (item) {
            if (this._treeItems) {
                for (var _i = 0, _a = this._treeItems; _i < _a.length; _i++) {
                    var node = _a[_i];
                    node.highlight(false);
                }
            }
            if (item) {
                item.highlight(true);
            }
        };
        /** Set the given item as active in the tree */
        PropertyTab.prototype.activateNode = function (item) {
            if (this._treeItems) {
                for (var _i = 0, _a = this._treeItems; _i < _a.length; _i++) {
                    var node = _a[_i];
                    node.active(false);
                }
            }
            item.active(true);
        };
        /** Returns the treeitem corersponding to the given obj, null if not found */
        PropertyTab.prototype.getItemFor = function (_obj) {
            var obj = _obj;
            for (var _i = 0, _a = this._treeItems; _i < _a.length; _i++) {
                var item = _a[_i];
                if (item.correspondsTo(obj)) {
                    return item;
                }
            }
            return null;
        };
        PropertyTab.prototype.filter = function (filter) {
            var items = [];
            for (var _i = 0, _a = this._treeItems; _i < _a.length; _i++) {
                var item = _a[_i];
                if (item.id.toLowerCase().indexOf(filter.toLowerCase()) != -1) {
                    items.push(item);
                }
            }
            this.update(items);
        };
        return PropertyTab;
    }(INSPECTOR.Tab));
    INSPECTOR.PropertyTab = PropertyTab;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=PropertyTab.js.map