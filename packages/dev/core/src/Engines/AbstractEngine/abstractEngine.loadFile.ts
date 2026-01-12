import { AbstractEngine } from "../../Engines/abstractEngine";
import type { IOfflineProvider } from "../../Offline/IOfflineProvider";

declare module "../abstractEngine" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /**
         * @internal
         */
        _loadFileAsync(url: string, offlineProvider?: IOfflineProvider, useArrayBuffer?: false): Promise<string>;
        _loadFileAsync(url: string, offlineProvider?: IOfflineProvider, useArrayBuffer?: true): Promise<ArrayBuffer>;
        _loadFileAsync(url: string, offlineProvider?: IOfflineProvider, useArrayBuffer?: boolean): Promise<string | ArrayBuffer>;
    }
}

AbstractEngine.prototype._loadFileAsync = async function (url: string, offlineProvider?: IOfflineProvider, useArrayBuffer?: boolean): Promise<any> {
    return await new Promise<string | ArrayBuffer>((resolve, reject) => {
        this._loadFile(
            url,
            (data) => {
                resolve(data);
            },
            undefined,
            offlineProvider,
            useArrayBuffer,
            (request, exception) => {
                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                reject(exception);
            }
        );
    });
};
