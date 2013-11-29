"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.Node = function () {
    };
    
    // Properties
    BABYLON.Node.prototype.parent = null;
    BABYLON.Node.prototype._childrenFlag = false;
    BABYLON.Node.prototype._isReady = true;
    BABYLON.Node.prototype._isEnabled = true;

    
    BABYLON.Node.prototype.isSynchronized = function () {
        return true;
    };
    
    BABYLON.Node.prototype._needToSynchonizeChildren = function () {
        return this._childrenFlag;
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

    BABYLON.Node.prototype._getDescendants = function(list, results) {
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