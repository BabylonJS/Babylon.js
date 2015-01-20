var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var GroundMesh = (function (_super) {
        __extends(GroundMesh, _super);
        function GroundMesh(name, scene) {
            _super.call(this, name, scene);
            this.generateOctree = false;
            this._worldInverse = new BABYLON.Matrix();
        }
        Object.defineProperty(GroundMesh.prototype, "subdivisions", {
            get: function () {
                return this._subdivisions;
            },
            enumerable: true,
            configurable: true
        });
        GroundMesh.prototype.optimize = function (chunksCount) {
            this.subdivide(this._subdivisions);
            this.createOrUpdateSubmeshesOctree(32);
        };
        GroundMesh.prototype.getHeightAtCoordinates = function (x, z) {
            var ray = new BABYLON.Ray(new BABYLON.Vector3(x, this.getBoundingInfo().boundingBox.maximumWorld.y + 1, z), new BABYLON.Vector3(0, -1, 0));
            this.getWorldMatrix().invertToRef(this._worldInverse);
            ray = BABYLON.Ray.Transform(ray, this._worldInverse);
            var pickInfo = this.intersects(ray);
            if (pickInfo.hit) {
                return pickInfo.pickedPoint.y;
            }
            return 0;
        };
        return GroundMesh;
    })(BABYLON.Mesh);
    BABYLON.GroundMesh = GroundMesh;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.groundMesh.js.map