var INSPECTOR;
(function (INSPECTOR) {
    var Scheduler = (function () {
        function Scheduler() {
            /** Is this scheduler in pause ? */
            this.pause = false;
            /** The list of data to update */
            this._updatableProperties = [];
            this._timer = setInterval(this._update.bind(this), Scheduler.REFRESH_TIME);
        }
        Scheduler.getInstance = function () {
            if (!Scheduler._instance) {
                Scheduler._instance = new Scheduler();
                console.log('create ');
            }
            return Scheduler._instance;
        };
        /** Add a property line to be updated every X ms */
        Scheduler.prototype.add = function (prop) {
            this._updatableProperties.push(prop);
        };
        /** Removes the given property from the list of properties to update */
        Scheduler.prototype.remove = function (prop) {
            var index = this._updatableProperties.indexOf(prop);
            if (index != -1) {
                this._updatableProperties.splice(index, 1);
            }
        };
        Scheduler.prototype._update = function () {
            // If not in pause, update 
            if (!this.pause) {
                for (var _i = 0, _a = this._updatableProperties; _i < _a.length; _i++) {
                    var prop = _a[_i];
                    prop.update();
                }
            }
        };
        /** All properties are refreshed every 250ms */
        Scheduler.REFRESH_TIME = 250;
        return Scheduler;
    }());
    INSPECTOR.Scheduler = Scheduler;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=Scheduler.js.map