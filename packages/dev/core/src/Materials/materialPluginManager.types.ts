import { type MaterialPluginManager } from "./materialPluginManager.pure";
declare module "./material.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Material {
        /**
         * Plugin manager for this material
         */
        pluginManager?: MaterialPluginManager;
    }
}
