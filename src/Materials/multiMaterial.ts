import { Nullable } from "../types";
import { Scene } from "../scene";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { SubMesh } from "../Meshes/subMesh";
import { BaseTexture } from "../Materials/Textures/baseTexture";
import { Material } from "../Materials/material";
import { Tags } from "../Misc/tags";
import { _TypeStore } from '../Misc/typeStore';

/**
 * A multi-material is used to apply different materials to different parts of the same object without the need of
 * separate meshes. This can be use to improve performances.
 * @see https://doc.babylonjs.com/how_to/multi_materials
 */
export class MultiMaterial extends Material {
    private _subMaterials: Nullable<Material>[];

    /**
     * Gets or Sets the list of Materials used within the multi material.
     * They need to be ordered according to the submeshes order in the associated mesh
     */
    public get subMaterials(): Nullable<Material>[] {
        return this._subMaterials;
    }

    public set subMaterials(value: Nullable<Material>[]) {
        this._subMaterials = value;
        this._hookArray(value);
    }

    /**
     * Function used to align with Node.getChildren()
     * @returns the list of Materials used within the multi material
     */
    public getChildren(): Nullable<Material>[] {
        return this.subMaterials;
    }

    /**
     * Instantiates a new Multi Material
     * A multi-material is used to apply different materials to different parts of the same object without the need of
     * separate meshes. This can be use to improve performances.
     * @see https://doc.babylonjs.com/how_to/multi_materials
     * @param name Define the name in the scene
     * @param scene Define the scene the material belongs to
     */
    constructor(name: string, scene: Scene) {
        super(name, scene, true);

        scene.multiMaterials.push(this);

        this.subMaterials = new Array<Material>();

        this._storeEffectOnSubMeshes = true; // multimaterial is considered like a push material
    }

    private _hookArray(array: Nullable<Material>[]): void {
        var oldPush = array.push;
        array.push = (...items: Nullable<Material>[]) => {
            var result = oldPush.apply(array, items);

            this._markAllSubMeshesAsTexturesDirty();

            return result;
        };

        var oldSplice = array.splice;
        array.splice = (index: number, deleteCount?: number) => {
            var deleted = oldSplice.apply(array, [index, deleteCount]);

            this._markAllSubMeshesAsTexturesDirty();

            return deleted;
        };
    }

    /**
     * Get one of the submaterial by its index in the submaterials array
     * @param index The index to look the sub material at
     * @returns The Material if the index has been defined
     */
    public getSubMaterial(index: number): Nullable<Material> {
        if (index < 0 || index >= this.subMaterials.length) {
            return this.getScene().defaultMaterial;
        }

        return this.subMaterials[index];
    }

    /**
     * Get the list of active textures for the whole sub materials list.
     * @returns All the textures that will be used during the rendering
     */
    public getActiveTextures(): BaseTexture[] {
        return super.getActiveTextures().concat(...this.subMaterials.map((subMaterial) => {
            if (subMaterial) {
                return subMaterial.getActiveTextures();
            } else {
                return [];
            }
        }));
    }

    /**
     * Gets the current class name of the material e.g. "MultiMaterial"
     * Mainly use in serialization.
     * @returns the class name
     */
    public getClassName(): string {
        return "MultiMaterial";
    }

    /**
     * Checks if the material is ready to render the requested sub mesh
     * @param mesh Define the mesh the submesh belongs to
     * @param subMesh Define the sub mesh to look readyness for
     * @param useInstances Define whether or not the material is used with instances
     * @returns true if ready, otherwise false
     */
    public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean {
        for (var index = 0; index < this.subMaterials.length; index++) {
            var subMaterial = this.subMaterials[index];
            if (subMaterial) {
                if (subMaterial._storeEffectOnSubMeshes) {
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

    /**
     * Clones the current material and its related sub materials
     * @param name Define the name of the newly cloned material
     * @param cloneChildren Define if submaterial will be cloned or shared with the parent instance
     * @returns the cloned material
     */
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

    /**
     * Serializes the materials into a JSON representation.
     * @returns the JSON representation
     */
    public serialize(): any {
        var serializationObject: any = {};

        serializationObject.name = this.name;
        serializationObject.id = this.id;
        if (Tags) {
            serializationObject.tags = Tags.GetTags(this);
        }
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

    /**
     * Dispose the material and release its associated resources
     * @param forceDisposeEffect Define if we want to force disposing the associated effect (if false the shader is not released and could be reuse later on)
     * @param forceDisposeTextures Define if we want to force disposing the associated textures (if false, they will not be disposed and can still be use elsewhere in the app)
     * @param forceDisposeChildren Define if we want to force disposing the associated submaterials (if false, they will not be disposed and can still be use elsewhere in the app)
     */
    public dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean, forceDisposeChildren?: boolean): void {
        var scene = this.getScene();
        if (!scene) {
            return;
        }

        if (forceDisposeChildren) {
            for (var index = 0; index < this.subMaterials.length; index++) {
                var subMaterial = this.subMaterials[index];
                if (subMaterial) {
                    subMaterial.dispose(forceDisposeEffect, forceDisposeTextures);
                }
            }
        }

        var index = scene.multiMaterials.indexOf(this);
        if (index >= 0) {
            scene.multiMaterials.splice(index, 1);
        }

        super.dispose(forceDisposeEffect, forceDisposeTextures);
    }

    /**
     * Creates a MultiMaterial from parsed MultiMaterial data.
     * @param parsedMultiMaterial defines parsed MultiMaterial data.
     * @param scene defines the hosting scene
     * @returns a new MultiMaterial
     */
    public static ParseMultiMaterial(parsedMultiMaterial: any, scene: Scene): MultiMaterial {
        var multiMaterial = new MultiMaterial(parsedMultiMaterial.name, scene);

        multiMaterial.id = parsedMultiMaterial.id;

        if (Tags) {
            Tags.AddTagsTo(multiMaterial, parsedMultiMaterial.tags);
        }

        for (var matIndex = 0; matIndex < parsedMultiMaterial.materials.length; matIndex++) {
            var subMatId = parsedMultiMaterial.materials[matIndex];

            if (subMatId) {
                // If the same multimaterial is loaded twice, the 2nd multimaterial needs to reference the latest material by that id which
                // is why this lookup should use getLastMaterialByID instead of getMaterialByID
                multiMaterial.subMaterials.push(scene.getLastMaterialByID(subMatId));
            } else {
                multiMaterial.subMaterials.push(null);
            }
        }

        return multiMaterial;
    }
}

_TypeStore.RegisteredTypes["BABYLON.MultiMaterial"] = MultiMaterial;
