/* eslint-disable @typescript-eslint/naming-convention */

import { Nullable } from "core/types";
import { RegisterExtension } from "../BaseLoader";
import { GLEFLoader } from "../glEFLoader";
import { IGLEFLoaderExtension, IInteractivity } from "../glEFLoaderExtension";

const NAME = "KHR_interactivity_behavior";

/*
List of TODOs:

1) count on assets should be taken into account
2) What is the default mode for behavior? - "ignore"
3) What is "`animation`", where is it defined?
*/

/**
 * [Specification](NOT_YET_AVAILABLE)
 */
export class KHR_Interactivity implements IGLEFLoaderExtension {
    /**
     * The name of this extension.
     */
    public readonly name = NAME;

    /**
     * Defines whether this extension is enabled.
     */
    public enabled: boolean;

    private _loader: GLEFLoader;

    /**
     * @param loader
     * @hidden
     */
    constructor(loader: GLEFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }

    /** @hidden */
    public dispose() {
        (this._loader as any) = null;
    }

    /** @hidden */
    public onLoading(): void {
        // const extensions = this._loader.json.extensions;
        // if (extensions && extensions[this.name]) {
        // ...
        // }
    }

    public loadInteractivityAsync(context: string, interactivity: IInteractivity): Nullable<Promise<void>> {
        // analyze the behaviors array and process everything there. The rest are all passive until needed.
        const behaviors = interactivity.behaviors;
        if(!behaviors) {
            return null;
        }

        return null;
    }

    
}

RegisterExtension(NAME, "glef", (loader) => new KHR_Interactivity(loader as GLEFLoader));
