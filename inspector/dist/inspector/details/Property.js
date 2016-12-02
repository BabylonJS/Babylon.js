var INSPECTOR;
(function (INSPECTOR) {
    /**
     * A property is a link between a data (string) and an object.
     */
    var Property = (function () {
        function Property(prop, obj) {
            this._property = prop;
            this._obj = obj;
        }
        Object.defineProperty(Property.prototype, "name", {
            get: function () {
                return this._property;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Property.prototype, "value", {
            get: function () {
                return this._obj[this._property];
            },
            set: function (newValue) {
                this._obj[this._property] = newValue;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Property.prototype, "type", {
            get: function () {
                return INSPECTOR.Helpers.GET_TYPE(this.value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Property.prototype, "obj", {
            get: function () {
                return this._obj;
            },
            set: function (newObj) {
                this._obj = newObj;
            },
            enumerable: true,
            configurable: true
        });
        return Property;
    }());
    INSPECTOR.Property = Property;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=Property.js.map