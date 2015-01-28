var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var LinesMesh = (function (_super) {
        __extends(LinesMesh, _super);
        function LinesMesh(name, scene, updatable) {
            if (updatable === void 0) { updatable = false; }
            _super.call(this, name, scene);
            this.color = new BABYLON.Color3(1, 1, 1);
            this.alpha = 1;
            this._indices = new Array();
            this._colorShader = new BABYLON.ShaderMaterial("colorShader", scene, "color", {
                attributes: ["position"],
                uniforms: ["worldViewProjection", "color"],
                needAlphaBlending: true
            });
        }
        Object.defineProperty(LinesMesh.prototype, "material", {
            get: function () {
                return this._colorShader;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LinesMesh.prototype, "isPickable", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LinesMesh.prototype, "checkCollisions", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        LinesMesh.prototype._bind = function (subMesh, effect, fillMode) {
            var engine = this.getScene().getEngine();
            var indexToBind = this._geometry.getIndexBuffer();
            // VBOs
            engine.bindBuffers(this._geometry.getVertexBuffer(BABYLON.VertexBuffer.PositionKind).getBuffer(), indexToBind, [3], 3 * 4, this._colorShader.getEffect());
            // Color
            this._colorShader.setColor4("color", this.color.toColor4(this.alpha));
        };
        LinesMesh.prototype._draw = function (subMesh, fillMode, instancesCount) {
            if (!this._geometry || !this._geometry.getVertexBuffers() || !this._geometry.getIndexBuffer()) {
                return;
            }
            var engine = this.getScene().getEngine();
            // Draw order
            engine.draw(false, subMesh.indexStart, subMesh.indexCount);
        };
        LinesMesh.prototype.intersects = function (ray, fastCheck) {
            return null;
        };
        LinesMesh.prototype.dispose = function (doNotRecurse) {
            this._colorShader.dispose();
            _super.prototype.dispose.call(this, doNotRecurse);
        };
        return LinesMesh;
    })(BABYLON.Mesh);
    BABYLON.LinesMesh = LinesMesh;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.linesMesh.js.map