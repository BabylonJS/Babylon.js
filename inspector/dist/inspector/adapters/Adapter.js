var INSPECTOR;
(function (INSPECTOR) {
    var Adapter = (function () {
        function Adapter(obj) {
            this._obj = obj;
        }
        Object.defineProperty(Adapter.prototype, "actualObject", {
            /** Returns the actual object behind this adapter */
            get: function () {
                return this._obj;
            },
            enumerable: true,
            configurable: true
        });
        /** Returns true if the given object correspond to this  */
        Adapter.prototype.correspondsTo = function (obj) {
            return obj === this._obj;
        };
        Object.defineProperty(Adapter.prototype, "name", {
            /** Returns the adapter unique name */
            get: function () {
                return Adapter._name;
            },
            enumerable: true,
            configurable: true
        });
        /** Should be overriden in subclasses */
        Adapter.prototype.highlight = function (b) { };
        ;
        // a unique name for this adapter, to retrieve its own key in the local storage
        Adapter._name = BABYLON.Geometry.RandomId();
        return Adapter;
    }());
    INSPECTOR.Adapter = Adapter;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=Adapter.js.map