module BABYLON {
    export class MultiMaterial extends Material {
        public subMaterials = new Array<Material>();

        constructor(name: string, scene: Scene) {
            super(name, scene, true);

            scene.multiMaterials.push(this);
        }

        // Properties
        public getSubMaterial(index) {
            if (index < 0 || index >= this.subMaterials.length) {
                return this.getScene().defaultMaterial;
            }

            return this.subMaterials[index];
        }

        // Methods
        public isReady(mesh?: AbstractMesh): boolean {
            for (var index = 0; index < this.subMaterials.length; index++) {
                var subMaterial = this.subMaterials[index];
                if (subMaterial) {
                    if (!this.subMaterials[index].isReady(mesh)) {
                        return false;
                    }
                }
            }

            return true;
        }

        public clone(name: string): MultiMaterial {
            var newMultiMaterial = new MultiMaterial(name, this.getScene());

            for (var index = 0; index < this.subMaterials.length; index++) {
                var subMaterial = this.subMaterials[index];
                newMultiMaterial.subMaterials.push(subMaterial);
            }

            return newMultiMaterial;
        }

        public serialize(): any {
            var serializationObject: any = {};

            serializationObject.name = this.name;
            serializationObject.id = this.id;
            serializationObject.tags = Tags.GetTags(this);

            serializationObject.materials = [];

            for (var matIndex = 0; matIndex < this.subMaterials.length; matIndex++) {
                var subMat = this.subMaterials[matIndex];

                if (subMat) {
                    serializationObject.materials.push(subMat.id);
                } else {
                    serializationObject.materials.push(null);
                }
            }

            return serializationObject;
        }

        public static ParseMultiMaterial(parsedMultiMaterial: any, scene: Scene): MultiMaterial {
            var multiMaterial = new BABYLON.MultiMaterial(parsedMultiMaterial.name, scene);

            multiMaterial.id = parsedMultiMaterial.id;

            Tags.AddTagsTo(multiMaterial, parsedMultiMaterial.tags);

            for (var matIndex = 0; matIndex < parsedMultiMaterial.materials.length; matIndex++) {
                var subMatId = parsedMultiMaterial.materials[matIndex];

                if (subMatId) {
                    multiMaterial.subMaterials.push(scene.getMaterialByID(subMatId));
                } else {
                    multiMaterial.subMaterials.push(null);
                }
            }

            return multiMaterial;
        }
    }
} 