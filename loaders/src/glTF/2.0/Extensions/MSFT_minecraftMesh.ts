import { Material, Nullable, PBRMaterial } from "babylonjs";
import { IMaterial } from "../glTFLoaderInterfaces";
import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTF2Loader } from "../glTF2Loader";

const NAME = "MSFT_minecraftMesh";

/** @hidden */
export class MSFT_minecraftMesh implements IGLTFLoaderExtension {
    public readonly name = NAME;
    public enabled = true;

    private _loader: GLTF2Loader;

    constructor(loader: GLTF2Loader) {
        this._loader = loader;
    }

    public dispose() {
        delete this._loader;
    }

    public loadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material): Nullable<Promise<void>> {
        return GLTF2Loader.LoadExtraAsync<boolean>(context, material, this.name, (extraContext, extra) => {
            if (extra) {
                if (!(babylonMaterial instanceof PBRMaterial)) {
                    throw new Error(`${extraContext}: Material type not supported`);
                }

                const promise = this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial);

                if (babylonMaterial.needAlphaBlending()) {
                    babylonMaterial.forceDepthWrite = true;
                    babylonMaterial.separateCullingPass = true;
                }

                babylonMaterial.backFaceCulling = babylonMaterial.forceDepthWrite;
                babylonMaterial.twoSidedLighting = true;

                return promise;
            }

            return null;
        });
    }
}

GLTF2Loader.RegisterExtension(NAME, (loader) => new MSFT_minecraftMesh(loader));