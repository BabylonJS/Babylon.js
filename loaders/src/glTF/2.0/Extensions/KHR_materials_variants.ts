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

/**
 * Interface for the mapping from variant tag name to a mesh and material.
 */
interface IVariantMapping {
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

    private _tagsToMap: { [key: string]: IVariantMapping[]; } = {};

    /** @hidden */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }

    /** @hidden */
    public dispose() {
        delete this._loader;
    }

    /**
     * A list of available variants for this asset.
     */
    public get availableVariants(): string[] {
        return Object.keys(this._tagsToMap);
    }

    /**
     * Select a variant by providing a list of variant tag names.
     *
     * @param {(string | string[])} variantName
     */
    public selectVariant(variantName: string | string[]): void {
        if (variantName instanceof Array) {
            for (const name in variantName) {
                this._selectVariant(name);
            }
        } else {
            this._selectVariant(variantName);
        }
    }

    /**
     * Select a variant by providing a single variant tag.
     *
     * @param {string} variantName
     */
    private _selectVariant(variantName: string): void {
        // If the name is valid, switch all meshes to use materials defined by the tags
        const variantMappings = this._tagsToMap[variantName];
        if (!variantMappings) {
            return;
        }
        for (const mapping of variantMappings) {
            if (mapping.material) {
                mapping.mesh.material = mapping.material;
                return;
            }
            mapping.materialPromise.then((material) => {
                mapping.mesh.material = material;
            });
        }
    }

    /** @hidden */
    public _loadMeshPrimitiveAsync(context: string, name: string, node: INode, mesh: IMesh, primitive: IMeshPrimitive, assign: (babylonMesh: AbstractMesh) => void): Nullable<Promise<AbstractMesh>> {
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialVariants, AbstractMesh>(context, primitive, this.name, (extensionContext, extension) => {
            return this._loader._loadMeshPrimitiveAsync(context, name, node, mesh, primitive, (babylonMesh) => {
                assign(babylonMesh);

                if (babylonMesh instanceof Mesh) {
                    const babylonDrawMode = GLTFLoader._GetDrawMode(context, primitive.mode);
                    // For each mapping, look at the tags and make a new entry for them
                    for (const mapping of extension.mapping) {
                        for (const tag of mapping.tags) {
                            const tagMapping = this._tagsToMap[tag] || [];
                            const material = ArrayItem.Get(`#/materials/`, this._loader.gltf.materials, mapping.material);
                            const meshEntry: IVariantMapping = {
                                mesh: babylonMesh,
                                materialPromise: Promise.resolve(null)
                            };
                            meshEntry.materialPromise = this._loader._loadMaterialAsync(`#/materials/${mapping.material}`, material, babylonMesh, babylonDrawMode, (babylonMaterial) => {
                                meshEntry.material = babylonMaterial;
                            });
                            tagMapping.push(meshEntry);
                            this._tagsToMap[tag] = tagMapping;
                        }
                    }
                }
            });
        });
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_materials_variants(loader));
