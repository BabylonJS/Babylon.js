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
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";
import type { MaterialVariantsController } from "../../glTFFileLoader";

const NAME = "KHR_materials_variants";

export { MaterialVariantsController };

declare module "../../glTFFileLoader" {
    // Define options related types here so they can be referenced in the options,
    // but export the types at the module level. This ensures the types are in the
    // correct namespace for UMD.
    type MaterialVariantsController = {
        /**
         * The list of available variant names for this asset.
         */
        readonly variants: readonly string[];

        /**
         * Gets or sets the selected variant.
         */
        selectedVariant: string;
    };

    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_materials_variants extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_materials_variants"]: Partial<{
            /**
             * Specifies the name of the variant that should be selected by default.
             */
            defaultVariant: string;

            /**
             * Defines a callback that will be called if material variants are loaded.
             * @experimental
             */
            onLoaded: (controller: MaterialVariantsController) => void;
        }>;
    }
}

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
     * @param rootNode The glTF root node
     * @returns the list of all the variant names for this model
     */
    public static GetAvailableVariants(rootNode: TransformNode): string[] {
        const extensionMetadata = this._GetExtensionMetadata(rootNode);
        if (!extensionMetadata) {
            return [];
        }

        return Object.keys(extensionMetadata.variants);
    }

    /**
     * Gets the list of available variant names for this asset.
     * @param rootNode The glTF root node
     * @returns the list of all the variant names for this model
     */
    public getAvailableVariants(rootNode: TransformNode): string[] {
        return KHR_materials_variants.GetAvailableVariants(rootNode);
    }

    /**
     * Select a variant given a variant name or a list of variant names.
     * @param rootNode The glTF root node
     * @param variantName The variant name(s) to select.
     */
    public static SelectVariant(rootNode: TransformNode, variantName: string | string[]): void {
        const extensionMetadata = this._GetExtensionMetadata(rootNode);
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
     * @param rootNode The glTF root node
     * @param variantName The variant name(s) to select.
     */
    public selectVariant(rootNode: TransformNode, variantName: string | string[]): void {
        KHR_materials_variants.SelectVariant(rootNode, variantName);
    }

    /**
     * Reset back to the original before selecting a variant.
     * @param rootNode The glTF root node
     */
    public static Reset(rootNode: TransformNode): void {
        const extensionMetadata = this._GetExtensionMetadata(rootNode);
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
     * @param rootNode The glTF root node
     */
    public reset(rootNode: TransformNode): void {
        KHR_materials_variants.Reset(rootNode);
    }

    /**
     * Gets the last selected variant name(s) or null if original.
     * @param rootNode The glTF root node
     * @returns The selected variant name(s).
     */
    public static GetLastSelectedVariant(rootNode: TransformNode): Nullable<string | string[]> {
        const extensionMetadata = this._GetExtensionMetadata(rootNode);
        if (!extensionMetadata) {
            throw new Error(`Cannot get the last selected variant on a glTF mesh that does not have the ${NAME} extension`);
        }

        return extensionMetadata.lastSelected;
    }

    /**
     * Gets the last selected variant name(s) or null if original.
     * @param rootNode The glTF root node
     * @returns The selected variant name(s).
     */
    public getLastSelectedVariant(rootNode: TransformNode): Nullable<string | string[]> {
        return KHR_materials_variants.GetLastSelectedVariant(rootNode);
    }

    private static _GetExtensionMetadata(rootNode: Nullable<TransformNode>): Nullable<IExtensionMetadata> {
        return rootNode?._internalMetadata?.gltf?.[NAME] || null;
    }

    /** @internal */
    public onLoading(): void {
        const extensions = this._loader.gltf.extensions;
        if (extensions && extensions[this.name]) {
            const extension = extensions[this.name] as IKHRMaterialVariants_Variants;
            this._variants = extension.variants;
        }
    }

    /** @internal */
    public onReady(): void {
        const rootNode = this._loader.rootBabylonMesh;
        if (rootNode) {
            const options = this._loader.parent.extensionOptions[NAME];
            if (options?.defaultVariant) {
                KHR_materials_variants.SelectVariant(rootNode, options.defaultVariant);
            }

            options?.onLoaded?.({
                get variants() {
                    return KHR_materials_variants.GetAvailableVariants(rootNode);
                },
                get selectedVariant(): string {
                    const lastSelectedVariant = KHR_materials_variants.GetLastSelectedVariant(rootNode);
                    if (!lastSelectedVariant) {
                        return KHR_materials_variants.GetAvailableVariants(rootNode)[0];
                    }
                    if (Array.isArray(lastSelectedVariant)) {
                        return lastSelectedVariant[0];
                    }
                    return lastSelectedVariant;
                },
                set selectedVariant(variantName) {
                    KHR_materials_variants.SelectVariant(rootNode, variantName);
                },
            });
        }
    }

    /**
     * @internal
     */
    // eslint-disable-next-line no-restricted-syntax
    public _loadMeshPrimitiveAsync(
        context: string,
        name: string,
        node: INode,
        mesh: IMesh,
        primitive: IMeshPrimitive,
        assign: (babylonMesh: AbstractMesh) => void
    ): Nullable<Promise<AbstractMesh>> {
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialVariants_Mapping, AbstractMesh>(context, primitive, this.name, async (extensionContext, extension) => {
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
                                                newRoot = newRoot.parent;
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
            // eslint-disable-next-line github/no-then
            return await Promise.all(promises).then(([babylonMesh]) => {
                return babylonMesh;
            });
        });
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_materials_variants(loader));
