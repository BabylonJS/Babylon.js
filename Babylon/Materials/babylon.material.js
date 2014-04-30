var BABYLON;
(function (BABYLON) {
    var Material = (function () {
        function Material(name, scene, doNotAdd) {
            this.name = name;
            this.checkReadyOnEveryCall = true;
            this.checkReadyOnlyOnce = false;
            this.alpha = 1.0;
            this.wireframe = false;
            this.backFaceCulling = true;
            this._wasPreviouslyReady = false;
            this.id = name;

            this._scene = scene;

            if (!doNotAdd) {
                scene.materials.push(this);
            }
        }
        Material.prototype.isReady = function (mesh) {
            return true;
        };

        Material.prototype.getEffect = function () {
            return this._effect;
        };

        Material.prototype.getScene = function () {
            return this._scene;
        };

        Material.prototype.needAlphaBlending = function () {
            return (this.alpha < 1.0);
        };

        Material.prototype.needAlphaTesting = function () {
            return false;
        };

        Material.prototype.trackCreation = function (onCompiled, onError) {
        };

        Material.prototype._preBind = function () {
            var engine = this._scene.getEngine();

            engine.enableEffect(this._effect);
            engine.setState(this.backFaceCulling);
        };

        Material.prototype.bind = function (world, mesh) {
        };

        Material.prototype.unbind = function () {
        };

        Material.prototype.dispose = function (forceDisposeEffect) {
            // Remove from scene
            var index = this._scene.materials.indexOf(this);
            this._scene.materials.splice(index, 1);

            // Shader are kept in cache for further use but we can get rid of this by using forceDisposeEffect
            if (forceDisposeEffect && this._effect) {
                this._scene.getEngine()._releaseEffect(this._effect);
                this._effect = null;
            }

            // Callback
            if (this.onDispose) {
                this.onDispose();
            }
        };
        return Material;
    })();
    BABYLON.Material = Material;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.material.js.map
