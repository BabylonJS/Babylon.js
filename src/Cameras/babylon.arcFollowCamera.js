var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var ArcFollowCamera = (function (_super) {
        __extends(ArcFollowCamera, _super);
        function ArcFollowCamera(name, alpha, beta, radius, target, scene) {
            _super.call(this, name, BABYLON.Vector3.Zero(), scene);
            this.alpha = alpha;
            this.beta = beta;
            this.radius = radius;
            this.target = target;
            this._radPerDeg = Math.PI / 180;
            this._cartesianCoordinates = BABYLON.Vector3.Zero();
            this.follow();
        }
        ArcFollowCamera.prototype._degToRad = function (deg) {
            return deg * this._radPerDeg;
        };
        ArcFollowCamera.prototype.follow = function () {
            this._cartesianCoordinates.x = this.radius * Math.cos(this._degToRad(this.alpha)) * Math.cos(this._degToRad(this.beta));
            this._cartesianCoordinates.y = this.radius * Math.sin(this._degToRad(this.beta));
            this._cartesianCoordinates.z = this.radius * Math.sin(this._degToRad(this.alpha)) * Math.cos(this._degToRad(this.beta));
            this.position = this.target.position.add(this._cartesianCoordinates);
            this.setTarget(this.target.position);
        };
        ArcFollowCamera.prototype._checkInputs = function () {
            _super.prototype._checkInputs.call(this);
            this.follow();
        };
        return ArcFollowCamera;
    })(BABYLON.TargetCamera);
    BABYLON.ArcFollowCamera = ArcFollowCamera;
})(BABYLON || (BABYLON = {}));
