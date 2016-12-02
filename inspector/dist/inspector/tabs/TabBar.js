var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var INSPECTOR;
(function (INSPECTOR) {
    /**
     * A tab bar will contains each view the inspector can have : Canvas2D, Meshes...
     * The default active tab is the first one of the list.
     */
    var TabBar = (function (_super) {
        __extends(TabBar, _super);
        function TabBar(inspector) {
            _super.call(this);
            // The list of available tabs
            this._tabs = [];
            /** The list of tab displayed by clicking on the remainingIcon */
            this._invisibleTabs = [];
            /** The list of tabs visible, displayed in the tab bar */
            this._visibleTabs = [];
            this._inspector = inspector;
            this._tabs.push(new INSPECTOR.SceneTab(this, this._inspector));
            this._meshTab = new INSPECTOR.MeshTab(this, this._inspector);
            this._tabs.push(this._meshTab);
            this._tabs.push(new INSPECTOR.ShaderTab(this, this._inspector));
            this._tabs.push(new INSPECTOR.LightTab(this, this._inspector));
            this._tabs.push(new INSPECTOR.Canvas2DTab(this, this._inspector));
            this._tabs.push(new INSPECTOR.MaterialTab(this, this._inspector));
            this._toolBar = new INSPECTOR.Toolbar(this._inspector);
            this._build();
            // Active the first tab
            this._tabs[0].active(true);
            // set all tab as visible
            for (var _i = 0, _a = this._tabs; _i < _a.length; _i++) {
                var tab = _a[_i];
                this._visibleTabs.push(tab);
            }
        }
        // No update
        TabBar.prototype.update = function () { };
        TabBar.prototype._build = function () {
            var _this = this;
            this._div.className = 'tabbar';
            this._div.appendChild(this._toolBar.toHtml());
            for (var _i = 0, _a = this._tabs; _i < _a.length; _i++) {
                var tab = _a[_i];
                this._div.appendChild(tab.toHtml());
            }
            this._moreTabsIcon = INSPECTOR.Helpers.CreateElement('i', 'fa fa-angle-double-right more-tabs');
            this._moreTabsPanel = INSPECTOR.Helpers.CreateDiv('more-tabs-panel');
            this._moreTabsIcon.addEventListener('click', function () {
                // Hide the 'more-tabs-panel' if already displayed 
                if (_this._moreTabsPanel.style.display == 'flex') {
                    _this._moreTabsPanel.style.display = 'none';
                }
                else {
                    // Attach more-tabs-panel if not attached yet
                    var topPanel = _this._div.parentNode;
                    if (!topPanel.contains(_this._moreTabsPanel)) {
                        topPanel.appendChild(_this._moreTabsPanel);
                    }
                    // Clean the 'more-tabs-panel'
                    INSPECTOR.Helpers.CleanDiv(_this._moreTabsPanel);
                    // Add each invisible tabs to this panel
                    for (var _i = 0, _a = _this._invisibleTabs; _i < _a.length; _i++) {
                        var tab = _a[_i];
                        _this._addInvisibleTabToPanel(tab);
                    }
                    // And display it
                    _this._moreTabsPanel.style.display = 'flex';
                }
            });
        };
        /**
         * Add a tab to the 'more-tabs' panel, displayed by clicking on the
         * 'more-tabs' icon
         */
        TabBar.prototype._addInvisibleTabToPanel = function (tab) {
            var _this = this;
            var div = INSPECTOR.Helpers.CreateDiv('invisible-tab', this._moreTabsPanel);
            div.textContent = tab.name;
            div.addEventListener('click', function () {
                _this._moreTabsPanel.style.display = 'none';
                _this.switchTab(tab);
            });
        };
        /** Dispose the current tab, set the given tab as active, and refresh the treeview */
        TabBar.prototype.switchTab = function (tab) {
            // Dispose the active tab
            this.getActiveTab().dispose();
            // Deactivate all tabs
            for (var _i = 0, _a = this._tabs; _i < _a.length; _i++) {
                var t = _a[_i];
                t.active(false);
            }
            // activate the given tab
            tab.active(true);
            // Refresh the inspector
            this._inspector.refresh();
        };
        /** Display the mesh tab.
         * If a parameter is given, the given mesh details are displayed
         */
        TabBar.prototype.switchMeshTab = function (mesh) {
            this.switchTab(this._meshTab);
            if (mesh) {
                var item = this._meshTab.getItemFor(mesh);
                this._meshTab.select(item);
            }
        };
        /** Returns the active tab */
        TabBar.prototype.getActiveTab = function () {
            for (var _i = 0, _a = this._tabs; _i < _a.length; _i++) {
                var tab = _a[_i];
                if (tab.isActive()) {
                    return tab;
                }
            }
        };
        Object.defineProperty(TabBar.prototype, "inspector", {
            get: function () {
                return this._inspector;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Returns the total width in pixel of the tabbar,
         * that corresponds to the sum of the width of each visible tab + toolbar width
        */
        TabBar.prototype.getPixelWidth = function () {
            var sum = 0;
            for (var _i = 0, _a = this._visibleTabs; _i < _a.length; _i++) {
                var tab = _a[_i];
                sum += tab.getPixelWidth();
            }
            sum += this._toolBar.getPixelWidth();
            if (this._div.contains(this._moreTabsIcon)) {
                sum += 30; // $tabbarheight
            }
            return sum;
        };
        /** Display the remaining icon or not depending on the tabbar width.
         * This function should be called each time the inspector width is updated
         */
        TabBar.prototype.updateWidth = function () {
            var parentSize = this._div.parentElement.clientWidth;
            var lastTabWidth = 75;
            var currentSize = this.getPixelWidth();
            // Check if a tab should be removed : if the tab bar width is greater than
            // its parent width
            while (this._visibleTabs.length > 0 && currentSize > parentSize) {
                // Start by the last element
                var tab = this._visibleTabs.pop();
                // set it invisible
                this._invisibleTabs.push(tab);
                // and removes it from the DOM
                this._div.removeChild(tab.toHtml());
                currentSize = this.getPixelWidth() + lastTabWidth;
            }
            // Check if a tab can be added to the tab bar : if the tab bar width
            // + 100 (at least 100px is needed to add a tab) is less than its parent width
            if (this._invisibleTabs.length > 0) {
                if (currentSize + lastTabWidth < parentSize) {
                    var lastTab = this._invisibleTabs.pop();
                    this._div.appendChild(lastTab.toHtml());
                    this._visibleTabs.push(lastTab);
                    // Update more-tab icon in last position if needed
                    this._div.removeChild(this._moreTabsIcon);
                }
            }
            if (this._invisibleTabs.length > 0 && !this._div.contains(this._moreTabsIcon)) {
                this._div.appendChild(this._moreTabsIcon);
            }
        };
        return TabBar;
    }(INSPECTOR.BasicElement));
    INSPECTOR.TabBar = TabBar;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=TabBar.js.map