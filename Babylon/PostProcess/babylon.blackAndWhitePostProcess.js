var BABYLON = BABYLON || {};

(function () {
    BABYLON.BlackAndWhitePostProcess = function (name, ratio, camera) {
        BABYLON.PostProcess.call(this, name, "blackAndWhite", null, null, ratio, camera);
    };
    
    BABYLON.BlackAndWhitePostProcess.prototype = Object.create(BABYLON.PostProcess.prototype);

})();