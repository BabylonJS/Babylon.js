import { Material, Nullable, PBRMaterial } from "babylonjs";
import { IMaterialV2 } from "../glTFLoaderInterfaces";
import { IGLTFLoaderExtensionV2 } from "../glTFLoaderExtension";
import { GLTFLoaderV2 } from "../glTFLoader";

const NAME = "MSFT_minecraftMesh";

/** @hidden */
export class MSFT_minecraftMesh implements IGLTFLoaderExtensionV2 {
    public readonly name = NAME;
    public enabled = true;

    private _loader: GLTFLoaderV2;

    constructor(loader: GLTFLoaderV2) {
        this._loader = loader;
    }

    public dispose() {
        delete this._loader;
    }

    public loadMaterialPropertiesAsync(context: string, material: IMaterialV2, babylonMaterial: Material): Nullable<Promise<void>> {
        return GLTFLoaderV2.LoadExtraAsync<boolean>(context, material, this.name, (extraContext, extra) => {
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

GLTFLoaderV2.RegisterExtension(NAME, (loader) => new MSFT_minecraftMesh(loader));