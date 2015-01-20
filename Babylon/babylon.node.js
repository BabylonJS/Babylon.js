var BABYLON;
(function (BABYLON) {
    var Node = (function () {
        function Node(name, scene) {
            this.state = "";
            this.animations = new Array();
            this._childrenFlag = -1;
            this._isEnabled = true;
            this._isReady = true;
            this._currentRenderId = -1;
            this.name = name;
            this.id = name;
            this._scene = scene;
            this._initCache();
        }
        Node.prototype.getScene = function () {
            return this._scene;
        };

        Node.prototype.getEngine = function () {
            return this._scene.getEngine();
        };

        // override it in derived class
        Node.prototype.getWorldMatrix = function () {
            return BABYLON.Matrix.Identity();
        };

        // override it in derived class if you add new variables to the cache
        // and call the parent class method
        Node.prototype._initCache = function () {
            this._cache = {};
            this._cache.parent = undefined;
        };

        Node.prototype.updateCache = function (force) {
            if (!force && this.isSynchronized())
                return;

            this._cache.parent = this.parent;

            this._updateCache();
        };

        // override it in derived class if you add new variables to the cache
        // and call the parent class method if !ignoreParentClass
        Node.prototype._updateCache = function (ignoreParentClass) {
        };

        // override it in derived class if you add new variables to the cache
        Node.prototype._isSynchronized = function () {
            return true;
        };

        Node.prototype.isSynchronizedWithParent = function () {
            return this.parent ? this.parent._currentRenderId <= this._currentRenderId : true;
        };

        Node.prototype.isSynchronized = function (updateCache) {
            var check = this.hasNewParent();

            check = check || !this.isSynchronizedWithParent();

            check = check || !this._isSynchronized();

            if (updateCache)
                this.updateCache(true);

            return !check;
        };

        Node.prototype.hasNewParent = function (update) {
            if (this._cache.parent === this.parent)
                return false;

            if (update)
                this._cache.parent = this.parent;

            return true;
        };

        Node.prototype.isReady = function () {
            return this._isReady;
        };

        Node.prototype.isEnabled = function () {
            if (!this._isEnabled) {
                return false;
            }

            if (this.parent) {
                return this.parent.isEnabled();
            }

            return true;
        };

        Node.prototype.setEnabled = function (value) {
            this._isEnabled = value;
        };

        Node.prototype.isDescendantOf = function (ancestor) {
            if (this.parent) {
                if (this.parent === ancestor) {
                    return true;
                }

                return this.parent.isDescendantOf(ancestor);
            }
            return false;
        };

        Node.prototype._getDescendants = function (list, results) {
            for (var index = 0; index < list.length; index++) {
                var item = list[index];
                if (item.isDescendantOf(this)) {
                    results.push(item);
                }
            }
        };

        Node.prototype.getDescendants = function () {
            var results = [];
            this._getDescendants(this._scene.meshes, results);
            this._getDescendants(this._scene.lights, results);
            this._getDescendants(this._scene.cameras, results);

            return results;
        };

        Node.prototype._setReady = function (state) {
            if (state == this._isReady) {
                return;
            }

            if (!state) {
                this._isReady = false;
                return;
            }

            this._isReady = true;
            if (this.onReady) {
                this.onReady(this);
            }
        };
        return Node;
    })();
    BABYLON.Node = Node;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.node.js.map
