import { AssetContainer } from "core/assetContainer";
import { ISceneLoaderAsyncResult, ISceneLoaderProgressEvent } from "core/Loading/sceneLoader";
import { Scene } from "core/scene";
import { Nullable } from "core/types";
import { ILoader, ILoaderData } from "../abstractFileLoader";
import type { GLEFFileLoader } from "../glEFFileLoader";

export class GLEFLoader implements ILoader {
    /**
     * @param _parent
     * @hidden
     */
    constructor(private _parent: GLEFFileLoader) {}
    importMeshAsync(
        _meshesNames: any,
        _scene: Scene,
        _container: Nullable<AssetContainer>,
        _data: ILoaderData,
        _rootUrl: string,
        _onProgress?: ((event: ISceneLoaderProgressEvent) => void) | undefined,
        _fileName?: string | undefined
    ): Promise<ISceneLoaderAsyncResult> {
        throw new Error("Method not used");
    }
    loadAsync(
        scene: Scene,
        data: ILoaderData,
        rootUrl: string,
        onProgress?: ((event: ISceneLoaderProgressEvent) => void) | undefined,
        fileName?: string | undefined
    ): Promise<void> {
        throw new Error("Method not implemented.");
    }
    dispose(): void {
        throw new Error("Method not implemented.");
    }
}
