var BABYLON = BABYLON || {};

(function () {
    BABYLON.PostProcessManager = function () {
        this.postProcesses = [];
    };

    // Methods
    BABYLON.PostProcessManager.prototype._prepareFrame = function () {
        if (this.postProcesses.length === 0) {
            return;
        }
    };
    
    BABYLON.PostProcessManager.prototype._finalizeFrame = function () {
        if (this.postProcesses.length === 0) {
            return;
        }
    };
})();