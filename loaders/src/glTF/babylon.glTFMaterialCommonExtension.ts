/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
    interface IGLTFMaterialCommonExtensionValues {
        ambient?: number[];
        diffuse?: number[] | string;
        emission?: number[] | string;
        specular?: number[] | string;
        shininess?: number;
        transparency?: number;
    };

    interface IGLTFMaterialCommonExtension {
        technique: string;
        transparent?: number;
        doubleSided?: boolean;
        values: IGLTFMaterialCommonExtensionValues;
    };

    export class GLTFMaterialCommonExtension extends GLTFFileLoaderExtension {

        constructor() {
            super("KHR_materials_common");
        }

        public loadMaterialAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (material: Material) => void, onError: () => void): boolean {
            var material: IGLTFMaterial = gltfRuntime.materials[id];
            if (!material || !material.extensions) return false;

            var extension: IGLTFMaterialCommonExtension = material.extensions[this.name];
            if (!extension) return false;

            var standardMaterial = new StandardMaterial(id, gltfRuntime.scene);
            standardMaterial.sideOrientation = Material.CounterClockWiseSideOrientation;

            standardMaterial.ambientColor = Color3.FromArray(extension.values.ambient || [0, 0, 0]);
            standardMaterial.backFaceCulling = extension.doubleSided === undefined ? false : !extension.doubleSided;
            standardMaterial.alpha = extension.values.transparency === undefined ? 1.0 : extension.values.transparency;
            standardMaterial.specularPower = extension.values.shininess === undefined ? 0.0 : extension.values.shininess;
            
            // Diffuse
            if (typeof extension.values.diffuse === "string") {
                this._loadTexture(gltfRuntime, extension.values.diffuse, standardMaterial, "diffuseTexture", onSuccess, onError);
            }
            else {
                standardMaterial.diffuseColor = Color3.FromArray(extension.values.diffuse || [0, 0, 0]);
            }

            // Emission
            if (typeof extension.values.emission === "string") {
                this._loadTexture(gltfRuntime, extension.values.emission, standardMaterial, "emissiveTexture", onSuccess, onError);
            }
            else {
                standardMaterial.emissiveColor = Color3.FromArray(extension.values.emission || [0, 0, 0]);
            }

            // Specular
            if (typeof extension.values.specular === "string") {
                this._loadTexture(gltfRuntime, extension.values.specular, standardMaterial, "specularTexture", onSuccess, onError);
            }
            else {
                standardMaterial.specularColor = Color3.FromArray(extension.values.specular || [0, 0, 0]);
            }

            return true;
        }

        private _loadTexture(gltfRuntime: IGLTFRuntime, id: string, material: StandardMaterial, propertyPath: string, onSuccess: (material: Material) => void, onError: () => void): void {
            // Create buffer from texture url
            GLTFFileLoaderBase.LoadTextureBufferAsync(gltfRuntime, id, (buffer) => {
                // Create texture from buffer
                GLTFFileLoaderBase.CreateTextureAsync(gltfRuntime, id, buffer, (texture) => material[propertyPath] = texture, onError);
            }, onError);
        }
    }

    GLTFFileLoader.RegisterExtension(new GLTFMaterialCommonExtension());
}