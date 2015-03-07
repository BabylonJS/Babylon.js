var BABYLON;
(function (BABYLON) {
    var Collection = (function () {
        function Collection() {
            this.count = 0;
            this.items = {};
        }
        Collection.prototype.add = function (key, item) {
            if (this.items[key] != undefined) {
                return undefined;
            }
            this.items[key] = item;
            return ++this.count;
        };
        Collection.prototype.remove = function (key) {
            if (this.items[key] == undefined) {
                return undefined;
            }
            delete this.items[key];
            return --this.count;
        };
        Collection.prototype.item = function (key) {
            return this.items[key];
        };
        return Collection;
    })();
    BABYLON.Collection = Collection;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.collection.js.map