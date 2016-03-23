var BABYLON;
(function (BABYLON) {
    var SmartCollection = (function () {
        function SmartCollection(capacity) {
            if (capacity === void 0) { capacity = 10; }
            this.count = 0;
            this._initialCapacity = capacity;
            this.items = {};
            this._keys = new Array(this._initialCapacity);
        }
        SmartCollection.prototype.add = function (key, item) {
            if (this.items[key] != undefined) {
                return -1;
            }
            this.items[key] = item;
            //literal keys are always strings, but we keep source type of key in _keys array
            this._keys[this.count++] = key;
            if (this.count > this._keys.length) {
                this._keys.length *= 2;
            }
            return this.count;
        };
        SmartCollection.prototype.remove = function (key) {
            if (this.items[key] == undefined) {
                return -1;
            }
            return this.removeItemOfIndex(this.indexOf(key));
        };
        SmartCollection.prototype.removeItemOfIndex = function (index) {
            if (index < this.count && index > -1) {
                delete this.items[this._keys[index]];
                //here, shifting by hand is better optimised than .splice
                while (index < this.count) {
                    this._keys[index] = this._keys[index + 1];
                    index++;
                }
            }
            else {
                return -1;
            }
            return --this.count;
        };
        SmartCollection.prototype.indexOf = function (key) {
            for (var i = 0; i !== this.count; i++) {
                if (this._keys[i] === key) {
                    return i;
                }
            }
            return -1;
        };
        SmartCollection.prototype.item = function (key) {
            return this.items[key];
        };
        SmartCollection.prototype.getAllKeys = function () {
            if (this.count > 0) {
                var keys = new Array(this.count);
                for (var i = 0; i < this.count; i++) {
                    keys[i] = this._keys[i];
                }
                return keys;
            }
            else {
                return undefined;
            }
        };
        SmartCollection.prototype.getKeyByIndex = function (index) {
            if (index < this.count && index > -1) {
                return this._keys[index];
            }
            else {
                return undefined;
            }
        };
        SmartCollection.prototype.getItemByIndex = function (index) {
            if (index < this.count && index > -1) {
                return this.items[this._keys[index]];
            }
            else {
                return undefined;
            }
        };
        SmartCollection.prototype.empty = function () {
            if (this.count > 0) {
                this.count = 0;
                this.items = {};
                this._keys = new Array(this._initialCapacity);
            }
        };
        SmartCollection.prototype.forEach = function (block) {
            var key;
            for (key in this.items) {
                if (this.items.hasOwnProperty(key)) {
                    block(this.items[key]);
                }
            }
        };
        return SmartCollection;
    }());
    BABYLON.SmartCollection = SmartCollection;
})(BABYLON || (BABYLON = {}));
