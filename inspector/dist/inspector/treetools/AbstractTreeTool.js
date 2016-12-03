var INSPECTOR;
(function (INSPECTOR) {
    var AbstractTreeTool = (function () {
        function AbstractTreeTool() {
            /** Is the tool enabled ? */
            this._on = false;
            this._elem = INSPECTOR.Inspector.DOCUMENT.createElement('i');
            this._elem.className = 'treeTool fa';
            this._addEvents();
        }
        AbstractTreeTool.prototype.toHtml = function () {
            return this._elem;
        };
        AbstractTreeTool.prototype._addEvents = function () {
            var _this = this;
            this._elem.addEventListener('click', function (e) {
                _this.action();
                e.stopPropagation();
            });
        };
        /**
         * Action launched when clicked on this element
         * Should be overrided
         */
        AbstractTreeTool.prototype.action = function () {
            this._on = !this._on;
        };
        return AbstractTreeTool;
    }());
    INSPECTOR.AbstractTreeTool = AbstractTreeTool;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=AbstractTreeTool.js.map