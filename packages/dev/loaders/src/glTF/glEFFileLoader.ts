import type { AssetContainer } from "core/assetContainer";
import type { ISceneLoaderPluginExtensions, ISceneLoaderAsyncResult, ISceneLoaderPlugin, ISceneLoaderPluginAsync} from "core/Loading/sceneLoader";
import { SceneLoader } from "core/Loading/sceneLoader";
import type { DataReader } from "core/Misc/dataReader";
import { StringTools } from "core/Misc/stringTools";
import { GLEFLoader } from "./2.0/glEFLoader";
import type { ILoader, ILoaderData } from "./abstractFileLoader";
import { AbstractFileLoader } from "./abstractFileLoader";

export class GLEFFileLoader extends AbstractFileLoader {
    private static _MagicBase64Encoded = "magic!";
    public name: string = "glef";
    public extensions: ISceneLoaderPluginExtensions = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ".glef": { isBinary: false },
        ".glxf": { isBinary: false },
    };
    protected _loadAssetContainer(_container: AssetContainer): void {
        // no-op in glef
    }
    protected _importMeshAsyncDone(_result: ISceneLoaderAsyncResult, _container: AssetContainer): void {
        // no-op in glef
    }
    public canDirectLoad(data: string): boolean {
        // Assuming a different magic number for glef
        return (
            (data.indexOf("asset") !== -1 && data.indexOf("version") !== -1) ||
            StringTools.StartsWith(data, "data:;base64," + GLEFFileLoader._MagicBase64Encoded) ||
            StringTools.StartsWith(data, "data:application/octet-stream;base64," + GLEFFileLoader._MagicBase64Encoded) ||
            StringTools.StartsWith(data, "data:model/gltf-binary;base64," + GLEFFileLoader._MagicBase64Encoded)
        );
    }
    public createPlugin(): ISceneLoaderPlugin | ISceneLoaderPluginAsync {
        return new GLEFFileLoader();
    }
    protected _runValidationAsync(data: string | ArrayBuffer, rootUrl: string, fileName: string, getExternalResource: (uri: string) => Promise<ArrayBuffer>): Promise<any> {
        // auto-validate for now
        return Promise.resolve();
    }
    protected _getLoaders(): { [key: number]: (parent: AbstractFileLoader) => ILoader } {
        return {
            2: (parent: AbstractFileLoader) => new GLEFLoader(parent as GLEFFileLoader),
        };
    }
    protected _onBinaryDataUnpacked(dataReader: DataReader): Promise<ILoaderData> {
        throw new Error("Binary not supported in glEF yet");
    }
}

if (SceneLoader) {
    SceneLoader.RegisterPlugin(new GLEFFileLoader());
}
