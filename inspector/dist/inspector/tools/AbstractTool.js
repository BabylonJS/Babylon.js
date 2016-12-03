var INSPECTOR;
(function (INSPECTOR) {
    var AbstractTool = (function () {
        function AbstractTool(icon, parent, inspector, tooltip) {
            var _this = this;
            this._inspector = inspector;
            this._elem = INSPECTOR.Inspector.DOCUMENT.createElement('i');
            this._elem.className = "tool fa " + icon;
            parent.appendChild(this._elem);
            this._elem.addEventListener('click', function (e) {
                _this.action();
            });
            new INSPECTOR.Tooltip(this._elem, tooltip);
        }
        AbstractTool.prototype.toHtml = function () {
            return this._elem;
        };
        /**
         * Returns the total width in pixel of this tool, 0 by default
        */
        AbstractTool.prototype.getPixelWidth = function () {
            var style = window.getComputedStyle(this._elem);
            var left = parseFloat(style.marginLeft.substr(0, style.marginLeft.length - 2)) || 0;
            var right = parseFloat(style.marginRight.substr(0, style.marginRight.length - 2)) || 0;
            return (this._elem.clientWidth || 0) + left + right;
        };
        /**
         * Updates the icon of this tool with the given string
         */
        AbstractTool.prototype._updateIcon = function (icon) {
            this._elem.className = "tool fa " + icon;
        };
        return AbstractTool;
    }());
    INSPECTOR.AbstractTool = AbstractTool;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=AbstractTool.js.map