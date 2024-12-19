/* eslint-disable @typescript-eslint/naming-convention */
/**
 * This file is only for internal use only and should not be used in your code
 */

import { IsWindowObjectExist } from "core/Misc/domManagement";
import { Tools } from "core/Misc/tools";

let _UniqueResolveID = 13372024;

/**
 * Load an asynchronous script (identified by an url) in a module way. When the url returns, the
 * content of this file is added into a new script element, attached to the DOM (body element)
 * @param scriptUrl defines the url of the script to load
 * @param scriptId defines the id of the script element
 * @returns a promise request object
 * It is up to the caller to provide a script that will do the import and prepare a "returnedValue" variable
 * @internal DO NOT USE outside of Babylon.js core
 */
export function _LoadScriptModuleAsync(scriptUrl: string, scriptId?: string): Promise<any> {
    return new Promise((resolve, reject) => {
        // Need a relay
        let windowAsAny: any;
        let windowString: string;

        if (IsWindowObjectExist()) {
            windowAsAny = window;
            windowString = "window";
        } else if (typeof self !== "undefined") {
            windowAsAny = self;
            windowString = "self";
        } else {
            reject(new Error("Cannot load script module outside of a window or a worker"));
            return;
        }

        if (!windowAsAny._LoadScriptModuleResolve) {
            windowAsAny._LoadScriptModuleResolve = {};
        }
        windowAsAny._LoadScriptModuleResolve[_UniqueResolveID] = resolve;

        scriptUrl += `
            ${windowString}._LoadScriptModuleResolve[${_UniqueResolveID}](returnedValue);
            ${windowString}._LoadScriptModuleResolve[${_UniqueResolveID}] = undefined;
        `;
        _UniqueResolveID++;

        Tools.LoadScript(
            scriptUrl,
            undefined,
            (message, exception) => {
                reject(exception || new Error(message));
            },
            scriptId,
            true
        );
    });
}
