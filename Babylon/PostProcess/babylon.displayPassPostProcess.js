"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.DisplayPassPostProcess = function (name, ratio, camera, samplingMode, engine, reusable) {
        BABYLON.PostProcess.call(this, name, "displayPass", ["passSampler"], ["passSampler"], ratio, camera, samplingMode, engine, reusable);
    };

    BABYLON.DisplayPassPostProcess.prototype = Object.create(BABYLON.PostProcess.prototype);
})();