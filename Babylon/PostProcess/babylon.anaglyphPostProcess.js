"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.AnaglyphPostProcess = function (name, ratio, camera, samplingMode, engine, reusable) {
        BABYLON.PostProcess.call(this, name, "anaglyph", null, ["leftSampler", "rightSampler"], ratio, camera, samplingMode, engine, reusable);
    };

    BABYLON.AnaglyphPostProcess.prototype = Object.create(BABYLON.PostProcess.prototype);

})();