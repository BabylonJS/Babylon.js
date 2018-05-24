/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Extensions {
    const NAME = "MSFT_minecraftMesh";

    /** @hidden */
    export class MSFT_minecraftMesh extends GLTFLoaderExtension {
        public readonly name = NAME;

        protected _loadMaterialAsync(context: string, material: _ILoaderMaterial, mesh: _ILoaderMesh, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void): Nullable<Promise<void>> {
            return this._loadExtrasValueAsync<boolean>(context, mesh, (extensionContext, value) => {
                if (value) {
                    return this._loader._loadMaterialAsync(context, material, mesh, babylonMesh, babylonDrawMode, (babylonMaterial: PBRMaterial) => {
                        if (babylonMaterial.needAlphaBlending()) {
                            babylonMaterial.forceDepthWrite = true;
                            babylonMaterial.separateCullingPass = true;
                        }

                        babylonMaterial.backFaceCulling = babylonMaterial.forceDepthWrite;
                        babylonMaterial.twoSidedLighting = true;

                        assign(babylonMaterial);
                    });
                }

                return null;
            });
        }
    }

    GLTFLoader._Register(NAME, loader => new MSFT_minecraftMesh(loader));
}