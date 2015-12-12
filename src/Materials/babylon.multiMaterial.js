var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
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
        MultiMaterial.prototype.clone = function (name, cloneChildren) {
            var newMultiMaterial = new MultiMaterial(name, this.getScene());
            for (var index = 0; index < this.subMaterials.length; index++) {
                var subMaterial = null;
                if (cloneChildren) {
                    subMaterial = this.subMaterials[index].clone(name + "-" + this.subMaterials[index].name);
                }
                else {
                    subMaterial = this.subMaterials[index];
                }
                newMultiMaterial.subMaterials.push(subMaterial);
            }
            return newMultiMaterial;
        };
        MultiMaterial.prototype.serialize = function () {
            var serializationObject = {};
            serializationObject.name = this.name;
            serializationObject.id = this.id;
            serializationObject.tags = BABYLON.Tags.GetTags(this);
            serializationObject.materials = [];
            for (var matIndex = 0; matIndex < this.subMaterials.length; matIndex++) {
                var subMat = this.subMaterials[matIndex];
                if (subMat) {
                    serializationObject.materials.push(subMat.id);
                }
                else {
                    serializationObject.materials.push(null);
                }
            }
            return serializationObject;
        };
        return MultiMaterial;
    })(BABYLON.Material);
    BABYLON.MultiMaterial = MultiMaterial;
})(BABYLON || (BABYLON = {}));
