var BABYLON;
(function (BABYLON) {
    /**
     * Node is the basic class for all scene objects (Mesh, Light Camera).
     */
    var Node = (function () {
        /**
         * @constructor
         * @param {string} name - the name and id to be given to this node
         * @param {BABYLON.Scene} the scene this node will be added to
         */
        function Node(name, scene) {
            this.state = "";
            this.animations = new Array();
            this._childrenFlag = -1;
            this._isEnabled = true;
            this._isReady = true;
            this._currentRenderId = -1;
            this._parentRenderId = -1;
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
        Node.prototype._markSyncedWithParent = function () {
            this._parentRenderId = this.parent._currentRenderId;
        };
        Node.prototype.isSynchronizedWithParent = function () {
            if (!this.parent) {
                return true;
            }
            if (this._parentRenderId !== this.parent._currentRenderId) {
                return false;
            }
            return this.parent.isSynchronized();
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
        /**
         * Is this node ready to be used/rendered
         * @return {boolean} is it ready
         */
        Node.prototype.isReady = function () {
            return this._isReady;
        };
        /**
         * Is this node enabled.
         * If the node has a parent and is enabled, the parent will be inspected as well.
         * @return {boolean} whether this node (and its parent) is enabled.
         * @see setEnabled
         */
        Node.prototype.isEnabled = function () {
            if (!this._isEnabled) {
                return false;
            }
            if (this.parent) {
                return this.parent.isEnabled();
            }
            return true;
        };
        /**
         * Set the enabled state of this node.
         * @param {boolean} value - the new enabled state
         * @see isEnabled
         */
        Node.prototype.setEnabled = function (value) {
            this._isEnabled = value;
        };
        /**
         * Is this node a descendant of the given node.
         * The function will iterate up the hierarchy until the ancestor was found or no more parents defined.
         * @param {BABYLON.Node} ancestor - The parent node to inspect
         * @see parent
         */
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
        /**
         * Will return all nodes that have this node as parent.
         * @return {BABYLON.Node[]} all children nodes of all types.
         */
        Node.prototype.getDescendants = function () {
            var results = [];
            this._getDescendants(this._scene.meshes, results);
            this._getDescendants(this._scene.lights, results);
            this._getDescendants(this._scene.cameras, results);
            return results;
        };
        Node.prototype._setReady = function (state) {
            if (state === this._isReady) {
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
        Node.prototype.getAnimationByName = function (name) {
            for (var i = 0; i < this.animations.length; i++) {
                var animation = this.animations[i];
                if (animation.name === name) {
                    return animation;
                }
            }
            return null;
        };
        return Node;
    })();
    BABYLON.Node = Node;
})(BABYLON || (BABYLON = {}));
