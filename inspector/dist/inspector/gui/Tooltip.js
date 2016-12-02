var INSPECTOR;
(function (INSPECTOR) {
    /**
     * Creates a tooltip for the given html element
     */
    var Tooltip = (function () {
        function Tooltip(elem, tip) {
            var _this = this;
            this._elem = elem;
            this._infoDiv = INSPECTOR.Helpers.CreateDiv('tooltip', this._elem);
            this._elem.addEventListener('mouseover', function () {
                _this._infoDiv.textContent = tip;
                _this._infoDiv.style.display = 'block';
            });
            this._elem.addEventListener('mouseout', function () { _this._infoDiv.style.display = 'none'; });
        }
        return Tooltip;
    }());
    INSPECTOR.Tooltip = Tooltip;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=Tooltip.js.map