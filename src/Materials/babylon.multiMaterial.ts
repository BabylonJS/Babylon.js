module BABYLON {
    export class MultiMaterial extends Material {
        private _subMaterials: Nullable<Material>[];
        public get subMaterials(): Nullable<Material>[] {
            return this._subMaterials;
        }

        public set subMaterials(value: Nullable<Material>[]) {
            this._subMaterials = value;
            this._hookArray(value);
        }
        
        constructor(name: string, scene: Scene) {
            super(name, scene, true);
            
            scene.multiMaterials.push(this);

            this.subMaterials = new Array<Material>();

            this.storeEffectOnSubMeshes = true; // multimaterial is considered like a push material
        }

        private _hookArray(array: Nullable<Material>[]): void {
            var oldPush = array.push;
            array.push = (...items: Nullable<Material>[]) => {
                var result = oldPush.apply(array, items);

                this._markAllSubMeshesAsTexturesDirty();

                return result;
            }

            var oldSplice = array.splice;
            array.splice = (index: number, deleteCount?: number) => {
                var deleted = oldSplice.apply(array, [index, deleteCount]);

                this._markAllSubMeshesAsTexturesDirty();

                return deleted;
            }
        }    

        // Properties
        public getSubMaterial(index: number): Nullable<Material> {
            if (index < 0 || index >= this.subMaterials.length) {
                return this.getScene().defaultMaterial;
            }

            return this.subMaterials[index];
        }

        public getActiveTextures(): BaseTexture[] {
            return super.getActiveTextures().concat(...this.subMaterials.map(subMaterial => {
                if (subMaterial) {
                return subMaterial.getActiveTextures();
            } else {
                return [];
            }}));
        }

        // Methods
        public getClassName(): string {
            return "MultiMaterial";
        }

        public isReadyForSubMesh(mesh: AbstractMesh, subMesh: BaseSubMesh, useInstances?: boolean): boolean {
            for (var index = 0; index < this.subMaterials.length; index++) {
                var subMaterial = this.subMaterials[index];
                if (subMaterial) {
                    if (subMaterial.storeEffectOnSubMeshes) {
                        if (!subMaterial.isReadyForSubMesh(mesh, subMesh, useInstances)) {
                            return false;
                        }
                        continue;
                    }

                    if (!subMaterial.isReady(mesh)) {
                        return false;
                    }
                }
            }

            return true;
        }

        public clone(name: string, cloneChildren?: boolean): MultiMaterial {
            var newMultiMaterial = new MultiMaterial(name, this.getScene());

            for (var index = 0; index < this.subMaterials.length; index++) {
                var subMaterial: Nullable<Material> = null;
                let current = this.subMaterials[index];
                if (cloneChildren && current) {
                    subMaterial = current.clone(name + "-" + current.name);
                } else {
                    subMaterial = this.subMaterials[index];
                }
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

        public dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean): void {
            var scene = this.getScene();
            if (!scene) {
                return;
            }

            var index = scene.multiMaterials.indexOf(this);
            if (index >= 0) {
                scene.multiMaterials.splice(index, 1);
            }

            super.dispose(forceDisposeEffect, forceDisposeTextures);
        }
    }
} 