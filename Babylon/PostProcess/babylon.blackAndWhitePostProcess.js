"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.BlackAndWhitePostProcess = function (name, ratio, camera, samplingMode) {
        BABYLON.PostProcess.call(this, name, "blackAndWhite", null, null, ratio, camera, samplingMode);
    };
    
    BABYLON.BlackAndWhitePostProcess.prototype = Object.create(BABYLON.PostProcess.prototype);

})();