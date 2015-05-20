var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var MultiMaterial = (function (_super) {
        __extends(MultiMaterial, _super);
        function MultiMaterial(name, scene) {
            _super.call(this, name, scene, true);
            this.subMaterials = new Array();
            scene.multiMaterials.push(this);
        }
        // Properties
        MultiMaterial.prototype.getSubMaterial = function (index) {
            if (index < 0 || index >= this.subMaterials.length) {
                return this.getScene().defaultMaterial;
            }
            return this.subMaterials[index];
        };
        // Methods
        MultiMaterial.prototype.isReady = function (mesh) {
            for (var index = 0; index < this.subMaterials.length; index++) {
                var subMaterial = this.subMaterials[index];
                if (subMaterial) {
                    if (!this.subMaterials[index].isReady(mesh)) {
                        return false;
                    }
                }
            }
            return true;
        };
        MultiMaterial.prototype.clone = function (name) {
            var newMultiMaterial = new MultiMaterial(name, this.getScene());
            for (var index = 0; index < this.subMaterials.length; index++) {
                var subMaterial = this.subMaterials[index];
                newMultiMaterial.subMaterials.push(subMaterial);
            }
            return newMultiMaterial;
        };
        return MultiMaterial;
    })(BABYLON.Material);
    BABYLON.MultiMaterial = MultiMaterial;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.multiMaterial.js.map