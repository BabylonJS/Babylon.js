import type { Nullable } from "core/types";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader, ArrayItem } from "../glTFLoader";

import type { Material } from "core/Materials/material";
import { Mesh } from "core/Meshes/mesh";
import type { Node } from "core/node";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { INode, IMeshPrimitive, IMesh } from "../glTFLoaderInterfaces";
import type { IKHRMaterialVariants_Mapping, IKHRMaterialVariants_Variant, IKHRMaterialVariants_Variants } from "babylonjs-gltf2interface";
import type { TransformNode } from "core/Meshes/transformNode";

const NAME = "KHR_materials_variants";

interface IVariantsMap {
    [key: string]: Array<{ mesh: AbstractMesh; material: Nullable<Material> }>;
}

interface IExtensionMetadata {
    lastSelected: Nullable<string | Array<string>>;
    original: Array<{ mesh: AbstractMesh; material: Nullable<Material> }>;
    variants: IVariantsMap;
}

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_variants/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
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

    /**
     * @internal
     */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }

    /** @internal */
    public dispose() {
        (this._loader as any) = null;
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
        KHR_materials_variants.SelectVariant(rootMesh, variantName);
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
        KHR_materials_variants.Reset(rootMesh);
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

    private static _GetExtensionMetadata(rootMesh: Nullable<TransformNode>): Nullable<IExtensionMetadata> {
        return rootMesh?._internalMetadata?.gltf?.[NAME] || null;
    }

    /** @internal */
    public onLoading(): void {
        const extensions = this._loader.gltf.extensions;
        if (extensions && extensions[this.name]) {
            const extension = extensions[this.name] as IKHRMaterialVariants_Variants;
            this._variants = extension.variants;
        }
    }

    /**
     * @internal
     */
    public _loadMeshPrimitiveAsync(
        context: string,
        name: string,
        node: INode,
        mesh: IMesh,
        primitive: IMeshPrimitive,
        assign: (babylonMesh: AbstractMesh) => void
    ): Nullable<Promise<AbstractMesh>> {
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialVariants_Mapping, AbstractMesh>(context, primitive, this.name, (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(
                this._loader._loadMeshPrimitiveAsync(context, name, node, mesh, primitive, (babylonMesh) => {
                    assign(babylonMesh);

                    if (babylonMesh instanceof Mesh) {
                        const babylonDrawMode = GLTFLoader._GetDrawMode(context, primitive.mode);

                        const root = this._loader.rootBabylonMesh;
                        const metadata = root ? (root._internalMetadata = root._internalMetadata || {}) : {};
                        const gltf = (metadata.gltf = metadata.gltf || {});
                        const extensionMetadata: IExtensionMetadata = (gltf[NAME] = gltf[NAME] || { lastSelected: null, original: [], variants: {} });

                        // Store the original material.
                        extensionMetadata.original.push({ mesh: babylonMesh, material: babylonMesh.material });

                        // For each mapping, look at the variants and make a new entry for them.
                        for (let mappingIndex = 0; mappingIndex < extension.mappings.length; ++mappingIndex) {
                            const mapping = extension.mappings[mappingIndex];
                            const material = ArrayItem.Get(`${extensionContext}/mappings/${mappingIndex}/material`, this._loader.gltf.materials, mapping.material);
                            promises.push(
                                this._loader._loadMaterialAsync(`#/materials/${mapping.material}`, material, babylonMesh, babylonDrawMode, (babylonMaterial) => {
                                    for (let mappingVariantIndex = 0; mappingVariantIndex < mapping.variants.length; ++mappingVariantIndex) {
                                        const variantIndex = mapping.variants[mappingVariantIndex];
                                        const variant = ArrayItem.Get(`/extensions/${NAME}/variants/${variantIndex}`, this._variants, variantIndex);
                                        extensionMetadata.variants[variant.name] = extensionMetadata.variants[variant.name] || [];
                                        extensionMetadata.variants[variant.name].push({
                                            mesh: babylonMesh,
                                            material: babylonMaterial,
                                        });

                                        // Replace the target when original mesh is cloned
                                        babylonMesh.onClonedObservable.add((newOne: Node) => {
                                            const newMesh = newOne as Mesh;
                                            let metadata: Nullable<IExtensionMetadata> = null;
                                            let newRoot: Nullable<Node> = newMesh;

                                            // Find root to get medata
                                            do {
                                                newRoot = newRoot!.parent;
                                                if (!newRoot) {
                                                    return;
                                                }
                                                metadata = KHR_materials_variants._GetExtensionMetadata(newRoot as Mesh);
                                            } while (metadata === null);

                                            // Need to clone the metadata on the root (first time only)
                                            if (root && metadata === KHR_materials_variants._GetExtensionMetadata(root)) {
                                                // Copy main metadata
                                                newRoot._internalMetadata = {};
                                                for (const key in root._internalMetadata) {
                                                    newRoot._internalMetadata[key] = root._internalMetadata[key];
                                                }

                                                // Copy the gltf metadata
                                                newRoot._internalMetadata.gltf = [];
                                                for (const key in root._internalMetadata.gltf) {
                                                    newRoot._internalMetadata.gltf[key] = root._internalMetadata.gltf[key];
                                                }

                                                // Duplicate the extension specific metadata
                                                newRoot._internalMetadata.gltf[NAME] = { lastSelected: null, original: [], variants: {} };
                                                for (const original of metadata.original) {
                                                    newRoot._internalMetadata.gltf[NAME].original.push({
                                                        mesh: original.mesh,
                                                        material: original.material,
                                                    });
                                                }
                                                for (const key in metadata.variants) {
                                                    if (Object.prototype.hasOwnProperty.call(metadata.variants, key)) {
                                                        newRoot._internalMetadata.gltf[NAME].variants[key] = [];
                                                        for (const variantEntry of metadata.variants[key]) {
                                                            newRoot._internalMetadata.gltf[NAME].variants[key].push({
                                                                mesh: variantEntry.mesh,
                                                                material: variantEntry.material,
                                                            });
                                                        }
                                                    }
                                                }

                                                metadata = newRoot._internalMetadata.gltf[NAME];
                                            }

                                            // Relocate
                                            for (const target of metadata!.original) {
                                                if (target.mesh === babylonMesh) {
                                                    target.mesh = newMesh;
                                                }
                                            }
                                            for (const target of metadata!.variants[variant.name]) {
                                                if (target.mesh === babylonMesh) {
                                                    target.mesh = newMesh;
                                                }
                                            }
                                        });
                                    }
                                })
                            );
                        }
                    }
                })
            );
            return Promise.all(promises).then(([babylonMesh]) => {
                return babylonMesh;
            });
        });
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_materials_variants(loader));
