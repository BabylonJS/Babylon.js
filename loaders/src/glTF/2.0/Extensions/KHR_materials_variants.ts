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

interface IExtensionMetadata {
    lastSelected: Nullable<string | Array<string>>;
    variants: IVariantsMap;
}

interface IVariantsMap {
    [key: string]: Array<{ mesh: AbstractMesh, material: Nullable<Material> }>;
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
        const extensionMetadata = this._GetExtensionMetadata(rootMesh);
        if (!extensionMetadata) {
            return [];
        }

        return Object.keys(extensionMetadata.variants);
    }

    /**
     * The default variant. Use with SelectVariant to reset the model to the original.
     */
    public static readonly DEFAULT = "__default__";

    /**
     * Select a variant given a variant tag name or a list of variant tag names.
     * @param rootMesh The glTF root mesh
     * @param variantName The variant name(s) to select. Use the `DEFAULT` property to reset back to original.
     */
    public static SelectVariant(rootMesh: Mesh, variantName: string | string[]): void {
        const extensionMetadata = this._GetExtensionMetadata(rootMesh);
        if (!extensionMetadata) {
            throw new Error(`Cannot select variant on a glTF mesh that does not have the ${NAME} extension`);
        }

        const select = (variantName: string): void => {
            const entries = extensionMetadata.variants[variantName];
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

        extensionMetadata.lastSelected = variantName;
    }

    /**
     * Gets the last selected variant tag name(s).
     * @returns The selected variant tag name(s).
     */
    public static GetLastSelectedVariant(rootMesh: Mesh): Nullable<string | string[]> {
        const extensionMetadata = this._GetExtensionMetadata(rootMesh);
        if (!extensionMetadata) {
            throw new Error(`Cannot get the last selected variant on a glTF mesh that does not have the ${NAME} extension`);
        }

        return extensionMetadata.lastSelected;
    }

    private static _GetExtensionMetadata(rootMesh: Mesh): Nullable<IExtensionMetadata> {
        return rootMesh?.metadata?.gltf?.[NAME] || null;
    }

    /** @hidden */
    public _loadMeshPrimitiveAsync(context: string, name: string, node: INode, mesh: IMesh, primitive: IMeshPrimitive, assign: (babylonMesh: AbstractMesh) => void): Nullable<Promise<AbstractMesh>> {
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialVariants, AbstractMesh>(context, primitive, this.name, (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader._loadMeshPrimitiveAsync(context, name, node, mesh, primitive, (babylonMesh) => {
                assign(babylonMesh);

                if (babylonMesh instanceof Mesh) {
                    const babylonDrawMode = GLTFLoader._GetDrawMode(context, primitive.mode);

                    const root = this._loader.rootBabylonMesh;
                    const metadata = (root.metadata = root.metadata || {});
                    const gltf = (metadata.gltf = metadata.gltf || {});
                    const extensionMetadata: IExtensionMetadata = (gltf[NAME] = gltf[NAME] || {
                        lastSelected: null,
                        variants: { [KHR_materials_variants.DEFAULT]: [{ mesh: babylonMesh, material: babylonMesh.material }] }
                    });
                    const variants = extensionMetadata.variants;

                    // For each mapping, look at the tags and make a new entry for them
                    for (const mapping of extension.mapping) {
                        for (const tag of mapping.tags) {
                            const material = ArrayItem.Get(`#/materials/`, this._loader.gltf.materials, mapping.material);
                            promises.push(this._loader._loadMaterialAsync(`#/materials/${mapping.material}`, material, babylonMesh, babylonDrawMode, (babylonMaterial) => {
                                variants[tag] = variants[tag] || [];
                                variants[tag].push({
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
