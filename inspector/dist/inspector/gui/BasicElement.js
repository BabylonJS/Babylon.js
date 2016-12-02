var INSPECTOR;
(function (INSPECTOR) {
    /**
     * Represents a html div element.
     * The div is built when an instance of BasicElement is created.
     */
    var BasicElement = (function () {
        function BasicElement() {
            this._div = INSPECTOR.Helpers.CreateDiv();
        }
        /**
         * Returns the div element
         */
        BasicElement.prototype.toHtml = function () {
            return this._div;
        };
        /**
         * Build the html element
         */
        BasicElement.prototype._build = function () { };
        ;
        /** Default dispose method if needed */
        BasicElement.prototype.dispose = function () { };
        ;
        return BasicElement;
    }());
    INSPECTOR.BasicElement = BasicElement;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=BasicElement.js.map