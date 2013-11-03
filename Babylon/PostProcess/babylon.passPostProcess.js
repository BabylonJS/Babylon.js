var BABYLON = BABYLON || {};

(function () {
    BABYLON.PassPostProcess = function (name, ratio, camera) {
        BABYLON.PostProcess.call(this, name, "pass", null, null, ratio, camera);
    };
    
    BABYLON.PassPostProcess.prototype = Object.create(BABYLON.PostProcess.prototype);

})();