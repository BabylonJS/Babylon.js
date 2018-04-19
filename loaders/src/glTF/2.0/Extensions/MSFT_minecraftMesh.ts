/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Extensions {
    const NAME = "MSFT_minecraftMesh";

    /** @hidden */
    export class MSFT_minecraftMesh extends GLTFLoaderExtension {
        public readonly name = NAME;

        constructor(loader: GLTFLoader) {
            super(loader);

            const meshes = loader._gltf.meshes;
            if (meshes && meshes.length) {
                for (const mesh of meshes) {
                    if (mesh && mesh.extras && mesh.extras.MSFT_minecraftMesh) {
                        this._loader.onMaterialLoadedObservable.add(this._onMaterialLoaded);
                        break;
                    }
                }
            }
        }

        private _onMaterialLoaded = (material: PBRMaterial): void => {
            if (material.needAlphaBlending()) {
                material.forceDepthWrite = true;
                material.separateCullingPass = true;
            }

            material.backFaceCulling = material.forceDepthWrite;
            material.twoSidedLighting = true;
        };
    }

    GLTFLoader._Register(NAME, loader => new MSFT_minecraftMesh(loader));
}