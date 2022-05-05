import { IProperty } from "babylonjs-gltf2interface";
import { IDisposable } from "core/scene";
import { Nullable } from "core/types";
import { ILoaderExtension } from "../../abstractFileLoader";

export interface IBaseLoaderExtension extends ILoaderExtension, IDisposable {
    /**
     * Called after the loader state changes to LOADING.
     */
    onLoading?(): void;

    /**
     * Called after the loader state changes to READY.
     */
    onReady?(): void;
}

/**
 * Helper method called by a loader extension to load an glTF extension.
 * @param context The context when loading the asset
 * @param property The glTF property to load the extension from
 * @param extensionName The name of the extension to load
 * @param actionAsync The action to run
 * @returns The promise returned by actionAsync or null if the extension does not exist
 */
export function LoadExtensionAsync<TExtension = any, TResult = void>(
    context: string,
    property: IProperty,
    extensionName: string,
    actionAsync: (extensionContext: string, extension: TExtension) => Nullable<Promise<TResult>>
): Nullable<Promise<TResult>> {
    if (!property.extensions) {
        return null;
    }

    const extensions = property.extensions;

    const extension = extensions[extensionName] as TExtension;
    if (!extension) {
        return null;
    }

    return actionAsync(`${context}/extensions/${extensionName}`, extension);
}

/**
 * Helper method called by a loader extension to load a glTF extra.
 * @param context The context when loading the asset
 * @param property The glTF property to load the extra from
 * @param extensionName The name of the extension to load
 * @param actionAsync The action to run
 * @returns The promise returned by actionAsync or null if the extra does not exist
 */
export function LoadExtraAsync<TExtra = any, TResult = void>(
    context: string,
    property: IProperty,
    extensionName: string,
    actionAsync: (extraContext: string, extra: TExtra) => Nullable<Promise<TResult>>
): Nullable<Promise<TResult>> {
    if (!property.extras) {
        return null;
    }

    const extras = property.extras;

    const extra = extras[extensionName] as TExtra;
    if (!extra) {
        return null;
    }

    return actionAsync(`${context}/extras/${extensionName}`, extra);
}
