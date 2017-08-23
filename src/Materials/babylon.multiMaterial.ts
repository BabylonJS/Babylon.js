﻿module BABYLON {
    export class MultiMaterial extends Material {
        private _subMaterials: Material[];
        public get subMaterials(): Material[] {
            return this._subMaterials;
        }

        public set subMaterials(value: Material[]) {
            this._subMaterials = value;
            this._hookArray(value);
        }
        
        constructor(name: string, scene: Scene) {
            super(name, scene, true);
            
            scene.multiMaterials.push(this);

            this.subMaterials = new Array<Material>();

            this.storeEffectOnSubMeshes = true; // multimaterial is considered like a push material
        }

        private _hookArray(array: Material[]): void {
            var oldPush = array.push;
            array.push = (...items: Material[]) => {
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
        public getSubMaterial(index) {
            if (index < 0 || index >= this.subMaterials.length) {
                return this.getScene().defaultMaterial;
            }

            return this.subMaterials[index];
        }

        public getActiveTextures(): BaseTexture[] {
            return super.getActiveTextures().concat(...this.subMaterials.map(subMaterial => subMaterial.getActiveTextures()));
        }

        // Methods
        public getClassName(): string {
            return "MultiMaterial";
        }

        public isReadyForSubMesh(mesh: AbstractMesh, subMesh: BaseSubMesh, useInstances?: boolean): boolean {
            for (var index = 0; index < this.subMaterials.length; index++) {
                var subMaterial = this.subMaterials[index];
                if (subMaterial) {
                    if (this.subMaterials[index].storeEffectOnSubMeshes) {
                        if (!this.subMaterials[index].isReadyForSubMesh(mesh, subMesh, useInstances)) {
                            return false;
                        }
                        continue;
                    }

                    if (!this.subMaterials[index].isReady(mesh)) {
                        return false;
                    }
                }
            }

            return true;
        }

        public clone(name: string, cloneChildren?: boolean): MultiMaterial {
            var newMultiMaterial = new MultiMaterial(name, this.getScene());

            for (var index = 0; index < this.subMaterials.length; index++) {
                var subMaterial: Material = null;
                if (cloneChildren) {
                    subMaterial = this.subMaterials[index].clone(name + "-" + this.subMaterials[index].name);
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