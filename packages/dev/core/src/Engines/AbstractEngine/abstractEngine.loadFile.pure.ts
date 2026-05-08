/** This file must only contain pure code and pure imports */

import { IOfflineProvider } from "../../Offline/IOfflineProvider";
import { AbstractEngine } from "../../Engines/abstractEngine.pure";

let _Registered = false;
/**
 * Register side effects for abstractEngineLoadFile.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterAbstractEngineLoadFile(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

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
}
