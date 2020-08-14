import { Nullable } from "babylonjs/types";
import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader, ArrayItem } from "../glTFLoader";

import { Material } from 'babylonjs/Materials/material';
import { Mesh } from 'babylonjs/Meshes/mesh';
import { AbstractMesh } from 'babylonjs/Meshes/abstractMesh';
import { INode, IMeshPrimitive, IMesh } from '../glTFLoaderInterfaces';
import { IKHRMaterialVariants_Mapping, IKHRMaterialVariants_Variant, IKHRMaterialVariants_Variants } from 'babylonjs-gltf2interface';

const NAME = "KHR_materials_variants";

interface IVariantsMap {
    [key: string]: Array<{ mesh: AbstractMesh, material: Nullable<Material> }>;
}

interface IExtensionMetadata {
    lastSelected: Nullable<string | Array<string>>;
    original: Array<{ mesh: AbstractMesh, material: Nullable<Material> }>;
    variants: IVariantsMap;
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

    private _variants?: Array<IKHRMaterialVariants_Variant>;

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
     * Gets the list of available variant names for this asset.
     * @param rootMesh The glTF root mesh
     * @returns the list of all the variant names for this model
     */
    public static GetAvailableVariants(rootMesh: Mesh): string[] {
        const extensionMetadata = this._GetExtensionMetadata(rootMesh);
        if (!extensionMetadata) {
            return [];
        }

        return Object.keys(extensionMetadata.variants);
    }

    /**
     * Gets the list of available variant names for this asset.
     * @param rootMesh The glTF root mesh
     * @returns the list of all the variant names for this model
     */
    public getAvailableVariants(rootMesh: Mesh): string[] {
        return KHR_materials_variants.GetAvailableVariants(rootMesh);
    }

    /**
     * Select a variant given a variant name or a list of variant names.
     * @param rootMesh The glTF root mesh
     * @param variantName The variant name(s) to select.
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
     * Select a variant given a variant name or a list of variant names.
     * @param rootMesh The glTF root mesh
     * @param variantName The variant name(s) to select.
     */
    public selectVariant(rootMesh: Mesh, variantName: string | string[]): void {
        return KHR_materials_variants.SelectVariant(rootMesh, variantName);
    }

    /**
     * Reset back to the original before selecting a variant.
     * @param rootMesh The glTF root mesh
     */
    public static Reset(rootMesh: Mesh): void {
        const extensionMetadata = this._GetExtensionMetadata(rootMesh);
        if (!extensionMetadata) {
            throw new Error(`Cannot reset on a glTF mesh that does not have the ${NAME} extension`);
        }

        for (const entry of extensionMetadata.original) {
            entry.mesh.material = entry.material;
        }

        extensionMetadata.lastSelected = null;
    }

    /**
     * Reset back to the original before selecting a variant.
     * @param rootMesh The glTF root mesh
     */
    public reset(rootMesh: Mesh): void {
        return KHR_materials_variants.Reset(rootMesh);
    }

    /**
     * Gets the last selected variant name(s) or null if original.
     * @param rootMesh The glTF root mesh
     * @returns The selected variant name(s).
     */
    public static GetLastSelectedVariant(rootMesh: Mesh): Nullable<string | string[]> {
        const extensionMetadata = this._GetExtensionMetadata(rootMesh);
        if (!extensionMetadata) {
            throw new Error(`Cannot get the last selected variant on a glTF mesh that does not have the ${NAME} extension`);
        }

        return extensionMetadata.lastSelected;
    }

    /**
     * Gets the last selected variant name(s) or null if original.
     * @param rootMesh The glTF root mesh
     * @returns The selected variant name(s).
     */
    public getLastSelectedVariant(rootMesh: Mesh): Nullable<string | string[]> {
        return KHR_materials_variants.GetLastSelectedVariant(rootMesh);
    }

    private static _GetExtensionMetadata(rootMesh: Mesh): Nullable<IExtensionMetadata> {
        return rootMesh?.metadata?.gltf?.[NAME] || null;
    }

    /** @hidden */
    public onLoading(): void {
        const extensions = this._loader.gltf.extensions;
        if (extensions && extensions[this.name]) {
            const extension = extensions[this.name] as IKHRMaterialVariants_Variants;
            this._variants = extension.variants;
        }
    }

    /** @hidden */
    public _loadMeshPrimitiveAsync(context: string, name: string, node: INode, mesh: IMesh, primitive: IMeshPrimitive, assign: (babylonMesh: AbstractMesh) => void): Nullable<Promise<AbstractMesh>> {
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialVariants_Mapping, AbstractMesh>(context, primitive, this.name, (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader._loadMeshPrimitiveAsync(context, name, node, mesh, primitive, (babylonMesh) => {
                assign(babylonMesh);

                if (babylonMesh instanceof Mesh) {
                    const babylonDrawMode = GLTFLoader._GetDrawMode(context, primitive.mode);

                    const root = this._loader.rootBabylonMesh;
                    const metadata = (root.metadata = root.metadata || {});
                    const gltf = (metadata.gltf = metadata.gltf || {});
                    const extensionMetadata: IExtensionMetadata = (gltf[NAME] = gltf[NAME] || { lastSelected: null, original: [], variants: {} });

                    // Store the original material.
                    extensionMetadata.original.push({ mesh: babylonMesh, material: babylonMesh.material });

                    // For each mapping, look at the variants and make a new entry for them.
                    const variants = extensionMetadata.variants;
                    for (const mapping of extension.mapping) {
                        for (const variantIndex of mapping.variants) {
                            const variant = ArrayItem.Get(`${extensionContext}/mapping/${variantIndex}`, this._variants, variantIndex);
                            const material = ArrayItem.Get(`#/materials/`, this._loader.gltf.materials, mapping.material);
                            promises.push(this._loader._loadMaterialAsync(`#/materials/${mapping.material}`, material, babylonMesh, babylonDrawMode, (babylonMaterial) => {
                                variants[variant.name] = variants[variant.name] || [];
                                variants[variant.name].push({
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
