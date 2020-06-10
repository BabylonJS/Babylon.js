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
interface IVariantsMap {
    [key: string]: Array<{
        mesh: AbstractMesh;
        material: Material;
    }>;
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
     * Gets the list of available variant tag names for this asset.
     */
    public static GetAvailableVariants(rootMesh: Mesh): string[] {
        return Object.keys(this._GetVariantsMap(rootMesh));
    }

    /**
     * Select a variant given a variant tag name or a list of variant tag names.
     * @param rootMesh The glTF root mesh
     * @param variantName The variant name(s) to select
     */
    public static SelectVariant(rootMesh: Mesh, variantName: string | string[]): void {
        const variantsMap = this._GetVariantsMap(rootMesh);

        const select = (variantName: string): void => {
            const entries = variantsMap[variantName];
            if (entries) {
                for (const entry of entries) {
                    entry.mesh.material = entry.material;
                }
            }
        };

        if (variantName instanceof Array) {
            for (const name of variantName) {
                select(name);
            }
        } else {
            select(variantName);
        }
    }

    private static _GetVariantsMap(rootMesh: Mesh): IVariantsMap {
        return rootMesh?.metadata?.gltf?.[NAME];
    }

    /** @hidden */
    public _loadMeshPrimitiveAsync(context: string, name: string, node: INode, mesh: IMesh, primitive: IMeshPrimitive, assign: (babylonMesh: AbstractMesh) => void): Nullable<Promise<AbstractMesh>> {
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialVariants, AbstractMesh>(context, primitive, this.name, (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader._loadMeshPrimitiveAsync(context, name, node, mesh, primitive, (babylonMesh) => {
                assign(babylonMesh);

                if (babylonMesh instanceof Mesh) {
                    const babylonDrawMode = GLTFLoader._GetDrawMode(context, primitive.mode);

                    // For each mapping, look at the tags and make a new entry for them
                    for (const mapping of extension.mapping) {
                        for (const tag of mapping.tags) {
                            const material = ArrayItem.Get(`#/materials/`, this._loader.gltf.materials, mapping.material);
                            promises.push(this._loader._loadMaterialAsync(`#/materials/${mapping.material}`, material, babylonMesh, babylonDrawMode, (babylonMaterial) => {
                                const root = this._loader.rootBabylonMesh;
                                const metadata = (root.metadata = root.metadata || {});
                                const gltf = (metadata.gltf = metadata.gltf || {});
                                const map: IVariantsMap = (gltf[NAME] = gltf[NAME] || {});
                                map[tag] = map[tag] || [];
                                map[tag].push({
                                    mesh: babylonMesh,
                                    material: babylonMaterial
                                });
                            }));
                        }
                    }
                }
            }));
            return Promise.all(promises).then(([babylonMesh]) => {
                return babylonMesh;
            });
        });
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_materials_variants(loader));
