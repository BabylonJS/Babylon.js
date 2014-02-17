"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.Space = {
        LOCAL: 0,
        WORLD: 1
    };

    BABYLON.Axis =  {
        X: new BABYLON.Vector3(1, 0, 0),
        Y: new BABYLON.Vector3(0, 1, 0),
        Z: new BABYLON.Vector3(0, 0, 1)
    };
})();