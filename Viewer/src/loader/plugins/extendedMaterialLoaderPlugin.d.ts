import { ILoaderPlugin } from "./loaderPlugin";
import { Material } from "babylonjs";
export declare class ExtendedMaterialLoaderPlugin implements ILoaderPlugin {
    onMaterialLoaded(baseMaterial: Material): void;
}
