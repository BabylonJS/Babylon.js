var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
            this._ranges = {};
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
        /**
         * Evaluate a list of nodes and determine if they should be considered as descendants considering the given criterias
         * @param {BABYLON.Node[]} list the input array of nodes to evaluate
         * @param {BABYLON.Node[]} results the result array containing the nodes matching the given criterias
         * @param {boolean} directDecendantsOnly if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered.
         * @param predicate: an optional predicate that will be called on every evaluated children, the predicate must return true for a given child to be part of the result, otherwise it will be ignored.
         */
        Node.prototype._getDescendants = function (list, results, directDecendantsOnly, predicate) {
            if (directDecendantsOnly === void 0) { directDecendantsOnly = false; }
            for (var index = 0; index < list.length; index++) {
                var item = list[index];
                if (((directDecendantsOnly && item.parent === this) || (!directDecendantsOnly && item.isDescendantOf(this))) && (predicate === null || predicate(item))) {
                    results.push(item);
                }
            }
        };
        /**
         * Will return all nodes that have this node as parent.
         * @param {boolean} directDecendantsOnly if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered.
         * @param predicate: an optional predicate that will be called on every evaluated children, the predicate must return true for a given child to be part of the result, otherwise it will be ignored.
         * @return {BABYLON.Node[]} all children nodes of all types.
         */
        Node.prototype.getDescendants = function (directDecendantsOnly, predicate) {
            var results = [];
            this._getDescendants(this._scene.meshes, results, directDecendantsOnly, predicate);
            this._getDescendants(this._scene.lights, results, directDecendantsOnly, predicate);
            this._getDescendants(this._scene.cameras, results, directDecendantsOnly, predicate);
            return results;
        };
        /**
         * @param predicate: an optional predicate that will be called on every evaluated children, the predicate must return true for a given child to be part of the result, otherwise it will be ignored.
         * @Deprecated, legacy support.
         * use getDecendants instead.
         */
        Node.prototype.getChildren = function (predicate) {
            return this.getDescendants(true, predicate);
        };
        /**
         * Get all child-meshes of this node.
         */
        Node.prototype.getChildMeshes = function (directDecendantsOnly, predicate) {
            var results = [];
            this._getDescendants(this._scene.meshes, results, directDecendantsOnly, predicate);
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
        Node.prototype.createAnimationRange = function (name, from, to) {
            // check name not already in use
            if (!this._ranges[name]) {
                this._ranges[name] = new BABYLON.AnimationRange(name, from, to);
                for (var i = 0, nAnimations = this.animations.length; i < nAnimations; i++) {
                    if (this.animations[i]) {
                        this.animations[i].createRange(name, from, to);
                    }
                }
            }
        };
        Node.prototype.deleteAnimationRange = function (name, deleteFrames) {
            if (deleteFrames === void 0) { deleteFrames = true; }
            for (var i = 0, nAnimations = this.animations.length; i < nAnimations; i++) {
                if (this.animations[i]) {
                    this.animations[i].deleteRange(name, deleteFrames);
                }
            }
            this._ranges[name] = undefined; // said much faster than 'delete this._range[name]' 
        };
        Node.prototype.getAnimationRange = function (name) {
            return this._ranges[name];
        };
        Node.prototype.beginAnimation = function (name, loop, speedRatio, onAnimationEnd) {
            var range = this.getAnimationRange(name);
            if (!range) {
                return null;
            }
            this._scene.beginAnimation(this, range.from, range.to, loop, speedRatio, onAnimationEnd);
        };
        Node.prototype.serializeAnimationRanges = function () {
            var serializationRanges = [];
            for (var name in this._ranges) {
                var range = {};
                range.name = name;
                range.from = this._ranges[name].from;
                range.to = this._ranges[name].to;
                serializationRanges.push(range);
            }
            return serializationRanges;
        };
        Node.ParseAnimationRanges = function (node, parsedNode, scene) {
            if (parsedNode.ranges) {
                for (var index = 0; index < parsedNode.ranges.length; index++) {
                    var data = parsedNode.ranges[index];
                    node.createAnimationRange(data.name, data.from, data.to);
                }
            }
        };
        __decorate([
            BABYLON.serialize()
        ], Node.prototype, "name", void 0);
        __decorate([
            BABYLON.serialize()
        ], Node.prototype, "id", void 0);
        __decorate([
            BABYLON.serialize()
        ], Node.prototype, "uniqueId", void 0);
        __decorate([
            BABYLON.serialize()
        ], Node.prototype, "state", void 0);
        return Node;
    }());
    BABYLON.Node = Node;
})(BABYLON || (BABYLON = {}));
