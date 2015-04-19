var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var Light = (function (_super) {
        __extends(Light, _super);
        function Light(name, scene) {
            _super.call(this, name, scene);
            this.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
            this.specular = new BABYLON.Color3(1.0, 1.0, 1.0);
            this.intensity = 1.0;
            this.range = Number.MAX_VALUE;
            this.includeOnlyWithLayerMask = 0;
            this.includedOnlyMeshes = new Array();
            this.excludedMeshes = new Array();
            this.excludeWithLayerMask = 0;
            this._excludedMeshesIds = new Array();
            this._includedOnlyMeshesIds = new Array();
            scene.addLight(this);
        }
        Light.prototype.getShadowGenerator = function () {
            return this._shadowGenerator;
        };
        Light.prototype.getAbsolutePosition = function () {
            return BABYLON.Vector3.Zero();
        };
        Light.prototype.transferToEffect = function (effect, uniformName0, uniformName1) {
        };
        Light.prototype._getWorldMatrix = function () {
            return BABYLON.Matrix.Identity();
        };
        Light.prototype.canAffectMesh = function (mesh) {
            if (!mesh) {
                return true;
            }
            if (this.includedOnlyMeshes.length > 0 && this.includedOnlyMeshes.indexOf(mesh) === -1) {
                return false;
            }
            if (this.excludedMeshes.length > 0 && this.excludedMeshes.indexOf(mesh) !== -1) {
                return false;
            }
            if (this.includeOnlyWithLayerMask !== 0 && (this.includeOnlyWithLayerMask & mesh.layerMask) === 0) {
                return false;
            }
            if (this.excludeWithLayerMask !== 0 && this.excludeWithLayerMask & mesh.layerMask) {
                return false;
            }
            return true;
        };
        Light.prototype.getWorldMatrix = function () {
            this._currentRenderId = this.getScene().getRenderId();
            var worldMatrix = this._getWorldMatrix();
            if (this.parent && this.parent.getWorldMatrix) {
                if (!this._parentedWorldMatrix) {
                    this._parentedWorldMatrix = BABYLON.Matrix.Identity();
                }
                worldMatrix.multiplyToRef(this.parent.getWorldMatrix(), this._parentedWorldMatrix);
                this._markSyncedWithParent();
                return this._parentedWorldMatrix;
            }
            return worldMatrix;
        };
        Light.prototype.dispose = function () {
            if (this._shadowGenerator) {
                this._shadowGenerator.dispose();
                this._shadowGenerator = null;
            }
            // Remove from scene
            this.getScene().removeLight(this);
        };
        return Light;
    })(BABYLON.Node);
    BABYLON.Light = Light;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.light.js.map