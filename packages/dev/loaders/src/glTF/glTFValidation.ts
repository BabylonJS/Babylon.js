/* eslint-disable github/no-then */
/* eslint-disable no-restricted-syntax */
/* eslint-disable @typescript-eslint/promise-function-async */
import type * as GLTF2 from "babylonjs-gltf2interface";
import type { Nullable } from "core/types";
import { Tools } from "core/Misc/tools";

// eslint-disable-next-line @typescript-eslint/naming-convention
declare let GLTFValidator: GLTF2.IGLTFValidator;

// WorkerGlobalScope
// eslint-disable-next-line @typescript-eslint/naming-convention
declare function importScripts(...urls: string[]): void;
// eslint-disable-next-line @typescript-eslint/naming-convention
declare function postMessage(message: any, transfer?: any[]): void;

function ValidateAsync(
    data: string | Uint8Array,
    rootUrl: string,
    fileName: string,
    getExternalResource: (uri: string) => Promise<Uint8Array>
): Promise<GLTF2.IGLTFValidationResults> {
    const options: GLTF2.IGLTFValidationOptions = {
        externalResourceFunction: getExternalResource,
    };

    if (fileName) {
        options.uri = rootUrl === "file:" ? fileName : rootUrl + fileName;
    }

    return ArrayBuffer.isView(data) ? GLTFValidator.validateBytes(data, options) : GLTFValidator.validateString(data, options);
}

/**
 * The worker function that gets converted to a blob url to pass into a worker.
 */
function WorkerFunc(): void {
    const pendingExternalResources: Array<{ resolve: (data: any) => void; reject: (reason: any) => void }> = [];

    onmessage = (message) => {
        const data = message.data;
        switch (data.id) {
            case "init": {
                importScripts(data.url);
                break;
            }
            case "validate": {
                ValidateAsync(
                    data.data,
                    data.rootUrl,
                    data.fileName,
                    (uri) =>
                        new Promise((resolve, reject) => {
                            const index = pendingExternalResources.length;
                            pendingExternalResources.push({ resolve, reject });
                            postMessage({ id: "getExternalResource", index: index, uri: uri });
                        })
                ).then(
                    (value) => {
                        postMessage({ id: "validate.resolve", value: value });
                    },
                    (reason) => {
                        postMessage({ id: "validate.reject", reason: reason });
                    }
                );
                break;
            }
            case "getExternalResource.resolve": {
                pendingExternalResources[data.index].resolve(data.value);
                break;
            }
            case "getExternalResource.reject": {
                pendingExternalResources[data.index].reject(data.reason);
                break;
            }
        }
    };
}

/**
 * Configuration for glTF validation
 */
export interface IGLTFValidationConfiguration {
    /**
     * The url of the glTF validator.
     */
    url: string;
}

/**
 * glTF validation
 */
export class GLTFValidation {
    /**
     * The configuration. Defaults to `{ url: "https://cdn.babylonjs.com/gltf_validator.js" }`.
     */
    public static Configuration: IGLTFValidationConfiguration = {
        url: `${Tools._DefaultCdnUrl}/gltf_validator.js`,
    };

    private static _LoadScriptPromise: Promise<void>;

    /**
     * The most recent validation results.
     * @internal - Used for back-compat in Sandbox with Inspector V2.
     */
    public static _LastResults: Nullable<GLTF2.IGLTFValidationResults> = null;

    /**
     * Validate a glTF asset using the glTF-Validator.
     * @param data The JSON of a glTF or the array buffer of a binary glTF
     * @param rootUrl The root url for the glTF
     * @param fileName The file name for the glTF
     * @param getExternalResource The callback to get external resources for the glTF validator
     * @returns A promise that resolves with the glTF validation results once complete
     */
    public static ValidateAsync(
        data: string | Uint8Array,
        rootUrl: string,
        fileName: string,
        getExternalResource: (uri: string) => Promise<Uint8Array>
    ): Promise<GLTF2.IGLTFValidationResults> {
        if (typeof Worker === "function") {
            return new Promise((resolve, reject) => {
                const workerContent = `${ValidateAsync}(${WorkerFunc})()`;
                const workerBlobUrl = URL.createObjectURL(new Blob([workerContent], { type: "application/javascript" }));
                const worker = new Worker(workerBlobUrl);

                const onError = (error: ErrorEvent) => {
                    worker.removeEventListener("error", onError);
                    worker.removeEventListener("message", onMessage);
                    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                    reject(error);
                };

                const onMessage = (message: MessageEvent) => {
                    const data = message.data;
                    switch (data.id) {
                        case "getExternalResource": {
                            getExternalResource(data.uri).then(
                                (value) => {
                                    worker.postMessage({ id: "getExternalResource.resolve", index: data.index, value: value }, [value.buffer]);
                                },
                                (reason) => {
                                    worker.postMessage({ id: "getExternalResource.reject", index: data.index, reason: reason });
                                }
                            );
                            break;
                        }
                        case "validate.resolve": {
                            worker.removeEventListener("error", onError);
                            worker.removeEventListener("message", onMessage);
                            GLTFValidation._LastResults = data.value;
                            resolve(data.value);
                            worker.terminate();
                            break;
                        }
                        case "validate.reject": {
                            worker.removeEventListener("error", onError);
                            worker.removeEventListener("message", onMessage);
                            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                            reject(data.reason);
                            worker.terminate();
                        }
                    }
                };

                worker.addEventListener("error", onError);
                worker.addEventListener("message", onMessage);

                worker.postMessage({ id: "init", url: Tools.GetBabylonScriptURL(this.Configuration.url) });

                if (ArrayBuffer.isView(data)) {
                    // Slice the data to avoid copying the whole array buffer.
                    const slicedData = data.slice();
                    worker.postMessage({ id: "validate", data: slicedData, rootUrl: rootUrl, fileName: fileName }, [slicedData.buffer]);
                } else {
                    worker.postMessage({ id: "validate", data: data, rootUrl: rootUrl, fileName: fileName });
                }
            });
        } else {
            if (!this._LoadScriptPromise) {
                this._LoadScriptPromise = Tools.LoadBabylonScriptAsync(this.Configuration.url);
            }

            return this._LoadScriptPromise.then(() => {
                return ValidateAsync(data, rootUrl, fileName, getExternalResource);
            });
        }
    }
}
