import { Nullable } from "babylonjs/types";
import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader, ArrayItem } from "../glTFLoader";

import { Material } from 'babylonjs/Materials/material';
import { Mesh } from 'babylonjs/Meshes/mesh';
import { AbstractMesh } from 'babylonjs/Meshes/abstractMesh';
import { INode, IMeshPrimitive, IMesh } from '../glTFLoaderInterfaces';

const NAME = "KHR_materials_variants";

interface IKHRMaterialVariantsMapping {
    tags: string[];
    material: number;
}

interface IKHRMaterialVariants {
    mapping: IKHRMaterialVariantsMapping[];
}

interface IKHRMaterialVariantsTop {
    default?: string;
}

interface VariantMapping {
    mesh: AbstractMesh;
    materialPromise: Promise<Nullable<Material>>;
    material?: Material;
}

/**
 * [Proposed Specification](https://github.com/KhronosGroup/glTF/pull/1681)
 * !!! Experimental Extension Subject to Changes !!!
 */
export class KHR_materials_variants implements IGLTFLoaderExtension {
    /**
     * The name of this extension.
     */
    public readonly name = NAME;

    /**
     * Defines whether this extension is enabled.
     */
    public enabled: boolean;

    private _loader: GLTFLoader;

    public defaultVariant: string | undefined;
    public availableVariants: string[];

    private _tagsToMap: { [key: string]: VariantMapping[]; } = {};

    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }

    /** @hidden */
    public dispose() {
        delete this._loader;
    }

    public getVariants(): string[] {
        return Object.keys(this._tagsToMap);
    }

    public selectVariant(variantName: string | string[]) {
        if (variantName instanceof Array) {
            variantName.forEach((name) => this.selectVariantTag(name));
        } else {
            this.selectVariantTag(variantName);
        }
    }

    public selectVariantTag(variantName: string) {
        // If the name is valid, switch all meshes to use materials defined by the tags
        const variantMappings = this._tagsToMap[variantName];
        if (variantMappings === undefined) {
            return;
        }
        variantMappings.forEach((mapping: VariantMapping) => {
            if (mapping.material) {
                mapping.mesh.material = mapping.material;
                return;
            }
            mapping.materialPromise.then((material) => {
                mapping.mesh.material = material;
            });
        });
    }

    /** @hidden */
    public onLoading(): void {
        const extensions = this._loader.gltf.extensions;
        if (extensions && extensions[this.name]) {
            const extension = extensions[this.name] as IKHRMaterialVariantsTop;
            this.defaultVariant = extension.default;
        }
    }

    /** @hidden */
    public _loadMeshPrimitiveAsync(context: string, name: string, node: INode, mesh: IMesh, primitive: IMeshPrimitive, assign: (babylonMesh: AbstractMesh) => void): Nullable<Promise<AbstractMesh>> {
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialVariants, AbstractMesh>(context, primitive, this.name, (extensionContext, extension) => {
            const assignMesh = (babylonMesh: AbstractMesh) => {
                assign(babylonMesh);
                const babylonDrawMode = (GLTFLoader as any)._GetDrawMode(context, primitive.mode);
                // For each mapping, look at the tags and make a new entry for them
                extension.mapping.forEach((mapping: IKHRMaterialVariantsMapping) => {
                    mapping.tags.forEach((tag: string, index: number) => {
                        let tagMapping = this._tagsToMap[tag];
                        if (tagMapping === undefined) {
                            tagMapping = [];
                        }
                        const material = ArrayItem.Get(`#/materials/`, this._loader.gltf.materials, mapping.material);
                        let meshEntry: VariantMapping = {
                            mesh: babylonMesh,
                            materialPromise: Promise.resolve(null)
                        };
                        if (babylonMesh instanceof Mesh) {
                            const matPromise = this._loader._loadMaterialAsync(`#/materials/${mapping.material}`, material, babylonMesh, babylonDrawMode, (material) => {
                                meshEntry.material = material;
                            });
                            meshEntry.materialPromise = matPromise;
                        }
                        tagMapping.push(meshEntry);
                        this._tagsToMap[tag] = tagMapping;
                    });
                });
            };
            this._loader._disableInstancedMesh++;
            const promise = this._loader._loadMeshPrimitiveAsync(context, name, node, mesh, primitive, assignMesh);
            this._loader._disableInstancedMesh--;
            return promise;
        });
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_materials_variants(loader));
