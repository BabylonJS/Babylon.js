var BABYLON;
(function (BABYLON) {
    var ReflectionProbe = (function () {
        function ReflectionProbe(size, scene) {
            this._scene = scene;
            this._scene.reflectionProbes.push(this);
        }
        ReflectionProbe.prototype.getScene = function () {
            return this._scene;
        };
        ReflectionProbe.prototype.dispose = function () {
            var index = this._scene.reflectionProbes.indexOf(this);
            if (index !== -1) {
                // Remove from the scene if found 
                this._scene.reflectionProbes.splice(index, 1);
            }
        };
        return ReflectionProbe;
    })();
    BABYLON.ReflectionProbe = ReflectionProbe;
})(BABYLON || (BABYLON = {}));
