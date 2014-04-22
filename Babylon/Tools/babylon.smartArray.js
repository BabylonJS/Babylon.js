var BABYLON;
(function (BABYLON) {
    var SmartArray = (function () {
        function SmartArray(capacity) {
            this.length = 0;
            this.data = new Array(capacity);
        }
        SmartArray.prototype.push = function (value) {
            this.data[this.length++] = value;

            if (this.length > this.data.length) {
                this.data.length *= 2;
            }
        };

        SmartArray.prototype.pushNoDuplicate = function (value) {
            if (this.indexOf(value) > -1) {
                return;
            }
            this.push(value);
        };

        SmartArray.prototype.sort = function (compareFn) {
            this.data.sort(compareFn);
        };

        SmartArray.prototype.reset = function () {
            this.length = 0;
        };

        SmartArray.prototype.concat = function (array) {
            if (array.length === 0) {
                return;
            }
            if (this.length + array.length > this.data.length) {
                this.data.length = (this.length + array.length) * 2;
            }

            for (var index = 0; index < array.length; index++) {
                this.data[this.length++] = (array.data || array)[index];
            }
        };

        SmartArray.prototype.concatWithNoDuplicate = function (array) {
            if (array.length === 0) {
                return;
            }
            if (this.length + array.length > this.data.length) {
                this.data.length = (this.length + array.length) * 2;
            }

            for (var index = 0; index < array.length; index++) {
                var item = (array.data || array)[index];
                var pos = this.data.indexOf(item);

                if (pos === -1 || pos >= this.length) {
                    this.data[this.length++] = item;
                }
            }
        };

        SmartArray.prototype.indexOf = function (value) {
            var position = this.data.indexOf(value);

            if (position >= this.length) {
                return -1;
            }

            return position;
        };
        return SmartArray;
    })();
    BABYLON.SmartArray = SmartArray;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.smartArray.js.map
