var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var INSPECTOR;
(function (INSPECTOR) {
    var Tab = (function (_super) {
        __extends(Tab, _super);
        function Tab(tabbar, name) {
            _super.call(this);
            this._isActive = false;
            this._tabbar = tabbar;
            this.name = name;
            this._build();
        }
        /** True if the tab is active, false otherwise */
        Tab.prototype.isActive = function () {
            return this._isActive;
        };
        Tab.prototype._build = function () {
            var _this = this;
            this._div.className = 'tab';
            this._div.textContent = this.name;
            this._div.addEventListener('click', function (evt) {
                // Set this tab as active
                _this._tabbar.switchTab(_this);
            });
        };
        /** Set this tab as active or not, depending on the current state */
        Tab.prototype.active = function (b) {
            if (b) {
                this._div.classList.add('active');
            }
            else {
                this._div.classList.remove('active');
            }
            this._isActive = b;
        };
        Tab.prototype.update = function () {
            // Nothing for the moment
        };
        /** Creates the tab panel for this tab. */
        Tab.prototype.getPanel = function () {
            return this._panel;
        };
        /** Add this in the propertytab with the searchbar */
        Tab.prototype.filter = function (str) { };
        ;
        /**
         * Returns the total width in pixel of this tab, 0 by default
        */
        Tab.prototype.getPixelWidth = function () {
            var style = window.getComputedStyle(this._div);
            var left = parseFloat(style.marginLeft.substr(0, style.marginLeft.length - 2)) || 0;
            var right = parseFloat(style.marginRight.substr(0, style.marginRight.length - 2)) || 0;
            return (this._div.clientWidth || 0) + left + right;
        };
        return Tab;
    }(INSPECTOR.BasicElement));
    INSPECTOR.Tab = Tab;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=Tab.js.map