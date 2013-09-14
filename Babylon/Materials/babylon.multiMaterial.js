var BABYLON = BABYLON || {};

(function () {
    BABYLON.MultiMaterial = function (name, scene) {
        this.name = name;
        this.id = name;
        
        this._scene = scene;
        scene.multiMaterials.push(this);

        this.subMaterials = [];
    };

    // Properties
    BABYLON.MultiMaterial.prototype.getSubMaterial = function (index) {
        if (index < 0 || index >= this.subMaterials.length) {
            return this._scene.defaultMaterial;
        }

        return this.subMaterials[index];
    };
    
    // Methods
    BABYLON.MultiMaterial.prototype.isReady = function (mesh) {
        var result = true;
        for (var index = 0; index < this.subMaterials.length; index++) {
            var subMaterial = this.subMaterials[index];
            if (subMaterial) {
                result &= this.subMaterials[index].isReady(mesh);
            }
        }

        return result;
    };
})();