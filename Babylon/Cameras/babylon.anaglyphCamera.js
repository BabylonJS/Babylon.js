var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var buildCamera = function (that, name) {
        that._leftCamera.isIntermediate = true;
        that.subCameras.push(that._leftCamera);
        that.subCameras.push(that._rightCamera);
        that._leftTexture = new BABYLON.PassPostProcess(name + "_leftTexture", 1.0, that._leftCamera);
        that._anaglyphPostProcess = new BABYLON.AnaglyphPostProcess(name + "_anaglyph", 1.0, that._rightCamera);
        that._anaglyphPostProcess.onApply = function (effect) {
            effect.setTextureFromPostProcess("leftSampler", that._leftTexture);
        };
        that._update();
    };
    var AnaglyphArcRotateCamera = (function (_super) {
        __extends(AnaglyphArcRotateCamera, _super);
        // ANY
        function AnaglyphArcRotateCamera(name, alpha, beta, radius, target, eyeSpace, scene) {
            _super.call(this, name, alpha, beta, radius, target, scene);
            this._eyeSpace = BABYLON.Tools.ToRadians(eyeSpace);
            this._leftCamera = new BABYLON.ArcRotateCamera(name + "_left", alpha - this._eyeSpace, beta, radius, target, scene);
            this._rightCamera = new BABYLON.ArcRotateCamera(name + "_right", alpha + this._eyeSpace, beta, radius, target, scene);
            buildCamera(this, name);
        }
        AnaglyphArcRotateCamera.prototype._update = function () {
            this._updateCamera(this._leftCamera);
            this._updateCamera(this._rightCamera);
            this._leftCamera.alpha = this.alpha - this._eyeSpace;
            this._rightCamera.alpha = this.alpha + this._eyeSpace;
            _super.prototype._update.call(this);
        };
        AnaglyphArcRotateCamera.prototype._updateCamera = function (camera) {
            camera.beta = this.beta;
            camera.radius = this.radius;
            camera.minZ = this.minZ;
            camera.maxZ = this.maxZ;
            camera.fov = this.fov;
            camera.target = this.target;
        };
        return AnaglyphArcRotateCamera;
    })(BABYLON.ArcRotateCamera);
    BABYLON.AnaglyphArcRotateCamera = AnaglyphArcRotateCamera;
    var AnaglyphFreeCamera = (function (_super) {
        __extends(AnaglyphFreeCamera, _super);
        function AnaglyphFreeCamera(name, position, eyeSpace, scene) {
            _super.call(this, name, position, scene);
            this._eyeSpace = BABYLON.Tools.ToRadians(eyeSpace);
            this._transformMatrix = new BABYLON.Matrix();
            this._leftCamera = new BABYLON.FreeCamera(name + "_left", position.clone(), scene);
            this._rightCamera = new BABYLON.FreeCamera(name + "_right", position.clone(), scene);
            buildCamera(this, name);
        }
        AnaglyphFreeCamera.prototype._getSubCameraPosition = function (eyeSpace, result) {
            var target = this.getTarget();
            BABYLON.Matrix.Translation(-target.x, -target.y, -target.z).multiplyToRef(BABYLON.Matrix.RotationY(eyeSpace), this._transformMatrix);
            this._transformMatrix = this._transformMatrix.multiply(BABYLON.Matrix.Translation(target.x, target.y, target.z));
            BABYLON.Vector3.TransformCoordinatesToRef(this.position, this._transformMatrix, result);
        };
        AnaglyphFreeCamera.prototype._update = function () {
            this._getSubCameraPosition(-this._eyeSpace, this._leftCamera.position);
            this._getSubCameraPosition(this._eyeSpace, this._rightCamera.position);
            this._updateCamera(this._leftCamera);
            this._updateCamera(this._rightCamera);
            _super.prototype._update.call(this);
        };
        AnaglyphFreeCamera.prototype._updateCamera = function (camera) {
            camera.minZ = this.minZ;
            camera.maxZ = this.maxZ;
            camera.fov = this.fov;
            camera.viewport = this.viewport;
            camera.setTarget(this.getTarget());
        };
        return AnaglyphFreeCamera;
    })(BABYLON.FreeCamera);
    BABYLON.AnaglyphFreeCamera = AnaglyphFreeCamera;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.anaglyphCamera.js.map