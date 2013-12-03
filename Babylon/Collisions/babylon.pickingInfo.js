"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.PickingInfo = function () {
    };

    // Properties
    BABYLON.PickingInfo.prototype.hit = false;
    BABYLON.PickingInfo.prototype.distance = 0;
    BABYLON.PickingInfo.prototype.pickedPoint = null;
    BABYLON.PickingInfo.prototype.pickedMesh = null;
})();