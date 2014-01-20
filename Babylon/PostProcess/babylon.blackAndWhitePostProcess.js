"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.BlackAndWhitePostProcess = function (name, ratio, camera, samplingMode, engine, reusable) {
        BABYLON.PostProcess.call(this, name, "blackAndWhite", null, null, ratio, camera, samplingMode, engine, reusable);
    };
    
    BABYLON.BlackAndWhitePostProcess.prototype = Object.create(BABYLON.PostProcess.prototype);

})();