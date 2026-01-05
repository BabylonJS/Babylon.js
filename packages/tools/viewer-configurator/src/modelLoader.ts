import type { Nullable } from "core/index";
import type { LoadModelOptions, ViewerElement } from "viewer/index";

import { Deferred } from "core/Misc/deferred";
import { GetRegisteredSceneLoaderPluginMetadata } from "core/Loading/sceneLoader";
import { FilesInputStore } from "core/Misc/filesInputStore";

async function PickFileAsync(): Promise<Nullable<Iterable<File>>> {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;

    // See https://stackoverflow.com/questions/47664777/javascript-file-input-onchange-not-working-ios-safari-only
    Object.assign(input.style, {
        position: "fixed",
        //display: 'none',
        top: "-100000px",
        left: "-100000px",
    });
    document.body.appendChild(input);

    const deferred = new Deferred<Nullable<Iterable<File>>>();
    const getFileFromInput = () => {
        if (input.files && input.files.length > 0) {
            deferred.resolve(input.files);
        } else {
            deferred.resolve(null);
        }
    };

    input.addEventListener("change", getFileFromInput, { once: true });
    input.addEventListener("cancel", getFileFromInput, { once: true });

    input.click();
    const result = await deferred.promise;
    input.removeEventListener("change", getFileFromInput);
    input.removeEventListener("cancel", getFileFromInput);
    input.remove();

    return result;
}

export async function LoadModel(viewerElement: ViewerElement, source: string | File | Iterable<File> | ArrayBufferView, options?: LoadModelOptions, abortSignal?: AbortSignal) {
    try {
        const defaultOptions: LoadModelOptions = {};

        if (typeof source === "object" && !ArrayBuffer.isView(source) && Symbol.iterator in source) {
            const registeredSceneLoaderPlugins = GetRegisteredSceneLoaderPluginMetadata();
            let sceneFile: Nullable<File> = null;

            for (const file of source) {
                const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
                if (
                    registeredSceneLoaderPlugins.some((plugin) => plugin.extensions.some((pluginExtension) => pluginExtension.extension.toLowerCase().substring(1) === extension))
                ) {
                    sceneFile = file;
                } else {
                    FilesInputStore.FilesToLoad[file.name.toLocaleLowerCase()] = file;
                }
            }

            if (!sceneFile) {
                throw new Error(
                    `No supported scene file found in ${Array.from(source)
                        .map((file) => `"${file.name}"`)
                        .join(", ")}`
                );
            }

            source = sceneFile;
        }

        if (source instanceof File) {
            defaultOptions.rootUrl = "file:";
        }

        await viewerElement.viewerDetails?.viewer.loadModel(source, Object.assign(defaultOptions, options), abortSignal);
    } catch {
        // Ignore errors - we observe model error events from the viewer element.
    } finally {
        FilesInputStore.FilesToLoad = {};
    }
}

export async function PickModel(viewerElement: ViewerElement, options?: LoadModelOptions) {
    const files = await PickFileAsync();

    if (files) {
        await LoadModel(viewerElement, files, options);
    }
}
