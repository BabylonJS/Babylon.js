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
 * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_variants)
 */
export class KHR_materials_variants implements IGLTFLoaderExtension {
  /**
   * The name of this extension.
   */
  public readonly name = NAME;

  private _loader: GLTFLoader;

  public defaultVariant: string | undefined;
  public availableVariants: string[];

  private _tagsToMap: Map<string, VariantMapping[]> = new Map();
  
  constructor(loader: GLTFLoader) {
    this._loader = loader;
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
    const variantMappings = this._tagsToMap.get(variantName);
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

  public _loadMeshPrimitiveAsync(context: string, name: string, node: INode, mesh: IMesh, primitive: IMeshPrimitive, assign: (babylonMesh: AbstractMesh) => void): Promise<AbstractMesh> {
    const loadExtensions = GLTFLoader.LoadExtensionAsync<IKHRMaterialVariants, AbstractMesh>(context, primitive, this.name, (extensionContext, extension) => {
      
      const assignMesh = (babylonMesh: AbstractMesh) => {
        assign(babylonMesh);
        const babylonDrawMode = (GLTFLoader as any)._GetDrawMode(context, primitive.mode);
        // For each mapping, look at the tags and make a new entry for them
        extension.mapping.forEach((mapping: IKHRMaterialVariantsMapping) => {
          mapping.tags.forEach((tag: string, index: number) => {
            let tag_mapping = this._tagsToMap.get(tag);
            if (tag_mapping === undefined) {
                tag_mapping = [];
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
            tag_mapping.push(meshEntry);
            this._tagsToMap.set(tag, tag_mapping);
          });
        });
      };
      return this._loader._loadMeshPrimitiveAsync(context, name, node, mesh, primitive, assignMesh);
    });

    if (loadExtensions) {
        return loadExtensions;
    }
    return this._loader._loadMeshPrimitiveAsync(context, name, node, mesh, primitive, assign);
  }

  enabled: boolean = true;
  dispose = () => {};
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_materials_variants(loader));