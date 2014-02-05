"use strict";


var BABYLON = BABYLON || {};


(function () {
    BABYLON.Node = function (scene) {
        this._scene = scene;
        BABYLON.Node.prototype._initCache.call(this);
    };

    // Properties
    BABYLON.Node.prototype.parent = null;
    BABYLON.Node.prototype._childrenFlag = -1;
    BABYLON.Node.prototype._isReady = true;
    BABYLON.Node.prototype._isEnabled = true;
    BABYLON.Node.prototype._currentRenderId = -1;

    // Cache
    BABYLON.Node.prototype._cache = null;

    // override it in derived class if you add new variables to the cache
    // and call it in the constructor of your class like this
    // BABYLON.YourClass.prototype._initCache.call(this)
    // DO NOT call parent class method
    BABYLON.Node.prototype._initCache = function () {
        this._cache = {};
        this._cache.parent = undefined;
    };

    BABYLON.Node.prototype.updateCache = function (force) {
        if (!force && this.isSynchronized())
            return;

        this._cache.parent = this.parent;

        this._updateCache();
    };

    // override it in derived class if you add new variables to the cache
    // and call the parent class method if !ignoreParentClass
    // BABYLON.ParentClass.prototype._updateCache.call(this, ignoreParentClass)
    BABYLON.Node.prototype._updateCache = function (ignoreParentClass) {
    };

    // override it in derived class if you add new variables to the cache
    // and call the parent class method
    // BABYLON.ParentClass.prototype._isSynchronized.call(this)
    BABYLON.Node.prototype._isSynchronized = function () {
        return true;
    };

    BABYLON.Node.prototype.isSynchronizedWithParent = function() {
        return this.parent ? !this.parent._currentRenderId === this._currentRenderId : true;
    };

    BABYLON.Node.prototype.isSynchronized = function (updateCache) {
        var check = this.hasNewParent();

        check = check || !this.isSynchronizedWithParent();

        check = check || !this._isSynchronized();

        if (updateCache)
            this.updateCache(true);

        return !check;
    };

    BABYLON.Node.prototype.hasNewParent = function (update) {
        if (this._cache.parent === this.parent)
            return false;

        if (update)
            this._cache.parent = this.parent;

        return true;
    };

    BABYLON.Node.prototype.isReady = function () {
        return this._isReady;
    };

    BABYLON.Node.prototype.isEnabled = function () {
        if (!this.isReady() || !this._isEnabled) {
            return false;
        }


        if (this.parent) {
            return this.parent.isEnabled();
        }


        return true;
    };

    BABYLON.Node.prototype.setEnabled = function (value) {
        this._isEnabled = value;
    };

    BABYLON.Node.prototype.isDescendantOf = function (ancestor) {
        if (this.parent) {
            if (this.parent === ancestor) {
                return true;
            }


            return this.parent.isDescendantOf(ancestor);
        }
        return false;
    };

    BABYLON.Node.prototype._getDescendants = function (list, results) {
        for (var index = 0; index < list.length; index++) {
            var item = list[index];
            if (item.isDescendantOf(this)) {
                results.push(item);
            }
        }
    };

    BABYLON.Node.prototype.getDescendants = function () {
        var results = [];
        this._getDescendants(this._scene.meshes, results);
        this._getDescendants(this._scene.lights, results);
        this._getDescendants(this._scene.cameras, results);

        return results;
    };

})();

