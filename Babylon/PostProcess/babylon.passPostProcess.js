"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.PassPostProcess = function (name, ratio, camera, samplingMode, engine, reusable) {
        BABYLON.PostProcess.call(this, name, "pass", null, null, ratio, camera, samplingMode, engine, reusable);
    };
    
    BABYLON.PassPostProcess.prototype = Object.create(BABYLON.PostProcess.prototype);

})();